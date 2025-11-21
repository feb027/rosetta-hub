import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Hammer, Flame, Shield, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Logic ---

const getPrimeFactors = (n: number): Record<number, number> => {
  const factors: Record<number, number> = {};
  let d = 2;
  let temp = n;
  while (d * d <= temp) {
    while (temp % d === 0) {
      factors[d] = (factors[d] || 0) + 1;
      temp /= d;
    }
    d++;
  }
  if (temp > 1) {
    factors[temp] = (factors[temp] || 0) + 1;
  }
  return factors;
};

const isPowerful = (factors: Record<number, number>): boolean => {
  return Object.values(factors).every(exponent => exponent >= 2);
};

const isPerfectPower = (n: number): boolean => {
  if (n <= 1) return true;
  for (let m = 2; m * m <= n; m++) {
    let p = m * m;
    while (p <= n) {
      if (p === n) return true;
      if (n / m < p) break; // Overflow guard
      p *= m;
    }
  }
  return false;
};

const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);

const eulerTotient = (n: number): number => {
  let result = n;
  let temp = n;
  for (let i = 2; i * i <= temp; i++) {
    if (temp % i === 0) {
      while (temp % i === 0) temp /= i;
      result -= result / i;
    }
  }
  if (temp > 1) result -= result / temp;
  return result;
};

// --- Component ---

