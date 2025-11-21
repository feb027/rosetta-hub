import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Zap, CheckCircle2, AlertTriangle, Wand2, RefreshCw, Shuffle } from 'lucide-react';

export default function ABCCorrelationVisualization() {
  const [text, setText] = useState("The quick brown fox jumps over the lazy dog");
  const [isHarmonized, setIsHarmonized] = useState(false);

  // Analyze frequencies
  const stats = useMemo(() => {
    const counts = { a: 0, b: 0, c: 0 };
    const chars = text.toLowerCase().split('');
    
    chars.forEach(char => {
      if (char === 'a') counts.a++;
      if (char === 'b') counts.b++;
      if (char === 'c') counts.c++;
    });

    const max = Math.max(counts.a, counts.b, counts.c, 5); // Min max of 5 for visual scaling
    const isEqual = counts.a === counts.b && counts.b === counts.c;

    return { counts, max, isEqual };
  }, [text]);

  useEffect(() => {
    setIsHarmonized(stats.isEqual);
  }, [stats.isEqual]);

  const handleHarmonize = () => {
    const { a, b, c } = stats.counts;
    const target = Math.max(a, b, c);
    
    let newText = text;
    if (a < target) newText += ' ' + 'a'.repeat(target - a);
    if (b < target) newText += ' ' + 'b'.repeat(target - b);
    if (c < target) newText += ' ' + 'c'.repeat(target - c);
    
    setText(newText);
  };

  const handleScramble = () => {
    const chaos = "abc".split('').sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 3) + 1).join('');
    setText(prev => prev + " " + chaos);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Quantum Core Display */}
      <div className="relative h-80 glass rounded-3xl border border-slate-700/50 overflow-hidden flex flex-col items-center justify-center p-8">
        {/* Background Effects */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ${isHarmonized ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-amber-500/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px] animate-pulse" />
        </div>

        {/* Status Indicator - Moved to avoid overlap */}
        <div className="absolute top-6 left-6 z-20">
          <motion.div
            initial={false}
            animate={{
              borderColor: isHarmonized ? 'rgba(245, 158, 11, 0.5)' : 'rgba(244, 63, 94, 0.5)',
              backgroundColor: isHarmonized ? 'rgba(245, 158, 11, 0.1)' : 'rgba(244, 63, 94, 0.1)'
            }}
            className="px-4 py-2 rounded-full border backdrop-blur-md flex items-center gap-2 transition-colors duration-500"
          >
            {isHarmonized ? (
              <>
                <CheckCircle2 size={16} className="text-amber-400" />
                <span className="text-amber-400 font-bold tracking-wider text-xs uppercase">Resonance Stable</span>
              </>
            ) : (
              <>
                <AlertTriangle size={16} className="text-rose-400" />
                <span className="text-rose-400 font-bold tracking-wider text-xs uppercase">Dissonance Detected</span>
              </>
            )}
          </motion.div>
        </div>

        <div className="relative z-10 flex items-end justify-center gap-12 md:gap-24 h-48 w-full max-w-2xl">
          {/* Bar A */}
          <FrequencyBar 
            label="A" 
            count={stats.counts.a} 
            max={stats.max} 
            color="cyan" 
            isHarmonized={isHarmonized} 
          />
          
          {/* Bar B */}
          <FrequencyBar 
            label="B" 
            count={stats.counts.b} 
            max={stats.max} 
            color="magenta" 
            isHarmonized={isHarmonized} 
          />

          {/* Bar C */}
          <FrequencyBar 
            label="C" 
            count={stats.counts.c} 
            max={stats.max} 
            color="yellow" 
            isHarmonized={isHarmonized} 
          />
        </div>
      </div>

      {/* Control Interface */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <Activity size={18} className="text-cyan-400" />
              Input Stream
            </h3>
            <button
              onClick={() => setText('')}
              className="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition-colors"
            >
              <RefreshCw size={12} />
              Clear
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-32 bg-slate-950/50 rounded-xl border border-slate-700/50 p-4 font-mono text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 resize-none transition-all"
            placeholder="Type to analyze frequency resonance..."
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <Zap size={18} className="text-amber-400" />
            Controls
          </h3>
          
          <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700/50 h-32 flex flex-col justify-center gap-3">
            {isHarmonized ? (
              <button
                onClick={handleScramble}
                className="w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 hover:border-slate-600"
              >
                <Shuffle size={18} />
                Inject Chaos
              </button>
            ) : (
              <button
                onClick={handleHarmonize}
                className="w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Wand2 size={18} />
                Harmonize
              </button>
            )}
            
            <div className="text-center text-[10px] text-slate-500 font-mono">
              {isHarmonized ? 'System Balanced' : 'Frequencies Unstable'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FrequencyBar({ label, count, max, color, isHarmonized }: { 
  label: string, 
  count: number, 
  max: number, 
  color: 'cyan' | 'magenta' | 'yellow',
  isHarmonized: boolean
}) {
  const heightPercent = Math.max((count / max) * 100, 5); // Min 5% height
  
  const colorMap = {
    cyan: 'bg-cyan-500 shadow-[0_0_25px_rgba(6,182,212,0.6)]',
    magenta: 'bg-fuchsia-500 shadow-[0_0_25px_rgba(217,70,239,0.6)]',
    yellow: 'bg-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.6)]'
  };

  const harmonizedColor = 'bg-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.8)]';

  return (
    <div className="flex flex-col items-center gap-4 w-20 group">
      <div className="relative w-full h-full flex items-end justify-center">
        {/* Background Track */}
        <div className="absolute inset-x-6 top-0 bottom-0 bg-slate-800/50 rounded-full border border-slate-700/30" />
        
        {/* Active Bar */}
        <motion.div
          initial={{ height: 0 }}
          animate={{ 
            height: `${heightPercent}%`,
            className: `w-4 rounded-full relative z-10 ${isHarmonized ? harmonizedColor : colorMap[color]}`
          }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
           {/* Particle Effect at top of bar */}
           <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-white/20 rounded-full blur-md" />
        </motion.div>
      </div>
      
      <div className="text-center z-10">
        <div className={`text-3xl font-bold font-mono transition-colors duration-300 ${isHarmonized ? 'text-amber-400 scale-110' : 'text-slate-200'}`}>
          {label}
        </div>
        <div className="text-sm text-slate-500 font-mono mt-1 font-bold">
          {count}
        </div>
      </div>
    </div>
  );
}
