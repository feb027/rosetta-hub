import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Cog, ArrowRight, Zap, Box } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface ArrayElement {
  id: number;
  value: number;
  status: 'waiting' | 'processing' | 'done';
  result?: number;
}

type CallbackFn = {
  name: string;
  label: string;
  fn: (x: number) => number;
  code: string;
};

// --- Component ---
export default function ApplyCallbackVisualization() {
  const [inputArray, setInputArray] = useState<number[]>([1, 2, 3, 4, 5]);
  const [elements, setElements] = useState<ArrayElement[]>([]);
  const [results, setResults] = useState<number[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [selectedCallback, setSelectedCallback] = useState(0);
  const [speed, setSpeed] = useState(600);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [customInput, setCustomInput] = useState('1, 2, 3, 4, 5');

  const audioContextRef = useRef<AudioContext | null>(null);
  const abortRef = useRef(false);

  // Available callbacks
  const callbacks: CallbackFn[] = [
    { name: 'square', label: 'x²', fn: (x) => x * x, code: 'x => x * x' },
    { name: 'double', label: '2x', fn: (x) => x * 2, code: 'x => x * 2' },
    { name: 'increment', label: 'x+1', fn: (x) => x + 1, code: 'x => x + 1' },
    { name: 'cube', label: 'x³', fn: (x) => x * x * x, code: 'x => x * x * x' },
    { name: 'negate', label: '-x', fn: (x) => -x, code: 'x => -x' },
    { name: 'abs', label: '|x|', fn: (x) => Math.abs(x), code: 'x => Math.abs(x)' },
  ];

  const currentCallback = callbacks[selectedCallback];

  // Initialize audio
  useEffect(() => {
    if (soundEnabled && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
  }, [soundEnabled]);

  // Play sounds
  const playSound = useCallback((type: 'process' | 'complete' | 'tick' | 'start') => {
    if (!soundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const currentTime = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    switch (type) {
      case 'process':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, currentTime + 0.1);
        gain.gain.setValueAtTime(0.06, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.15);
        break;
      case 'complete':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, currentTime);
        osc.frequency.setValueAtTime(659, currentTime + 0.1);
        osc.frequency.setValueAtTime(784, currentTime + 0.2);
        gain.gain.setValueAtTime(0.07, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.35);
        break;
      case 'tick':
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, currentTime);
        gain.gain.setValueAtTime(0.02, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.03);
        break;
      case 'start':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, currentTime + 0.1);
        gain.gain.setValueAtTime(0.04, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.15);
        break;
    }
    osc.start(currentTime);
    osc.stop(currentTime + 0.5);
  }, [soundEnabled]);

  // Initialize elements from input array
  const initializeElements = useCallback(() => {
    const els = inputArray.map((value, index) => ({
      id: index,
      value,
      status: 'waiting' as const,
    }));
    setElements(els);
    setResults([]);
    setCurrentIndex(-1);
  }, [inputArray]);

  useEffect(() => {
    initializeElements();
  }, [initializeElements]);

  // Run the map operation
  const runMap = async () => {
    initializeElements();
    setIsRunning(true);
    abortRef.current = false;
    playSound('start');

    const newResults: number[] = [];

    for (let i = 0; i < inputArray.length; i++) {
      if (abortRef.current) break;

      setCurrentIndex(i);
      setElements(prev => prev.map((el, idx) => 
        idx === i ? { ...el, status: 'processing' } : el
      ));
      playSound('tick');

      await new Promise(r => setTimeout(r, speed / 2));
      if (abortRef.current) break;

      const result = currentCallback.fn(inputArray[i]);
      newResults.push(result);

      setElements(prev => prev.map((el, idx) => 
        idx === i ? { ...el, status: 'done', result } : el
      ));
      setResults([...newResults]);
      playSound('process');

      await new Promise(r => setTimeout(r, speed / 2));
    }

    if (!abortRef.current) {
      setCurrentIndex(-1);
      playSound('complete');
    }
    setIsRunning(false);
  };

  const reset = () => {
    abortRef.current = true;
    setIsRunning(false);
    initializeElements();
  };

  const parseCustomInput = () => {
    try {
      const nums = customInput.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
      if (nums.length > 0) {
        setInputArray(nums);
      }
    } catch {
      // Invalid input, ignore
    }
  };

  // Preset arrays
  const presets = [
    { label: '1-5', value: [1, 2, 3, 4, 5] },
    { label: 'Evens', value: [2, 4, 6, 8, 10] },
    { label: 'Negatives', value: [-3, -1, 0, 1, 3] },
    { label: 'Primes', value: [2, 3, 5, 7, 11] },
  ];

  return (
    <div className="w-full min-h-[700px] bg-gradient-to-br from-slate-950 via-amber-950/10 to-slate-950 rounded-xl border border-amber-900/30 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-amber-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <motion.div
                animate={{ rotate: isRunning ? 360 : 0 }}
                transition={{ duration: 1, repeat: isRunning ? Infinity : 0, ease: 'linear' }}
              >
                <Cog className="text-amber-400" size={24} />
              </motion.div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-300 tracking-wide">FUNCTION FACTORY</h2>
              <p className="text-xs text-amber-500/70">Array.map() Visualizer</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <Zap size={14} className="text-amber-400" />
            <span className="text-xs text-slate-400">
              Callback: <span className="text-amber-300 font-mono">{currentCallback.code}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        
        {/* Conveyor Belt Visualization */}
        <div className="relative bg-slate-900/50 rounded-xl border border-amber-800/30 p-6 overflow-hidden">
          {/* Background pattern */}
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(251,191,36,0.3) 20px, rgba(251,191,36,0.3) 22px)',
            }}
          />

          <div className="relative flex items-center justify-between gap-4">
            {/* Input Array */}
            <div className="flex-1">
              <div className="text-xs text-slate-500 mb-2 font-mono">INPUT ARRAY</div>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence mode="popLayout">
                  {elements.map((el, idx) => (
                    <motion.div
                      key={el.id}
                      layout
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: 1, 
                        opacity: 1,
                        y: el.status === 'processing' ? -10 : 0,
                      }}
                      className={`
                        relative w-14 h-14 rounded-lg flex items-center justify-center font-mono font-bold text-lg
                        transition-all duration-300
                        ${el.status === 'waiting' 
                          ? 'bg-slate-800 border-2 border-slate-600 text-slate-300' 
                          : el.status === 'processing'
                            ? 'bg-amber-500/30 border-2 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/30'
                            : 'bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-400'
                        }
                      `}
                    >
                      {el.value}
                      {el.status === 'processing' && (
                        <motion.div
                          className="absolute inset-0 rounded-lg border-2 border-amber-400"
                          animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        />
                      )}
                      {idx === currentIndex && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-amber-400">
                          ▼
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Function Machine */}
            <div className="flex flex-col items-center px-4">
              <ArrowRight className="text-slate-600 mb-2" size={20} />
              <motion.div
                animate={{ 
                  scale: isRunning ? [1, 1.05, 1] : 1,
                  rotate: isRunning ? [0, 5, -5, 0] : 0,
                }}
                transition={{ duration: 0.5, repeat: isRunning ? Infinity : 0 }}
                className="relative bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl p-4 border-2 border-amber-500 shadow-lg shadow-amber-500/30"
              >
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-slate-700 rounded-full border border-slate-600" />
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-slate-700 rounded-full border border-slate-600" />
                <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-slate-700 rounded-full border border-slate-600" />
                <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-slate-700 rounded-full border border-slate-600" />
                
                <div className="text-center">
                  <Cog className={`mx-auto text-amber-200 mb-1 ${isRunning ? 'animate-spin' : ''}`} size={24} />
                  <div className="text-xs text-amber-100 font-bold">f(x)</div>
                  <div className="text-lg font-bold text-white">{currentCallback.label}</div>
                </div>
              </motion.div>
              <ArrowRight className="text-slate-600 mt-2" size={20} />
            </div>

            {/* Output Array */}
            <div className="flex-1">
              <div className="text-xs text-slate-500 mb-2 font-mono">OUTPUT ARRAY</div>
              <div className="flex flex-wrap gap-2 min-h-[56px]">
                <AnimatePresence mode="popLayout">
                  {results.map((result, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ scale: 0, opacity: 0, x: -20 }}
                      animate={{ scale: 1, opacity: 1, x: 0 }}
                      className="w-14 h-14 rounded-lg flex items-center justify-center font-mono font-bold text-lg bg-emerald-500/20 border-2 border-emerald-500 text-emerald-300"
                    >
                      {result}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {results.length === 0 && (
                  <div className="w-14 h-14 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-700 text-slate-600">
                    <Box size={20} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Conveyor belt decoration */}
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-slate-800 border-t border-slate-700">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-600/50 via-amber-500/50 to-amber-600/50"
              animate={{ x: isRunning ? [0, 20, 0] : 0 }}
              transition={{ duration: 0.5, repeat: isRunning ? Infinity : 0 }}
              style={{ backgroundSize: '40px 100%' }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Playback */}
          <div className="bg-slate-900/50 rounded-xl border border-amber-800/30 p-4">
            <h3 className="text-sm font-bold text-amber-300 mb-3">CONTROLS</h3>
            <div className="flex gap-2 mb-3">
              <button
                onClick={isRunning ? reset : runMap}
                className={`flex-1 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                  isRunning
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 hover:bg-rose-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500/30'
                }`}
              >
                {isRunning ? <Pause size={18} /> : <Play size={18} />}
                {isRunning ? 'STOP' : 'RUN MAP'}
              </button>
              <button
                onClick={reset}
                className="px-4 py-2.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
              >
                <RotateCcw size={18} />
              </button>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">Speed</span>
                <span className="text-amber-400 font-mono">{speed}ms</span>
              </div>
              <input
                type="range"
                min="200"
                max="1200"
                step="100"
                value={speed}
                onChange={(e) => setSpeed(parseInt(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
          </div>

          {/* Callback Selection */}
          <div className="bg-slate-900/50 rounded-xl border border-amber-800/30 p-4">
            <h3 className="text-sm font-bold text-amber-300 mb-3">SELECT CALLBACK</h3>
            <div className="grid grid-cols-3 gap-2">
              {callbacks.map((cb, idx) => (
                <button
                  key={cb.name}
                  onClick={() => { setSelectedCallback(idx); reset(); }}
                  disabled={isRunning}
                  className={`py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                    selectedCallback === idx
                      ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                  } disabled:opacity-50`}
                >
                  {cb.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Array */}
          <div className="bg-slate-900/50 rounded-xl border border-amber-800/30 p-4">
            <h3 className="text-sm font-bold text-amber-300 mb-3">INPUT ARRAY</h3>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onBlur={parseCustomInput}
                onKeyDown={(e) => e.key === 'Enter' && parseCustomInput()}
                disabled={isRunning}
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 font-mono focus:outline-none focus:border-amber-500/50 disabled:opacity-50"
                placeholder="1, 2, 3, 4, 5"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {presets.map(preset => (
                <button
                  key={preset.label}
                  onClick={() => { setInputArray(preset.value); setCustomInput(preset.value.join(', ')); reset(); }}
                  disabled={isRunning}
                  className="px-2 py-1 rounded text-xs bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 disabled:opacity-50"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Code Display */}
        <div className="bg-slate-900/50 rounded-xl border border-amber-800/30 p-4">
          <h3 className="text-sm font-bold text-amber-300 mb-3">CODE</h3>
          <pre className="text-sm font-mono bg-slate-800/50 rounded-lg p-4 overflow-x-auto">
            <span className="text-slate-500">// Input array</span>
            {'\n'}
            <span className="text-cyan-400">const</span> <span className="text-amber-300">arr</span> <span className="text-slate-400">=</span> <span className="text-emerald-400">[{inputArray.join(', ')}]</span><span className="text-slate-400">;</span>
            {'\n\n'}
            <span className="text-slate-500">// Apply callback to each element</span>
            {'\n'}
            <span className="text-cyan-400">const</span> <span className="text-amber-300">result</span> <span className="text-slate-400">=</span> <span className="text-amber-300">arr</span><span className="text-slate-400">.</span><span className="text-sky-400">map</span><span className="text-slate-400">(</span><span className="text-rose-400">{currentCallback.code}</span><span className="text-slate-400">);</span>
            {'\n\n'}
            <span className="text-slate-500">// Result: [{results.length > 0 ? results.join(', ') : '...'}]</span>
          </pre>
        </div>

        {/* Sound Toggle */}
        <div className="flex justify-center">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              soundEnabled
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}
          >
            Sound: {soundEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Explanation */}
        <details className="bg-slate-900/50 rounded-xl border border-amber-800/30">
          <summary className="px-4 py-3 cursor-pointer text-sm text-amber-400 hover:text-amber-300 transition-colors">
            What is Array.map()?
          </summary>
          <div className="px-4 pb-4 text-xs text-amber-500 space-y-3">
            <p>
              <span className="text-amber-300">Array.map()</span> is a higher-order function that creates 
              a new array by applying a callback function to each element of the original array.
            </p>
            <p>
              The callback function receives each element, transforms it, and returns the new value. 
              The original array remains unchanged (immutability).
            </p>
            <div className="bg-slate-800/50 rounded-lg p-3 font-mono">
              <div className="text-slate-400">// Signature</div>
              <div className="text-emerald-300">array.map(callback(element, index, array))</div>
            </div>
            <p>
              This is a fundamental operation in <span className="text-amber-300">functional programming</span> and 
              is available in most modern programming languages under names like map, Select, collect, or transform.
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}
