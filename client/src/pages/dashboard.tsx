import { StatusCards } from "@/components/dashboard/status-cards";
import { NowPlaying } from "@/components/dashboard/now-playing";
import { RadioStations } from "@/components/dashboard/radio-stations";
import { ServerInfo } from "@/components/dashboard/server-info";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { HeaderServerSelector } from "@/components/dashboard/header-server-selector";
import { Sidebar } from "@/components/dashboard/sidebar";
import { useWebSocket } from "@/hooks/use-websocket";
import { BotInvite } from "@/components/bot-invite";
import { DiscordLogin } from "@/components/auth/discord-login";
import { ValkyrionLogo } from "@/components/valkyrion-logo";
import { useAuth } from "@/hooks/use-auth";
import { useUserRole } from "@/hooks/use-user-role";
import { useState, useEffect } from "react";
import { Menu, LogIn, User, Home, Plus, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function ControlPanel() {
  const { botStatus, servers, stations, isConnected } = useWebSocket();
  const { user, loading, login, logout, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const { role: userRole } = useUserRole(selectedServer);
  const { toast } = useToast();

  // Bot invite functions
  const botClientId = "1293281550565113987";
  const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${botClientId}&permissions=3148800&scope=bot%20applications.commands`;

  const handleInviteBot = () => {
    window.open(inviteUrl, '_blank');
    toast({
      title: "Mengundang Bot",
      description: "Halaman undangan Discord telah dibuka di tab baru"
    });
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: "Link Disalin",
      description: "Link undangan bot telah disalin ke clipboard"
    });
  };

  useEffect(() => {
    if (!selectedServer && servers.length > 0) {
      setSelectedServer(servers[0].id);
    }
  }, [servers, selectedServer]);

  if (loading) {
    return (
      <div className="min-h-screen bg-discord-dark flex items-center justify-center">
        <div className="text-white text-lg">Memuat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-discord-dark text-discord-text">
      <div className="flex h-screen">
        {/* Mobile Menu Button */}
        <div className="md:hidden fixed top-4 left-4 z-50">
          <Button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            variant="outline"
            size="sm"
            className="bg-discord-medium border-discord-light text-white"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* Sidebar - Hidden on mobile unless menu is open */}
        <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block fixed md:relative inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out md:transform-none`}>
          <Sidebar botStatus={botStatus} />
        </div>

        {/* Overlay for mobile */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-discord-medium border-b border-discord-light sticky top-0 z-20">
            <div className="flex items-center justify-between px-3 py-2">
              {/* Left section - Mobile friendly */}
              <div className="flex items-center space-x-2 ml-12 md:ml-0">
                <ValkyrionLogo size={24} />
                <div>
                  <h1 className="text-sm font-bold text-white">Valkyrion</h1>
                  <p className="text-xs text-discord-muted hidden sm:block">Radio Bot Dashboard</p>
                </div>
              </div>
              
              {/* Right section */}
              <div className="flex items-center space-x-2">
                {/* Invite Bot Button - Hidden on mobile */}
                {isAuthenticated && (
                  <div className="hidden md:flex items-center space-x-2">
                    <Button
                      onClick={handleInviteBot}
                      size="sm"
                      className="bg-discord-primary hover:bg-blue-600 text-white"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Undang Bot
                    </Button>
                    <Button
                      onClick={copyInviteLink}
                      size="sm"
                      variant="outline"
                      className="border-discord-light text-discord-text hover:bg-discord-light"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {!isAuthenticated ? (
                  <Button
                    onClick={login}
                    size="sm"
                    className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-medium transition-colors"
                  >
                    <LogIn className="w-3 h-3 mr-1" />
                    <span className="hidden xs:inline">Login Discord</span>
                    <span className="xs:hidden">Login</span>
                  </Button>
                ) : (
                  <DiscordLogin 
                    user={user} 
                    onLogin={login} 
                    onLogout={logout} 
                    compact={true}
                  />
                )}
              </div>
            </div>
            
            {/* Server Selector - Below header on mobile */}
            {isAuthenticated && servers.length > 0 && (
              <div className="px-4 py-2 border-t border-discord-light bg-discord-dark">
                <HeaderServerSelector
                  servers={servers}
                  selectedServer={selectedServer}
                  onServerSelect={setSelectedServer}
                  userRole={userRole}
                />
              </div>
            )}
          </header>

          {/* Dashboard Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 md:py-6">
              {/* Connection Status */}
              {!isConnected && (
                <div className="mb-4 md:mb-6 bg-yellow-600 bg-opacity-20 border border-yellow-600 rounded-lg p-3 md:p-4">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-exclamation-triangle text-yellow-400"></i>
                    <span className="text-yellow-200 text-sm md:text-base">Menghubungkan kembali ke server...</span>
                  </div>
                </div>
              )}

              {/* Status Cards */}
              <div className="mb-6 md:mb-8">
                <StatusCards botStatus={botStatus} stations={stations} />
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Left Column - Main Content */}
                <div className="lg:col-span-2 space-y-4 md:space-y-6">
                  {/* Now Playing Card */}
                  <NowPlaying botStatus={botStatus} stations={stations} selectedServer={selectedServer} />
                  
                  {/* Live Statistics */}
                  <div className="bg-discord-medium rounded-xl p-4 md:p-6 border border-discord-light">
                    <h3 className="text-lg md:text-xl font-semibold text-white mb-4 md:mb-6 flex items-center">
                      <i className="fas fa-chart-bar mr-3 text-blue-400"></i>
                      Statistik Live
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                      <div className="text-center p-3 md:p-4 bg-discord-dark rounded-lg">
                        <div className="text-lg md:text-2xl font-bold text-green-400">{servers.length}</div>
                        <div className="text-xs md:text-sm text-discord-muted">Server Aktif</div>
                      </div>
                      <div className="text-center p-3 md:p-4 bg-discord-dark rounded-lg">
                        <div className="text-lg md:text-2xl font-bold text-blue-400">{stations.length}</div>
                        <div className="text-xs md:text-sm text-discord-muted">Total Stasiun</div>
                      </div>
                      <div className="text-center p-3 md:p-4 bg-discord-dark rounded-lg">
                        <div className="text-lg md:text-2xl font-bold text-purple-400">
                          {stations.filter(s => s.isActive).length}
                        </div>
                        <div className="text-xs md:text-sm text-discord-muted">Sedang Aktif</div>
                      </div>
                      <div className="text-center p-3 md:p-4 bg-discord-dark rounded-lg">
                        <div className="text-lg md:text-2xl font-bold text-yellow-400">
                          {stations.reduce((total, station) => total + station.listeners, 0)}
                        </div>
                        <div className="text-xs md:text-sm text-discord-muted">Total Pendengar</div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions - Mobile friendly */}
                  <div className="md:hidden">
                    <QuickActions />
                  </div>
                </div>

                {/* Right Column - Sidebar Content */}
                <div className="space-y-4 md:space-y-6">
                  {/* Server Info */}
                  <ServerInfo servers={servers} />
                  
                  {/* Radio Stations */}
                  <RadioStations stations={stations} />
                  
                  {/* Quick Actions - Desktop */}
                  <div className="hidden md:block">
                    <QuickActions />
                  </div>

                  {/* Bot Invite Card */}
                  <BotInvite />
                </div>
              </div>

              {/* Mobile Action Buttons */}
              {isAuthenticated && (
                <div className="md:hidden fixed bottom-4 right-4 flex flex-col space-y-2">
                  <Button
                    onClick={handleInviteBot}
                    size="sm"
                    className="bg-discord-primary hover:bg-blue-600 text-white shadow-lg"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Undang Bot
                  </Button>
                </div>
              )}

              {/* Footer */}
              <footer className="mt-8 text-center text-discord-muted text-sm pb-8">
                <div className="border-t border-discord-light pt-6">
                  <p>Valkyrion Radio Bot - Streaming 24/7 di berbagai server Discord</p>
                  <p className="mt-2">Dashboard real-time • Kontrol Discord interaktif • Berbagai genre stasiun</p>
                </div>
              </footer>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}