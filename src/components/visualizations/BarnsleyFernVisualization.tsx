import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Leaf, Zap, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Barnsley Fern transformations
interface Transform {
  name: string;
  probability: number;
  color: string;
  // Coefficients: x' = ax + by + e, y' = cx + dy + f
  a: number; b: number; c: number; d: number; e: number; f: number;
}

const TRANSFORMS: Transform[] = [
  { name: 'Stem', probability: 0.01, color: '#854d0e', a: 0, b: 0, c: 0, d: 0.16, e: 0, f: 0 },
  { name: 'Leaflets', probability: 0.85, color: '#22c55e', a: 0.85, b: 0.04, c: -0.04, d: 0.85, e: 0, f: 1.6 },
  { name: 'Left Leaf', probability: 0.07, color: '#16a34a', a: 0.2, b: -0.26, c: 0.23, d: 0.22, e: 0, f: 1.6 },
  { name: 'Right Leaf', probability: 0.07, color: '#15803d', a: -0.15, b: 0.28, c: 0.26, d: 0.24, e: 0, f: 0.44 },
];

// Color presets
const COLOR_PRESETS = [
  { name: 'Classic Green', colors: ['#166534', '#22c55e', '#4ade80', '#86efac'] },
  { name: 'Autumn', colors: ['#92400e', '#f59e0b', '#fbbf24', '#fcd34d'] },
  { name: 'Ocean', colors: ['#0e7490', '#06b6d4', '#22d3ee', '#67e8f9'] },
  { name: 'Sunset', colors: ['#be123c', '#f43f5e', '#fb7185', '#fda4af'] },
];

