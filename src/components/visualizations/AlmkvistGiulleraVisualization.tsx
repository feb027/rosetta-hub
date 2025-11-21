import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Atom, Sparkles, Sigma } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Logic ---

const PRECISION_DIGITS = 80;
const SCALE = 10n ** BigInt(PRECISION_DIGITS);
const DISPLAY_DIGITS = 70;

// BigInt Square Root (Newton's Method)
const bigIntSqrt = (value: bigint): bigint => {
  if (value < 0n) throw new Error('Negative sqrt');
  if (value < 2n) return value;
  
  let x0 = value;
  let x1 = (x0 + value / x0) >> 1n;
  
  while (x1 < x0) {
    x0 = x1;
    x1 = (x0 + value / x0) >> 1n;
  }
  return x0;
};

const factorial = (n: bigint): bigint => {
  let res = 1n;
  for (let i = 2n; i <= n; i++) res *= i;
  return res;
};

interface TermData {
  n: number;
  integerPart: string;
  value: bigint;
}

// --- Component ---

export default function AlmkvistGiulleraVisualization() {
  const [piValue, setPiValue] = useState<string>('');
  const [terms, setTerms] = useState<TermData[]>([]);
  const [currentN, setCurrentN] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [sum, setSum] = useState(0n);
  const [isComplete, setIsComplete] = useState(false);
  const [soundEnabled] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // --- Audio ---

  useEffect(() => {
    if (soundEnabled && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, [soundEnabled]);

  const playSound = useCallback((type: 'weave' | 'stabilize' | 'complete') => {
    if (!soundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'weave') {
      // Ethereal pluck
      osc.type = 'sine';
      // Pentatonic scale frequencies based on currentN
      const freqs = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; 
      const freq = freqs[currentN % freqs.length] * (1 + (currentN / 20));
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      osc.start(now);
      osc.stop(now + 1.5);
    } else if (type === 'stabilize') {
      // Low drone
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(55, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'complete') {
      // Major chord
      const chord = [261.63, 329.63, 392.00, 523.25]; // C Major
      chord.forEach((f) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.1, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
        o.start(now);
        o.stop(now + 3.0);
      });
    }
  }, [soundEnabled, currentN]);

  // --- Calculation Step ---

  const calculateStep = useCallback(() => {
    if (isComplete) return;

    const n = BigInt(currentN);
    
    // Formula components
    // const num = factorial(6n * n) * (532n * n * n + 126n * n + 9n);
    // const den = 3n * (factorial(n) ** 6n) * (10n ** (6n * n + 3n));
    
    // For the "Integer Part" display (without the 1000^n divisor part roughly)
    // The task asks for "integer portions (the starred formula, which is without the power of 1000 divisor)"
    // The reference formula separates it into a large integer term and a power of 10.
    // Integer Term = (32 * (6n)! * (532n^2 + 126n + 9)) / (3 * n!^6)
    // Note: The 32 comes from the outside multiplier.
    
    const integerTermNum = 32n * factorial(6n * n) * (532n * n * n + 126n * n + 9n);
    const integerTermDen = 3n * (factorial(n) ** 6n);
    const integerPart = integerTermNum / integerTermDen;

    // Actual term for sum (scaled)
    // We need high precision, so we scale the numerator.
    // Term = (32 * num) / den
    // Scaled Term = (32 * num * SCALE) / den
    
    // Wait, the formula in the prompt has 10^(6n+3) in denominator.
    // Let's stick to the summation form:
    // S += 32 * ( (6n)! * (532n^2 + 126n + 9) ) / ( 3 * n!^6 * 10^(6n+3) )
    
    const termNum = 32n * factorial(6n * n) * (532n * n * n + 126n * n + 9n) * SCALE;
    const termDen = 3n * (factorial(n) ** 6n) * (10n ** (6n * n + 3n));
    
    const termValue = termNum / termDen;

    if (termValue === 0n && currentN > 0) {
      setIsComplete(true);
      setIsRunning(false);
      playSound('complete');
      return;
    }

    const newSum = sum + termValue;
    setSum(newSum);
    
    // Calculate Pi from current sum
    // 1/pi^2 = S  => pi^2 = 1/S => pi = 1/sqrt(S)
    // S is scaled by SCALE (10^80).
    // Real S = newSum / SCALE
    // pi = sqrt(SCALE / newSum)
    // To get pi scaled by 10^70 (DISPLAY_DIGITS), we need:
    // pi_scaled = sqrt(SCALE * 10^140 / newSum)
    
    const piScale = 10n ** BigInt(DISPLAY_DIGITS * 2);
    const piSq = (SCALE * piScale) / newSum;
    const pi = bigIntSqrt(piSq);
    
    // Format Pi
    let piStr = pi.toString();
    if (piStr.length > DISPLAY_DIGITS) {
      piStr = piStr.slice(0, 1) + '.' + piStr.slice(1, DISPLAY_DIGITS + 1);
    }

    setPiValue(piStr);
    setTerms(prev => [...prev, { 
      n: currentN, 
      integerPart: integerPart.toString(), 
      value: termValue 
    }]);
    setCurrentN(prev => prev + 1);
    playSound('weave');

  }, [currentN, sum, isComplete, playSound]);

  // --- Animation Loop ---

  const animate = (time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const delta = time - lastTimeRef.current;

    if (delta > 800) { // Slow pace for dramatic effect
      calculateStep();
      lastTimeRef.current = time;
    }
    
    if (isRunning && !isComplete) {
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    if (isRunning && !isComplete) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(requestRef.current);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isRunning, isComplete, calculateStep]);

  // --- UI ---

  return (
    <div className="space-y-6 font-sans bg-[#0f0518] text-[#e0d4fc] p-6 rounded-xl border border-[#4c1d95] overflow-hidden relative">
      
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(76,29,149,0.2),_transparent_70%)] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent)', backgroundSize: '50px 50px' }} 
      />

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center border-b border-[#6d28d9] pb-4">
        <div className="flex items-center gap-3">
          <Atom className="text-[#d8b4fe] animate-spin-slow" size={32} />
          <div>
            <h2 className="text-2xl font-bold text-[#d8b4fe] tracking-wider">Quantum Pi Loom</h2>
            <div className="text-xs text-[#a78bfa]">CALABI-YAU MANIFOLD SIMULATION</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            disabled={isComplete}
            className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${
              isRunning 
                ? 'bg-[#4c1d95] text-[#d8b4fe] shadow-[0_0_15px_rgba(139,92,246,0.5)]' 
                : 'bg-[#d8b4fe] text-[#4c1d95] hover:bg-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isRunning ? <Pause size={20} /> : <Play size={20} />}
            {isRunning ? 'PAUSE WEAVING' : 'START WEAVING'}
          </button>
          <button
            onClick={() => {
              setIsRunning(false);
              setIsComplete(false);
              setPiValue('');
              setTerms([]);
              setCurrentN(0);
              setSum(0n);
            }}
            className="p-2 rounded-lg bg-[#2e1065] text-[#a78bfa] hover:text-white transition-colors border border-[#5b21b6]"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        
        {/* Left: The Manifold Core (Pi Display) */}
        <div className="flex flex-col gap-6">
          <div className="relative aspect-square bg-black/40 rounded-full border-4 border-[#6d28d9] flex items-center justify-center overflow-hidden shadow-[0_0_50px_rgba(109,40,217,0.3)]">
            {/* Animated Core */}
            <AnimatePresence>
              {isRunning && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0, rotate: 0 }}
                  animate={{ scale: [1, 1.1, 1], opacity: 0.8, rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-tr from-[#4c1d95] via-[#7c3aed] to-transparent opacity-30 blur-xl rounded-full"
                />
              )}
            </AnimatePresence>
            
            {/* Pi Value */}
            <div className="relative z-10 text-center max-w-[80%] break-all">
              <div className="text-[#a78bfa] text-sm mb-2 uppercase tracking-widest">Approximation of π</div>
              <div className="text-3xl font-mono font-bold text-white leading-relaxed shadow-black drop-shadow-md">
                {piValue || '3...'}
              </div>
              <div className="mt-4 text-xs text-[#c4b5fd]">
                PRECISION: {piValue.length > 2 ? piValue.length - 2 : 0} / {DISPLAY_DIGITS} DIGITS
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-[#2e1065]/50 p-4 rounded-lg border border-[#5b21b6]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[#d8b4fe] font-bold flex items-center gap-2">
                <Sigma size={16} /> Current Term (n={currentN})
              </span>
              {isComplete && <span className="text-emerald-400 text-xs font-bold flex items-center gap-1"><Sparkles size={12}/> CONVERGED</span>}
            </div>
            <div className="h-2 bg-[#1e1b4b] rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-[#7c3aed] to-[#d8b4fe]"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((currentN / 12) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Thread History (Terms) */}
        <div className="bg-[#2e1065]/30 rounded-xl border border-[#5b21b6] p-4 flex flex-col h-[500px]">
          <h3 className="text-[#d8b4fe] font-bold mb-4 uppercase tracking-widest text-sm border-b border-[#5b21b6] pb-2">
            Quantum Threads (Integer Parts)
          </h3>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
            <AnimatePresence>
              {terms.map((term) => (
                <motion.div
                  key={term.n}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-[#1e1b4b]/80 p-3 rounded border border-[#4c1d95] hover:border-[#7c3aed] transition-colors"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[#a78bfa] font-mono text-xs">n = {term.n}</span>
                  </div>
                  <div className="font-mono text-xs text-[#e9d5ff] break-all leading-relaxed">
                    {term.integerPart.length > 50 ? term.integerPart.slice(0, 50) + '...' : term.integerPart}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {terms.length === 0 && (
              <div className="text-center py-12 text-[#6d28d9] italic text-sm">
                Initialize the loom to begin weaving...
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
