import { 
  users, radioStations, discordServers, botStatus,
  type User, type InsertUser,
  type RadioStation, type InsertRadioStation,
  type DiscordServer, type InsertDiscordServer,
  type BotStatus, type InsertBotStatus
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByDiscordId(discordId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // Radio station methods
  getAllStations(): Promise<RadioStation[]>;
  getStation(id: number): Promise<RadioStation | undefined>;
  createStation(station: InsertRadioStation): Promise<RadioStation>;
  updateStation(id: number, updates: Partial<InsertRadioStation>): Promise<RadioStation | undefined>;
  deleteStation(id: number): Promise<boolean>;
  getFavoriteStations(): Promise<RadioStation[]>;
  setStationFavorite(id: number, isFavorite: boolean): Promise<boolean>;

  // Discord server methods
  getAllServers(): Promise<DiscordServer[]>;
  getServer(id: string): Promise<DiscordServer | undefined>;
  createServer(server: InsertDiscordServer): Promise<DiscordServer>;
  updateServer(id: string, updates: Partial<DiscordServer>): Promise<DiscordServer | undefined>;
  deleteServer(id: string): Promise<boolean>;

  // Bot status methods
  getBotStatus(): Promise<BotStatus | undefined>;
  updateBotStatus(updates: Partial<BotStatus>): Promise<BotStatus>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUserByDiscordId(discordId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.discordId, discordId));
    return user || undefined;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getAllStations(): Promise<RadioStation[]> {
    return await db.select().from(radioStations);
  }

  async getStation(id: number): Promise<RadioStation | undefined> {
    const [station] = await db.select().from(radioStations).where(eq(radioStations.id, id));
    return station || undefined;
  }

  async createStation(station: InsertRadioStation): Promise<RadioStation> {
    const [newStation] = await db
      .insert(radioStations)
      .values({
        ...station,
        quality: station.quality || "128kbps",
        artwork: station.artwork || null,
        isFavorite: station.isFavorite || false,
        isActive: station.isActive || false
      })
      .returning();
    return newStation;
  }

  async updateStation(id: number, updates: Partial<InsertRadioStation>): Promise<RadioStation | undefined> {
    const [station] = await db
      .update(radioStations)
      .set(updates)
      .where(eq(radioStations.id, id))
      .returning();
    return station || undefined;
  }

  async deleteStation(id: number): Promise<boolean> {
    const result = await db.delete(radioStations).where(eq(radioStations.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getFavoriteStations(): Promise<RadioStation[]> {
    return await db.select().from(radioStations).where(eq(radioStations.isFavorite, true));
  }

  async setStationFavorite(id: number, isFavorite: boolean): Promise<boolean> {
    const result = await db
      .update(radioStations)
      .set({ isFavorite })
      .where(eq(radioStations.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getAllServers(): Promise<DiscordServer[]> {
    return await db.select().from(discordServers);
  }

  async getServer(id: string): Promise<DiscordServer | undefined> {
    const [server] = await db.select().from(discordServers).where(eq(discordServers.id, id));
    return server || undefined;
  }

  async createServer(server: InsertDiscordServer): Promise<DiscordServer> {
    const [newServer] = await db
      .insert(discordServers)
      .values({
        ...server,
        memberCount: 0,
        isConnected: false,
        voiceChannelId: null,
        lastStationId: null,
        lastPlaying: false
      })
      .returning();
    return newServer;
  }

  async updateServer(id: string, updates: Partial<DiscordServer>): Promise<DiscordServer | undefined> {
    const [server] = await db
      .update(discordServers)
      .set(updates)
      .where(eq(discordServers.id, id))
      .returning();
    return server || undefined;
  }

  async deleteServer(id: string): Promise<boolean> {
    const result = await db.delete(discordServers).where(eq(discordServers.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getBotStatus(): Promise<BotStatus | undefined> {
    const [status] = await db.select().from(botStatus).limit(1);
    return status || undefined;
  }

  async updateBotStatus(updates: Partial<BotStatus>): Promise<BotStatus> {
    // First try to get existing status
    const existing = await this.getBotStatus();
    
    if (existing) {
      const [updated] = await db
        .update(botStatus)
        .set({ ...updates, lastUpdated: new Date() })
        .where(eq(botStatus.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create initial status if none exists
      const [created] = await db
        .insert(botStatus)
        .values({
          isOnline: false,
          uptime: 0,
          memoryUsage: 0,
          currentStationId: null,
          volume: 75,
          isPlaying: false,
          currentListeners: 0,
          ...updates,
          lastUpdated: new Date()
        })
        .returning();
      return created;
    }
  }
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private stations: Map<number, RadioStation>;
  private servers: Map<string, DiscordServer>;
  private botStatusData: BotStatus | undefined;
  private currentUserId: number;
  private currentStationId: number;

  constructor() {
    this.users = new Map();
    this.stations = new Map();
    this.servers = new Map();
    this.currentUserId = 1;
    this.currentStationId = 1;
    
    // Initialize with default stations
    this.initializeDefaultStations();
    this.initializeBotStatus();
  }

  private initializeDefaultStations() {
    const defaultStations: Omit<RadioStation, 'id'>[] = [
      {
        name: "Chill Lofi Radio",
        url: "https://streams.ilovemusic.de/iloveradio17.mp3",
        genre: "Lofi Hip Hop",
        quality: "192kbps",
        artwork: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=120&h=120&fit=crop",
        isFavorite: true,
        isActive: true,
        listeners: 127
      },
      {
        name: "Electronic Vibes",
        url: "https://streams.ilovemusic.de/iloveradio2.mp3",
        genre: "Electronic",
        quality: "320kbps",
        artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=120&fit=crop",
        isFavorite: false,
        isActive: false,
        listeners: 89
      },
      {
        name: "Smooth Jazz FM",
        url: "https://streams.ilovemusic.de/iloveradio6.mp3",
        genre: "Jazz",
        quality: "256kbps",
        artwork: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=120&h=120&fit=crop",
        isFavorite: true,
        isActive: false,
        listeners: 156
      },
      {
        name: "Classic Rock Radio",
        url: "https://streams.ilovemusic.de/iloveradio8.mp3",
        genre: "Rock",
        quality: "320kbps",
        artwork: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=120&h=120&fit=crop",
        isFavorite: false,
        isActive: false,
        listeners: 203
      },
      {
        name: "Pop Hits 24/7",
        url: "https://streams.ilovemusic.de/iloveradio1.mp3",
        genre: "Pop",
        quality: "256kbps",
        artwork: "https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=120&h=120&fit=crop",
        isFavorite: false,
        isActive: false,
        listeners: 341
      },
      {
        name: "Classical FM",
        url: "https://streams.ilovemusic.de/iloveradio14.mp3",
        genre: "Classical",
        quality: "320kbps",
        artwork: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=120&h=120&fit=crop",
        isFavorite: false,
        isActive: false,
        listeners: 78
      },
      {
        name: "J1HITS",
        url: "https://jenny.torontocast.com:8056/;stream.",
        genre: "Pop Hits",
        quality: "192kbps",
        artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=120&fit=crop",
        isFavorite: true,
        isActive: true,
        listeners: 245
      },
      {
        name: "J1HD",
        url: "https://maggie.torontocast.com:2000/stream/J1HD?_=696726",
        genre: "Top 40",
        quality: "320kbps",
        artwork: "https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=120&h=120&fit=crop",
        isFavorite: true,
        isActive: true,
        listeners: 189
      },
      {
        name: "BIG B RADIO #KPOP",
        url: "https://antares.dribbcast.com/proxy/kpop?mp=/s",
        genre: "K-Pop",
        quality: "256kbps",
        artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=120&fit=crop",
        isFavorite: true,
        isActive: true,
        listeners: 567
      },
      {
        name: "BIG B RADIO #JPOP",
        url: "https://antares.dribbcast.com/proxy/jpop?mp=/s",
        genre: "J-Pop",
        quality: "256kbps",
        artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=120&fit=crop",
        isFavorite: true,
        isActive: true,
        listeners: 423
      },
      {
        name: "BIG B RADIO #CPOP",
        url: "https://antares.dribbcast.com/proxy/cpop?mp=/s",
        genre: "C-Pop",
        quality: "256kbps",
        artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=120&fit=crop",
        isFavorite: false,
        isActive: true,
        listeners: 234
      },
      {
        name: "BIG B RADIO #APOP",
        url: "https://antares.dribbcast.com/proxy/apop?mp=/s",
        genre: "Asian Pop",
        quality: "256kbps",
        artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=120&fit=crop",
        isFavorite: false,
        isActive: true,
        listeners: 345
      },
      {
        name: "Prambors FM",
        url: "https://www.pramborsfm.com/live",
        genre: "Indonesian Pop",
        quality: "128kbps",
        artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=120&fit=crop",
        isFavorite: true,
        isActive: true,
        listeners: 892
      },
      {
        name: "Hard Rock FM",
        url: "https://n0d.radiojar.com/7csmg90fuqruv?rj-ttl=5&rj-tok=AAABknEEOWgA57CrPbV-ZaXFdw",
        genre: "Hard Rock",
        quality: "192kbps",
        artwork: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=120&h=120&fit=crop",
        isFavorite: false,
        isActive: true,
        listeners: 456
      }
    ];

    defaultStations.forEach(station => {
      const id = this.currentStationId++;
      this.stations.set(id, { ...station, id });
    });
  }

  private initializeBotStatus() {
    this.botStatusData = {
      id: 1,
      isOnline: true,
      uptime: 1062180, // 12d 4h 23m in seconds
      memoryUsage: 45,
      currentStationId: 1,
      volume: 75,
      isPlaying: true,
      currentListeners: 127,
      lastUpdated: new Date()
    };
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      password: insertUser.password || null,
      discordId: insertUser.discordId || null,
      discordUsername: insertUser.discordUsername || null,
      discordAvatar: insertUser.discordAvatar || null,
      accessToken: insertUser.accessToken || null,
      refreshToken: insertUser.refreshToken || null
    };
    this.users.set(id, user);
    return user;
  }

  async getUserByDiscordId(discordId: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.discordId === discordId) {
        return user;
      }
    }
    return undefined;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      const updatedUser = { ...user, ...updates };
      this.users.set(id, updatedUser);
      return updatedUser;
    }
    return undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Radio station methods
  async getAllStations(): Promise<RadioStation[]> {
    return Array.from(this.stations.values());
  }

  async getStation(id: number): Promise<RadioStation | undefined> {
    return this.stations.get(id);
  }

  async createStation(station: InsertRadioStation): Promise<RadioStation> {
    const id = this.currentStationId++;
    const newStation: RadioStation = { 
      ...station, 
      id, 
      listeners: 0,
      quality: station.quality || "128kbps",
      artwork: station.artwork || null,
      isFavorite: station.isFavorite || false,
      isActive: station.isActive || false
    };
    this.stations.set(id, newStation);
    return newStation;
  }

  async updateStation(id: number, updates: Partial<InsertRadioStation>): Promise<RadioStation | undefined> {
    const station = this.stations.get(id);
    if (!station) return undefined;
    
    const updatedStation = { ...station, ...updates };
    this.stations.set(id, updatedStation);
    return updatedStation;
  }

  async deleteStation(id: number): Promise<boolean> {
    return this.stations.delete(id);
  }

  async getFavoriteStations(): Promise<RadioStation[]> {
    return Array.from(this.stations.values()).filter(station => station.isFavorite);
  }

  async setStationFavorite(id: number, isFavorite: boolean): Promise<boolean> {
    const station = this.stations.get(id);
    if (!station) return false;
    
    station.isFavorite = isFavorite;
    this.stations.set(id, station);
    return true;
  }

  // Discord server methods
  async getAllServers(): Promise<DiscordServer[]> {
    return Array.from(this.servers.values());
  }

  async getServer(id: string): Promise<DiscordServer | undefined> {
    return this.servers.get(id);
  }

  async createServer(server: InsertDiscordServer): Promise<DiscordServer> {
    const newServer: DiscordServer = { 
      id: server.id,
      name: server.name,
      memberCount: 0, 
      isConnected: false,
      voiceChannelId: null,
      lastStationId: null,
      lastPlaying: false
    };
    this.servers.set(server.id, newServer);
    return newServer;
  }

  async updateServer(id: string, updates: Partial<DiscordServer>): Promise<DiscordServer | undefined> {
    const server = this.servers.get(id);
    if (!server) return undefined;
    
    const updatedServer = { ...server, ...updates };
    this.servers.set(id, updatedServer);
    return updatedServer;
  }

  async deleteServer(id: string): Promise<boolean> {
    return this.servers.delete(id);
  }

  // Bot status methods
  async getBotStatus(): Promise<BotStatus | undefined> {
    if (this.botStatusData) {
      // Update uptime in real-time
      const now = new Date();
      const timeDiff = Math.floor((now.getTime() - this.botStatusData.lastUpdated.getTime()) / 1000);
      this.botStatusData.uptime += timeDiff;
      this.botStatusData.lastUpdated = now;
    }
    return this.botStatusData;
  }

  async updateBotStatus(updates: Partial<BotStatus>): Promise<BotStatus> {
    if (!this.botStatusData) {
      this.initializeBotStatus();
    }
    
    this.botStatusData = { 
      ...this.botStatusData!, 
      ...updates, 
      lastUpdated: new Date() 
    };
    return this.botStatusData;
  }
}

export const storage = new DatabaseStorage();
