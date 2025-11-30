import { useState, useEffect, useRef, useCallback } from 'react';
import { Compass, Navigation, RotateCcw, Play, Anchor, Ship } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Logic ---

const normalizeAngle = (angle: number): number => {
  // Normalize to -180 to +180 range
  let result = angle % 360;
  if (result > 180) result -= 360;
  if (result < -180) result += 360;
  return result;
};

const calculateAngleDifference = (b1: number, b2: number): number => {
  return normalizeAngle(b2 - b1);
};

// Test cases from Rosetta Code
const TEST_CASES: [number, number][] = [
  [20, 45],
  [-45, 45],
  [-85, 90],
  [-95, 90],
  [-45, 125],
  [-45, 145],
  [29.4803, -88.6381],
  [-78.3251, -159.036],
];

interface CompassReading {
  b1: number;
  b2: number;
  difference: number;
}

// --- Component ---

export default function AngleDifferenceVisualization() {
  const [bearing1, setBearing1] = useState(20);
  const [bearing2, setBearing2] = useState(45);
  const [isAnimating, setIsAnimating] = useState(false);
  const [history, setHistory] = useState<CompassReading[]>([]);
  const [soundEnabled] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number>(0);

  const difference = calculateAngleDifference(bearing1, bearing2);

  // --- Audio ---
  useEffect(() => {
    if (soundEnabled && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, [soundEnabled]);

  const playSound = useCallback((type: 'tick' | 'calculate' | 'click') => {
    if (!soundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'tick') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.start(now);
      osc.stop(now + 0.03);
    } else if (type === 'calculate') {
      // Ship bell sound
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.3);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'click') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  }, [soundEnabled]);

  // --- Animation ---
  const animateToTestCase = (b1: number, b2: number) => {
    setIsAnimating(true);
    const startB1 = bearing1;
    const startB2 = bearing2;
    const duration = 1000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic

      setBearing1(startB1 + (b1 - startB1) * eased);
      setBearing2(startB2 + (b2 - startB2) * eased);

      if (progress < 1) {
        if (Math.random() > 0.7) playSound('tick');
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setBearing1(b1);
        setBearing2(b2);
        setIsAnimating(false);
        playSound('calculate');
        
        // Add to history
        setHistory(prev => [{
          b1, b2, difference: calculateAngleDifference(b1, b2)
        }, ...prev].slice(0, 8));
      }
    };

    animate();
  };

  const handleCalculate = () => {
    playSound('calculate');
    setHistory(prev => [{
      b1: bearing1, b2: bearing2, difference
    }, ...prev].slice(0, 8));
  };

  const reset = () => {
    cancelAnimationFrame(animationRef.current);
    setBearing1(0);
    setBearing2(0);
    setIsAnimating(false);
    setHistory([]);
  };

  useEffect(() => {
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  // Direction label
  const getDirectionLabel = (angle: number): string => {
    const normalized = ((angle % 360) + 360) % 360;
    if (normalized >= 337.5 || normalized < 22.5) return 'N';
    if (normalized >= 22.5 && normalized < 67.5) return 'NE';
    if (normalized >= 67.5 && normalized < 112.5) return 'E';
    if (normalized >= 112.5 && normalized < 157.5) return 'SE';
    if (normalized >= 157.5 && normalized < 202.5) return 'S';
    if (normalized >= 202.5 && normalized < 247.5) return 'SW';
    if (normalized >= 247.5 && normalized < 292.5) return 'W';
    return 'NW';
  };

  return (
    <div className="w-full min-h-[700px] bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 rounded-xl border border-blue-900/30 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-blue-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <Navigation className="text-blue-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-blue-300 tracking-wide">MARITIME BEARING CALCULATOR</h2>
              <p className="text-xs text-blue-500/70">Navigation Angle Difference Computer</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-blue-400/50">
            <Anchor size={14} />
            <span>Range: -180° to +180°</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Compass Display */}
        <div className="flex flex-col items-center">
          <div className="relative w-80 h-80">
            {/* Compass Rose Background */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-4 border-amber-900/50 shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]">
              {/* Degree markings */}
              {[...Array(36)].map((_, i) => {
                const angle = i * 10;
                const isCardinal = angle % 90 === 0;
                const isIntercardinal = angle % 45 === 0 && !isCardinal;
                return (
                  <div
                    key={i}
                    className="absolute left-1/2 top-0 origin-bottom"
                    style={{
                      height: '50%',
                      transform: `translateX(-50%) rotate(${angle}deg)`,
                    }}
                  >
                    <div className={`
                      w-px mx-auto
                      ${isCardinal ? 'h-4 bg-amber-400' : isIntercardinal ? 'h-3 bg-amber-600' : 'h-2 bg-slate-600'}
                    `} />
                  </div>
                );
              })}
              
              {/* Cardinal directions */}
              {['N', 'E', 'S', 'W'].map((dir, i) => (
                <div
                  key={dir}
                  className="absolute text-amber-400 font-bold text-lg"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(-50%, -50%) rotate(${i * 90}deg) translateY(-110px) rotate(-${i * 90}deg)`,
                  }}
                >
                  {dir}
                </div>
              ))}

              {/* Center decoration */}
              <div className="absolute inset-[35%] rounded-full bg-gradient-to-br from-amber-900/30 to-slate-900 border border-amber-800/30" />
            </div>

            {/* Bearing 1 Needle (Blue) */}
            <motion.div
              className="absolute left-1/2 top-1/2 w-1 origin-bottom"
              style={{ height: '35%', marginLeft: '-2px', marginTop: '-35%' }}
              animate={{ rotate: bearing1 }}
              transition={{ type: 'spring', stiffness: 50, damping: 15 }}
            >
              <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[100px] border-l-transparent border-r-transparent border-b-cyan-500 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-cyan-500 border-2 border-cyan-300" />
            </motion.div>

            {/* Bearing 2 Needle (Orange) */}
            <motion.div
              className="absolute left-1/2 top-1/2 w-1 origin-bottom"
              style={{ height: '30%', marginLeft: '-2px', marginTop: '-30%' }}
              animate={{ rotate: bearing2 }}
              transition={{ type: 'spring', stiffness: 50, damping: 15 }}
            >
              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[80px] border-l-transparent border-r-transparent border-b-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-orange-500 border-2 border-orange-300" />
            </motion.div>

            {/* Arc showing difference */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
              </defs>
              <motion.path
                d={(() => {
                  const cx = 160, cy = 160, r = 100;
                  const startAngle = (bearing1 - 90) * Math.PI / 180;
                  const endAngle = (bearing2 - 90) * Math.PI / 180;
                  const largeArc = Math.abs(difference) > 180 ? 1 : 0;
                  const sweep = difference >= 0 ? 1 : 0;
                  const x1 = cx + r * Math.cos(startAngle);
                  const y1 = cy + r * Math.sin(startAngle);
                  const x2 = cx + r * Math.cos(endAngle);
                  const y2 = cy + r * Math.sin(endAngle);
                  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} ${sweep} ${x2} ${y2}`;
                })()}
                fill="none"
                stroke="url(#arcGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5 }}
              />
            </svg>

            {/* Center display */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-slate-900/90 rounded-full w-20 h-20 flex flex-col items-center justify-center border border-amber-800/50">
                <span className="text-2xl font-bold text-white">{difference.toFixed(1)}°</span>
                <span className="text-xs text-slate-400">diff</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-500" />
              <span className="text-cyan-400">B1: {bearing1.toFixed(1)}° ({getDirectionLabel(bearing1)})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-orange-400">B2: {bearing2.toFixed(1)}° ({getDirectionLabel(bearing2)})</span>
            </div>
          </div>
        </div>

        {/* Controls Panel */}
        <div className="space-y-4">
          {/* Input Controls */}
          <div className="bg-slate-900/50 rounded-xl border border-blue-800/30 p-4">
            <h3 className="text-sm font-bold text-blue-300 mb-4 flex items-center gap-2">
              <Compass size={16} />
              BEARING INPUTS
            </h3>

            <div className="space-y-4">
              {/* Bearing 1 */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-cyan-400">Bearing 1 (B1)</span>
                  <span className="text-cyan-300 font-mono">{bearing1.toFixed(1)}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="0.1"
                  value={bearing1}
                  onChange={(e) => { setBearing1(parseFloat(e.target.value)); playSound('tick'); }}
                  disabled={isAnimating}
                  className="w-full accent-cyan-500"
                />
              </div>

              {/* Bearing 2 */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-orange-400">Bearing 2 (B2)</span>
                  <span className="text-orange-300 font-mono">{bearing2.toFixed(1)}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="0.1"
                  value={bearing2}
                  onChange={(e) => { setBearing2(parseFloat(e.target.value)); playSound('tick'); }}
                  disabled={isAnimating}
                  className="w-full accent-orange-500"
                />
              </div>

              {/* Result */}
              <div className="bg-blue-950/50 rounded-lg p-3 border border-blue-800/30">
                <div className="text-xs text-blue-400 mb-1">Angle Difference (B2 - B1)</div>
                <div className="text-3xl font-bold text-white font-mono">
                  {difference >= 0 ? '+' : ''}{difference.toFixed(4)}°
                </div>
                <div className="text-xs text-blue-500 mt-1">
                  Turn {difference >= 0 ? 'RIGHT (clockwise)' : 'LEFT (counter-clockwise)'}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleCalculate}
                disabled={isAnimating}
                className="flex-1 py-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/50 hover:bg-blue-500/30 transition-all flex items-center justify-center gap-2 font-bold disabled:opacity-50"
              >
                <Play size={16} />
                LOG READING
              </button>
              <button
                onClick={reset}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>

          {/* Test Cases */}
          <div className="bg-slate-900/50 rounded-xl border border-blue-800/30 p-4">
            <h3 className="text-sm font-bold text-blue-300 mb-3 flex items-center gap-2">
              <Ship size={16} />
              PRESET COURSES
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {TEST_CASES.map(([b1, b2], idx) => (
                <button
                  key={idx}
                  onClick={() => animateToTestCase(b1, b2)}
                  disabled={isAnimating}
                  className="px-3 py-2 rounded-lg bg-blue-950/50 border border-blue-800/30 hover:border-blue-600/50 hover:bg-blue-900/30 transition-all text-xs text-left disabled:opacity-50"
                >
                  <span className="text-cyan-400">{b1}°</span>
                  <span className="text-slate-500 mx-1">→</span>
                  <span className="text-orange-400">{b2}°</span>
                </button>
              ))}
            </div>
          </div>

          {/* History */}
          <div className="bg-slate-900/50 rounded-xl border border-blue-800/30 p-4">
            <h3 className="text-sm font-bold text-blue-300 mb-3">NAVIGATION LOG</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
              <AnimatePresence>
                {history.map((reading, idx) => (
                  <motion.div
                    key={`${reading.b1}-${reading.b2}-${idx}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex justify-between items-center bg-blue-950/30 rounded px-3 py-2 text-xs"
                  >
                    <div>
                      <span className="text-cyan-400">{reading.b1.toFixed(1)}°</span>
                      <span className="text-slate-500 mx-1">→</span>
                      <span className="text-orange-400">{reading.b2.toFixed(1)}°</span>
                    </div>
                    <span className="text-white font-mono font-bold">
                      {reading.difference >= 0 ? '+' : ''}{reading.difference.toFixed(2)}°
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {history.length === 0 && (
                <div className="text-center py-4 text-blue-500/50 text-xs">
                  No readings logged yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-blue-800/30">
        <summary className="px-4 py-3 cursor-pointer text-sm text-blue-400 hover:text-blue-300 transition-colors">
          How does bearing difference work?
        </summary>
        <div className="px-4 pb-4 text-xs text-blue-500 space-y-2">
          <p>
            A <span className="text-blue-300">bearing</span> is a direction measured in degrees from North (0°), 
            going clockwise. East is 90°, South is 180°, West is 270° (or -90°).
          </p>
          <p>
            The <span className="text-blue-300">angle difference</span> tells you how much to turn from one 
            bearing to another. A positive result means turn right (clockwise), negative means turn left.
          </p>
          <p>
            The result is always normalized to the range <span className="text-amber-400">-180° to +180°</span> to 
            give the shortest turn direction.
          </p>
        </div>
      </details>
    </div>
  );
}
