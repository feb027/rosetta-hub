import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Factory, Cog, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FactorizedNumber {
  n: number;
  factors: number[];
  k: number;
  isTarget: boolean;
}

// Prime factorization
const factorize = (n: number): number[] => {
  const factors: number[] = [];
  let num = n;
  for (let p = 2; p * p <= num; p++) {
    while (num % p === 0) {
      factors.push(p);
      num = Math.floor(num / p);
    }
  }
  if (num > 1) factors.push(num);
  return factors;
};

// Check if n is k-almost-prime
const isKAlmostPrime = (n: number, k: number): boolean => {
  return factorize(n).length === k;
};

// Generate first count k-almost-primes
const generateKAlmostPrimes = (k: number, count: number): number[] => {
  const result: number[] = [];
  let n = 2;
  while (result.length < count) {
    if (isKAlmostPrime(n, k)) {
      result.push(n);
    }
    n++;
  }
  return result;
};

// Color palette for different k values
const K_COLORS: Record<number, { bg: string; border: string; text: string; glow: string }> = {
  1: { bg: 'bg-cyan-900/40', border: 'border-cyan-500/60', text: 'text-cyan-300', glow: 'shadow-cyan-500/30' },
  2: { bg: 'bg-emerald-900/40', border: 'border-emerald-500/60', text: 'text-emerald-300', glow: 'shadow-emerald-500/30' },
  3: { bg: 'bg-amber-900/40', border: 'border-amber-500/60', text: 'text-amber-300', glow: 'shadow-amber-500/30' },
  4: { bg: 'bg-rose-900/40', border: 'border-rose-500/60', text: 'text-rose-300', glow: 'shadow-rose-500/30' },
  5: { bg: 'bg-sky-900/40', border: 'border-sky-500/60', text: 'text-sky-300', glow: 'shadow-sky-500/30' },
};

