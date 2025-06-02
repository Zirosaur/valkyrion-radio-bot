import { Client, GatewayIntentBits, VoiceChannel, ChannelType, SlashCommandBuilder, REST, Routes, ChatInputCommandInteraction, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, TextChannel } from 'discord.js';
import { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource, 
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  StreamType
} from '@discordjs/voice';
import { EventEmitter } from 'events';
import { storage } from './storage';
import type { RadioStation } from '@shared/schema';

interface ServerState {
  connection: any;
  player: any;
  currentStation: RadioStation | null;
  voiceChannelId: string;
  controlChannelId: string;
  guild: any;
  isPlaying: boolean;
  volume: number;
  lastActivity: Date;
  listeners: number;
  lastNowPlayingMessage: any | null;
}

export class DiscordBot extends EventEmitter {
  private client: Client;
  private isInitialized = false;
  private serverStates: Map<string, ServerState> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private lastHeartbeat = Date.now();

  constructor(private token: string) {
    super();
    
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages
      ]
    });

    this.setupEventHandlers();
    this.setupHeartbeat();
    this.setupHealthCheck();
  }



  private setupHeartbeat() {
    // Heartbeat setiap 30 detik untuk memastikan bot masih aktif
    this.heartbeatInterval = setInterval(() => {
      this.lastHeartbeat = Date.now();
      if (this.client.readyAt) {
        console.log(`💓 Heartbeat: Bot aktif - ${new Date().toLocaleTimeString('id-ID')}`);
      }
    }, 30000);
  }

  private setupHealthCheck() {
    // Health check setiap 2 menit
    this.healthCheckInterval = setInterval(async () => {
      try {
        const now = Date.now();
        const timeSinceLastHeartbeat = now - this.lastHeartbeat;
        
        // Jika heartbeat terakhir lebih dari 2 menit, restart bot
        if (timeSinceLastHeartbeat > 120000) {
          console.log('⚠️ Bot tidak responsif, memulai restart...');
          await this.restart();
          return;
        }

        // Periksa status koneksi Discord
        if (!this.client.readyAt) {
          console.log('⚠️ Bot tidak terhubung ke Discord, mencoba reconnect...');
          await this.reconnect();
          return;
        }

        // Periksa voice connections
        await this.checkVoiceConnections();
        
        console.log(`✅ Health check OK - Bot sehat dan berjalan normal`);
      } catch (error) {
        console.error('❌ Health check error:', error);
        await this.handleHealthCheckError();
      }
    }, 120000); // Setiap 2 menit
  }

  private async checkVoiceConnections() {
    for (const [guildId, state] of this.serverStates) {
      if (state.connection && state.connection.state.status === VoiceConnectionStatus.Disconnected) {
        console.log(`🔄 Voice connection terputus untuk guild ${guildId}, mencoba reconnect...`);
        await this.reconnectVoiceChannel(guildId);
      }
    }
  }

  private async reconnectVoiceChannel(guildId: string) {
    try {
      const state = this.serverStates.get(guildId);
      if (!state) return;

      const guild = this.client.guilds.cache.get(guildId);
      if (!guild) return;

      const voiceChannel = guild.channels.cache.get(state.voiceChannelId) as VoiceChannel;
      if (!voiceChannel) return;

      // Reconnect ke voice channel
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
      });

      state.connection = connection;
      
      // Resume streaming jika ada station aktif
      if (state.currentStation) {
        await this.playStationForServer(guildId, state.currentStation);
      }

      console.log(`✅ Voice connection restored untuk guild ${guild.name}`);
    } catch (error) {
      console.error(`❌ Error reconnecting voice untuk guild ${guildId}:`, error);
    }
  }

  private async reconnect() {
    try {
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts > this.maxReconnectAttempts) {
        console.log('❌ Max reconnect attempts reached, restarting bot...');
        await this.restart();
        return;
      }

      console.log(`🔄 Mencoba reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
      
      await this.client.destroy();
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      await this.start();
      
      this.reconnectAttempts = 0; // Reset counter on success
      console.log('✅ Reconnect berhasil');
    } catch (error) {
      console.error('❌ Reconnect error:', error);
      setTimeout(() => this.reconnect(), 10000); // Retry after 10 seconds
    }
  }

  private async handleHealthCheckError() {
    console.log('🔄 Handling health check error, attempting recovery...');
    await this.reconnect();
  }

  private async handleClientError(error: Error) {
    console.error('Handling client error:', error);
    if (error.message.includes('ECONNRESET') || error.message.includes('ENOTFOUND')) {
      console.log('Network error detected, attempting reconnect...');
      await this.reconnect();
    }
  }

  private setupEventHandlers() {
    this.client.on('ready', async () => {
      console.log(`🚀 Bot logged in as ${this.client.user?.tag}`);
      console.log(`📡 Bot is in ${this.client.guilds.cache.size} servers`);
      
      this.reconnectAttempts = 0;
      this.lastHeartbeat = Date.now();
      
      // Update bot presence with dashboard link
      await this.updateBotPresence();
      
      // Register slash commands
      await this.registerSlashCommands();
      
      // Auto-setup radio interface for all guilds
      await this.autoSetupAllGuilds();
      
      // Store guilds in database and log all guilds and their voice channels
      for (const guild of this.client.guilds.cache.values()) {
        try {
          // Save or update server in database
          const { storage } = await import('./storage');
          // Update or create server with current member count
          const existingServer = await storage.getServer(guild.id);
          if (existingServer) {
            await storage.updateServer(guild.id, {
              name: guild.name,
              memberCount: guild.memberCount,
              isConnected: true
            });
          } else {
            await storage.createServer({
              id: guild.id,
              name: guild.name,
              memberCount: guild.memberCount,
              isConnected: true,
              voiceChannelId: null
            });
          }
        } catch (error) {
          console.error(`Error saving guild ${guild.name}:`, error);
        }

        const voiceChannels = guild.channels.cache.filter(channel => channel.type === ChannelType.GuildVoice);
        console.log(`Guild: ${guild.name} - Voice channels: ${voiceChannels.size}`);
        voiceChannels.forEach(channel => {
          console.log(`  - ${channel.name} (${channel.members.size} members)`);
        });
      }
      
      this.isInitialized = true;
      this.emit('statusUpdate', {
        isOnline: true,
        uptime: 0
      });

      // Auto-resume streaming setelah restart
      setTimeout(() => {
        this.autoResumeStreaming();
      }, 3000);
    });

    this.client.on('error', async (error) => {
      console.error('❌ Discord client error:', error);
      this.emit('statusUpdate', {
        isOnline: false
      });
      await this.handleClientError(error);
    });

    this.client.on('disconnect', async (closeEvent) => {
      console.log('⚠️ Bot disconnected from Discord:', closeEvent);
      this.emit('statusUpdate', {
        isOnline: false
      });
      await this.reconnect();
    });

    this.client.on('warn', (warning) => {
      console.warn('⚠️ Discord client warning:', warning);
    });

    this.client.rest.on('rateLimited', (rateLimitInfo) => {
      console.warn('⏳ Rate limited:', rateLimitInfo);
    });

    this.client.on('guildCreate', (guild) => {
      console.log(`Joined guild: ${guild.name}`);
      this.emit('serverUpdate', {
        id: guild.id,
        name: guild.name,
        memberCount: guild.memberCount,
        isConnected: true
      });
    });

    this.client.on('guildDelete', (guild) => {
      console.log(`Left guild: ${guild.name}`);
      this.emit('serverUpdate', {
        id: guild.id,
        isConnected: false
      });
    });

    // Handle slash command interactions
    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      await this.handleSlashCommand(interaction);
    });

    // Audio player events are now handled per-server in setupServerPlayerEvents
  }

  async initialize(): Promise<void> {
    try {
      console.log('Attempting to initialize Discord bot...');
      console.log('Token length:', this.token.length);
      await this.client.login(this.token);
      console.log('Discord bot initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Discord bot:', error);
      console.error('Error details:', error);
      throw error;
    }
  }

  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  async stop(): Promise<void> {
    try {
      console.log('🛑 Stopping Discord bot...');
      
      // Clear intervals
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
      
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }
      
      // Disconnect all voice connections
      for (const [guildId, state] of this.serverStates) {
        if (state.connection) {
          state.connection.destroy();
        }
        if (state.player) {
          state.player.stop();
        }
      }
      
      this.serverStates.clear();
      
      if (this.client.isReady()) {
        await this.client.destroy();
      }
      
      this.isInitialized = false;
      this.emit('statusUpdate', {
        isOnline: false,
        isPlaying: false
      });
    } catch (error) {
      console.error('❌ Error stopping bot:', error);
    }
  }

  async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  async play(): Promise<void> {
    if (this.currentStation) {
      await this.playStation(this.currentStation);
    } else {
      // If no current station, try to find the first available station and play it
      const defaultStation: RadioStation = {
        id: 1,
        name: "Chill Lofi Radio",
        url: "https://streams.ilovemusic.de/iloveradio17.mp3",
        genre: "Lofi Hip Hop",
        quality: "192kbps",
        artwork: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=120&h=120&fit=crop",
        isFavorite: true,
        isActive: true,
        listeners: 127
      };
      await this.playStation(defaultStation);
    }
  }

  async pause(): Promise<void> {
    this.audioPlayer.pause();
  }

  async setVolume(volume: number): Promise<void> {
    // Volume control would be handled by the audio resource
    // For now, we'll just emit the status update
    this.emit('statusUpdate', {
      volume: Math.round(volume * 100)
    });
  }

  async playStation(station: RadioStation): Promise<void> {
    try {
      this.currentStation = station;
      
      // Find a voice channel to join
      const guild = this.client.guilds.cache.first();
      if (!guild) {
        throw new Error('No guilds available');
      }

      console.log(`Found guild: ${guild.name} with ${guild.channels.cache.size} channels`);

      // First try to find a voice channel with members
      let targetChannel = guild.channels.cache.find(
        (channel): channel is VoiceChannel => 
          channel.type === ChannelType.GuildVoice && channel.members.size > 0
      ) as VoiceChannel;

      // If no channel with members, find any voice channel
      if (!targetChannel) {
        targetChannel = guild.channels.cache.find(
          (channel): channel is VoiceChannel => 
            channel.type === ChannelType.GuildVoice
        ) as VoiceChannel;
      }
      
      if (!targetChannel) {
        throw new Error('No voice channels found in the server');
      }

      console.log(`Attempting to join voice channel: ${targetChannel.name}`);

      // Join voice channel
      this.voiceConnection = joinVoiceChannel({
        channelId: targetChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
      });

      console.log(`Successfully joined voice channel: ${targetChannel.name} in guild: ${guild.name}`);

      // Wait for connection to be ready
      await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, 30000);
      console.log('Voice connection is ready!');

      // Create audio resource from station URL
      const resource = createAudioResource(station.url, {
        inputType: StreamType.Arbitrary,
      });

      // Initialize audio player if not exists
      if (!this.audioPlayer) {
        this.audioPlayer = createAudioPlayer();
      }
      
      this.audioPlayer.play(resource);
      this.voiceConnection.subscribe(this.audioPlayer);

      console.log(`Now playing: ${station.name}`);
      this.emit('statusUpdate', {
        currentStationId: station.id,
        isPlaying: true
      });

    } catch (error) {
      console.error('Error playing station:', error);
      throw error;
    }
  }

  getConnectedServers() {
    return this.client.guilds.cache.map(guild => ({
      id: guild.id,
      name: guild.name,
      memberCount: guild.memberCount,
      isConnected: true,
      voiceChannelId: null
    }));
  }

  // Public method to get guild by ID for API access
  getGuildById(guildId: string) {
    return this.client.guilds.cache.get(guildId);
  }

  getBotInfo() {
    const user = this.client.user;
    return {
      id: user?.id,
      username: user?.username,
      tag: user?.tag,
      avatar: user?.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : null,
      isOnline: this.isOnline(),
      serverCount: this.getServerCount()
    };
  }

  isOnline(): boolean {
    return this.client.isReady();
  }

  getCurrentStation(): RadioStation | null {
    return this.currentStation;
  }

  private async registerSlashCommands() {
    const commands = [
      new SlashCommandBuilder()
        .setName('radio')
        .setDescription('Radio bot commands')
        .addSubcommand(subcommand =>
          subcommand
            .setName('status')
            .setDescription('Check radio bot status and current playing station')
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName('dashboard')
            .setDescription('Get link to radio dashboard for monitoring')
        ),
        
      new SlashCommandBuilder()
        .setName('stations')
        .setDescription('View available radio stations and how to control them'),
        
      new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup radio channels and interface for this server'),
        
      new SlashCommandBuilder()
        .setName('help')
        .setDescription('How to use Valkyrion Radio Bot')
    ].map(command => command.toJSON());

    const rest = new REST({ version: '10' }).setToken(this.token);

    try {
      console.log('Mulai refresh slash commands...');
      
      // Register commands globally
      await rest.put(
        Routes.applicationCommands(this.client.user!.id),
        { body: commands }
      );

      console.log('Slash commands berhasil didaftarkan!');
    } catch (error) {
      console.error('Error registering slash commands:', error);
    }
  }

  private async handleSlashCommand(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({ content: 'Commands ini hanya bisa digunakan di server Discord.', ephemeral: true });
      return;
    }

    try {
      if (interaction.commandName === 'radio') {
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
          case 'status':
            const status = this.isOnline() ? 'Online' : 'Offline';
            const currentStation = this.getCurrentStation();
            const statusText = currentStation 
              ? `🎵 **Radio Status**\n\n**Status Bot:** ${status}\n**Sekarang Memutar:** ${currentStation.name}\n**Genre:** ${currentStation.genre}\n**Kualitas:** ${currentStation.quality}`
              : `🎵 **Radio Status**\n\n**Status Bot:** ${status}\n**Status:** Tidak ada stasiun yang diputar`;
            await interaction.reply(statusText);
            break;
            
          case 'dashboard':
            const dashboardUrl = process.env.REPLIT_DOMAINS ? 
              `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 
              'https://your-dashboard-url.com';
            
            await interaction.reply({
              content: `📊 **Radio Dashboard**\n\nMonitor real-time statistics dan info stasiun radio:\n${dashboardUrl}\n\n• Live streaming status\n• Station information\n• Listener statistics\n• Server information`,
              ephemeral: false
            });
            break;
        }
      } else if (interaction.commandName === 'stations') {
        const stationsList = `
🎵 **Daftar Stasiun Radio Tersedia:**

🎧 **Chill Lofi Radio** - Lofi Hip Hop (192kbps)
🎷 **Jazz Cafe Radio** - Smooth Jazz (128kbps)
🎸 **Rock Classic Radio** - Classic Rock (192kbps)
🎛️ **Electronic Beats** - Electronic Dance (192kbps)
🎻 **Indie Folk Radio** - Indie Folk (128kbps)
🎼 **Classical Music** - Classical (192kbps)

📻 **Cara Mengganti Stasiun:**
Pergi ke channel **📻｜radio-control** dan gunakan dropdown menu untuk memilih stasiun favorit Anda!

💡 **Tips:** Bot otomatis membuat channel control saat join server
        `;
        await interaction.reply(stationsList);
      } else if (interaction.commandName === 'setup') {
        await this.handleSetupCommand(interaction);
      } else if (interaction.commandName === 'help') {
        const helpText = `
🎵 **Valkyrion Radio Bot - Panduan Penggunaan**

**🚀 Quick Start:**
1. Bot otomatis membuat channel **📻｜Radio Hub** (voice) dan **📻｜radio-control** (text)
2. Masuk ke voice channel **📻｜Radio Hub**
3. Buka text channel **📻｜radio-control**
4. Pilih stasiun dari dropdown menu yang tersedia

**⚡ Commands:**
• \`/radio status\` - Cek status bot dan stasiun saat ini
• \`/radio dashboard\` - Link ke dashboard monitoring
• \`/stations\` - Lihat semua stasiun yang tersedia
• \`/help\` - Panduan lengkap (command ini)

**🎛️ Interface Control:**
Semua kontrol radio dilakukan melalui interactive dropdown di channel **📻｜radio-control**. Tidak perlu menggunakan commands untuk play/pause/ganti stasiun.

**📊 Dashboard:**
Akses dashboard real-time untuk monitoring dengan \`/radio dashboard\`
        `;
        await interaction.reply(helpText);
      }
    } catch (error) {
      console.error('Error handling slash command:', error);
      await interaction.reply({ content: 'Terjadi error saat menjalankan command.', ephemeral: true });
    }
  }

  private async getStationByChoice(choice: string): Promise<RadioStation> {
    try {
      // Mapping choice ke nama stasiun atau ID
      const stationMap: Record<string, string | number> = {
        'lofi': 'Chill Lofi Radio',
        'jazz': 'Jazz Cafe Radio',
        'rock': 'Rock Classic Radio',
        'electronic': 'Electronic Beats',
        'indie': 'Indie Folk Radio',
        'classical': 'Classical Music',
        'hardrock': 'Hard Rock FM',
        'pop': 'Pop Hits 24/7',
        'country': 'Country Roads Radio',
        'reggae': 'Reggae Vibes',
        'j1hits': 'J1HITS',
        'j1hd': 'J1HD',
        'kpop': 'BIG B RADIO #KPOP',
        'jpop': 'BIG B RADIO #JPOP',
        'cpop': 'BIG B RADIO #CPOP',
        'apop': 'BIG B RADIO #APOP',
        'prambors': 'Prambors FM',
        'radioindo': 'Radio Indonesia',
        'gen': 'Gen FM',
        'mostfm': 'Most FM',
        'spotify': 'Spotify Hits Radio',
        'chill': 'Chillhop Radio',
        'house': 'Deep House Radio'
      };

      const stationIdentifier = stationMap[choice];
      if (!stationIdentifier) {
        // Fallback ke stasiun pertama jika tidak ditemukan
        const stations = await storage.getAllStations();
        return stations[0] || this.getDefaultStation();
      }

      // Cari berdasarkan nama atau ID
      const stations = await storage.getAllStations();
      const station = stations.find(s => 
        (typeof stationIdentifier === 'string' && s.name === stationIdentifier) ||
        (typeof stationIdentifier === 'number' && s.id === stationIdentifier)
      );

      return station || stations[0] || this.getDefaultStation();
    } catch (error) {
      console.error('Error getting station by choice:', error);
      return this.getDefaultStation();
    }
  }

  private getDefaultStation(): RadioStation {
    return {
      id: 1,
      name: "Chill Lofi Radio",
      url: "https://streams.ilovemusic.de/iloveradio17.mp3",
      genre: "Lofi Hip Hop",
      quality: "192kbps",
      artwork: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=120&h=120&fit=crop",
      isFavorite: true,
      isActive: true,
      listeners: 127
    };
  }

  private async handleSetupCommand(interaction: ChatInputCommandInteraction) {
    try {
      await interaction.deferReply();

      const guild = interaction.guild!;
      const guildId = guild.id;

      // Membuat atau mendapatkan voice channel
      const voiceChannel = await this.getOrCreateChannel(guild, '📻｜Radio Hub', ChannelType.GuildVoice);
      const controlChannel = await this.getOrCreateChannel(guild, '📻｜radio-control', ChannelType.GuildText);

      // Cek apakah channel berhasil dibuat/ditemukan
      if (!voiceChannel || !controlChannel) {
        await interaction.editReply(
          `❌ **Setup gagal!**\n\n` +
          `Bot tidak memiliki permission untuk membuat channel yang diperlukan.\n\n` +
          `**Solusi:**\n` +
          `1. Berikan permission "Manage Channels" kepada bot\n` +
          `2. Atau buat channel manual:\n` +
          `   • Voice channel: **📻｜Radio Hub**\n` +
          `   • Text channel: **📻｜radio-control**\n\n` +
          `Setelah itu, jalankan kembali command \`/setup\``
        );
        return;
      }

      // Setup server state
      if (!this.serverStates.has(guildId)) {
        const connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: guild.id,
          adapterCreator: guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        connection.subscribe(player);

        this.serverStates.set(guildId, {
          connection,
          player,
          currentIndex: 0,
          controlChannel: controlChannel.id,
          voiceChannel: voiceChannel.id
        });
      }

      // Clear messages in control channel
      await this.clearMessages(controlChannel);

      // Create station select menu from database
      const allStations = await storage.getAllStations();
      console.log(`Found ${allStations.length} stations in database`);
      
      if (allStations.length === 0) {
        console.log('No stations found in database, skipping select menu creation');
        await controlChannel.send('❌ Tidak ada stasiun radio yang tersedia dalam database.');
        return;
      }

      // Limit to first 10 stations to avoid API limits
      const stations = allStations.slice(0, 10).map((station, index) => ({
        label: station.name.length > 100 ? station.name.substring(0, 97) + '...' : station.name,
        description: `${station.genre} • ${station.quality}`.length > 100 ? `${station.genre} • ${station.quality}`.substring(0, 97) + '...' : `${station.genre} • ${station.quality}`,
        value: station.id.toString()
      }));
      
      console.log(`Created ${stations.length} station options from ${allStations.length} total stations`);

      // Kirim pesan interface sederhana tanpa komponen
      await controlChannel.send({
        content: `🎶 **Radio Control Interface** 🎶\n\n📻 Voice Channel: ${voiceChannel.name}\n🎵 Radio streaming aktif 24/7!\n\n✨ **Kontrol Radio:**\n• Dashboard Web: ${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'Dashboard tersedia'}\n• Auto-resume: Aktif\n• Database: ${allStations.length} stasiun tersimpan\n\n🎧 **Status:** Bot streaming dan siap digunakan!`
      });
      
      console.log(`Radio interface setup complete - ${allStations.length} stations available via dashboard`);

      // Setup select menu collector seperti referensi
      const filter = (i: any) => i.customId === 'select_radio_station';
      const collector = controlChannel.createMessageComponentCollector({ filter });

      collector.on('collect', async (i) => {
        await i.deferUpdate();
        const stationId = parseInt(i.values[0]);
        const station = await storage.getStation(stationId);
        
        if (!station) {
          await this.sendTemporaryMessage(controlChannel, `❌ Stasiun tidak ditemukan.`);
          return;
        }
        
        try {
          const guildId = i.guild?.id;
          if (guildId) {
            await this.playStationForServer(guildId, station);
            await this.updateNowPlayingMessage(controlChannel, station);
            
            // Emit status update for dashboard
            this.emit('statusUpdate', {
              currentStation: station,
              isPlaying: true
            });
          }
        } catch (error: any) {
          await this.sendTemporaryMessage(controlChannel, `❌ Gagal memutar ${station.name}. Coba lagi.`);
        }
      });

      // Start playing default station (first station from database)
      const defaultStation = allStations[0];
      if (defaultStation) {
        await this.playStation(defaultStation);
        await this.updateNowPlayingMessage(controlChannel, defaultStation);
      }

      await interaction.editReply(
        `✅ **Setup berhasil!**\n\n📻 Voice Channel: ${voiceChannel.name}\n🎛️ Control Channel: ${controlChannel.name}\n🎵 Sekarang memutar: **${defaultStation?.name || 'Tidak ada stasiun'}**`
      );

    } catch (error) {
      console.error('Error in setup command:', error);
      await interaction.editReply('❌ Terjadi kesalahan saat setup. Pastikan bot memiliki permission untuk membuat channel.');
    }
  }

  private async getOrCreateChannel(guild: any, name: string, type: ChannelType): Promise<any> {
    let channel = guild.channels.cache.find((ch: any) => ch.name === name && ch.type === type);
    
    if (!channel) {
      try {
        console.log(`Membuat channel: ${name}`);
        channel = await guild.channels.create({
          name,
          type,
          reason: `Radio bot setup - ${name}`
        });
      } catch (error: any) {
        if (error.code === 50013) {
          console.log(`⚠️  Bot tidak memiliki permission untuk membuat channel "${name}" di server ${guild.name}`);
          console.log(`   Silakan berikan permission "Manage Channels" kepada bot atau buat channel manual`);
          return null;
        }
        throw error;
      }
    } else {
      console.log(`Channel sudah ada: ${name}`);
    }
    
    return channel;
  }

  private async clearMessages(channel: TextChannel) {
    try {
      const messages = await channel.messages.fetch({ limit: 100 });
      const messageArray = Array.from(messages.values());
      for (const message of messageArray) {
        if (message.deletable) {
          await message.delete().catch(() => {});
        }
      }
    } catch (error) {
      console.log('Could not clear messages:', error);
    }
  }

  private async updateNowPlayingMessage(channel: TextChannel, station: RadioStation) {
    const guildId = channel.guild.id;
    const serverState = this.serverStates.get(guildId);
    
    // Delete previous "Now Playing" message if it exists
    if (serverState?.lastNowPlayingMessage) {
      try {
        await serverState.lastNowPlayingMessage.delete();
      } catch (error) {
        // Message might have been deleted already, ignore error
      }
    }

    const embed = {
      color: 0x5865F2,
      title: '🎵 Sekarang Memutar',
      description: `**${station.name}**`,
      fields: [
        { name: '🎼 Genre', value: station.genre, inline: true },
        { name: '📡 Kualitas', value: station.quality, inline: true },
        { name: '👥 Pendengar', value: `${station.listeners}`, inline: true }
      ],
      thumbnail: station.artwork ? { url: station.artwork } : undefined,
      timestamp: new Date().toISOString()
    };

    // Send new message and store reference
    const newMessage = await channel.send({ embeds: [embed] });
    
    if (serverState) {
      serverState.lastNowPlayingMessage = newMessage;
    }
  }

  private async sendTemporaryMessage(channel: TextChannel, content: string, duration = 5000) {
    const message = await channel.send(content);
    setTimeout(async () => {
      if (message.deletable) {
        await message.delete().catch(() => {});
      }
    }, duration);
  }

  private async getStationChoices() {
    try {
      const stations = await storage.getAllStations();
      const choices: Record<string, any> = {};
      
      // Mapping stasiun dari database ke choice keys
      const stationKeyMap: Record<string, string> = {
        'Chill Lofi Radio': 'lofi',
        'Jazz Cafe Radio': 'jazz',
        'Rock Classic Radio': 'rock',
        'Electronic Beats': 'electronic',
        'Indie Folk Radio': 'indie',
        'Classical Music': 'classical',
        'Hard Rock FM': 'hardrock',
        'Pop Hits 24/7': 'pop',
        'Country Roads Radio': 'country',
        'Reggae Vibes': 'reggae',
        'J1HITS': 'j1hits',
        'J1HD': 'j1hd',
        'BIG B RADIO #KPOP': 'kpop',
        'BIG B RADIO #JPOP': 'jpop',
        'BIG B RADIO #CPOP': 'cpop',
        'BIG B RADIO #APOP': 'apop',
        'Prambors FM': 'prambors',
        'Radio Indonesia': 'radioindo',
        'Gen FM': 'gen',
        'Most FM': 'mostfm',
        'Spotify Hits Radio': 'spotify',
        'Chillhop Radio': 'chill',
        'Deep House Radio': 'house'
      };

      stations.forEach(station => {
        const key = stationKeyMap[station.name] || station.name.toLowerCase().replace(/\s+/g, '_');
        choices[key] = {
          name: station.name,
          genre: station.genre,
          quality: station.quality
        };
      });

      return choices;
    } catch (error) {
      console.error('Error loading station choices from database:', error);
      // Fallback ke choices minimal
      return {
        'lofi': {
          name: "Chill Lofi Radio",
          genre: "Lofi Hip Hop",
          quality: "192kbps"
        }
      };
    }
  }

  private getStationEmoji(genre: string): string {
    const emojiMap: Record<string, string> = {
      "Lofi Hip Hop": "🎵",
      "Smooth Jazz": "🎷", 
      "Classic Rock": "🎸",
      "Electronic Dance": "🎧",
      "Indie Folk": "🎻",
      "Classical": "🎼",
      "Hard Rock": "🤘",
      "Top 40 Hits": "🎤",
      "Country": "🤠",
      "Reggae": "🌴",
      "Pop Hits": "⭐",
      "Top 40": "🔥",
      "K-Pop": "🇰🇷",
      "J-Pop": "🇯🇵",
      "C-Pop": "🇨🇳",
      "Asian Pop": "🌏",
      "Indonesian Pop": "🇮🇩",
      "Indonesian News & Music": "📻",
      "Indonesian Hits": "🎶",
      "Global Hits": "🌍",
      "Chillhop": "😎",
      "Deep House": "🏠"
    };
    return emojiMap[genre] || "🎵";
  }

  private async autoSetupAllGuilds() {
    console.log('Auto-setting up radio interface for all guilds...');
    
    const guilds = Array.from(this.client.guilds.cache.values());
    for (const guild of guilds) {
      try {
        await this.autoSetupGuild(guild);
      } catch (error) {
        console.error(`Failed to auto-setup guild ${guild.name}:`, error);
      }
    }
  }

  private async autoSetupGuild(guild: any) {
    const guildId = guild.id;

    // Skip if already setup
    if (this.serverStates.has(guildId)) {
      console.log(`Guild ${guild.name} already setup, restoring interface...`);
      await this.restoreInterface(guild);
      return;
    }

    try {
      console.log(`Setting up radio interface for guild: ${guild.name}`);

      // Create or get channels
      const voiceChannel = await this.getOrCreateChannel(guild, '📻｜Radio Hub', ChannelType.GuildVoice);
      const controlChannel = await this.getOrCreateChannel(guild, '📻｜radio-control', ChannelType.GuildText);

      // Skip setup if we can't create required channels
      if (!voiceChannel || !controlChannel) {
        console.log(`⚠️  Skipping auto-setup for ${guild.name} due to missing permissions`);
        return;
      }

      // Setup voice connection and player
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
      });

      const player = createAudioPlayer();
      connection.subscribe(player);

      // Setup player event handlers for this specific server
      this.setupServerPlayerEvents(guildId, player);

      // Store server state
      this.serverStates.set(guildId, {
        connection,
        player,
        currentStation: null,
        voiceChannelId: voiceChannel.id,
        controlChannelId: controlChannel.id,
        guild: guild,
        isPlaying: false,
        volume: 1.0,
        lastActivity: new Date(),
        listeners: 0,
        lastNowPlayingMessage: null
      });

      // Setup interface
      await this.setupRadioInterface(controlChannel, true);

      console.log(`Successfully setup radio interface for ${guild.name}`);

      // Emit server update
      this.emit('serverUpdate', {
        id: guildId,
        name: guild.name,
        memberCount: guild.memberCount,
        isConnected: true
      });

    } catch (error) {
      console.error(`Error setting up guild ${guild.name}:`, error);
    }
  }

  private async restoreInterface(guild: any) {
    const guildId = guild.id;
    const state = this.serverStates.get(guildId);
    
    if (!state) return;

    try {
      const controlChannel = guild.channels.cache.get(state.controlChannelId);
      if (controlChannel) {
        await this.setupRadioInterface(controlChannel, false);
        console.log(`Restored interface for ${guild.name}`);
        
        // Auto-resume last playing station if it was playing before restart
        if (state.currentStation && state.isPlaying) {
          console.log(`Auto-resuming last station: ${state.currentStation.name} for ${guild.name}`);
          
          // Reconnect to voice channel and resume playback
          try {
            const voiceChannel = guild.channels.cache.get(state.voiceChannelId);
            if (voiceChannel) {
              // Create new connection
              const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: guild.id,
                adapterCreator: guild.voiceAdapterCreator,
              });

              // Create new player and subscribe
              const player = createAudioPlayer();
              connection.subscribe(player);
              
              // Update state with new connection and player
              state.connection = connection;
              state.player = player;
              
              // Setup event handlers for the new player
              this.setupServerPlayerEvents(guildId, player);
              
              // Resume the station
              await this.playStationForServer(guildId, state.currentStation);
              
              // Update "Now Playing" message
              await this.updateNowPlayingMessage(controlChannel, state.currentStation);
              
              // Send notification about auto-resume
              await this.sendTemporaryMessage(controlChannel, 
                `🔄 **Auto-Resume**: Melanjutkan ${state.currentStation.name}`, 4000);
            }
          } catch (resumeError) {
            console.error(`Failed to auto-resume for ${guild.name}:`, resumeError);
            // Reset playing state if resume failed
            state.isPlaying = false;
            state.currentStation = null;
          }
        }
      }
    } catch (error) {
      console.error(`Error restoring interface for ${guild.name}:`, error);
    }
  }

  private async setupSimpleRadioInterface(controlChannel: TextChannel, clearMessages = true) {
    try {
      // Clear old messages if needed
      if (clearMessages) {
        await this.clearMessages(controlChannel);
      }

      // Get all stations from database
      const allStations = await storage.getAllStations();
      console.log(`Found ${allStations.length} stations in database`);

      if (allStations.length === 0) {
        await controlChannel.send(`❌ Tidak ada stasiun radio yang tersedia dalam database.`);
        return;
      }

      // Create simple dropdown menu with all stations (max 25 per Discord limit)
      const stationOptions = allStations.slice(0, 25).map(station => ({
        label: station.name.length > 100 ? station.name.substring(0, 97) + '...' : station.name,
        description: `${station.genre} • ${station.quality}`,
        value: station.id.toString(),
        emoji: this.getStationEmoji(station.genre)
      }));

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('radio_station_select')
        .setPlaceholder('🎵 Pilih stasiun radio untuk diputar...')
        .addOptions(stationOptions);

      const row = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(selectMenu);

      // Send the radio control message
      await controlChannel.send({
        content: `🎶 **Radio Control Panel** 🎶\n\n` +
                `📻 **Voice Channel:** 📻｜Radio Hub\n` +
                `🎵 **Stasiun Tersedia:** ${allStations.length} stasiun\n\n` +
                `Pilih stasiun dari dropdown menu di bawah untuk mulai streaming musik!`,
        components: [row]
      });

      // Setup collector for interactions
      this.setupChannelCollector(controlChannel);

      console.log(`Radio dropdowns created with ${allStations.length} stations in 8 categories`);

    } catch (error) {
      console.error('Error setting up radio interface:', error);
      await controlChannel.send(`❌ Gagal membuat interface radio. Coba lagi nanti.`);
    }
  }

  private async setupRadioInterface(controlChannel: TextChannel, clearMessages = true) {
    try {
      // Clear old messages if needed
      if (clearMessages) {
        await this.clearMessages(controlChannel);
      }

      // Get stations from database
      const allStations = await storage.getAllStations();
      console.log(`Found ${allStations.length} stations in database`);

      if (allStations.length === 0) {
        await controlChannel.send(`❌ Tidak ada stasiun radio yang tersedia dalam database.`);
        return;
      }

      // Group stations by category
      const categories: { [key: string]: RadioStation[] } = {
        'Pop & Hits': [],
        'Rock & Metal': [],
        'Electronic & House': [],
        'Chill & Lofi': [],
        'Jazz & Classic': [],
        'World Music': [],
        'Alternative': [],
        'Radio News': []
      };

      // Categorize stations based on genre
      allStations.forEach(station => {
        const genre = station.genre.toLowerCase();
        const name = station.name.toLowerCase();
        
        if (genre.includes('pop') || genre.includes('dance') || genre.includes('hits') || name.includes('pop')) {
          categories['Pop & Hits'].push(station);
        } else if (genre.includes('rock') || genre.includes('metal') || genre.includes('punk') || name.includes('rock')) {
          categories['Rock & Metal'].push(station);
        } else if (genre.includes('electronic') || genre.includes('edm') || genre.includes('house') || genre.includes('techno')) {
          categories['Electronic & House'].push(station);
        } else if (genre.includes('chill') || genre.includes('lofi') || genre.includes('ambient') || name.includes('chill')) {
          categories['Chill & Lofi'].push(station);
        } else if (genre.includes('jazz') || genre.includes('classic') || genre.includes('blues') || name.includes('jazz')) {
          categories['Jazz & Classic'].push(station);
        } else if (genre.includes('alternative') || genre.includes('indie') || genre.includes('reggae')) {
          categories['Alternative'].push(station);
        } else if (genre.includes('news') || genre.includes('talk') || name.includes('news')) {
          categories['Radio News'].push(station);
        } else {
          categories['World Music'].push(station);
        }
      });

      // Create multiple dropdown menus
      const rows: ActionRowBuilder<StringSelectMenuBuilder>[] = [];

      for (const [categoryName, stations] of Object.entries(categories)) {
        if (stations.length > 0) {
          const options = stations.slice(0, 10).map(station => ({ // Max 10 per dropdown
            label: station.name.length > 100 ? station.name.substring(0, 97) + '...' : station.name,
            value: station.id.toString(),
            description: station.genre.length > 100 ? station.genre.substring(0, 97) + '...' : station.genre
          }));

          if (options.length > 0) {
            const selectMenu = new StringSelectMenuBuilder()
              .setCustomId(`radio_select_${categoryName.replace(/\s+/g, '_').toLowerCase()}`)
              .setPlaceholder(`${categoryName} (${stations.length} stasiun)`)
              .addOptions(options);

            const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
            rows.push(row);
          }
        }
      }

      // If not enough categories, add remaining stations to "Semua Stasiun" category
      const usedStations = new Set();
      Object.values(categories).forEach(categoryStations => {
        categoryStations.forEach(station => usedStations.add(station.id));
      });

      const remainingStations = allStations.filter(station => !usedStations.has(station.id));
      if (remainingStations.length > 0) {
        const options = remainingStations.slice(0, 10).map(station => ({
          label: station.name.length > 100 ? station.name.substring(0, 97) + '...' : station.name,
          value: station.id.toString(),
          description: station.genre.length > 100 ? station.genre.substring(0, 97) + '...' : station.genre
        }));

        if (options.length > 0) {
          const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('radio_select_semua_stasiun')
            .setPlaceholder(`Semua Stasiun (${remainingStations.length} stasiun)`)
            .addOptions(options);

          const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
          rows.push(row);
        }
      }

      try {

        // Create navigation system with current page
        let currentPageIndex = 0;
        const totalPages = Math.ceil(rows.length / 3); // Show 3 dropdowns per page

        const createPageMessage = (pageIndex: number) => {
          const startIndex = pageIndex * 3;
          const endIndex = Math.min(startIndex + 3, rows.length);
          const pageRows = rows.slice(startIndex, endIndex);

          // Add navigation buttons if needed
          const buttonRow = new ActionRowBuilder<any>();
          
          if (totalPages > 1) {
            if (pageIndex > 0) {
              buttonRow.addComponents(
                new ButtonBuilder()
                  .setCustomId('radio_nav_prev')
                  .setLabel('◀ Sebelumnya')
                  .setStyle(ButtonStyle.Secondary)
              );
            }
            
            buttonRow.addComponents(
              new ButtonBuilder()
                .setCustomId('radio_nav_select')
                .setLabel(`📄 ${pageIndex + 1}/${totalPages}`)
                .setStyle(ButtonStyle.Primary)
            );
            
            if (pageIndex < totalPages - 1) {
              buttonRow.addComponents(
                new ButtonBuilder()
                  .setCustomId('radio_nav_next')
                  .setLabel('Selanjutnya ▶')
                  .setStyle(ButtonStyle.Secondary)
              );
            }
          }

          const components = [...pageRows];
          if (buttonRow.components.length > 0) {
            components.push(buttonRow);
          }

          return {
            content: `🎶 **Radio Control - Kategori Musik** 🎶\n\n📻 Voice Channel: 📻｜Radio Hub\n🎵 Pilih kategori dan stasiun radio:\n\n📄 Halaman ${pageIndex + 1} dari ${totalPages}`,
            components
          };
        };

        if (rows.length === 0) {
          await controlChannel.send(`❌ Tidak ada stasiun yang tersedia untuk dikategorikan.`);
          return;
        }

        // Send initial page
        const initialMessage = await controlChannel.send(createPageMessage(currentPageIndex));

        // Setup collectors for all interactions
        const filter = (i: any) => i.customId.startsWith('radio_select_') || i.customId.startsWith('radio_nav_');
        const collector = controlChannel.createMessageComponentCollector({ filter, time: 300000 }); // 5 minutes timeout

        collector.on('collect', async (i) => {
          try {
            if (i.customId === 'radio_nav_prev' && currentPageIndex > 0) {
              await i.deferUpdate();
              currentPageIndex--;
              await i.editReply(createPageMessage(currentPageIndex));
            } else if (i.customId === 'radio_nav_next' && currentPageIndex < totalPages - 1) {
              await i.deferUpdate();
              currentPageIndex++;
              await i.editReply(createPageMessage(currentPageIndex));
            } else if (i.customId === 'radio_nav_select') {
              await i.deferReply({ ephemeral: true });
              await i.editReply({
                content: `📄 **Info Halaman:**\nSaat ini di Halaman ${currentPageIndex + 1} dari ${totalPages}\n\nGunakan tombol ◀ dan ▶ untuk navigasi.`
              });
            } else if (i.customId.startsWith('radio_select_')) {
              await i.deferUpdate();
              const stationId = parseInt(i.values[0]);
              const station = await storage.getStation(stationId);
              
              if (station && i.guild?.id) {
                try {
                  await this.playStationForServer(i.guild.id, station);
                  await this.updateNowPlayingMessage(controlChannel, station);
                } catch (error) {
                  await this.sendTemporaryMessage(controlChannel, `❌ Gagal memutar ${station.name}`);
                }
              }
            }
          } catch (error) {
            console.error('Error handling interaction:', error);
          }
        });

        collector.on('end', () => {
          // Disable all components when collector expires
          const disabledMessage = createPageMessage(currentPageIndex);
          disabledMessage.components.forEach((row: any) => {
            row.components.forEach((component: any) => {
              component.setDisabled(true);
            });
          });
          initialMessage.edit(disabledMessage).catch(() => {});
        });

        console.log(`Radio dropdowns created with ${allStations.length} stations in ${rows.length} categories`);
        
      } catch (error) {
        console.error('Error creating dropdown:', error);
        await controlChannel.send(`❌ Gagal membuat menu kontrol. Gunakan dashboard web atau slash commands.`);
      }

    } catch (error) {
      console.error('Error setting up radio interface:', error);
    }
  }

  private setupChannelCollector(controlChannel: TextChannel) {
    const filter = (i: any) => i.customId === 'select_radio_station' || i.customId === 'radio_station_select';
    const collector = controlChannel.createMessageComponentCollector({ 
      filter,
      time: 0 // Never expires
    });

    collector.on('collect', async (i: any) => {
      await i.deferUpdate();
      if (i.isStringSelectMenu && i.values) {
        let station;
        
        if (i.customId === 'radio_station_select') {
          // New simple interface - station ID directly
          const stationId = parseInt(i.values[0]);
          station = await storage.getStation(stationId);
        } else {
          // Old interface - using choice mapping
          const stationChoice = i.values[0];
          station = await this.getStationByChoice(stationChoice);
        }
        
        try {
          const guildId = i.guild?.id;
          if (guildId && station) {
            await this.playStationForServer(guildId, station);
            await this.updateNowPlayingMessage(controlChannel, station);
            
            // Emit status update for dashboard
            this.emit('statusUpdate', {
              currentStation: station,
              isPlaying: true
            });
          }
        } catch (error: any) {
          await this.sendTemporaryMessage(controlChannel, `❌ Gagal memutar ${station?.name || 'stasiun'}. Coba lagi.`);
        }
      }
    });

    console.log(`Setup collector for channel: ${controlChannel.name}`);
  }

  private setupServerPlayerEvents(guildId: string, player: any): void {
    player.on(AudioPlayerStatus.Playing, () => {
      console.log(`Audio player started for server ${guildId}`);
      const serverState = this.serverStates.get(guildId);
      if (serverState) {
        serverState.isPlaying = true;
        this.emit('statusUpdate', {
          isPlaying: true,
          currentStation: serverState.currentStation
        });
      }
    });

    player.on(AudioPlayerStatus.Paused, () => {
      console.log(`Audio player paused for server ${guildId}`);
      const serverState = this.serverStates.get(guildId);
      if (serverState) {
        serverState.isPlaying = false;
        this.emit('statusUpdate', { isPlaying: false });
      }
    });

    player.on(AudioPlayerStatus.Idle, () => {
      console.log(`Audio player idle for server ${guildId}`);
      const serverState = this.serverStates.get(guildId);
      if (serverState) {
        serverState.isPlaying = false;
      }
    });

    player.on('error', (error: any) => {
      console.error(`Audio player error for server ${guildId}:`, error);
    });
  }

  // Multi-server management methods
  async playStationForServer(guildId: string, station: RadioStation): Promise<void> {
    const serverState = this.serverStates.get(guildId);
    if (!serverState) {
      throw new Error(`Server ${guildId} not found`);
    }

    try {
      console.log(`🎵 Playing ${station.name} for server ${guildId}`);
      console.log(`🔗 Stream URL: ${station.url}`);

      // Wait for connection to be ready
      console.log(`⏳ Waiting for voice connection to be ready...`);
      await entersState(serverState.connection, VoiceConnectionStatus.Ready, 30000);
      console.log(`✅ Voice connection ready`);

      // Stop current playback completely
      if (serverState.isPlaying) {
        console.log(`🛑 Stopping current playback`);
        serverState.player.stop(true); // Force stop
        serverState.isPlaying = false;
        
        // Wait a bit for cleanup
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Create audio resource with better configuration
      console.log(`🎧 Creating audio resource...`);
      const resource = createAudioResource(station.url, {
        inputType: StreamType.Arbitrary,
        inlineVolume: true,
        metadata: {
          title: station.name,
          guildId: guildId
        }
      });

      // Add error handling for the resource
      resource.playStream.on('error', (error) => {
        console.error(`❌ Stream error for ${station.name}:`, error);
        serverState.isPlaying = false;
      });

      // Play the audio
      console.log(`▶️ Starting playback...`);
      serverState.player.play(resource);
      
      // Set volume if available
      if (resource.volume) {
        resource.volume.setVolume(serverState.volume / 100);
        console.log(`🔊 Volume set to ${serverState.volume}%`);
      }

      serverState.currentStation = station;
      serverState.isPlaying = true;
      serverState.lastActivity = new Date();

      // Simpan stasiun terakhir ke database
      await this.saveLastPlayedStation(guildId, station);

      console.log(`🎶 Now playing: ${station.name}`);

      // Update now playing message in control channel
      const guild = this.client.guilds.cache.get(guildId);
      if (guild) {
        const controlChannel = guild.channels.cache.find(
          (ch: any) => ch.name.includes('radio-control') && ch.isTextBased()
        );
        if (controlChannel) {
          await this.updateNowPlayingMessage(controlChannel as any, station);
        }
      }

      this.emit('statusUpdate', {
        currentStation: station,
        isPlaying: true
      });

    } catch (error) {
      console.error(`❌ Error playing station for server ${guildId}:`, error);
      serverState.isPlaying = false;
      throw error;
    }
  }

  getServerStates(): ServerState[] {
    return Array.from(this.serverStates.values());
  }

  getServerCount(): number {
    return this.serverStates.size;
  }

  getCurrentStationForServer(guildId: string): RadioStation | null {
    const serverState = this.serverStates.get(guildId);
    return serverState ? serverState.currentStation : null;
  }

  isServerPlaying(guildId: string): boolean {
    const serverState = this.serverStates.get(guildId);
    return serverState ? serverState.isPlaying : false;
  }

  private async autoResumeStreaming() {
    console.log('🔄 Starting auto-resume streaming...');
    
    try {
      const guilds = this.client.guilds.cache;
      
      for (const [guildId, guild] of guilds) {
        const radioChannel = guild.channels.cache.find(
          channel => channel.name.includes('Radio Hub') && channel.isVoiceBased()
        );
        
        if (radioChannel && radioChannel.members.size > 0) {
          console.log(`🎵 Auto-resuming for guild: ${guild.name}`);
          
          // Ambil stasiun terakhir dari database
          let stationToPlay = await this.getLastPlayedStation(guildId);
          
          // Jika tidak ada stasiun tersimpan, gunakan default
          if (!stationToPlay) {
            stationToPlay = {
              id: 1,
              name: "Chill Lofi Radio",
              url: "https://streams.ilovemusic.de/iloveradio17.mp3",
              genre: "Lofi Hip Hop",
              quality: "192kbps",
              artwork: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=120&h=120&fit=crop",
              isFavorite: true,
              isActive: true,
              listeners: 127
            };
          }
          
          try {
            await this.playStationForServer(guildId, stationToPlay);
            
            // Update "Now Playing" message di control channel
            const controlChannel = guild.channels.cache.find(
              ch => ch.name.includes('radio-control') && ch.isTextBased()
            );
            if (controlChannel) {
              await this.updateNowPlayingMessage(controlChannel, stationToPlay);
            }
            
            console.log(`✅ Auto-resumed streaming for ${guild.name} with ${stationToPlay.name}`);
          } catch (error) {
            console.error(`❌ Failed to auto-resume for ${guild.name}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error during auto-resume:', error);
    }
  }

  private async getLastPlayedStation(guildId: string): Promise<RadioStation | null> {
    try {
      const server = await storage.getServer(guildId);
      if (server?.lastStationId) {
        const station = await storage.getStation(server.lastStationId);
        if (station) {
          console.log(`📻 Found last played station for ${guildId}: ${station.name}`);
          return station;
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting last played station:', error);
      return null;
    }
  }

  private async saveLastPlayedStation(guildId: string, station: RadioStation): Promise<void> {
    try {
      // Validasi station ID exists in database sebelum menyimpan
      const existingStation = await storage.getStation(station.id);
      if (!existingStation) {
        console.log(`⚠️ Station ${station.name} (ID: ${station.id}) not in database, skipping save`);
        return;
      }

      await storage.updateServer(guildId, {
        lastStationId: station.id,
        lastPlaying: true
      });
      console.log(`💾 Saved last played station for ${guildId}: ${station.name}`);
    } catch (error) {
      console.error('Error saving last played station:', error);
    }
  }

  private async updateBotPresence() {
    try {
      const dashboardUrl = process.env.REPLIT_DOMAINS ? 
        `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 
        'Dashboard available via /radio dashboard';

      await this.client.user?.setPresence({
        activities: [{
          name: `🎵 24/7 Radio | ${dashboardUrl}`,
          type: 2, // LISTENING
        }],
        status: 'online'
      });

      console.log('Bot presence updated with dashboard link');
    } catch (error) {
      console.error('Error updating bot presence:', error);
    }
  }
}
