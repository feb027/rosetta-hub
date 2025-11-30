import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Plus, TrendingUp, Activity, Gauge, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DataPoint {
  value: number;
  sma: number | null;
  timestamp: number;
  inWindow: boolean;
}

const PRESETS = [
  { name: 'Stock Prices', values: [11, 12, 13, 14, 15, 14, 13, 12, 11, 10], period: 3 },
  { name: 'Temperature', values: [22, 24, 23, 25, 26, 24, 23, 22, 21, 23], period: 4 },
  { name: 'Sensor Data', values: [100, 102, 98, 105, 97, 103, 99, 101, 104, 96], period: 5 },
  { name: 'Rosetta Example', values: [1, 2, 3, 4, 5, 5, 4, 3, 2, 1], period: 3 },
];

export default function SimpleMovingAverageVisualization() {
  const [period, setPeriod] = useState(3);
  const [inputValues, setInputValues] = useState<number[]>([1, 2, 3, 4, 5, 5, 4, 3, 2, 1]);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(800);
  const [newValue, setNewValue] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [windowValues, setWindowValues] = useState<number[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);


  // --- Audio ---
  const playSound = useCallback((type: 'tick' | 'slide' | 'complete' | 'add' | 'remove' | 'click') => {
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
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.08);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'slide') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(550, now + 0.15);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'complete') {
      [523, 659, 784].forEach((freq, i) => {
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
    } else if (type === 'add') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.1);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'remove') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.1);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
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

  // Calculate SMA for a window
  const calculateSMA = useCallback((window: number[]): number | null => {
    if (window.length === 0) return null;
    return window.reduce((a, b) => a + b, 0) / window.length;
  }, []);

  // Process next value
  const processNext = useCallback(() => {
    if (currentIndex >= inputValues.length - 1) {
      setIsPlaying(false);
      playSound('complete');
      return;
    }

    const nextIndex = currentIndex + 1;
    const value = inputValues[nextIndex];
    
    // Update window (sliding window of last P values)
    const newWindow = [...windowValues, value].slice(-period);
    setWindowValues(newWindow);
    
    const sma = calculateSMA(newWindow);
    
    const newPoint: DataPoint = {
      value,
      sma,
      timestamp: Date.now(),
      inWindow: true,
    };

    setDataPoints(prev => {
      const updated = prev.map((p, i) => ({
        ...p,
        inWindow: i >= prev.length - period + 1,
      }));
      return [...updated, newPoint];
    });
    
    setCurrentIndex(nextIndex);
    playSound(newWindow.length === period ? 'slide' : 'tick');
  }, [currentIndex, inputValues, windowValues, period, calculateSMA, playSound]);


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

  // Reset
  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex(-1);
    setDataPoints([]);
    setWindowValues([]);
    playSound('click');
  }, [playSound]);

  // Apply preset
  const applyPreset = (preset: typeof PRESETS[0]) => {
    reset();
    setInputValues([...preset.values]);
    setPeriod(preset.period);
    playSound('click');
  };

  // Add value
  const addValue = () => {
    const num = parseFloat(newValue);
    if (!isNaN(num) && inputValues.length < 20) {
      setInputValues([...inputValues, num]);
      setNewValue('');
      playSound('add');
    }
  };

  // Remove value
  const removeValue = (index: number) => {
    if (currentIndex >= 0) return; // Don't allow during playback
    setInputValues(inputValues.filter((_, i) => i !== index));
    playSound('remove');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ') { e.preventDefault(); setIsPlaying(p => !p); }
      if (e.key === 'r' || e.key === 'R') reset();
      if (e.key === 'ArrowRight' && !isPlaying) processNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [reset, isPlaying, processNext]);

  // Chart dimensions
  const chartHeight = 200;
  const chartWidth = 600;
  const padding = 40;

  // Calculate chart scales
  const allValues = [...inputValues, ...dataPoints.map(d => d.sma).filter((s): s is number => s !== null)];
  const minVal = Math.min(...allValues) - 1;
  const maxVal = Math.max(...allValues) + 1;
  const valueRange = maxVal - minVal || 1;

  const getY = (val: number) => chartHeight - padding - ((val - minVal) / valueRange) * (chartHeight - padding * 2);
  const getX = (idx: number) => padding + (idx / Math.max(inputValues.length - 1, 1)) * (chartWidth - padding * 2);

  // Generate path for SMA line
  const smaPath = dataPoints
    .map((d, i) => d.sma !== null ? `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.sma)}` : '')
    .filter(Boolean)
    .join(' ');

  // Generate path for raw values
  const rawPath = dataPoints
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.value)}`)
    .join(' ');

  const currentSMA = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].sma : null;

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-emerald-950/10 to-slate-950 rounded-xl border border-emerald-900/40 font-sans overflow-hidden">
      
      {/* Header - Stock Ticker Style */}
      <div className="bg-slate-900/80 border-b border-emerald-800/40 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/40">
              <TrendingUp className="text-emerald-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-300 tracking-wide">STREAM ANALYTICS</h2>
              <p className="text-xs text-emerald-500/70">Simple Moving Average</p>
            </div>
          </div>

          {/* Live Ticker Display */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className="text-xs text-slate-400 font-mono">{isPlaying ? 'STREAMING' : 'PAUSED'}</span>
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
        
        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-slate-500 self-center">Presets:</span>
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(preset)}
              className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-xs text-slate-400 hover:text-emerald-300 hover:border-emerald-500/50 transition-all"
            >
              {preset.name} (P={preset.period})
            </button>
          ))}
        </div>

        {/* Period Selector */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Clock size={14} />
              Period (P) - Window Size
            </div>
            <span className="text-lg font-bold text-emerald-400 font-mono">{period}</span>
          </div>
          <input
            type="range"
            min="2"
            max="7"
            value={period}
            onChange={(e) => {
              if (currentIndex < 0) {
                setPeriod(parseInt(e.target.value));
                playSound('click');
              }
            }}
            disabled={currentIndex >= 0}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-50"
          />
          <div className="flex justify-between text-xs text-slate-600 mt-1">
            <span>2</span>
            <span>7</span>
          </div>
        </div>

        {/* Input Stream Display */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Activity size={14} />
              Input Stream [{inputValues.length} values]
            </div>
            <span className="text-xs text-slate-500">
              {currentIndex >= 0 ? `Processing: ${currentIndex + 1}/${inputValues.length}` : 'Ready'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 min-h-[40px]">
            {inputValues.map((v, idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0 }}
                animate={{ 
                  scale: 1,
                  opacity: currentIndex >= 0 && idx > currentIndex ? 0.4 : 1,
                }}
                className={`group relative px-3 py-1.5 rounded-lg text-sm font-mono transition-all ${
                  idx === currentIndex
                    ? 'bg-emerald-500/30 border-2 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-500/20'
                    : idx <= currentIndex && idx > currentIndex - period
                    ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
                    : idx <= currentIndex
                    ? 'bg-slate-700/50 border border-slate-600 text-slate-400'
                    : 'bg-slate-800 border border-slate-700 text-slate-300'
                }`}
              >
                {v}
                {currentIndex < 0 && (
                  <button
                    onClick={() => removeValue(idx)}
                    className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center transition-opacity text-white text-xs"
                  >
                    ×
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sliding Window Visualization */}
        <div className="bg-slate-900/30 rounded-xl border border-emerald-800/30 p-4 relative overflow-hidden">
          {/* Grid background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `linear-gradient(rgba(16,185,129,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.3) 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
            }} />
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs text-emerald-400 flex items-center gap-2">
                <Gauge size={14} />
                Sliding Window (Last {period} values)
              </div>
              <AnimatePresence mode="wait">
                {currentSMA !== null && (
                  <motion.div
                    key={currentSMA}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/50 rounded-lg"
                  >
                    <span className="text-xs text-emerald-400">SMA = </span>
                    <span className="text-lg font-bold text-emerald-300 font-mono">
                      {currentSMA.toFixed(4)}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Window slots */}
            <div className="flex justify-center gap-3 mb-4">
              {Array.from({ length: period }).map((_, idx) => {
                const windowIdx = windowValues.length - period + idx;
                const value = windowIdx >= 0 ? windowValues[windowIdx] : null;
                const isActive = value !== null;
                
                return (
                  <motion.div
                    key={idx}
                    className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center font-mono text-lg font-bold transition-all ${
                      isActive
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-800/50 border-slate-700 border-dashed text-slate-600'
                    }`}
                    animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {value !== null ? value : '—'}
                  </motion.div>
                );
              })}
            </div>

            {/* Calculation display */}
            {windowValues.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-sm text-slate-400 font-mono"
              >
                ({windowValues.join(' + ')}) / {windowValues.length} = {' '}
                <span className="text-emerald-400 font-bold">
                  {calculateSMA(windowValues)?.toFixed(4)}
                </span>
              </motion.div>
            )}
          </div>
        </div>


        {/* Chart Visualization */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-slate-400 mb-3 flex items-center gap-2">
            <TrendingUp size={14} />
            Real-time Chart
          </div>
          
          <div className="overflow-x-auto">
            <svg width={chartWidth} height={chartHeight} className="mx-auto">
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = padding + ratio * (chartHeight - padding * 2);
                const val = maxVal - ratio * valueRange;
                return (
                  <g key={ratio}>
                    <line
                      x1={padding}
                      y1={y}
                      x2={chartWidth - padding}
                      y2={y}
                      stroke="rgba(100,116,139,0.2)"
                      strokeDasharray="4,4"
                    />
                    <text
                      x={padding - 8}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-slate-500 text-[10px] font-mono"
                    >
                      {val.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {/* X-axis labels */}
              {inputValues.map((_, idx) => (
                <text
                  key={idx}
                  x={getX(idx)}
                  y={chartHeight - 10}
                  textAnchor="middle"
                  className="fill-slate-500 text-[10px] font-mono"
                >
                  {idx + 1}
                </text>
              ))}

              {/* Raw values line */}
              {dataPoints.length > 0 && (
                <motion.path
                  d={rawPath}
                  fill="none"
                  stroke="rgba(148,163,184,0.5)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                />
              )}

              {/* SMA line */}
              {dataPoints.length > 0 && smaPath && (
                <motion.path
                  d={smaPath}
                  fill="none"
                  stroke="rgb(16,185,129)"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  style={{ filter: 'drop-shadow(0 0 6px rgba(16,185,129,0.5))' }}
                />
              )}

              {/* Data points */}
              {dataPoints.map((d, idx) => (
                <g key={idx}>
                  {/* Raw value point */}
                  <motion.circle
                    cx={getX(idx)}
                    cy={getY(d.value)}
                    r={4}
                    fill={d.inWindow ? 'rgb(34,211,238)' : 'rgb(148,163,184)'}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                  />
                  
                  {/* SMA point */}
                  {d.sma !== null && (
                    <motion.circle
                      cx={getX(idx)}
                      cy={getY(d.sma)}
                      r={5}
                      fill="rgb(16,185,129)"
                      stroke="white"
                      strokeWidth={2}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                      style={{ filter: 'drop-shadow(0 0 4px rgba(16,185,129,0.6))' }}
                    />
                  )}
                </g>
              ))}

              {/* Current position indicator */}
              {currentIndex >= 0 && currentIndex < inputValues.length && (
                <motion.line
                  x1={getX(currentIndex)}
                  y1={padding}
                  x2={getX(currentIndex)}
                  y2={chartHeight - padding}
                  stroke="rgba(16,185,129,0.3)"
                  strokeWidth={2}
                  strokeDasharray="4,4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
              )}
            </svg>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-400" />
              <span className="text-slate-400">Raw Values</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-400">SMA (P={period})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-400" />
              <span className="text-slate-400">In Window</span>
            </div>
          </div>
        </div>

        {/* Results Table */}
        {dataPoints.length > 0 && (
          <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4 overflow-x-auto">
            <div className="text-xs text-slate-400 mb-3">Computation Log</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-xs">
                  <th className="text-left py-2 px-3">Step</th>
                  <th className="text-left py-2 px-3">Input</th>
                  <th className="text-left py-2 px-3">Window</th>
                  <th className="text-left py-2 px-3">SMA</th>
                </tr>
              </thead>
              <tbody>
                {dataPoints.map((d, idx) => {
                  const windowStart = Math.max(0, idx - period + 1);
                  const windowVals = dataPoints.slice(windowStart, idx + 1).map(p => p.value);
                  return (
                    <motion.tr
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`border-t border-slate-800 ${idx === currentIndex ? 'bg-emerald-500/10' : ''}`}
                    >
                      <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono text-cyan-300">{d.value}</td>
                      <td className="py-2 px-3 font-mono text-slate-300">[{windowVals.join(', ')}]</td>
                      <td className="py-2 px-3 font-mono text-emerald-400 font-bold">
                        {d.sma?.toFixed(4) ?? '—'}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}


        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={currentIndex >= inputValues.length - 1}
            className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30'
            } disabled:opacity-50`}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            {isPlaying ? 'PAUSE' : currentIndex >= inputValues.length - 1 ? 'COMPLETE' : 'STREAM'}
          </button>
          
          <button
            onClick={processNext}
            disabled={isPlaying || currentIndex >= inputValues.length - 1}
            className="px-4 py-3 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            Step →
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
              className="w-20 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        </div>

        {/* Add Value */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-emerald-400 mb-3 flex items-center gap-2">
            <Plus size={14} />
            Add to Stream
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addValue()}
              placeholder="Enter number"
              disabled={currentIndex >= 0}
              className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-600 font-mono focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            />
            <button
              onClick={addValue}
              disabled={!newValue || inputValues.length >= 20 || currentIndex >= 0}
              className="px-4 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 rounded-lg hover:bg-emerald-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Plus size={16} />
              ADD
            </button>
          </div>
          <div className="text-xs text-slate-600 mt-2">{inputValues.length}/20 values</div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Period (P)</div>
            <div className="text-xl font-bold text-emerald-400 font-mono">{period}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Processed</div>
            <div className="text-xl font-bold text-cyan-400 font-mono">{Math.max(0, currentIndex + 1)}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Window Size</div>
            <div className="text-xl font-bold text-slate-300 font-mono">{windowValues.length}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Current SMA</div>
            <div className="text-xl font-bold text-emerald-400 font-mono">
              {currentSMA?.toFixed(2) ?? '—'}
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Space</kbd> Play/Pause
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">→</kbd> Step
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
          About Simple Moving Average
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            A <span className="text-emerald-300">Simple Moving Average (SMA)</span> computes the average 
            of the last P numbers from a stream, where P is the period.
          </p>
          <p>
            <span className="text-cyan-300">Stateful:</span> The SMA function must remember the period P 
            and maintain a container of at least the last P numbers between calls.
          </p>
          <p>
            <span className="text-amber-300">Sliding Window:</span> As new values arrive, old values 
            outside the window are discarded, keeping only the most recent P values.
          </p>
          <div className="mt-3 p-3 bg-slate-800/50 rounded-lg font-mono text-[11px]">
            <div className="text-slate-500 mb-1">// Pseudo-code</div>
            <div className="text-slate-300">SMA(n) = (x[n] + x[n-1] + ... + x[n-P+1]) / P</div>
          </div>
        </div>
      </details>
    </div>
  );
}
