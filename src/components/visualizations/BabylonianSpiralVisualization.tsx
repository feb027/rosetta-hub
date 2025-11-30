import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, ZoomIn, ZoomOut, Eye, Sparkles, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Efficient spiral generation using proper algorithm
// Pre-compute sums of two squares and cache point lookups
const generateSumsOfSquaresMap = (maxVal: number): Map<number, Array<[number, number]>> => {
  const map = new Map<number, Array<[number, number]>>();
  map.set(0, [[0, 0]]);
  
  for (let a = 0; a * a <= maxVal; a++) {
    for (let b = 0; a * a + b * b <= maxVal; b++) {
      const sum = a * a + b * b;
      if (sum === 0) continue;
      
      if (!map.has(sum)) map.set(sum, []);
      const points = map.get(sum)!;
      
      // Add all 8 symmetries (or 4 if on axis)
      const variants: Array<[number, number]> = [];
      if (a === 0) {
        variants.push([0, b], [0, -b], [b, 0], [-b, 0]);
      } else if (b === 0) {
        variants.push([a, 0], [-a, 0], [0, a], [0, -a]);
      } else if (a === b) {
        variants.push([a, a], [a, -a], [-a, a], [-a, -a]);
      } else {
        variants.push(
          [a, b], [a, -b], [-a, b], [-a, -b],
          [b, a], [b, -a], [-b, a], [-b, -a]
        );
      }
      
      for (const v of variants) {
        if (!points.some(p => p[0] === v[0] && p[1] === v[1])) {
          points.push(v);
        }
      }
    }
  }
  
  return map;
};

// Get sorted list of valid squared distances
const getValidDistances = (maxVal: number): number[] => {
  const sums = new Set<number>();
  for (let a = 0; a * a <= maxVal; a++) {
    for (let b = 0; a * a + b * b <= maxVal; b++) {
      sums.add(a * a + b * b);
    }
  }
  return Array.from(sums).sort((a, b) => a - b);
};

// Angle calculation (0 = up, clockwise positive)
const vectorAngle = (dx: number, dy: number): number => Math.atan2(dx, -dy);

const normalizeAngle = (angle: number): number => {
  while (angle < 0) angle += 2 * Math.PI;
  while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
  return angle;
};

// Clockwise angle difference
const clockwiseDiff = (from: number, to: number): number => {
  let diff = normalizeAngle(to - from);
  return diff;
};

// Generate spiral efficiently
const generateSpiral = (numPoints: number): Array<{ x: number; y: number; d2: number }> => {
  const maxD2 = Math.max(numPoints * 50, 100000); // Generous upper bound
  const distanceMap = generateSumsOfSquaresMap(maxD2);
  const validDistances = getValidDistances(maxD2);
  
  const points: Array<{ x: number; y: number; d2: number }> = [{ x: 0, y: 0, d2: 0 }];
  const visited = new Set<string>();
  visited.add('0,0');
  
  let currentX = 0, currentY = 0;
  let prevAngle = 0;
  let prevD2Index = 0;
  
  for (let i = 1; i < numPoints; i++) {
    let bestPoint: [number, number] | null = null;
    let bestD2 = -1;
    let bestAngleDiff = Infinity;
    
    // Search from current distance index upward
    for (let dIdx = prevD2Index + 1; dIdx < validDistances.length; dIdx++) {
      const d2 = validDistances[dIdx];
      const candidates = distanceMap.get(d2);
      if (!candidates) continue;
      
      let foundAtThisDistance = false;
      
      for (const [dx, dy] of candidates) {
        const newX = currentX + dx;
        const newY = currentY + dy;
        const key = `${newX},${newY}`;
        
        if (visited.has(key)) continue;
        
        const angle = vectorAngle(dx, dy);
        const angleDiff = clockwiseDiff(prevAngle, angle);
        
        if (!foundAtThisDistance || angleDiff < bestAngleDiff) {
          bestD2 = d2;
          bestPoint = [newX, newY];
          bestAngleDiff = angleDiff;
          foundAtThisDistance = true;
        }
      }
      
      if (foundAtThisDistance) {
        prevD2Index = dIdx;
        break;
      }
    }
    
    if (!bestPoint) break;
    
    const [newX, newY] = bestPoint;
    const dx = newX - currentX;
    const dy = newY - currentY;
    
    prevAngle = vectorAngle(dx, dy);
    currentX = newX;
    currentY = newY;
    visited.add(`${newX},${newY}`);
    points.push({ x: currentX, y: currentY, d2: bestD2 });
  }
  
  return points;
};

