import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Music, Beer, Mic2, ShoppingCart } from 'lucide-react';

export default function NinetyNineBottlesVisualization() {
  const [count, setCount] = useState(99);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1500); // ms per step
  const [currentLine, setCurrentLine] = useState(0); // 0-3 for the 4 lines of a verse

  // Auto-play logic
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentLine((prev) => {
          if (prev < 3) return prev + 1;
          
          // End of verse
          if (count === 0) {
            // Reset after the last verse
            setCount(99);
            return 0;
          }
          
          setCount((c) => c - 1);
          return 0;
        });
      }, speed / 2); // 2 steps per bottle removal roughly
    }
    return () => clearInterval(interval);
  }, [isPlaying, count, speed]);

  // Helper to get lyrics based on current state
  const getLyrics = () => {
    if (count === 0) {
      return [
        "No more bottles of beer on the wall,",
        "No more bottles of beer.",
        "Go to the store and buy some more,",
        "99 bottles of beer on the wall."
      ];
    }

    const nextCount = count - 1;
    const bottleStr = (n: number) => n === 1 ? "bottle" : "bottles";
    const nextCountStr = nextCount === 0 ? "No more" : nextCount;
    const nextBottleStr = nextCount === 1 ? "bottle" : "bottles";

    return [
      `${count} ${bottleStr(count)} of beer on the wall,`,
      `${count} ${bottleStr(count)} of beer.`,
      "Take one down, pass it around,",
      `${nextCountStr} ${nextBottleStr} of beer on the wall.`
    ];
  };

  const lyrics = getLyrics();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* Jukebox Header */}
      <div className="glass p-6 rounded-3xl border border-purple-500/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-pink-900/20 to-purple-900/20 animate-pulse" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-full bg-purple-500/20 border border-purple-400/50 shadow-[0_0_15px_rgba(168,85,247,0.5)]">
              <Music size={32} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]" style={{ fontFamily: '"Orbitron", sans-serif' }}>
                NEON JUKEBOX
              </h2>
              <p className="text-purple-300 font-medium tracking-wider">NOW PLAYING: 99 BOTTLES</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-black/40 p-2 rounded-2xl border border-purple-500/30 backdrop-blur-sm">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-3 rounded-xl transition-all ${
                isPlaying 
                  ? 'bg-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.5)]' 
                  : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/40'
              }`}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            
            <button
              onClick={() => { setCount(99); setIsPlaying(false); setCurrentLine(0); }}
              className="p-3 rounded-xl bg-purple-500/20 text-purple-300 hover:bg-purple-500/40 transition-all"
            >
              <RotateCcw size={24} />
            </button>

            <div className="h-8 w-px bg-purple-500/30 mx-1" />

            <div className="flex flex-col gap-1 px-2">
              <label className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Tempo</label>
              <input
                type="range"
                min="200"
                max="3000"
                step="100"
                value={3200 - speed} // Invert so right is faster
                onChange={(e) => setSpeed(3200 - parseInt(e.target.value))}
                className="w-24 h-1.5 bg-purple-900/50 rounded-full appearance-none cursor-pointer accent-pink-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Lyrics Display (Karaoke Style) */}
        <div className="lg:col-span-5 order-2 lg:order-1">
          <div className="glass h-full min-h-[300px] p-8 rounded-3xl border border-pink-500/30 flex flex-col justify-center items-center text-center relative overflow-hidden group">
             {/* Background Equalizer Effect */}
             <div className="absolute inset-0 flex items-end justify-center gap-1 opacity-20 pointer-events-none">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      height: isPlaying ? [10 + Math.random() * 20 + '%', 30 + Math.random() * 50 + '%', 10 + Math.random() * 20 + '%'] : '10%' 
                    }}
                    transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                    className="w-2 bg-pink-500 rounded-t-sm"
                  />
                ))}
             </div>

            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs font-bold uppercase tracking-widest mb-4">
                <Mic2 size={12} />
                Karaoke Mode
              </div>

              <div className="space-y-4">
                {lyrics.map((line, idx) => (
                  <motion.p
                    key={idx}
                    animate={{ 
                      scale: currentLine === idx ? 1.1 : 1,
                      opacity: currentLine === idx ? 1 : 0.4,
                      color: currentLine === idx ? '#fff' : '#a855f7'
                    }}
                    className={`text-xl md:text-2xl font-bold transition-colors duration-300 ${
                      currentLine === idx ? 'drop-shadow-[0_0_10px_rgba(236,72,153,0.8)]' : ''
                    }`}
                  >
                    {line}
                  </motion.p>
                ))}
              </div>
              
              {count === 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mt-8 p-4 rounded-xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 flex items-center justify-center gap-3"
                >
                  <ShoppingCart size={24} />
                  <span className="font-bold">Time to restock!</span>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* The Wall of Beer */}
        <div className="lg:col-span-7 order-1 lg:order-2">
          <div className="glass p-6 rounded-3xl border border-cyan-500/30 relative min-h-[500px]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 px-6 py-2 bg-slate-900/80 border-b border-x border-cyan-500/30 rounded-b-xl text-cyan-400 font-mono font-bold text-xl z-20 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              {count} BOTTLES
            </div>

            <div className="grid grid-cols-10 gap-2 mt-12 p-2">
              <AnimatePresence mode='popLayout'>
                {Array.from({ length: count }).map((_, i) => (
                  <motion.div
                    key={99 - i} // Key by bottle ID (99 down to 1)
                    layout
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ 
                      scale: [1, 1.5, 0], 
                      rotate: [0, 20, -20, 0], 
                      opacity: 0,
                      filter: "blur(10px)"
                    }}
                    transition={{ duration: 0.4 }}
                    className="aspect-[1/2] relative group cursor-pointer"
                    onClick={() => {
                      if (!isPlaying && count > 0) {
                        setCount(c => c - 1);
                        setCurrentLine(0);
                      }
                    }}
                  >
                    <div className="absolute inset-0 bg-cyan-500/10 rounded-md border border-cyan-500/30 group-hover:bg-cyan-400/20 group-hover:border-cyan-400/60 transition-all flex items-center justify-center overflow-hidden">
                      <div className="absolute bottom-0 left-0 right-0 h-[10%] bg-cyan-500/40 blur-sm" />
                      <Beer size={20} className="text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {/* Placeholders for empty spots to maintain grid structure if desired, 
                  or let it shrink. Let's let it shrink but keep container height? 
                  Actually, let's just show the remaining bottles. 
              */}
            </div>
            
            {count === 0 && (
               <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-4"
                  >
                    <div className="text-6xl">🛒</div>
                    <h3 className="text-2xl font-bold text-slate-300">Wall Empty!</h3>
                    <button 
                      onClick={() => setCount(99)}
                      className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-full shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all"
                    >
                      Buy More Beer
                    </button>
                  </motion.div>
               </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
