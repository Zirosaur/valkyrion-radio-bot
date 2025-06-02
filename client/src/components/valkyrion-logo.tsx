import { useBotInfo } from "@/hooks/use-bot-info";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function ValkyrionLogo({ size = 48 }: { size?: number }) {
  const { data: botInfo } = useBotInfo();

  // If bot avatar is available, use it
  if (botInfo?.avatar) {
    return (
      <Avatar className={`w-${Math.floor(size/4)} h-${Math.floor(size/4)}`} style={{ width: size, height: size }}>
        <AvatarImage 
          src={botInfo.avatar}
          alt="Valkyrion Bot"
          className="object-cover"
        />
        <AvatarFallback className="bg-[#5865F2] text-white font-bold text-lg">
          V
        </AvatarFallback>
      </Avatar>
    );
  }

  // Fallback to SVG logo if bot avatar not available
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      {/* Background Circle */}
      <circle cx="256" cy="256" r="256" fill="url(#profileGradient)"/>
      
      {/* Gradient Definitions */}
      <defs>
        <linearGradient id="profileGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor:"#5865F2", stopOpacity:1}} />
          <stop offset="50%" style={{stopColor:"#4752C4", stopOpacity:1}} />
          <stop offset="100%" style={{stopColor:"#36393F", stopOpacity:1}} />
        </linearGradient>
        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{stopColor:"#00D4FF", stopOpacity:1}} />
          <stop offset="50%" style={{stopColor:"#5865F2", stopOpacity:1}} />
          <stop offset="100%" style={{stopColor:"#FF6B6B", stopOpacity:1}} />
        </linearGradient>
        <radialGradient id="micGradient" cx="50%" cy="30%" r="70%">
          <stop offset="0%" style={{stopColor:"#FFFFFF", stopOpacity:1}} />
          <stop offset="100%" style={{stopColor:"#E3E5E8", stopOpacity:1}} />
        </radialGradient>
      </defs>
      
      {/* Radio Waves Background */}
      <g opacity="0.3">
        <circle cx="256" cy="256" r="180" fill="none" stroke="url(#waveGradient)" strokeWidth="3" opacity="0.6"/>
        <circle cx="256" cy="256" r="150" fill="none" stroke="url(#waveGradient)" strokeWidth="2" opacity="0.4"/>
        <circle cx="256" cy="256" r="120" fill="none" stroke="url(#waveGradient)" strokeWidth="2" opacity="0.3"/>
      </g>
      
      {/* Main Microphone */}
      <g transform="translate(256,256)">
        {/* Microphone Stand */}
        <rect x="-8" y="60" width="16" height="80" fill="#4F545C" rx="8"/>
        <rect x="-25" y="130" width="50" height="8" fill="#4F545C" rx="4"/>
        
        {/* Microphone Body */}
        <ellipse cx="0" cy="0" rx="45" ry="65" fill="url(#micGradient)"/>
        <ellipse cx="0" cy="0" rx="38" ry="58" fill="#F3F4F6"/>
        
        {/* Microphone Grille */}
        <g opacity="0.6">
          <line x1="-25" y1="-40" x2="25" y2="-40" stroke="#9CA3AF" strokeWidth="1"/>
          <line x1="-30" y1="-30" x2="30" y2="-30" stroke="#9CA3AF" strokeWidth="1"/>
          <line x1="-32" y1="-20" x2="32" y2="-20" stroke="#9CA3AF" strokeWidth="1"/>
          <line x1="-34" y1="-10" x2="34" y2="-10" stroke="#9CA3AF" strokeWidth="1"/>
          <line x1="-35" y1="0" x2="35" y2="0" stroke="#9CA3AF" strokeWidth="1"/>
          <line x1="-34" y1="10" x2="34" y2="10" stroke="#9CA3AF" strokeWidth="1"/>
          <line x1="-32" y1="20" x2="32" y2="20" stroke="#9CA3AF" strokeWidth="1"/>
          <line x1="-30" y1="30" x2="30" y2="30" stroke="#9CA3AF" strokeWidth="1"/>
          <line x1="-25" y1="40" x2="25" y2="40" stroke="#9CA3AF" strokeWidth="1"/>
        </g>
        
        {/* Audio Wave Symbol */}
        <g transform="translate(0,-80)">
          <path d="M -15 -10 Q -15 -20, 0 -20 Q 15 -20, 15 -10" fill="none" stroke="#5865F2" strokeWidth="3"/>
          <path d="M -10 -5 Q -10 -10, 0 -10 Q 10 -10, 10 -5" fill="none" stroke="#5865F2" strokeWidth="2"/>
          <circle cx="0" cy="0" r="2" fill="#5865F2"/>
        </g>
      </g>
      
      {/* Musical Notes */}
      <g fill="#FBBF24">
        <circle cx="150" cy="180" r="4"/>
        <rect x="154" y="160" width="2" height="24"/>
        <path d="M 154 160 Q 164 155, 170 160" fill="#FBBF24"/>
        
        <circle cx="380" cy="320" r="3"/>
        <rect x="383" y="305" width="2" height="18"/>
        <path d="M 383 305 Q 390 302, 395 305" fill="#FBBF24"/>
      </g>
      
      {/* Discord-style shine */}
      <ellipse cx="200" cy="180" rx="30" ry="40" fill="white" opacity="0.2"/>
    </svg>
  );
}