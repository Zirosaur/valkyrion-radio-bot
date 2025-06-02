import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Server, Users, Radio } from "lucide-react";
import type { DiscordServer } from "@shared/schema";

interface ServerSelectorProps {
  servers: DiscordServer[];
  selectedServer: string | null;
  onServerSelect: (serverId: string) => void;
}

export function ServerSelector({ servers, selectedServer, onServerSelect }: ServerSelectorProps) {
  const selectedServerData = servers.find(s => s.id === selectedServer);

  return (
    <Card className="bg-discord-medium border-discord-light">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2">
          <Server className="w-5 h-5" />
          Pilih Server Discord
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedServer || ""} onValueChange={onServerSelect}>
          <SelectTrigger className="bg-discord-dark border-discord-light text-white">
            <SelectValue placeholder="Pilih server untuk dikontrol..." />
          </SelectTrigger>
          <SelectContent className="bg-discord-dark border-discord-light">
            {servers.map((server) => (
              <SelectItem key={server.id} value={server.id} className="text-white hover:bg-discord-medium">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {server.name[0]}
                  </div>
                  <span>{server.name}</span>
                  {server.isConnected && (
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                      <Radio className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedServerData && (
          <div className="bg-discord-dark rounded-lg p-4 border border-discord-light">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                {selectedServerData.name[0]}
              </div>
              <div>
                <h3 className="text-white font-semibold">{selectedServerData.name}</h3>
                <div className="flex items-center gap-4 text-sm text-discord-muted">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {selectedServerData.memberCount || 0} members
                  </span>
                  {selectedServerData.isConnected ? (
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                      Bot Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                      Bot Offline
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {servers.length === 0 && (
          <div className="text-center py-8 text-discord-muted">
            <Server className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Tidak ada server yang tersedia.</p>
            <p className="text-sm">Bot belum terhubung ke server Discord mana pun.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}