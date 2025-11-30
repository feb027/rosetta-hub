import { useState, useRef, useCallback, useEffect } from 'react';
import { RotateCcw, Volume2, VolumeX, Zap, Plus, Trash2, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Preset number sets
const PRESETS = [
  { name: '1 to 10', numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  { name: 'AC Wave', numbers: [-1, 0, 1, 0, -1, 0, 1, 0] },
  { name: 'Sine Peak', numbers: [0, 0.707, 1, 0.707, 0, -0.707, -1, -0.707] },
  { name: 'Equal (5s)', numbers: [5, 5, 5, 5, 5] },
  { name: 'Mixed', numbers: [-3, -1, 0, 2, 4, 6] },
];

// Animation phases
type Phase = 'idle' | 'squaring' | 'summing' | 'dividing' | 'rooting' | 'complete';

export default function RootMeanSquareVisualization() {
  const [numbers, setNumbers] = useState<number[]>(PRESETS[0].numbers);
  const [phase, setPhase] = useState<Phase>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [squares, setSquares] = useState<number[]>([]);
  const [sumOfSquares, setSumOfSquares] = useState(0);
  const [meanOfSquares, setMeanOfSquares] = useState(0);
  const [rmsResult, setRmsResult] = useState<number | null>(null);
  const [newNumber, setNewNumber] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [waveOffset, setWaveOffset] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number>(0);
  const waveAnimRef = useRef<number>(0);

  // Animate background wave
  useEffect(() => {
    const animate = () => {
      setWaveOffset(prev => (prev + 0.5) % 360);
      waveAnimRef.current = requestAnimationFrame(animate);
    };
    waveAnimRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(waveAnimRef.current);
  }, []);

  // --- Audio ---
  const playSound = useCallback((type: 'square' | 'sum' | 'divide' | 'root' | 'complete' | 'add' | 'remove' | 'click') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'square') {
      // Electric zap sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200 + currentIndex * 50, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'sum') {
      // Accumulating hum
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'divide') {
      // Division click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.setValueAtTime(400, now + 0.05);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'root') {
      // Rising power-up
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'complete') {
      // Power station hum chord
      [110, 165, 220].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0.06, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + i * 0.05);
        osc.start(now + i * 0.05);
        osc.stop(now + 0.6 + i * 0.05);
      });
    } else if (type === 'add') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(660, now + 0.05);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'remove') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.setValueAtTime(165, now + 0.1);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      osc.start(now);
      osc.stop(now + 0.02);
    }
  }, [soundEnabled, currentIndex]);


  // --- Run Animation ---
  const runCalculation = useCallback(() => {
    if (numbers.length === 0) return;
    
    // Reset state
    setPhase('squaring');
    setCurrentIndex(0);
    setSquares([]);
    setSumOfSquares(0);
    setMeanOfSquares(0);
    setRmsResult(null);

    let idx = 0;
    const computedSquares: number[] = [];

    // Phase 1: Square each number
    const squareInterval = setInterval(() => {
      if (idx < numbers.length) {
        const sq = numbers[idx] * numbers[idx];
        computedSquares.push(sq);
        setSquares([...computedSquares]);
        setCurrentIndex(idx);
        playSound('square');
        idx++;
      } else {
        clearInterval(squareInterval);
        
        // Phase 2: Sum
        setPhase('summing');
        playSound('sum');
        const sum = computedSquares.reduce((a, b) => a + b, 0);
        setSumOfSquares(sum);

        setTimeout(() => {
          // Phase 3: Divide (mean)
          setPhase('dividing');
          playSound('divide');
          const mean = sum / numbers.length;
          setMeanOfSquares(mean);

          setTimeout(() => {
            // Phase 4: Square root
            setPhase('rooting');
            playSound('root');
            const rms = Math.sqrt(mean);
            setRmsResult(rms);

            setTimeout(() => {
              setPhase('complete');
              playSound('complete');
            }, 400);
          }, 500);
        }, 500);
      }
    }, 200);

    animationRef.current = squareInterval as unknown as number;
  }, [numbers, playSound]);

  const reset = () => {
    clearInterval(animationRef.current);
    setPhase('idle');
    setCurrentIndex(0);
    setSquares([]);
    setSumOfSquares(0);
    setMeanOfSquares(0);
    setRmsResult(null);
  };

  const addNumber = () => {
    const num = parseFloat(newNumber);
    if (!isNaN(num)) {
      setNumbers(prev => [...prev, num]);
      setNewNumber('');
      reset();
      playSound('add');
    }
  };

  const removeNumber = (index: number) => {
    setNumbers(prev => prev.filter((_, i) => i !== index));
    reset();
    playSound('remove');
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setNumbers([...preset.numbers]);
    reset();
    playSound('click');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (phase === 'idle' || phase === 'complete') runCalculation(); }
      if (e.key === 'r' || e.key === 'R') reset();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [runCalculation, phase]);

  useEffect(() => {
    return () => clearInterval(animationRef.current);
  }, []);

  // For gauge visualization
  const maxValue = Math.max(...numbers.map(Math.abs), rmsResult || 0, 1);
  const arithmeticMean = numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;

  // Generate waveform path
  const generateWavePath = (offset: number) => {
    const points: string[] = [];
    for (let i = 0; i <= 100; i++) {
      const x = i * 4;
      const y = 30 + Math.sin((i + offset) * 0.1) * 20;
      points.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
    }
    return points.join(' ');
  };

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-amber-950/5 to-slate-950 rounded-xl border border-amber-900/40 font-sans overflow-hidden">
      
      {/* Header with animated power lines */}
      <div className="relative bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border-b border-amber-500/30 px-6 py-4 overflow-hidden">
        {/* Animated wave background */}
        <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none">
          <motion.path
            d={generateWavePath(waveOffset)}
            stroke="url(#waveGradient)"
            strokeWidth="2"
            fill="none"
          />
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
        </svg>

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/50">
                <Zap className="text-amber-400" size={24} />
              </div>
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full"
                animate={{ 
                  scale: [1, 1.5, 1], 
                  opacity: [1, 0.3, 1],
                  boxShadow: ['0 0 0px #06b6d4', '0 0 10px #06b6d4', '0 0 0px #06b6d4']
                }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-300 tracking-wider">POWER STATION METER</h2>
              <p className="text-xs text-amber-500/70">Root Mean Square Calculator</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled 
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' 
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
          <span className="text-xs text-slate-500">Presets:</span>
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(preset)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                JSON.stringify(numbers) === JSON.stringify(preset.numbers)
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-amber-500/30'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* Number Input */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-slate-500 mb-2">Input Values (any real numbers)</div>
          <div className="flex flex-wrap gap-2 mb-3">
            {numbers.map((num, idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0 }}
                animate={{ 
                  scale: 1,
                  borderColor: phase === 'squaring' && idx === currentIndex 
                    ? '#06b6d4' 
                    : phase === 'squaring' && idx < currentIndex
                    ? '#10b981'
                    : '#475569'
                }}
                className={`group flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all ${
                  phase === 'squaring' && idx === currentIndex
                    ? 'bg-cyan-500/20 border-cyan-500'
                    : phase === 'squaring' && idx < currentIndex
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-slate-800/50 border-slate-600'
                }`}
              >
                <span className={`font-mono text-sm ${
                  num < 0 ? 'text-rose-400' : 'text-amber-300'
                }`}>{num}</span>
                {phase === 'idle' && (
                  <button
                    onClick={() => removeNumber(idx)}
                    className="opacity-0 group-hover:opacity-100 ml-1 text-slate-500 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
          
          {phase === 'idle' && (
            <div className="flex gap-2">
              <input
                type="number"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addNumber()}
                placeholder="Add number (+ or -)"
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-amber-300 font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500"
                step="any"
              />
              <button
                onClick={addNumber}
                className="px-4 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/50 rounded-lg hover:bg-amber-500/30 transition-all"
              >
                <Plus size={18} />
              </button>
            </div>
          )}
        </div>


        {/* Calculate Button */}
        <button
          onClick={runCalculation}
          disabled={phase !== 'idle' && phase !== 'complete' || numbers.length === 0}
          className={`w-full px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-3 transition-all ${
            phase !== 'idle' && phase !== 'complete'
              ? 'bg-cyan-500/10 text-cyan-400/50 border border-cyan-500/30 cursor-wait'
              : numbers.length === 0
              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500/20 to-cyan-500/20 text-amber-300 border border-amber-500/50 hover:from-amber-500/30 hover:to-cyan-500/30'
          }`}
        >
          {phase !== 'idle' && phase !== 'complete' ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                <Activity size={20} />
              </motion.div>
              CALCULATING...
            </>
          ) : (
            <>
              <Zap size={20} />
              COMPUTE RMS
            </>
          )}
        </button>

        {/* Main Visualization - Power Gauge */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-6">
          <div className="text-xs text-cyan-400 mb-4 flex items-center gap-2">
            <Activity size={14} />
            RMS = √(Σx²/n) — Quadratic Mean
          </div>

          {/* Analog Gauge Display */}
          <div className="flex justify-center mb-6">
            <div className="relative w-64 h-40">
              {/* Gauge background */}
              <svg viewBox="0 0 200 120" className="w-full h-full">
                {/* Gauge arc background */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="20"
                  strokeLinecap="round"
                />
                {/* Gauge arc fill */}
                <motion.path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="url(#gaugeGradient)"
                  strokeWidth="20"
                  strokeLinecap="round"
                  strokeDasharray="251.2"
                  initial={{ strokeDashoffset: 251.2 }}
                  animate={{ 
                    strokeDashoffset: rmsResult !== null 
                      ? 251.2 - (rmsResult / maxValue) * 251.2 * 0.9
                      : 251.2 
                  }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
                {/* Tick marks */}
                {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => {
                  const angle = Math.PI - tick * Math.PI;
                  const x1 = 100 + Math.cos(angle) * 65;
                  const y1 = 100 + Math.sin(angle) * -65;
                  const x2 = 100 + Math.cos(angle) * 75;
                  const y2 = 100 + Math.sin(angle) * -75;
                  return (
                    <line
                      key={i}
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke="#64748b"
                      strokeWidth="2"
                    />
                  );
                })}
                {/* Needle */}
                <motion.line
                  x1="100"
                  y1="100"
                  x2="100"
                  y2="30"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  strokeLinecap="round"
                  style={{ transformOrigin: '100px 100px' }}
                  initial={{ rotate: -90 }}
                  animate={{ 
                    rotate: rmsResult !== null 
                      ? -90 + (rmsResult / maxValue) * 180 * 0.9
                      : -90 
                  }}
                  transition={{ duration: 0.5, type: 'spring', stiffness: 50 }}
                />
                {/* Center dot */}
                <circle cx="100" cy="100" r="8" fill="#f59e0b" />
                <circle cx="100" cy="100" r="4" fill="#1e293b" />
                
                <defs>
                  <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Digital readout */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                <motion.div
                  className="text-3xl font-bold font-mono text-cyan-300"
                  animate={{ 
                    textShadow: phase === 'complete' 
                      ? ['0 0 10px #06b6d4', '0 0 20px #06b6d4', '0 0 10px #06b6d4']
                      : '0 0 0px #06b6d4'
                  }}
                  transition={{ duration: 0.5, repeat: phase === 'complete' ? 3 : 0 }}
                >
                  {rmsResult !== null ? rmsResult.toFixed(6) : '—'}
                </motion.div>
                <div className="text-xs text-slate-500">RMS VALUE</div>
              </div>
            </div>
          </div>

          {/* Step-by-step breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Step 1: Square */}
            <div className={`rounded-xl border p-4 transition-all ${
              phase === 'squaring' || squares.length > 0
                ? 'bg-cyan-500/10 border-cyan-500/30'
                : 'bg-slate-800/30 border-slate-700/30'
            }`}>
              <div className="text-xs text-cyan-400 mb-2 font-bold">1. SQUARE</div>
              <div className="text-xs text-slate-500 mb-2">x²</div>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                <AnimatePresence>
                  {squares.map((sq, idx) => (
                    <motion.span
                      key={idx}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="px-1.5 py-0.5 bg-cyan-500/20 rounded text-xs font-mono text-cyan-300"
                    >
                      {sq.toFixed(2)}
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Step 2: Sum */}
            <div className={`rounded-xl border p-4 transition-all ${
              phase === 'summing' || sumOfSquares > 0
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-slate-800/30 border-slate-700/30'
            }`}>
              <div className="text-xs text-emerald-400 mb-2 font-bold">2. SUM</div>
              <div className="text-xs text-slate-500 mb-2">Σx²</div>
              <motion.div
                className="text-xl font-bold font-mono text-emerald-300"
                initial={{ scale: 1 }}
                animate={{ scale: sumOfSquares > 0 ? [1, 1.1, 1] : 1 }}
              >
                {sumOfSquares > 0 ? sumOfSquares.toFixed(2) : '—'}
              </motion.div>
            </div>

            {/* Step 3: Divide */}
            <div className={`rounded-xl border p-4 transition-all ${
              phase === 'dividing' || meanOfSquares > 0
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-slate-800/30 border-slate-700/30'
            }`}>
              <div className="text-xs text-amber-400 mb-2 font-bold">3. MEAN</div>
              <div className="text-xs text-slate-500 mb-2">Σx²/n</div>
              <motion.div
                className="text-xl font-bold font-mono text-amber-300"
                initial={{ scale: 1 }}
                animate={{ scale: meanOfSquares > 0 ? [1, 1.1, 1] : 1 }}
              >
                {meanOfSquares > 0 ? meanOfSquares.toFixed(4) : '—'}
              </motion.div>
            </div>

            {/* Step 4: Root */}
            <div className={`rounded-xl border p-4 transition-all ${
              phase === 'rooting' || phase === 'complete'
                ? 'bg-rose-500/10 border-rose-500/30'
                : 'bg-slate-800/30 border-slate-700/30'
            }`}>
              <div className="text-xs text-rose-400 mb-2 font-bold">4. ROOT</div>
              <div className="text-xs text-slate-500 mb-2">√(Σx²/n)</div>
              <motion.div
                className="text-xl font-bold font-mono text-rose-300"
                initial={{ scale: 1 }}
                animate={{ scale: rmsResult !== null ? [1, 1.1, 1] : 1 }}
              >
                {rmsResult !== null ? rmsResult.toFixed(4) : '—'}
              </motion.div>
            </div>
          </div>
        </div>


        {/* Comparison: RMS vs Arithmetic Mean */}
        <AnimatePresence>
          {rmsResult !== null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/50 rounded-xl border border-slate-800 p-4"
            >
              <div className="text-xs text-slate-400 mb-3">RMS vs Arithmetic Mean Comparison</div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-cyan-400">RMS</span>
                    <span className="text-cyan-300 font-mono">{rmsResult.toFixed(4)}</span>
                  </div>
                  <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(rmsResult / Math.max(rmsResult, Math.abs(arithmeticMean))) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-amber-400">Arithmetic Mean</span>
                    <span className="text-amber-300 font-mono">{arithmeticMean.toFixed(4)}</span>
                  </div>
                  <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(Math.abs(arithmeticMean) / Math.max(rmsResult, Math.abs(arithmeticMean))) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-500 text-center">
                {rmsResult >= Math.abs(arithmeticMean) ? (
                  <span className="text-emerald-400">✓ RMS ≥ |Mean| (always true for real numbers)</span>
                ) : (
                  <span className="text-rose-400">Unexpected: RMS should be ≥ |Mean|</span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Count (n)</div>
            <div className="text-xl font-bold text-amber-400">{numbers.length}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Min</div>
            <div className="text-xl font-bold text-cyan-400 font-mono">
              {numbers.length > 0 ? Math.min(...numbers).toFixed(2) : '—'}
            </div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Max</div>
            <div className="text-xl font-bold text-emerald-400 font-mono">
              {numbers.length > 0 ? Math.max(...numbers).toFixed(2) : '—'}
            </div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Range</div>
            <div className="text-xl font-bold text-rose-400 font-mono">
              {numbers.length > 0 ? (Math.max(...numbers) - Math.min(...numbers)).toFixed(2) : '—'}
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={reset}
          className="w-full px-4 py-2 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw size={16} />
          Reset
        </button>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Space</kbd> Calculate
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-amber-400 hover:text-amber-300 transition-colors">
          About Root Mean Square
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            The <span className="text-cyan-300">Root Mean Square (RMS)</span>, also called the 
            <span className="text-amber-300"> quadratic mean</span>, is a statistical measure 
            of the magnitude of a varying quantity.
          </p>
          <p className="font-mono text-slate-300">
            x<sub>rms</sub> = √((x₁² + x₂² + ... + xₙ²) / n)
          </p>
          <p>
            <span className="text-emerald-300">Key applications:</span>
          </p>
          <ul className="space-y-1 ml-4 list-disc">
            <li>AC voltage/current measurement (effective value)</li>
            <li>Signal processing and audio engineering</li>
            <li>Standard deviation calculation</li>
            <li>Physics: velocity of gas molecules</li>
          </ul>
          <p className="text-slate-500">
            For the numbers 1 to 10, RMS ≈ 6.2048 (greater than arithmetic mean of 5.5)
          </p>
        </div>
      </details>
    </div>
  );
}
