import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, RotateCcw, Scale, Search, Volume2, VolumeX, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Math Logic ---
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

const isArithmetic = (n: number): { isArith: boolean; divisors: number[]; sum: number; avg: number } => {
  const divisors = getDivisors(n);
  const sum = divisors.reduce((a, b) => a + b, 0);
  const avg = sum / divisors.length;
  return { isArith: Number.isInteger(avg), divisors, sum, avg };
};

const isPrime = (n: number): boolean => {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
};

// Generate first N arithmetic numbers
const generateArithmeticNumbers = (count: number): number[] => {
  const result: number[] = [];
  let n = 1;
  while (result.length < count) {
    if (isArithmetic(n).isArith) result.push(n);
    n++;
  }
  return result;
};

// Pre-compute first 100
const FIRST_100 = generateArithmeticNumbers(100);

// --- Component ---
export default function ArithmeticNumbersVisualization() {
  const [testNumber, setTestNumber] = useState<number>(30);
  const [currentResult, setCurrentResult] = useState<ReturnType<typeof isArithmetic> | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [scaleAngle, setScaleAngle] = useState(0);
  const [showFirst100, setShowFirst100] = useState(false);
  const [highlightedDivisor, setHighlightedDivisor] = useState<number | null>(null);
  const [discoveryMode, setDiscoveryMode] = useState(false);
  const [discoveryIndex, setDiscoveryIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number>(0);


  // --- Audio ---
  const playSound = useCallback((type: 'test' | 'success' | 'fail' | 'tick' | 'discover') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'test') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'success') {
      [523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.08, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25 + i * 0.1);
        osc.start(now + i * 0.1);
        osc.stop(now + 0.3 + i * 0.1);
      });
    } else if (type === 'fail') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'tick') {
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
    } else if (type === 'discover') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600 + discoveryIndex * 5, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  }, [soundEnabled, discoveryIndex]);

  // --- Test Number ---
  const runTest = useCallback(() => {
    if (testNumber < 1 || testNumber > 100000) return;
    
    setIsAnimating(true);
    setCurrentResult(null);
    setScaleAngle(0);
    playSound('test');

    // Animate scale wobble then settle
    let wobbleCount = 0;
    const wobble = () => {
      if (wobbleCount < 6) {
        setScaleAngle(Math.sin(wobbleCount * 1.5) * (15 - wobbleCount * 2));
        wobbleCount++;
        animationRef.current = window.setTimeout(wobble, 100);
      } else {
        const result = isArithmetic(testNumber);
        setCurrentResult(result);
        // Final angle: 0 if arithmetic (balanced), tilted if not
        setScaleAngle(result.isArith ? 0 : (result.avg > Math.floor(result.avg) + 0.5 ? 8 : -8));
        setIsAnimating(false);
        playSound(result.isArith ? 'success' : 'fail');
      }
    };
    wobble();
  }, [testNumber, playSound]);

  // --- Discovery Mode ---
  useEffect(() => {
    if (discoveryMode) {
      const interval = setInterval(() => {
        setDiscoveryIndex(prev => {
          if (prev >= 99) {
            setDiscoveryMode(false);
            return prev;
          }
          playSound('discover');
          return prev + 1;
        });
      }, 150);
      return () => clearInterval(interval);
    }
  }, [discoveryMode, playSound]);

  const reset = () => {
    clearTimeout(animationRef.current);
    setIsAnimating(false);
    setCurrentResult(null);
    setScaleAngle(0);
    setDiscoveryMode(false);
    setDiscoveryIndex(0);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'Enter') runTest();
      if (e.key === 'r' || e.key === 'R') reset();
      if (e.key === 'd' || e.key === 'D') setDiscoveryMode(prev => !prev);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [runTest]);

  // Navigate through numbers
  const goToNumber = (n: number) => {
    if (n >= 1 && n <= 100000) {
      setTestNumber(n);
      setCurrentResult(null);
    }
  };


  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-amber-950/10 to-slate-950 rounded-xl border border-amber-900/30 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-amber-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <Scale className="text-amber-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-300 tracking-wide">DIVISOR BALANCE</h2>
              <p className="text-xs text-amber-500/70">Arithmetic Number Tester</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
        
        {/* Input Section */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToNumber(testNumber - 1)}
                className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-amber-300 hover:border-amber-500/50 transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <input
                type="number"
                value={testNumber}
                onChange={(e) => setTestNumber(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-32 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-xl text-amber-300 font-mono text-center focus:outline-none focus:border-amber-500 transition-colors"
                min={1}
                max={100000}
              />
              <button
                onClick={() => goToNumber(testNumber + 1)}
                className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-amber-300 hover:border-amber-500/50 transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            
            <div className="flex gap-2 flex-1 sm:justify-end">
              <button
                onClick={runTest}
                disabled={isAnimating}
                className={`flex-1 sm:flex-none px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                  isAnimating
                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-wait'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30'
                }`}
              >
                <Search size={18} />
                TEST
              </button>
              <button
                onClick={reset}
                className="px-3 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </div>
          
          {/* Quick picks */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-slate-500">Try:</span>
            {[1, 2, 3, 6, 30, 42, 100].map(n => (
              <button
                key={n}
                onClick={() => { setTestNumber(n); setCurrentResult(null); }}
                className={`px-2 py-1 text-xs rounded border transition-all font-mono ${
                  testNumber === n 
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-amber-300 hover:border-amber-500/50'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Balance Scale Visualization */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(251,191,36,0.03),_transparent_70%)]" />
          
          <div className="relative h-64 flex flex-col items-center justify-center">
            {/* Scale Stand */}
            <div className="absolute bottom-0 w-6 h-24 bg-gradient-to-t from-slate-600 to-slate-500 rounded-t-sm" />
            <div className="absolute bottom-24 w-48 h-3 bg-slate-500 rounded-full" />
            
            {/* Scale Beam */}
            <motion.div
              className="absolute bottom-28 w-80 h-2 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 rounded-full origin-center shadow-lg"
              animate={{ rotate: scaleAngle }}
              transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            >
              {/* Left Pan - Sum */}
              <div className="absolute -left-2 top-0 w-1 h-12 bg-slate-500" />
              <motion.div 
                className="absolute -left-14 top-10 w-24 h-16 rounded-b-full bg-gradient-to-b from-slate-700 to-slate-800 border-2 border-slate-600 flex flex-col items-center justify-center overflow-hidden"
                animate={{ y: scaleAngle < 0 ? 5 : scaleAngle > 0 ? -5 : 0 }}
              >
                <span className="text-[10px] text-slate-400">SUM</span>
                <span className="text-lg font-bold text-amber-400 font-mono">
                  {currentResult?.sum ?? '?'}
                </span>
              </motion.div>

              {/* Right Pan - Count × Avg */}
              <div className="absolute -right-2 top-0 w-1 h-12 bg-slate-500" />
              <motion.div 
                className="absolute -right-14 top-10 w-24 h-16 rounded-b-full bg-gradient-to-b from-slate-700 to-slate-800 border-2 border-slate-600 flex flex-col items-center justify-center overflow-hidden"
                animate={{ y: scaleAngle > 0 ? 5 : scaleAngle < 0 ? -5 : 0 }}
              >
                <span className="text-[10px] text-slate-400">COUNT</span>
                <span className="text-lg font-bold text-cyan-400 font-mono">
                  {currentResult?.divisors.length ?? '?'}
                </span>
              </motion.div>
            </motion.div>

            {/* Result Badge */}
            <AnimatePresence>
              {currentResult && !isAnimating && (
                <motion.div
                  initial={{ scale: 0, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0 }}
                  className={`absolute top-4 px-6 py-3 rounded-xl border-2 ${
                    currentResult.isArith
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-red-500/20 border-red-500/50 text-red-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold">{testNumber}</div>
                    <div className="text-sm">
                      {currentResult.isArith ? '✓ ARITHMETIC' : '✗ NOT ARITHMETIC'}
                    </div>
                    <div className="text-xs opacity-70 mt-1">
                      avg = {currentResult.avg.toFixed(currentResult.isArith ? 0 : 2)}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>


        {/* Divisors Display */}
        {currentResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/30 rounded-xl border border-slate-800 p-4"
          >
            <div className="text-xs text-amber-400 mb-3 flex items-center justify-between">
              <span>Divisors of {testNumber}</span>
              <span className="text-slate-500">
                {currentResult.sum} ÷ {currentResult.divisors.length} = {currentResult.avg.toFixed(2)}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentResult.divisors.map((d, idx) => (
                <motion.div
                  key={d}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  onMouseEnter={() => setHighlightedDivisor(d)}
                  onMouseLeave={() => setHighlightedDivisor(null)}
                  className={`relative px-3 py-2 rounded-lg border font-mono text-sm transition-all cursor-default ${
                    highlightedDivisor === d
                      ? 'bg-amber-500/30 border-amber-500/50 text-amber-200 scale-110'
                      : isPrime(d)
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-slate-800/50 border-slate-700 text-slate-300'
                  }`}
                >
                  {d}
                  {isPrime(d) && d > 1 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" />
                  )}
                </motion.div>
              ))}
            </div>
            <div className="mt-3 flex gap-4 text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Prime divisor
              </span>
            </div>
          </motion.div>
        )}

        {/* First 100 Arithmetic Numbers */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 overflow-hidden">
          <button
            onClick={() => setShowFirst100(!showFirst100)}
            className="w-full px-4 py-3 flex items-center justify-between text-sm text-amber-400 hover:bg-slate-800/50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Play size={12} className={showFirst100 ? 'rotate-90' : ''} />
              First 100 Arithmetic Numbers
            </span>
            <span className="text-xs text-slate-500">Click to {showFirst100 ? 'hide' : 'show'}</span>
          </button>
          
          <AnimatePresence>
            {showFirst100 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => { setDiscoveryMode(!discoveryMode); setDiscoveryIndex(0); }}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                        discoveryMode
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-amber-500/50'
                      }`}
                    >
                      {discoveryMode ? 'Stop Discovery' : 'Start Discovery'}
                    </button>
                    <span className="text-xs text-slate-500">
                      {discoveryMode ? `Discovering: ${discoveryIndex + 1}/100` : 'Press D to toggle'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-10 gap-1 max-h-48 overflow-y-auto custom-scrollbar">
                    {FIRST_100.map((n, idx) => (
                      <motion.button
                        key={n}
                        onClick={() => { setTestNumber(n); setCurrentResult(null); }}
                        className={`p-2 rounded text-xs font-mono transition-all ${
                          idx <= discoveryIndex && discoveryMode
                            ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                            : testNumber === n
                            ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
                            : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:border-amber-500/30'
                        }`}
                        animate={idx === discoveryIndex && discoveryMode ? { scale: [1, 1.2, 1] } : {}}
                      >
                        {n}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">1st Arithmetic</div>
            <div className="text-xl font-bold text-amber-400 font-mono">1</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">100th Arithmetic</div>
            <div className="text-xl font-bold text-amber-400 font-mono">{FIRST_100[99]}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Not Arithmetic</div>
            <div className="text-xl font-bold text-red-400 font-mono">2</div>
            <div className="text-[10px] text-slate-600">(only even prime)</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">All Odd Primes</div>
            <div className="text-xl font-bold text-emerald-400">✓</div>
            <div className="text-[10px] text-slate-600">are arithmetic</div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Enter</kbd> Test
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">D</kbd> Discovery
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-amber-400 hover:text-amber-300 transition-colors">
          What are Arithmetic Numbers?
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            A number n is <span className="text-amber-300">arithmetic</span> if the average of its 
            divisors is an integer. The scale balances when sum ÷ count = whole number.
          </p>
          <p>
            <span className="text-emerald-300">All odd primes</span> are arithmetic: divisors are 1 and p, 
            sum is 1+p (even), average is (1+p)/2 which is always an integer.
          </p>
          <p>
            <span className="text-red-300">2 is NOT arithmetic</span>: divisors are 1 and 2, 
            average is 1.5 — not an integer!
          </p>
        </div>
      </details>
    </div>
  );
}
