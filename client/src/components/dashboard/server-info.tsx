import { Hash, Gamepad, Users } from "lucide-react";
import type { DiscordServer } from "@shared/schema";

interface ServerInfoProps {
  servers: DiscordServer[];
}

export function ServerInfo({ servers }: ServerInfoProps) {
  const getServerIcon = (name: string) => {
    if (name.toLowerCase().includes('music')) return Hash;
    if (name.toLowerCase().includes('gaming') || name.toLowerCase().includes('game')) return Gamepad;
    return Users;
  };

  const getServerColor = (index: number) => {
    const colors = [
      'bg-discord-primary',
      'bg-purple-600',
      'bg-red-600',
      'bg-green-600',
      'bg-yellow-600',
      'bg-pink-600'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="bg-discord-medium rounded-xl p-6 border border-discord-light">
      <h3 className="text-lg font-semibold text-white mb-4">Connected Servers</h3>
      
      {servers.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-discord-muted mb-2">
            <i className="fas fa-server text-2xl"></i>
          </div>
          <p className="text-sm text-discord-muted">No servers connected</p>
          <p className="text-xs text-discord-muted mt-1">
            Invite the bot to a Discord server to get started
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {servers.map((server, index) => {
            const IconComponent = getServerIcon(server.name);
            const colorClass = getServerColor(index);
            
            return (
              <div key={server.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${colorClass} rounded-full flex items-center justify-center`}>
                    <IconComponent className="text-white w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{server.name}</p>
                    <p className="text-xs text-discord-muted">
                      {server.memberCount?.toLocaleString() || 0} members
                    </p>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  server.isConnected ? 'bg-green-400' : 'bg-red-400'
                }`} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
