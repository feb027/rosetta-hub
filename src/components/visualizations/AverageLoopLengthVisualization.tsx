import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Orbit, Zap, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Math Logic ---
// Analytical expected value: sum of k * N! / N^k / (N-k)! for k=1 to N
const analyticalExpected = (n: number): number => {
  let sum = 0;
  let term = 1;
  for (let k = 1; k <= n; k++) {
    term *= (n - k + 1) / n;
    sum += k * term;
  }
  return sum + 1; // +1 because we count the starting position
};

// Simulate one random mapping and find loop length
const simulateOnce = (n: number): { path: number[]; loopStart: number } => {
  const mapping = Array.from({ length: n + 1 }, () => Math.floor(Math.random() * n) + 1);
  const path: number[] = [1];
  const seen = new Set<number>([1]);
  
  let current = mapping[1];
  while (!seen.has(current)) {
    path.push(current);
    seen.add(current);
    current = mapping[current];
  }
  path.push(current); // Add the repeated element
  
  return { path, loopStart: path.indexOf(current) };
};

// Run multiple simulations
const runSimulations = (n: number, count: number): number => {
  let totalLength = 0;
  for (let i = 0; i < count; i++) {
    const { path } = simulateOnce(n);
    totalLength += path.length - 1; // -1 because we don't count the repeated element
  }
  return totalLength / count;
};

// Pre-compute analytical values for N=1 to 20
const ANALYTICAL_VALUES = Array.from({ length: 21 }, (_, i) => i === 0 ? 0 : analyticalExpected(i));

