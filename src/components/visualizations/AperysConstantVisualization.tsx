import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Telescope, Star, Zap, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Constants ---
const ZETA_3_REFERENCE = '1.2020569031595942853997381615114499907649862923404988817922715553418382057863130901864558736093352581';

// --- Calculation Methods ---

// Method 1: Direct summation of 1/n³
const directSum = (terms: number): number => {
  let sum = 0;
  for (let n = 1; n <= terms; n++) {
    sum += 1 / (n * n * n);
  }
  return sum;
};

// Method 2: Markov/Apéry representation
// ζ(3) = (5/2) * Σ(k=1 to ∞) (-1)^(k-1) * k!² / ((2k)! * k³)
const markovApery = (terms: number): number => {
  let sum = 0;
  for (let k = 1; k <= terms; k++) {
    const sign = Math.pow(-1, k - 1);
    // Calculate k!² / (2k)!
    let factorialRatio = 1;
    for (let i = 1; i <= k; i++) {
      factorialRatio *= i / (k + i);
    }
    sum += sign * factorialRatio / (k * k * k);
  }
  return (5 / 2) * sum;
};

// Method 3: Simplified fast convergence (based on Wedeniwski-style)
// Using a faster converging series approximation
const fastConvergence = (terms: number): number => {
  let sum = 0;
  for (let n = 0; n <= terms; n++) {
    // Simplified fast-converging formula
    const term = Math.pow(-1, n) * (205 * n * n + 250 * n + 77) / 
                 (64 * Math.pow(2 * n + 1, 5) * binomial(2 * n, n) * binomial(2 * n, n));
    sum += term;
  }
  return sum;
};

// Binomial coefficient
const binomial = (n: number, k: number): number => {
  if (k > n) return 0;
  if (k === 0 || k === n) return 1;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = result * (n - i) / (i + 1);
  }
  return result;
};

// Count matching digits
const countMatchingDigits = (value: number, reference: string): number => {
  const valueStr = value.toFixed(50);
  let count = 0;
  for (let i = 0; i < Math.min(valueStr.length, reference.length); i++) {
    if (valueStr[i] === reference[i]) count++;
    else if (valueStr[i] !== '.' && reference[i] !== '.') break;
  }
  return Math.max(0, count - 2); // Subtract "1." prefix
};

interface MethodState {
  name: string;
  shortName: string;
  color: string;
  bgColor: string;
  borderColor: string;
  terms: number;
  value: number;
  matchingDigits: number;
  digitsPerTerm: number;
  icon: React.ReactNode;
}

