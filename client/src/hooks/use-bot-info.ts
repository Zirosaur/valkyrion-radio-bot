import { useQuery } from '@tanstack/react-query';

interface BotInfo {
  id: string;
  username: string;
  tag: string;
  avatar: string | null;
  isOnline: boolean;
  serverCount: number;
}

export function useBotInfo() {
  return useQuery<BotInfo>({
    queryKey: ['/api/bot/info'],
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 3
  });
}