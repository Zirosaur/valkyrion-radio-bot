import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { storage } from './storage';
import type { User } from '@shared/schema';

// Discord OAuth2 configuration
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
const CALLBACK_URL = process.env.REPLIT_DOMAINS ? 
  `https://${process.env.REPLIT_DOMAINS.split(',')[0]}/auth/discord/callback` : 
  'http://localhost:5000/auth/discord/callback';

console.log('Discord OAuth2 configuration:');
console.log('- Client ID available:', !!DISCORD_CLIENT_ID);
console.log('- Client Secret available:', !!DISCORD_CLIENT_SECRET);
console.log('- Callback URL:', CALLBACK_URL);

// Configure passport session serialization
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Configure Discord OAuth2 strategy
if (DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET) {
  passport.use(new DiscordStrategy({
    clientID: DISCORD_CLIENT_ID,
    clientSecret: DISCORD_CLIENT_SECRET,
    callbackURL: CALLBACK_URL,
    scope: ['identify', 'guilds']
  }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      // Check if user already exists by Discord ID
      const existingUsers = await storage.getAllUsers();
      let user = existingUsers.find(u => u.discordId === profile.id);

      if (user) {
        // Update existing user's tokens and info
        const updatedUser = await storage.updateUser(user.id, {
          discordUsername: profile.username,
          discordAvatar: profile.avatar,
          accessToken,
          refreshToken
        });
        return done(null, updatedUser);
      } else {
        // Create new user
        const newUser = await storage.createUser({
          username: profile.username,
          discordId: profile.id,
          discordUsername: profile.username,
          discordAvatar: profile.avatar,
          accessToken,
          refreshToken
        });
        return done(null, newUser);
      }
    } catch (error) {
      console.error('Discord authentication error:', error);
      return done(error, null);
    }
  }));
} else {
  console.log('Discord OAuth2 credentials not configured - authentication disabled');
}

// Helper function to check if user has access to a Discord server
export async function getUserServerAccess(userId: number): Promise<string[]> {
  try {
    const user = await storage.getUser(userId);
    if (!user || !user.accessToken) {
      return [];
    }

    // Fetch user's Discord guilds using their access token
    const response = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: {
        'Authorization': `Bearer ${user.accessToken}`,
        'User-Agent': 'Valkyrion-Bot/1.0'
      }
    });

    if (response.ok) {
      const guilds = await response.json();
      return guilds.map((guild: any) => guild.id);
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching user server access:', error);
    return [];
  }
}

// Middleware to require authentication
export function requireAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
}

// Middleware to require server access
export function requireServerAccess(serverId: string) {
  return async (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userServers = await getUserServerAccess(req.user.id);
    if (userServers.includes(serverId)) {
      return next();
    }

    res.status(403).json({ error: 'Access denied to this server' });
  };
}

export default passport;