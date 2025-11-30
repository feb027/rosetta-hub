import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Cpu, Binary, Zap, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AlgorithmState {
  step: number;
  C: number[];  // Connection polynomial
  B: number[];  // Temporary polynomial
  L: number;    // Linear complexity
  m: number;    // Counter
  b: number;    // Previous discrepancy
  delta: number; // Current discrepancy
  processed: number[];
  phase: 'init' | 'compute-delta' | 'check-delta' | 'update' | 'done';
}

const PRESETS = [
  { name: 'Binary Example', sequence: [0, 0, 1, 1, 0, 1, 0], field: 2 },
  { name: 'GF(2) Pattern', sequence: [1, 0, 1, 1, 1, 0, 0, 1], field: 2 },
  { name: 'Simple', sequence: [1, 1, 0, 1], field: 2 },
  { name: 'Longer', sequence: [0, 1, 1, 0, 1, 0, 0, 1, 1, 1], field: 2 },
];

// Berlekamp-Massey algorithm over GF(2)
function berlekampMasseyStep(
  sequence: number[],
  state: AlgorithmState
): AlgorithmState {
  const { step, C, B, L, m } = state;
  const n = step;
  
  if (n >= sequence.length) {
    return { ...state, phase: 'done' };
  }

  // Compute discrepancy
  let delta = sequence[n];
  for (let j = 1; j <= L; j++) {
    if (n - j >= 0 && C[j] !== undefined) {
      delta ^= (C[j] * sequence[n - j]);
    }
  }
  delta = delta % 2;

  if (delta === 0) {
    // No update needed
    return {
      ...state,
      step: n + 1,
      m: m + 1,
      delta,
      processed: [...state.processed, sequence[n]],
      phase: 'compute-delta',
    };
  }

  // Delta != 0, need to update
  const T = [...C];
  
  // C(x) = C(x) - delta * x^m * B(x) / b
  // In GF(2), delta/b = delta * b = delta (since b is 1 in GF(2))
  for (let j = 0; j < B.length; j++) {
    const idx = j + m;
    if (idx < T.length) {
      T[idx] ^= B[j];
    } else {
      while (T.length <= idx) T.push(0);
      T[idx] = B[j];
    }
  }

  if (2 * L <= n) {
    return {
      ...state,
      C: T,
      B: [...C],
      L: n + 1 - L,
      m: 1,
      b: delta,
      delta,
      step: n + 1,
      processed: [...state.processed, sequence[n]],
      phase: 'update',
    };
  } else {
    return {
      ...state,
      C: T,
      m: m + 1,
      delta,
      step: n + 1,
      processed: [...state.processed, sequence[n]],
      phase: 'update',
    };
  }
}

function initState(): AlgorithmState {
  return {
    step: 0,
    C: [1],
    B: [1],
    L: 0,
    m: 1,
    b: 1,
    delta: 0,
    processed: [],
    phase: 'init',
  };
}