// --- Component ---
export default function AperysConstantVisualization() {
  const [isRunning, setIsRunning] = useState(false);
  const [methods, setMethods] = useState<MethodState[]>([
    {
      name: 'Direct Summation (1/n³)',
      shortName: 'Direct',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500/50',
      terms: 0,
      value: 0,
      matchingDigits: 0,
      digitsPerTerm: 0,
      icon: <Star size={16} />,
    },
    {
      name: 'Markov/Apéry Series',
      shortName: 'Markov',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/20',
      borderColor: 'border-cyan-500/50',
      terms: 0,
      value: 0,
      matchingDigits: 0,
      digitsPerTerm: 0,
      icon: <Telescope size={16} />,
    },
    {
      name: 'Fast Convergence',
      shortName: 'Fast',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20',
      borderColor: 'border-emerald-500/50',
      terms: 0,
      value: 0,
      matchingDigits: 0,
      digitsPerTerm: 0,
      icon: <Zap size={16} />,
    },
  ]);
  const [selectedMethod, setSelectedMethod] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [stars, setStars] = useState<Array<{ x: number; y: number; size: number; delay: number }>>([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number>(0);

  // Generate background stars
  useEffect(() => {
    const newStars = Array.from({ length: 50 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 3,
    }));
    setStars(newStars);
  }, []);

  // --- Audio ---
  const playSound = useCallback((type: 'tick' | 'milestone' | 'complete') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800 + Math.random() * 400, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'milestone') {
      const freqs = [523, 659, 784];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.08, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3 + i * 0.08);
        osc.start(now + i * 0.08);
        osc.stop(now + 0.4 + i * 0.08);
      });
    } else if (type === 'complete') {
      const chord = [261.63, 329.63, 392, 523.25];
      chord.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2);
        osc.start(now);
        osc.stop(now + 2);
      });
    }
  }, [soundEnabled]);

  // --- Calculation Step ---
  const step = useCallback(() => {
    setMethods(prev => {
      const updated = prev.map((method, idx) => {
        const newTerms = method.terms + 1;
        let newValue: number;
        
        if (idx === 0) {
          newValue = directSum(newTerms);
        } else if (idx === 1) {
          newValue = markovApery(newTerms);
        } else {
          newValue = fastConvergence(newTerms);
        }
        
        const newMatchingDigits = countMatchingDigits(newValue, ZETA_3_REFERENCE);
        const digitsPerTerm = newTerms > 0 ? newMatchingDigits / newTerms : 0;
        
        // Play milestone sound when gaining a digit
        if (newMatchingDigits > method.matchingDigits && newMatchingDigits > 0) {
          playSound('milestone');
        }
        
        return {
          ...method,
          terms: newTerms,
          value: newValue,
          matchingDigits: newMatchingDigits,
          digitsPerTerm,
        };
      });
      
      playSound('tick');
      return updated;
    });
  }, [playSound]);

  // --- Animation Loop ---
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(step, 150);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, step]);

  // --- Reset ---
  const reset = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    setMethods(prev => prev.map(m => ({
      ...m,
      terms: 0,
      value: 0,
      matchingDigits: 0,
      digitsPerTerm: 0,
    })));
  };

  // Format value for display
  const formatValue = (value: number, digits: number): string => {
    if (value === 0) return '0.000...';
    const str = value.toFixed(Math.min(digits + 5, 20));
    return str;
  };

  // Highlight matching digits
  const renderValueWithHighlight = (value: number, matchingDigits: number, color: string) => {
    const str = formatValue(value, matchingDigits);
    const matchLen = matchingDigits + 2; // Include "1."
    
    return (
      <span className="font-mono text-lg md:text-xl">
        <span className={color}>{str.slice(0, matchLen)}</span>
        <span className="text-slate-600">{str.slice(matchLen)}</span>
      </span>
    );
  };

  const currentMethod = methods[selectedMethod];

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-indigo-950/30 to-slate-950 rounded-xl border border-indigo-900/50 font-sans overflow-hidden relative">
      
      {/* Starfield Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {stars.map((star, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2 + star.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.1),_transparent_70%)]" />
      </div>

      {/* Header */}
      <div className="relative bg-slate-900/80 border-b border-indigo-800/50 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/50">
              <Telescope className="text-indigo-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-indigo-300 tracking-wide">INFINITE SERIES OBSERVATORY</h2>
              <p className="text-xs text-indigo-500/70">Convergence Race to ζ(3)</p>
            </div>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
              soundEnabled 
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50' 
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}
          >
            {soundEnabled ? '🔊 Sound On' : '🔇 Sound Off'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative p-6 space-y-6">
        
        {/* Target Value Display */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-4">
          <div className="text-xs text-slate-500 mb-2 flex items-center gap-2">
            <Star size={12} className="text-yellow-400" />
            TARGET: Apéry's Constant ζ(3)
          </div>
          <div className="font-mono text-sm md:text-base text-slate-300 break-all leading-relaxed">
            {ZETA_3_REFERENCE.slice(0, 50)}...
          </div>
        </div>

        {/* Method Selector Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {methods.map((method, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedMethod(idx)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                selectedMethod === idx
                  ? `${method.bgColor} ${method.color} ${method.borderColor} border`
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-slate-600'
              }`}
            >
              {method.icon}
              {method.shortName}
            </button>
          ))}
        </div>

        {/* Selected Method Detail */}
        <motion.div
          key={selectedMethod}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-slate-900/50 rounded-xl border ${currentMethod.borderColor} p-6`}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className={`text-lg font-bold ${currentMethod.color}`}>{currentMethod.name}</h3>
              <p className="text-xs text-slate-500 mt-1">Terms calculated: {currentMethod.terms}</p>
            </div>
            <div className={`px-3 py-1 rounded-full ${currentMethod.bgColor} ${currentMethod.color} text-xs font-bold`}>
              {currentMethod.matchingDigits} digits
            </div>
          </div>

          {/* Current Value */}
          <div className="bg-black/30 rounded-lg p-4 mb-4">
            <div className="text-xs text-slate-500 mb-2">Current Approximation:</div>
            {renderValueWithHighlight(currentMethod.value, currentMethod.matchingDigits, currentMethod.color)}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/30 rounded-lg p-3">
              <div className="text-xs text-slate-500 mb-1">Digits per Term</div>
              <div className={`text-xl font-bold ${currentMethod.color}`}>
                {currentMethod.digitsPerTerm.toFixed(3)}
              </div>
            </div>
            <div className="bg-slate-800/30 rounded-lg p-3">
              <div className="text-xs text-slate-500 mb-1">Convergence Rate</div>
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className={currentMethod.color} />
                <span className={`text-sm font-medium ${currentMethod.color}`}>
                  {selectedMethod === 0 ? 'Slow' : selectedMethod === 1 ? 'Medium' : 'Fast'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Race Comparison */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-4">
          <div className="text-xs text-slate-500 mb-4 flex items-center gap-2">
            <TrendingUp size={12} />
            CONVERGENCE RACE (Digits Achieved)
          </div>
          <div className="space-y-3">
            {methods.map((method, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className={`w-20 text-xs font-medium ${method.color}`}>{method.shortName}</div>
                <div className="flex-1 h-6 bg-slate-800/50 rounded-full overflow-hidden relative">
                  <motion.div
                    className={`h-full ${method.bgColor} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((method.matchingDigits / 15) * 100, 100)}%` }}
                    transition={{ duration: 0.3 }}
                  />
                  <div className="absolute inset-0 flex items-center justify-end pr-2">
                    <span className="text-xs font-mono text-white/80">{method.matchingDigits}</span>
                  </div>
                </div>
                <div className="w-16 text-xs text-slate-500 text-right">{method.terms} terms</div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
              isRunning
                ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50'
                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 hover:bg-indigo-500/30'
            }`}
          >
            {isRunning ? <Pause size={18} /> : <Play size={18} />}
            {isRunning ? 'PAUSE OBSERVATION' : 'START OBSERVATION'}
          </button>
          <button
            onClick={step}
            disabled={isRunning}
            className="px-4 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            Step
          </button>
          <button
            onClick={reset}
            className="px-4 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        {/* All Methods Summary Table */}
        <AnimatePresence>
          {methods[0].terms > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-slate-700/50 text-xs text-slate-500">
                Comparison at {methods[0].terms} terms each
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-800/50">
                    <tr className="text-slate-500">
                      <th className="px-4 py-2 text-left">Method</th>
                      <th className="px-4 py-2 text-right">Value</th>
                      <th className="px-4 py-2 text-right">Digits</th>
                      <th className="px-4 py-2 text-right">Efficiency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {methods.map((method, idx) => (
                      <tr key={idx} className="border-t border-slate-800/50">
                        <td className={`px-4 py-2 font-medium ${method.color}`}>{method.shortName}</td>
                        <td className="px-4 py-2 text-right font-mono text-slate-300">
                          {method.value.toFixed(10)}
                        </td>
                        <td className={`px-4 py-2 text-right font-bold ${method.color}`}>
                          {method.matchingDigits}
                        </td>
                        <td className="px-4 py-2 text-right text-slate-400">
                          {method.digitsPerTerm.toFixed(2)} d/t
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-700/50">
        <summary className="px-4 py-3 cursor-pointer text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
          About Apéry's Constant
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            <span className="text-indigo-300">Apéry's constant</span> ζ(3) is the value of the Riemann zeta function at 3.
            It equals the sum of 1/n³ for all positive integers n.
          </p>
          <p>
            <span className="text-amber-300">Direct summation</span> converges very slowly - 1000 terms only gives ~6 correct digits.
          </p>
          <p>
            <span className="text-cyan-300">Markov/Apéry's formula</span> converges faster at ~0.63 digits per term.
          </p>
          <p>
            <span className="text-emerald-300">Fast convergence formulas</span> like Wedeniwski's can achieve ~5 digits per term!
          </p>
          <p className="text-slate-500 italic">
            Roger Apéry proved ζ(3) is irrational in 1978, one of the most surprising results in number theory.
          </p>
        </div>
      </details>
    </div>
  );
}
