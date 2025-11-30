import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Zap, FlaskConical, Sparkles, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Classification = 'deficient' | 'perfect' | 'abundant';

interface NumberData {
  n: number;
  divisorSum: number;
  classification: Classification;
  divisors: number[];
}

// Calculate proper divisors sum
function getProperDivisorsSum(n: number): { sum: number; divisors: number[] } {
  if (n <= 1) return { sum: 0, divisors: [] };
  const divisors: number[] = [1];
  let sum = 1;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) {
      divisors.push(i);
      sum += i;
      if (i !== n / i) {
        divisors.push(n / i);
        sum += n / i;
      }
    }
  }
  return { sum, divisors: divisors.sort((a, b) => a - b) };
}

function classify(n: number, sum: number): Classification {
  if (sum < n) return 'deficient';
  if (sum === n) return 'perfect';
  return 'abundant';
}

const COLORS = {
  deficient: { bg: 'bg-rose-500/20', border: 'border-rose-500/50', text: 'text-rose-400', fill: '#f43f5e' },
  perfect: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-400', fill: '#10b981' },
  abundant: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400', fill: '#06b6d4' },
};

const ICONS = {
  deficient: '📉',
  perfect: '⭐',
  abundant: '📈',
};

export default function AbundantDeficientPerfectVisualization() {
  const [isScanning, setIsScanning] = useState(false);
  const [currentNumber, setCurrentNumber] = useState(0);
  const [maxNumber, setMaxNumber] = useState(20000);
  const [speed, setSpeed] = useState(100);
  const [counts, setCounts] = useState({ deficient: 0, perfect: 0, abundant: 0 });
  const [recentNumbers, setRecentNumbers] = useState<NumberData[]>([]);
  const [perfectNumbers, setPerfectNumbers] = useState<number[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<NumberData | null>(null);
  const [testInput, setTestInput] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);

  // --- Audio ---
  const playSound = useCallback((type: 'scan' | 'perfect' | 'complete' | 'reset' | 'test') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'scan') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200 + (currentNumber / maxNumber) * 600, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.start(now);
      osc.stop(now + 0.03);
    } else if (type === 'perfect') {
      // Magical chime for perfect numbers
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.1, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4 + i * 0.08);
        osc.start(now + i * 0.08);
        osc.stop(now + 0.45 + i * 0.08);
      });
    } else if (type === 'complete') {
      [440, 554, 659, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        gain.gain.setValueAtTime(0.08, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + i * 0.12);
        osc.start(now + i * 0.12);
        osc.stop(now + 0.55 + i * 0.12);
      });
    } else if (type === 'reset') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'test') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  }, [soundEnabled, currentNumber, maxNumber]);

  // Process a batch of numbers
  const processBatch = useCallback(() => {
    const batchSize = speed;
    const newCounts = { ...counts };
    const newRecent: NumberData[] = [];
    const newPerfect: number[] = [...perfectNumbers];
    
    for (let i = 0; i < batchSize && currentNumber + i < maxNumber; i++) {
      const n = currentNumber + i + 1;
      const { sum, divisors } = getProperDivisorsSum(n);
      const classification = classify(n, sum);
      
      newCounts[classification]++;
      
      if (classification === 'perfect') {
        newPerfect.push(n);
        playSound('perfect');
      }
      
      // Keep last 12 for display
      if (i >= batchSize - 12) {
        newRecent.push({ n, divisorSum: sum, classification, divisors });
      }
    }
    
    setCounts(newCounts);
    setRecentNumbers(newRecent);
    setPerfectNumbers(newPerfect);
    setCurrentNumber(prev => Math.min(prev + batchSize, maxNumber));
    
    if (currentNumber + batchSize >= maxNumber) {
      setIsScanning(false);
      playSound('complete');
    } else if (batchSize <= 10) {
      playSound('scan');
    }
  }, [currentNumber, maxNumber, speed, counts, perfectNumbers, playSound]);

  // Animation loop
  useEffect(() => {
    if (isScanning) {
      intervalRef.current = window.setInterval(processBatch, 50);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [isScanning, processBatch]);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsScanning(false);
    setCurrentNumber(0);
    setCounts({ deficient: 0, perfect: 0, abundant: 0 });
    setRecentNumbers([]);
    setPerfectNumbers([]);
    setSelectedNumber(null);
    playSound('reset');
  }, [playSound]);

  const toggleScan = () => {
    if (currentNumber >= maxNumber) {
      reset();
      setTimeout(() => setIsScanning(true), 100);
    } else {
      setIsScanning(!isScanning);
    }
  };

  // Test a specific number
  const testNumber = () => {
    const n = parseInt(testInput);
    if (isNaN(n) || n < 1) return;
    
    const { sum, divisors } = getProperDivisorsSum(n);
    const classification = classify(n, sum);
    setSelectedNumber({ n, divisorSum: sum, classification, divisors });
    playSound('test');
  };

  // Instant complete
  const runInstant = () => {
    const newCounts = { deficient: 0, perfect: 0, abundant: 0 };
    const newPerfect: number[] = [];
    
    for (let n = 1; n <= maxNumber; n++) {
      const { sum } = getProperDivisorsSum(n);
      const classification = classify(n, sum);
      newCounts[classification]++;
      if (classification === 'perfect') newPerfect.push(n);
    }
    
    setCounts(newCounts);
    setPerfectNumbers(newPerfect);
    setCurrentNumber(maxNumber);
    setIsScanning(false);
    playSound('complete');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ') { e.preventDefault(); toggleScan(); }
      if (e.key === 'r' || e.key === 'R') reset();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [toggleScan, reset]);

  const progress = (currentNumber / maxNumber) * 100;
  const total = counts.deficient + counts.perfect + counts.abundant;

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-indigo-950/10 to-slate-950 rounded-xl border border-indigo-900/30 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-indigo-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
              <FlaskConical className="text-indigo-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-indigo-300 tracking-wide">NUMBER CLASSIFICATION LAB</h2>
              <p className="text-xs text-indigo-500/70">Analyzing Divisor Properties</p>
            </div>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border transition-all ${
              soundEnabled 
                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' 
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        
        {/* Classification Legend */}
        <div className="grid grid-cols-3 gap-3">
          {(['deficient', 'perfect', 'abundant'] as Classification[]).map((type) => (
            <motion.div
              key={type}
              className={`rounded-xl p-4 border ${COLORS[type].bg} ${COLORS[type].border} relative overflow-hidden`}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{ICONS[type]}</span>
                <span className={`text-sm font-bold uppercase ${COLORS[type].text}`}>{type}</span>
              </div>
              <div className={`text-3xl font-mono font-bold ${COLORS[type].text}`}>
                {counts[type].toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {total > 0 ? ((counts[type] / total) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-[10px] text-slate-600 mt-2">
                {type === 'deficient' && 'P(n) < n'}
                {type === 'perfect' && 'P(n) = n'}
                {type === 'abundant' && 'P(n) > n'}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="flex justify-between text-xs text-slate-500 mb-2">
            <span>Scanning: {currentNumber.toLocaleString()} / {maxNumber.toLocaleString()}</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden relative">
            <motion.div
              className="h-full rounded-full relative"
              style={{
                background: 'linear-gradient(90deg, #f43f5e 0%, #10b981 50%, #06b6d4 100%)',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
            {/* Scanning indicator */}
            {isScanning && (
              <motion.div
                className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ left: ['0%', '100%'] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={toggleScan}
            className={`flex-1 min-w-[140px] py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
              isScanning
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30'
                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 hover:bg-indigo-500/30'
            }`}
          >
            {isScanning ? <Pause size={18} /> : <Play size={18} />}
            {currentNumber >= maxNumber ? 'RESTART' : isScanning ? 'PAUSE' : 'SCAN'}
          </button>
          
          <button
            onClick={runInstant}
            disabled={isScanning}
            className="px-4 py-3 rounded-lg bg-emerald-900/30 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-900/50 transition-all disabled:opacity-50 flex items-center gap-2"
            title="Instant Complete"
          >
            <Zap size={18} />
          </button>
          
          <button
            onClick={reset}
            className="px-4 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
          >
            <RotateCcw size={18} />
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-slate-500">Speed:</span>
            <select
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-indigo-300 focus:outline-none focus:border-indigo-500"
            >
              <option value={1}>Slow (1/tick)</option>
              <option value={10}>Medium (10/tick)</option>
              <option value={100}>Fast (100/tick)</option>
              <option value={500}>Turbo (500/tick)</option>
            </select>
          </div>
        </div>

        {/* Settings */}
        <div className="flex flex-wrap items-center gap-4 bg-slate-900/30 rounded-lg border border-slate-800 p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Range:</span>
            <select
              value={maxNumber}
              onChange={(e) => { setMaxNumber(parseInt(e.target.value)); reset(); }}
              disabled={isScanning}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-indigo-300 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            >
              <option value={1000}>1 - 1,000</option>
              <option value={5000}>1 - 5,000</option>
              <option value={10000}>1 - 10,000</option>
              <option value={20000}>1 - 20,000</option>
              <option value={50000}>1 - 50,000</option>
            </select>
          </div>
        </div>

        {/* Perfect Numbers Discovery */}
        <AnimatePresence>
          {perfectNumbers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-900/20 rounded-xl border border-emerald-500/30 p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="text-emerald-400" size={18} />
                <span className="text-sm font-bold text-emerald-300">Perfect Numbers Discovered!</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {perfectNumbers.map((n) => (
                  <motion.button
                    key={n}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    onClick={() => {
                      const { sum, divisors } = getProperDivisorsSum(n);
                      setSelectedNumber({ n, divisorSum: sum, classification: 'perfect', divisors });
                      playSound('test');
                    }}
                    className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-300 font-mono font-bold hover:bg-emerald-500/30 transition-all"
                  >
                    {n.toLocaleString()}
                  </motion.button>
                ))}
              </div>
              <p className="text-xs text-emerald-500/70 mt-2">
                Click any perfect number to see its divisors
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent Numbers Grid */}
        {recentNumbers.length > 0 && (
          <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
            <div className="text-xs text-slate-500 mb-3">Recent Classifications</div>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
              {recentNumbers.map((data, idx) => (
                <motion.button
                  key={data.n}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  onClick={() => {
                    setSelectedNumber(data);
                    playSound('test');
                  }}
                  className={`p-2 rounded-lg border text-center transition-all hover:scale-105 ${COLORS[data.classification].bg} ${COLORS[data.classification].border}`}
                >
                  <div className={`text-sm font-mono font-bold ${COLORS[data.classification].text}`}>
                    {data.n}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Σ={data.divisorSum}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Test Any Number */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Search className="text-slate-400" size={16} />
            <span className="text-sm text-slate-400">Test Any Number</span>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && testNumber()}
              placeholder="Enter a number..."
              className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={testNumber}
              className="px-6 py-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 rounded-lg hover:bg-indigo-500/30 transition-all font-medium"
            >
              Classify
            </button>
          </div>
        </div>

        {/* Selected Number Detail */}
        <AnimatePresence>
          {selectedNumber && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`rounded-xl border p-6 ${COLORS[selectedNumber.classification].bg} ${COLORS[selectedNumber.classification].border}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">{ICONS[selectedNumber.classification]}</span>
                    <div>
                      <div className={`text-3xl font-mono font-bold ${COLORS[selectedNumber.classification].text}`}>
                        {selectedNumber.n.toLocaleString()}
                      </div>
                      <div className={`text-sm font-bold uppercase ${COLORS[selectedNumber.classification].text}`}>
                        {selectedNumber.classification}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNumber(null)}
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Divisor Visualization */}
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-slate-500 mb-2">Proper Divisors</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedNumber.divisors.map((d, i) => (
                      <motion.span
                        key={d}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm font-mono text-slate-300"
                      >
                        {d}
                      </motion.span>
                    ))}
                    {selectedNumber.divisors.length === 0 && (
                      <span className="text-slate-500 text-sm italic">None (n = 1)</span>
                    )}
                  </div>
                </div>

                {/* Sum Comparison */}
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-4 text-lg font-mono">
                    <span className="text-slate-400">P({selectedNumber.n})</span>
                    <span className="text-slate-500">=</span>
                    <span className={COLORS[selectedNumber.classification].text}>
                      {selectedNumber.divisorSum}
                    </span>
                    <span className={`text-xl ${COLORS[selectedNumber.classification].text}`}>
                      {selectedNumber.classification === 'deficient' && '<'}
                      {selectedNumber.classification === 'perfect' && '='}
                      {selectedNumber.classification === 'abundant' && '>'}
                    </span>
                    <span className="text-slate-400">{selectedNumber.n}</span>
                  </div>
                  
                  {/* Visual bar comparison */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 w-16">Sum:</span>
                      <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: COLORS[selectedNumber.classification].fill }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((selectedNumber.divisorSum / Math.max(selectedNumber.n, selectedNumber.divisorSum)) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-16 text-right">{selectedNumber.divisorSum}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 w-16">Number:</span>
                      <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-slate-600 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((selectedNumber.n / Math.max(selectedNumber.n, selectedNumber.divisorSum)) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-16 text-right">{selectedNumber.n}</span>
                    </div>
                  </div>
                </div>

                {/* Formula */}
                <div className="text-xs text-slate-500 font-mono text-center">
                  {selectedNumber.divisors.length > 0 
                    ? selectedNumber.divisors.join(' + ') + ' = ' + selectedNumber.divisorSum
                    : '(no proper divisors)'}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Space</kbd> Play/Pause
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Enter</kbd> Test Number
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
          What are Abundant, Deficient, and Perfect numbers?
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            Numbers are classified based on the sum of their <span className="text-indigo-300">proper divisors</span> 
            (all positive divisors except the number itself).
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><span className="text-rose-400">Deficient</span>: Sum &lt; n (e.g., 8: 1+2+4=7 &lt; 8)</li>
            <li><span className="text-emerald-400">Perfect</span>: Sum = n (e.g., 6: 1+2+3=6)</li>
            <li><span className="text-cyan-400">Abundant</span>: Sum &gt; n (e.g., 12: 1+2+3+4+6=16 &gt; 12)</li>
          </ul>
          <p className="mt-2">
            <span className="text-emerald-300">Perfect numbers</span> are extremely rare! Only 4 exist below 20,000: 
            <span className="font-mono text-emerald-400"> 6, 28, 496, 8128</span>
          </p>
          <p>
            The ancient Greeks considered perfect numbers to have mystical properties. 
            Euclid proved that 2^(p-1) × (2^p - 1) is perfect when (2^p - 1) is prime.
          </p>
        </div>
      </details>
    </div>
  );
}