export default function BerlekampMasseyVisualization() {
  const [sequence, setSequence] = useState<number[]>([0, 0, 1, 1, 0, 1, 0]);
  const [state, setState] = useState<AlgorithmState>(initState());
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(800);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [inputValue, setInputValue] = useState('0,0,1,1,0,1,0');

  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);


  // --- Audio ---
  const playSound = useCallback((type: 'tick' | 'update' | 'complete' | 'click' | 'shift' | 'error') => {
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
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'update') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.15);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'complete') {
      [440, 554, 659, 880].forEach((freq, i) => {
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
    } else if (type === 'shift') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'error') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  }, [soundEnabled]);

  // Process next step
  const processNext = useCallback(() => {
    if (state.phase === 'done') {
      setIsPlaying(false);
      playSound('complete');
      return;
    }

    const newState = berlekampMasseyStep(sequence, state);
    setState(newState);
    
    if (newState.phase === 'done') {
      playSound('complete');
      setIsPlaying(false);
    } else if (newState.phase === 'update' && newState.delta !== 0) {
      playSound('update');
    } else {
      playSound('tick');
    }
  }, [state, sequence, playSound]);

  // Auto-play effect
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(processNext, speed);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, processNext, speed]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setState(initState());
    playSound('click');
  }, [playSound]);

  const runAll = useCallback(() => {
    let s = initState();
    while (s.phase !== 'done' && s.step < sequence.length) {
      s = berlekampMasseyStep(sequence, s);
    }
    setState(s);
    playSound('complete');
  }, [sequence, playSound]);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setSequence([...preset.sequence]);
    setInputValue(preset.sequence.join(','));
    setState(initState());
    playSound('click');
  };

  const parseInput = () => {
    const nums = inputValue.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && (n === 0 || n === 1));
    if (nums.length > 0) {
      setSequence(nums);
      setState(initState());
      playSound('click');
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ') { e.preventDefault(); setIsPlaying(p => !p); }
      if (e.key === 'r' || e.key === 'R') reset();
      if (e.key === 'a' || e.key === 'A') runAll();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [reset, runAll]);

  // Format polynomial
  const formatPolynomial = (coeffs: number[]): string => {
    if (coeffs.length === 0) return '0';
    const terms: string[] = [];
    coeffs.forEach((c, i) => {
      if (c !== 0) {
        if (i === 0) terms.push('1');
        else if (i === 1) terms.push('x');
        else terms.push(`x^${i}`);
      }
    });
    return terms.length > 0 ? terms.join(' + ') : '0';
  };

  const progress = sequence.length > 0 ? (state.step / sequence.length) * 100 : 0;


  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-teal-950/10 to-slate-950 rounded-xl border border-teal-900/40 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-teal-800/40 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/15 border border-teal-500/40">
              <Cpu className="text-teal-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-teal-300 tracking-wide">LFSR DECODER LAB</h2>
              <p className="text-xs text-teal-500/70">Berlekamp-Massey Algorithm</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-lg border text-xs font-mono ${
              state.phase === 'done'
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : state.phase === 'update'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : state.step > 0
                ? 'bg-teal-500/20 border-teal-500/50 text-teal-300 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              {state.phase === 'done' ? 'COMPLETE' : state.phase === 'update' ? 'UPDATING' : state.step > 0 ? 'PROCESSING' : 'READY'}
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
        
        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-slate-500 self-center">Presets:</span>
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(preset)}
              className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-xs text-slate-400 hover:text-teal-300 hover:border-teal-500/50 transition-all"
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* Input Sequence */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-slate-400 mb-3 flex items-center gap-2">
            <Binary size={14} />
            Input Sequence (GF(2) - binary values 0,1)
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="0,0,1,1,0,1,0"
              className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-600 font-mono focus:outline-none focus:border-teal-500"
            />
            <button
              onClick={parseInput}
              className="px-4 py-2 bg-teal-500/20 text-teal-300 border border-teal-500/50 rounded-lg hover:bg-teal-500/30 transition-all"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Sequence Visualization */}
        <div className="bg-slate-900/30 rounded-xl border border-teal-800/30 p-6 relative overflow-hidden">
          {/* Circuit pattern background */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `linear-gradient(90deg, rgba(20,184,166,0.3) 1px, transparent 1px),
                                linear-gradient(rgba(20,184,166,0.3) 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
            }} />
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs text-teal-400 flex items-center gap-2">
                <Zap size={14} />
                Sequence Processing
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Step {state.step} / {sequence.length}
              </span>
            </div>

            {/* Sequence bits */}
            <div className="flex flex-wrap gap-2 mb-6">
              {sequence.map((bit, idx) => {
                const isProcessed = idx < state.step;
                const isCurrent = idx === state.step;
                
                return (
                  <motion.div
                    key={idx}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ 
                      scale: isCurrent ? 1.1 : 1,
                      opacity: 1,
                    }}
                    className={`relative w-12 h-12 rounded-lg flex items-center justify-center font-mono font-bold text-lg transition-all ${
                      isCurrent
                        ? 'bg-amber-500/30 border-2 border-amber-400 text-amber-300 shadow-lg shadow-amber-500/30'
                        : isProcessed
                        ? 'bg-teal-500/20 border border-teal-500/50 text-teal-300'
                        : 'bg-slate-800 border border-slate-700 text-slate-500'
                    }`}
                  >
                    {bit}
                    <span className="absolute -bottom-5 text-[10px] text-slate-600">s<sub>{idx}</sub></span>
                    {isCurrent && (
                      <motion.div
                        className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-teal-600 to-cyan-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </div>
        </div>


        {/* Algorithm State */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Connection Polynomial C(x) */}
          <div className="bg-slate-900/30 rounded-xl border border-teal-800/30 p-4">
            <div className="text-xs text-teal-400 mb-3 flex items-center gap-2">
              Connection Polynomial C(x)
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 font-mono">
              <div className="text-lg text-teal-300 mb-2">
                {formatPolynomial(state.C)}
              </div>
              <div className="flex flex-wrap gap-1">
                {state.C.map((c, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`px-2 py-1 rounded text-xs ${
                      c === 1 ? 'bg-teal-500/30 text-teal-300' : 'bg-slate-700 text-slate-500'
                    }`}
                  >
                    c<sub>{i}</sub>={c}
                  </motion.span>
                ))}
              </div>
            </div>
          </div>

          {/* Temporary Polynomial B(x) */}
          <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
            <div className="text-xs text-slate-400 mb-3 flex items-center gap-2">
              Temporary Polynomial B(x)
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 font-mono">
              <div className="text-lg text-slate-300 mb-2">
                {formatPolynomial(state.B)}
              </div>
              <div className="flex flex-wrap gap-1">
                {state.B.map((b, i) => (
                  <span
                    key={i}
                    className={`px-2 py-1 rounded text-xs ${
                      b === 1 ? 'bg-slate-600 text-slate-300' : 'bg-slate-700 text-slate-500'
                    }`}
                  >
                    b<sub>{i}</sub>={b}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Current Step Info */}
        <AnimatePresence mode="wait">
          {state.step > 0 && (
            <motion.div
              key={state.step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`rounded-xl border p-4 ${
                state.delta !== 0 && state.phase !== 'init'
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-slate-900/30 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <ChevronRight size={16} className="text-teal-400" />
                  <span className="text-xs text-slate-400">Step {state.step}:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Δ =</span>
                  <span className={`font-mono font-bold ${
                    state.delta !== 0 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {state.delta}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">L =</span>
                  <span className="font-mono font-bold text-teal-300">{state.L}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">m =</span>
                  <span className="font-mono text-slate-300">{state.m}</span>
                </div>
                {state.delta !== 0 && (
                  <span className="text-xs text-amber-300 ml-auto">
                    Discrepancy found → Updating C(x)
                  </span>
                )}
                {state.delta === 0 && state.step > 0 && (
                  <span className="text-xs text-emerald-300 ml-auto">
                    No discrepancy → Continue
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        {state.phase === 'done' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6"
          >
            <div className="text-center">
              <div className="text-xs text-slate-400 mb-2">LFSR Connection Polynomial</div>
              <div className="text-2xl font-bold text-emerald-400 font-mono mb-4">
                C(x) = {formatPolynomial(state.C)}
              </div>
              <div className="flex justify-center gap-6">
                <div>
                  <div className="text-xs text-slate-500">Linear Complexity</div>
                  <div className="text-xl font-bold text-teal-300 font-mono">L = {state.L}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Polynomial Degree</div>
                  <div className="text-xl font-bold text-slate-300 font-mono">{state.C.length - 1}</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={state.phase === 'done'}
            className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'bg-teal-500/20 text-teal-300 border border-teal-500/50 hover:bg-teal-500/30'
            } disabled:opacity-50`}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            {isPlaying ? 'PAUSE' : state.phase === 'done' ? 'COMPLETE' : 'DECODE'}
          </button>
          
          <button
            onClick={processNext}
            disabled={isPlaying || state.phase === 'done'}
            className="px-4 py-3 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            Step →
          </button>
          
          <button
            onClick={runAll}
            disabled={state.phase === 'done'}
            className="px-4 py-3 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            Run All
          </button>
          
          <button
            onClick={reset}
            className="px-4 py-3 bg-slate-800 text-slate-400 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all"
          >
            <RotateCcw size={18} />
          </button>

          {/* Speed control */}
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <span className="text-xs text-slate-500">Speed:</span>
            <input
              type="range"
              min="200"
              max="1500"
              step="100"
              value={1700 - speed}
              onChange={(e) => setSpeed(1700 - parseInt(e.target.value))}
              className="w-20 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Sequence Length</div>
            <div className="text-xl font-bold text-teal-400 font-mono">{sequence.length}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Linear Complexity (L)</div>
            <div className="text-xl font-bold text-cyan-400 font-mono">{state.L}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Current Δ</div>
            <div className={`text-xl font-bold font-mono ${
              state.delta !== 0 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {state.delta}
            </div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Processed</div>
            <div className="text-xl font-bold text-slate-300 font-mono">{state.step}</div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Space</kbd> Play/Pause
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">A</kbd> Run All
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-teal-400 hover:text-teal-300 transition-colors">
          About Berlekamp-Massey Algorithm
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            The <span className="text-teal-300">Berlekamp-Massey algorithm</span> finds the shortest 
            Linear Feedback Shift Register (LFSR) that generates a given sequence over a finite field.
          </p>
          <p>
            <span className="text-amber-300">Discrepancy (Δ):</span> The difference between the predicted 
            and actual sequence value. When Δ ≠ 0, the connection polynomial must be updated.
          </p>
          <p>
            <span className="text-emerald-300">Applications:</span> Error-correcting codes (BCH, Reed-Solomon), 
            cryptographic stream cipher analysis, and sequence pattern detection.
          </p>
          <div className="mt-3 p-3 bg-slate-800/50 rounded-lg font-mono text-[11px]">
            <div className="text-slate-500 mb-1">// Algorithm complexity</div>
            <div className="text-slate-300">Time: O(n²), Space: O(n)</div>
          </div>
        </div>
      </details>
    </div>
  );
}
