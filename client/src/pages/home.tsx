import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ValkyrionLogo } from "@/components/valkyrion-logo";
import { RadioWaves } from "@/components/radio-waves";
import { Link } from "wouter";
import { Music, Radio, Volume2, Users, Zap, Shield, Globe, Headphones } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { servers } = useWebSocket();

  const features = [
    {
      icon: Radio,
      title: "20+ Stasiun Radio Berkualitas",
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
    { name: "Electronic Vibes", genre: "Electronic", listeners: "156 pendengar" },
    { name: "Smooth Jazz FM", genre: "Jazz", listeners: "203 pendengar" },
    { name: "Gen FM", genre: "Pop Indonesia", listeners: "94 pendengar" },
    { name: "J1HITS", genre: "Top 40", listeners: "178 pendengar" }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <RadioWaves />
        <div className="absolute inset-0 bg-gradient-to-br from-black/30 to-gray-900/30"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <ValkyrionLogo size={120} />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-lg mb-6 leading-tight">
              Bot Radio <span className="text-yellow-300 font-bold drop-shadow-lg">Valkyrion</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white drop-shadow-md mb-8 max-w-3xl mx-auto leading-relaxed">
              Bot Discord terdepan untuk streaming radio 24/7 dengan 33+ stasiun berkualitas tinggi. 
              Nikmati musik tanpa batas di server Discord Anda.
            </p>

            <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
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
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 font-medium">
                    <Music className="w-5 h-5 mr-2" />
                    Buka Control Panel
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button size="lg" className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 font-medium">
                    <Music className="w-5 h-5 mr-2" />
                    Login untuk Memulai Streaming
                  </Button>
                </Link>
              )}
              
              <Button variant="outline" size="lg" className="border-white bg-transparent text-white hover:bg-white/20 hover:border-white px-8 py-3 transition-all duration-300 drop-shadow-md">
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
          <h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg mb-4">
            Fitur Unggulan
          </h2>
          <p className="text-xl text-white drop-shadow-md max-w-2xl mx-auto">
            Bot radio Discord paling lengkap dengan teknologi streaming terdepan
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 bg-slate-800/80 border-slate-600/50 hover:border-blue-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-400/20">
              <div className="p-3 bg-blue-600/80 rounded-lg w-fit mb-4">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-200 leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
        </div>
      </div>

      {/* Popular Stations */}
      <div className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg mb-4">
              Stasiun Radio Populer
            </h2>
            <p className="text-xl text-white drop-shadow-md max-w-2xl mx-auto">
              Koleksi stasiun radio terbaik dari berbagai genre musik
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularStations.map((station, index) => (
              <Card key={index} className="p-6 bg-slate-800/80 border-slate-600/50 hover:border-purple-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-400/20">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {station.name}
                    </h3>
                    <p className="text-slate-200 text-sm">
                      {station.genre}
                    </p>
                  </div>
                  <div className="p-2 bg-purple-600/80 rounded-lg">
                    <Radio className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-400">
                    {station.listeners}
                  </span>
                  <Badge variant="secondary" className="bg-red-600/80 text-white border-red-500">
                    Live
                  </Badge>
                </div>
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
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 font-medium">
                    <Music className="w-5 h-5 mr-2" />
                    Akses Control Panel
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button size="lg" className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 font-medium">
                    <Music className="w-5 h-5 mr-2" />
                    Login untuk Memulai Streaming
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </Card>
        </div>
      </div>
    </div>
  );
}