export default function AlmostPrimeVisualization() {
  const [selectedK, setSelectedK] = useState(2);
  const [isRunning, setIsRunning] = useState(false);
  const [currentNumber, setCurrentNumber] = useState(2);
  const [foundNumbers, setFoundNumbers] = useState<FactorizedNumber[]>([]);
  const [conveyorItems, setConveyorItems] = useState<FactorizedNumber[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [speed, setSpeed] = useState(300);
  const [allResults, setAllResults] = useState<Record<number, number[]>>({});
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number>(0);


  // Sound effects
  const playSound = useCallback((type: 'scan' | 'accept' | 'reject' | 'complete' | 'click' | 'gear') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'scan') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.05);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'accept') {
      [523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0.06, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15 + i * 0.05);
        osc.start(now + i * 0.05);
        osc.stop(now + 0.2 + i * 0.05);
      });
    } else if (type === 'reject') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'complete') {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        gain.gain.setValueAtTime(0.08, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4 + i * 0.12);
        osc.start(now + i * 0.12);
        osc.stop(now + 0.5 + i * 0.12);
      });
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      osc.start(now);
      osc.stop(now + 0.02);
    } else if (type === 'gear') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(100, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.start(now);
      osc.stop(now + 0.03);
    }
  }, [soundEnabled]);

  // Run the factory
  const runFactory = useCallback(() => {
    setIsRunning(true);
    setCurrentNumber(2);
    setFoundNumbers([]);
    setConveyorItems([]);
    
    let n = 2;
    let found: FactorizedNumber[] = [];
    
    const process = () => {
      if (found.length >= 10) {
        setIsRunning(false);
        playSound('complete');
        // Store results
        setAllResults(prev => ({ ...prev, [selectedK]: found.map(f => f.n) }));
        return;
      }
      
      const factors = factorize(n);
      const isTarget = factors.length === selectedK;
      
      const item: FactorizedNumber = { n, factors, k: factors.length, isTarget };
      
      setCurrentNumber(n);
      setConveyorItems(prev => {
        const newItems = [...prev, item];
        return newItems.slice(-6); // Keep only last 6 items
      });
      
      if (isTarget) {
        found = [...found, item];
        setFoundNumbers([...found]);
        playSound('accept');
      } else {
        playSound('scan');
      }
      
      n++;
      animationRef.current = window.setTimeout(process, speed);
    };
    
    process();
  }, [selectedK, speed, playSound]);

  // Stop
  const stop = useCallback(() => {
    clearTimeout(animationRef.current);
    setIsRunning(false);
  }, []);

  // Reset
  const reset = useCallback(() => {
    stop();
    setCurrentNumber(2);
    setFoundNumbers([]);
    setConveyorItems([]);
    playSound('click');
  }, [stop, playSound]);

  // Generate all results instantly
  const generateAll = useCallback(() => {
    const results: Record<number, number[]> = {};
    for (let k = 1; k <= 5; k++) {
      results[k] = generateKAlmostPrimes(k, 10);
    }
    setAllResults(results);
    playSound('complete');
  }, [playSound]);

  // Cleanup
  useEffect(() => {
    return () => clearTimeout(animationRef.current);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ') { e.preventDefault(); isRunning ? stop() : runFactory(); }
      if (e.key === 'r' || e.key === 'R') reset();
      if (e.key >= '1' && e.key <= '5') { setSelectedK(parseInt(e.key)); reset(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isRunning, runFactory, stop, reset]);

  const color = K_COLORS[selectedK];


  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-zinc-900 to-slate-950 rounded-xl border border-zinc-700/50 font-sans overflow-hidden">
      
      {/* Header - Industrial Factory */}
      <div className="relative bg-gradient-to-r from-zinc-900 via-slate-800 to-zinc-900 border-b border-zinc-600/30 px-6 py-4 overflow-hidden">
        {/* Industrial pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(100,100,100,0.3) 10px, rgba(100,100,100,0.3) 12px)`
        }} />
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-3 rounded-lg bg-zinc-800/80 border-2 border-zinc-600/50 shadow-lg">
                <Factory className="text-zinc-300" size={28} />
              </div>
              <motion.div
                className="absolute -top-1 -right-1"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              >
                <Cog size={16} className="text-amber-500" />
              </motion.div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-200 tracking-wide">
                PRIME FACTORY
              </h2>
              <p className="text-xs text-zinc-500 tracking-wider">k-Almost Prime Assembly Line</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={generateAll}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-900/30 border border-emerald-600/50 text-emerald-400 hover:bg-emerald-900/50 transition-all"
            >
              Generate All
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled 
                  ? 'bg-zinc-800/50 border-zinc-600/50 text-zinc-300' 
                  : 'bg-zinc-900 border-zinc-700 text-zinc-600'
              }`}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6">
        
        {/* K Selector - Factory Switches */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm text-zinc-400 font-mono">SELECT k:</span>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(k => {
              const kColor = K_COLORS[k];
              return (
                <button
                  key={k}
                  onClick={() => { setSelectedK(k); reset(); playSound('click'); }}
                  className={`relative w-14 h-14 rounded-lg border-2 transition-all font-mono font-bold text-lg ${
                    selectedK === k
                      ? `${kColor.bg} ${kColor.border} ${kColor.text} shadow-lg ${kColor.glow}`
                      : 'bg-zinc-900/50 border-zinc-700 text-zinc-500 hover:border-zinc-600'
                  }`}
                >
                  k={k}
                  {selectedK === k && (
                    <motion.div
                      className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-zinc-500">Speed:</span>
            <input
              type="range"
              min="50"
              max="500"
              step="50"
              value={550 - speed}
              onChange={(e) => setSpeed(550 - parseInt(e.target.value))}
              className="w-20 accent-zinc-500"
            />
          </div>
        </div>

        {/* Conveyor Belt Visualization */}
        <div className="relative bg-zinc-900/60 rounded-xl border-2 border-zinc-700/50 p-4 overflow-hidden">
          {/* Conveyor belt background */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-zinc-800 to-transparent" />
          <motion.div 
            className="absolute bottom-2 left-0 right-0 h-4 bg-zinc-700/50 rounded"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(80,80,80,0.5) 20px, rgba(80,80,80,0.5) 22px)'
            }}
            animate={{ backgroundPositionX: isRunning ? [0, -44] : 0 }}
            transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
          />
          
          <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-3 flex items-center gap-2">
            <Zap size={12} className={isRunning ? 'text-amber-400' : 'text-zinc-600'} />
            Assembly Line - Scanning for {selectedK}-almost-primes
          </div>

          {/* Current number being processed */}
          <div className="flex items-center justify-center mb-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentNumber}
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 30, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className={`relative px-6 py-4 rounded-xl border-2 ${color.bg} ${color.border}`}
              >
                <div className="text-3xl font-bold font-mono text-center text-zinc-100">
                  {currentNumber}
                </div>
                <div className="text-xs text-zinc-400 text-center mt-1">
                  = {factorize(currentNumber).join(' × ') || currentNumber}
                </div>
                <div className={`text-[10px] text-center mt-1 font-mono ${
                  factorize(currentNumber).length === selectedK ? 'text-emerald-400' : 'text-zinc-500'
                }`}>
                  k = {factorize(currentNumber).length}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Conveyor items */}
          <div className="flex gap-2 overflow-hidden h-12 items-center justify-center max-w-full">
            <AnimatePresence mode="popLayout">
              {conveyorItems.map((item, idx) => (
                <motion.div
                  key={item.n}
                  initial={{ x: 50, opacity: 0, scale: 0.8 }}
                  animate={{ x: 0, opacity: idx === conveyorItems.length - 1 ? 1 : 0.4, scale: 1 }}
                  exit={{ x: -50, opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className={`px-3 py-2 rounded-lg border text-sm font-mono flex-shrink-0 ${
                    item.isTarget
                      ? `${color.bg} ${color.border} ${color.text}`
                      : 'bg-zinc-800/50 border-zinc-700 text-zinc-500'
                  }`}
                >
                  {item.n}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Found Numbers - Collection Bins */}
        <div className={`rounded-xl border-2 p-4 ${color.bg} ${color.border}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-mono text-zinc-300">
              {selectedK}-Almost-Primes Found: {foundNumbers.length}/10
            </span>
            <div className="h-2 w-32 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${selectedK === 1 ? 'bg-cyan-500' : selectedK === 2 ? 'bg-emerald-500' : selectedK === 3 ? 'bg-amber-500' : selectedK === 4 ? 'bg-rose-500' : 'bg-sky-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${(foundNumbers.length / 10) * 100}%` }}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {Array.from({ length: 10 }).map((_, idx) => {
              const item = foundNumbers[idx];
              return (
                <motion.div
                  key={idx}
                  initial={false}
                  animate={item ? { scale: [1.2, 1], opacity: 1 } : { opacity: 0.3 }}
                  className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center ${
                    item
                      ? `${color.bg} ${color.border}`
                      : 'bg-zinc-900/50 border-zinc-800 border-dashed'
                  }`}
                >
                  {item ? (
                    <>
                      <span className={`text-lg font-bold font-mono ${color.text}`}>{item.n}</span>
                      <span className="text-[8px] text-zinc-500 truncate max-w-full px-1">
                        {item.factors.join('×')}
                      </span>
                    </>
                  ) : (
                    <span className="text-zinc-700 text-lg">?</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>


        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={isRunning ? stop : runFactory}
            className={`px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all border-2 ${
              isRunning
                ? 'bg-rose-900/30 border-rose-600/50 text-rose-300 hover:bg-rose-900/50'
                : `${color.bg} ${color.border} ${color.text} hover:opacity-80`
            }`}
          >
            {isRunning ? (
              <>
                <Pause size={18} />
                Stop
              </>
            ) : (
              <>
                <Play size={18} />
                Start Factory
              </>
            )}
          </button>
          
          <button
            onClick={reset}
            className="px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 bg-zinc-800/50 border-2 border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 transition-all"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>

        {/* Results Table - All k values */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-700/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-700/50 bg-zinc-800/30">
            <span className="text-sm font-mono text-zinc-300">First 10 k-Almost-Primes (k = 1 to 5)</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-700/50">
                  <th className="px-4 py-2 text-left text-zinc-500 font-mono">k</th>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <th key={i} className="px-2 py-2 text-center text-zinc-600 font-mono text-xs">
                      #{i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map(k => {
                  const kColor = K_COLORS[k];
                  const results = allResults[k] || (k === selectedK ? foundNumbers.map(f => f.n) : []);
                  return (
                    <tr key={k} className={`border-b border-zinc-800/50 ${selectedK === k ? kColor.bg : ''}`}>
                      <td className={`px-4 py-2 font-mono font-bold ${kColor.text}`}>k={k}</td>
                      {Array.from({ length: 10 }).map((_, i) => (
                        <td key={i} className="px-2 py-2 text-center">
                          {results[i] ? (
                            <span className={`font-mono ${kColor.text}`}>{results[i]}</span>
                          ) : (
                            <span className="text-zinc-700">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Panel */}
        <details className="bg-zinc-900/40 rounded-xl border border-zinc-700/50">
          <summary className="px-4 py-3 cursor-pointer text-sm text-zinc-400 hover:text-zinc-300">
            What are k-Almost-Primes?
          </summary>
          <div className="px-4 pb-4 text-xs text-zinc-500 space-y-2">
            <p>A <span className="text-cyan-400">k-almost-prime</span> is a natural number that is the product of exactly k prime factors (with repetition).</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><span className="text-cyan-300">k=1</span>: Prime numbers (2, 3, 5, 7, 11...)</li>
              <li><span className="text-emerald-300">k=2</span>: Semiprimes (4=2×2, 6=2×3, 9=3×3...)</li>
              <li><span className="text-amber-300">k=3</span>: Products of 3 primes (8=2×2×2, 12=2×2×3...)</li>
              <li><span className="text-rose-300">k=4</span>: Products of 4 primes (16=2⁴, 24=2³×3...)</li>
              <li><span className="text-sky-300">k=5</span>: Products of 5 primes (32=2⁵, 48=2⁴×3...)</li>
            </ul>
          </div>
        </details>
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-700/30 px-4 py-3 bg-zinc-900/50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-zinc-600">
            Current: <span className="text-zinc-400 font-mono">{currentNumber}</span> • 
            Target: <span className={`font-mono ${color.text}`}>{selectedK}-almost-prime</span>
          </div>
          <div className="flex gap-2 text-[10px] text-zinc-600">
            <span className="px-2 py-1 bg-zinc-800/50 rounded border border-zinc-700/50">
              <kbd className="text-zinc-400">Space</kbd> Run
            </span>
            <span className="px-2 py-1 bg-zinc-800/50 rounded border border-zinc-700/50">
              <kbd className="text-zinc-400">1-5</kbd> Select k
            </span>
            <span className="px-2 py-1 bg-zinc-800/50 rounded border border-zinc-700/50">
              <kbd className="text-zinc-400">R</kbd> Reset
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
