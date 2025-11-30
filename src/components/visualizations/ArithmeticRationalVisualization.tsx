import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Minus, X, Divide, RotateCcw, Percent } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface Fraction {
  num: number;
  den: number;
}

type Operation = 'add' | 'sub' | 'mul' | 'div';

// --- Fraction utilities ---
const gcd = (a: number, b: number): number => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
};

const simplify = (f: Fraction): Fraction => {
  if (f.den === 0) return { num: 0, den: 1 };
  const g = gcd(f.num, f.den);
  let num = f.num / g;
  let den = f.den / g;
  if (den < 0) {
    num = -num;
    den = -den;
  }
  return { num, den };
};

const add = (a: Fraction, b: Fraction): Fraction => 
  simplify({ num: a.num * b.den + b.num * a.den, den: a.den * b.den });

const sub = (a: Fraction, b: Fraction): Fraction => 
  simplify({ num: a.num * b.den - b.num * a.den, den: a.den * b.den });

const mul = (a: Fraction, b: Fraction): Fraction => 
  simplify({ num: a.num * b.num, den: a.den * b.den });

const div = (a: Fraction, b: Fraction): Fraction => 
  simplify({ num: a.num * b.den, den: a.den * b.num });

const toDecimal = (f: Fraction): number => f.den === 0 ? 0 : f.num / f.den;

const formatFrac = (f: Fraction): string => {
  if (f.den === 1) return `${f.num}`;
  return `${f.num}/${f.den}`;
};

