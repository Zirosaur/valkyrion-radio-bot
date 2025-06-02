import { useState, useEffect, useRef } from 'react';
import type { BotStatus, RadioStation, DiscordServer } from '@shared/schema';

interface ServerStatus {
  serverId: string;
  isPlaying: boolean;
  currentStation: RadioStation | null;
  volume: number;
  listeners: number;
}

interface WebSocketData {
  botStatus: BotStatus | null;
  stations: RadioStation[];
  servers: DiscordServer[];
  serverStatuses: Map<string, ServerStatus>;
  isConnected: boolean;
}

export function useWebSocket() {
  const [data, setData] = useState<WebSocketData>({
    botStatus: null,
    stations: [],
    servers: [],
    serverStatuses: new Map(),
    isConnected: false,
  });
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setData(prev => ({ ...prev, isConnected: true }));
        reconnectAttempts.current = 0;
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case 'initialData':
              setData(prev => ({
                ...prev,
                botStatus: message.data.botStatus,
                stations: message.data.stations || [],
                servers: message.data.servers || [],
              }));
              break;
              
            case 'botStatusUpdate':
              setData(prev => ({
                ...prev,
                botStatus: { ...prev.botStatus, ...message.data },
              }));
              break;
              
            case 'stationAdded':
              setData(prev => ({
                ...prev,
                stations: [...prev.stations, message.data],
              }));
              break;
              
            case 'stationUpdated':
              setData(prev => ({
                ...prev,
                stations: prev.stations.map(station =>
                  station.id === message.data.id ? message.data : station
                ),
              }));
              break;
              
            case 'stationDeleted':
              setData(prev => ({
                ...prev,
                stations: prev.stations.filter(station => station.id !== message.data.id),
              }));
              break;
              
            case 'serverUpdate':
              setData(prev => ({
                ...prev,
                servers: prev.servers.map(server =>
                  server.id === message.data.id 
                    ? { ...server, ...message.data }
                    : server
                ),
              }));
              break;
              
            default:
              console.log('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setData(prev => ({ ...prev, isConnected: false }));
        
        // Attempt to reconnect if not at max attempts
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`Attempting to reconnect in ${delay}ms...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  };

  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return data;
}
