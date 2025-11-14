import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Zap, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'motion/react';

type Strategy = 'optimal' | 'random';

interface Cycle {
  nodes: number[];
  length: number;
  color: string;
}

interface HistoryPoint {
  trial: number;
  rate: number;
}

const CYCLE_COLORS = [
  '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#ef4444', '#14b8a6', '#f97316', '#a855f7'
];

const PRESETS = [
  { name: 'Quick Demo', prisoners: 5, strategy: 'optimal' as Strategy },
  { name: 'Standard', prisoners: 10, strategy: 'optimal' as Strategy },
  { name: 'Challenge', prisoners: 20, strategy: 'optimal' as Strategy },
  { name: 'Random Fail', prisoners: 10, strategy: 'random' as Strategy },
];

export default function HundredPrisonersVisualization() {
  const [prisoners, setPrisoners] = useState(10);
  const [strategy, setStrategy] = useState<Strategy>('optimal');
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [maxSteps, setMaxSteps] = useState(0);
  const [drawers, setDrawers] = useState<number[]>([]);
  const [opened, setOpened] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);
  const [prisoner, setPrisoner] = useState(1);
  const [found, setFound] = useState(false);
  const [result, setResult] = useState<'win' | 'lose' | null>(null);
  const [stats, setStats] = useState({ trials: 0, wins: 0 });
  const [speed, setSpeed] = useState(200);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [batchProgress, setBatchProgress] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [prisonerPath, setPrisonerPath] = useState<number[]>([]);
  
  const audioContext = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && soundEnabled) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return () => {
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, [soundEnabled]);

  const playSound = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!soundEnabled || !audioContext.current) return;
    
    const oscillator = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.current.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.1, audioContext.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + duration);
    
    oscillator.start(audioContext.current.currentTime);
    oscillator.stop(audioContext.current.currentTime + duration);
  };

  const shuffle = (n: number) => {
    const arr = Array.from({ length: n }, (_, i) => i + 1);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const findCycles = (drawerArr: number[]): Cycle[] => {
    const visited = new Set<number>();
    const foundCycles: Cycle[] = [];
    let colorIndex = 0;

    for (let start = 1; start <= drawerArr.length; start++) {
      if (visited.has(start)) continue;
      const cycle: number[] = [];
      let current = start;
      while (!visited.has(current)) {
        visited.add(current);
        cycle.push(current);
        current = drawerArr[current - 1];
      }
      if (cycle.length > 0) {
        foundCycles.push({
          nodes: cycle,
          length: cycle.length,
          color: CYCLE_COLORS[colorIndex % CYCLE_COLORS.length]
        });
        colorIndex++;
      }
    }
    return foundCycles.sort((a, b) => b.length - a.length);
  };

  const getCycleColor = (drawerNum: number): string => {
    for (const cycle of cycles) {
      if (cycle.nodes.includes(drawerNum)) {
        return cycle.color;
      }
    }
    return '#64748b';
  };

  const start = () => {
    const newDrawers = shuffle(prisoners);
    setDrawers(newDrawers);
    const foundCycles = findCycles(newDrawers);
    setCycles(foundCycles);
    setOpened([]);
    const startDrawer = strategy === 'optimal' ? 1 : Math.floor(Math.random() * prisoners) + 1;
    setCurrent(startDrawer);
    setPrisoner(1);
    setPrisonerPath([startDrawer]);
    setStep(0);
    setMaxSteps(prisoners * Math.floor(prisoners / 2));
    setFound(false);
    setResult(null);
    setRunning(true);
  };

  const reset = () => {
    setRunning(false);
    setStep(0);
    setMaxSteps(0);
    setDrawers([]);
    setOpened([]);
    setCurrent(0);
    setPrisoner(1);
    setFound(false);
    setResult(null);
    setCycles([]);
    setPrisonerPath([]);
  };

  const loadPreset = (preset: typeof PRESETS[0]) => {
    reset();
    setPrisoners(preset.prisoners);
    setStrategy(preset.strategy);
  };

  const jumpToStep = (targetStep: number) => {
    if (targetStep < 0 || targetStep >= maxSteps) return;
    setStep(targetStep);
    setRunning(false);
  };

  const runBatch = async () => {
    setBatchProgress(0);
    let wins = 0;
    const batchSize = 100;
    
    for (let i = 0; i < batchSize; i++) {
      const testDrawers = shuffle(prisoners);
      let allFound = true;
      
      for (let p = 1; p <= prisoners; p++) {
        let testCurrent = strategy === 'optimal' ? p : 0;
        let testFound = false;
        
        for (let attempt = 0; attempt < Math.floor(prisoners / 2); attempt++) {
          if (strategy === 'random') {
            testCurrent = Math.floor(Math.random() * prisoners) + 1;
          }
          if (testDrawers[testCurrent - 1] === p) {
            testFound = true;
            break;
          }
          testCurrent = testDrawers[testCurrent - 1];
        }
        
        if (!testFound) {
          allFound = false;
          break;
        }
      }
      
      if (allFound) wins++;
      
      setBatchProgress(((i + 1) / batchSize) * 100);
      
      if ((i + 1) % 10 === 0) {
        const newTrials = stats.trials + (i + 1);
        const newWins = stats.wins + wins;
        setStats({ trials: newTrials, wins: newWins });
        setHistory(prev => [...prev, { trial: newTrials, rate: (newWins / newTrials) * 100 }]);
        await new Promise(r => setTimeout(r, 10));
      }
    }
    
    const finalTrials = stats.trials + batchSize;
    const finalWins = stats.wins + wins;
    setStats({ trials: finalTrials, wins: finalWins });
    setHistory(prev => [...prev, { trial: finalTrials, rate: (finalWins / finalTrials) * 100 }]);
    setBatchProgress(0);
    
    playSound(wins > 25 ? 800 : 400, 0.2, 'sine');
  };

  useEffect(() => {
    if (!running || drawers.length === 0) return;

    const timer = setTimeout(() => {
      const maxAttempts = Math.floor(prisoners / 2);
      
      if (step >= maxAttempts || found) {
        if (!found) {
          setResult('lose');
          setRunning(false);
          const newTrials = stats.trials + 1;
          setStats(prev => ({ trials: newTrials, wins: prev.wins }));
          setHistory(prev => [...prev, { trial: newTrials, rate: (stats.wins / newTrials) * 100 }]);
          playSound(200, 0.3, 'sawtooth');
          return;
        }
        
        if (prisoner >= prisoners) {
          setResult('win');
          setRunning(false);
          const newTrials = stats.trials + 1;
          const newWins = stats.wins + 1;
          setStats({ trials: newTrials, wins: newWins });
          setHistory(prev => [...prev, { trial: newTrials, rate: (newWins / newTrials) * 100 }]);
          playSound(600, 0.2, 'sine');
          setTimeout(() => playSound(800, 0.2, 'sine'), 100);
          return;
        }
        
        const nextPrisoner = prisoner + 1;
        setPrisoner(nextPrisoner);
        setOpened([]);
        const nextStart = strategy === 'optimal' ? nextPrisoner : Math.floor(Math.random() * prisoners) + 1;
        setCurrent(nextStart);
        setPrisonerPath([nextStart]);
        setStep(0);
        setFound(false);
        playSound(500, 0.1, 'sine');
        return;
      }

      const newOpened = [...opened, current];
      setOpened(newOpened);
      setPrisonerPath(prev => [...prev, current]);
      
      if (drawers[current - 1] === prisoner) {
        setFound(true);
        playSound(700, 0.15, 'sine');
      } else {
        const next = strategy === 'optimal' 
          ? drawers[current - 1]
          : Math.floor(Math.random() * prisoners) + 1;
        setCurrent(next);
        playSound(400, 0.05, 'square');
      }
      
      setStep(step + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [running, step, drawers, opened, current, prisoner, found, strategy, prisoners, speed, stats]);

  const rate = stats.trials > 0 ? ((stats.wins / stats.trials) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="glass rounded-xl p-4 border border-slate-600/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-100">Controls</h3>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 transition-all"
                title={soundEnabled ? 'Mute' : 'Unmute'}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Prisoners</label>
                <select
                  value={prisoners}
                  onChange={(e) => setPrisoners(Number(e.target.value))}
                  disabled={running || drawers.length > 0}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 text-sm"
                >
                  {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Strategy</label>
                <select
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value as Strategy)}
                  disabled={running || drawers.length > 0}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 text-sm"
                >
                  <option value="optimal">Optimal</option>
                  <option value="random">Random</option>
                </select>
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-xs text-slate-400 mb-1">Presets</label>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => loadPreset(preset)}
                    disabled={running || drawers.length > 0}
                    className="px-2 py-1 text-xs bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded border border-slate-600/50 transition-all disabled:opacity-50"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {drawers.length > 0 && (
              <div className="mb-3">
                <label className="block text-xs text-slate-400 mb-1">Speed</label>
                <div className="flex gap-2">
                  {[
                    { label: 'Slow', value: 400 },
                    { label: 'Med', value: 200 },
                    { label: 'Fast', value: 50 },
                  ].map(({ label, value }) => (
                    <button
                      key={value}
                      onClick={() => setSpeed(value)}
                      className={`flex-1 px-2 py-1 rounded text-xs ${
                        speed === value
                          ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400'
                          : 'bg-slate-700/50 text-slate-400'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {drawers.length === 0 ? (
                <>
                  <button
                    onClick={start}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg border border-cyan-500/50"
                  >
                    <Play size={16} />
                    <span className="text-sm font-medium">Start</span>
                  </button>
                  <button
                    onClick={runBatch}
                    disabled={batchProgress > 0}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg border border-purple-500/50 disabled:opacity-50"
                  >
                    <Zap size={16} />
                    <span className="text-sm font-medium">100x</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setRunning(!running)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg border border-cyan-500/50"
                  >
                    {running ? <Pause size={16} /> : <Play size={16} />}
                    <span className="text-sm">{running ? 'Pause' : 'Play'}</span>
                  </button>
                  <button
                    onClick={reset}
                    className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-600/50"
                  >
                    <RotateCcw size={16} />
                  </button>
                </>
              )}
            </div>

            {batchProgress > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Running batch...</span>
                  <span>{Math.round(batchProgress)}%</span>
                </div>
                <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-cyan-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${batchProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}

            {drawers.length > 0 && maxSteps > 0 && (
              <div className="mt-3">
                <label className="block text-xs text-slate-400 mb-1">Step Scrubber</label>
                <input
                  type="range"
                  min="0"
                  max={maxSteps - 1}
                  value={step}
                  onChange={(e) => jumpToStep(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0</span>
                  <span>{step}</span>
                  <span>{maxSteps}</span>
                </div>
              </div>
            )}
          </div>

          <div className="glass rounded-xl p-4 border border-slate-600/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-100">Stats</h3>
              {stats.trials > 0 && (
                <button
                  onClick={() => { setStats({ trials: 0, wins: 0 }); setHistory([]); }}
                  className="text-xs px-2 py-1 bg-slate-700/50 text-slate-400 rounded"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-800/50 rounded-lg p-3 text-center border border-slate-700/50">
                <div className="text-xs text-slate-400">Trials</div>
                <div className="text-xl font-bold text-slate-100">{stats.trials}</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center border border-slate-700/50">
                <div className="text-xs text-slate-400">Wins</div>
                <div className="text-xl font-bold text-green-400">{stats.wins}</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center border border-slate-700/50">
                <div className="text-xs text-slate-400">Rate</div>
                <div className="text-xl font-bold text-cyan-400">{rate}%</div>
              </div>
            </div>
            {stats.trials >= 10 && (
              <div className="mt-2 p-2 bg-slate-800/50 rounded border border-slate-700/50 text-xs text-slate-400">
                Expected: <span className="text-cyan-400 font-semibold">
                  {strategy === 'optimal' ? '~31%' : '~0%'}
                </span>
              </div>
            )}

            {history.length > 1 && (
              <div className="mt-3">
                <div className="text-xs text-slate-400 mb-2">Success Rate History</div>
                <div className="h-20 relative">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polyline
                      points={history.map((point, i) => 
                        `${(i / (history.length - 1)) * 100},${100 - point.rate}`
                      ).join(' ')}
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                    <line x1="0" y1={100 - (strategy === 'optimal' ? 31 : 0)} x2="100" y2={100 - (strategy === 'optimal' ? 31 : 0)} 
                      stroke="#64748b" strokeWidth="1" strokeDasharray="2,2" vectorEffect="non-scaling-stroke" />
                  </svg>
                  <div className="absolute top-0 right-0 text-xs text-slate-500">100%</div>
                  <div className="absolute bottom-0 right-0 text-xs text-slate-500">0%</div>
                </div>
              </div>
            )}
          </div>

          {cycles.length > 0 && strategy === 'optimal' && (
            <div className="glass rounded-xl p-4 border border-slate-600/50">
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Cycles</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Total:</span>
                  <span className="text-cyan-400 font-semibold">{cycles.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Longest:</span>
                  <span className={`font-semibold ${
                    cycles[0].length > Math.floor(prisoners / 2) ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {cycles[0].length} {cycles[0].length > Math.floor(prisoners / 2) && '(FAIL!)'}
                  </span>
                </div>
                {cycles.slice(0, 3).map((cycle, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded text-xs border"
                    style={{
                      backgroundColor: `${cycle.color}15`,
                      borderColor: `${cycle.color}50`
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cycle.color }}></div>
                      <span className="font-semibold" style={{ color: cycle.color }}>
                        Cycle {idx + 1}
                      </span>
                      <span className="text-slate-400">({cycle.length})</span>
                    </div>
                    <div className="text-slate-300">
                      {cycle.nodes.slice(0, 8).join(' → ')}
                      {cycle.nodes.length > 8 && '...'} ↺
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass rounded-xl p-4 border border-slate-600/50">
            <h3 className="text-lg font-semibold text-slate-100 mb-2">How It Works</h3>
            {strategy === 'optimal' ? (
              <div className="text-sm text-slate-300 space-y-2">
                <p>Start at drawer = your number, then follow the cards.</p>
                <p className="text-cyan-400">Success if all cycles ≤ {Math.floor(prisoners / 2)}!</p>
              </div>
            ) : (
              <div className="text-sm text-slate-300 space-y-2">
                <p>Randomly pick {Math.floor(prisoners / 2)} drawers.</p>
                <p className="text-red-400">Success: (1/2)^{prisoners} ≈ 0%</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {drawers.length > 0 && (
            <>
              <div className="glass rounded-xl p-3 border border-slate-600/50">
                <div className="text-sm text-slate-300">
                  <span className="text-cyan-400 font-semibold">Prisoner {prisoner}</span>
                  {' • '}
                  <span className="text-slate-400">Attempt {step + 1}/{Math.floor(prisoners / 2)}</span>
                  {found && <span className="text-green-400 ml-2">✓ Found!</span>}
                </div>
                {prisonerPath.length > 1 && (
                  <div className="mt-2 text-xs text-slate-400">
                    Path: <span className="text-cyan-300">{prisonerPath.join(' → ')}</span>
                  </div>
                )}
              </div>

              <div className="glass rounded-xl p-4 border border-slate-600/50">
                <h3 className="text-lg font-semibold text-slate-100 mb-3">Drawers</h3>
                <div className="grid gap-2" style={{
                  gridTemplateColumns: `repeat(${Math.min(prisoners, 10)}, minmax(0, 1fr))`
                }}>
                  {drawers.map((card, idx) => {
                    const num = idx + 1;
                    const isCurrent = num === current;
                    const isOpened = opened.includes(num);
                    const isFound = isCurrent && found;
                    const isInPath = prisonerPath.includes(num);
                    const cycleColor = strategy === 'optimal' ? getCycleColor(num) : null;

                    return (
                      <motion.div
                        key={num}
                        animate={{ 
                          scale: isCurrent ? 1.05 : 1,
                          y: isCurrent ? -5 : 0,
                        }}
                        className={`
                          aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-semibold
                          border-2 transition-all duration-200 relative
                          ${isFound ? 'bg-green-500/20 border-green-500 text-green-400' :
                            isCurrent ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' :
                            isOpened ? 'bg-blue-500/10 border-blue-500/50 text-blue-300' :
                            'bg-slate-700/30 border-slate-600/30 text-slate-400'}
                        `}
                        style={cycleColor && !isOpened ? {
                          borderColor: `${cycleColor}50`,
                          backgroundColor: `${cycleColor}10`
                        } : {}}
                      >
                        {isInPath && !isCurrent && (
                          <div className="absolute inset-0 bg-cyan-400/10 rounded-lg"></div>
                        )}
                        <div className="text-[9px] opacity-50">D{num}</div>
                        {isOpened ? (
                          <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-base font-bold"
                          >
                            {card}
                          </motion.div>
                        ) : (
                          <div className="text-lg opacity-40">?</div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
                
                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-cyan-500/20 border border-cyan-500"></div>
                    <span className="text-slate-400">Current</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-blue-500/10 border border-blue-500/50"></div>
                    <span className="text-slate-400">Opened</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500"></div>
                    <span className="text-slate-400">Found</span>
                  </div>
                  {strategy === 'optimal' && (
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded border-2" style={{ borderColor: CYCLE_COLORS[0] }}></div>
                      <span className="text-slate-400">Cycles</span>
                    </div>
                  )}
                </div>
              </div>

              {result && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`glass rounded-xl p-4 border text-center ${
                    result === 'win'
                      ? 'border-green-500/50 bg-green-500/5'
                      : 'border-red-500/50 bg-red-500/5'
                  }`}
                >
                  <div className={`font-semibold ${
                    result === 'win' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {result === 'win' ? '🎉 PARDONED!' : '❌ SENTENCED'}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">
                    {result === 'win' 
                      ? 'All prisoners found their cards!'
                      : 'At least one prisoner failed.'}
                  </div>
                </motion.div>
              )}
            </>
          )}

          {drawers.length === 0 && (
            <div className="glass rounded-xl p-8 border border-slate-600/50 text-center">
              <div className="text-slate-400 text-sm">Ready to simulate</div>
              <div className="text-slate-500 text-xs mt-1">Press Start or choose a preset</div>
            </div>
          )}
        </div>
      </div>

      <details className="glass rounded-xl border border-slate-600/50">
        <summary className="p-4 cursor-pointer text-slate-100 font-semibold hover:text-cyan-400">
          📚 Why Does the Optimal Strategy Work?
        </summary>
        <div className="px-4 pb-4 space-y-2 text-sm text-slate-300">
          <p>The drawer-card arrangement forms <span className="text-cyan-400 font-semibold">permutation cycles</span>.</p>
          <p>Following your number traverses a cycle. You succeed if cycle length ≤ 50.</p>
          <p>All prisoners in the same cycle succeed together. Failure only if any cycle {'>'} 50.</p>
          <p className="text-cyan-400 font-semibold">Probability ≈ 31.18% (vs 0% for random!)</p>
        </div>
      </details>
    </div>
  );
}