// --- Component ---
export default function ArithmeticRationalVisualization() {
  const [fracA, setFracA] = useState<Fraction>({ num: 3, den: 4 });
  const [fracB, setFracB] = useState<Fraction>({ num: 1, den: 2 });
  const [operation, setOperation] = useState<Operation>('add');
  const [result, setResult] = useState<Fraction | null>(null);
  const [showSteps, setShowSteps] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio
  useEffect(() => {
    if (soundEnabled && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
  }, [soundEnabled]);

  // Play sounds
  const playSound = useCallback((type: 'click' | 'compute' | 'simplify') => {
    if (!soundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const currentTime = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    switch (type) {
      case 'click':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, currentTime);
        gain.gain.setValueAtTime(0.03, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.05);
        break;
      case 'compute':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, currentTime);
        osc.frequency.exponentialRampToValueAtTime(700, currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.15);
        break;
      case 'simplify':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, currentTime);
        osc.frequency.setValueAtTime(800, currentTime + 0.1);
        gain.gain.setValueAtTime(0.04, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.2);
        break;
    }
    osc.start(currentTime);
    osc.stop(currentTime + 0.3);
  }, [soundEnabled]);

  // Compute result
  useEffect(() => {
    let res: Fraction;
    switch (operation) {
      case 'add': res = add(fracA, fracB); break;
      case 'sub': res = sub(fracA, fracB); break;
      case 'mul': res = mul(fracA, fracB); break;
      case 'div': res = div(fracA, fracB); break;
    }
    setResult(res);
  }, [fracA, fracB, operation]);

  // Draw fraction bar
  const FractionBar = ({ frac, color, label }: { frac: Fraction; color: string; label: string }) => {
    const value = Math.min(Math.max(toDecimal(frac), -2), 2);
    const percentage = Math.abs(value) * 50;
    const isNegative = value < 0;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className={`font-bold ${color}`}>{label}</span>
          <span className="text-slate-500 font-mono">{toDecimal(frac).toFixed(4)}</span>
        </div>
        <div className="h-6 bg-slate-800 rounded-full overflow-hidden relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-px h-full bg-slate-600" />
          </div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.3, type: 'spring' }}
            className={`h-full ${isNegative ? 'ml-auto' : ''}`}
            style={{
              background: `linear-gradient(90deg, ${color.includes('cyan') ? '#06b6d4' : color.includes('amber') ? '#f59e0b' : '#10b981'}, transparent)`,
              marginLeft: isNegative ? 'auto' : `50%`,
              marginRight: isNegative ? '50%' : 'auto',
            }}
          />
        </div>
      </div>
    );
  };

  // Fraction display component
  const FractionDisplay = ({ frac, size = 'lg' }: { frac: Fraction; size?: 'sm' | 'lg' }) => {
    const textSize = size === 'lg' ? 'text-3xl' : 'text-xl';
    return (
      <div className="flex flex-col items-center">
        <span className={`${textSize} font-bold font-mono`}>{frac.num}</span>
        <div className="w-full h-0.5 bg-current my-1" />
        <span className={`${textSize} font-bold font-mono`}>{frac.den}</span>
      </div>
    );
  };

  const operations: { id: Operation; symbol: string; icon: React.ReactNode; name: string }[] = [
    { id: 'add', symbol: '+', icon: <Plus size={18} />, name: 'Add' },
    { id: 'sub', symbol: '−', icon: <Minus size={18} />, name: 'Subtract' },
    { id: 'mul', symbol: '×', icon: <X size={18} />, name: 'Multiply' },
    { id: 'div', symbol: '÷', icon: <Divide size={18} />, name: 'Divide' },
  ];

  const presets = [
    { label: '3/4, 1/2', a: { num: 3, den: 4 }, b: { num: 1, den: 2 } },
    { label: '2/3, 1/6', a: { num: 2, den: 3 }, b: { num: 1, den: 6 } },
    { label: '5/8, 3/4', a: { num: 5, den: 8 }, b: { num: 3, den: 4 } },
    { label: '1/3, 1/3', a: { num: 1, den: 3 }, b: { num: 1, den: 3 } },
    { label: '-1/2, 3/4', a: { num: -1, den: 2 }, b: { num: 3, den: 4 } },
  ];

  // Get step-by-step explanation
  const getSteps = () => {
    const opSymbol = operations.find(o => o.id === operation)?.symbol || '+';
    switch (operation) {
      case 'add':
      case 'sub':
        const commonDen = fracA.den * fracB.den;
        const newNumA = fracA.num * fracB.den;
        const newNumB = fracB.num * fracA.den;
        const rawNum = operation === 'add' ? newNumA + newNumB : newNumA - newNumB;
        return [
          `Find common denominator: ${fracA.den} × ${fracB.den} = ${commonDen}`,
          `Convert: ${fracA.num}/${fracA.den} = ${newNumA}/${commonDen}`,
          `Convert: ${fracB.num}/${fracB.den} = ${newNumB}/${commonDen}`,
          `${operation === 'add' ? 'Add' : 'Subtract'}: ${newNumA} ${opSymbol} ${newNumB} = ${rawNum}`,
          `Result: ${rawNum}/${commonDen} = ${formatFrac(result!)}`,
        ];
      case 'mul':
        return [
          `Multiply numerators: ${fracA.num} × ${fracB.num} = ${fracA.num * fracB.num}`,
          `Multiply denominators: ${fracA.den} × ${fracB.den} = ${fracA.den * fracB.den}`,
          `Result: ${fracA.num * fracB.num}/${fracA.den * fracB.den} = ${formatFrac(result!)}`,
        ];
      case 'div':
        return [
          `Flip second fraction: ${fracB.num}/${fracB.den} → ${fracB.den}/${fracB.num}`,
          `Multiply: ${fracA.num}/${fracA.den} × ${fracB.den}/${fracB.num}`,
          `= ${fracA.num * fracB.den}/${fracA.den * fracB.num} = ${formatFrac(result!)}`,
        ];
    }
  };

  return (
    <div className="w-full min-h-[750px] bg-gradient-to-br from-slate-950 via-teal-950/10 to-slate-950 rounded-xl border border-teal-900/30 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-teal-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/30">
              <Percent className="text-teal-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-teal-300 tracking-wide">FRACTION WORKSHOP</h2>
              <p className="text-xs text-teal-500/70">Rational Number Arithmetic</p>
            </div>
          </div>

          <button
            onClick={() => setShowSteps(!showSteps)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showSteps
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}
          >
            Show Steps
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        
        {/* Main Equation Display */}
        <div className="bg-slate-900/50 rounded-xl border border-teal-800/30 p-6">
          <div className="flex items-center justify-center gap-4 md:gap-8 flex-wrap">
            {/* Fraction A */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-cyan-400 bg-cyan-500/10 rounded-xl p-4 border border-cyan-500/30"
            >
              <FractionDisplay frac={fracA} />
            </motion.div>

            {/* Operation */}
            <div className="text-4xl font-bold text-slate-400">
              {operations.find(o => o.id === operation)?.symbol}
            </div>

            {/* Fraction B */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-amber-400 bg-amber-500/10 rounded-xl p-4 border border-amber-500/30"
            >
              <FractionDisplay frac={fracB} />
            </motion.div>

            {/* Equals */}
            <div className="text-4xl font-bold text-slate-400">=</div>

            {/* Result */}
            <AnimatePresence mode="wait">
              {result && (
                <motion.div
                  key={formatFrac(result)}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="text-emerald-400 bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/30"
                >
                  <FractionDisplay frac={result} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Decimal equivalents */}
          <div className="mt-4 flex justify-center gap-8 text-xs text-slate-500 font-mono">
            <span>{toDecimal(fracA).toFixed(4)}</span>
            <span>{operations.find(o => o.id === operation)?.symbol}</span>
            <span>{toDecimal(fracB).toFixed(4)}</span>
            <span>=</span>
            <span className="text-emerald-400">{result ? toDecimal(result).toFixed(4) : '—'}</span>
          </div>
        </div>

        {/* Visual Bars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/50 rounded-xl border border-cyan-800/30 p-4">
            <FractionBar frac={fracA} color="text-cyan-400" label="A" />
          </div>
          <div className="bg-slate-900/50 rounded-xl border border-amber-800/30 p-4">
            <FractionBar frac={fracB} color="text-amber-400" label="B" />
          </div>
          <div className="bg-slate-900/50 rounded-xl border border-emerald-800/30 p-4">
            {result && <FractionBar frac={result} color="text-emerald-400" label="Result" />}
          </div>
        </div>

        {/* Input Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fraction A */}
          <div className="bg-slate-900/50 rounded-xl border border-cyan-800/30 p-4">
            <h3 className="text-sm font-bold text-cyan-300 mb-3">FRACTION A</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">Numerator</label>
                <input
                  type="number"
                  value={fracA.num}
                  onChange={(e) => { setFracA({ ...fracA, num: parseInt(e.target.value) || 0 }); playSound('click'); }}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-cyan-400 font-mono text-center focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Denominator</label>
                <input
                  type="number"
                  value={fracA.den}
                  onChange={(e) => { setFracA({ ...fracA, den: parseInt(e.target.value) || 1 }); playSound('click'); }}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-cyan-400 font-mono text-center focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>
          </div>

          {/* Fraction B */}
          <div className="bg-slate-900/50 rounded-xl border border-amber-800/30 p-4">
            <h3 className="text-sm font-bold text-amber-300 mb-3">FRACTION B</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">Numerator</label>
                <input
                  type="number"
                  value={fracB.num}
                  onChange={(e) => { setFracB({ ...fracB, num: parseInt(e.target.value) || 0 }); playSound('click'); }}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-amber-400 font-mono text-center focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Denominator</label>
                <input
                  type="number"
                  value={fracB.den}
                  onChange={(e) => { setFracB({ ...fracB, den: parseInt(e.target.value) || 1 }); playSound('click'); }}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-amber-400 font-mono text-center focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Operations */}
        <div className="flex justify-center gap-2">
          {operations.map(op => (
            <button
              key={op.id}
              onClick={() => { setOperation(op.id); playSound('compute'); }}
              className={`px-4 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
                operation === op.id
                  ? 'bg-teal-500/30 text-teal-300 border border-teal-500/50'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              {op.icon}
              <span className="hidden md:inline">{op.name}</span>
            </button>
          ))}
        </div>

        {/* Steps */}
        {showSteps && result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-slate-900/50 rounded-xl border border-teal-800/30 p-4"
          >
            <h3 className="text-sm font-bold text-teal-300 mb-3">STEP BY STEP</h3>
            <div className="space-y-2">
              {getSteps().map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-2 text-sm"
                >
                  <span className="text-teal-500 font-mono">{idx + 1}.</span>
                  <span className="text-slate-400">{step}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Presets */}
        <div className="flex flex-wrap justify-center gap-2">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => { setFracA(preset.a); setFracB(preset.b); playSound('click'); }}
              className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
            >
              {preset.label}
            </button>
          ))}
          <button
            onClick={() => { setFracA({ num: 3, den: 4 }); setFracB({ num: 1, den: 2 }); setOperation('add'); }}
            className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
          >
            <RotateCcw size={12} className="inline mr-1" />
            Reset
          </button>
        </div>

        {/* Sound Toggle */}
        <div className="flex justify-center">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              soundEnabled
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}
          >
            Sound: {soundEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Explanation */}
        <details className="bg-slate-900/50 rounded-xl border border-teal-800/30">
          <summary className="px-4 py-3 cursor-pointer text-sm text-teal-400 hover:text-teal-300 transition-colors">
            About Rational Arithmetic
          </summary>
          <div className="px-4 pb-4 text-xs text-teal-500 space-y-2">
            <p>
              <span className="text-teal-300">Rational numbers</span> are numbers that can be expressed 
              as a fraction p/q where p and q are integers and q ≠ 0.
            </p>
            <p>
              Results are automatically <span className="text-teal-300">simplified</span> using the 
              greatest common divisor (GCD) to find the lowest terms.
            </p>
            <p>
              Rational arithmetic is <span className="text-teal-300">exact</span> - unlike floating 
              point, there's no rounding error when working with fractions.
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}
