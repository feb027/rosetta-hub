import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Settings, Zap, Wind, Gauge } from 'lucide-react';
import { motion } from 'motion/react';

interface PendulumState {
  angle: number;
  angularVelocity: number;
  time: number;
}

interface TrailPoint {
  x: number;
  y: number;
  age: number;
}

const PRESETS = [
  { name: 'Gentle Swing', angle: 15, length: 200, gravity: 9.81, damping: 0 },
  { name: 'Wide Arc', angle: 60, length: 200, gravity: 9.81, damping: 0 },
  { name: 'Moon Gravity', angle: 30, length: 200, gravity: 1.62, damping: 0 },
  { name: 'Jupiter', angle: 20, length: 200, gravity: 24.79, damping: 0 },
  { name: 'With Friction', angle: 45, length: 200, gravity: 9.81, damping: 0.02 },
  { name: 'Long Pendulum', angle: 30, length: 300, gravity: 9.81, damping: 0 },
];

export default function AnimatePendulumVisualization() {
  const [isRunning, setIsRunning] = useState(false);
  const [initialAngle, setInitialAngle] = useState(30);
  const [length, setLength] = useState(200);
  const [gravity, setGravity] = useState(9.81);
  const [damping, setDamping] = useState(0);
  const [showTrail, setShowTrail] = useState(true);
  const [showVectors, setShowVectors] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [state, setState] = useState<PendulumState>({ angle: 30 * Math.PI / 180, angularVelocity: 0, time: 0 });
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const [maxAngleReached, setMaxAngleReached] = useState(30);
  const [oscillations, setOscillations] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const lastAngleSignRef = useRef<number>(1);
  const tickCountRef = useRef<number>(0);


  // --- Audio ---
  const playSound = useCallback((type: 'tick' | 'swing' | 'start' | 'stop' | 'click') => {
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
      osc.frequency.setValueAtTime(800 + Math.abs(state.angularVelocity) * 100, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      osc.start(now);
      osc.stop(now + 0.02);
    } else if (type === 'swing') {
      // Whoosh sound at max velocity
      const noise = ctx.createBufferSource();
      const bufferSize = ctx.sampleRate * 0.1;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }
      noise.buffer = buffer;
      const noiseGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, now);
      filter.Q.setValueAtTime(1, now);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseGain.gain.setValueAtTime(0.08 * Math.min(Math.abs(state.angularVelocity), 3), now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      noise.start(now);
      noise.stop(now + 0.1);
      return;
    } else if (type === 'start') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.1);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'stop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.1);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.start(now);
      osc.stop(now + 0.03);
    }
  }, [soundEnabled, state.angularVelocity]);


  // Physics simulation using Runge-Kutta 4th order
  const simulate = useCallback((dt: number, currentState: PendulumState): PendulumState => {
    const { angle, angularVelocity } = currentState;
    const g = gravity;
    const L = length / 100; // Convert to meters
    const d = damping;

    // Equation: θ'' = -(g/L) * sin(θ) - d * θ'
    const acceleration = (theta: number, omega: number) => -(g / L) * Math.sin(theta) - d * omega;

    // RK4 integration
    const k1v = acceleration(angle, angularVelocity);
    const k1x = angularVelocity;

    const k2v = acceleration(angle + k1x * dt / 2, angularVelocity + k1v * dt / 2);
    const k2x = angularVelocity + k1v * dt / 2;

    const k3v = acceleration(angle + k2x * dt / 2, angularVelocity + k2v * dt / 2);
    const k3x = angularVelocity + k2v * dt / 2;

    const k4v = acceleration(angle + k3x * dt, angularVelocity + k3v * dt);
    const k4x = angularVelocity + k3v * dt;

    const newAngle = angle + (k1x + 2 * k2x + 2 * k3x + k4x) * dt / 6;
    const newVelocity = angularVelocity + (k1v + 2 * k2v + 2 * k3v + k4v) * dt / 6;

    return {
      angle: newAngle,
      angularVelocity: newVelocity,
      time: currentState.time + dt,
    };
  }, [gravity, length, damping]);

  // Animation loop
  useEffect(() => {
    if (!isRunning) return;

    const animate = (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }

      const elapsed = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      // Limit dt to prevent instability
      const dt = Math.min(elapsed, 0.02);

      setState(prev => {
        const newState = simulate(dt, prev);

        // Track oscillations (zero crossings)
        const currentSign = Math.sign(newState.angle);
        if (currentSign !== lastAngleSignRef.current && currentSign !== 0) {
          setOscillations(o => o + 0.5);
          playSound('swing');
        }
        lastAngleSignRef.current = currentSign || lastAngleSignRef.current;

        // Track max angle
        const angleDeg = Math.abs(newState.angle * 180 / Math.PI);
        setMaxAngleReached(m => Math.max(m, angleDeg));

        // Tick sound
        tickCountRef.current++;
        if (tickCountRef.current % 10 === 0) {
          playSound('tick');
        }

        return newState;
      });

      // Update trail
      if (showTrail) {
        setTrail(prev => {
          const pivotX = 250;
          const pivotY = 50;
          const bobX = pivotX + length * Math.sin(state.angle);
          const bobY = pivotY + length * Math.cos(state.angle);
          const newPoint = { x: bobX, y: bobY, age: 0 };
          const updated = [...prev, newPoint]
            .map(p => ({ ...p, age: p.age + 1 }))
            .filter(p => p.age < 60);
          return updated;
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isRunning, simulate, showTrail, length, state.angle, playSound]);


  // Controls
  const start = () => {
    lastTimeRef.current = 0;
    setIsRunning(true);
    playSound('start');
  };

  const stop = () => {
    setIsRunning(false);
    playSound('stop');
  };

  const reset = useCallback(() => {
    cancelAnimationFrame(animationRef.current);
    setIsRunning(false);
    const angleRad = initialAngle * Math.PI / 180;
    setState({ angle: angleRad, angularVelocity: 0, time: 0 });
    setTrail([]);
    setMaxAngleReached(initialAngle);
    setOscillations(0);
    lastTimeRef.current = 0;
    lastAngleSignRef.current = Math.sign(angleRad) || 1;
    tickCountRef.current = 0;
    playSound('click');
  }, [initialAngle, playSound]);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setInitialAngle(preset.angle);
    setLength(preset.length);
    setGravity(preset.gravity);
    setDamping(preset.damping);
    const angleRad = preset.angle * Math.PI / 180;
    setState({ angle: angleRad, angularVelocity: 0, time: 0 });
    setTrail([]);
    setMaxAngleReached(preset.angle);
    setOscillations(0);
    setIsRunning(false);
    playSound('click');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ') { e.preventDefault(); isRunning ? stop() : start(); }
      if (e.key === 'r' || e.key === 'R') reset();
      if (e.key === 't' || e.key === 'T') setShowTrail(t => !t);
      if (e.key === 'v' || e.key === 'V') setShowVectors(v => !v);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isRunning, reset]);

  // Calculate pendulum position
  const pivotX = 250;
  const pivotY = 50;
  const bobX = pivotX + length * Math.sin(state.angle);
  const bobY = pivotY + length * Math.cos(state.angle);
  const angleDeg = state.angle * 180 / Math.PI;
  const period = 2 * Math.PI * Math.sqrt((length / 100) / gravity);

  // Calculate energy (for visualization)
  const potentialEnergy = gravity * (length / 100) * (1 - Math.cos(state.angle));
  const kineticEnergy = 0.5 * Math.pow(length / 100, 2) * Math.pow(state.angularVelocity, 2);
  const totalEnergy = potentialEnergy + kineticEnergy;
  const pePercent = totalEnergy > 0 ? (potentialEnergy / totalEnergy) * 100 : 0;
  const kePercent = totalEnergy > 0 ? (kineticEnergy / totalEnergy) * 100 : 0;


  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-amber-950/10 to-slate-950 rounded-xl border border-amber-900/30 font-sans overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-amber-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <Zap className="text-amber-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-300 tracking-wide">PHYSICS PLAYGROUND</h2>
              <p className="text-xs text-amber-500/70">Simple Gravity Pendulum Simulation</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isRunning ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800 border-slate-700'}`}>
              <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              <span className={`text-xs font-medium ${isRunning ? 'text-emerald-400' : 'text-slate-500'}`}>
                {isRunning ? 'SIMULATING' : 'PAUSED'}
              </span>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${soundEnabled ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Main Visualization */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4 relative overflow-hidden">
          {/* Background grid */}
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f59e0b" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <svg viewBox="0 0 500 400" className="w-full h-80 relative z-10">
            {/* Ceiling/Mount */}
            <rect x="200" y="30" width="100" height="20" rx="4" fill="#334155" stroke="#475569" strokeWidth="2" />
            <circle cx={pivotX} cy={pivotY} r="8" fill="#64748b" stroke="#94a3b8" strokeWidth="2" />

            {/* Trail */}
            {showTrail && trail.length > 1 && (
              <path
                d={`M ${trail.map(p => `${p.x},${p.y}`).join(' L ')}`}
                fill="none"
                stroke="url(#trailGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.6"
              />
            )}
            <defs>
              <linearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="1" />
              </linearGradient>
              <radialGradient id="bobGradient" cx="30%" cy="30%">
                <stop offset="0%" stopColor="#fcd34d" />
                <stop offset="100%" stopColor="#d97706" />
              </radialGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Pendulum Rod */}
            <line
              x1={pivotX}
              y1={pivotY}
              x2={bobX}
              y2={bobY}
              stroke="#78716c"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Velocity Vector */}
            {showVectors && Math.abs(state.angularVelocity) > 0.01 && (
              <g>
                <line
                  x1={bobX}
                  y1={bobY}
                  x2={bobX + state.angularVelocity * length * Math.cos(state.angle) * 0.3}
                  y2={bobY - state.angularVelocity * length * Math.sin(state.angle) * 0.3}
                  stroke="#10b981"
                  strokeWidth="3"
                  markerEnd="url(#arrowGreen)"
                />
                <defs>
                  <marker id="arrowGreen" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L9,3 z" fill="#10b981" />
                  </marker>
                </defs>
              </g>
            )}

            {/* Gravity Vector */}
            {showVectors && (
              <g>
                <line
                  x1={bobX}
                  y1={bobY}
                  x2={bobX}
                  y2={bobY + 40}
                  stroke="#ef4444"
                  strokeWidth="3"
                  markerEnd="url(#arrowRed)"
                />
                <defs>
                  <marker id="arrowRed" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L9,3 z" fill="#ef4444" />
                  </marker>
                </defs>
              </g>
            )}

            {/* Pendulum Bob */}
            <circle
              cx={bobX}
              cy={bobY}
              r="20"
              fill="url(#bobGradient)"
              stroke="#fbbf24"
              strokeWidth="3"
              filter={isRunning ? "url(#glow)" : ""}
            />

            {/* Angle Arc */}
            <path
              d={`M ${pivotX} ${pivotY + 40} A 40 40 0 0 ${state.angle >= 0 ? 1 : 0} ${pivotX + 40 * Math.sin(state.angle)} ${pivotY + 40 * Math.cos(state.angle)}`}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2"
              strokeDasharray="4 2"
            />
            <text
              x={pivotX + 50 * Math.sin(state.angle / 2)}
              y={pivotY + 50 * Math.cos(state.angle / 2)}
              fill="#06b6d4"
              fontSize="12"
              textAnchor="middle"
            >
              {angleDeg.toFixed(1)}°
            </text>

            {/* Equilibrium line */}
            <line x1={pivotX} y1={pivotY} x2={pivotX} y2={pivotY + length + 30} stroke="#475569" strokeWidth="1" strokeDasharray="8 4" opacity="0.5" />
          </svg>
        </div>


        {/* Energy Bar */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">Energy Distribution</span>
            <span className="text-xs text-slate-400 font-mono">Total: {totalEnergy.toFixed(3)} J/kg</span>
          </div>
          <div className="h-6 rounded-full overflow-hidden bg-slate-800 flex">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400"
              animate={{ width: `${pePercent}%` }}
              transition={{ duration: 0.1 }}
            />
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
              animate={{ width: `${kePercent}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <span className="text-cyan-400">Potential: {pePercent.toFixed(0)}%</span>
            <span className="text-emerald-400">Kinetic: {kePercent.toFixed(0)}%</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-3 text-center">
            <Gauge size={16} className="mx-auto text-amber-500 mb-1" />
            <div className="text-xs text-slate-500 mb-1">Angle</div>
            <div className="text-xl font-mono font-bold text-amber-400">{angleDeg.toFixed(1)}°</div>
          </div>
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-3 text-center">
            <Wind size={16} className="mx-auto text-emerald-500 mb-1" />
            <div className="text-xs text-slate-500 mb-1">Velocity</div>
            <div className="text-xl font-mono font-bold text-emerald-400">{(state.angularVelocity * 180 / Math.PI).toFixed(1)}°/s</div>
          </div>
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Time</div>
            <div className="text-xl font-mono font-bold text-cyan-400">{state.time.toFixed(2)}s</div>
          </div>
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Oscillations</div>
            <div className="text-xl font-mono font-bold text-rose-400">{oscillations.toFixed(1)}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={isRunning ? stop : start}
            className={`flex-1 min-w-[120px] py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
              isRunning
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 hover:bg-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30'
            }`}
          >
            {isRunning ? <Pause size={18} /> : <Play size={18} />}
            {isRunning ? 'PAUSE' : 'START'}
          </button>
          <button
            onClick={reset}
            className="px-4 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(preset)}
              className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-xs text-slate-400 hover:text-amber-300 hover:border-amber-500/50 transition-all"
            >
              {preset.name}
            </button>
          ))}
        </div>


        {/* Settings Panel */}
        <details className="bg-slate-900/50 rounded-xl border border-slate-800">
          <summary className="px-4 py-3 cursor-pointer text-sm text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-2">
            <Settings size={16} />
            Parameters
          </summary>
          <div className="px-4 pb-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Initial Angle (°)</label>
                <input
                  type="range"
                  min="5"
                  max="170"
                  value={initialAngle}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setInitialAngle(val);
                    if (!isRunning) {
                      setState({ angle: val * Math.PI / 180, angularVelocity: 0, time: 0 });
                      setMaxAngleReached(val);
                    }
                  }}
                  className="w-full accent-amber-500"
                />
                <div className="text-xs text-amber-400 font-mono text-center">{initialAngle}°</div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Length (px)</label>
                <input
                  type="range"
                  min="100"
                  max="300"
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <div className="text-xs text-amber-400 font-mono text-center">{length}px ({(length/100).toFixed(1)}m)</div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Gravity (m/s²)</label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="0.1"
                  value={gravity}
                  onChange={(e) => setGravity(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
                <div className="text-xs text-cyan-400 font-mono text-center">{gravity.toFixed(1)} m/s²</div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Damping</label>
                <input
                  type="range"
                  min="0"
                  max="0.2"
                  step="0.005"
                  value={damping}
                  onChange={(e) => setDamping(Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
                <div className="text-xs text-rose-400 font-mono text-center">{damping.toFixed(3)}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTrail}
                  onChange={(e) => setShowTrail(e.target.checked)}
                  className="accent-amber-500"
                />
                Show Trail
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showVectors}
                  onChange={(e) => setShowVectors(e.target.checked)}
                  className="accent-emerald-500"
                />
                Show Vectors
              </label>
            </div>
          </div>
        </details>

        {/* Physics Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3">
            <div className="text-xs text-slate-500 mb-1">Period (small angle)</div>
            <div className="text-lg font-mono text-cyan-400">{period.toFixed(3)}s</div>
            <div className="text-[10px] text-slate-600">T = 2π√(L/g)</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3">
            <div className="text-xs text-slate-500 mb-1">Max Angle Reached</div>
            <div className="text-lg font-mono text-amber-400">{maxAngleReached.toFixed(1)}°</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3">
            <div className="text-xs text-slate-500 mb-1">Frequency</div>
            <div className="text-lg font-mono text-emerald-400">{(1/period).toFixed(3)} Hz</div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Space</kbd> Play/Pause
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">T</kbd> Toggle Trail
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">V</kbd> Toggle Vectors
          </span>
        </div>
      </div>


      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-amber-400 hover:text-amber-300 transition-colors">
          About the Simple Pendulum
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            A <span className="text-amber-300">simple gravity pendulum</span> is an idealized model consisting of a point mass 
            suspended from a massless, inextensible string, swinging under the influence of gravity.
          </p>
          <p>
            The motion is governed by the differential equation:
          </p>
          <div className="bg-slate-800/50 rounded-lg p-3 font-mono text-center text-cyan-300">
            θ''(t) = -(g/L) × sin(θ) - d × θ'
          </div>
          <p>
            where <span className="text-cyan-300">θ</span> is the angle from vertical, 
            <span className="text-cyan-300">g</span> is gravitational acceleration, 
            <span className="text-cyan-300">L</span> is the pendulum length, and 
            <span className="text-cyan-300">d</span> is the damping coefficient.
          </p>
          <p>
            This simulation uses <span className="text-emerald-300">Runge-Kutta 4th order integration</span> for 
            accurate physics, even at large angles where the small-angle approximation breaks down.
          </p>
          <p className="text-slate-500 italic">
            Watch the energy bar to see potential energy convert to kinetic energy and back as the pendulum swings!
          </p>
        </div>
      </details>
    </div>
  );
}
