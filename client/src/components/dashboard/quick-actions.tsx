import { MessageSquare, Hash, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function QuickActions() {
  return (
    <div className="bg-discord-medium rounded-xl p-6 border border-discord-light">
      <h3 className="text-lg font-semibold text-white mb-4">Discord Commands</h3>
      <div className="space-y-4">
        <div className="bg-discord-dark rounded-lg p-4 border border-discord-light/20">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <span className="text-white font-medium">Kontrol Radio</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-green-400 border-green-400/30">
                /radio play
              </Badge>
              <span className="text-gray-400">- Mulai radio</span>
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-yellow-400 border-yellow-400/30">
                /radio pause
              </Badge>
              <span className="text-gray-400">- Pause radio</span>
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-red-400 border-red-400/30">
                /radio stop
              </Badge>
              <span className="text-gray-400">- Stop radio</span>
            </div>
          </div>
        </div>

        <div className="bg-discord-dark rounded-lg p-4 border border-discord-light/20">
          <div className="flex items-center gap-2 mb-2">
            <Volume2 className="w-4 h-4 text-purple-400" />
            <span className="text-white font-medium">Pilih Stasiun</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-blue-400 border-blue-400/30">
                /radio play station:lofi
              </Badge>
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-purple-400 border-purple-400/30">
                /stations
              </Badge>
              <span className="text-gray-400">- Lihat semua stasiun</span>
            </div>
          </div>
        </div>

        <div className="bg-orange-500/10 rounded-lg p-3 border border-orange-500/20">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-orange-400" />
            <span className="text-orange-300 text-sm font-medium">
              Gunakan commands di voice channel Discord untuk kontrol yang aman
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
