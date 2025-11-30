import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Atom, ArrowLeftRight, Scale, Shuffle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Bucket {
  id: number;
  value: number;
}

interface Transfer {
  id: number;
  from: number;
  to: number;
  amount: number;
  type: 'equalize' | 'redistribute';
}

const INITIAL_BUCKETS: Bucket[] = [
  { id: 0, value: 100 },
  { id: 1, value: 200 },
  { id: 2, value: 150 },
  { id: 3, value: 50 },
  { id: 4, value: 300 },
  { id: 5, value: 200 },
];

export default function AtomicUpdatesVisualization() {
  const [buckets, setBuckets] = useState<Bucket[]>(INITIAL_BUCKETS);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTransfer, setCurrentTransfer] = useState<Transfer | null>(null);
  const [transferLog, setTransferLog] = useState<string[]>([]);
  const [totalOperations, setTotalOperations] = useState(0);
  const [equalizeOps, setEqualizeOps] = useState(0);
  const [redistributeOps, setRedistributeOps] = useState(0);
  const [speed, setSpeed] = useState(600);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number>(0);
  const transferIdRef = useRef(0);


  const totalValue = buckets.reduce((sum, b) => sum + b.value, 0);

  // --- Audio ---
  const playSound = useCallback((type: 'transfer' | 'equalize' | 'redistribute' | 'click' | 'start' | 'stop') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'transfer') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'equalize') {
      [440, 550, 660].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0.05, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15 + i * 0.05);
        osc.start(now + i * 0.05);
        osc.stop(now + 0.2 + i * 0.05);
      });
    } else if (type === 'redistribute') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.setValueAtTime(500, now + 0.1);
      osc.frequency.setValueAtTime(400, now + 0.2);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'start') {
      [300, 400, 500, 600].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.06, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2 + i * 0.08);
        osc.start(now + i * 0.08);
        osc.stop(now + 0.25 + i * 0.08);
      });
    } else if (type === 'stop') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
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
    }
  }, [soundEnabled]);

  const addLog = (message: string) => {
    setTransferLog(prev => [...prev.slice(-9), message]);
  };


  // --- Atomic Operations ---
  const performEqualize = useCallback(() => {
    // Pick two random buckets and make their values closer to equal
    const idx1 = Math.floor(Math.random() * buckets.length);
    let idx2 = Math.floor(Math.random() * buckets.length);
    while (idx2 === idx1) idx2 = Math.floor(Math.random() * buckets.length);

    const b1 = buckets[idx1];
    const b2 = buckets[idx2];
    
    if (b1.value === b2.value) return null;
    
    const diff = Math.abs(b1.value - b2.value);
    const transferAmount = Math.floor(diff / 2);
    
    if (transferAmount === 0) return null;
    
    const fromIdx = b1.value > b2.value ? idx1 : idx2;
    const toIdx = b1.value > b2.value ? idx2 : idx1;
    
    return {
      id: transferIdRef.current++,
      from: fromIdx,
      to: toIdx,
      amount: transferAmount,
      type: 'equalize' as const,
    };
  }, [buckets]);

  const performRedistribute = useCallback(() => {
    // Pick two random buckets and randomly redistribute
    const idx1 = Math.floor(Math.random() * buckets.length);
    let idx2 = Math.floor(Math.random() * buckets.length);
    while (idx2 === idx1) idx2 = Math.floor(Math.random() * buckets.length);

    const b1 = buckets[idx1];
    const b2 = buckets[idx2];
    const total = b1.value + b2.value;
    
    if (total === 0) return null;
    
    const newB1Value = Math.floor(Math.random() * (total + 1));
    const diff = newB1Value - b1.value;
    
    if (diff === 0) return null;
    
    const fromIdx = diff > 0 ? idx2 : idx1;
    const toIdx = diff > 0 ? idx1 : idx2;
    const amount = Math.abs(diff);
    
    return {
      id: transferIdRef.current++,
      from: fromIdx,
      to: toIdx,
      amount,
      type: 'redistribute' as const,
    };
  }, [buckets]);

  const applyTransfer = useCallback((transfer: Transfer) => {
    setBuckets(prev => prev.map((b, idx) => {
      if (idx === transfer.from) return { ...b, value: b.value - transfer.amount };
      if (idx === transfer.to) return { ...b, value: b.value + transfer.amount };
      return b;
    }));
    
    setTotalOperations(prev => prev + 1);
    if (transfer.type === 'equalize') {
      setEqualizeOps(prev => prev + 1);
      playSound('equalize');
    } else {
      setRedistributeOps(prev => prev + 1);
      playSound('redistribute');
    }
    
    addLog(`${transfer.type === 'equalize' ? '⚖️' : '🔀'} B${transfer.from} → B${transfer.to}: ${transfer.amount}`);
  }, [playSound]);

  // Main simulation loop
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        // Randomly choose between equalize and redistribute
        const operation = Math.random() < 0.5 ? performEqualize() : performRedistribute();
        
        if (operation) {
          setCurrentTransfer(operation);
          applyTransfer(operation);
          
          setTimeout(() => setCurrentTransfer(null), speed * 0.6);
        }
      }, speed);
      
      return () => clearInterval(intervalRef.current);
    }
  }, [isRunning, speed, performEqualize, performRedistribute, applyTransfer]);

  const start = () => {
    setIsRunning(true);
    playSound('start');
    addLog('🚀 Simulation started');
  };

  const stop = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    setCurrentTransfer(null);
    playSound('stop');
    addLog('⏹️ Simulation stopped');
  };

  const reset = () => {
    stop();
    setBuckets(INITIAL_BUCKETS);
    setTransferLog([]);
    setTotalOperations(0);
    setEqualizeOps(0);
    setRedistributeOps(0);
    transferIdRef.current = 0;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ') { e.preventDefault(); isRunning ? stop() : start(); }
      if (e.key === 'r' || e.key === 'R') reset();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isRunning]);

  const maxValue = Math.max(...buckets.map(b => b.value), 1);


  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-emerald-950/10 to-slate-950 rounded-xl border border-emerald-900/40 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-emerald-800/40 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/40">
              <Atom className="text-emerald-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-300 tracking-wide">REACTOR CONTROL</h2>
              <p className="text-xs text-emerald-500/70">Atomic Bucket Operations</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-xs font-mono ${
              isRunning ? 'bg-emerald-500/20 text-emerald-300 animate-pulse' : 'bg-slate-800 text-slate-500'
            }`}>
              {isRunning ? '● ACTIVE' : '○ IDLE'}
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled 
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' 
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
        
        {/* Total Invariant Display */}
        <div className="bg-slate-900/50 rounded-xl border border-emerald-500/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Scale className="text-emerald-400" size={20} />
              </div>
              <div>
                <div className="text-xs text-slate-500">TOTAL INVARIANT</div>
                <div className="text-2xl font-bold text-emerald-400 font-mono">{totalValue}</div>
              </div>
            </div>
            <div className="text-xs text-emerald-500/70 text-right">
              Sum must remain constant<br/>
              across all operations
            </div>
          </div>
        </div>

        {/* Buckets Visualization */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-6 relative overflow-hidden">
          {/* Radiation pattern background */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, rgba(16,185,129,0.4) 0%, transparent 50%)`,
            }} />
          </div>

          {/* Header */}
          <div className="relative flex items-center justify-between mb-6 pb-3 border-b border-slate-700/50">
            <div className="text-sm font-mono text-slate-400">
              Bucket Array [{buckets.length}]
            </div>
            <div className="text-xs text-slate-500">
              {currentTransfer ? (
                <span className={currentTransfer.type === 'equalize' ? 'text-cyan-400' : 'text-amber-400'}>
                  {currentTransfer.type === 'equalize' ? '⚖️ Equalizing' : '🔀 Redistributing'}...
                </span>
              ) : 'Waiting...'}
            </div>
          </div>

          {/* Buckets Grid */}
          <div className="relative grid grid-cols-3 md:grid-cols-6 gap-4">
            {buckets.map((bucket, idx) => (
              <motion.div
                key={bucket.id}
                className={`relative rounded-xl border-2 overflow-hidden transition-all duration-300 ${
                  currentTransfer?.from === idx
                    ? 'border-rose-500 shadow-lg shadow-rose-500/30'
                    : currentTransfer?.to === idx
                    ? 'border-emerald-500 shadow-lg shadow-emerald-500/30'
                    : 'border-slate-700'
                }`}
                animate={{
                  scale: currentTransfer?.from === idx || currentTransfer?.to === idx ? 1.05 : 1,
                }}
              >
                {/* Bucket header */}
                <div className={`px-3 py-2 text-center border-b transition-colors ${
                  currentTransfer?.from === idx
                    ? 'bg-rose-500/20 border-rose-500/30'
                    : currentTransfer?.to === idx
                    ? 'bg-emerald-500/20 border-emerald-500/30'
                    : 'bg-slate-800/80 border-slate-700'
                }`}>
                  <div className="text-xs text-slate-500">B{idx}</div>
                </div>

                {/* Value bar */}
                <div className="h-24 bg-slate-900/50 relative flex items-end justify-center p-2">
                  <motion.div
                    className={`w-full rounded-t transition-colors ${
                      currentTransfer?.from === idx
                        ? 'bg-gradient-to-t from-rose-600 to-rose-400'
                        : currentTransfer?.to === idx
                        ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                        : 'bg-gradient-to-t from-cyan-600 to-cyan-400'
                    }`}
                    initial={false}
                    animate={{ height: `${(bucket.value / maxValue) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                  
                  {/* Glow effect when active */}
                  {(currentTransfer?.from === idx || currentTransfer?.to === idx) && (
                    <motion.div
                      className={`absolute inset-0 ${
                        currentTransfer?.from === idx ? 'bg-rose-500/10' : 'bg-emerald-500/10'
                      }`}
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    />
                  )}
                </div>

                {/* Value display */}
                <div className={`px-3 py-2 text-center transition-colors ${
                  currentTransfer?.from === idx
                    ? 'bg-rose-500/10'
                    : currentTransfer?.to === idx
                    ? 'bg-emerald-500/10'
                    : 'bg-slate-800/50'
                }`}>
                  <div className={`text-lg font-bold font-mono ${
                    currentTransfer?.from === idx
                      ? 'text-rose-400'
                      : currentTransfer?.to === idx
                      ? 'text-emerald-400'
                      : 'text-slate-300'
                  }`}>
                    {bucket.value}
                  </div>
                </div>

                {/* Transfer arrow indicator */}
                <AnimatePresence>
                  {currentTransfer?.from === idx && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute -top-6 left-1/2 -translate-x-1/2 text-rose-400 text-xs font-mono"
                    >
                      -{currentTransfer.amount}
                    </motion.div>
                  )}
                  {currentTransfer?.to === idx && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute -top-6 left-1/2 -translate-x-1/2 text-emerald-400 text-xs font-mono"
                    >
                      +{currentTransfer.amount}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>


        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center">
          <button
            onClick={isRunning ? stop : start}
            className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${
              isRunning
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30'
            }`}
          >
            {isRunning ? <Pause size={18} /> : <Play size={18} />}
            {isRunning ? 'STOP' : 'START'}
          </button>
          
          <button
            onClick={reset}
            className="px-4 py-3 bg-slate-800 text-slate-400 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all flex items-center gap-2"
          >
            <RotateCcw size={18} />
            Reset
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-slate-500">Speed:</span>
            <input
              type="range"
              min={200}
              max={1200}
              step={100}
              value={1400 - speed}
              onChange={(e) => setSpeed(1400 - parseInt(e.target.value))}
              className="w-24 accent-emerald-500"
            />
          </div>
        </div>

        {/* Operation Types Legend */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900/50 rounded-xl border border-cyan-500/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Scale size={16} className="text-cyan-400" />
              <span className="text-sm font-medium text-cyan-300">Equalize</span>
            </div>
            <p className="text-xs text-slate-400">
              Pick two buckets and make their values closer to equal by transferring half the difference.
            </p>
            <div className="mt-2 text-xs text-cyan-400 font-mono">
              Count: {equalizeOps}
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-xl border border-amber-500/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shuffle size={16} className="text-amber-400" />
              <span className="text-sm font-medium text-amber-300">Redistribute</span>
            </div>
            <p className="text-xs text-slate-400">
              Pick two buckets and randomly redistribute their combined total between them.
            </p>
            <div className="mt-2 text-xs text-amber-400 font-mono">
              Count: {redistributeOps}
            </div>
          </div>
        </div>

        {/* Transfer Log */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-slate-400 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ArrowLeftRight size={14} />
              Transfer Log
            </span>
            <span className="text-slate-500">{totalOperations} operations</span>
          </div>
          <div className="font-mono text-xs bg-black/30 rounded-lg p-3 h-28 overflow-y-auto custom-scrollbar space-y-0.5">
            {transferLog.length === 0 ? (
              <span className="text-slate-600">// Transfers will appear here...</span>
            ) : (
              transferLog.map((entry, idx) => (
                <div key={idx} className={
                  entry.includes('⚖️') ? 'text-cyan-400' :
                  entry.includes('🔀') ? 'text-amber-400' :
                  entry.includes('🚀') ? 'text-emerald-400' :
                  'text-slate-400'
                }>
                  {entry}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Total Ops</div>
            <div className="text-2xl font-bold text-slate-300 font-mono">{totalOperations}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Equalize</div>
            <div className="text-2xl font-bold text-cyan-400 font-mono">{equalizeOps}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Redistribute</div>
            <div className="text-2xl font-bold text-amber-400 font-mono">{redistributeOps}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-emerald-500/30 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Sum Check</div>
            <div className={`text-2xl font-bold font-mono ${
              totalValue === 1000 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {totalValue === 1000 ? '✓' : '✗'}
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Space</kbd> Start/Stop
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
          About Atomic Updates
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            <span className="text-emerald-300">Atomic operations</span> ensure that transfers between 
            buckets happen as indivisible units — the sum is always preserved.
          </p>
          <p>
            <span className="text-cyan-300">Equalize</span> operations move values toward equilibrium, 
            while <span className="text-amber-300">Redistribute</span> operations randomly shuffle values.
          </p>
          <p>
            <span className="text-rose-300">The invariant</span> (total sum = 1000) must hold at all times, 
            demonstrating that concurrent operations don't corrupt data.
          </p>
          <p>
            In real systems, this is achieved using locks, compare-and-swap, or transactional memory.
          </p>
        </div>
      </details>
    </div>
  );
}
