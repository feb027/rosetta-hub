import { useState, useRef, useCallback } from 'react';
import { Play, RotateCcw, Building2, Layers, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

// --- Logic ---

const countDivisors = (n: number): number => {
  let count = 0;
  for (let i = 1; i * i <= n; i++) {
    if (n % i === 0) {
      count++;
      if (i !== n / i) count++;
    }
  }
  return count;
};

const getDivisors = (n: number): number[] => {
  const divisors: number[] = [];
  for (let i = 1; i * i <= n; i++) {
    if (n % i === 0) {
      divisors.push(i);
      if (i !== n / i) divisors.push(n / i);
    }
  }
  return divisors.sort((a, b) => a - b);
};

const generateAntiPrimes = (count: number): Array<{ number: number; divisorCount: number; divisors: number[] }> => {
  const antiPrimes: Array<{ number: number; divisorCount: number; divisors: number[] }> = [];
  let maxDivisors = 0;
  let n = 1;
  
  while (antiPrimes.length < count) {
    const divisorCount = countDivisors(n);
    if (divisorCount > maxDivisors) {
      antiPrimes.push({ number: n, divisorCount, divisors: getDivisors(n) });
      maxDivisors = divisorCount;
    }
    n++;
  }
  
  return antiPrimes;
};

// Pre-compute all anti-primes
const ALL_ANTI_PRIMES = generateAntiPrimes(20);
const MAX_DIVISORS = Math.max(...ALL_ANTI_PRIMES.map(ap => ap.divisorCount));

// --- Component ---

export default function AntiPrimesVisualization() {
  const [revealedCount, setRevealedCount] = useState(0);
  const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [showDivisors, setShowDivisors] = useState(true);
  const [soundEnabled] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const revealIntervalRef = useRef<number>(0);

  // --- Audio ---
  const playSound = useCallback((type: 'build' | 'complete') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'build') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200 + revealedCount * 30, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'complete') {
      [440, 554, 659, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.1, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + i * 0.1);
        osc.start(now + i * 0.1);
        osc.stop(now + 0.6 + i * 0.1);
      });
    }
  }, [soundEnabled, revealedCount]);

  // --- Actions ---
  const startReveal = () => {
    if (isRevealing) return;
    if (revealedCount >= 20) {
      reset();
      return;
    }
    
    setIsRevealing(true);
    
    const reveal = () => {
      setRevealedCount(prev => {
        if (prev >= 20) {
          setIsRevealing(false);
          playSound('complete');
          return prev;
        }
        playSound('build');
        return prev + 1;
      });
    };

    reveal();
    revealIntervalRef.current = window.setInterval(() => {
      setRevealedCount(prev => {
        if (prev >= 19) {
          clearInterval(revealIntervalRef.current);
          setIsRevealing(false);
          playSound('complete');
          return 20;
        }
        playSound('build');
        return prev + 1;
      });
    }, 300);
  };

  const reset = () => {
    clearInterval(revealIntervalRef.current);
    setIsRevealing(false);
    setRevealedCount(0);
    setSelectedBuilding(null);
  };

  const revealAll = () => {
    clearInterval(revealIntervalRef.current);
    setIsRevealing(false);
    setRevealedCount(20);
    playSound('complete');
  };

  const selectedData = selectedBuilding !== null ? ALL_ANTI_PRIMES[selectedBuilding] : null;

  return (
    <div className="w-full bg-gradient-to-b from-slate-900 via-amber-950/10 to-slate-950 rounded-xl border border-amber-900/30 font-sans overflow-hidden">
      
      {/* Skyline Header */}
      <div className="relative bg-gradient-to-b from-amber-900/20 to-transparent px-6 py-4 border-b border-amber-800/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <Building2 className="text-amber-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-300 tracking-wide">DIVISOR SKYLINE</h2>
              <p className="text-xs text-amber-500/70">Anti-Prime City Builder</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDivisors(!showDivisors)}
              className={`p-2 rounded-lg border transition-all ${
                showDivisors 
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' 
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title={showDivisors ? 'Hide divisor windows' : 'Show divisor windows'}
            >
              {showDivisors ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
            <div className="text-xs text-amber-400/70 bg-amber-950/30 px-3 py-2 rounded-lg border border-amber-800/30">
              Buildings: <span className="text-amber-300 font-bold">{revealedCount}</span> / 20
            </div>
          </div>
        </div>
      </div>

      {/* Main Skyline View */}
      <div className="p-6">
        <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 rounded-xl border border-slate-800 overflow-hidden">
          {/* Night sky background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(251,191,36,0.05),_transparent_50%)]" />
            {/* Stars */}
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute w-px h-px bg-white rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 40}%`,
                  opacity: Math.random() * 0.5 + 0.2,
                }}
              />
            ))}
          </div>

          {/* Ground line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-600/50 to-transparent" />

          {/* Buildings Container */}
          <div className="relative h-[280px] flex items-end justify-center gap-1 px-4 pb-6 pt-4">
            {ALL_ANTI_PRIMES.map((ap, idx) => {
              const isRevealed = idx < revealedCount;
              const isSelected = selectedBuilding === idx;
              const heightPercent = (ap.divisorCount / MAX_DIVISORS) * 85;
              
              return (
                <motion.div
                  key={ap.number}
                  className="relative flex flex-col items-center cursor-pointer group"
                  onClick={() => setSelectedBuilding(isSelected ? null : idx)}
                  initial={false}
                  animate={{ opacity: isRevealed ? 1 : 0.15 }}
                >
                  {/* Building */}
                  <motion.div
                    className={`
                      relative w-10 md:w-12 rounded-t-sm overflow-hidden
                      ${isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900' : ''}
                      ${isRevealed ? 'cursor-pointer' : 'cursor-default'}
                    `}
                    initial={{ height: 0 }}
                    animate={{ 
                      height: isRevealed ? `${heightPercent * 2.5}px` : 0,
                    }}
                    transition={{ 
                      duration: 0.4, 
                      ease: 'easeOut',
                      delay: isRevealed ? 0 : 0
                    }}
                    style={{
                      background: isRevealed 
                        ? `linear-gradient(to top, 
                            hsl(${35 + idx * 2}, 80%, ${25 + idx}%), 
                            hsl(${40 + idx * 2}, 70%, ${35 + idx}%))`
                        : 'rgba(30,30,40,0.5)',
                    }}
                  >
                    {/* Windows grid */}
                    {isRevealed && showDivisors && (
                      <div className="absolute inset-1 grid grid-cols-2 gap-0.5 content-start">
                        {ap.divisors.slice(0, 20).map((d, i) => (
                          <motion.div
                            key={d}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 + i * 0.02 }}
                            className="w-full aspect-square rounded-sm"
                            style={{
                              backgroundColor: Math.random() > 0.3 
                                ? `rgba(251, 191, 36, ${0.3 + Math.random() * 0.5})` 
                                : 'rgba(0,0,0,0.3)',
                            }}
                            title={`Divisor: ${d}`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Roof accent */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400/50 via-amber-300/70 to-amber-400/50" />
                    
                    {/* Selection glow */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-amber-400/10 animate-pulse" />
                    )}
                  </motion.div>

                  {/* Building number label */}
                  <div className={`
                    mt-2 text-[10px] font-bold transition-colors
                    ${isSelected ? 'text-amber-300' : isRevealed ? 'text-amber-500/70' : 'text-slate-700'}
                  `}>
                    {ap.number}
                  </div>

                  {/* Divisor count badge */}
                  {isRevealed && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-6 left-1/2 -translate-x-1/2 bg-amber-900/90 border border-amber-600/50 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-amber-200"
                    >
                      {ap.divisorCount}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={startReveal}
            disabled={isRevealing}
            className={`
              flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all
              ${isRevealing
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-wait'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30'
              }
            `}
          >
            <Play size={18} />
            {revealedCount >= 20 ? 'REBUILD CITY' : isRevealing ? 'BUILDING...' : 'BUILD CITY'}
          </button>
          <button
            onClick={revealAll}
            disabled={isRevealing || revealedCount >= 20}
            className="px-4 py-3 rounded-lg bg-amber-900/30 text-amber-400 border border-amber-800/50 hover:bg-amber-900/50 transition-all disabled:opacity-50"
          >
            <Layers size={18} />
          </button>
          <button
            onClick={reset}
            className="px-4 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        {/* Selected Building Info */}
        {selectedData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-amber-950/30 rounded-xl border border-amber-800/30 p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-2xl font-bold text-amber-200">{selectedData.number}</div>
                <div className="text-xs text-amber-500">Anti-prime #{selectedBuilding! + 1}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-amber-300">{selectedData.divisorCount}</div>
                <div className="text-xs text-amber-500">divisors</div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1.5">
              {selectedData.divisors.map(d => (
                <span 
                  key={d} 
                  className="px-2 py-1 bg-amber-900/50 border border-amber-700/30 rounded text-xs text-amber-200 font-mono"
                >
                  {d}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Reference */}
        <div className="mt-4 bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-slate-500 mb-2">First 20 Anti-primes (click buildings above to explore)</div>
          <div className="flex flex-wrap gap-2">
            {ALL_ANTI_PRIMES.map((ap, idx) => (
              <button
                key={ap.number}
                onClick={() => {
                  if (idx < revealedCount) setSelectedBuilding(idx);
                }}
                className={`
                  px-2 py-1 rounded text-xs font-mono transition-all
                  ${idx < revealedCount 
                    ? selectedBuilding === idx
                      ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50'
                      : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-amber-600/50'
                    : 'bg-slate-900 text-slate-600 border border-slate-800'
                  }
                `}
              >
                {ap.number}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-amber-400 hover:text-amber-300 transition-colors">
          What are Anti-primes?
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            <span className="text-amber-300">Anti-primes</span> (highly composite numbers) have more divisors 
            than any smaller positive integer. Building height = divisor count!
          </p>
          <p>
            Example: <span className="text-amber-400">12</span> has 6 divisors (1,2,3,4,6,12) — more than any number below it.
          </p>
        </div>
      </details>
    </div>
  );
}
