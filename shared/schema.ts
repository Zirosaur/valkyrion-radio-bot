import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"),
  discordId: text("discord_id").unique(),
  discordUsername: text("discord_username"),
  discordAvatar: text("discord_avatar"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
});

export const radioStations = pgTable("radio_stations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  genre: text("genre").notNull(),
  quality: text("quality").notNull().default("128kbps"),
  artwork: text("artwork"),
  isFavorite: boolean("is_favorite").notNull().default(false),
  isActive: boolean("is_active").notNull().default(false),
  listeners: integer("listeners").notNull().default(0),
});

export const discordServers = pgTable("discord_servers", {
  id: text("id").primaryKey(), // Discord server ID
  name: text("name").notNull(),
  memberCount: integer("member_count").notNull().default(0),
  isConnected: boolean("is_connected").notNull().default(false),
  voiceChannelId: text("voice_channel_id"),
  lastStationId: integer("last_station_id").references(() => radioStations.id),
  lastPlaying: boolean("last_playing").notNull().default(false),
});

export const botStatus = pgTable("bot_status", {
  id: serial("id").primaryKey(),
  isOnline: boolean("is_online").notNull().default(false),
  uptime: integer("uptime").notNull().default(0), // in seconds
  memoryUsage: integer("memory_usage").notNull().default(0), // percentage
  currentStationId: integer("current_station_id").references(() => radioStations.id),
  volume: integer("volume").notNull().default(75),
  isPlaying: boolean("is_playing").notNull().default(false),
  currentListeners: integer("current_listeners").notNull().default(0),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const userServerAccess = pgTable("user_server_access", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  serverId: text("server_id").references(() => discordServers.id).notNull(),
  role: text("role").notNull().default("member"), // "admin", "moderator", "member"
  permissions: text("permissions").array().default([]), // array of permission strings
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertRadioStationSchema = createInsertSchema(radioStations).omit({
  id: true,
  listeners: true,
});

export const insertDiscordServerSchema = createInsertSchema(discordServers).omit({
  memberCount: true,
  isConnected: true,
});

export const insertBotStatusSchema = createInsertSchema(botStatus).omit({
  id: true,
  uptime: true,
  lastUpdated: true,
});

export const insertUserServerAccessSchema = createInsertSchema(userServerAccess).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertRadioStation = z.infer<typeof insertRadioStationSchema>;
export type RadioStation = typeof radioStations.$inferSelect;

export type InsertDiscordServer = z.infer<typeof insertDiscordServerSchema>;
export type DiscordServer = typeof discordServers.$inferSelect;

export type InsertBotStatus = z.infer<typeof insertBotStatusSchema>;
export type BotStatus = typeof botStatus.$inferSelect;

export type InsertUserServerAccess = z.infer<typeof insertUserServerAccessSchema>;
export type UserServerAccess = typeof userServerAccess.$inferSelect;
