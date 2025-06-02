import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';

export function useUserRole(serverId: string | null) {
  const [role, setRole] = useState<string>('member');
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!serverId || !isAuthenticated) {
      setRole('member');
      return;
    }

    const fetchUserRole = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/auth/server/${serverId}/role`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setRole(data.role || 'member');
        } else {
          setRole('member');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole('member');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [serverId, isAuthenticated]);

  return { role, loading };
}