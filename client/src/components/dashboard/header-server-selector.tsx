import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Server, Crown, Shield, Users, Settings } from "lucide-react";
import type { DiscordServer } from "@shared/schema";

interface HeaderServerSelectorProps {
  servers: DiscordServer[];
  selectedServer: string | null;
  onServerSelect: (serverId: string) => void;
  userRole?: string;
}

const getRoleIcon = (role: string) => {
  switch (role.toLowerCase()) {
    case 'owner':
      return <Crown className="w-3 h-3" />;
    case 'admin':
    case 'administrator':
      return <Shield className="w-3 h-3" />;
    case 'moderator':
    case 'mod':
      return <Settings className="w-3 h-3" />;
    default:
      return <Users className="w-3 h-3" />;
  }
};

const getRoleColor = (role: string) => {
  switch (role.toLowerCase()) {
    case 'owner':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'admin':
    case 'administrator':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'moderator':
    case 'mod':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

export function HeaderServerSelector({ servers, selectedServer, onServerSelect, userRole = 'member' }: HeaderServerSelectorProps) {
  const selectedServerData = servers.find(s => s.id === selectedServer);

  if (servers.length === 0) return null;

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2 text-sm text-discord-muted">
        <Server className="w-4 h-4" />
        <span>Server:</span>
      </div>
      
      <Select value={selectedServer || ""} onValueChange={onServerSelect}>
        <SelectTrigger className="bg-discord-dark border-discord-light text-white w-48">
          <SelectValue placeholder="Pilih server..." />
        </SelectTrigger>
        <SelectContent className="bg-discord-dark border-discord-light">
          {servers.map((server) => (
            <SelectItem key={server.id} value={server.id} className="text-white hover:bg-discord-medium">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {server.name[0]}
                </div>
                <span className="truncate max-w-[120px]">{server.name}</span>
                {server.isConnected && (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedServerData && (
        <Badge variant="secondary" className={getRoleColor(userRole)}>
          {getRoleIcon(userRole)}
          <span className="ml-1 capitalize">{userRole}</span>
        </Badge>
      )}
    </div>
  );
}