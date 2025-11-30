import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Compass, Plus, Trash2, Wind } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Math Logic ---
const degToRad = (deg: number): number => (deg * Math.PI) / 180;
const radToDeg = (rad: number): number => (rad * 180) / Math.PI;

const calculateMeanAngle = (angles: number[]): { mean: number; sumSin: number; sumCos: number; vectors: { x: number; y: number }[] } => {
  if (angles.length === 0) return { mean: 0, sumSin: 0, sumCos: 0, vectors: [] };
  
  let sumSin = 0;
  let sumCos = 0;
  const vectors: { x: number; y: number }[] = [];
  
  for (const angle of angles) {
    const rad = degToRad(angle);
    const x = Math.cos(rad);
    const y = Math.sin(rad);
    sumCos += x;
    sumSin += y;
    vectors.push({ x, y });
  }
  
  const avgCos = sumCos / angles.length;
  const avgSin = sumSin / angles.length;
  let mean = radToDeg(Math.atan2(avgSin, avgCos));
  
  // Normalize to 0-360
  if (mean < 0) mean += 360;
  
  return { mean, sumSin: avgSin, sumCos: avgCos, vectors };
};

// Simple arithmetic mean (wrong for angles)
const arithmeticMean = (angles: number[]): number => {
  if (angles.length === 0) return 0;
  return angles.reduce((a, b) => a + b, 0) / angles.length;
};

// Preset angle sets
const PRESETS = [
  { name: '350° & 10°', angles: [350, 10], description: 'Should be ~0°, not 180°' },
  { name: '90°, 180°, 270°, 360°', angles: [90, 180, 270, 360], description: 'Cardinal directions' },
  { name: '10°, 20°, 30°', angles: [10, 20, 30], description: 'Simple case' },
  { name: 'Wind readings', angles: [355, 5, 15, 320, 340], description: 'Northerly winds' },
];

// Compass direction names
const getDirectionName = (angle: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(angle / 22.5) % 16;
  return directions[index];
};

// Colors for angle vectors
const ANGLE_COLORS = [
  '#06b6d4', // cyan
  '#f59e0b', // amber
  '#10b981', // emerald
  '#f43f5e', // rose
  '#3b82f6', // blue
  '#84cc16', // lime
  '#ec4899', // pink
  '#14b8a6', // teal
];

