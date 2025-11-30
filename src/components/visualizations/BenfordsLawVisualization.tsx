import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Search, BarChart3, Target, Zap } from 'lucide-react';
import { motion } from 'motion/react';

// Benford's law expected probabilities
const BENFORD_EXPECTED = [
  0, // placeholder for index 0
  0.30103, 0.17609, 0.12494, 0.09691,
  0.07918, 0.06695, 0.05799, 0.05115, 0.04576
];

// Data set generators
const DATA_SETS = {
  fibonacci: { name: 'Fibonacci (1000)', generate: generateFibonacci },
  powers2: { name: 'Powers of 2 (1000)', generate: generatePowersOf2 },
  factorials: { name: 'Factorials (100)', generate: generateFactorials },
  primes: { name: 'Primes (1000)', generate: generatePrimes },
};

function generateFibonacci(): bigint[] {
  const fibs: bigint[] = [1n, 1n];
  for (let i = 2; i < 1000; i++) {
    fibs.push(fibs[i - 1] + fibs[i - 2]);
  }
  return fibs;
}

function generatePowersOf2(): bigint[] {
  const powers: bigint[] = [];
  let p = 1n;
  for (let i = 0; i < 1000; i++) {
    powers.push(p);
    p *= 2n;
  }
  return powers;
}

function generateFactorials(): bigint[] {
  const facts: bigint[] = [1n];
  for (let i = 1; i < 100; i++) {
    facts.push(facts[i - 1] * BigInt(i));
  }
  return facts;
}

function generatePrimes(): bigint[] {
  const primes: bigint[] = [];
  let n = 2;
  while (primes.length < 1000) {
    let isPrime = true;
    for (let i = 2; i <= Math.sqrt(n); i++) {
      if (n % i === 0) { isPrime = false; break; }
    }
    if (isPrime) primes.push(BigInt(n));
    n++;
  }
  return primes;
}

function getFirstDigit(n: bigint): number {
  const str = n.toString();
  return parseInt(str[0]);
}

interface DigitCount {
  digit: number;
  count: number;
  actual: number;
  expected: number;
  deviation: number;
}

