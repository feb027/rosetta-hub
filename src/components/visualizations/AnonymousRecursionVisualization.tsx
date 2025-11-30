import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Zap, GitBranch, Layers, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface CallFrame {
  id: number;
  n: number;
  depth: number;
  status: 'pending' | 'computing' | 'returning' | 'complete';
  result?: number;
  isBaseCase: boolean;
  children: number[];
}

// --- Component ---
export default function AnonymousRecursionVisualization() {
  const [inputN, setInputN] = useState(8);
  const [isRunning, setIsRunning] = useState(false);
  const [callStack, setCallStack] = useState<CallFrame[]>([]);
  const [currentFrame, setCurrentFrame] = useState<number | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [speed, setSpeed] = useState(300);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [totalCalls, setTotalCalls] = useState(0);
  const [maxDepth, setMaxDepth] = useState(0);
  const [showCode, setShowCode] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const frameIdRef = useRef(0);
  const abortRef = useRef(false);

  // Initialize audio
  useEffect(() => {
    if (soundEnabled && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
  }, [soundEnabled]);

  // Play sounds
  const playSound = useCallback((type: 'call' | 'return' | 'base' | 'error' | 'complete') => {
    if (!soundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const currentTime = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    switch (type) {
      case 'call':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, currentTime + 0.05);
        gain.gain.setValueAtTime(0.05, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.08);
        break;
      case 'return':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, currentTime + 0.05);
        gain.gain.setValueAtTime(0.05, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.08);
        break;
      case 'base':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, currentTime);
        gain.gain.setValueAtTime(0.06, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.1);
        break;
      case 'error':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, currentTime);
        gain.gain.setValueAtTime(0.08, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.2);
        break;
      case 'complete':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, currentTime);
        osc.frequency.setValueAtTime(659, currentTime + 0.1);
        osc.frequency.setValueAtTime(784, currentTime + 0.2);
        gain.gain.setValueAtTime(0.08, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.4);
        break;
    }
    osc.start(currentTime);
    osc.stop(currentTime + 0.5);
  }, [soundEnabled]);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Run the anonymous recursion visualization
  const runVisualization = async () => {
    if (inputN < 0) {
      setError('Negative argument detected! Anonymous recursion checks for this.');
      playSound('error');
      return;
    }

    setError(null);
    setIsRunning(true);
    setCallStack([]);
    setCurrentFrame(null);
    setResult(null);
    setTotalCalls(0);
    setMaxDepth(0);
    frameIdRef.current = 0;
    abortRef.current = false;

    const frames: CallFrame[] = [];
    let calls = 0;
    let depth = 0;

    // Recursive fibonacci with visualization
    const fib = async (n: number, parentId: number | null, currentDepth: number): Promise<number> => {
      if (abortRef.current) return 0;

      const frameId = frameIdRef.current++;
      calls++;
      depth = Math.max(depth, currentDepth);
      setTotalCalls(calls);
      setMaxDepth(depth);

      const isBase = n <= 1;
      const frame: CallFrame = {
        id: frameId,
        n,
        depth: currentDepth,
        status: 'pending',
        isBaseCase: isBase,
        children: [],
      };

      frames.push(frame);
      if (parentId !== null) {
        const parent = frames.find(f => f.id === parentId);
        if (parent) parent.children.push(frameId);
      }

      setCallStack([...frames]);
      setCurrentFrame(frameId);
      playSound('call');
      await sleep(speed);

      if (abortRef.current) return 0;

      // Update to computing
      frame.status = 'computing';
      setCallStack([...frames]);
      await sleep(speed / 2);

      if (isBase) {
        // Base case
        frame.result = n;
        frame.status = 'complete';
        setCallStack([...frames]);
        playSound('base');
        await sleep(speed / 2);
        return n;
      }

      // Recursive calls
      const result1 = await fib(n - 1, frameId, currentDepth + 1);
      if (abortRef.current) return 0;
      
      const result2 = await fib(n - 2, frameId, currentDepth + 1);
      if (abortRef.current) return 0;

      // Return phase
      frame.status = 'returning';
      setCurrentFrame(frameId);
      setCallStack([...frames]);
      playSound('return');
      await sleep(speed / 2);

      const fibResult = result1 + result2;
      frame.result = fibResult;
      frame.status = 'complete';
      setCallStack([...frames]);
      await sleep(speed / 2);

      return fibResult;
    };

    const finalResult = await fib(inputN, null, 0);
    
    if (!abortRef.current) {
      setResult(finalResult);
      setCurrentFrame(null);
      playSound('complete');
    }
    setIsRunning(false);
  };

  const reset = () => {
    abortRef.current = true;
    setIsRunning(false);
    setCallStack([]);
    setCurrentFrame(null);
    setResult(null);
    setError(null);
    setTotalCalls(0);
    setMaxDepth(0);
  };

  // Get color based on depth
  const getDepthColor = (depth: number) => {
    const colors = [
      'from-cyan-500 to-cyan-600',
      'from-emerald-500 to-emerald-600',
      'from-amber-500 to-amber-600',
      'from-rose-500 to-rose-600',
      'from-sky-500 to-sky-600',
      'from-lime-500 to-lime-600',
      'from-orange-500 to-orange-600',
      'from-pink-500 to-pink-600',
    ];
    return colors[depth % colors.length];
  };

  // Group frames by depth for visualization
  const framesByDepth: Map<number, CallFrame[]> = new Map();
  callStack.forEach(frame => {
    const existing = framesByDepth.get(frame.depth) || [];
    existing.push(frame);
    framesByDepth.set(frame.depth, existing);
  });

  // Fibonacci sequence for reference
  const fibSequence = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377];

  return (
    <div className="w-full min-h-[750px] bg-gradient-to-br from-slate-950 via-cyan-950/10 to-slate-950 rounded-xl border border-cyan-900/30 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-cyan-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
              <motion.div
                animate={{ rotate: isRunning ? 360 : 0 }}
                transition={{ duration: 2, repeat: isRunning ? Infinity : 0, ease: 'linear' }}
              >
                <GitBranch className="text-cyan-400" size={24} />
              </motion.div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-cyan-300 tracking-wide">LAMBDA LAB</h2>
              <p className="text-xs text-cyan-500/70">Anonymous Recursion Explorer</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <Layers size={14} className="text-cyan-400" />
              <span className="text-xs text-slate-400">Depth: <span className="text-cyan-300 font-mono">{maxDepth}</span></span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <Zap size={14} className="text-amber-400" />
              <span className="text-xs text-slate-400">Calls: <span className="text-amber-300 font-mono">{totalCalls}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        
        {/* Input & Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Input */}
          <div className="bg-slate-900/50 rounded-xl border border-cyan-800/30 p-4">
            <h3 className="text-sm font-bold text-cyan-300 mb-3">FIBONACCI INPUT</h3>
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-sm">fib(</span>
              <input
                type="number"
                value={inputN}
                onChange={(e) => setInputN(parseInt(e.target.value) || 0)}
                disabled={isRunning}
                className="w-20 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-cyan-300 font-mono text-center focus:outline-none focus:border-cyan-500/50 disabled:opacity-50"
              />
              <span className="text-slate-400 text-sm">)</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {[3, 5, 8, 10].map(n => (
                <button
                  key={n}
                  onClick={() => setInputN(n)}
                  disabled={isRunning}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                    inputN === n
                      ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                  } disabled:opacity-50`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setInputN(-1)}
                disabled={isRunning}
                className="px-3 py-1 rounded text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 disabled:opacity-50"
              >
                -1 (error)
              </button>
            </div>
          </div>

          {/* Playback */}
          <div className="bg-slate-900/50 rounded-xl border border-cyan-800/30 p-4">
            <h3 className="text-sm font-bold text-cyan-300 mb-3">CONTROLS</h3>
            <div className="flex gap-2">
              <button
                onClick={isRunning ? reset : runVisualization}
                className={`flex-1 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                  isRunning
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 hover:bg-rose-500/30'
                    : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/30'
                }`}
              >
                {isRunning ? <Pause size={18} /> : <Play size={18} />}
                {isRunning ? 'STOP' : 'RUN'}
              </button>
              <button
                onClick={reset}
                disabled={isRunning}
                className="px-4 py-2.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all disabled:opacity-50"
              >
                <RotateCcw size={18} />
              </button>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">Speed</span>
                <span className="text-cyan-400 font-mono">{speed}ms</span>
              </div>
              <input
                type="range"
                min="100"
                max="800"
                step="50"
                value={speed}
                onChange={(e) => setSpeed(parseInt(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>
          </div>

          {/* Result */}
          <div className="bg-slate-900/50 rounded-xl border border-cyan-800/30 p-4">
            <h3 className="text-sm font-bold text-cyan-300 mb-3">RESULT</h3>
            {error ? (
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle size={20} />
                <span className="text-sm">{error}</span>
              </div>
            ) : result !== null ? (
              <div className="text-center">
                <div className="text-4xl font-bold text-emerald-400 font-mono">{result}</div>
                <div className="text-xs text-slate-500 mt-1">fib({inputN}) = {result}</div>
              </div>
            ) : (
              <div className="text-center text-slate-500 text-sm py-4">
                {isRunning ? 'Computing...' : 'Press RUN to start'}
              </div>
            )}
          </div>
        </div>

        {/* Call Tree Visualization */}
        <div className="bg-slate-900/50 rounded-xl border border-cyan-800/30 p-4 min-h-[300px]">
          <h3 className="text-sm font-bold text-cyan-300 mb-4 flex items-center gap-2">
            <GitBranch size={16} />
            RECURSION TREE
          </h3>
          
          {callStack.length === 0 && !error ? (
            <div className="flex items-center justify-center h-[250px] text-slate-500">
              <div className="text-center">
                <GitBranch size={48} className="mx-auto mb-3 opacity-30" />
                <p>Run the visualization to see the recursion tree</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 overflow-x-auto">
              {Array.from(framesByDepth.entries()).map(([depth, frames]) => (
                <div key={depth} className="flex items-center gap-2">
                  <div className="w-16 text-xs text-slate-500 font-mono shrink-0">
                    Depth {depth}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <AnimatePresence mode="popLayout">
                      {frames.map(frame => (
                        <motion.div
                          key={frame.id}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className={`
                            relative px-4 py-2 rounded-lg border-2 transition-all
                            ${frame.id === currentFrame ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-slate-900' : ''}
                            ${frame.status === 'complete' 
                              ? 'bg-slate-800/50 border-slate-600' 
                              : frame.isBaseCase
                                ? 'bg-emerald-500/20 border-emerald-500/50'
                                : `bg-gradient-to-r ${getDepthColor(depth)} bg-opacity-20 border-current`
                            }
                          `}
                        >
                          {/* Pulsing indicator for active frame */}
                          {frame.id === currentFrame && (
                            <motion.div
                              className="absolute inset-0 rounded-lg bg-white/10"
                              animate={{ opacity: [0.1, 0.3, 0.1] }}
                              transition={{ duration: 0.8, repeat: Infinity }}
                            />
                          )}
                          
                          <div className="relative flex items-center gap-2">
                            <span className={`font-mono font-bold ${
                              frame.status === 'complete' ? 'text-slate-400' : 'text-white'
                            }`}>
                              fib({frame.n})
                            </span>
                            {frame.result !== undefined && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300 font-mono">
                                = {frame.result}
                              </span>
                            )}
                          </div>
                          
                          {/* Status indicator */}
                          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                            frame.status === 'pending' ? 'bg-amber-500' :
                            frame.status === 'computing' ? 'bg-cyan-500 animate-pulse' :
                            frame.status === 'returning' ? 'bg-emerald-500 animate-pulse' :
                            'bg-slate-500'
                          }`} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Code Display & Reference */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Anonymous Recursion Code */}
          <div className="bg-slate-900/50 rounded-xl border border-cyan-800/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-cyan-300">ANONYMOUS RECURSION</h3>
              <button
                onClick={() => setShowCode(!showCode)}
                className="text-xs text-slate-500 hover:text-cyan-400"
              >
                {showCode ? 'Hide' : 'Show'}
              </button>
            </div>
            {showCode && (
              <pre className="text-xs font-mono bg-slate-800/50 rounded-lg p-3 overflow-x-auto text-slate-300">
{`// JavaScript - Anonymous recursion via IIFE
const fib = (n) => {
  if (n < 0) throw "Negative!";
  
  return (function inner(n) {
    return n <= 1 ? n 
      : inner(n-1) + inner(n-2);
  })(n);
};

// The inner function has no name
// in the outer scope - it's anonymous!`}
              </pre>
            )}
          </div>

          {/* Fibonacci Reference */}
          <div className="bg-slate-900/50 rounded-xl border border-cyan-800/30 p-4">
            <h3 className="text-sm font-bold text-cyan-300 mb-3">FIBONACCI SEQUENCE</h3>
            <div className="flex flex-wrap gap-2">
              {fibSequence.map((val, idx) => (
                <div
                  key={idx}
                  className={`px-2 py-1 rounded text-xs font-mono ${
                    idx === inputN && result !== null
                      ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  <span className="text-slate-500">F({idx})=</span>{val}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sound & Info */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              soundEnabled
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}
          >
            Sound: {soundEnabled ? 'ON' : 'OFF'}
          </button>

          <div className="flex gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-slate-500">Pending</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-cyan-500" />
              <span className="text-slate-500">Computing</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-500">Returning</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-slate-500" />
              <span className="text-slate-500">Complete</span>
            </div>
          </div>
        </div>

        {/* Explanation */}
        <details className="bg-slate-900/50 rounded-xl border border-cyan-800/30">
          <summary className="px-4 py-3 cursor-pointer text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
            What is Anonymous Recursion?
          </summary>
          <div className="px-4 pb-4 text-xs text-cyan-500 space-y-3">
            <p>
              <span className="text-cyan-300">Anonymous recursion</span> allows a function to call itself 
              without having a name in the enclosing scope. This is useful when you need recursion but 
              don't want to pollute the namespace with helper function names.
            </p>
            <p>
              In JavaScript, this is commonly achieved using an <span className="text-cyan-300">IIFE</span> 
              (Immediately Invoked Function Expression) where the inner function can reference itself 
              by its local name, but that name isn't visible outside.
            </p>
            <p>
              The <span className="text-cyan-300">Y combinator</span> is another technique that enables 
              anonymous recursion in languages that don't support it natively, using higher-order functions.
            </p>
            <div className="bg-slate-800/50 rounded-lg p-3 mt-2">
              <div className="text-cyan-300 mb-1">Why check for negative?</div>
              <p className="text-slate-400">
                The outer function validates input (n ≥ 0) before delegating to the anonymous inner 
                function. This separation of concerns is a key benefit of this pattern.
              </p>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
