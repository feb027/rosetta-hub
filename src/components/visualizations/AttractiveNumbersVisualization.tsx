import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Magnet, Zap, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Math Logic ---
const isPrime = (n: number): boolean => {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
};

const getPrimeFactors = (n: number): number[] => {
  const factors: number[] = [];
  let num = n;
  for (let i = 2; i * i <= num; i++) {
    while (num % i === 0) {
      factors.push(i);
      num = num / i;
    }
  }
  if (num > 1) factors.push(num);
  return factors;
};

const isAttractive = (n: number): { attractive: boolean; factors: number[]; count: number } => {
  if (n < 2) return { attractive: false, factors: [], count: 0 };
  const factors = getPrimeFactors(n);
  const count = factors.length;
  return { attractive: isPrime(count), factors, count };
};

// Generate attractive numbers up to limit
const generateAttractiveNumbers = (limit: number): number[] => {
  const result: number[] = [];
  for (let n = 2; n <= limit; n++) {
    if (isAttractive(n).attractive) result.push(n);
  }
  return result;
};

// Pre-compute up to 120
const ATTRACTIVE_UP_TO_120 = generateAttractiveNumbers(120);

// Color based on factor count
const getFactorCountColor = (count: number): { bg: string; border: string; text: string; glow: string } => {
  const colors: Record<number, { bg: string; border: string; text: string; glow: string }> = {
    2: { bg: 'bg-rose-500/20', border: 'border-rose-500/50', text: 'text-rose-300', glow: 'shadow-rose-500/30' },
    3: { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-300', glow: 'shadow-amber-500/30' },
    5: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-300', glow: 'shadow-emerald-500/30' },
    7: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-300', glow: 'shadow-cyan-500/30' },
  };
  return colors[count] || { bg: 'bg-sky-500/20', border: 'border-sky-500/50', text: 'text-sky-300', glow: 'shadow-sky-500/30' };
};

export default function AttractiveNumbersVisualization() {
  const [isScanning, setIsScanning] = useState(false);
  const [currentNumber, setCurrentNumber] = useState(1);
  const [foundNumbers, setFoundNumbers] = useState<number[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [testNumber, setTestNumber] = useState<number>(20);
  const [testResult, setTestResult] = useState<ReturnType<typeof isAttractive> | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scanSpeed, setScanSpeed] = useState(50);
  const [showAllAtOnce, setShowAllAtOnce] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const scanIntervalRef = useRef<number>(0);


  // --- Audio ---
  const playSound = useCallback((type: 'scan' | 'found' | 'complete' | 'click' | 'test' | 'magnet') => {
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
      osc.frequency.setValueAtTime(200 + currentNumber * 2, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.start(now);
      osc.stop(now + 0.03);
    } else if (type === 'found') {
      [400, 600, 800].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0.06, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1 + i * 0.05);
        osc.start(now + i * 0.05);
        osc.stop(now + 0.15 + i * 0.05);
      });
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
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.start(now);
      osc.stop(now + 0.03);
    } else if (type === 'test') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.setValueAtTime(500, now + 0.1);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'magnet') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.2);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  }, [soundEnabled, currentNumber]);

  // --- Scan Logic ---
  const startScan = useCallback(() => {
    if (showAllAtOnce) {
      setFoundNumbers(ATTRACTIVE_UP_TO_120);
      setCurrentNumber(120);
      playSound('complete');
      return;
    }
    
    setIsScanning(true);
    setFoundNumbers([]);
    setCurrentNumber(2);
    setSelectedNumber(null);

    let num = 2;
    scanIntervalRef.current = window.setInterval(() => {
      if (num <= 120) {
        setCurrentNumber(num);
        const result = isAttractive(num);
        if (result.attractive) {
          setFoundNumbers(prev => [...prev, num]);
          playSound('found');
        } else {
          playSound('scan');
        }
        num++;
      } else {
        clearInterval(scanIntervalRef.current);
        setIsScanning(false);
        playSound('complete');
      }
    }, scanSpeed);
  }, [scanSpeed, showAllAtOnce, playSound]);

  const pauseScan = () => {
    clearInterval(scanIntervalRef.current);
    setIsScanning(false);
  };

  const reset = () => {
    clearInterval(scanIntervalRef.current);
    setIsScanning(false);
    setCurrentNumber(1);
    setFoundNumbers([]);
    setSelectedNumber(null);
    setTestResult(null);
  };

  const testSingleNumber = () => {
    if (testNumber < 2 || testNumber > 10000) return;
    const result = isAttractive(testNumber);
    setTestResult(result);
    playSound('test');
    if (result.attractive) {
      setTimeout(() => playSound('magnet'), 200);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ') { e.preventDefault(); isScanning ? pauseScan() : startScan(); }
      if (e.key === 'r' || e.key === 'R') reset();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [startScan, isScanning]);

  useEffect(() => {
    return () => clearInterval(scanIntervalRef.current);
  }, []);

  const selectedInfo = selectedNumber ? isAttractive(selectedNumber) : null;


  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-rose-950/10 to-slate-950 rounded-xl border border-rose-900/40 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/30 to-slate-900 border-b border-rose-500/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2 rounded-lg bg-rose-500/20 border border-rose-500/50">
                <Magnet className="text-rose-400" size={24} />
              </div>
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-rose-400 rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-rose-300 tracking-wider">MAGNETIC FIELD LAB</h2>
              <p className="text-xs text-rose-500/70">Attractive Number Detector</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled 
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' 
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
        
        {/* Controls */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={isScanning ? pauseScan : startScan}
                className={`px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all ${
                  isScanning
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/50 hover:bg-rose-500/30'
                }`}
              >
                {isScanning ? <Pause size={18} /> : <Play size={18} />}
                {isScanning ? 'PAUSE' : 'SCAN'}
              </button>
              <button
                onClick={reset}
                className="px-4 py-2.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
              >
                <RotateCcw size={18} />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-400">
                <input
                  type="checkbox"
                  checked={showAllAtOnce}
                  onChange={(e) => setShowAllAtOnce(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-800 text-rose-500 focus:ring-rose-500"
                />
                Instant
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Speed:</span>
                <input
                  type="range"
                  min={10}
                  max={200}
                  value={200 - scanSpeed}
                  onChange={(e) => setScanSpeed(200 - parseInt(e.target.value))}
                  className="w-20 accent-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Scanning: {currentNumber > 1 ? currentNumber : '—'}</span>
              <span>Found: {foundNumbers.length} / {ATTRACTIVE_UP_TO_120.length}</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-rose-500 to-amber-500"
                initial={{ width: 0 }}
                animate={{ width: `${((currentNumber - 1) / 119) * 100}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>
        </div>

        {/* Magnetic Field Visualization */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(244,63,94,0.05),_transparent_70%)]" />
          
          {/* Field lines decoration */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute left-1/2 top-1/2 border border-rose-500/30 rounded-full"
                style={{
                  width: `${(i + 1) * 15}%`,
                  height: `${(i + 1) * 15}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
              />
            ))}
          </div>

          <div className="relative z-10">
            <div className="text-xs text-rose-400 mb-3 flex items-center gap-2">
              <Zap size={14} />
              Attractive Numbers up to 120
            </div>
            
            {/* Number Grid */}
            <div className="grid grid-cols-10 md:grid-cols-15 lg:grid-cols-20 gap-1">
              {Array.from({ length: 119 }, (_, i) => i + 2).map(num => {
                const info = isAttractive(num);
                const isFound = foundNumbers.includes(num);
                const isCurrent = num === currentNumber && isScanning;
                const isSelected = num === selectedNumber;
                const color = info.attractive ? getFactorCountColor(info.count) : null;
                
                return (
                  <motion.button
                    key={num}
                    onClick={() => { setSelectedNumber(num); playSound('click'); }}
                    className={`
                      relative aspect-square rounded text-xs font-mono transition-all
                      ${isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-950' : ''}
                      ${isCurrent ? 'ring-2 ring-rose-400 animate-pulse' : ''}
                      ${isFound && color
                        ? `${color.bg} ${color.border} ${color.text} border shadow-lg ${color.glow}`
                        : num <= currentNumber
                        ? 'bg-slate-800/30 border border-slate-700/30 text-slate-600'
                        : 'bg-slate-900/50 border border-slate-800/50 text-slate-700'
                      }
                    `}
                    animate={isFound ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.2 }}
                    whileHover={{ scale: 1.15 }}
                  >
                    {num}
                    {info.attractive && isFound && (
                      <motion.div
                        className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-white rounded-full"
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>


        {/* Selected Number Detail */}
        <AnimatePresence>
          {selectedNumber && selectedInfo && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`rounded-xl border p-4 ${
                selectedInfo.attractive
                  ? 'bg-rose-500/10 border-rose-500/30'
                  : 'bg-slate-800/50 border-slate-700'
              }`}
            >
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`text-4xl font-bold font-mono ${
                    selectedInfo.attractive ? 'text-rose-300' : 'text-slate-400'
                  }`}>
                    {selectedNumber}
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${
                      selectedInfo.attractive ? 'text-rose-300' : 'text-slate-400'
                    }`}>
                      {selectedInfo.attractive ? '✓ ATTRACTIVE' : '✗ NOT ATTRACTIVE'}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {selectedInfo.factors.length > 0 
                        ? `${selectedNumber} = ${selectedInfo.factors.join(' × ')}`
                        : `${selectedNumber} = 1 (no prime factors)`
                      }
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-2 rounded-lg border ${
                    isPrime(selectedInfo.count)
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}>
                    <div className="text-xs text-slate-500">Factor Count</div>
                    <div className="text-xl font-bold font-mono">{selectedInfo.count}</div>
                    <div className="text-[10px]">
                      {isPrime(selectedInfo.count) ? '(prime ✓)' : '(not prime)'}
                    </div>
                  </div>
                  
                  {/* Factor visualization */}
                  <div className="flex gap-1">
                    {selectedInfo.factors.map((f, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-xs font-mono text-rose-300"
                      >
                        {f}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Test Any Number */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-slate-500 mb-3 flex items-center gap-2">
            <Search size={14} />
            Test Any Number
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="number"
              value={testNumber}
              onChange={(e) => setTestNumber(Math.max(2, parseInt(e.target.value) || 2))}
              className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-rose-300 font-mono focus:outline-none focus:border-rose-500 transition-colors"
              min={2}
              max={10000}
            />
            <button
              onClick={testSingleNumber}
              className="px-6 py-2 bg-rose-500/20 text-rose-300 border border-rose-500/50 rounded-lg font-bold hover:bg-rose-500/30 transition-all flex items-center gap-2"
            >
              <Magnet size={16} />
              TEST
            </button>
          </div>
          
          {/* Test Result */}
          <AnimatePresence>
            {testResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div className={`p-4 rounded-lg border ${
                  testResult.attractive
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={testResult.attractive ? { rotate: [0, 10, -10, 0] } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      <Magnet size={24} className={testResult.attractive ? 'text-emerald-400' : 'text-red-400'} />
                    </motion.div>
                    <div>
                      <div className={`font-bold ${testResult.attractive ? 'text-emerald-300' : 'text-red-300'}`}>
                        {testNumber} is {testResult.attractive ? 'ATTRACTIVE!' : 'not attractive'}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {testResult.factors.length > 0 
                          ? `Prime factors: ${testResult.factors.join(' × ')} (count: ${testResult.count}${isPrime(testResult.count) ? ' ← prime!' : ''})`
                          : 'No prime factors'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[2, 3, 5, 7].map(count => {
            const color = getFactorCountColor(count);
            const countInFound = foundNumbers.filter(n => isAttractive(n).count === count).length;
            return (
              <div key={count} className={`${color.bg} rounded-lg border ${color.border} p-3 text-center`}>
                <div className={`text-2xl font-bold ${color.text}`}>{countInFound}</div>
                <div className="text-xs text-slate-400">{count} factors</div>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Total Found</div>
            <div className="text-2xl font-bold text-rose-400">{foundNumbers.length}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">First Attractive</div>
            <div className="text-2xl font-bold text-amber-400 font-mono">4</div>
            <div className="text-[10px] text-slate-600">2×2 (2 factors)</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Last in Range</div>
            <div className="text-2xl font-bold text-emerald-400 font-mono">119</div>
            <div className="text-[10px] text-slate-600">7×17 (2 factors)</div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Space</kbd> Play/Pause
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-rose-400 hover:text-rose-300 transition-colors">
          What are Attractive Numbers?
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            A number is <span className="text-rose-300">attractive</span> if the count of its prime factors 
            (with repetition) is itself a prime number.
          </p>
          <p>
            For example, <span className="text-amber-300">20 = 2 × 2 × 5</span> has 3 prime factors, 
            and 3 is prime, so 20 is attractive.
          </p>
          <p>
            The sequence starts: 4, 6, 8, 9, 10, 12, 14, 15, 18, 20, 21, 22...
          </p>
          <p className="text-slate-500">
            Reference: OEIS A063989 - Numbers with a prime number of prime divisors.
          </p>
        </div>
      </details>
    </div>
  );
}
