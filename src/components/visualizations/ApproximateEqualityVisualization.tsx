import { useState, useRef, useCallback } from 'react';
import { Scale, Check, X, Play, RotateCcw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Logic ---

// Approximate equality using relative tolerance
const approxEqual = (a: number, b: number, epsilon: number = 1e-9): boolean => {
  // Handle exact equality (including infinities)
  if (a === b) return true;
  
  // Handle NaN
  if (Number.isNaN(a) || Number.isNaN(b)) return false;
  
  // Relative tolerance comparison
  const diff = Math.abs(a - b);
  const largest = Math.max(Math.abs(a), Math.abs(b));
  
  return diff <= largest * epsilon;
};

// Test cases from Rosetta Code
const TEST_CASES: Array<{ a: number; b: number; expected: boolean; description: string }> = [
  { a: 100000000000000.01, b: 100000000000000.011, expected: true, description: 'Large numbers with tiny difference' },
  { a: 100.01, b: 100.011, expected: false, description: 'Small numbers with same absolute difference' },
  { a: 10000000000000.001 / 10000.0, b: 1000000000.0000001000, expected: true, description: 'Division result comparison' },
  { a: 0.001, b: 0.0010000001, expected: true, description: 'Small decimals' },
  { a: 0.000000000000000000000101, b: 0.0, expected: false, description: 'Near-zero comparison' },
  { a: Math.sqrt(2) * Math.sqrt(2), b: 2.0, expected: true, description: 'sqrt(2) * sqrt(2) vs 2' },
  { a: -Math.sqrt(2) * Math.sqrt(2), b: -2.0, expected: true, description: 'Negative sqrt comparison' },
  { a: 3.14159265358979323846, b: 3.14159265358979324, expected: true, description: 'Pi approximations' },
];

interface ComparisonResult {
  a: number;
  b: number;
  isEqual: boolean;
  expected: boolean;
  description: string;
  diff: number;
  relativeDiff: number;
}

// --- Component ---

export default function ApproximateEqualityVisualization() {
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [customA, setCustomA] = useState('3.14159');
  const [customB, setCustomB] = useState('3.14160');
  const [epsilon, setEpsilon] = useState(1e-9);
  const [soundEnabled] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number>(0);

  // --- Audio ---
  const playSound = useCallback((type: 'test' | 'pass' | 'fail' | 'complete') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'test') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'pass') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'fail') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else {
      [523, 659, 784].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, now + i * 0.1);
        g.gain.setValueAtTime(0.08, now + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.4 + i * 0.1);
        o.start(now + i * 0.1);
        o.stop(now + 0.5 + i * 0.1);
      });
    }
  }, [soundEnabled]);

  // --- Run Tests ---
  const runTests = () => {
    setIsRunning(true);
    setResults([]);
    setCurrentIndex(0);

    let idx = 0;
    const runNext = () => {
      if (idx < TEST_CASES.length) {
        const test = TEST_CASES[idx];
        const isEqual = approxEqual(test.a, test.b, epsilon);
        const diff = Math.abs(test.a - test.b);
        const largest = Math.max(Math.abs(test.a), Math.abs(test.b));
        const relativeDiff = largest > 0 ? diff / largest : diff;

        const result: ComparisonResult = {
          ...test,
          isEqual,
          diff,
          relativeDiff
        };

        setResults(prev => [...prev, result]);
        setCurrentIndex(idx);
        playSound(isEqual === test.expected ? 'pass' : 'fail');

        idx++;
        timerRef.current = window.setTimeout(runNext, 600);
      } else {
        setIsRunning(false);
        playSound('complete');
      }
    };

    runNext();
  };

  const testCustom = () => {
    const a = parseFloat(customA);
    const b = parseFloat(customB);
    if (isNaN(a) || isNaN(b)) return;

    const isEqual = approxEqual(a, b, epsilon);
    playSound(isEqual ? 'pass' : 'fail');

    const diff = Math.abs(a - b);
    const largest = Math.max(Math.abs(a), Math.abs(b));
    const relativeDiff = largest > 0 ? diff / largest : diff;

    const result: ComparisonResult = {
      a, b, isEqual,
      expected: isEqual,
      description: 'Custom comparison',
      diff,
      relativeDiff
    };

    setResults([result]);
    setCurrentIndex(0);
  };

  const reset = () => {
    clearTimeout(timerRef.current);
    setIsRunning(false);
    setResults([]);
    setCurrentIndex(-1);
  };

  // Get current result for scale animation
  const currentResult = results[currentIndex];

  // Calculate scale tilt based on difference
  const getScaleTilt = (result: ComparisonResult | undefined): number => {
    if (!result) return 0;
    if (result.isEqual) return 0;
    const tilt = Math.min(Math.abs(result.a - result.b) * 10, 15);
    return result.a > result.b ? tilt : -tilt;
  };

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-rose-950/10 to-slate-950 rounded-xl border border-rose-900/30 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-rose-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30">
              <Scale className="text-rose-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-rose-300 tracking-wide">PRECISION BALANCE</h2>
              <p className="text-xs text-rose-500/70">Floating Point Equality Tester</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-rose-950/30 px-3 py-1.5 rounded-lg border border-rose-800/30">
            <span className="text-xs text-rose-400">ε =</span>
            <select
              value={epsilon}
              onChange={(e) => setEpsilon(parseFloat(e.target.value))}
              className="bg-transparent text-xs text-rose-300 focus:outline-none"
            >
              <option value={1e-6}>10⁻⁶</option>
              <option value={1e-9}>10⁻⁹</option>
              <option value={1e-12}>10⁻¹²</option>
              <option value={1e-15}>10⁻¹⁵</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        
        {/* Balance Scale Visualization */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(244,63,94,0.05),_transparent_70%)]" />
          
          <div className="relative h-48 flex flex-col items-center justify-center">
            {/* Scale Base */}
            <div className="absolute bottom-0 w-4 h-20 bg-gradient-to-t from-slate-700 to-slate-600 rounded-t-sm" />
            <div className="absolute bottom-20 w-32 h-2 bg-slate-600 rounded-full" />
            
            {/* Scale Beam */}
            <motion.div
              className="absolute bottom-24 w-64 h-1 bg-gradient-to-r from-rose-400 via-slate-400 to-rose-400 rounded-full origin-center"
              animate={{ rotate: getScaleTilt(currentResult) }}
              transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            >
              {/* Left Pan */}
              <div className="absolute -left-4 -top-1 w-2 h-16 bg-slate-500" />
              <motion.div 
                className="absolute -left-12 top-14 w-20 h-12 rounded-b-full bg-gradient-to-b from-slate-700 to-slate-800 border-2 border-slate-600 flex items-center justify-center"
                animate={{ y: currentResult ? (currentResult.a > currentResult.b ? 5 : -5) : 0 }}
              >
                <span className="text-[10px] text-cyan-400 font-mono truncate px-1">
                  {currentResult ? currentResult.a.toPrecision(6) : 'A'}
                </span>
              </motion.div>

              {/* Right Pan */}
              <div className="absolute -right-4 -top-1 w-2 h-16 bg-slate-500" />
              <motion.div 
                className="absolute -right-12 top-14 w-20 h-12 rounded-b-full bg-gradient-to-b from-slate-700 to-slate-800 border-2 border-slate-600 flex items-center justify-center"
                animate={{ y: currentResult ? (currentResult.b > currentResult.a ? 5 : -5) : 0 }}
              >
                <span className="text-[10px] text-amber-400 font-mono truncate px-1">
                  {currentResult ? currentResult.b.toPrecision(6) : 'B'}
                </span>
              </motion.div>
            </motion.div>

            {/* Result Indicator */}
            <AnimatePresence>
              {currentResult && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className={`absolute top-4 px-4 py-2 rounded-full border-2 flex items-center gap-2 ${
                    currentResult.isEqual
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                      : 'bg-red-500/20 border-red-500/50 text-red-400'
                  }`}
                >
                  {currentResult.isEqual ? <Check size={18} /> : <X size={18} />}
                  <span className="font-bold text-sm">
                    {currentResult.isEqual ? 'APPROXIMATELY EQUAL' : 'NOT EQUAL'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Current Test Description */}
          {currentResult && (
            <div className="text-center mt-4 text-sm text-slate-400">
              {currentResult.description}
            </div>
          )}
        </div>

        {/* Custom Input */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-rose-400 mb-3 flex items-center gap-2">
            <Sparkles size={12} />
            Custom Comparison
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={customA}
              onChange={(e) => setCustomA(e.target.value)}
              placeholder="Value A"
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-cyan-300 font-mono focus:outline-none focus:border-rose-500"
            />
            <div className="flex items-center justify-center text-slate-500">≈</div>
            <input
              type="text"
              value={customB}
              onChange={(e) => setCustomB(e.target.value)}
              placeholder="Value B"
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-amber-300 font-mono focus:outline-none focus:border-rose-500"
            />
            <button
              onClick={testCustom}
              className="px-4 py-2 bg-rose-500/20 text-rose-300 border border-rose-500/50 rounded-lg hover:bg-rose-500/30 transition-all text-sm font-bold"
            >
              TEST
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <button
            onClick={runTests}
            disabled={isRunning}
            className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
              isRunning
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-wait'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/50 hover:bg-rose-500/30'
            }`}
          >
            <Play size={18} />
            {isRunning ? 'TESTING...' : 'RUN ALL TESTS'}
          </button>
          <button
            onClick={reset}
            className="px-4 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        {/* Results Table */}
        {results.length > 0 && (
          <div className="bg-slate-900/30 rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 text-xs text-slate-500">
              Test Results ({results.filter(r => r.isEqual === r.expected).length}/{results.length} passed)
            </div>
            <div className="max-h-64 overflow-y-auto custom-scrollbar">
              <table className="w-full text-xs">
                <thead className="bg-slate-900/50 sticky top-0">
                  <tr className="text-slate-500">
                    <th className="px-3 py-2 text-left">A</th>
                    <th className="px-3 py-2 text-left">B</th>
                    <th className="px-3 py-2 text-left">Result</th>
                    <th className="px-3 py-2 text-left">Rel. Diff</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, idx) => (
                    <motion.tr
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`border-t border-slate-800/50 ${
                        result.isEqual === result.expected ? '' : 'bg-red-500/5'
                      }`}
                    >
                      <td className="px-3 py-2 font-mono text-cyan-400">{result.a.toPrecision(8)}</td>
                      <td className="px-3 py-2 font-mono text-amber-400">{result.b.toPrecision(8)}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${
                          result.isEqual
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {result.isEqual ? <Check size={10} /> : <X size={10} />}
                          {result.isEqual ? 'Equal' : 'Not Equal'}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-500">{result.relativeDiff.toExponential(2)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-rose-400 hover:text-rose-300 transition-colors">
          How does approximate equality work?
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            <span className="text-rose-300">Floating point numbers</span> can't represent all decimal values exactly, 
            leading to tiny rounding errors in calculations.
          </p>
          <p>
            We use <span className="text-rose-300">relative tolerance</span> (epsilon × max(|a|, |b|)) instead of 
            absolute tolerance, so the comparison scales with the magnitude of the numbers.
          </p>
          <p>
            This is why 100000000000000.01 ≈ 100000000000000.011 (tiny relative difference), 
            but 100.01 ≠ 100.011 (larger relative difference).
          </p>
        </div>
      </details>
    </div>
  );
}
