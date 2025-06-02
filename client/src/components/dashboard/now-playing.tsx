import { useState } from "react";
import { SkipBack, Play, Pause, SkipForward, VolumeX, Volume2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import type { BotStatus, RadioStation } from "@shared/schema";

interface NowPlayingProps {
  botStatus: BotStatus | null;
  stations: RadioStation[];
  selectedServer: string | null;
}

export function NowPlaying({ botStatus, stations, selectedServer }: NowPlayingProps) {
  const [volume, setVolume] = useState(botStatus?.volume || 75);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, login } = useAuth();
  const { servers } = useWebSocket();

  // Fetch server-specific status when a server is selected
  const { data: serverStatus, isLoading } = useQuery({
    queryKey: ['/api/servers', selectedServer, 'status'],
    enabled: !!selectedServer && isAuthenticated,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Get current station info - showing real playing status for selected server
  const currentStation = serverStatus?.currentStation || 
                         stations.find(station => station.isActive) || 
                         stations.find(station => station.name.includes("Chill Lofi"));

  const playPauseMutation = useMutation({
    mutationFn: async () => {
      const endpoint = botStatus?.isPlaying ? '/api/bot/pause' : '/api/bot/play';
      return apiRequest('POST', endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bot/status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to toggle playback",
        variant: "destructive",
      });
    },
  });

  const volumeMutation = useMutation({
    mutationFn: async (newVolume: number) => {
      return apiRequest('POST', '/api/bot/volume', { volume: newVolume });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bot/status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update volume",
        variant: "destructive",
      });
    },
  });

  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0];
    setVolume(newVolume);
    volumeMutation.mutate(newVolume);
  };

  const handlePlayPause = () => {
    playPauseMutation.mutate();
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="bg-discord-medium rounded-xl p-6 border border-discord-light">
        <h3 className="text-lg font-semibold text-white mb-6">Now Playing</h3>
        
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-discord-dark rounded-lg mx-auto mb-4 flex items-center justify-center">
            <LogIn className="w-8 h-8 text-discord-muted" />
          </div>
          
          <h4 className="text-xl font-bold text-white mb-2">
            Login untuk Melihat Status Bot
          </h4>
          <p className="text-discord-muted mb-6">
            Masuk dengan Discord untuk melihat status bot di server Anda dan mengontrol radio streaming secara real-time
          </p>
          
          <Button 
            onClick={login}
            className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium transition-colors shadow-lg"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Login untuk Memulai Streaming
          </Button>
          
          <div className="mt-6 p-4 bg-discord-dark rounded-lg">
            <p className="text-sm text-discord-muted">
              <strong>Informasi:</strong> Bot Valkyrion sedang aktif di {servers.length} server dengan 20+ stasiun radio berkualitas tinggi. 
              Login untuk melihat status streaming di server Anda.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-discord-medium rounded-xl p-4 md:p-6 border border-discord-light">
      <h3 className="text-base md:text-lg font-semibold text-white mb-4 md:mb-6">Sedang Diputar</h3>
      
      {/* Current Station */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4 md:mb-6">
        <img 
          src={currentStation?.artwork || "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=120&h=120&fit=crop"} 
          alt="Current radio station artwork" 
          className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover mx-auto sm:mx-0"
        />
        <div className="flex-1 text-center sm:text-left">
          <h4 className="text-lg md:text-xl font-bold text-white">
            {currentStation?.name || "Pilih Server untuk Melihat Status"}
          </h4>
          <p className="text-sm md:text-base text-discord-muted">
            {selectedServer 
              ? (currentStation?.genre || "Bot sedang siap untuk streaming") 
              : "Pilih server di header untuk melihat status"}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start space-y-1 sm:space-y-0 sm:space-x-4 mt-2">
            <span className="text-xs md:text-sm text-green-400 flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                serverStatus?.isPlaying ? 'bg-green-400 animate-pulse' : 
                selectedServer ? 'bg-yellow-400' : 'bg-gray-400'
              }`}></div>
              {selectedServer 
                ? (serverStatus?.isPlaying ? 'Streaming' : 'Siap')
                : 'Pilih Server'}
            </span>
            <span className="text-xs md:text-sm text-discord-muted">
              {serverStatus?.listeners || currentStation?.listeners || 0} pendengar
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-4 md:space-x-6 mb-4 md:mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="text-discord-muted hover:text-white w-8 h-8 md:w-10 md:h-10"
        >
          <SkipBack className="w-4 h-4 md:w-6 md:h-6" />
        </Button>
        
        <Button
          size="icon"
          className="bg-discord-primary hover:bg-blue-600 text-white rounded-full w-10 h-10 md:w-12 md:h-12"
          onClick={handlePlayPause}
          disabled={playPauseMutation.isPending || !currentStation}
        >
          {botStatus?.isPlaying ? (
            <Pause className="w-5 h-5 md:w-6 md:h-6" />
          ) : (
            <Play className="w-5 h-5 md:w-6 md:h-6 ml-0.5" />
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="text-discord-muted hover:text-white w-8 h-8 md:w-10 md:h-10"
        >
          <SkipForward className="w-4 h-4 md:w-6 md:h-6" />
        </Button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center space-x-2 md:space-x-4">
        <VolumeX className="text-discord-muted w-3 h-3 md:w-4 md:h-4" />
        <div className="flex-1">
          <Slider
            value={[volume]}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
        <Volume2 className="text-discord-muted w-3 h-3 md:w-4 md:h-4" />
        <span className="text-xs md:text-sm text-discord-muted w-6 md:w-8">{volume}%</span>
      </div>
    </div>
  );
}
