import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, ZoomIn, ZoomOut, Eye, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Generate sums of two squares up to maxVal
const generateSumsOfSquares = (maxVal: number): number[] => {
  const sums = new Set<number>();
  sums.add(0);
  for (let a = 0; a * a <= maxVal; a++) {
    for (let b = a; a * a + b * b <= maxVal; b++) {
      sums.add(a * a + b * b);
    }
  }
  return Array.from(sums).sort((a, b) => a - b);
};

// Find all integer points at distance sqrt(d2) from origin
const pointsAtDistance = (d2: number): Array<[number, number]> => {
  const points: Array<[number, number]> = [];
  const maxCoord = Math.ceil(Math.sqrt(d2));
  for (let x = -maxCoord; x <= maxCoord; x++) {
    for (let y = -maxCoord; y <= maxCoord; y++) {
      if (x * x + y * y === d2) {
        points.push([x, y]);
      }
    }
  }
  return points;
};

// Calculate angle of vector (in radians, 0 = up, clockwise positive)
const vectorAngle = (dx: number, dy: number): number => {
  return Math.atan2(dx, -dy); // Adjusted so 0 is up
};

// Normalize angle to [0, 2π)
const normalizeAngle = (angle: number): number => {
  while (angle < 0) angle += 2 * Math.PI;
  while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
  return angle;
};

// Generate Babylonian spiral points
const generateSpiral = (numPoints: number): Array<{ x: number; y: number; d2: number }> => {
  const maxD2 = numPoints * numPoints * 4;
  const validD2 = generateSumsOfSquares(maxD2);
  
  const points: Array<{ x: number; y: number; d2: number }> = [{ x: 0, y: 0, d2: 0 }];
  let currentX = 0, currentY = 0;
  let prevAngle = 0; // Start pointing up
  let prevD2 = 0;
  
  for (let i = 1; i < numPoints; i++) {
    let bestPoint: [number, number] | null = null;
    let bestD2 = -1;
    let bestAngleDiff = Infinity;
    
    // Find next valid d2 (must be > prevD2)
    for (const d2 of validD2) {
      if (d2 <= prevD2) continue;
      
      const candidates = pointsAtDistance(d2);
      for (const [dx, dy] of candidates) {
        const newX = currentX + dx;
        const newY = currentY + dy;
        
        // Check if this point already exists
        if (points.some(p => p.x === newX && p.y === newY)) continue;
        
        const angle = vectorAngle(dx, dy);
        // Clockwise turn from previous angle
        let angleDiff = normalizeAngle(angle - prevAngle);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
        
        if (bestD2 === -1 || d2 < bestD2 || (d2 === bestD2 && angleDiff < bestAngleDiff)) {
          bestD2 = d2;
          bestPoint = [newX, newY];
          bestAngleDiff = angleDiff;
        }
      }
      
      if (bestPoint) break; // Found valid point at this distance
    }
    
    if (!bestPoint) break;
    
    const [dx, dy] = [bestPoint[0] - currentX, bestPoint[1] - currentY];
    prevAngle = vectorAngle(dx, dy);
    prevD2 = bestD2;
    currentX = bestPoint[0];
    currentY = bestPoint[1];
    points.push({ x: currentX, y: currentY, d2: bestD2 });
  }
  
  return points;
};

// Pre-generate spiral
const SPIRAL_POINTS = generateSpiral(200);

