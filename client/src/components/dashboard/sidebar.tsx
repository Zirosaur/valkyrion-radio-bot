import { Radio, Activity, Music, Users, Globe, Headphones } from "lucide-react";
import { ValkyrionLogo } from "@/components/valkyrion-logo";
import type { BotStatus } from "@shared/schema";

interface SidebarProps {
  botStatus: BotStatus | null;
}

export function Sidebar({ botStatus }: SidebarProps) {
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <div className="w-64 bg-discord-medium border-r border-discord-light flex flex-col h-full">
      {/* Logo/Header */}
      <div className="p-4 md:p-6 border-b border-discord-light">
        <div className="flex items-center space-x-2 md:space-x-3">
          <ValkyrionLogo size={28} />
          <div>
            <h1 className="text-base md:text-lg font-semibold text-white">Valkyrion</h1>
            <p className="text-xs md:text-sm text-discord-muted">Radio Dashboard</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-3 md:px-4 py-4 md:py-6 space-y-3 md:space-y-4">
        <div className="bg-discord-dark rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Activity className="w-5 h-5 text-green-400" />
            <div>
              <div className="text-sm font-medium text-white">Live Status</div>
              <div className={`text-xs ${botStatus?.isOnline ? 'text-green-400' : 'text-red-400'}`}>
                {botStatus?.isOnline ? 'Broadcasting' : 'Offline'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-discord-dark rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Music className="w-5 h-5 text-purple-400" />
            <div>
              <div className="text-sm font-medium text-white">Now Playing</div>
              <div className="text-xs text-discord-muted">
                {botStatus?.currentStationId ? 'Active station' : 'No station'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-discord-dark rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Users className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-sm font-medium text-white">Servers</div>
              <div className="text-xs text-discord-muted">2 active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="px-4 py-4 flex-1">
        <h3 className="text-sm font-medium text-discord-muted mb-3 uppercase tracking-wider">Features</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 text-sm text-discord-muted">
            <Globe className="w-4 h-4" />
            <span>24/7 Streaming</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-discord-muted">
            <Headphones className="w-4 h-4" />
            <span>Multiple Genres</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-discord-muted">
            <Activity className="w-4 h-4" />
            <span>Real-time Control</span>
          </div>
        </div>
      </div>

      {/* Bot Status Footer */}
      <div className="p-4 border-t border-discord-light">
        <div className="flex items-center justify-between">
          <span className="text-sm text-discord-muted">System Status</span>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              botStatus?.isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'
            }`} />
            <span className={`text-sm font-medium ${
              botStatus?.isOnline ? 'text-green-400' : 'text-red-400'
            }`}>
              {botStatus?.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
        {botStatus?.uptime && (
          <div className="mt-2 text-xs text-discord-muted">
            Uptime: {formatUptime(botStatus.uptime)}
          </div>
        )}
        <div className="mt-1 text-xs text-discord-muted">
          Bot Version: v2.0.1
        </div>
      </div>
    </div>
  );
}
