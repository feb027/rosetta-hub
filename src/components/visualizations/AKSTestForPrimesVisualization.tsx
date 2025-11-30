import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Zap, Volume2, VolumeX, ChevronRight, Check, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Math Logic ---

// Compute binomial coefficient C(n, k) using BigInt for large values
const binomial = (n: number, k: number): bigint => {
  if (k > n - k) k = n - k;
  let result = 1n;
  for (let i = 0; i < k; i++) {
    result = result * BigInt(n - i) / BigInt(i + 1);
  }
  return result;
};

// Get coefficients of (x-1)^p expanded
// Returns array where index i is coefficient of x^i
const expandPolynomial = (p: number): bigint[] => {
  const coeffs: bigint[] = [];
  for (let k = 0; k <= p; k++) {
    // Coefficient of x^k in (x-1)^p is C(p,k) * (-1)^(p-k)
    const sign = (p - k) % 2 === 0 ? 1n : -1n;
    coeffs.push(sign * binomial(p, k));
  }
  return coeffs;
};

// Get coefficients of (x-1)^p - (x^p - 1)
// This simplifies to: all middle coefficients of (x-1)^p (excluding x^p and constant term)
const getTestCoefficients = (p: number): bigint[] => {
  const expanded = expandPolynomial(p);
  // (x-1)^p - (x^p - 1) = (x-1)^p - x^p + 1
  // The x^p term cancels, and the constant term becomes 0
  // So we just need the middle coefficients
  return expanded.slice(1, -1);
};

// Check if all coefficients are divisible by p
const checkDivisibility = (coeffs: bigint[], p: number): boolean[] => {
  const pBig = BigInt(p);
  return coeffs.map(c => c % pBig === 0n);
};

// Simple primality check for verification
const isPrime = (n: number): boolean => {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
};

// Find all primes under a limit using AKS theorem
const findPrimesUnder = (limit: number): number[] => {
  const primes: number[] = [];
  for (let p = 2; p < limit; p++) {
    const coeffs = getTestCoefficients(p);
    const divisible = checkDivisibility(coeffs, p);
    if (divisible.every(d => d)) {
      primes.push(p);
    }
  }
  return primes;
};

interface Step {
  type: 'expand' | 'subtract' | 'check' | 'result';
  coeffIndex?: number;
  divisible?: boolean;
}

