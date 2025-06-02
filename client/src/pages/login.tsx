import { useAuth } from "@/hooks/use-auth";
import { DiscordLogin } from "@/components/auth/discord-login";
import { useLocation } from "wouter";

export default function Login() {
  const { user, loading, login, logout, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    setLocation("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Valkyrion Radio
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Dashboard kontrol radio Discord
          </p>
        </div>
        
        <DiscordLogin 
          user={user}
          onLogin={login}
          onLogout={logout}
        />
        
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Belum memiliki akses? Pastikan bot Valkyrion sudah bergabung dengan server Discord Anda
          </p>
        </div>
      </div>
    </div>
  );
}