// Generate 10000 points (this runs once on load)
console.time('Generating Babylonian Spiral');
const SPIRAL_POINTS = generateSpiral(10000);
console.timeEnd('Generating Babylonian Spiral');
console.log(`Generated ${SPIRAL_POINTS.length} points`);

export default function BabylonianSpiralVisualization() {
  const [visiblePoints, setVisiblePoints] = useState(40);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [autoFit, setAutoFit] = useState(true);
  const [showStars, setShowStars] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);
  const starsRef = useRef<Array<{ x: number; y: number; size: number; twinkle: number }>>([]);
  const animFrameRef = useRef<number>(0);
  const lastTransformRef = useRef<{ scale: number; centerX: number; centerY: number } | null>(null);


  // Generate stars once
  useEffect(() => {
    if (starsRef.current.length === 0) {
      starsRef.current = Array.from({ length: 200 }, () => ({
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
      const baseFreq = 220 + (visiblePoints % 24) * 20;
      osc.frequency.setValueAtTime(baseFreq, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'complete') {
      [261, 329, 392, 523].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.05, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6 + i * 0.1);
        osc.start(now + i * 0.1);
        osc.stop(now + 0.8 + i * 0.1);
      });
    } else if (type === 'select') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(500, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'whoosh') {
      const bufferSize = ctx.sampleRate * 0.1;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const gain = ctx.createGain();
      noise.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.02, now);
      noise.start(now);
      noise.stop(now + 0.1);
    }
  }, [soundEnabled, visiblePoints]);

  // Animation loop - batch updates for performance
  useEffect(() => {
    if (isPlaying) {
      const batchSize = speed > 80 ? 50 : speed > 50 ? 10 : speed > 20 ? 3 : 1;
      const delay = speed > 80 ? 16 : speed > 50 ? 30 : speed > 20 ? 60 : 150;
      
      intervalRef.current = window.setInterval(() => {
        setVisiblePoints(prev => {
          const next = Math.min(prev + batchSize, SPIRAL_POINTS.length);
          if (next >= SPIRAL_POINTS.length) {
            setIsPlaying(false);
            playSound('complete');
          } else if (batchSize === 1) {
            playSound('point');
          }
          return next;
        });
      }, delay);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [isPlaying, speed, playSound]);

  // Calculate bounds
  const getBounds = useCallback((numPoints: number) => {
    const pts = SPIRAL_POINTS.slice(0, numPoints);
    if (pts.length === 0) return { minX: -10, maxX: 10, minY: -10, maxY: 10 };
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    const padding = Math.max(10, (maxX - minX) * 0.05);
    return { minX: minX - padding, maxX: maxX + padding, minY: minY - padding, maxY: maxY + padding };
  }, []);

  // Continuous canvas rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;
      
      const width = canvas.width;
      const height = canvas.height;
      const bounds = getBounds(visiblePoints);
      
      // Calculate scale and center
      const rangeX = bounds.maxX - bounds.minX;
      const rangeY = bounds.maxY - bounds.minY;
      
      let scale: number;
      let centerX: number;
      let centerY: number;
      
      if (autoFit) {
        // Auto-fit mode: scale to fit all points
        scale = Math.min(width / rangeX, height / rangeY) * 0.85 * zoom;
        centerX = width / 2 - ((bounds.minX + bounds.maxX) / 2) * scale + panOffset.x;
        centerY = height / 2 + ((bounds.minY + bounds.maxY) / 2) * scale + panOffset.y;
        // Store transform for when user starts dragging
        lastTransformRef.current = { scale, centerX, centerY };
      } else {
        // Manual mode: use stored transform + pan offset
        if (lastTransformRef.current) {
          scale = lastTransformRef.current.scale * zoom;
          centerX = lastTransformRef.current.centerX + panOffset.x;
          centerY = lastTransformRef.current.centerY + panOffset.y;
        } else {
          scale = Math.min(width, height) / 100 * zoom;
          centerX = width / 2 + panOffset.x;
          centerY = height / 2 + panOffset.y;
        }
      }

      // Clear with solid dark background
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, width, height);

      // Stars - very subtle, behind everything
      if (showStars) {
        const time = Date.now() / 1000;
        for (const star of starsRef.current) {
          const twinkle = 0.3 + 0.7 * Math.sin(time * 1.2 + star.twinkle);
          ctx.fillStyle = `rgba(200, 200, 180, ${0.15 * twinkle})`;
          ctx.beginPath();
          ctx.arc(star.x * width, star.y * height, star.size * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Grid
      if (showGrid && scale > 1.5) {
        ctx.strokeStyle = 'rgba(100, 149, 237, 0.06)';
        ctx.lineWidth = 1;
        const gridStep = scale > 15 ? 1 : scale > 4 ? 5 : 10;
        
        ctx.beginPath();
        for (let x = Math.floor(bounds.minX / gridStep) * gridStep; x <= bounds.maxX; x += gridStep) {
          const screenX = centerX + x * scale;
          if (screenX >= 0 && screenX <= width) {
            ctx.moveTo(screenX, 0);
            ctx.lineTo(screenX, height);
          }
        }
        for (let y = Math.floor(bounds.minY / gridStep) * gridStep; y <= bounds.maxY; y += gridStep) {
          const screenY = centerY - y * scale;
          if (screenY >= 0 && screenY <= height) {
            ctx.moveTo(0, screenY);
            ctx.lineTo(width, screenY);
          }
        }
        ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = 'rgba(100, 149, 237, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, height);
      ctx.stroke();

      const pts = SPIRAL_POINTS.slice(0, visiblePoints);
      if (pts.length < 2) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // Draw spiral path
      ctx.beginPath();
      ctx.moveTo(centerX + pts[0].x * scale, centerY - pts[0].y * scale);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(centerX + pts[i].x * scale, centerY - pts[i].y * scale);
      }
      ctx.strokeStyle = '#ffc832';
      ctx.lineWidth = Math.max(1.5, 2.5 / Math.sqrt(Math.max(1, zoom)));
      ctx.stroke();

      // Draw points - only if reasonable count or zoomed in
      const shouldDrawPoints = pts.length < 600 || scale > 2;
      if (shouldDrawPoints) {
        const pointRadius = Math.max(2, Math.min(4, 3.5 / Math.sqrt(pts.length / 100)));
        
        for (let i = 0; i < pts.length; i++) {
          const pt = pts[i];
          const screenX = centerX + pt.x * scale;
          const screenY = centerY - pt.y * scale;
          
          // Skip off-screen
          if (screenX < -10 || screenX > width + 10 || screenY < -10 || screenY > height + 10) continue;
          
          const isSelected = selectedPoint === i;
          const isLast = i === pts.length - 1;

          // Glow
          if (isSelected || isLast) {
            const glowGrad = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, 12);
            glowGrad.addColorStop(0, isSelected ? 'rgba(0, 255, 200, 0.7)' : 'rgba(255, 215, 0, 0.7)');
            glowGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(screenX, screenY, 12, 0, Math.PI * 2);
            ctx.fill();
          }

          // Point dot
          ctx.beginPath();
          ctx.arc(screenX, screenY, isSelected ? 5 : isLast ? 4 : pointRadius, 0, Math.PI * 2);
          const hue = 35 + (i / pts.length) * 25;
          ctx.fillStyle = isSelected ? '#00ffc8' : `hsl(${hue}, 90%, 55%)`;
          ctx.fill();
        }
      }

      // Origin marker
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
    
    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [visiblePoints, zoom, panOffset, showStars, showGrid, selectedPoint, autoFit, getBounds]);

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const wasAutoFit = autoFit;
    setIsDragging(true);
    
    if (wasAutoFit) {
      // Switching from autoFit to manual - reset pan offset since transform is stored
      setDragStart({ x: e.clientX, y: e.clientY });
      setPanOffset({ x: 0, y: 0 });
      setAutoFit(false);
    } else {
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setPanOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    const bounds = getBounds(visiblePoints);
    const rangeX = bounds.maxX - bounds.minX;
    const rangeY = bounds.maxY - bounds.minY;
    const baseScale = autoFit 
      ? Math.min(canvas.width / rangeX, canvas.height / rangeY) * 0.85
      : Math.min(canvas.width, canvas.height) / 100;
    const scale = baseScale * zoom;
    const centerX = canvas.width / 2 + panOffset.x - (autoFit ? ((bounds.minX + bounds.maxX) / 2) * scale : 0);
    const centerY = canvas.height / 2 + panOffset.y + (autoFit ? ((bounds.minY + bounds.maxY) / 2) * scale : 0);

    // Find clicked point
    const pts = SPIRAL_POINTS.slice(0, visiblePoints);
    for (let i = pts.length - 1; i >= 0; i--) {
      const screenX = centerX + pts[i].x * scale;
      const screenY = centerY - pts[i].y * scale;
      if (Math.hypot(clickX - screenX, clickY - screenY) < 12) {
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
    setVisiblePoints(40);
    setSelectedPoint(null);
    setPanOffset({ x: 0, y: 0 });
    setZoom(1);
    setAutoFit(true);
  };

  const handleZoom = (delta: number) => {
    setZoom(z => Math.max(0.1, Math.min(10, z * (1 + delta))));
    setAutoFit(false);
    playSound('whoosh');
  };

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ') { e.preventDefault(); setIsPlaying(p => !p); }
      if (e.key === 'r' || e.key === 'R') reset();
      if (e.key === '+' || e.key === '=') handleZoom(0.2);
      if (e.key === '-') handleZoom(-0.2);
      if (e.key === 'f' || e.key === 'F') { setAutoFit(true); setPanOffset({ x: 0, y: 0 }); setZoom(1); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const currentPoint = selectedPoint !== null ? SPIRAL_POINTS[selectedPoint] : SPIRAL_POINTS[visiblePoints - 1];


  return (
    <div className="w-full bg-gradient-to-b from-[#0f0f23] via-[#1a1a2e] to-[#0f0f23] rounded-xl border border-amber-700/30 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-900/40 via-amber-800/30 to-amber-900/40 border-b border-amber-600/30 px-4 py-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="relative p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <Sparkles className="text-amber-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-300 tracking-wide">BABYLONIAN SPIRAL</h2>
              <p className="text-[10px] text-amber-500/70">Up to {SPIRAL_POINTS.length.toLocaleString()} points • Integer lattice journey</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button onClick={() => setShowStars(!showStars)} className={`p-1.5 rounded border transition-all ${showStars ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-500'}`} title="Stars">
              <Sparkles size={14} />
            </button>
            <button onClick={() => setShowGrid(!showGrid)} className={`p-1.5 rounded border transition-all ${showGrid ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-500'}`} title="Grid">
              <Eye size={14} />
            </button>
            <button onClick={() => { setAutoFit(true); setPanOffset({ x: 0, y: 0 }); setZoom(1); }} className={`p-1.5 rounded border transition-all ${autoFit ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-500'}`} title="Auto-fit">
              <Target size={14} />
            </button>
            <button onClick={() => setSoundEnabled(!soundEnabled)} className={`p-1.5 rounded border transition-all ${soundEnabled ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
              {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative bg-[#0f0f23]">
        <canvas
          ref={canvasRef}
          width={900}
          height={550}
          className="w-full cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleClick}
        />

        {/* Floating Controls */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          <button onClick={() => handleZoom(0.3)} className="p-1.5 rounded bg-slate-900/90 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 backdrop-blur-sm">
            <ZoomIn size={16} />
          </button>
          <button onClick={() => handleZoom(-0.3)} className="p-1.5 rounded bg-slate-900/90 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 backdrop-blur-sm">
            <ZoomOut size={16} />
          </button>
          <div className="text-[10px] text-amber-400/70 bg-slate-900/90 rounded px-1.5 py-0.5 text-center backdrop-blur-sm border border-slate-700/50">
            {Math.round(zoom * 100)}%
          </div>
        </div>

        {/* Point Counter */}
        <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-sm rounded-lg border border-amber-500/30 px-3 py-2">
          <div className="text-[10px] text-amber-500/70">Points</div>
          <div className="text-xl font-bold text-amber-300 font-mono">
            {visiblePoints.toLocaleString()}
          </div>
        </div>

        {/* Selected Point Info */}
        <AnimatePresence>
          {currentPoint && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-3 left-3 bg-slate-900/95 backdrop-blur-sm rounded-lg border border-cyan-500/30 px-3 py-2"
            >
              <div className="text-[10px] text-cyan-400 mb-1">
                {selectedPoint !== null ? `Point #${selectedPoint}` : `Current #${visiblePoints - 1}`}
              </div>
              <div className="flex gap-3 text-xs font-mono">
                <span><span className="text-slate-500">x:</span> <span className="text-amber-300">{currentPoint.x}</span></span>
                <span><span className="text-slate-500">y:</span> <span className="text-amber-300">{currentPoint.y}</span></span>
                <span><span className="text-slate-500">d²:</span> <span className="text-cyan-300">{currentPoint.d2}</span></span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="p-4 space-y-4 border-t border-amber-800/30">
        {/* Playback */}
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-5 py-2 rounded-lg font-bold flex items-center gap-2 transition-all border ${
              isPlaying
                ? 'bg-red-500/20 text-red-300 border-red-500/50'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
            }`}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            {isPlaying ? 'PAUSE' : 'PLAY'}
          </button>
          <button onClick={reset} className="px-3 py-2 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700">
            <RotateCcw size={16} />
          </button>
          <button onClick={() => setVisiblePoints(40)} className="px-3 py-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 text-sm">
            40
          </button>
          <button onClick={() => setVisiblePoints(100)} className="px-3 py-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 text-sm">
            100
          </button>
          <button onClick={() => setVisiblePoints(1000)} className="px-3 py-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 text-sm">
            1K
          </button>
          <button onClick={() => setVisiblePoints(5000)} className="px-3 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-sm">
            5K
          </button>
          <button onClick={() => setVisiblePoints(SPIRAL_POINTS.length)} className="px-3 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-sm">
            {(SPIRAL_POINTS.length / 1000).toFixed(0)}K
          </button>
        </div>

        {/* Sliders */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-amber-500/70 uppercase">Speed</span>
              <span className="text-amber-400 font-mono">{speed}%</span>
            </div>
            <input type="range" min={1} max={100} value={speed} onChange={(e) => setSpeed(parseInt(e.target.value))} className="w-full accent-amber-500 h-1.5" />
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-amber-500/70 uppercase">Points</span>
              <span className="text-amber-400 font-mono">{visiblePoints.toLocaleString()}</span>
            </div>
            <input type="range" min={1} max={SPIRAL_POINTS.length} value={visiblePoints} onChange={(e) => { setVisiblePoints(parseInt(e.target.value)); setIsPlaying(false); }} className="w-full accent-amber-500 h-1.5" />
          </div>
        </div>

        {/* First 40 Table */}
        <details className="bg-slate-900/30 rounded-xl border border-slate-800">
          <summary className="px-4 py-2 cursor-pointer text-sm text-amber-400 hover:text-amber-300">
            First 40 Coordinates (click to expand)
          </summary>
          <div className="px-3 pb-3 grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1 max-h-40 overflow-y-auto">
            {SPIRAL_POINTS.slice(0, 40).map((pt, i) => (
              <button
                key={i}
                onClick={() => { setSelectedPoint(selectedPoint === i ? null : i); playSound('select'); }}
                className={`p-1.5 rounded text-[10px] font-mono transition-all ${
                  selectedPoint === i
                    ? 'bg-cyan-500/30 border border-cyan-500/50 text-cyan-300'
                    : i < visiblePoints
                    ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
                    : 'bg-slate-800/50 border border-slate-700/50 text-slate-500'
                }`}
              >
                <div className="text-[8px] text-slate-500">#{i}</div>
                ({pt.x},{pt.y})
              </button>
            ))}
          </div>
        </details>

        {/* Shortcuts */}
        <div className="flex flex-wrap gap-1.5 text-[9px] text-slate-600 justify-center">
          <span className="px-1.5 py-0.5 bg-slate-800/50 rounded border border-slate-700/50"><kbd className="text-slate-400">Space</kbd> Play</span>
          <span className="px-1.5 py-0.5 bg-slate-800/50 rounded border border-slate-700/50"><kbd className="text-slate-400">+/-</kbd> Zoom</span>
          <span className="px-1.5 py-0.5 bg-slate-800/50 rounded border border-slate-700/50"><kbd className="text-slate-400">F</kbd> Fit</span>
          <span className="px-1.5 py-0.5 bg-slate-800/50 rounded border border-slate-700/50"><kbd className="text-slate-400">R</kbd> Reset</span>
          <span className="px-1.5 py-0.5 bg-slate-800/50 rounded border border-slate-700/50">Drag to pan</span>
        </div>
      </div>

      {/* Info */}
      <details className="mx-4 mb-4 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-2 cursor-pointer text-sm text-amber-400">About the Babylonian Spiral</summary>
        <div className="px-4 pb-3 text-xs text-slate-400 space-y-2">
          <p>The <span className="text-amber-300">Babylonian spiral</span> visits integer lattice points, each step minimally increasing vector length while bending clockwise as little as possible.</p>
          <p>Valid step lengths are <span className="text-cyan-300">sums of two squares</span>: 1, 2, 4, 5, 8, 9, 10, 13... The spiral creates beautiful chaotic patterns at large scales.</p>
        </div>
      </details>
    </div>
  );
}