export default function BarnsleyFernVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const pointsRef = useRef<{ x: number; y: number; transform: number }[]>([]);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [pointCount, setPointCount] = useState(0);
  const [maxPoints, setMaxPoints] = useState(50000);
  const [speed, setSpeed] = useState(500); // points per frame
  const [colorPreset, setColorPreset] = useState(0);
  const [showStats, setShowStats] = useState(true);
  const [transformCounts, setTransformCounts] = useState([0, 0, 0, 0]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentX = useRef(0);
  const currentY = useRef(0);

  // --- Audio ---
  const playSound = useCallback((type: 'grow' | 'complete' | 'reset') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'grow') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      const freq = 200 + (pointCount / maxPoints) * 400;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
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
        osc.stop(now + 0.35 + i * 0.1);
      });
    } else if (type === 'reset') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  }, [soundEnabled, pointCount, maxPoints]);


  // Select transform based on probability
  const selectTransform = useCallback((): number => {
    const r = Math.random();
    let cumulative = 0;
    for (let i = 0; i < TRANSFORMS.length; i++) {
      cumulative += TRANSFORMS[i].probability;
      if (r < cumulative) return i;
    }
    return 1; // Default to main leaflet
  }, []);

  // Apply transformation
  const applyTransform = useCallback((x: number, y: number, idx: number): { x: number; y: number } => {
    const t = TRANSFORMS[idx];
    return {
      x: t.a * x + t.b * y + t.e,
      y: t.c * x + t.d * y + t.f,
    };
  }, []);

  // Draw point on canvas
  const drawPoint = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, _transformIdx: number) => {
    const canvas = ctx.canvas;
    const colors = COLOR_PRESETS[colorPreset].colors;
    
    // Map fern coordinates to canvas
    // Fern x: roughly -2.5 to 2.5, y: 0 to 10
    const scale = canvas.height / 11;
    const canvasX = canvas.width / 2 + x * scale;
    const canvasY = canvas.height - y * scale - 10;
    
    // Color based on height (y value) for gradient effect
    // _transformIdx available for future transform-based coloring
    const colorIdx = Math.min(Math.floor((y / 10) * colors.length), colors.length - 1);
    ctx.fillStyle = colors[colorIdx];
    
    ctx.fillRect(canvasX, canvasY, 1.5, 1.5);
  }, [colorPreset]);

  // Generate points
  const generatePoints = useCallback((count: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newCounts = [...transformCounts];
    
    for (let i = 0; i < count && pointsRef.current.length < maxPoints; i++) {
      const transformIdx = selectTransform();
      const newPoint = applyTransform(currentX.current, currentY.current, transformIdx);
      
      currentX.current = newPoint.x;
      currentY.current = newPoint.y;
      
      pointsRef.current.push({ x: newPoint.x, y: newPoint.y, transform: transformIdx });
      newCounts[transformIdx]++;
      
      drawPoint(ctx, newPoint.x, newPoint.y, transformIdx);
    }
    
    setTransformCounts(newCounts);
    setPointCount(pointsRef.current.length);
  }, [selectTransform, applyTransform, drawPoint, maxPoints, transformCounts]);

  // Animation loop
  useEffect(() => {
    if (isPlaying && pointCount < maxPoints) {
      const animate = () => {
        generatePoints(speed);
        
        if (pointsRef.current.length < maxPoints) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setIsPlaying(false);
          playSound('complete');
        }
      };
      
      animationRef.current = requestAnimationFrame(animate);
      
      // Play grow sound periodically
      const soundInterval = setInterval(() => {
        if (pointsRef.current.length < maxPoints) {
          playSound('grow');
        }
      }, 200);
      
      return () => {
        cancelAnimationFrame(animationRef.current);
        clearInterval(soundInterval);
      };
    }
  }, [isPlaying, pointCount, maxPoints, speed, generatePoints, playSound]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = 500;
    canvas.height = 600;
    
    // Clear with dark background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Redraw when color changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Redraw all points
    pointsRef.current.forEach(point => {
      drawPoint(ctx, point.x, point.y, point.transform);
    });
  }, [colorPreset, drawPoint]);

  const reset = useCallback(() => {
    cancelAnimationFrame(animationRef.current);
    setIsPlaying(false);
    setPointCount(0);
    setTransformCounts([0, 0, 0, 0]);
    pointsRef.current = [];
    currentX.current = 0;
    currentY.current = 0;
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
    playSound('reset');
  }, [playSound]);

  const togglePlay = () => {
    if (pointCount >= maxPoints) {
      reset();
      setTimeout(() => setIsPlaying(true), 100);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  // Download canvas as image
  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'barnsley-fern.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ') { e.preventDefault(); togglePlay(); }
      if (e.key === 'r' || e.key === 'R') reset();
      if (e.key === 's' || e.key === 'S') downloadImage();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [togglePlay, reset]);

  const progress = (pointCount / maxPoints) * 100;

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-green-950/10 to-slate-950 rounded-xl border border-green-900/30 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-green-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
              <Leaf className="text-green-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-green-300 tracking-wide">FRACTAL GARDEN</h2>
              <p className="text-xs text-green-500/70">Barnsley Fern Generator</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled 
                  ? 'bg-green-500/20 border-green-500/50 text-green-300' 
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button
              onClick={downloadImage}
              className="p-2 rounded-lg border bg-slate-800 border-slate-700 text-slate-400 hover:text-green-300 hover:border-green-500/50 transition-all"
              title="Download Image"
            >
              <Download size={16} />
            </button>
          </div>
        </div>
      </div>


      {/* Main Content */}
      <div className="p-6 space-y-6">
        
        {/* Controls */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={togglePlay}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${
                isPlaying
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30'
                  : 'bg-green-500/20 text-green-300 border border-green-500/50 hover:bg-green-500/30'
              }`}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              {pointCount >= maxPoints ? 'REGROW' : isPlaying ? 'PAUSE' : 'GROW'}
            </button>
            
            <button
              onClick={reset}
              className="px-4 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
            >
              <RotateCcw size={18} />
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <Zap size={14} className="text-slate-500" />
              <span className="text-xs text-slate-500">Speed:</span>
              <input
                type="range"
                min={100}
                max={2000}
                step={100}
                value={speed}
                onChange={(e) => setSpeed(parseInt(e.target.value))}
                className="w-24 accent-green-500"
              />
              <span className="text-xs text-slate-400 w-16">{speed}/frame</span>
            </div>
          </div>

          {/* Settings Row */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Points:</span>
              <select
                value={maxPoints}
                onChange={(e) => { setMaxPoints(parseInt(e.target.value)); reset(); }}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-green-300 focus:outline-none focus:border-green-500"
              >
                <option value={10000}>10,000</option>
                <option value={25000}>25,000</option>
                <option value={50000}>50,000</option>
                <option value={100000}>100,000</option>
                <option value={200000}>200,000</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Color:</span>
              <div className="flex gap-1">
                {COLOR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => setColorPreset(idx)}
                    className={`w-6 h-6 rounded border-2 transition-all ${
                      colorPreset === idx ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ background: `linear-gradient(135deg, ${preset.colors[0]}, ${preset.colors[2]})` }}
                    title={preset.name}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowStats(!showStats)}
              className={`ml-auto px-3 py-1.5 text-xs rounded-lg border transition-all ${
                showStats
                  ? 'bg-green-500/20 border-green-500/50 text-green-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              Stats
            </button>
          </div>
        </div>

        {/* Canvas and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-4">
          
          {/* Canvas Container */}
          <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4 relative overflow-hidden">
            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800">
              <motion.div
                className="h-full bg-gradient-to-r from-green-600 to-green-400"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>

            <div className="flex justify-center pt-2">
              <canvas
                ref={canvasRef}
                className="rounded-lg shadow-2xl shadow-green-900/20"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>

            {/* Point counter overlay */}
            <div className="absolute bottom-6 left-6 px-3 py-1.5 bg-slate-900/80 backdrop-blur-sm rounded-lg border border-slate-700/50">
              <span className="text-xs text-slate-400">Points: </span>
              <span className="text-sm font-mono text-green-400">{pointCount.toLocaleString()}</span>
              <span className="text-xs text-slate-500"> / {maxPoints.toLocaleString()}</span>
            </div>
          </div>

          {/* Stats Panel */}
          <AnimatePresence>
            {showStats && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-slate-900/30 rounded-xl border border-slate-800 p-4 space-y-4"
              >
                <h3 className="text-sm font-bold text-green-400">Transform Stats</h3>
                
                {TRANSFORMS.map((t, idx) => {
                  const count = transformCounts[idx];
                  const percent = pointCount > 0 ? (count / pointCount) * 100 : 0;
                  const expected = t.probability * 100;
                  
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">{t.name}</span>
                        <span className="text-slate-500">
                          {percent.toFixed(1)}% <span className="text-slate-600">(exp: {expected}%)</span>
                        </span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: t.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(percent / expected * 50, 100)}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-600 font-mono">
                        {count.toLocaleString()} points
                      </div>
                    </div>
                  );
                })}

                {/* Formula display */}
                <div className="pt-4 border-t border-slate-800">
                  <h4 className="text-xs text-slate-500 mb-2">Current Transform</h4>
                  <div className="text-[10px] font-mono text-slate-400 space-y-1 bg-slate-800/50 rounded p-2">
                    <div>x' = ax + by + e</div>
                    <div>y' = cx + dy + f</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
            <kbd className="text-slate-400">S</kbd> Save Image
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-green-400 hover:text-green-300 transition-colors">
          How does the Barnsley Fern work?
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            The <span className="text-green-300">Barnsley fern</span> is created using an 
            <span className="text-amber-300"> Iterated Function System (IFS)</span> — a method 
            of constructing fractals through repeated application of transformations.
          </p>
          <p>
            Four affine transformations are applied with different probabilities:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><span className="text-amber-400">f1 (1%)</span>: Maps to the stem</li>
            <li><span className="text-green-400">f2 (85%)</span>: Creates successively smaller leaflets</li>
            <li><span className="text-emerald-400">f3 (7%)</span>: Largest left-hand leaflet</li>
            <li><span className="text-teal-400">f4 (7%)</span>: Largest right-hand leaflet</li>
          </ul>
          <p className="mt-2">
            Named after mathematician <span className="text-cyan-300">Michael Barnsley</span>, 
            who described it in his book "Fractals Everywhere" (1988).
          </p>
        </div>
      </details>
    </div>
  );
}
