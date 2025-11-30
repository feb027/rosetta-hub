import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, RotateCcw, Activity, Waves, Sliders, Volume2 } from 'lucide-react';
import { motion } from 'motion/react';

// --- Filter Logic ---

// Butterworth filter coefficients (order 3 low-pass)
const DEFAULT_A = [1.00000000, -2.77555756e-16, 3.33333333e-01, -1.85037171e-17];
const DEFAULT_B = [0.16666667, 0.5, 0.5, 0.16666667];

// Test signal from Rosetta Code
const TEST_SIGNAL = [
  -0.917843918645, 0.141984778794, 1.20536903482, 0.190286794412,
  -0.662370894973, -1.00700480494, -0.404707073677, 0.800482325044,
  0.743500089861, 1.01090520172, 0.741527555207, 0.277841675195,
  0.400833448236, -0.2085993586, -0.172842103641, -0.134316096293,
  0.0259303398477, 0.490105989562, 0.549391221511, 0.9047198589
];

// Direct Form II Transposed filter implementation
function applyFilter(signal: number[], a: number[], b: number[]): number[] {
  const output: number[] = [];
  const order = Math.max(a.length, b.length);
  const z = new Array(order).fill(0); // Delay line

  for (let i = 0; i < signal.length; i++) {
    const x = signal[i];
    
    // Calculate output
    let y = b[0] * x + z[0];
    
    // Update delay line
    for (let j = 1; j < order; j++) {
      z[j - 1] = (b[j] || 0) * x - (a[j] || 0) * y + (z[j] || 0);
    }
    
    output.push(y);
  }

  return output;
}

// Generate different signal types
function generateSignal(type: string, length: number): number[] {
  const signal: number[] = [];
  for (let i = 0; i < length; i++) {
    const t = i / length;
    switch (type) {
      case 'sine':
        signal.push(Math.sin(t * Math.PI * 8));
        break;
      case 'square':
        signal.push(Math.sin(t * Math.PI * 4) > 0 ? 1 : -1);
        break;
      case 'sawtooth':
        signal.push(((t * 8) % 1) * 2 - 1);
        break;
      case 'noise':
        signal.push((Math.random() - 0.5) * 2);
        break;
      case 'test':
      default:
        signal.push(TEST_SIGNAL[i % TEST_SIGNAL.length]);
    }
  }
  return signal;
}

// --- Component ---

