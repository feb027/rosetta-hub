import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Scale, Plus, Trash2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Math Logic ---
const arithmeticMean = (nums: number[]): number => {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
};

const geometricMean = (nums: number[]): number => {
  if (nums.length === 0) return 0;
  if (nums.some(n => n <= 0)) return 0;
  // Use log to avoid overflow
  const logSum = nums.reduce((a, b) => a + Math.log(b), 0);
  return Math.exp(logSum / nums.length);
};

const harmonicMean = (nums: number[]): number => {
  if (nums.length === 0) return 0;
  if (nums.some(n => n <= 0)) return 0;
  const reciprocalSum = nums.reduce((a, b) => a + 1 / b, 0);
  return nums.length / reciprocalSum;
};

// Preset number sets
const PRESETS = [
  { name: '1 to 10', numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  { name: 'Equal (5s)', numbers: [5, 5, 5, 5, 5] },
  { name: 'Powers of 2', numbers: [1, 2, 4, 8, 16] },
  { name: 'Fibonacci', numbers: [1, 1, 2, 3, 5, 8, 13] },
  { name: 'Primes', numbers: [2, 3, 5, 7, 11, 13] },
];

export default function PythagoreanMeansVisualization() {
  const [numbers, setNumbers] = useState<number[]>(PRESETS[0].numbers);
  const [results, setResults] = useState<{ a: number; g: number; h: number } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const [newNumber, setNewNumber] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number>(0);


  // --- Audio ---
  const playSound = useCallback((type: 'add' | 'remove' | 'step' | 'complete' | 'click') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'add') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.setValueAtTime(700, now + 0.05);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'remove') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.setValueAtTime(200, now + 0.1);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'step') {
      const freqs = [400, 500, 600];
      const freq = freqs[animationStep % 3];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'complete') {
      [523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.06, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25 + i * 0.1);
        osc.start(now + i * 0.1);
        osc.stop(now + 0.35 + i * 0.1);
      });
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.start(now);
      osc.stop(now + 0.03);
    }
  }, [soundEnabled, animationStep]);

  // --- Calculate with animation ---
  const calculate = useCallback(() => {
    if (numbers.length === 0) return;
    
    setIsCalculating(true);
    setAnimationStep(0);
    setResults(null);

    let step = 0;
    animationRef.current = window.setInterval(() => {
      if (step < 3) {
        setAnimationStep(step);
        playSound('step');
        step++;
      } else {
        clearInterval(animationRef.current);
        setResults({
          a: arithmeticMean(numbers),
          g: geometricMean(numbers),
          h: harmonicMean(numbers),
        });
        setIsCalculating(false);
        playSound('complete');
      }
    }, 400);
  }, [numbers, playSound]);

  const reset = () => {
    clearInterval(animationRef.current);
    setIsCalculating(false);
    setAnimationStep(0);
    setResults(null);
  };

  const addNumber = () => {
    const num = parseFloat(newNumber);
    if (!isNaN(num) && num > 0) {
      setNumbers(prev => [...prev, num]);
      setNewNumber('');
      reset();
      playSound('add');
    }
  };

  const removeNumber = (index: number) => {
    setNumbers(prev => prev.filter((_, i) => i !== index));
    reset();
    playSound('remove');
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setNumbers([...preset.numbers]);
    reset();
    playSound('click');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!isCalculating) calculate(); }
      if (e.key === 'r' || e.key === 'R') reset();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [calculate, isCalculating]);

  useEffect(() => {
    return () => clearInterval(animationRef.current);
  }, []);

  // For visualization scaling
  const maxValue = results ? Math.max(results.a, results.g, results.h, ...numbers) : Math.max(...numbers, 1);


  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-amber-950/10 to-slate-950 rounded-xl border border-amber-900/40 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border-b border-amber-500/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/50">
                <Scale className="text-amber-400" size={24} />
              </div>
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-300 tracking-wider">TRIPLE SCALE BALANCE</h2>
              <p className="text-xs text-amber-500/70">Pythagorean Means Calculator</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled 
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' 
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        
        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-slate-500">Presets:</span>
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(preset)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                JSON.stringify(numbers) === JSON.stringify(preset.numbers)
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-amber-500/30'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* Number Input */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-slate-500 mb-2">Input Numbers (positive only)</div>
          <div className="flex flex-wrap gap-2 mb-3">
            {numbers.map((num, idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="group flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30"
              >
                <span className="font-mono text-sm text-amber-300">{num}</span>
                <button
                  onClick={() => removeNumber(idx)}
                  className="opacity-0 group-hover:opacity-100 ml-1 text-slate-500 hover:text-red-400 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </motion.div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <input
              type="number"
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addNumber()}
              placeholder="Add positive number"
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-amber-300 font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500"
              min={0.01}
              step="any"
            />
            <button
              onClick={addNumber}
              className="px-4 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/50 rounded-lg hover:bg-amber-500/30 transition-all"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Calculate Button */}
        <button
          onClick={calculate}
          disabled={isCalculating || numbers.length === 0}
          className={`w-full px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-3 transition-all ${
            isCalculating
              ? 'bg-amber-500/10 text-amber-400/50 border border-amber-500/30 cursor-wait'
              : numbers.length === 0
              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/50 hover:from-amber-500/30 hover:to-orange-500/30'
          }`}
        >
          {isCalculating ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                <Sparkles size={20} />
              </motion.div>
              CALCULATING...
            </>
          ) : (
            <>
              <Play size={20} />
              COMPUTE MEANS
            </>
          )}
        </button>

        {/* Triple Scale Visualization */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-6">
          <div className="text-xs text-amber-400 mb-4 flex items-center gap-2">
            <Scale size={14} />
            A ≥ G ≥ H (Pythagorean Inequality)
          </div>

          {/* Three Scales */}
          <div className="grid grid-cols-3 gap-4">
            {/* Arithmetic Mean */}
            <div className={`relative rounded-xl border p-4 transition-all ${
              animationStep >= 0 || results
                ? 'bg-cyan-500/10 border-cyan-500/30'
                : 'bg-slate-800/30 border-slate-700/30'
            }`}>
              <motion.div
                initial={{ opacity: 0.3 }}
                animate={{ opacity: animationStep >= 0 || results ? 1 : 0.3 }}
              >
                <div className="text-xs text-cyan-400 mb-2 font-bold">ARITHMETIC (A)</div>
                <div className="text-xs text-slate-500 mb-3">Σxᵢ / n</div>
                
                {/* Bar visualization */}
                <div className="h-32 bg-slate-900/50 rounded relative overflow-hidden flex items-end">
                  <motion.div
                    className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t"
                    initial={{ height: 0 }}
                    animate={{ height: results ? `${(results.a / maxValue) * 100}%` : 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  />
                </div>
                
                <div className="mt-3 text-center">
                  <span className="text-2xl font-bold text-cyan-300 font-mono">
                    {results ? results.a.toFixed(4) : '—'}
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Geometric Mean */}
            <div className={`relative rounded-xl border p-4 transition-all ${
              animationStep >= 1 || results
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-slate-800/30 border-slate-700/30'
            }`}>
              <motion.div
                initial={{ opacity: 0.3 }}
                animate={{ opacity: animationStep >= 1 || results ? 1 : 0.3 }}
              >
                <div className="text-xs text-emerald-400 mb-2 font-bold">GEOMETRIC (G)</div>
                <div className="text-xs text-slate-500 mb-3">ⁿ√(x₁·x₂·...·xₙ)</div>
                
                <div className="h-32 bg-slate-900/50 rounded relative overflow-hidden flex items-end">
                  <motion.div
                    className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t"
                    initial={{ height: 0 }}
                    animate={{ height: results ? `${(results.g / maxValue) * 100}%` : 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </div>
                
                <div className="mt-3 text-center">
                  <span className="text-2xl font-bold text-emerald-300 font-mono">
                    {results ? results.g.toFixed(4) : '—'}
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Harmonic Mean */}
            <div className={`relative rounded-xl border p-4 transition-all ${
              animationStep >= 2 || results
                ? 'bg-rose-500/10 border-rose-500/30'
                : 'bg-slate-800/30 border-slate-700/30'
            }`}>
              <motion.div
                initial={{ opacity: 0.3 }}
                animate={{ opacity: animationStep >= 2 || results ? 1 : 0.3 }}
              >
                <div className="text-xs text-rose-400 mb-2 font-bold">HARMONIC (H)</div>
                <div className="text-xs text-slate-500 mb-3">n / Σ(1/xᵢ)</div>
                
                <div className="h-32 bg-slate-900/50 rounded relative overflow-hidden flex items-end">
                  <motion.div
                    className="w-full bg-gradient-to-t from-rose-600 to-rose-400 rounded-t"
                    initial={{ height: 0 }}
                    animate={{ height: results ? `${(results.h / maxValue) * 100}%` : 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  />
                </div>
                
                <div className="mt-3 text-center">
                  <span className="text-2xl font-bold text-rose-300 font-mono">
                    {results ? results.h.toFixed(4) : '—'}
                  </span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Inequality verification */}
          <AnimatePresence>
            {results && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700"
              >
                <div className="flex items-center justify-center gap-3 text-lg font-mono">
                  <span className="text-cyan-300">{results.a.toFixed(2)}</span>
                  <span className={results.a >= results.g ? 'text-emerald-400' : 'text-red-400'}>
                    {results.a >= results.g ? '≥' : '<'}
                  </span>
                  <span className="text-emerald-300">{results.g.toFixed(2)}</span>
                  <span className={results.g >= results.h ? 'text-emerald-400' : 'text-red-400'}>
                    {results.g >= results.h ? '≥' : '<'}
                  </span>
                  <span className="text-rose-300">{results.h.toFixed(2)}</span>
                </div>
                <div className="text-center mt-2 text-xs text-emerald-400">
                  ✓ Pythagorean inequality verified!
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>


        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Count</div>
            <div className="text-xl font-bold text-amber-400">{numbers.length}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Sum</div>
            <div className="text-xl font-bold text-cyan-400 font-mono">
              {numbers.reduce((a, b) => a + b, 0).toFixed(1)}
            </div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Product</div>
            <div className="text-xl font-bold text-emerald-400 font-mono">
              {numbers.length > 0 ? numbers.reduce((a, b) => a * b, 1).toExponential(2) : '0'}
            </div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">A - H Spread</div>
            <div className="text-xl font-bold text-rose-400 font-mono">
              {results ? (results.a - results.h).toFixed(4) : '—'}
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={reset}
          className="w-full px-4 py-2 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw size={16} />
          Reset
        </button>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Space</kbd> Calculate
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-amber-400 hover:text-amber-300 transition-colors">
          About Pythagorean Means
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            The three <span className="text-amber-300">Pythagorean means</span> are fundamental 
            ways to find a "central" value of a set of numbers:
          </p>
          <ul className="space-y-1 ml-4">
            <li><span className="text-cyan-300">Arithmetic</span>: Simple average (sum ÷ count)</li>
            <li><span className="text-emerald-300">Geometric</span>: nth root of product (good for rates)</li>
            <li><span className="text-rose-300">Harmonic</span>: Reciprocal of average reciprocals (good for rates over distance)</li>
          </ul>
          <p>
            For any set of positive numbers: <span className="text-amber-300">A ≥ G ≥ H</span>
          </p>
          <p className="text-slate-500">
            Equality holds only when all numbers are identical.
          </p>
        </div>
      </details>
    </div>
  );
}