export default function AverageLoopLengthVisualization() {
  const [maxN, setMaxN] = useState(20);
  const [simCount, setSimCount] = useState(10000);
  const [results, setResults] = useState<{ n: number; simulated: number; analytical: number; error: number }[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentN, setCurrentN] = useState(0);
  const [currentPath, setCurrentPath] = useState<number[]>([]);
  const [currentLoopStart, setCurrentLoopStart] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSingleSim, setShowSingleSim] = useState(false);
  const [singleSimN, setSingleSimN] = useState(10);

  const audioContextRef = useRef<AudioContext | null>(null);
  const runIntervalRef = useRef<number>(0);


  // --- Audio ---
  const playSound = useCallback((type: 'step' | 'complete' | 'loop' | 'click') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'step') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300 + currentN * 20, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'loop') {
      [400, 500, 600].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0.05, now + i * 0.05);
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
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.06, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3 + i * 0.1);
        osc.start(now + i * 0.1);
        osc.stop(now + 0.4 + i * 0.1);
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
  }, [soundEnabled, currentN]);

  // --- Run Simulations ---
  const startSimulations = useCallback(() => {
    setIsRunning(true);
    setResults([]);
    setCurrentN(1);

    let n = 1;
    runIntervalRef.current = window.setInterval(() => {
      if (n <= maxN) {
        const simulated = runSimulations(n, simCount);
        const analytical = ANALYTICAL_VALUES[n];
        const error = Math.abs((simulated - analytical) / analytical) * 100;
        
        setResults(prev => [...prev, { n, simulated, analytical, error }]);
        setCurrentN(n);
        playSound('step');
        n++;
      } else {
        clearInterval(runIntervalRef.current);
        setIsRunning(false);
        playSound('complete');
      }
    }, 100);
  }, [maxN, simCount, playSound]);

  const reset = () => {
    clearInterval(runIntervalRef.current);
    setIsRunning(false);
    setResults([]);
    setCurrentN(0);
    setCurrentPath([]);
  };

  // Single simulation visualization
  const runSingleSim = () => {
    const { path, loopStart } = simulateOnce(singleSimN);
    setCurrentPath(path);
    setCurrentLoopStart(loopStart);
    playSound('loop');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ') { e.preventDefault(); if (!isRunning) startSimulations(); }
      if (e.key === 'r' || e.key === 'R') reset();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [startSimulations, isRunning]);

  useEffect(() => {
    return () => clearInterval(runIntervalRef.current);
  }, []);

  const maxSimulated = Math.max(...results.map(r => r.simulated), 1);
  const maxAnalytical = Math.max(...results.map(r => r.analytical), 1);
  const maxValue = Math.max(maxSimulated, maxAnalytical);


  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-sky-950/10 to-slate-950 rounded-xl border border-sky-900/40 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950/30 to-slate-900 border-b border-sky-500/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2 rounded-lg bg-sky-500/20 border border-sky-500/50">
                <Orbit className="text-sky-400" size={24} />
              </div>
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-sky-400 rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-sky-300 tracking-wider">ORBIT TRACKER</h2>
              <p className="text-xs text-sky-500/70">Average Loop Length Simulator</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
        
        {/* Controls */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Max N</label>
              <input
                type="number"
                value={maxN}
                onChange={(e) => setMaxN(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sky-300 font-mono focus:outline-none focus:border-sky-500"
                min={1}
                max={20}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Simulations per N</label>
              <select
                value={simCount}
                onChange={(e) => setSimCount(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sky-300 font-mono focus:outline-none focus:border-sky-500"
              >
                <option value={1000}>1,000</option>
                <option value={10000}>10,000</option>
                <option value={100000}>100,000</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={isRunning ? reset : startSimulations}
                className={`flex-1 px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                  isRunning
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                    : 'bg-sky-500/20 text-sky-300 border border-sky-500/50 hover:bg-sky-500/30'
                }`}
              >
                {isRunning ? <Pause size={18} /> : <Play size={18} />}
                {isRunning ? 'STOP' : 'RUN'}
              </button>
              <button
                onClick={reset}
                className="px-3 py-2 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </div>

          {/* Progress */}
          {isRunning && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Progress: N = {currentN}</span>
                <span>{Math.round((currentN / maxN) * 100)}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-sky-500 to-cyan-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentN / maxN) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Results Chart */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-sky-400 flex items-center gap-2">
              <BarChart3 size={14} />
              Simulated vs Analytical
            </span>
            <div className="flex gap-4 text-[10px]">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-sky-500/50 rounded" /> Simulated
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-amber-500/50 rounded" /> Analytical
              </span>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="h-48 flex items-end gap-1">
            {Array.from({ length: maxN }, (_, i) => i + 1).map(n => {
              const result = results.find(r => r.n === n);
              const simHeight = result ? (result.simulated / maxValue) * 100 : 0;
              const anaHeight = result ? (result.analytical / maxValue) * 100 : 0;
              const isCurrent = n === currentN && isRunning;
              
              return (
                <div key={n} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full h-40 flex items-end gap-0.5 relative">
                    {/* Simulated bar */}
                    <motion.div
                      className={`flex-1 rounded-t ${isCurrent ? 'bg-sky-400' : 'bg-sky-500/50'}`}
                      initial={{ height: 0 }}
                      animate={{ height: `${simHeight}%` }}
                      transition={{ duration: 0.3 }}
                    />
                    {/* Analytical bar */}
                    <motion.div
                      className="flex-1 bg-amber-500/50 rounded-t"
                      initial={{ height: 0 }}
                      animate={{ height: `${anaHeight}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <span className={`text-[9px] font-mono ${isCurrent ? 'text-sky-300' : 'text-slate-500'}`}>
                    {n}
                  </span>
                </div>
              );
            })}
          </div>
        </div>


        {/* Results Table */}
        {results.length > 0 && (
          <div className="bg-slate-900/30 rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700/50">
              <span className="text-xs text-sky-400 font-mono">RESULTS TABLE</span>
            </div>
            <div className="max-h-64 overflow-y-auto custom-scrollbar">
              <table className="w-full text-xs">
                <thead className="bg-slate-800/30 sticky top-0">
                  <tr className="text-slate-400">
                    <th className="px-3 py-2 text-left">N</th>
                    <th className="px-3 py-2 text-right">Simulated</th>
                    <th className="px-3 py-2 text-right">Analytical</th>
                    <th className="px-3 py-2 text-right">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(({ n, simulated, analytical, error }) => (
                    <motion.tr
                      key={n}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="border-t border-slate-800/50 hover:bg-slate-800/30"
                    >
                      <td className="px-3 py-2 font-mono text-sky-300">{n}</td>
                      <td className="px-3 py-2 font-mono text-slate-300 text-right">{simulated.toFixed(4)}</td>
                      <td className="px-3 py-2 font-mono text-amber-300 text-right">{analytical.toFixed(4)}</td>
                      <td className={`px-3 py-2 font-mono text-right ${
                        error < 1 ? 'text-emerald-400' : error < 5 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {error.toFixed(2)}%
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Single Simulation Visualizer */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowSingleSim(!showSingleSim)}
              className="text-xs text-sky-400 flex items-center gap-2 hover:text-sky-300 transition-colors"
            >
              <Zap size={14} />
              Single Orbit Visualization
              <span className="text-slate-500">{showSingleSim ? '▼' : '▶'}</span>
            </button>
          </div>

          <AnimatePresence>
            {showSingleSim && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 block mb-1">N value</label>
                    <input
                      type="number"
                      value={singleSimN}
                      onChange={(e) => setSingleSimN(Math.min(15, Math.max(2, parseInt(e.target.value) || 2)))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sky-300 font-mono focus:outline-none focus:border-sky-500"
                      min={2}
                      max={15}
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={runSingleSim}
                      className="px-4 py-2 bg-sky-500/20 text-sky-300 border border-sky-500/50 rounded-lg font-bold hover:bg-sky-500/30 transition-all flex items-center gap-2"
                    >
                      <Orbit size={16} />
                      TRACE
                    </button>
                  </div>
                </div>

                {/* Orbit visualization */}
                {currentPath.length > 0 && (
                  <div className="bg-slate-900/50 rounded-xl p-4 relative overflow-hidden">
                    {/* Orbital rings decoration */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                      {[1, 2, 3].map(i => (
                        <div
                          key={i}
                          className="absolute border border-sky-500 rounded-full"
                          style={{ width: `${i * 30}%`, height: `${i * 30}%` }}
                        />
                      ))}
                    </div>

                    <div className="relative z-10">
                      <div className="text-xs text-slate-500 mb-3">
                        Path: {currentPath.length - 1} steps until repeat
                      </div>
                      
                      {/* Path visualization */}
                      <div className="flex flex-wrap items-center gap-2">
                        {currentPath.map((num, idx) => {
                          const isLoopStart = idx === currentLoopStart;
                          const isInLoop = idx >= currentLoopStart;
                          const isLast = idx === currentPath.length - 1;
                          
                          return (
                            <div key={idx} className="flex items-center gap-2">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`
                                  w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-sm
                                  ${isLast ? 'bg-red-500/30 border-2 border-red-500 text-red-300' :
                                    isLoopStart ? 'bg-amber-500/30 border-2 border-amber-500 text-amber-300' :
                                    isInLoop ? 'bg-sky-500/30 border border-sky-500 text-sky-300' :
                                    'bg-slate-700/50 border border-slate-600 text-slate-300'}
                                `}
                              >
                                {num}
                              </motion.div>
                              {idx < currentPath.length - 1 && (
                                <motion.span
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: idx * 0.05 + 0.025 }}
                                  className={`text-lg ${isInLoop ? 'text-sky-500' : 'text-slate-600'}`}
                                >
                                  →
                                </motion.span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Legend */}
                      <div className="mt-4 flex flex-wrap gap-4 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 bg-amber-500/30 border border-amber-500 rounded-full" /> Loop start
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 bg-red-500/30 border border-red-500 rounded-full" /> Repeated
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Avg Error</div>
            <div className="text-2xl font-bold text-emerald-400">
              {results.length > 0 
                ? (results.reduce((a, b) => a + b.error, 0) / results.length).toFixed(2) + '%'
                : '—'}
            </div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Total Sims</div>
            <div className="text-2xl font-bold text-sky-400">
              {(results.length * simCount).toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Max Loop (N=20)</div>
            <div className="text-2xl font-bold text-amber-400 font-mono">
              {ANALYTICAL_VALUES[20].toFixed(2)}
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Space</kbd> Run
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-sky-400 hover:text-sky-300 transition-colors">
          About Average Loop Length
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            Given a random mapping f: {'{1..N}'} → {'{1..N}'}, the sequence 1, f(1), f(f(1))... 
            will eventually repeat. The <span className="text-sky-300">average loop length</span> is 
            how many steps until the first repetition.
          </p>
          <p>
            The <span className="text-amber-300">analytical formula</span> gives the exact expected value:
            Σ(k=1 to N) of k × N! / N^k / (N-k)!
          </p>
          <p>
            This problem comes from Donald Knuth's Christmas Tree Lecture 2011.
          </p>
        </div>
      </details>
    </div>
  );
}