export default function MeanAngleVisualization() {
  const [angles, setAngles] = useState<number[]>(PRESETS[0].angles);
  const [result, setResult] = useState<ReturnType<typeof calculateMeanAngle> | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const [newAngle, setNewAngle] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showWrongMean, setShowWrongMean] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number>(0);


  // --- Audio ---
  const playSound = useCallback((type: 'add' | 'remove' | 'calculate' | 'complete' | 'click' | 'step') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'add') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.setValueAtTime(800, now + 0.05);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'remove') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.setValueAtTime(200, now + 0.1);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'step') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400 + animationStep * 50, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
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
  }, [soundEnabled, animationStep]);

  // --- Calculate with animation ---
  const calculate = useCallback(() => {
    if (angles.length === 0) return;
    
    setIsAnimating(true);
    setAnimationStep(0);
    setResult(null);

    let step = 0;
    const totalSteps = angles.length + 2; // vectors + sum + result
    
    animationRef.current = window.setInterval(() => {
      if (step < totalSteps) {
        setAnimationStep(step);
        playSound('step');
        step++;
      } else {
        clearInterval(animationRef.current);
        setResult(calculateMeanAngle(angles));
        setIsAnimating(false);
        playSound('complete');
      }
    }, 300);
  }, [angles, playSound]);

  const reset = () => {
    clearInterval(animationRef.current);
    setIsAnimating(false);
    setAnimationStep(0);
    setResult(null);
  };

  const addAngle = () => {
    const angle = parseFloat(newAngle);
    if (!isNaN(angle)) {
      // Normalize to 0-360
      const normalized = ((angle % 360) + 360) % 360;
      setAngles(prev => [...prev, normalized]);
      setNewAngle('');
      reset();
      playSound('add');
    }
  };

  const removeAngle = (index: number) => {
    setAngles(prev => prev.filter((_, i) => i !== index));
    reset();
    playSound('remove');
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setAngles([...preset.angles]);
    reset();
    playSound('click');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!isAnimating) calculate(); }
      if (e.key === 'r' || e.key === 'R') reset();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [calculate, isAnimating]);

  useEffect(() => {
    return () => clearInterval(animationRef.current);
  }, []);

  const wrongMean = arithmeticMean(angles);
  const compassSize = 280;
  const centerX = compassSize / 2;
  const centerY = compassSize / 2;
  const radius = compassSize / 2 - 30;


  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-teal-950/10 to-slate-950 rounded-xl border border-teal-900/40 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950/30 to-slate-900 border-b border-teal-500/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2 rounded-lg bg-teal-500/20 border border-teal-500/50">
                <Compass className="text-teal-400" size={24} />
              </div>
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-teal-400 rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-teal-300 tracking-wider">WIND ROSE COMPASS</h2>
              <p className="text-xs text-teal-500/70">Mean Angle Calculator</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
          <span className="text-xs text-slate-500">Presets:</span>
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(preset)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                JSON.stringify(angles) === JSON.stringify(preset.angles)
                  ? 'bg-teal-500/20 border-teal-500/50 text-teal-300'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-teal-500/30'
              }`}
              title={preset.description}
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* Angle Input */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="flex flex-wrap gap-2 mb-3">
            {angles.map((angle, idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="group flex items-center gap-1 px-3 py-1.5 rounded-lg border"
                style={{
                  backgroundColor: `${ANGLE_COLORS[idx % ANGLE_COLORS.length]}20`,
                  borderColor: `${ANGLE_COLORS[idx % ANGLE_COLORS.length]}50`,
                }}
              >
                <Wind size={12} style={{ color: ANGLE_COLORS[idx % ANGLE_COLORS.length] }} />
                <span className="font-mono text-sm" style={{ color: ANGLE_COLORS[idx % ANGLE_COLORS.length] }}>
                  {angle.toFixed(0)}°
                </span>
                <button
                  onClick={() => removeAngle(idx)}
                  className="opacity-0 group-hover:opacity-100 ml-1 text-slate-500 hover:text-red-400 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </motion.div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <input
              type="number"
              value={newAngle}
              onChange={(e) => setNewAngle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addAngle()}
              placeholder="Add angle (0-360)"
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-teal-300 font-mono placeholder-slate-600 focus:outline-none focus:border-teal-500"
            />
            <button
              onClick={addAngle}
              className="px-4 py-2 bg-teal-500/20 text-teal-300 border border-teal-500/50 rounded-lg hover:bg-teal-500/30 transition-all"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Compass Visualization */}
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          {/* Compass */}
          <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-6 relative">
            <svg width={compassSize} height={compassSize} className="overflow-visible">
              {/* Compass background */}
              <circle cx={centerX} cy={centerY} r={radius + 20} fill="none" stroke="#334155" strokeWidth="1" />
              <circle cx={centerX} cy={centerY} r={radius} fill="none" stroke="#475569" strokeWidth="2" />
              <circle cx={centerX} cy={centerY} r={radius - 30} fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
              
              {/* Compass ticks and labels */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => {
                const rad = degToRad(90 - deg); // Convert to math angle (0 = East, counter-clockwise)
                const isCardinal = deg % 90 === 0;
                const tickLength = isCardinal ? 15 : 10;
                const x1 = centerX + (radius - tickLength) * Math.cos(rad);
                const y1 = centerY - (radius - tickLength) * Math.sin(rad);
                const x2 = centerX + radius * Math.cos(rad);
                const y2 = centerY - radius * Math.sin(rad);
                const labelX = centerX + (radius + 15) * Math.cos(rad);
                const labelY = centerY - (radius + 15) * Math.sin(rad);
                const labels: Record<number, string> = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' };
                
                return (
                  <g key={deg}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={isCardinal ? '#94a3b8' : '#475569'} strokeWidth={isCardinal ? 2 : 1} />
                    {isCardinal && (
                      <text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle" fill="#94a3b8" fontSize="12" fontWeight="bold">
                        {labels[deg]}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Angle vectors */}
              {angles.map((angle, idx) => {
                const rad = degToRad(90 - angle);
                const x = centerX + (radius - 40) * Math.cos(rad);
                const y = centerY - (radius - 40) * Math.sin(rad);
                const isVisible = animationStep > idx || result;
                const color = ANGLE_COLORS[idx % ANGLE_COLORS.length];
                
                return (
                  <g key={idx}>
                    <motion.line
                      x1={centerX}
                      y1={centerY}
                      x2={x}
                      y2={y}
                      stroke={color}
                      strokeWidth="3"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: isVisible ? 1 : 0, opacity: isVisible ? 1 : 0.3 }}
                      transition={{ duration: 0.3 }}
                    />
                    <motion.circle
                      cx={x}
                      cy={y}
                      r="6"
                      fill={color}
                      initial={{ scale: 0 }}
                      animate={{ scale: isVisible ? 1 : 0 }}
                      transition={{ duration: 0.2 }}
                    />
                  </g>
                );
              })}

              {/* Wrong mean (arithmetic) */}
              {showWrongMean && angles.length > 0 && (
                <g>
                  {(() => {
                    const rad = degToRad(90 - wrongMean);
                    const x = centerX + (radius - 50) * Math.cos(rad);
                    const y = centerY - (radius - 50) * Math.sin(rad);
                    return (
                      <motion.line
                        x1={centerX}
                        y1={centerY}
                        x2={x}
                        y2={y}
                        stroke="#ef4444"
                        strokeWidth="2"
                        strokeDasharray="6 4"
                        strokeLinecap="round"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                      />
                    );
                  })()}
                </g>
              )}

              {/* Result mean vector */}
              <AnimatePresence>
                {result && (
                  <g>
                    {(() => {
                      const rad = degToRad(90 - result.mean);
                      const x = centerX + (radius - 20) * Math.cos(rad);
                      const y = centerY - (radius - 20) * Math.sin(rad);
                      return (
                        <>
                          <motion.line
                            x1={centerX}
                            y1={centerY}
                            x2={x}
                            y2={y}
                            stroke="#10b981"
                            strokeWidth="4"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.5 }}
                          />
                          <motion.polygon
                            points={`${x},${y} ${x - 8},${y + 12} ${x + 8},${y + 12}`}
                            fill="#10b981"
                            initial={{ scale: 0, rotate: 90 - result.mean }}
                            animate={{ scale: 1 }}
                            style={{ transformOrigin: `${x}px ${y}px`, transform: `rotate(${-(90 - result.mean)}deg)` }}
                          />
                        </>
                      );
                    })()}
                  </g>
                )}
              </AnimatePresence>

              {/* Center dot */}
              <circle cx={centerX} cy={centerY} r="4" fill="#14b8a6" />
            </svg>
          </div>


          {/* Results Panel */}
          <div className="flex-1 space-y-4">
            {/* Calculate Button */}
            <button
              onClick={calculate}
              disabled={isAnimating || angles.length === 0}
              className={`w-full px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-3 transition-all ${
                isAnimating
                  ? 'bg-teal-500/10 text-teal-400/50 border border-teal-500/30 cursor-wait'
                  : angles.length === 0
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-300 border border-teal-500/50 hover:from-teal-500/30 hover:to-cyan-500/30'
              }`}
            >
              {isAnimating ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Compass size={20} />
                  </motion.div>
                  CALCULATING...
                </>
              ) : (
                <>
                  <Play size={20} />
                  FIND MEAN ANGLE
                </>
              )}
            </button>

            {/* Result Display */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-emerald-500/10 rounded-xl border border-emerald-500/30 p-4"
                >
                  <div className="text-xs text-emerald-400 mb-2">MEAN ANGLE</div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold text-emerald-300 font-mono">
                      {result.mean.toFixed(2)}°
                    </span>
                    <span className="text-lg text-emerald-400">
                      {getDirectionName(result.mean)}
                    </span>
                  </div>
                  
                  {/* Vector components */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-900/50 rounded p-2">
                      <span className="text-slate-500">Σcos/n:</span>
                      <span className="text-teal-300 font-mono ml-2">{result.sumCos.toFixed(4)}</span>
                    </div>
                    <div className="bg-slate-900/50 rounded p-2">
                      <span className="text-slate-500">Σsin/n:</span>
                      <span className="text-teal-300 font-mono ml-2">{result.sumSin.toFixed(4)}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Wrong mean comparison */}
            {angles.length > 0 && (
              <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500">Arithmetic Mean (Wrong)</span>
                  <label className="flex items-center gap-2 text-xs text-slate-500">
                    <input
                      type="checkbox"
                      checked={showWrongMean}
                      onChange={(e) => setShowWrongMean(e.target.checked)}
                      className="rounded border-slate-600 bg-slate-800 text-red-500 focus:ring-red-500"
                    />
                    Show
                  </label>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-red-400/70 font-mono line-through">
                    {wrongMean.toFixed(2)}°
                  </span>
                  {result && Math.abs(wrongMean - result.mean) > 1 && (
                    <span className="text-xs text-red-400">
                      (off by {Math.abs(wrongMean - result.mean).toFixed(1)}°)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Reset */}
            <button
              onClick={reset}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} />
              Reset
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-emerald-500" /> Correct mean
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-red-500 opacity-50" style={{ borderStyle: 'dashed' }} /> Wrong (arithmetic)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: ANGLE_COLORS[0] }} /> Input angles
          </span>
        </div>

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
        <summary className="px-4 py-3 cursor-pointer text-sm text-teal-400 hover:text-teal-300 transition-colors">
          Why can't we just average angles?
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            Angles are <span className="text-teal-300">circular</span> — 350° and 10° are both close to 0° (North), 
            but their arithmetic mean is 180° (South)!
          </p>
          <p>
            The solution: convert each angle to a <span className="text-amber-300">unit vector</span> (x = cos θ, y = sin θ), 
            average the vectors, then convert back using <span className="text-emerald-300">atan2</span>.
          </p>
          <p className="font-mono text-slate-500">
            mean = atan2(Σsin(αᵢ)/n, Σcos(αᵢ)/n)
          </p>
        </div>
      </details>
    </div>
  );
}
