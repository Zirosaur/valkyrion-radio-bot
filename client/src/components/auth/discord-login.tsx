import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LogIn, Shield, Server } from "lucide-react";

interface User {
  id: number;
  username: string;
  discordUsername?: string;
  discordAvatar?: string;
  discordId?: string;
}

interface DiscordLoginProps {
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  compact?: boolean;
}

export function DiscordLogin({ user, onLogin, onLogout, compact = false }: DiscordLoginProps) {
  if (user) {
    if (compact) {
      // Compact version for header
      return (
        <div className="flex items-center space-x-2">
          <Avatar className="w-8 h-8">
            {user.discordAvatar && user.discordId && (
              <AvatarImage 
                src={`https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png`}
                alt="Avatar"
              />
            )}
            <AvatarFallback className="bg-blue-500 text-white font-bold text-sm">
              {user.discordUsername?.[0] || user.username[0]}
            </AvatarFallback>
          </Avatar>
          <span className="text-white text-sm font-medium hidden sm:inline">
            {user.discordUsername || user.username}
          </span>
          <Button 
            onClick={onLogout}
            variant="outline" 
            size="sm"
            className="bg-discord-medium border-discord-light text-white hover:bg-discord-light text-xs"
          >
            Logout
          </Button>
        </div>
      );
    }

    // Full version for main content
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Shield className="h-5 w-5 text-green-500" />
            <CardTitle className="text-lg">Berhasil Login</CardTitle>
          </div>
          <CardDescription>
            Selamat datang kembali di Valkyrion Radio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              {user.discordAvatar && user.discordId && (
                <AvatarImage 
                  src={`https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png`}
                  alt="Avatar"
                />
              )}
              <AvatarFallback className="bg-blue-500 text-white font-bold">
                {user.discordUsername?.[0] || user.username[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.discordUsername || user.username}</p>
              <Badge variant="secondary" className="text-xs">
                <Server className="w-3 h-3 mr-1" />
                Discord Member
              </Badge>
            </div>
          </div>
          
          <div className="pt-2">
            <Button 
              onClick={onLogout}
              variant="outline" 
              className="w-full"
            >
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <LogIn className="h-5 w-5 text-blue-500" />
          <CardTitle className="text-lg">Login dengan Discord</CardTitle>
        </div>
        <CardDescription>
          Masuk untuk mengakses kontrol radio server Anda
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span>Akses terbatas pada server Anda saja</span>
          </div>
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-blue-500" />
            <span>Kontrol radio yang dipersonalisasi</span>
          </div>
        </div>
        
        <Button 
          onClick={onLogin}
          className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white"
        >
          <LogIn className="w-4 h-4 mr-2" />
          Login dengan Discord
        </Button>
        
        <p className="text-xs text-center text-muted-foreground">
          Dengan login, Anda hanya akan melihat server Discord tempat bot Valkyrion berada
        </p>
      </CardContent>
    </Card>
  );
}