// --- Component ---
export default function AKSTestForPrimesVisualization() {
  const [inputValue, setInputValue] = useState<string>('7');
  const [currentP, setCurrentP] = useState<number | null>(null);
  const [expandedCoeffs, setExpandedCoeffs] = useState<bigint[]>([]);
  const [testCoeffs, setTestCoeffs] = useState<bigint[]>([]);
  const [divisibilityResults, setDivisibilityResults] = useState<boolean[]>([]);
  const [currentStep, setCurrentStep] = useState<Step | null>(null);
  const [checkedIndex, setCheckedIndex] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [result, setResult] = useState<'prime' | 'composite' | null>(null);
  const [foundPrimes, setFoundPrimes] = useState<number[]>([]);
  const [showPrimeList, setShowPrimeList] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [speed, setSpeed] = useState(400);

  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number>(0);
  const isPausedRef = useRef(false);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // --- Audio ---
  const playSound = useCallback((type: 'expand' | 'check' | 'pass' | 'fail' | 'prime' | 'composite' | 'click') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'expand') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.1);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'check') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440 + checkedIndex * 30, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'pass') {
      [523, 659].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0.06, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1 + i * 0.05);
        osc.start(now + i * 0.05);
        osc.stop(now + 0.15 + i * 0.05);
      });
    } else if (type === 'fail') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'prime') {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.08, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25 + i * 0.1);
        osc.start(now + i * 0.1);
        osc.stop(now + 0.35 + i * 0.1);
      });
    } else if (type === 'composite') {
      [300, 250, 200].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        gain.gain.setValueAtTime(0.04, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15 + i * 0.12);
        osc.start(now + i * 0.12);
        osc.stop(now + 0.2 + i * 0.12);
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
  }, [soundEnabled, checkedIndex]);

  // --- Run Test ---
  const runTest = useCallback(() => {
    const p = parseInt(inputValue);
    if (isNaN(p) || p < 2 || p > 50) return;

    clearTimeout(animationRef.current);
    setCurrentP(p);
    setResult(null);
    setCheckedIndex(-1);
    setIsAnimating(true);
    setIsPaused(false);
    setShowPrimeList(false);
    setCurrentStep({ type: 'expand' });

    // Compute polynomial expansion
    const expanded = expandPolynomial(p);
    setExpandedCoeffs(expanded);
    playSound('expand');

    // After showing expansion, compute test coefficients
    animationRef.current = window.setTimeout(() => {
      if (isPausedRef.current) return;
      const test = getTestCoefficients(p);
      setTestCoeffs(test);
      setCurrentStep({ type: 'subtract' });
      playSound('expand');

      // Start checking divisibility
      const divisible = checkDivisibility(test, p);
      setDivisibilityResults(divisible);

      let idx = 0;
      const checkNext = () => {
        if (isPausedRef.current) {
          animationRef.current = window.setTimeout(checkNext, 100);
          return;
        }
        if (idx < test.length) {
          setCheckedIndex(idx);
          setCurrentStep({ type: 'check', coeffIndex: idx, divisible: divisible[idx] });
          
          if (divisible[idx]) {
            playSound('pass');
          } else {
            playSound('fail');
            // Found non-divisible coefficient - composite!
            animationRef.current = window.setTimeout(() => {
              setResult('composite');
              setCurrentStep({ type: 'result' });
              setIsAnimating(false);
              playSound('composite');
            }, speed);
            return;
          }
          
          idx++;
          animationRef.current = window.setTimeout(checkNext, speed);
        } else {
          // All coefficients divisible - prime!
          setResult('prime');
          setCurrentStep({ type: 'result' });
          setIsAnimating(false);
          playSound('prime');
        }
      };

      animationRef.current = window.setTimeout(checkNext, speed);
    }, speed * 2);
  }, [inputValue, playSound, speed]);

  // --- Find Primes ---
  const findPrimes = useCallback((limit: number) => {
    setShowPrimeList(true);
    const primes = findPrimesUnder(limit);
    setFoundPrimes(primes);
    playSound('prime');
  }, [playSound]);

  const reset = () => {
    clearTimeout(animationRef.current);
    setIsAnimating(false);
    setIsPaused(false);
    setCurrentP(null);
    setExpandedCoeffs([]);
    setTestCoeffs([]);
    setDivisibilityResults([]);
    setCurrentStep(null);
    setCheckedIndex(-1);
    setResult(null);
    setShowPrimeList(false);
    setFoundPrimes([]);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ') {
        e.preventDefault();
        if (isAnimating) togglePause();
        else runTest();
      }
      if (e.key === 'r' || e.key === 'R') reset();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [runTest, isAnimating]);

  // Format coefficient for display
  const formatCoeff = (c: bigint, power: number, isFirst: boolean = false): string => {
    const absC = c < 0n ? -c : c;
    const sign = c < 0n ? '-' : (isFirst ? '' : '+');
    const coeffStr = absC === 1n && power > 0 ? '' : absC.toString();
    const xPart = power === 0 ? '' : power === 1 ? 'x' : `x^${power}`;
    return `${sign}${coeffStr}${xPart}`;
  };

  // Build polynomial string
  const buildPolynomialString = (coeffs: bigint[]): string => {
    if (coeffs.length === 0) return '';
    const terms: string[] = [];
    for (let i = coeffs.length - 1; i >= 0; i--) {
      if (coeffs[i] !== 0n) {
        terms.push(formatCoeff(coeffs[i], i, terms.length === 0));
      }
    }
    return terms.join(' ');
  };

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-teal-950/10 to-slate-950 rounded-xl border border-teal-900/30 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-teal-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/30">
              <Zap className="text-teal-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-teal-300 tracking-wide">POLYNOMIAL PRIMALITY LAB</h2>
              <p className="text-xs text-teal-500/70">AKS Theorem Visualization</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Speed:</span>
              <input
                type="range"
                min="100"
                max="800"
                step="100"
                value={800 - speed + 100}
                onChange={(e) => setSpeed(800 - parseInt(e.target.value) + 100)}
                className="w-20 accent-teal-500"
              />
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled 
                  ? 'bg-teal-500/20 border-teal-500/50 text-teal-300' 
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
            <div className="flex-1">
              <label className="text-xs text-teal-400 mb-2 block flex items-center gap-1">
                <Sparkles size={12} />
                Test Number p (2-50)
              </label>
              <input
                type="number"
                min="2"
                max="50"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="e.g., 7"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-lg text-teal-300 font-mono focus:outline-none focus:border-teal-500 transition-colors"
                disabled={isAnimating}
              />
            </div>
            <div className="flex gap-2 sm:items-end">
              <button
                onClick={isAnimating ? togglePause : runTest}
                disabled={!inputValue}
                className={`flex-1 sm:flex-none px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                  isAnimating && !isPaused
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                    : 'bg-teal-500/20 text-teal-300 border border-teal-500/50 hover:bg-teal-500/30'
                }`}
              >
                {isAnimating && !isPaused ? <Pause size={18} /> : <Play size={18} />}
                {isAnimating ? (isPaused ? 'Resume' : 'Pause') : 'Test'}
              </button>
              <button
                onClick={reset}
                className="px-3 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </div>
          
          {/* Quick presets */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-slate-500">Try:</span>
            {[3, 5, 7, 11, 13, 4, 9, 15].map(n => (
              <button
                key={n}
                onClick={() => { setInputValue(String(n)); playSound('click'); }}
                className={`px-2 py-1 text-xs border rounded transition-all ${
                  isPrime(n)
                    ? 'bg-teal-900/30 border-teal-700/50 text-teal-400 hover:bg-teal-900/50'
                    : 'bg-rose-900/30 border-rose-700/50 text-rose-400 hover:bg-rose-900/50'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Theorem Display */}
        <div className="bg-gradient-to-r from-slate-900/80 to-teal-900/20 rounded-xl border border-teal-800/30 p-4">
          <div className="text-xs text-teal-500 mb-2">AKS Theorem</div>
          <div className="text-sm text-slate-300 font-mono">
            p is prime ⟺ all coefficients of <span className="text-teal-300">(x-1)^p - (x^p - 1)</span> are divisible by p
          </div>
        </div>

        {/* Visualization Area */}
        {currentP !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Step 1: Polynomial Expansion */}
            <div className={`bg-slate-900/50 rounded-xl border p-4 transition-all ${
              currentStep?.type === 'expand' ? 'border-teal-500/50 shadow-lg shadow-teal-500/10' : 'border-slate-800'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  expandedCoeffs.length > 0 ? 'bg-teal-500/30 text-teal-300' : 'bg-slate-700 text-slate-500'
                }`}>1</div>
                <span className="text-sm text-slate-400">Expand (x-1)^{currentP}</span>
              </div>
              
              {expandedCoeffs.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-slate-800/50 rounded-lg p-3 overflow-x-auto"
                >
                  <div className="text-teal-300 font-mono text-sm whitespace-nowrap">
                    (x-1)^{currentP} = {buildPolynomialString(expandedCoeffs)}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Step 2: Subtract x^p - 1 */}
            <div className={`bg-slate-900/50 rounded-xl border p-4 transition-all ${
              currentStep?.type === 'subtract' ? 'border-amber-500/50 shadow-lg shadow-amber-500/10' : 'border-slate-800'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  testCoeffs.length > 0 ? 'bg-amber-500/30 text-amber-300' : 'bg-slate-700 text-slate-500'
                }`}>2</div>
                <span className="text-sm text-slate-400">Compute (x-1)^{currentP} - (x^{currentP} - 1)</span>
              </div>
              
              {testCoeffs.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  <div className="text-xs text-slate-500">
                    The x^{currentP} terms cancel, constant terms cancel → middle coefficients remain
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="text-amber-300 font-mono text-sm">
                      Result: {testCoeffs.map((c, i) => formatCoeff(c, i + 1, i === 0)).join(' ')}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Step 3: Check Divisibility */}
            <div className={`bg-slate-900/50 rounded-xl border p-4 transition-all ${
              currentStep?.type === 'check' ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/10' : 'border-slate-800'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  checkedIndex >= 0 ? 'bg-cyan-500/30 text-cyan-300' : 'bg-slate-700 text-slate-500'
                }`}>3</div>
                <span className="text-sm text-slate-400">Check if each coefficient is divisible by {currentP}</span>
              </div>
              
              {testCoeffs.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {testCoeffs.map((coeff, idx) => {
                    const isChecked = idx <= checkedIndex;
                    const isDivisible = divisibilityResults[idx];
                    const isCurrent = idx === checkedIndex;
                    
                    return (
                      <motion.div
                        key={idx}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ 
                          scale: isCurrent ? 1.05 : 1, 
                          opacity: 1,
                        }}
                        transition={{ delay: idx * 0.02 }}
                        className={`p-2 rounded-lg border text-center transition-all ${
                          isCurrent
                            ? 'border-cyan-400 bg-cyan-500/20 shadow-lg shadow-cyan-500/20'
                            : isChecked
                            ? isDivisible
                              ? 'border-emerald-500/50 bg-emerald-500/10'
                              : 'border-rose-500/50 bg-rose-500/10'
                            : 'border-slate-700 bg-slate-800/50'
                        }`}
                      >
                        <div className="text-[10px] text-slate-500 mb-1">x^{idx + 1}</div>
                        <div className={`font-mono text-xs ${
                          isCurrent ? 'text-cyan-300' :
                          isChecked ? (isDivisible ? 'text-emerald-300' : 'text-rose-300') : 'text-slate-400'
                        }`}>
                          {coeff.toString().length > 8 ? `${coeff.toString().slice(0, 6)}...` : coeff.toString()}
                        </div>
                        {isChecked && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="mt-1"
                          >
                            {isDivisible ? (
                              <Check size={12} className="text-emerald-400 mx-auto" />
                            ) : (
                              <X size={12} className="text-rose-400 mx-auto" />
                            )}
                          </motion.div>
                        )}
                        {isChecked && (
                          <div className={`text-[9px] mt-1 ${isDivisible ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {coeff.toString()} mod {currentP} = {(coeff % BigInt(currentP)).toString()}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
              
              {/* Progress bar */}
              {testCoeffs.length > 0 && (
                <div className="mt-3">
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${result === 'composite' ? 'bg-rose-500' : 'bg-teal-500'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${((checkedIndex + 1) / testCoeffs.length) * 100}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 mt-1 text-center">
                    {checkedIndex + 1} / {testCoeffs.length} coefficients checked
                  </div>
                </div>
              )}
            </div>

            {/* Result */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`rounded-xl border p-6 text-center ${
                    result === 'prime'
                      ? 'bg-gradient-to-r from-teal-900/30 to-emerald-900/30 border-teal-500/50'
                      : 'bg-gradient-to-r from-rose-900/30 to-orange-900/30 border-rose-500/50'
                  }`}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                    className="text-4xl mb-3"
                  >
                    {result === 'prime' ? '✨' : '❌'}
                  </motion.div>
                  <div className={`text-2xl font-bold mb-2 ${
                    result === 'prime' ? 'text-teal-300' : 'text-rose-300'
                  }`}>
                    {currentP} is {result === 'prime' ? 'PRIME' : 'COMPOSITE'}
                  </div>
                  <div className="text-sm text-slate-400">
                    {result === 'prime' 
                      ? `All ${testCoeffs.length} coefficients are divisible by ${currentP}`
                      : `Found coefficient not divisible by ${currentP}`
                    }
                  </div>
                  
                  {/* Verification */}
                  <div className="mt-3 text-xs text-slate-500">
                    <span className="text-slate-600">Verification: </span>
                    {isPrime(currentP) 
                      ? <span className="text-emerald-400">✓ Confirmed prime</span>
                      : <span className="text-rose-400">✓ Confirmed composite</span>
                    }
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Find Primes Section */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-teal-400 flex items-center gap-2">
              <Sparkles size={12} />
              Find All Primes Using AKS Theorem
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => findPrimes(35)}
                disabled={isAnimating}
                className="px-3 py-1.5 text-xs bg-teal-500/10 border border-teal-500/30 text-teal-400 rounded-lg hover:bg-teal-500/20 transition-all disabled:opacity-50"
              >
                Under 35
              </button>
              <button
                onClick={() => findPrimes(50)}
                disabled={isAnimating}
                className="px-3 py-1.5 text-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-all disabled:opacity-50"
              >
                Under 50
              </button>
            </div>
          </div>

          {showPrimeList && foundPrimes.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              <div className="flex flex-wrap gap-2">
                {foundPrimes.map((p, idx) => (
                  <motion.button
                    key={p}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => { setInputValue(String(p)); playSound('click'); }}
                    className="px-3 py-1.5 bg-teal-500/10 border border-teal-500/30 text-teal-300 rounded-lg text-sm font-mono hover:bg-teal-500/20 transition-all"
                  >
                    {p}
                  </motion.button>
                ))}
              </div>
              <div className="text-xs text-slate-500">
                Found {foundPrimes.length} primes. Click any to test it.
              </div>
            </motion.div>
          )}
        </div>

        {/* Polynomial Expansion Reference */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-slate-500 mb-3">Example: p = 3</div>
          <div className="space-y-2 text-xs font-mono">
            <div className="p-2 bg-slate-800/50 rounded border border-slate-700/50 text-slate-400">
              <span className="text-teal-400">(x-1)^3</span> = x³ - 3x² + 3x - 1
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <ChevronRight size={12} />
              <span>Subtract (x³ - 1)</span>
            </div>
            <div className="p-2 bg-slate-800/50 rounded border border-slate-700/50 text-slate-400">
              <span className="text-amber-400">(x-1)^3 - (x³-1)</span> = -3x² + 3x
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <ChevronRight size={12} />
              <span>Check: -3 mod 3 = 0 ✓, 3 mod 3 = 0 ✓</span>
            </div>
            <div className="p-2 bg-emerald-900/20 rounded border border-emerald-700/50 text-emerald-400">
              All coefficients divisible by 3 → <span className="font-bold">3 is prime!</span>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Space</kbd> Test / Pause
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-teal-400 hover:text-teal-300 transition-colors">
          About the AKS Primality Test
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            The <span className="text-teal-300">AKS primality test</span> is based on a theorem about 
            polynomial coefficients: a number p is prime if and only if all coefficients of 
            <span className="text-amber-300 font-mono"> (x-1)^p - (x^p - 1)</span> are divisible by p.
          </p>
          <p>
            This visualization demonstrates the <span className="text-teal-300">elementary theorem</span> 
            (discovered in the late 1600s), not the full AKS algorithm (2002) which achieves polynomial-time 
            complexity through additional optimizations.
          </p>
          <p>
            The coefficients come from <span className="text-cyan-300">Pascal's triangle</span> (binomial 
            coefficients). For prime p, all middle entries in row p are divisible by p.
          </p>
        </div>
      </details>
    </div>
  );
}
