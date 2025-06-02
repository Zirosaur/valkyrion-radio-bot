import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import session from 'express-session';
import { storage } from "./storage";
import { insertRadioStationSchema, insertDiscordServerSchema } from "@shared/schema";
import { DiscordBot } from "./discord-bot";

let discordBot: DiscordBot | null = null;
const connectedClients = new Set<WebSocket>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Configure session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'valkyrion-radio-secret-key',
    resave: false,
    saveUninitialized: false,
    rolling: true, // Refresh session on each request
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax' // Allow cross-site requests for OAuth
    }
  }));

  // Import and configure authentication after environment variables are loaded
  let passport: any, requireAuth: any, getUserServerAccess: any;
  try {
    const authModule = await import('./auth');
    passport = authModule.default;
    requireAuth = authModule.requireAuth;
    getUserServerAccess = authModule.getUserServerAccess;
    
    // Initialize passport
    app.use(passport.initialize());
    app.use(passport.session());
    console.log('Discord authentication system initialized successfully');
  } catch (error) {
    console.error('Failed to initialize authentication:', error);
  }

  // Initialize Discord bot
  const discordToken = process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN;
  console.log('Discord token available:', !!discordToken);
  if (discordToken) {
    try {
      discordBot = new DiscordBot(discordToken);
      await discordBot.initialize();
    
      // Set up bot event handlers for real-time updates
      discordBot.on('statusUpdate', (status) => {
        broadcastToClients('botStatusUpdate', status);
      });
      
      discordBot.on('serverUpdate', (server) => {
        broadcastToClients('serverUpdate', server);
      });
    } catch (error) {
      console.error('Failed to initialize Discord bot during startup:', error);
      // Don't throw error, just log it so server can still start
    }
  } else {
    console.warn('No Discord token provided. Bot functionality will be limited.');
  }

  // WebSocket server setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    connectedClients.add(ws);
    
    ws.on('close', () => {
      connectedClients.delete(ws);
    });
    
    // Send initial data
    sendInitialData(ws);
  });

  function broadcastToClients(type: string, data: any) {
    const message = JSON.stringify({ type, data });
    connectedClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  async function sendInitialData(ws: WebSocket) {
    try {
      const [stations, servers, botStatus] = await Promise.all([
        storage.getAllStations(),
        getUpdatedServersData(),
        storage.getBotStatus()
      ]);
      
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'initialData',
          data: { stations, servers, botStatus }
        }));
      }
    } catch (error) {
      console.error('Error sending initial data:', error);
    }
  }

  async function getUpdatedServersData() {
    try {
      const dbServers = await storage.getAllServers();
      
      if (!discordBot || !discordBot.isOnline()) {
        return dbServers;
      }

      // Update with real-time Discord data
      const updatedServers = await Promise.all(
        dbServers.map(async (server) => {
          const guild = discordBot.getGuildById(server.id);
          if (guild) {
            // Update database with current member count
            await storage.updateServer(server.id, {
              memberCount: guild.memberCount,
              isConnected: true
            });
            
            return {
              ...server,
              memberCount: guild.memberCount,
              isConnected: true
            };
          }
          return server;
        })
      );

      return updatedServers;
    } catch (error) {
      console.error('Error updating servers data:', error);
      return await storage.getAllServers();
    }
  }

  // Authentication endpoints - only register if passport is available
  if (passport) {
    app.get('/auth/discord', passport.authenticate('discord'));

    app.get('/auth/discord/callback', 
      passport.authenticate('discord', { failureRedirect: '/' }),
      (req, res) => {
        // Successful authentication, redirect to dashboard
        res.redirect('/dashboard');
      }
    );

    app.post('/auth/logout', (req, res) => {
      req.logout((err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to logout' });
        }
        res.json({ success: true });
      });
    });

    app.get('/api/auth/user', (req, res) => {
      if (req.isAuthenticated()) {
        res.json({ user: req.user });
      } else {
        res.json({ user: null });
      }
    });

    if (requireAuth && getUserServerAccess) {
      app.get('/api/auth/servers', requireAuth, async (req, res) => {
        try {
          const userServers = await getUserServerAccess((req.user as any).id);
          const allServers = await storage.getAllServers();
      
          // Filter servers that user has access to
          const accessibleServers = allServers.filter(server => 
            userServers.includes(server.id)
          );
      
          res.json(accessibleServers);
        } catch (error) {
          console.error('Error fetching user servers:', error);
          res.status(500).json({ error: 'Failed to fetch servers' });
        }
      });

      // Get user role in specific server
      app.get('/api/auth/server/:serverId/role', requireAuth, async (req, res) => {
        try {
          const { serverId } = req.params;
          const user = req.user as any;
          
          if (!discordBot || !discordBot.isOnline()) {
            return res.json({ role: 'member' });
          }

          // Get guild from Discord client using public method
          const guild = discordBot.getGuildById(serverId);
          if (!guild) {
            return res.json({ role: 'member' });
          }

          // Check user's highest role in the server
          const member = await guild.members.fetch(user.discordId).catch(() => null);
          if (!member) {
            return res.json({ role: 'member' });
          }

          // Determine role based on permissions
          let role = 'member';
          if (guild.ownerId === user.discordId) {
            role = 'owner';
          } else if (member.permissions.has('Administrator')) {
            role = 'administrator';
          } else if (member.permissions.has('ManageGuild') || member.permissions.has('ManageChannels')) {
            role = 'moderator';
          }

          res.json({ role, serverId });
        } catch (error) {
          console.error('Error fetching user role:', error);
          res.json({ role: 'member' });
        }
      });
    }
  }

  // Server-specific status endpoint
  app.get('/api/servers/:serverId/status', async (req, res) => {
    try {
      const { serverId } = req.params;
      
      if (!discordBot || !discordBot.isOnline()) {
        return res.json({ 
          isPlaying: false, 
          currentStation: null, 
          volume: 0,
          listeners: 0 
        });
      }

      const currentStation = discordBot.getCurrentStationForServer(serverId);
      const isPlaying = discordBot.isServerPlaying(serverId);
      
      res.json({
        serverId,
        isPlaying,
        currentStation,
        volume: 50, // Default volume
        listeners: currentStation?.listeners || 0
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get server status' });
    }
  });

  // Server-specific control endpoints
  app.post('/api/servers/:serverId/play', async (req, res) => {
    try {
      const { serverId } = req.params;
      const { stationId } = req.body;
      
      if (!discordBot) {
        return res.status(400).json({ message: 'Discord bot not initialized' });
      }

      if (stationId) {
        const station = await storage.getStation(stationId);
        if (station) {
          await discordBot.playStationForServer(serverId, station);
        }
      }
      
      res.json({ message: 'Playback started' });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to start playback' });
    }
  });

  // Bot control endpoints
  app.post('/api/bot/start', async (req, res) => {
    try {
      if (!discordBot) {
        return res.status(400).json({ message: 'Discord bot not initialized' });
      }
      
      await discordBot.start();
      const status = await storage.updateBotStatus({ isOnline: true });
      broadcastToClients('botStatusUpdate', status);
      
      res.json({ message: 'Bot started successfully' });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to start bot' });
    }
  });

  app.post('/api/bot/stop', async (req, res) => {
    try {
      if (!discordBot) {
        return res.status(400).json({ message: 'Discord bot not initialized' });
      }
      
      await discordBot.stop();
      const status = await storage.updateBotStatus({ isOnline: false, isPlaying: false });
      broadcastToClients('botStatusUpdate', status);
      
      res.json({ message: 'Bot stopped successfully' });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to stop bot' });
    }
  });

  app.post('/api/bot/restart', async (req, res) => {
    try {
      if (!discordBot) {
        return res.status(400).json({ message: 'Discord bot not initialized' });
      }
      
      await discordBot.restart();
      const status = await storage.updateBotStatus({ isOnline: true });
      broadcastToClients('botStatusUpdate', status);
      
      res.json({ message: 'Bot restarted successfully' });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to restart bot' });
    }
  });

  // Playback control endpoints
  app.post('/api/bot/play', async (req, res) => {
    try {
      if (!discordBot) {
        return res.status(400).json({ message: 'Discord bot not initialized' });
      }
      
      await discordBot.play();
      const status = await storage.updateBotStatus({ isPlaying: true });
      broadcastToClients('botStatusUpdate', status);
      
      res.json({ message: 'Playback started' });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to start playback' });
    }
  });

  app.post('/api/bot/pause', async (req, res) => {
    try {
      if (!discordBot) {
        return res.status(400).json({ message: 'Discord bot not initialized' });
      }
      
      await discordBot.pause();
      const status = await storage.updateBotStatus({ isPlaying: false });
      broadcastToClients('botStatusUpdate', status);
      
      res.json({ message: 'Playback paused' });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to pause playback' });
    }
  });

  app.post('/api/bot/volume', async (req, res) => {
    try {
      const { volume } = req.body;
      if (typeof volume !== 'number' || volume < 0 || volume > 100) {
        return res.status(400).json({ message: 'Volume must be a number between 0 and 100' });
      }
      
      if (!discordBot) {
        return res.status(400).json({ message: 'Discord bot not initialized' });
      }
      
      await discordBot.setVolume(volume / 100);
      const status = await storage.updateBotStatus({ volume });
      broadcastToClients('botStatusUpdate', status);
      
      res.json({ message: 'Volume updated', volume });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to update volume' });
    }
  });

  // Station endpoints
  app.get('/api/stations', async (req, res) => {
    try {
      const stations = await storage.getAllStations();
      res.json(stations);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch stations' });
    }
  });

  app.get('/api/stations/favorites', async (req, res) => {
    try {
      const stations = await storage.getFavoriteStations();
      res.json(stations);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch favorite stations' });
    }
  });

  app.post('/api/stations', async (req, res) => {
    try {
      const validatedData = insertRadioStationSchema.parse(req.body);
      const station = await storage.createStation(validatedData);
      broadcastToClients('stationAdded', station);
      res.status(201).json(station);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Invalid station data' });
    }
  });

  app.put('/api/stations/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const station = await storage.updateStation(id, updates);
      
      if (!station) {
        return res.status(404).json({ message: 'Station not found' });
      }
      
      broadcastToClients('stationUpdated', station);
      res.json(station);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to update station' });
    }
  });

  app.post('/api/stations/:id/select', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const station = await storage.getStation(id);
      
      if (!station) {
        return res.status(404).json({ message: 'Station not found' });
      }
      
      if (!discordBot) {
        return res.status(400).json({ message: 'Discord bot not initialized' });
      }
      
      await discordBot.playStation(station);
      const status = await storage.updateBotStatus({ 
        currentStationId: id, 
        isPlaying: true 
      });
      broadcastToClients('botStatusUpdate', status);
      broadcastToClients('stationSelected', station);
      
      res.json({ message: 'Station selected', station });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to select station' });
    }
  });

  app.post('/api/stations/:id/favorite', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isFavorite } = req.body;
      
      const success = await storage.setStationFavorite(id, isFavorite);
      if (!success) {
        return res.status(404).json({ message: 'Station not found' });
      }
      
      const station = await storage.getStation(id);
      broadcastToClients('stationUpdated', station);
      
      res.json({ message: 'Favorite status updated' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update favorite status' });
    }
  });

  app.delete('/api/stations/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteStation(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Station not found' });
      }
      
      broadcastToClients('stationDeleted', { id });
      res.json({ message: 'Station deleted' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete station' });
    }
  });

  // Server endpoints
  app.get('/api/servers', async (req, res) => {
    try {
      const servers = await storage.getAllServers();
      res.json(servers);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch servers' });
    }
  });

  // Bot status endpoint
  app.get('/api/bot/status', async (req, res) => {
    try {
      const status = await storage.getBotStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch bot status' });
    }
  });

  // Periodic status updates
  setInterval(async () => {
    try {
      const status = await storage.getBotStatus();
      if (status) {
        // Simulate listener count fluctuation
        const newListeners = status.currentListeners + Math.floor(Math.random() * 10) - 5;
        const updatedStatus = await storage.updateBotStatus({
          currentListeners: Math.max(newListeners, 1)
        });
        broadcastToClients('botStatusUpdate', updatedStatus);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }, 30000); // Update every 30 seconds

  // Get bot info including avatar
  app.get('/api/bot/info', async (req, res) => {
    try {
      if (discordBot?.isOnline()) {
        const botInfo = discordBot.getBotInfo();
        res.json(botInfo);
      } else {
        res.json({ isOnline: false });
      }
    } catch (error) {
      console.error('Error getting bot info:', error);
      res.status(500).json({ error: 'Failed to get bot info' });
    }
  });

  return httpServer;
}
