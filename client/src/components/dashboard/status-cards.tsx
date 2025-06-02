import { Users, Clock, Radio, Cpu } from "lucide-react";
import type { BotStatus, RadioStation } from "@shared/schema";

interface StatusCardsProps {
  botStatus: BotStatus | null;
  stations: RadioStation[];
}

export function StatusCards({ botStatus, stations }: StatusCardsProps) {
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const activeStations = stations.filter(station => station.isActive).length;
  const availabilityPercentage = botStatus?.isOnline ? 99.8 : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
      {/* Current Listeners */}
      <div className="bg-gradient-to-br from-discord-medium via-discord-medium to-green-500/10 rounded-xl p-4 md:p-6 border border-discord-light hover:border-green-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-400/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs md:text-sm text-discord-muted">Pendengar Aktif</p>
            <p className="text-lg md:text-2xl font-bold text-white">
              {botStatus?.currentListeners || 0}
            </p>
          </div>
          <div className="bg-green-500 bg-opacity-20 rounded-full p-2 md:p-3 animate-pulse">
            <Users className="text-green-400 w-4 h-4 md:w-6 md:h-6" />
          </div>
        </div>
        <div className="mt-2 md:mt-4 flex items-center text-xs md:text-sm">
          <span className="text-green-400">↗</span>
          <span className="text-green-400 ml-1">12%</span>
          <span className="text-discord-muted ml-1 hidden sm:inline">dari jam terakhir</span>
        </div>
      </div>

      {/* Uptime */}
      <div className="bg-gradient-to-br from-discord-medium via-discord-medium to-blue-500/10 rounded-xl p-4 md:p-6 border border-discord-light hover:border-blue-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-400/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs md:text-sm text-discord-muted">Waktu Aktif</p>
            <p className="text-lg md:text-2xl font-bold text-white">
              {botStatus?.uptime ? formatUptime(botStatus.uptime) : '0d 0h 0m'}
            </p>
          </div>
          <div className="bg-blue-500 bg-opacity-20 rounded-full p-2 md:p-3">
            <Clock className="text-blue-400 w-4 h-4 md:w-6 md:h-6" />
          </div>
        </div>
        <div className="mt-2 md:mt-4">
          <span className="text-xs md:text-sm text-green-400">
            {availabilityPercentage}% <span className="hidden sm:inline">ketersediaan</span>
          </span>
        </div>
      </div>

      {/* Active Stations */}
      <div className="bg-gradient-to-br from-discord-medium via-discord-medium to-purple-500/10 rounded-xl p-4 md:p-6 border border-discord-light hover:border-purple-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-400/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs md:text-sm text-discord-muted">Stasiun Aktif</p>
            <p className="text-lg md:text-2xl font-bold text-white">{activeStations}</p>
          </div>
          <div className="bg-purple-500 bg-opacity-20 rounded-full p-2 md:p-3">
            <Radio className="text-purple-400 w-4 h-4 md:w-6 md:h-6" />
          </div>
        </div>
        <div className="mt-2 md:mt-4">
          <span className="text-xs md:text-sm text-discord-muted">
            {stations.length} <span className="hidden sm:inline">total stasiun</span>
          </span>
        </div>
      </div>

      {/* Memory Usage */}
      <div className="bg-gradient-to-br from-discord-medium via-discord-medium to-yellow-500/10 rounded-xl p-6 border border-discord-light hover:border-yellow-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-400/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-discord-muted">Penggunaan Memori</p>
            <p className="text-2xl font-bold text-white">
              {botStatus?.memoryUsage || 0}%
            </p>
          </div>
          <div className="bg-yellow-500 bg-opacity-20 rounded-full p-3">
            <Cpu className="text-yellow-400 w-6 h-6" />
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-discord-light rounded-full h-2">
            <div 
              className="bg-yellow-400 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${botStatus?.memoryUsage || 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
