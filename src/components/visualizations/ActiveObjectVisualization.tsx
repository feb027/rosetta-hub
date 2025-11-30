import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Activity, Waves, Gauge, Clock } from 'lucide-react';
import { motion } from 'motion/react';

type InputMode = 'sine' | 'constant' | 'custom';

interface DataPoint {
  time: number;
  input: number;
  output: number;
}

export default function ActiveObjectVisualization() {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [inputMode, setInputMode] = useState<InputMode>('sine');
  const [constantValue, setConstantValue] = useState(0);
  const [frequency, setFrequency] = useState(0.5);
  const [currentInput, setCurrentInput] = useState(0);
  const [currentOutput, setCurrentOutput] = useState(0);
  const [history, setHistory] = useState<DataPoint[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [testPhase, setTestPhase] = useState<'idle' | 'sine' | 'zero' | 'complete'>('idle');
  const [testResult, setTestResult] = useState<number | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef(0);
  const lastInputRef = useRef(0);
  const outputRef = useRef(0);
  const startTimeRef = useRef(0);

  // --- Audio ---
  const playSound = useCallback(
    (type: 'tick' | 'start' | 'stop' | 'complete' | 'phase') => {
      if (!soundEnabled) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'tick') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440 + currentOutput * 100, now);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.start(now);
        osc.stop(now + 0.03);
      } else if (type === 'start') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'stop') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.1);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'complete') {
        [523, 659, 784, 1047].forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.type = 'sine';
          o.frequency.setValueAtTime(freq, now + i * 0.1);
          g.gain.setValueAtTime(0.08, now + i * 0.1);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.3 + i * 0.1);
          o.start(now + i * 0.1);
          o.stop(now + 0.35 + i * 0.1);
        });
      } else if (type === 'phase') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    },
    [soundEnabled, currentOutput]
  );

  // Calculate input based on mode
  const getInput = useCallback(
    (t: number): number => {
      if (inputMode === 'sine') {
        return Math.sin(2 * Math.PI * frequency * t);
      } else if (inputMode === 'constant') {
        return constantValue;
      }
      return 0;
    },
    [inputMode, frequency, constantValue]
  );

  // Integration step using trapezoid method
  const integrate = useCallback(
    (dt: number, newInput: number) => {
      // S = S + (K(t1) + K(t0)) * (t1 - t0) / 2
      const deltaS = ((newInput + lastInputRef.current) * dt) / 2;
      outputRef.current += deltaS;
      lastInputRef.current = newInput;
      return outputRef.current;
    },
    []
  );

  // Animation loop
  useEffect(() => {
    if (!isRunning) return;

    const animate = () => {
      const now = performance.now() / 1000;
      const elapsed = now - startTimeRef.current;
      const dt = elapsed - lastTimeRef.current;

      if (dt > 0) {
        const input = getInput(elapsed);
        const output = integrate(dt, input);

        setTime(elapsed);
        setCurrentInput(input);
        setCurrentOutput(output);

        // Add to history (limit to last 200 points)
        setHistory((prev) => {
          const newPoint = { time: elapsed, input, output };
          const updated = [...prev, newPoint];
          return updated.slice(-200);
        });

        lastTimeRef.current = elapsed;

        // Play tick sound occasionally
        if (Math.floor(elapsed * 10) !== Math.floor((elapsed - dt) * 10)) {
          playSound('tick');
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isRunning, getInput, integrate, playSound]);

  // Run the standard test
  const runTest = useCallback(async () => {
    reset();
    setTestPhase('sine');
    setInputMode('sine');
    setFrequency(0.5);
    playSound('start');

    // Start integration
    startTimeRef.current = performance.now() / 1000;
    lastTimeRef.current = 0;
    setIsRunning(true);

    // Phase 1: Sine wave for 2 seconds
    await new Promise((r) => setTimeout(r, 2000));
    playSound('phase');
    setTestPhase('zero');
    setInputMode('constant');
    setConstantValue(0);

    // Phase 2: Zero for 0.5 seconds
    await new Promise((r) => setTimeout(r, 500));

    setIsRunning(false);
    setTestPhase('complete');
    setTestResult(outputRef.current);
    playSound('complete');
  }, [playSound]);

  const start = () => {
    if (!isRunning) {
      startTimeRef.current = performance.now() / 1000 - time;
      lastTimeRef.current = time;
      setIsRunning(true);
      playSound('start');
    }
  };

  const stop = () => {
    setIsRunning(false);
    playSound('stop');
  };

  const reset = useCallback(() => {
    cancelAnimationFrame(animationRef.current);
    setIsRunning(false);
    setTime(0);
    setCurrentInput(0);
    setCurrentOutput(0);
    setHistory([]);
    setTestPhase('idle');
    setTestResult(null);
    outputRef.current = 0;
    lastInputRef.current = 0;
    lastTimeRef.current = 0;
    playSound('stop');
  }, [playSound]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ') {
        e.preventDefault();
        isRunning ? stop() : start();
      }
      if (e.key === 'r' || e.key === 'R') reset();
      if (e.key === 't' || e.key === 'T') runTest();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isRunning, reset, runTest]);

  // Draw waveform
  const renderWaveform = (data: DataPoint[], type: 'input' | 'output') => {
    if (data.length < 2) return null;

    const width = 100;
    const height = 50;
    const maxTime = Math.max(data[data.length - 1]?.time || 1, 2);
    const values = data.map((d) => (type === 'input' ? d.input : d.output));
    const maxVal = Math.max(Math.abs(Math.min(...values)), Math.abs(Math.max(...values)), 1);

    const points = data
      .map((d) => {
        const x = (d.time / maxTime) * width;
        const y = height / 2 - ((type === 'input' ? d.input : d.output) / maxVal) * (height / 2 - 2);
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32 bg-slate-950 rounded-lg border border-slate-800">
        {/* Grid */}
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#334155" strokeWidth="0.3" />
        {[...Array(5)].map((_, i) => (
          <line key={i} x1={((i + 1) * width) / 5} y1="0" x2={((i + 1) * width) / 5} y2={height} stroke="#1e293b" strokeWidth="0.3" />
        ))}

        {/* Waveform */}
        <polyline points={points} fill="none" stroke={type === 'input' ? '#06b6d4' : '#10b981'} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />

        {/* Current value indicator */}
        {data.length > 0 && (
          <circle cx={(data[data.length - 1].time / maxTime) * width} cy={height / 2 - ((type === 'input' ? data[data.length - 1].input : data[data.length - 1].output) / maxVal) * (height / 2 - 2)} r="2" fill={type === 'input' ? '#06b6d4' : '#10b981'} />
        )}
      </svg>
    );
  };

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-emerald-950/10 to-slate-950 rounded-xl border border-emerald-900/30 font-sans overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-emerald-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <Activity className="text-emerald-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-300 tracking-wide">SIGNAL INTEGRATOR LAB</h2>
              <p className="text-xs text-emerald-500/70">Active Object with Trapezoid Integration</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isRunning ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800 border-slate-700'}`}>
              <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              <span className={`text-xs font-medium ${isRunning ? 'text-emerald-400' : 'text-slate-500'}`}>{isRunning ? 'RUNNING' : 'STOPPED'}</span>
            </div>
            <button onClick={() => setSoundEnabled(!soundEnabled)} className={`p-2 rounded-lg border transition-all ${soundEnabled ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Live Meters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 text-center">
            <Clock size={16} className="mx-auto text-slate-500 mb-1" />
            <div className="text-xs text-slate-500 mb-1">Time</div>
            <div className="text-2xl font-mono font-bold text-slate-300">{time.toFixed(2)}s</div>
          </div>
          <div className="bg-slate-900/50 rounded-xl border border-cyan-800/30 p-4 text-center">
            <Waves size={16} className="mx-auto text-cyan-500 mb-1" />
            <div className="text-xs text-cyan-500 mb-1">Input K(t)</div>
            <div className="text-2xl font-mono font-bold text-cyan-400">{currentInput.toFixed(4)}</div>
          </div>
          <div className="bg-slate-900/50 rounded-xl border border-emerald-800/30 p-4 text-center">
            <Gauge size={16} className="mx-auto text-emerald-500 mb-1" />
            <div className="text-xs text-emerald-500 mb-1">Output S</div>
            <div className="text-2xl font-mono font-bold text-emerald-400">{currentOutput.toFixed(4)}</div>
          </div>
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 text-center">
            <Activity size={16} className="mx-auto text-slate-500 mb-1" />
            <div className="text-xs text-slate-500 mb-1">Mode</div>
            <div className="text-lg font-bold text-slate-300 capitalize">{inputMode}</div>
          </div>
        </div>

        {/* Oscilloscope Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Waves size={14} className="text-cyan-400" />
              <span className="text-xs font-bold text-cyan-300">INPUT SIGNAL K(t)</span>
              <span className="ml-auto text-xs text-slate-600">{inputMode === 'sine' ? `sin(2π × ${frequency} × t)` : `${constantValue}`}</span>
            </div>
            {renderWaveform(history, 'input')}
          </div>
          <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Gauge size={14} className="text-emerald-400" />
              <span className="text-xs font-bold text-emerald-300">INTEGRATED OUTPUT S</span>
              <span className="ml-auto text-xs text-slate-600">∫K(t)dt</span>
            </div>
            {renderWaveform(history, 'output')}
          </div>
        </div>

        {/* Input Controls */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-slate-500 mb-3">Input Configuration</div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Mode:</span>
              <select value={inputMode} onChange={(e) => setInputMode(e.target.value as InputMode)} disabled={testPhase !== 'idle'} className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-emerald-300 focus:outline-none focus:border-emerald-500 disabled:opacity-50">
                <option value="sine">Sine Wave</option>
                <option value="constant">Constant</option>
              </select>
            </div>

            {inputMode === 'sine' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Frequency:</span>
                <input type="number" value={frequency} onChange={(e) => setFrequency(parseFloat(e.target.value) || 0.5)} step={0.1} min={0.1} max={5} disabled={testPhase !== 'idle'} className="w-20 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-cyan-300 font-mono focus:outline-none focus:border-cyan-500 disabled:opacity-50" />
                <span className="text-xs text-slate-500">Hz</span>
              </div>
            )}

            {inputMode === 'constant' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Value:</span>
                <input type="number" value={constantValue} onChange={(e) => setConstantValue(parseFloat(e.target.value) || 0)} step={0.1} disabled={testPhase !== 'idle'} className="w-20 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-cyan-300 font-mono focus:outline-none focus:border-cyan-500 disabled:opacity-50" />
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          <button onClick={isRunning ? stop : start} disabled={testPhase !== 'idle' && testPhase !== 'complete'} className={`flex-1 min-w-[120px] py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${isRunning ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30'} disabled:opacity-50`}>
            {isRunning ? <Pause size={18} /> : <Play size={18} />}
            {isRunning ? 'STOP' : 'START'}
          </button>

          <button onClick={runTest} disabled={isRunning || (testPhase !== 'idle' && testPhase !== 'complete')} className="flex-1 min-w-[120px] py-3 rounded-lg font-bold flex items-center justify-center gap-2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-500/30 transition-all disabled:opacity-50">
            <Activity size={18} />
            RUN TEST
          </button>

          <button onClick={reset} className="px-4 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all">
            <RotateCcw size={18} />
          </button>
        </div>

        {/* Test Status */}
        {testPhase !== 'idle' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl border p-4 ${testPhase === 'complete' ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-cyan-900/20 border-cyan-500/30'}`}>
            <div className="flex items-center gap-3 mb-3">
              <Activity className={testPhase === 'complete' ? 'text-emerald-400' : 'text-cyan-400'} size={20} />
              <span className={`font-bold ${testPhase === 'complete' ? 'text-emerald-300' : 'text-cyan-300'}`}>{testPhase === 'sine' ? 'Phase 1: Sine Wave (2s)' : testPhase === 'zero' ? 'Phase 2: Zero Input (0.5s)' : 'Test Complete'}</span>
            </div>

            {testPhase === 'complete' && testResult !== null && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">Final Output:</span>
                  <span className="text-lg font-mono font-bold text-emerald-400">{testResult.toFixed(6)}</span>
                </div>
                <div className="text-xs text-slate-500">Expected: ≈ 0 (sine integrates to ~0 over full period)</div>
                <div className={`text-sm font-medium ${Math.abs(testResult) < 0.1 ? 'text-emerald-400' : 'text-amber-400'}`}>{Math.abs(testResult) < 0.1 ? '✓ Test passed! Output is approximately zero.' : '⚠ Output deviates from expected value.'}</div>
              </div>
            )}

            {testPhase !== 'complete' && (
              <div className="flex gap-2">
                {['sine', 'zero', 'complete'].map((phase, i) => {
                  const isActive = testPhase === phase || (testPhase === 'zero' && i === 0);
                  return <div key={phase} className={`flex-1 h-2 rounded-full ${isActive ? 'bg-cyan-500' : 'bg-slate-700'}`} />;
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Formula Display */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-slate-500 mb-2">Trapezoid Integration Formula</div>
          <div className="font-mono text-sm text-emerald-400 bg-slate-800/50 rounded-lg p-3 text-center">S = S + (K(t₁) + K(t₀)) × (t₁ - t₀) / 2</div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Space</kbd> Start/Stop
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">T</kbd> Run Test
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-emerald-400 hover:text-emerald-300 transition-colors">What is an Active Object?</summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            An <span className="text-emerald-300">Active Object</span> is an object whose state changes with time, independent of external method calls. It encapsulates a task that continuously updates its internal state.
          </p>
          <p>This integrator demonstrates the concept by:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Accepting an input function K(t) that varies with time</li>
            <li>Continuously integrating the input using the trapezoid method</li>
            <li>Maintaining state (the accumulated integral S) over time</li>
          </ul>
          <p className="mt-2">
            The <span className="text-cyan-300">trapezoid method</span> approximates the integral by treating each time slice as a trapezoid, averaging the input values at the start and end of each interval.
          </p>
        </div>
      </details>
    </div>
  );
}
