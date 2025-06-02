import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  username: string;
  discordUsername?: string;
  discordAvatar?: string;
  discordId?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async (retryCount = 0) => {
    try {
      const response = await fetch('/api/auth/user', {
        credentials: 'include',
        cache: 'no-cache'
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else if (response.status === 401) {
        setUser(null);
      } else if (retryCount < 2) {
        // Retry on network errors
        setTimeout(() => checkAuthStatus(retryCount + 1), 1000);
        return;
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      if (retryCount < 2) {
        setTimeout(() => checkAuthStatus(retryCount + 1), 1000);
        return;
      }
      setUser(null);
    } finally {
      if (retryCount === 0) {
        setLoading(false);
      }
    }
  };

  const login = () => {
    window.location.href = '/auth/discord';
  };

  const logout = async () => {
    try {
      await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setUser(null);
      window.location.reload();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getUserServers = async () => {
    if (!user) return [];
    
    try {
      const response = await fetch('/api/auth/servers', {
        credentials: 'include'
      });
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching user servers:', error);
      return [];
    }
  };

  return {
    user,
    loading,
    login,
    logout,
    getUserServers,
    isAuthenticated: !!user
  };
}