export default function BabylonianSpiralVisualization() {
  const [visiblePoints, setVisiblePoints] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [showStars, setShowStars] = useState(true);
  const [showCoords, setShowCoords] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);
  const starsRef = useRef<Array<{ x: number; y: number; size: number; twinkle: number }>>([]);


  // Generate stars once
  useEffect(() => {
    if (starsRef.current.length === 0) {
      starsRef.current = Array.from({ length: 150 }, () => ({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 2 + 0.5,
        twinkle: Math.random() * Math.PI * 2,
      }));
    }
  }, []);

  // Audio
  const playSound = useCallback((type: 'point' | 'complete' | 'select' | 'whoosh') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'point') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      // Pitch based on point index for musical progression
      const baseFreq = 220 + (visiblePoints % 12) * 30;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.1);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'complete') {
      // Ethereal completion sound
      [261, 329, 392, 523, 659].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.06, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8 + i * 0.1);
        osc.start(now + i * 0.1);
        osc.stop(now + 1 + i * 0.1);
      });
    } else if (type === 'select') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'whoosh') {
      // Whoosh for zoom/pan
      const bufferSize = ctx.sampleRate * 0.15;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1000, now);
      const gain = ctx.createGain();
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.03, now);
      noise.start(now);
      noise.stop(now + 0.15);
    }
  }, [soundEnabled, visiblePoints]);

  // Animation loop
  useEffect(() => {
    if (isPlaying) {
      const delay = Math.max(30, 300 - speed * 3);
      intervalRef.current = window.setInterval(() => {
        setVisiblePoints(prev => {
          if (prev >= SPIRAL_POINTS.length) {
            setIsPlaying(false);
            playSound('complete');
            return prev;
          }
          playSound('point');
          return prev + 1;
        });
      }, delay);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [isPlaying, speed, playSound]);

  // Calculate bounds for auto-fit
  const bounds = useMemo(() => {
    const pts = SPIRAL_POINTS.slice(0, visiblePoints);
    if (pts.length === 0) return { minX: -10, maxX: 10, minY: -10, maxY: 10 };
    const xs = pts.map(p => p.x);
    const ys = pts.map(p => p.y);
    const padding = 5;
    return {
      minX: Math.min(...xs) - padding,
      maxX: Math.max(...xs) + padding,
      minY: Math.min(...ys) - padding,
      maxY: Math.max(...ys) + padding,
    };
  }, [visiblePoints]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2 + panOffset.x;
    const centerY = height / 2 + panOffset.y;

    // Calculate scale to fit
    const rangeX = bounds.maxX - bounds.minX;
    const rangeY = bounds.maxY - bounds.minY;
    const baseScale = Math.min(width / rangeX, height / rangeY) * 0.8;
    const scale = baseScale * zoom;

    // Clear with gradient background
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f0f23');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw stars
    if (showStars) {
      const time = Date.now() / 1000;
      starsRef.current.forEach(star => {
        const twinkle = 0.5 + 0.5 * Math.sin(time * 2 + star.twinkle);
        ctx.fillStyle = `rgba(255, 248, 220, ${0.3 + twinkle * 0.7})`;
        ctx.beginPath();
        ctx.arc(star.x * width, star.y * height, star.size * twinkle, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Draw grid (subtle)
    ctx.strokeStyle = 'rgba(100, 149, 237, 0.1)';
    ctx.lineWidth = 1;
    const gridStep = Math.max(1, Math.floor(50 / scale));
    for (let x = Math.floor(bounds.minX / gridStep) * gridStep; x <= bounds.maxX; x += gridStep) {
      const screenX = centerX + x * scale;
      ctx.beginPath();
      ctx.moveTo(screenX, 0);
      ctx.lineTo(screenX, height);
      ctx.stroke();
    }
    for (let y = Math.floor(bounds.minY / gridStep) * gridStep; y <= bounds.maxY; y += gridStep) {
      const screenY = centerY - y * scale;
      ctx.beginPath();
      ctx.moveTo(0, screenY);
      ctx.lineTo(width, screenY);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = 'rgba(100, 149, 237, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    const pts = SPIRAL_POINTS.slice(0, visiblePoints);
    if (pts.length < 2) return;

    // Draw spiral path with gradient
    ctx.beginPath();
    ctx.moveTo(centerX + pts[0].x * scale, centerY - pts[0].y * scale);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(centerX + pts[i].x * scale, centerY - pts[i].y * scale);
    }
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw points
    pts.forEach((pt, i) => {
      const screenX = centerX + pt.x * scale;
      const screenY = centerY - pt.y * scale;
      const isSelected = selectedPoint === i;
      const isLast = i === pts.length - 1;

      // Glow effect for recent/selected points
      if (isLast || isSelected) {
        const glowGradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, 20);
        glowGradient.addColorStop(0, isSelected ? 'rgba(0, 255, 200, 0.5)' : 'rgba(255, 215, 0, 0.5)');
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(screenX, screenY, 20, 0, Math.PI * 2);
        ctx.fill();
      }

      // Point
      const radius = isSelected ? 8 : isLast ? 6 : 4;
      ctx.beginPath();
      ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
      
      // Color based on position in sequence
      const hue = (i / pts.length) * 60 + 30; // Gold to orange
      ctx.fillStyle = isSelected ? '#00ffc8' : `hsl(${hue}, 80%, 60%)`;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Index label for first few and selected
      if ((i < 5 || isSelected || isLast) && showCoords) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${i}`, screenX, screenY - 12);
      }
    });

    // Origin marker
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

  }, [visiblePoints, zoom, panOffset, showStars, showCoords, selectedPoint, bounds]);

  // Mouse handlers for canvas interaction
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setPanOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = canvas.width / 2 + panOffset.x;
    const centerY = canvas.height / 2 + panOffset.y;
    const rangeX = bounds.maxX - bounds.minX;
    const rangeY = bounds.maxY - bounds.minY;
    const baseScale = Math.min(canvas.width / rangeX, canvas.height / rangeY) * 0.8;
    const scale = baseScale * zoom;

    // Find clicked point
    const pts = SPIRAL_POINTS.slice(0, visiblePoints);
    for (let i = pts.length - 1; i >= 0; i--) {
      const screenX = centerX + pts[i].x * scale;
      const screenY = centerY - pts[i].y * scale;
      const dist = Math.sqrt((x - screenX) ** 2 + (y - screenY) ** 2);
      if (dist < 15) {
        setSelectedPoint(selectedPoint === i ? null : i);
        playSound('select');
        return;
      }
    }
    setSelectedPoint(null);
  };

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(false);
    setVisiblePoints(1);
    setSelectedPoint(null);
    setPanOffset({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleZoom = (delta: number) => {
    setZoom(z => Math.max(0.2, Math.min(5, z + delta)));
    playSound('whoosh');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ') { e.preventDefault(); setIsPlaying(p => !p); }
      if (e.key === 'r' || e.key === 'R') reset();
      if (e.key === '+' || e.key === '=') handleZoom(0.2);
      if (e.key === '-') handleZoom(-0.2);
      if (e.key === 'ArrowRight') setVisiblePoints(v => Math.min(SPIRAL_POINTS.length, v + 1));
      if (e.key === 'ArrowLeft') setVisiblePoints(v => Math.max(1, v - 1));
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const currentPoint = selectedPoint !== null ? SPIRAL_POINTS[selectedPoint] : SPIRAL_POINTS[visiblePoints - 1];


  return (
    <div className="w-full bg-gradient-to-b from-[#0f0f23] via-[#1a1a2e] to-[#0f0f23] rounded-xl border border-amber-700/30 font-sans overflow-hidden">
      
      {/* Header - Ancient Babylonian Style */}
      <div className="bg-gradient-to-r from-amber-900/40 via-amber-800/30 to-amber-900/40 border-b border-amber-600/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <Sparkles className="text-amber-400" size={24} />
              <motion.div
                className="absolute inset-0 rounded-lg border border-amber-400/50"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-amber-300 tracking-wider">BABYLONIAN SPIRAL</h2>
              <p className="text-xs text-amber-500/70">Ancient Mathematical Journey Through the Stars</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowStars(!showStars); playSound('whoosh'); }}
              className={`p-2 rounded-lg border transition-all ${
                showStars 
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' 
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
              title="Toggle stars"
            >
              <Sparkles size={16} />
            </button>
            <button
              onClick={() => setShowCoords(!showCoords)}
              className={`p-2 rounded-lg border transition-all ${
                showCoords 
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' 
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
              title="Toggle coordinates"
            >
              <Eye size={16} />
            </button>
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

      {/* Main Canvas Area */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="w-full cursor-grab active:cursor-grabbing"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onClick={handleCanvasClick}
        />

        {/* Zoom Controls - Floating */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button
            onClick={() => handleZoom(0.3)}
            className="p-2 rounded-lg bg-slate-900/80 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all backdrop-blur-sm"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={() => handleZoom(-0.3)}
            className="p-2 rounded-lg bg-slate-900/80 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all backdrop-blur-sm"
          >
            <ZoomOut size={18} />
          </button>
          <div className="text-center text-xs text-amber-400/70 bg-slate-900/80 rounded px-2 py-1 backdrop-blur-sm">
            {Math.round(zoom * 100)}%
          </div>
        </div>

        {/* Point Counter - Floating */}
        <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-sm rounded-lg border border-amber-500/30 px-4 py-2">
          <div className="text-xs text-amber-500/70">Points Revealed</div>
          <div className="text-2xl font-bold text-amber-300 font-mono">
            {visiblePoints} <span className="text-sm text-amber-500/50">/ {SPIRAL_POINTS.length}</span>
          </div>
        </div>

        {/* Selected Point Info - Floating */}
        <AnimatePresence>
          {currentPoint && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-sm rounded-lg border border-cyan-500/30 px-4 py-3"
            >
              <div className="text-xs text-cyan-400 mb-1">
                {selectedPoint !== null ? `Point #${selectedPoint}` : `Latest Point #${visiblePoints - 1}`}
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">x:</span>
                  <span className="text-amber-300 font-mono ml-1">{currentPoint.x}</span>
                </div>
                <div>
                  <span className="text-slate-500">y:</span>
                  <span className="text-amber-300 font-mono ml-1">{currentPoint.y}</span>
                </div>
                <div>
                  <span className="text-slate-500">d²:</span>
                  <span className="text-cyan-300 font-mono ml-1">{currentPoint.d2}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="p-6 space-y-4 border-t border-amber-800/30">
        {/* Playback Controls */}
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all border-2 ${
              isPlaying
                ? 'bg-red-500/20 text-red-300 border-red-500/50 hover:bg-red-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
            }`}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            {isPlaying ? 'PAUSE' : 'REVEAL'}
          </button>
          
          <button
            onClick={reset}
            className="px-4 py-3 rounded-lg bg-slate-800 text-slate-400 border-2 border-slate-700 hover:bg-slate-700 transition-all"
          >
            <RotateCcw size={18} />
          </button>

          <button
            onClick={() => setVisiblePoints(40)}
            className="px-4 py-3 rounded-lg bg-amber-500/10 text-amber-400 border-2 border-amber-500/30 hover:bg-amber-500/20 transition-all"
          >
            First 40
          </button>

          <button
            onClick={() => setVisiblePoints(SPIRAL_POINTS.length)}
            className="px-4 py-3 rounded-lg bg-cyan-500/10 text-cyan-400 border-2 border-cyan-500/30 hover:bg-cyan-500/20 transition-all"
          >
            Show All
          </button>
        </div>

        {/* Speed & Point Slider */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-amber-500/70 uppercase tracking-wider">Animation Speed</span>
              <span className="text-sm text-amber-400 font-mono">{speed}%</span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-amber-500/70 uppercase tracking-wider">Point Scrubber</span>
              <span className="text-sm text-amber-400 font-mono">{visiblePoints}</span>
            </div>
            <input
              type="range"
              min={1}
              max={SPIRAL_POINTS.length}
              value={visiblePoints}
              onChange={(e) => { setVisiblePoints(parseInt(e.target.value)); setIsPlaying(false); }}
              className="w-full accent-amber-500"
            />
          </div>
        </div>

        {/* Coordinates Table */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <span className="text-sm text-amber-400">First 40 Coordinates</span>
            <span className="text-xs text-slate-500">Click a point on canvas to select</span>
          </div>
          <div className="max-h-48 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-1 p-2">
              {SPIRAL_POINTS.slice(0, 40).map((pt, i) => (
                <motion.button
                  key={i}
                  onClick={() => { setSelectedPoint(selectedPoint === i ? null : i); playSound('select'); }}
                  className={`p-2 rounded text-xs font-mono transition-all ${
                    selectedPoint === i
                      ? 'bg-cyan-500/30 border border-cyan-500/50 text-cyan-300'
                      : i < visiblePoints
                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                      : 'bg-slate-800/50 border border-slate-700/50 text-slate-500'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="text-[10px] text-slate-500">#{i}</div>
                  <div>({pt.x},{pt.y})</div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600 justify-center">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Space</kbd> Play/Pause
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">←/→</kbd> Step
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">+/-</kbd> Zoom
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Drag</kbd> Pan
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-amber-400 hover:text-amber-300 transition-colors">
          About the Babylonian Spiral
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            The <span className="text-amber-300">Babylonian spiral</span> is a sequence of integer lattice points 
            where each step minimally increases the vector length while bending clockwise as little as possible.
          </p>
          <p>
            The valid step lengths are <span className="text-cyan-300">sums of two squares</span>: 0, 1, 2, 4, 5, 8, 9, 10, 13, 16, 17, 18, 20, 25...
            (numbers that can be written as a² + b² for integers a, b).
          </p>
          <p>
            Named after the ancient Babylonians who were master astronomers and mathematicians, 
            this spiral creates a beautiful pattern reminiscent of celestial observations.
          </p>
        </div>
      </details>
    </div>
  );
}
