import { db } from "./db";
import { radioStations, botStatus } from "@shared/schema";

async function initializeDatabase() {
  try {
    console.log("Initializing database with default data...");

    // Check if stations already exist
    const existingStations = await db.select().from(radioStations);
    if (existingStations.length === 0) {
      // Insert default radio stations
      const defaultStations = [
        {
          name: "Chill Lofi Radio",
          url: "https://streams.ilovemusic.de/iloveradio17.mp3",
          genre: "Lofi Hip Hop",
          quality: "192kbps",
          artwork: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=120&h=120&fit=crop",
          isFavorite: true,
          isActive: true
        },
        {
          name: "Electronic Vibes",
          url: "https://streams.ilovemusic.de/iloveradio2.mp3",
          genre: "Electronic",
          quality: "320kbps",
          artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: false
        },
        {
          name: "Smooth Jazz FM",
          url: "https://streams.ilovemusic.de/iloveradio6.mp3",
          genre: "Jazz",
          quality: "256kbps",
          artwork: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=120&h=120&fit=crop",
          isFavorite: true,
          isActive: false
        },
        {
          name: "Classic Rock Radio",
          url: "https://streams.ilovemusic.de/iloveradio8.mp3",
          genre: "Rock",
          quality: "320kbps",
          artwork: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: false
        },
        {
          name: "Pop Hits 24/7",
          url: "https://streams.ilovemusic.de/iloveradio1.mp3",
          genre: "Pop",
          quality: "256kbps",
          artwork: "https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: false
        },
        {
          name: "Classical FM",
          url: "https://streams.ilovemusic.de/iloveradio14.mp3",
          genre: "Classical",
          quality: "320kbps",
          artwork: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: false
        }
      ];

      await db.insert(radioStations).values(defaultStations);
      console.log(`Inserted ${defaultStations.length} default radio stations`);
    }

    // Check if bot status exists
    const existingStatus = await db.select().from(botStatus).limit(1);
    if (existingStatus.length === 0) {
      await db.insert(botStatus).values({
        isOnline: true,
        uptime: 1062180,
        memoryUsage: 45,
        currentStationId: 1,
        volume: 75,
        isPlaying: true,
        currentListeners: 127,
        lastUpdated: new Date()
      });
      console.log("Initialized default bot status");
    }

    console.log("Database initialization completed successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

export { initializeDatabase };