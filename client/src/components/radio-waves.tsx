export function RadioWaves({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Animated Radio Waves */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-96 h-96 border-2 border-blue-500 rounded-full animate-ping"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border-2 border-purple-500 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-pink-500 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
        </div>
      </div>

      {/* Floating Musical Notes */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 text-2xl text-yellow-400 animate-bounce" style={{animationDelay: '0s'}}>♪</div>
        <div className="absolute top-32 right-20 text-xl text-blue-400 animate-bounce" style={{animationDelay: '1s'}}>♫</div>
        <div className="absolute bottom-32 left-20 text-lg text-green-400 animate-bounce" style={{animationDelay: '2s'}}>♬</div>
        <div className="absolute bottom-20 right-10 text-2xl text-purple-400 animate-bounce" style={{animationDelay: '3s'}}>♩</div>
      </div>
    </div>
  );
}