export default function BenfordsLawVisualization() {
  const [dataSetKey, setDataSetKey] = useState<keyof typeof DATA_SETS>('fibonacci');
  const [data, setData] = useState<bigint[]>([]);
  const [digitCounts, setDigitCounts] = useState<DigitCount[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(10);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countsRef = useRef<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);


  // Generate data when dataset changes
  useEffect(() => {
    const newData = DATA_SETS[dataSetKey].generate();
    setData(newData);
    setCurrentIndex(-1);
    setAnalysisComplete(false);
    countsRef.current = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    setDigitCounts([]);
  }, [dataSetKey]);

  // --- Audio ---
  const playSound = useCallback((type: 'tick' | 'scan' | 'complete' | 'click' | 'match' | 'deviation') => {
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
    } else if (type === 'scan') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'complete') {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.08, now + i * 0.1);
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
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'match') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'deviation') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  }, [soundEnabled]);

  // Update digit counts
  const updateCounts = useCallback(() => {
    const total = currentIndex + 1;
    if (total === 0) return [];
    
    return Array.from({ length: 9 }, (_, i) => {
      const digit = i + 1;
      const count = countsRef.current[digit];
      const actual = count / total;
      const expected = BENFORD_EXPECTED[digit];
      const deviation = Math.abs(actual - expected);
      return { digit, count, actual, expected, deviation };
    });
  }, [currentIndex]);

  // Process next batch
  const processNext = useCallback(() => {
    if (currentIndex >= data.length - 1) {
      setIsPlaying(false);
      setAnalysisComplete(true);
      playSound('complete');
      return;
    }

    const batchSize = Math.min(speed, data.length - currentIndex - 1);
    for (let i = 0; i < batchSize; i++) {
      const idx = currentIndex + 1 + i;
      const digit = getFirstDigit(data[idx]);
      countsRef.current[digit]++;
    }
    
    setCurrentIndex(prev => Math.min(prev + batchSize, data.length - 1));
    if (batchSize > 0) playSound('tick');
  }, [currentIndex, data, speed, playSound]);

  // Auto-play effect
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(processNext, 50);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, processNext]);

  // Update displayed counts
  useEffect(() => {
    setDigitCounts(updateCounts());
  }, [currentIndex, updateCounts]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex(-1);
    setAnalysisComplete(false);
    countsRef.current = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    setDigitCounts([]);
    playSound('click');
  }, [playSound]);

  const analyzeAll = useCallback(() => {
    countsRef.current = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    data.forEach(n => {
      const digit = getFirstDigit(n);
      countsRef.current[digit]++;
    });
    setCurrentIndex(data.length - 1);
    setAnalysisComplete(true);
    playSound('complete');
  }, [data, playSound]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ') { e.preventDefault(); setIsPlaying(p => !p); }
      if (e.key === 'r' || e.key === 'R') reset();
      if (e.key === 'a' || e.key === 'A') analyzeAll();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [reset, analyzeAll]);

  const maxExpected = Math.max(...BENFORD_EXPECTED);
  const progress = data.length > 0 ? ((currentIndex + 1) / data.length) * 100 : 0;
  const chiSquare = digitCounts.reduce((sum, d) => {
    if (d.count === 0) return sum;
    const expected = d.expected * (currentIndex + 1);
    return sum + Math.pow(d.count - expected, 2) / expected;
  }, 0);


  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-sky-950/10 to-slate-950 rounded-xl border border-sky-900/40 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-sky-800/40 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/15 border border-sky-500/40">
              <Search className="text-sky-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-sky-300 tracking-wide">DIGIT DETECTIVE</h2>
              <p className="text-xs text-sky-500/70">Benford's Law Analyzer</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-lg border text-xs font-mono ${
              analysisComplete 
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : currentIndex >= 0
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              {analysisComplete ? 'ANALYSIS COMPLETE' : currentIndex >= 0 ? 'SCANNING...' : 'READY'}
            </div>
            
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled 
                  ? 'bg-sky-500/20 border-sky-500/50 text-sky-300' 
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
        
        {/* Data Set Selector */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-slate-400 mb-3 flex items-center gap-2">
            <Zap size={14} />
            Select Data Set
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(DATA_SETS).map(([key, { name }]) => (
              <button
                key={key}
                onClick={() => { setDataSetKey(key as keyof typeof DATA_SETS); playSound('click'); }}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  dataSetKey === key
                    ? 'bg-sky-500/30 border-2 border-sky-400 text-sky-300'
                    : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-sky-300 hover:border-sky-500/50'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Analysis Progress</span>
            <span className="text-xs text-sky-400 font-mono">
              {currentIndex + 1} / {data.length} numbers
            </span>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-sky-600 to-cyan-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>

        {/* Main Visualization - Bar Chart */}
        <div className="bg-slate-900/30 rounded-xl border border-sky-800/30 p-6 relative overflow-hidden">
          {/* Scan line effect */}
          {isPlaying && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-sky-500/5 via-sky-500/10 to-transparent pointer-events-none"
              animate={{ y: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          )}

          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs text-sky-400 flex items-center gap-2">
                <BarChart3 size={14} />
                First Digit Distribution
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-sky-500" />
                  <span className="text-slate-400">Actual</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded border-2 border-amber-400 bg-transparent" />
                  <span className="text-slate-400">Expected</span>
                </div>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="flex items-end justify-around gap-2 h-64 px-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => {
                const data = digitCounts.find(d => d.digit === digit);
                const actualHeight = data ? (data.actual / maxExpected) * 100 : 0;
                const expectedHeight = (BENFORD_EXPECTED[digit] / maxExpected) * 100;
                const isClose = data && data.deviation < 0.02;
                
                return (
                  <div key={digit} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative w-full h-52 flex items-end justify-center">
                      {/* Expected bar (outline) */}
                      <div
                        className="absolute bottom-0 w-full border-2 border-amber-400/50 border-dashed rounded-t bg-amber-500/5"
                        style={{ height: `${expectedHeight}%` }}
                      />
                      
                      {/* Actual bar */}
                      <motion.div
                        className={`relative w-3/4 rounded-t ${
                          isClose ? 'bg-emerald-500' : 'bg-sky-500'
                        }`}
                        initial={{ height: 0 }}
                        animate={{ height: `${actualHeight}%` }}
                        transition={{ duration: 0.3, type: 'spring' }}
                        style={{ 
                          boxShadow: isClose 
                            ? '0 0 20px rgba(16,185,129,0.4)' 
                            : '0 0 15px rgba(14,165,233,0.3)'
                        }}
                      >
                        {/* Percentage label */}
                        {data && data.actual > 0 && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-slate-300 whitespace-nowrap"
                          >
                            {(data.actual * 100).toFixed(1)}%
                          </motion.div>
                        )}
                      </motion.div>
                    </div>
                    
                    {/* Digit label */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg ${
                      data && data.count > 0
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}>
                      {digit}
                    </div>
                    
                    {/* Count */}
                    <div className="text-xs font-mono text-slate-500">
                      {data?.count ?? 0}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>


        {/* Results Table */}
        {digitCounts.length > 0 && (
          <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4 overflow-x-auto">
            <div className="text-xs text-slate-400 mb-3 flex items-center gap-2">
              <Target size={14} />
              Detailed Analysis
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-xs border-b border-slate-700">
                  <th className="text-left py-2 px-3">Digit</th>
                  <th className="text-right py-2 px-3">Count</th>
                  <th className="text-right py-2 px-3">Actual %</th>
                  <th className="text-right py-2 px-3">Expected %</th>
                  <th className="text-right py-2 px-3">Deviation</th>
                  <th className="text-center py-2 px-3">Match</th>
                </tr>
              </thead>
              <tbody>
                {digitCounts.map(d => {
                  const isClose = d.deviation < 0.02;
                  return (
                    <motion.tr
                      key={d.digit}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-t border-slate-800"
                    >
                      <td className="py-2 px-3 font-mono font-bold text-sky-300">{d.digit}</td>
                      <td className="py-2 px-3 font-mono text-slate-300 text-right">{d.count}</td>
                      <td className="py-2 px-3 font-mono text-cyan-400 text-right">
                        {(d.actual * 100).toFixed(2)}%
                      </td>
                      <td className="py-2 px-3 font-mono text-amber-400 text-right">
                        {(d.expected * 100).toFixed(2)}%
                      </td>
                      <td className={`py-2 px-3 font-mono text-right ${
                        isClose ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {d.deviation < 0.001 ? '<0.1%' : `${(d.deviation * 100).toFixed(2)}%`}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {isClose ? (
                          <span className="text-emerald-400">✓</span>
                        ) : (
                          <span className="text-rose-400">✗</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Chi-Square Result */}
        {analysisComplete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border p-4 ${
              chiSquare < 15.51 
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-rose-500/10 border-rose-500/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 mb-1">Chi-Square Statistic (χ²)</div>
                <div className={`text-2xl font-bold font-mono ${
                  chiSquare < 15.51 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {chiSquare.toFixed(4)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400 mb-1">Critical Value (α=0.05, df=8)</div>
                <div className="text-lg font-mono text-slate-300">15.51</div>
              </div>
            </div>
            <div className={`mt-3 text-sm ${
              chiSquare < 15.51 ? 'text-emerald-300' : 'text-rose-300'
            }`}>
              {chiSquare < 15.51 
                ? '✓ Data follows Benford\'s Law (fail to reject null hypothesis)'
                : '✗ Data may not follow Benford\'s Law (reject null hypothesis)'}
            </div>
          </motion.div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={analysisComplete}
            className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'bg-sky-500/20 text-sky-300 border border-sky-500/50 hover:bg-sky-500/30'
            } disabled:opacity-50`}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            {isPlaying ? 'PAUSE' : analysisComplete ? 'COMPLETE' : 'SCAN'}
          </button>
          
          <button
            onClick={analyzeAll}
            disabled={analysisComplete}
            className="px-4 py-3 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            Instant Analysis
          </button>
          
          <button
            onClick={reset}
            className="px-4 py-3 bg-slate-800 text-slate-400 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all"
          >
            <RotateCcw size={18} />
          </button>

          {/* Speed control */}
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <span className="text-xs text-slate-500">Batch:</span>
            <input
              type="range"
              min="1"
              max="50"
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
              className="w-20 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
            <span className="text-xs text-slate-400 font-mono w-6">{speed}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Data Set</div>
            <div className="text-sm font-bold text-sky-400">{DATA_SETS[dataSetKey].name}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Analyzed</div>
            <div className="text-xl font-bold text-cyan-400 font-mono">{currentIndex + 1}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Most Common</div>
            <div className="text-xl font-bold text-amber-400 font-mono">
              {digitCounts.length > 0 
                ? digitCounts.reduce((a, b) => a.count > b.count ? a : b).digit
                : '—'}
            </div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">χ² Value</div>
            <div className={`text-xl font-bold font-mono ${
              analysisComplete 
                ? chiSquare < 15.51 ? 'text-emerald-400' : 'text-rose-400'
                : 'text-slate-400'
            }`}>
              {currentIndex >= 0 ? chiSquare.toFixed(2) : '—'}
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Space</kbd> Play/Pause
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">A</kbd> Instant Analysis
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-sky-400 hover:text-sky-300 transition-colors">
          About Benford's Law
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            <span className="text-sky-300">Benford's Law</span> states that in many naturally occurring 
            collections of numbers, the leading digit is likely to be small. The number 1 appears as 
            the first digit about 30% of the time.
          </p>
          <p>
            <span className="text-amber-300">Formula:</span> P(d) = log₁₀(1 + 1/d) where d is the 
            leading digit (1-9).
          </p>
          <p>
            <span className="text-emerald-300">Applications:</span> Fraud detection in financial data, 
            election forensics, scientific data validation, and detecting fabricated numbers.
          </p>
          <div className="mt-3 p-3 bg-slate-800/50 rounded-lg font-mono text-[11px]">
            <div className="text-slate-500 mb-1">// Expected probabilities</div>
            <div className="text-slate-300">1: 30.1%, 2: 17.6%, 3: 12.5%, 4: 9.7%, 5: 7.9%</div>
            <div className="text-slate-300">6: 6.7%, 7: 5.8%, 8: 5.1%, 9: 4.6%</div>
          </div>
        </div>
      </details>
    </div>
  );
}