export default function DigitalFilterVisualization() {
  const [signalType, setSignalType] = useState<string>('test');
  const [inputSignal, setInputSignal] = useState<number[]>(TEST_SIGNAL);
  const [outputSignal, setOutputSignal] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedIndex, setProcessedIndex] = useState(0);
  const [soundEnabled] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number>(0);

  // --- Audio ---
  const playSound = useCallback((type: 'process' | 'complete') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'process') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400 + processedIndex * 20, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  }, [soundEnabled, processedIndex]);

  // --- Signal Processing Animation ---
  const processSignal = useCallback(() => {
    setIsProcessing(true);
    setProcessedIndex(0);
    setOutputSignal([]);

    const fullOutput = applyFilter(inputSignal, DEFAULT_A, DEFAULT_B);
    let idx = 0;

    const animate = () => {
      if (idx < fullOutput.length) {
        setOutputSignal(fullOutput.slice(0, idx + 1));
        setProcessedIndex(idx);
        playSound('process');
        idx++;
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsProcessing(false);
        playSound('complete');
      }
    };

    const interval = setInterval(() => {
      if (idx < fullOutput.length) {
        setOutputSignal(fullOutput.slice(0, idx + 1));
        setProcessedIndex(idx);
        if (idx % 3 === 0) playSound('process');
        idx++;
      } else {
        clearInterval(interval);
        setIsProcessing(false);
        playSound('complete');
      }
    }, 80);

    return () => clearInterval(interval);
  }, [inputSignal, playSound]);

  // Change signal type
  useEffect(() => {
    const newSignal = generateSignal(signalType, 20);
    setInputSignal(newSignal);
    setOutputSignal([]);
    setProcessedIndex(0);
  }, [signalType]);

  const reset = () => {
    cancelAnimationFrame(animationRef.current);
    setIsProcessing(false);
    setOutputSignal([]);
    setProcessedIndex(0);
  };

  const processInstant = () => {
    const fullOutput = applyFilter(inputSignal, DEFAULT_A, DEFAULT_B);
    setOutputSignal(fullOutput);
    setProcessedIndex(fullOutput.length - 1);
    playSound('complete');
  };

  // Waveform drawing helper
  const renderWaveform = (data: number[], color: string, label: string, isOutput = false) => {
    const width = 100;
    const height = 100;
    const maxVal = Math.max(...data.map(Math.abs), 1.5);
    
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height / 2 - (val / maxVal) * (height / 2 - 10);
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="relative">
        <div className="absolute top-2 left-2 text-xs font-mono text-slate-500 flex items-center gap-1">
          {isOutput ? <Waves size={12} /> : <Activity size={12} />}
          {label}
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40 bg-slate-950 rounded-lg border border-slate-800">
          {/* Grid lines */}
          <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="#334155" strokeWidth="0.5" />
          {[...Array(5)].map((_, i) => (
            <line key={i} x1={(i+1) * width/5} y1="0" x2={(i+1) * width/5} y2={height} stroke="#1e293b" strokeWidth="0.5" />
          ))}
          
          {/* Waveform */}
          {data.length > 1 && (
            <motion.polyline
              points={points}
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5 }}
            />
          )}
          
          {/* Data points */}
          {data.map((val, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height / 2 - (val / maxVal) * (height / 2 - 10);
            const isActive = isOutput && i === processedIndex && isProcessing;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={isActive ? 3 : 2}
                fill={isActive ? '#fff' : color}
                className={isActive ? 'animate-pulse' : ''}
              />
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-teal-950/10 to-slate-950 rounded-xl border border-teal-900/30 font-mono overflow-hidden">
      
      {/* Header - Oscilloscope Style */}
      <div className="bg-slate-900/80 border-b border-teal-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/30">
              <Sliders className="text-teal-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-teal-300 tracking-wide">SIGNAL PROCESSOR</h2>
              <p className="text-xs text-teal-500/70">Butterworth Low-Pass Filter (Order 3)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Volume2 size={14} className="text-teal-500" />
            <span className="text-xs text-teal-400/70">Direct Form II Transposed</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        
        {/* Dual Oscilloscope Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Input Signal */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-cyan-400 uppercase tracking-wider">Input Signal</span>
              <select
                value={signalType}
                onChange={(e) => setSignalType(e.target.value)}
                disabled={isProcessing}
                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
              >
                <option value="test">Test Data</option>
                <option value="sine">Sine Wave</option>
                <option value="square">Square Wave</option>
                <option value="sawtooth">Sawtooth</option>
                <option value="noise">Noise</option>
              </select>
            </div>
            {renderWaveform(inputSignal, '#22d3ee', 'CH1: RAW')}
          </div>

          {/* Output Signal */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-emerald-400 uppercase tracking-wider">Filtered Output</span>
              <span className="text-xs text-slate-500">
                {outputSignal.length} / {inputSignal.length} samples
              </span>
            </div>
            {renderWaveform(outputSignal.length > 0 ? outputSignal : inputSignal.map(() => 0), '#10b981', 'CH2: FILTERED', true)}
          </div>
        </div>

        {/* Filter Coefficients Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-4">
            <div className="text-xs text-teal-400 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
              Feedforward Coefficients (b)
            </div>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_B.map((val, i) => (
                <span key={i} className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded text-xs text-cyan-300">
                  b[{i}] = {val.toFixed(4)}
                </span>
              ))}
            </div>
          </div>
          
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-4">
            <div className="text-xs text-teal-400 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Feedback Coefficients (a)
            </div>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_A.map((val, i) => (
                <span key={i} className="px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-300">
                  a[{i}] = {val.toExponential(2)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={processSignal}
            disabled={isProcessing}
            className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
              isProcessing
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-wait'
                : 'bg-teal-500/20 text-teal-300 border border-teal-500/50 hover:bg-teal-500/30'
            }`}
          >
            <Play size={18} />
            {isProcessing ? 'FILTERING...' : 'APPLY FILTER'}
          </button>
          <button
            onClick={processInstant}
            disabled={isProcessing}
            className="px-4 py-3 rounded-lg bg-emerald-900/30 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-900/50 transition-all disabled:opacity-50"
          >
            <Activity size={18} />
          </button>
          <button
            onClick={reset}
            className="px-4 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        {/* Sample Values Table */}
        {outputSignal.length > 0 && (
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-4 max-h-48 overflow-y-auto custom-scrollbar">
            <div className="text-xs text-slate-500 mb-2">Sample Values Comparison</div>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="text-slate-500">Index</div>
              <div className="text-cyan-400">Input</div>
              <div className="text-emerald-400">Output</div>
              {inputSignal.slice(0, 10).map((val, i) => (
                <motion.div 
                  key={i} 
                  className="contents"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="text-slate-600">[{i}]</div>
                  <div className="text-cyan-300">{val.toFixed(6)}</div>
                  <div className="text-emerald-300">{outputSignal[i]?.toFixed(6) || '—'}</div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-teal-400 hover:text-teal-300 transition-colors">
          How does the Butterworth filter work?
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            A <span className="text-teal-300">Butterworth filter</span> is designed to have a frequency response 
            as flat as possible in the passband — no ripples!
          </p>
          <p>
            The <span className="text-teal-300">Direct Form II Transposed</span> structure uses delay elements 
            efficiently and is more numerically stable for floating-point arithmetic.
          </p>
          <p>
            Formula: y[n] = b[0]·x[n] + z[0], where z is updated using both feedforward (b) and feedback (a) coefficients.
          </p>
        </div>
      </details>
    </div>
  );
}
