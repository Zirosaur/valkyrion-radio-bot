import { useState } from "react";
import { Plus, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { RadioStation } from "@shared/schema";

interface RadioStationsProps {
  stations: RadioStation[];
}

export function RadioStations({ stations }: RadioStationsProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'recent'>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const selectStationMutation = useMutation({
    mutationFn: (stationId: number) => 
      apiRequest('POST', `/api/stations/${stationId}/select`),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Station selected successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bot/status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to select station",
        variant: "destructive",
      });
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: ({ stationId, isFavorite }: { stationId: number; isFavorite: boolean }) =>
      apiRequest('POST', `/api/stations/${stationId}/favorite`, { isFavorite }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stations'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update favorite",
        variant: "destructive",
      });
    },
  });

  const filteredStations = stations.filter(station => {
    switch (activeFilter) {
      case 'favorites':
        return station.isFavorite;
      case 'recent':
        return station.isActive;
      default:
        return true;
    }
  });

  const handleStationSelect = (station: RadioStation) => {
    console.log('Station selected:', station.name);
    selectStationMutation.mutate(station.id);
  };

  const handleFavoriteToggle = (e: React.MouseEvent, station: RadioStation) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Toggling favorite for:', station.name);
    favoriteMutation.mutate({
      stationId: station.id,
      isFavorite: !station.isFavorite
    });
  };

  return (
    <div className="mt-8 bg-discord-medium rounded-xl p-6 border border-discord-light">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Radio Stations</h3>
        <Button className="bg-discord-primary hover:bg-blue-600 text-white">
          <Plus className="mr-2 w-4 h-4" />
          Add Station
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6 bg-discord-light rounded-lg p-1">
        <Button
          variant={activeFilter === 'all' ? 'default' : 'ghost'}
          size="sm"
          className={`flex-1 ${
            activeFilter === 'all'
              ? 'bg-discord-primary text-white'
              : 'text-discord-muted hover:text-white'
          }`}
          onClick={() => setActiveFilter('all')}
        >
          All
        </Button>
        <Button
          variant={activeFilter === 'favorites' ? 'default' : 'ghost'}
          size="sm"
          className={`flex-1 ${
            activeFilter === 'favorites'
              ? 'bg-discord-primary text-white'
              : 'text-discord-muted hover:text-white'
          }`}
          onClick={() => setActiveFilter('favorites')}
        >
          Favorites
        </Button>
        <Button
          variant={activeFilter === 'recent' ? 'default' : 'ghost'}
          size="sm"
          className={`flex-1 ${
            activeFilter === 'recent'
              ? 'bg-discord-primary text-white'
              : 'text-discord-muted hover:text-white'
          }`}
          onClick={() => setActiveFilter('recent')}
        >
          Recently Played
        </Button>
      </div>

      {/* Stations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStations.map((station) => (
          <Card
            key={station.id}
            className="bg-discord-light border-discord-light hover:bg-discord-medium transition-colors cursor-pointer group p-4 select-none"
            onClick={() => handleStationSelect(station)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleStationSelect(station);
              }
            }}
          >
            <div className="flex items-center space-x-3 mb-3">
              <img 
                src={station.artwork || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=60&h=60&fit=crop"} 
                alt={`${station.name} artwork`} 
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-white group-hover:text-discord-primary transition-colors truncate">
                  {station.name}
                </h4>
                <p className="text-sm text-discord-muted truncate">{station.genre}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className={`opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 ${
                  station.isFavorite 
                    ? 'text-red-400 hover:text-red-300' 
                    : 'text-discord-muted hover:text-white'
                }`}
                onClick={(e) => handleFavoriteToggle(e, station)}
                disabled={favoriteMutation.isPending}
              >
                <Heart className={`w-4 h-4 ${station.isFavorite ? 'fill-current' : ''}`} />
              </Button>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-discord-muted">
                {station.listeners || 0} listeners
              </span>
              <span className="text-green-400">{station.quality}</span>
            </div>
          </Card>
        ))}
      </div>

      {filteredStations.length === 0 && (
        <div className="text-center py-12">
          <div className="text-discord-muted mb-4">
            <i className="fas fa-radio text-4xl"></i>
          </div>
          <h4 className="text-lg font-medium text-white mb-2">
            {activeFilter === 'favorites' ? 'No favorite stations' : 
             activeFilter === 'recent' ? 'No recently played stations' : 
             'No stations available'}
          </h4>
          <p className="text-discord-muted">
            {activeFilter === 'favorites' ? 'Mark stations as favorites to see them here' : 
             activeFilter === 'recent' ? 'Play some stations to see them here' : 
             'Add some radio stations to get started'}
          </p>
        </div>
      )}
    </div>
  );
}
