import { Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export function BotInvite() {
  const { toast } = useToast();
  
  // Bot Client ID - sesuai dengan bot Valkyrion yang aktif
  const botClientId = "1293281550565113987";
  
  // Permission yang diperlukan untuk bot radio: 36727824
  // Mencakup: View Channels, Manage Channels, Send Messages, Manage Messages, Embed Links, Connect, Speak, Use Voice Activity
  const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${botClientId}&permissions=36727824&scope=bot%20applications.commands`;
  
  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: "Link disalin!",
      description: "Link invite bot telah disalin ke clipboard",
    });
  };
  
  const openInviteLink = () => {
    window.open(inviteUrl, '_blank');
  };

  return (
    <Card className="bg-discord-medium border-discord-light p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Invite Bot ke Server</h3>
      
      <div className="space-y-4">
        <p className="text-discord-muted text-sm">
          Untuk menggunakan bot radio, Anda perlu mengundang bot ke server Discord Anda terlebih dahulu.
        </p>
        
        <div className="bg-discord-light rounded-lg p-4">
          <p className="text-white font-medium mb-2">Permissions yang dibutuhkan:</p>
          <ul className="text-discord-muted text-sm space-y-1">
            <li>• <strong>Voice:</strong> Connect, Speak, Use Voice Activity</li>
            <li>• <strong>Text:</strong> Send Messages, Manage Messages, Embed Links</li>
            <li>• <strong>Channel:</strong> View Channels, Manage Channels</li>
            <li>• <strong>Commands:</strong> Use Slash Commands</li>
          </ul>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            onClick={openInviteLink}
            className="flex-1 bg-discord-primary hover:bg-blue-600 text-white"
          >
            <ExternalLink className="mr-2 w-4 h-4" />
            Invite Bot ke Server
          </Button>
          
          <Button 
            variant="outline" 
            onClick={copyInviteLink}
            className="border-discord-light text-discord-text hover:bg-discord-light"
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="bg-blue-600 bg-opacity-20 border border-blue-600 rounded-lg p-3">
          <p className="text-blue-200 text-sm">
            <strong>Langkah setelah invite:</strong>
          </p>
          <ol className="text-blue-200 text-sm mt-2 space-y-1 ml-4">
            <li>1. Bot akan otomatis membuat channel 📻｜Radio Hub dan 📻｜radio-control</li>
            <li>2. Masuk ke voice channel 📻｜Radio Hub untuk mendengarkan musik</li>
            <li>3. Gunakan slash command /radio atau dropdown di channel control</li>
            <li>4. Refresh dashboard ini untuk melihat server baru</li>
          </ol>
        </div>
        
        <div className="text-center pt-2">
          <p className="text-discord-muted text-xs">
            Link invite sudah dikonfigurasi dengan permission lengkap untuk bot radio
          </p>
        </div>
      </div>
    </Card>
  );
}