export default function AchillesNumbersVisualization() {
  const [currentNumber, setCurrentNumber] = useState(1);
  const currentNumberRef = useRef(1);
  const [achillesNumbers, setAchillesNumbers] = useState<number[]>([]);
  const [strongAchillesNumbers, setStrongAchillesNumbers] = useState<number[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [speed] = useState(50); // ms delay
  const [soundEnabled] = useState(true);
  const [status, setStatus] = useState<'idle' | 'heating' | 'striking' | 'engraving' | 'shattered'>('idle');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // --- Audio ---

  useEffect(() => {
    if (soundEnabled && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, [soundEnabled]);

  const playSound = useCallback((type: 'anvil' | 'fire' | 'shatter' | 'bellows') => {
    if (!soundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'anvil') {
      // Sharp metallic clang
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.5);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
      
      // Add a high pitched ring
      const ring = ctx.createOscillator();
      const ringGain = ctx.createGain();
      ring.connect(ringGain);
      ringGain.connect(ctx.destination);
      ring.type = 'sine';
      ring.frequency.setValueAtTime(2000, now);
      ringGain.gain.setValueAtTime(0.1, now);
      ringGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
      ring.start(now);
      ring.stop(now + 1.0);

    } else if (type === 'fire') {
      // Low rumble
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(50, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'shatter') {
      // Noise burst
      const bufferSize = ctx.sampleRate * 0.3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = ctx.createGain();
      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseGain.gain.setValueAtTime(0.2, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      noise.start(now);
    }
  }, [soundEnabled]);

  // --- Simulation Loop ---

  const checkNumber = useCallback((n: number) => {
    setStatus('heating');
    playSound('fire');

    const factors = getPrimeFactors(n);
    const powerful = isPowerful(factors);

    if (!powerful) {
      // Not powerful, discard
      return;
    }

    setStatus('striking');
    
    if (isPerfectPower(n)) {
      playSound('shatter');
      setStatus('shattered');
      return;
    }

    // It is an Achilles Number!
    playSound('anvil');
    setStatus('engraving');
    setAchillesNumbers(prev => {
      if (prev.includes(n)) return prev;
      return [...prev, n];
    });

    // Check for Strong Achilles
    const totient = eulerTotient(n);
    const totientFactors = getPrimeFactors(totient);
    if (isPowerful(totientFactors) && !isPerfectPower(totient)) {
      setStrongAchillesNumbers(prev => {
        if (prev.includes(n)) return prev;
        return [...prev, n];
      });
    }

  }, [playSound]);

  const animate = (time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const delta = time - lastTimeRef.current;

    if (delta > speed) {
      const next = currentNumberRef.current + 1;
      currentNumberRef.current = next;
      setCurrentNumber(next);
      checkNumber(next);
      lastTimeRef.current = time;
    }
    
    if (isRunning) {
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    if (isRunning) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(requestRef.current!);
    }
    return () => cancelAnimationFrame(requestRef.current!);
  }, [isRunning, speed, checkNumber]);

  // --- UI Helpers ---

  const factors = getPrimeFactors(currentNumber);
  const factorString = Object.entries(factors)
    .map(([p, e]) => `${p}${e > 1 ? `^${e}` : ''}`)
    .join(' × ');

  return (
    <div className="space-y-6 font-serif bg-[#1c1917] text-[#e7e5e4] p-6 rounded-xl border-4 border-[#78350f]">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b-2 border-[#78350f] pb-4">
        <div className="flex items-center gap-3">
          <Shield className="text-[#f59e0b]" size={32} />
          <h2 className="text-3xl font-bold text-[#f59e0b] tracking-wider uppercase">The Forge of Achilles</h2>
        </div>
        <div className="flex gap-2">
           <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors ${
              isRunning ? 'bg-[#78350f] text-[#f59e0b]' : 'bg-[#f59e0b] text-[#78350f]'
            }`}
          >
            {isRunning ? <Pause size={20} /> : <Play size={20} />}
            {isRunning ? 'HALT FORGE' : 'STOKE FIRE'}
          </button>
          <button
            onClick={() => {
              setIsRunning(false);
              setCurrentNumber(1);
              setAchillesNumbers([]);
              setStrongAchillesNumbers([]);
              setStatus('idle');
            }}
            className="p-2 rounded-lg bg-[#292524] text-[#78716c] hover:text-[#e7e5e4] transition-colors"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* The Anvil (Visualization) */}
        <div className="relative aspect-square bg-[#0c0a09] rounded-full border-8 border-[#451a03] flex flex-col items-center justify-center overflow-hidden shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]">
          
          {/* Fire Background */}
          <AnimatePresence>
            {status === 'heating' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1.2 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gradient-to-t from-orange-900/50 via-red-900/20 to-transparent pointer-events-none"
              />
            )}
          </AnimatePresence>

          {/* Current Number */}
          <div className="relative z-10 text-center mb-8">
            <motion.div
              key={currentNumber}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-6xl font-bold text-[#f59e0b] drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]"
            >
              {currentNumber}
            </motion.div>
            <div className="text-[#a8a29e] mt-2 font-mono text-sm h-6">
              {factorString}
            </div>
          </div>

          {/* Anvil Base */}
          <div className="absolute bottom-0 w-48 h-24 bg-gradient-to-t from-[#292524] to-[#44403c] rounded-t-3xl shadow-2xl border-t border-[#57534e]" />

          {/* Status Indicator - Moved above base and higher up */}
          <div className="absolute bottom-28 flex flex-col items-center gap-2 z-20">
            {status === 'shattered' && (
              <motion.div 
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="text-red-500 font-bold flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full border border-red-500/30 backdrop-blur-sm"
              >
                <Zap size={20} /> SHATTERED (Perfect Power)
              </motion.div>
            )}
            {status === 'engraving' && (
              <motion.div 
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="text-emerald-500 font-bold flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full border border-emerald-500/30 backdrop-blur-sm"
              >
                <Hammer size={20} /> FORGED (Achilles)
              </motion.div>
            )}
             {status === 'heating' && (
              <motion.div 
                animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 0.5 }}
                className="text-orange-500 font-bold flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full border border-orange-500/30 backdrop-blur-sm"
              >
                <Flame size={20} /> HEATING
              </motion.div>
            )}
          </div>
        </div>

        {/* The Shield (Results) */}
        <div className="bg-[#292524] rounded-xl p-6 border-2 border-[#451a03] flex flex-col h-[500px]">
          <h3 className="text-[#f59e0b] font-bold mb-4 flex items-center gap-2 uppercase tracking-widest border-b border-[#451a03] pb-2">
            <Shield size={18} />
            Engraved Numbers
          </h3>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 grid grid-cols-4 gap-2 content-start">
            {achillesNumbers.map(n => {
              const isStrong = strongAchillesNumbers.includes(n);
              return (
                <motion.div
                  key={n}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`
                    aspect-square rounded-full flex items-center justify-center font-bold text-sm border-2
                    ${isStrong 
                      ? 'bg-[#f59e0b] text-[#451a03] border-[#fffbeb] shadow-[0_0_15px_rgba(245,158,11,0.5)]' 
                      : 'bg-[#44403c] text-[#d6d3d1] border-[#78350f]'
                    }
                  `}
                  title={isStrong ? 'Strong Achilles Number' : 'Achilles Number'}
                >
                  {n}
                </motion.div>
              );
            })}
            {achillesNumbers.length === 0 && (
              <div className="col-span-4 text-center py-12 text-[#57534e] italic">
                The shield is blank...
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="mt-4 pt-4 border-t border-[#451a03] grid grid-cols-2 gap-4 text-xs text-[#a8a29e]">
            <div>
              <span className="block text-[#78350f] font-bold uppercase">Achilles Found</span>
              <span className="text-2xl text-[#e7e5e4]">{achillesNumbers.length}</span>
            </div>
            <div>
              <span className="block text-[#f59e0b] font-bold uppercase">Strong Found</span>
              <span className="text-2xl text-[#e7e5e4]">{strongAchillesNumbers.length}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
