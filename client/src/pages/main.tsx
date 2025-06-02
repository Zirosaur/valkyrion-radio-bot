import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { useUserRole } from "@/hooks/use-user-role";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ValkyrionLogo } from "@/components/valkyrion-logo";
import { RadioWaves } from "@/components/radio-waves";
import { Sidebar } from "@/components/dashboard/sidebar";
import { NowPlaying } from "@/components/dashboard/now-playing";
import { StatusCards } from "@/components/dashboard/status-cards";
import { RadioStations } from "@/components/dashboard/radio-stations";
import { ServerInfo } from "@/components/dashboard/server-info";
import { HeaderServerSelector } from "@/components/dashboard/header-server-selector";
import { DiscordLogin } from "@/components/auth/discord-login";
import { Link } from "wouter";
import { 
  Music, Radio, Volume2, Users, Zap, Shield, Globe, Headphones,
  Menu, Plus, Copy, LogIn, Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Main() {
  const { isAuthenticated, user, login, logout } = useAuth();
  const { botStatus, stations, servers } = useWebSocket();
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const { role: userRole } = useUserRole(selectedServer);
  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const { toast } = useToast();

  // Features data for home page
  const features = [
    {
      icon: Radio,
      title: "33+ Stasiun Radio Berkualitas",
      description: "Koleksi lengkap stasiun radio internasional dan Indonesia dengan kualitas audio hingga 320kbps"
    },
    {
      icon: Globe,
      title: "Multi-Server Support",
      description: "Bot dapat beroperasi di multiple server Discord secara bersamaan dengan kontrol independen"
    },
    {
      icon: Zap,
      title: "Auto-Resume & Reconnect",
      description: "Otomatis melanjutkan streaming setelah restart dan reconnect ke voice channel"
    },
    {
      icon: Shield,
      title: "Streaming 24/7",
      description: "Bot dirancang untuk streaming musik non-stop tanpa gangguan"
    },
    {
      icon: Users,
      title: "Dashboard Web Real-time",
      description: "Kontrol penuh melalui dashboard web dengan monitoring real-time"
    },
    {
      icon: Volume2,
      title: "Kontrol Audio Lengkap",
      description: "Kontrol volume, play/pause, dan pemilihan stasiun dengan interface yang intuitif"
    }
  ];

  const popularStations = [
    { name: "Chill Lofi Radio", genre: "Lofi Hip Hop", listeners: "127 pendengar" },
    { name: "Radio Indonesia", genre: "Indonesia", listeners: "89 pendengar" },
    { name: "Hard Rock FM", genre: "Rock", listeners: "156 pendengar" },
    { name: "Electronic Beats", genre: "Electronic", listeners: "203 pendengar" },
    { name: "Jazz Classics", genre: "Jazz", listeners: "78 pendengar" },
  ];

  const handleInviteBot = useCallback(() => {
    const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=1293281550565113987&permissions=36727824&scope=bot%20applications.commands`;
    window.open(inviteUrl, '_blank');
  }, []);

  const copyInviteLink = useCallback(async () => {
    const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=1293281550565113987&permissions=36727824&scope=bot%20applications.commands`;
    
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopySuccess(true);
      toast({
        title: "Link disalin!",
        description: "Link undangan bot berhasil disalin ke clipboard",
      });
      
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      toast({
        title: "Gagal menyalin",
        description: "Tidak dapat menyalin link ke clipboard",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Render Home Page for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
          <RadioWaves className="absolute inset-0 opacity-10" />
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
            <div className="text-center">
              <div className="flex justify-center mb-8">
                <ValkyrionLogo size={120} />
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg mb-6">
                Bot Radio Discord
                <span className="block text-3xl md:text-5xl text-blue-400 mt-2">
                  Premium
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-white drop-shadow-md mb-8 max-w-3xl mx-auto leading-relaxed">
                Streaming musik berkualitas tinggi 24/7 di server Discord Anda dengan 33+ stasiun radio dari berbagai genre
              </p>

              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <Badge variant="secondary" className="bg-green-600/80 text-white border-green-500 px-4 py-2 text-sm font-medium">
                  <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                  Bot Online
                </Badge>
                <Badge variant="secondary" className="bg-blue-600/80 text-white border-blue-500 px-4 py-2 text-sm font-medium">
                  {servers.length} Server Aktif
                </Badge>
                <Badge variant="secondary" className="bg-purple-600/80 text-white border-purple-500 px-4 py-2 text-sm font-medium">
                  33+ Stasiun Radio
                </Badge>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/login">
                  <Button size="lg" className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 font-medium">
                    <Music className="w-5 h-5 mr-2" />
                    Login untuk Memulai Streaming
                  </Button>
                </Link>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-white bg-transparent text-white hover:bg-white/20 hover:border-white px-8 py-3 transition-all duration-300 drop-shadow-md"
                  onClick={handleInviteBot}
                >
                  <Users className="w-5 h-5 mr-2" />
                  Undang Bot ke Server
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-gray-800 py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Fitur Unggulan
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Bot radio Discord paling lengkap dengan teknologi terdepan untuk pengalaman streaming terbaik
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <Card key={index} className="p-6 bg-gray-700 border-gray-600 hover:bg-gray-600 transition-colors duration-300">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                    </div>
                    <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Popular Stations Section */}
        <div className="bg-gray-900 py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Stasiun Radio Populer
              </h2>
              <p className="text-xl text-gray-300">
                Dengarkan berbagai genre musik dari stasiun radio terbaik dunia
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {popularStations.map((station, index) => (
                <Card key={index} className="p-4 bg-gray-800 border-gray-700 hover:bg-gray-700 transition-colors duration-300">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
                      <Headphones className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white text-sm">{station.name}</h4>
                      <p className="text-xs text-gray-400">{station.genre}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{station.listeners}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gray-800 py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="p-12 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 border-gray-600 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-800/50 to-gray-700/50"></div>
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg mb-4">
                  Siap Memulai Streaming?
                </h2>
                <p className="text-xl text-white drop-shadow-md mb-8 max-w-2xl mx-auto leading-relaxed">
                  Bergabunglah dengan ribuan server yang sudah mempercayai Bot Valkyrion untuk kebutuhan streaming radio mereka.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/login">
                    <Button size="lg" className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 font-medium">
                      <Music className="w-5 h-5 mr-2" />
                      Login untuk Memulai Streaming
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Render Dashboard for authenticated users
  return (
    <div className="min-h-screen bg-discord-dark flex">
      {/* Mobile Menu Button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          variant="outline"
          size="sm"
          className="bg-discord-medium border-discord-light text-white"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Sidebar */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block fixed md:relative inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out md:transform-none`}>
        <Sidebar botStatus={botStatus} />
      </div>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-discord-medium border-b border-discord-light sticky top-0 z-20">
          <div className="flex items-center justify-between px-3 py-2">
            {/* Left section */}
            <div className="flex items-center space-x-2 ml-12 md:ml-0">
              <ValkyrionLogo size={24} />
              <div>
                <h1 className="text-sm font-bold text-white">Valkyrion</h1>
                <p className="text-xs text-discord-muted hidden sm:block">Radio Bot Dashboard</p>
              </div>
            </div>
            
            {/* Right section */}
            <div className="flex items-center space-x-2">
              {/* Invite Bot Button - Hidden on mobile */}
              <div className="hidden md:flex items-center space-x-2">
                <Button
                  onClick={handleInviteBot}
                  size="sm"
                  className="bg-discord-primary hover:bg-blue-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Undang Bot
                </Button>
                <Button
                  onClick={copyInviteLink}
                  size="sm"
                  variant="outline"
                  className="border-discord-light hover:bg-discord-light text-white"
                >
                  {copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>

              {/* Auth Section */}
              <DiscordLogin 
                user={user} 
                onLogin={login} 
                onLogout={logout} 
              />
            </div>
          </div>
          
          {/* Server Selector - Below header on mobile */}
          {servers.length > 0 && (
            <div className="px-4 py-2 border-t border-discord-light bg-discord-dark">
              <HeaderServerSelector
                servers={servers}
                selectedServer={selectedServer}
                onServerSelect={setSelectedServer}
                userRole={userRole}
              />
            </div>
          )}
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              {/* Status Cards */}
              <StatusCards 
                botStatus={botStatus} 
                stations={stations}
              />

              {/* Now Playing */}
              <NowPlaying 
                botStatus={botStatus} 
                stations={stations}
                selectedServer={selectedServer}
              />
            </div>

            {/* Right Column - Sidebar Content */}
            <div className="space-y-4 md:space-y-6">
              {/* Server Info */}
              <ServerInfo servers={servers} />
              
              {/* Radio Stations */}
              <RadioStations stations={stations} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}