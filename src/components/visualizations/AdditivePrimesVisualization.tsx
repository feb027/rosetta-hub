import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Zap, Volume2, VolumeX, Filter, Sparkles, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Helpers ---
const isPrime = (n: number): boolean => {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i <= Math.sqrt(n); i += 2) {
    if (n % i === 0) return false;
  }
  return true;
};

const digitSum = (n: number): number => {
  return String(n).split('').reduce((sum, d) => sum + parseInt(d), 0);
};

const isAdditivePrime = (n: number): boolean => {
  return isPrime(n) && isPrime(digitSum(n));
};

// Pre-compute all additive primes under 500
const ALL_ADDITIVE_PRIMES = Array.from({ length: 500 }, (_, i) => i)
  .filter(isAdditivePrime);

// --- Types ---
interface NumberState {
  value: number;
  isPrime: boolean;
  digitSum: number;
  isDigitSumPrime: boolean;
  isAdditive: boolean;
  status: 'pending' | 'checking' | 'passed' | 'failed';
}

// --- Component ---
export default function AdditivePrimesVisualization() {
  const [currentNumber, setCurrentNumber] = useState(2);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(50);
  const [foundPrimes, setFoundPrimes] = useState<number[]>([]);
  const [recentChecks, setRecentChecks] = useState<NumberState[]>([]);
  const [highlightedPrime, setHighlightedPrime] = useState<number | null>(null);
  const [testNumber, setTestNumber] = useState('');
  const [testResult, setTestResult] = useState<NumberState | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showAllResults, setShowAllResults] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number>(0);


  // --- Audio ---
  const playSound = useCallback((type: 'check' | 'found' | 'fail' | 'complete' | 'click') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'check') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300 + (currentNumber % 200), now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'found') {
      // Magical discovery sound
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0.1, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2 + i * 0.05);
        osc.start(now + i * 0.05);
        osc.stop(now + 0.25 + i * 0.05);
      });
    } else if (type === 'fail') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'complete') {
      [440, 554, 659, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.12, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4 + i * 0.1);
        osc.start(now + i * 0.1);
        osc.stop(now + 0.5 + i * 0.1);
      });
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.start(now);
      osc.stop(now + 0.03);
    }
  }, [soundEnabled, currentNumber]);

  // --- Check a number ---
  const checkNumber = useCallback((n: number): NumberState => {
    const prime = isPrime(n);
    const ds = digitSum(n);
    const dsPrime = isPrime(ds);
    const additive = prime && dsPrime;
    
    return {
      value: n,
      isPrime: prime,
      digitSum: ds,
      isDigitSumPrime: dsPrime,
      isAdditive: additive,
      status: additive ? 'passed' : 'failed',
    };
  }, []);

  // --- Main loop ---
  useEffect(() => {
    if (isRunning && currentNumber < 500) {
      intervalRef.current = window.setTimeout(() => {
        const result = checkNumber(currentNumber);
        
        if (result.isAdditive) {
          setFoundPrimes(prev => [...prev, currentNumber]);
          playSound('found');
        } else {
          playSound('check');
        }
        
        setRecentChecks(prev => [result, ...prev.slice(0, 7)]);
        setCurrentNumber(prev => prev + 1);
      }, Math.max(10, 200 - speed * 2));
    } else if (currentNumber >= 500 && isRunning) {
      setIsRunning(false);
      playSound('complete');
    }
    
    return () => clearTimeout(intervalRef.current);
  }, [isRunning, currentNumber, speed, checkNumber, playSound]);

  // --- Controls ---
  const toggleRunning = () => {
    if (currentNumber >= 500) {
      reset();
    }
    setIsRunning(!isRunning);
  };

  const reset = () => {
    setIsRunning(false);
    clearTimeout(intervalRef.current);
    setCurrentNumber(2);
    setFoundPrimes([]);
    setRecentChecks([]);
    setHighlightedPrime(null);
    setTestResult(null);
  };

  const instantComplete = () => {
    setIsRunning(false);
    clearTimeout(intervalRef.current);
    setFoundPrimes(ALL_ADDITIVE_PRIMES);
    setCurrentNumber(500);
    playSound('complete');
  };

  const testCustomNumber = () => {
    const n = parseInt(testNumber);
    if (isNaN(n) || n < 2) {
      playSound('fail');
      return;
    }
    const result = checkNumber(n);
    setTestResult(result);
    playSound(result.isAdditive ? 'found' : 'fail');
  };

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ') {
        e.preventDefault();
        toggleRunning();
      }
      if (e.key === 'r' || e.key === 'R') reset();
      if (e.key === 'i' || e.key === 'I') instantComplete();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentNumber]);

  const progress = ((currentNumber - 2) / 498) * 100;


  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-teal-950/10 to-slate-950 rounded-xl border border-teal-900/30 font-sans overflow-hidden">
      
      {/* Header - Distillery Theme */}
      <div className="bg-slate-900/80 border-b border-teal-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/30 relative">
              <Filter className="text-teal-400" size={24} />
              {isRunning && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 border-2 border-teal-400/30 border-t-teal-400 rounded-lg"
                />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-teal-300 tracking-wide">PRIME DISTILLERY</h2>
              <p className="text-xs text-teal-500/70">Filter Additive Primes from 2 to 500</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
            <div className="text-xs text-teal-400/70 bg-teal-950/30 px-3 py-2 rounded-lg border border-teal-800/30">
              Found: <span className="text-teal-300 font-bold">{foundPrimes.length}</span> / 54
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        
        {/* Progress Bar */}
        <div className="relative">
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <motion.div
              className="h-full bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-400 rounded-full relative"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </motion.div>
          </div>
          <div className="flex justify-between mt-1 text-xs text-slate-500">
            <span>2</span>
            <span className="text-teal-400 font-mono">Checking: {currentNumber < 500 ? currentNumber : 'Complete!'}</span>
            <span>500</span>
          </div>
        </div>

        {/* Current Number Display - The Distillation Chamber */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(20,184,166,0.05),_transparent_70%)]" />
          
          {/* Distillation Visualization */}
          <div className="relative flex flex-col items-center gap-6">
            
            {/* Input Number */}
            <div className="text-center">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Input Number</div>
              <motion.div
                key={currentNumber}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-5xl font-bold text-slate-200 font-mono"
              >
                {currentNumber < 500 ? currentNumber : '✓'}
              </motion.div>
            </div>

            {/* Filter Stages */}
            {recentChecks.length > 0 && recentChecks[0] && (
              <div className="w-full max-w-md">
                {/* Stage 1: Primality Check */}
                <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700 mb-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${
                    recentChecks[0].isPrime 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' 
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/50'
                  }`}>
                    {recentChecks[0].isPrime ? '✓' : '✗'}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-slate-500">Stage 1: Is Prime?</div>
                    <div className={`text-sm font-bold ${recentChecks[0].isPrime ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {recentChecks[0].value} is {recentChecks[0].isPrime ? 'PRIME' : 'NOT PRIME'}
                    </div>
                  </div>
                </div>

                {/* Stage 2: Digit Sum */}
                <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700 mb-2">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/50">
                    Σ
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-slate-500">Stage 2: Digit Sum</div>
                    <div className="text-sm font-bold text-cyan-400">
                      {String(recentChecks[0].value).split('').join(' + ')} = {recentChecks[0].digitSum}
                    </div>
                  </div>
                </div>

                {/* Stage 3: Digit Sum Primality */}
                <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${
                    recentChecks[0].isDigitSumPrime 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' 
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/50'
                  }`}>
                    {recentChecks[0].isDigitSumPrime ? '✓' : '✗'}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-slate-500">Stage 3: Is Digit Sum Prime?</div>
                    <div className={`text-sm font-bold ${recentChecks[0].isDigitSumPrime ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {recentChecks[0].digitSum} is {recentChecks[0].isDigitSumPrime ? 'PRIME' : 'NOT PRIME'}
                    </div>
                  </div>
                </div>

                {/* Final Result */}
                <motion.div
                  key={recentChecks[0].value}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`mt-4 p-4 rounded-xl border-2 text-center ${
                    recentChecks[0].isAdditive
                      ? 'bg-teal-500/10 border-teal-500/50'
                      : 'bg-slate-800/50 border-slate-700'
                  }`}
                >
                  {recentChecks[0].isAdditive ? (
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles className="text-teal-400" size={20} />
                      <span className="text-lg font-bold text-teal-300">ADDITIVE PRIME!</span>
                      <Sparkles className="text-teal-400" size={20} />
                    </div>
                  ) : (
                    <span className="text-slate-500">Not an additive prime</span>
                  )}
                </motion.div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={toggleRunning}
            className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
              isRunning
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 hover:bg-rose-500/30'
                : 'bg-teal-500/20 text-teal-300 border border-teal-500/50 hover:bg-teal-500/30'
            }`}
          >
            {isRunning ? <Pause size={18} /> : <Play size={18} />}
            {isRunning ? 'PAUSE' : currentNumber >= 500 ? 'RESTART' : 'START'}
          </button>
          <button
            onClick={instantComplete}
            disabled={currentNumber >= 500}
            className="px-4 py-3 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Zap size={18} />
            Instant
          </button>
          <button
            onClick={reset}
            className="px-4 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        {/* Speed Control */}
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500">Speed:</span>
          <input
            type="range"
            min="1"
            max="100"
            value={speed}
            onChange={(e) => setSpeed(parseInt(e.target.value))}
            className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
          />
          <span className="text-xs text-teal-400 w-12 text-right">{speed}%</span>
        </div>


        {/* Test Custom Number */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-slate-500 mb-3 flex items-center gap-2">
            <Search size={12} />
            Test Any Number
          </div>
          <div className="flex gap-3">
            <input
              type="number"
              value={testNumber}
              onChange={(e) => setTestNumber(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && testCustomNumber()}
              placeholder="Enter a number..."
              className="flex-1 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm font-mono placeholder:text-slate-600 focus:border-teal-500/50 focus:outline-none transition-colors"
            />
            <button
              onClick={testCustomNumber}
              className="px-4 py-2 rounded-lg bg-teal-500/20 border border-teal-500/50 text-teal-300 font-bold text-sm hover:bg-teal-500/30 transition-all"
            >
              Test
            </button>
          </div>
          
          {/* Test Result */}
          <AnimatePresence>
            {testResult && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mt-3 p-3 rounded-lg border ${
                  testResult.isAdditive
                    ? 'bg-teal-500/10 border-teal-500/30'
                    : 'bg-slate-800/50 border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-lg font-bold text-slate-200">{testResult.value}</span>
                    <span className="text-slate-500 mx-2">→</span>
                    <span className="text-cyan-400">{String(testResult.value).split('').join('+')}={testResult.digitSum}</span>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    testResult.isAdditive
                      ? 'bg-teal-500/20 text-teal-300'
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    {testResult.isAdditive ? '✓ ADDITIVE PRIME' : '✗ NOT ADDITIVE'}
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  {testResult.isPrime ? '✓ Prime' : '✗ Not prime'} • 
                  Digit sum {testResult.digitSum} is {testResult.isDigitSumPrime ? '✓ prime' : '✗ not prime'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Found Additive Primes Grid */}
        <div className="bg-slate-900/30 rounded-xl border border-teal-800/30 overflow-hidden">
          <div className="px-4 py-3 border-b border-teal-800/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-teal-400 text-sm">
              <Sparkles size={14} />
              <span>Discovered Additive Primes</span>
            </div>
            <button
              onClick={() => { setShowAllResults(!showAllResults); playSound('click'); }}
              className="text-xs text-slate-500 hover:text-teal-400 transition-colors"
            >
              {showAllResults ? 'Show Less' : 'Show All'}
            </button>
          </div>
          
          <div className={`p-4 ${showAllResults ? 'max-h-64' : 'max-h-32'} overflow-y-auto custom-scrollbar transition-all`}>
            {foundPrimes.length === 0 ? (
              <div className="text-center text-slate-600 text-sm py-4">
                No additive primes found yet. Start the distillation!
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <AnimatePresence mode="popLayout">
                  {foundPrimes.map((prime, idx) => (
                    <motion.button
                      key={prime}
                      layout
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ delay: idx * 0.01 }}
                      onClick={() => {
                        setHighlightedPrime(highlightedPrime === prime ? null : prime);
                        playSound('click');
                      }}
                      className={`px-3 py-1.5 rounded-lg font-mono text-sm font-bold transition-all hover:scale-105 ${
                        highlightedPrime === prime
                          ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
                          : 'bg-teal-500/10 text-teal-300 border border-teal-500/30 hover:bg-teal-500/20'
                      }`}
                    >
                      {prime}
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
          
          {/* Highlighted Prime Details */}
          <AnimatePresence>
            {highlightedPrime && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-teal-800/30 overflow-hidden"
              >
                <div className="p-4 bg-teal-500/5">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-bold text-teal-300 font-mono">{highlightedPrime}</div>
                    <div className="flex-1">
                      <div className="text-sm text-slate-400">
                        Digit sum: <span className="text-cyan-400 font-mono">
                          {String(highlightedPrime).split('').join(' + ')} = {digitSum(highlightedPrime)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Both {highlightedPrime} and {digitSum(highlightedPrime)} are prime numbers
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3">
            <div className="text-xs text-slate-500 mb-1">Checked</div>
            <div className="text-xl font-bold text-slate-300 font-mono">{Math.max(0, currentNumber - 2)}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-teal-800/30 p-3">
            <div className="text-xs text-teal-500 mb-1">Found</div>
            <div className="text-xl font-bold text-teal-300 font-mono">{foundPrimes.length}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3">
            <div className="text-xs text-slate-500 mb-1">Remaining</div>
            <div className="text-xl font-bold text-slate-300 font-mono">{Math.max(0, 500 - currentNumber)}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-emerald-800/30 p-3">
            <div className="text-xs text-emerald-500 mb-1">Hit Rate</div>
            <div className="text-xl font-bold text-emerald-300 font-mono">
              {currentNumber > 2 ? ((foundPrimes.length / (currentNumber - 2)) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Space</kbd> Play/Pause
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">I</kbd> Instant Complete
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-teal-400 hover:text-teal-300 transition-colors">
          What are Additive Primes?
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            <span className="text-teal-300">Additive primes</span> are prime numbers where the sum of their 
            decimal digits is also a prime number.
          </p>
          <p>
            <span className="text-teal-300">Example:</span> 23 is an additive prime because 23 is prime, 
            and 2 + 3 = 5, which is also prime.
          </p>
          <p>
            <span className="text-teal-300">Counter-example:</span> 13 is prime, but 1 + 3 = 4, which is 
            not prime. So 13 is NOT an additive prime.
          </p>
          <p>
            There are exactly <span className="text-emerald-400">54 additive primes</span> less than 500. 
            The sequence is: 2, 3, 5, 7, 11, 23, 29, 41, 43, 47, 61, 67, 83, 89...
          </p>
        </div>
      </details>
    </div>
  );
}
