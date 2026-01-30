import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Play, Pause, RotateCcw, Palette, Grid3X3, Calculator, Sparkles, Volume2, VolumeX, Info } from 'lucide-react';
import { motion } from 'motion/react';

// Types
interface Point {
  x: number;
  y: number;
}

// Bernstein basis polynomial: B(k, n, t) = C(n, k) * t^k * (1-t)^(n-k)
function binomial(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = result * (n - i) / (i + 1);
  }
  return Math.round(result);
}

function bernsteinBasis(k: number, n: number, t: number): number {
  if (t < 0 || t > 1) return 0;
  const coeff = binomial(n, k);
  const tPow = Math.pow(t, k);
  const oneMinusTPow = Math.pow(1 - t, n - k);
  return coeff * tPow * oneMinusTPow;
}

// Bezier curve point calculation
function bezierPoint(controlPoints: Point[], t: number): Point {
  const n = controlPoints.length - 1;
  let x = 0;
  let y = 0;
  
  for (let k = 0; k <= n; k++) {
    const basis = bernsteinBasis(k, n, t);
    x += controlPoints[k].x * basis;
    y += controlPoints[k].y * basis;
  }
  
  return { x, y };
}

// Color palette for basis polynomials
const BASIS_COLORS = [
  '#22d3ee', // cyan-400
  '#a78bfa', // violet-400
  '#f472b6', // pink-400
  '#fbbf24', // amber-400
  '#34d399', // emerald-400
  '#60a5fa', // blue-400
  '#f87171', // red-400
  '#c084fc', // purple-400
];

// Preset control point configurations
const PRESETS: { name: string; emoji: string; points: Point[] }[] = [
  {
    name: 'Wave',
    emoji: '〰️',
    points: [
      { x: 50, y: 250 },
      { x: 150, y: 50 },
      { x: 250, y: 450 },
      { x: 350, y: 250 },
    ],
  },
  {
    name: 'Loop',
    emoji: '🔄',
    points: [
      { x: 50, y: 250 },
      { x: 150, y: 50 },
      { x: 250, y: 50 },
      { x: 350, y: 250 },
      { x: 250, y: 450 },
      { x: 150, y: 450 },
      { x: 50, y: 250 },
    ],
  },
  {
    name: 'Arch',
    emoji: '🌈',
    points: [
      { x: 50, y: 400 },
      { x: 100, y: 100 },
      { x: 200, y: 50 },
      { x: 300, y: 100 },
      { x: 350, y: 400 },
    ],
  },
  {
    name: 'S-Curve',
    emoji: '∿',
    points: [
      { x: 50, y: 400 },
      { x: 150, y: 400 },
      { x: 250, y: 100 },
      { x: 350, y: 100 },
    ],
  },
  {
    name: 'Heart',
    emoji: '❤️',
    points: [
      { x: 200, y: 60 },   // 0: top center (start/end)
      { x: 80, y: 80 },    // 1: left upper control
      { x: 40, y: 180 },   // 2: left lower lobe
      { x: 200, y: 400 },  // 3: bottom point
      { x: 360, y: 180 },  // 4: right lower lobe
      { x: 320, y: 80 },   // 5: right upper control
      { x: 200, y: 60 },   // 6: back to top
    ],
  },
];

export default function BernsteinBasisPolynomialsVisualization() {
  // State
  const [degree, setDegree] = useState(3); // n (number of control points - 1)
  const [controlPoints, setControlPoints] = useState<Point[]>(PRESETS[0].points.slice(0, 4));
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [t, setT] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showBasis, setShowBasis] = useState(true);
  const [showControlPolygon, setShowControlPolygon] = useState(true);
  const [draggedPoint, setDraggedPoint] = useState<number | null>(null);
  const [hoveredBasis, setHoveredBasis] = useState<number | null>(null);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graphRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number>(0);
  const isPlayingRef = useRef(false);
  const isApplyingPresetRef = useRef(false);

  // Keep ref in sync
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Update control points when degree changes (manual slider only)
  useEffect(() => {
    // Skip if preset was just applied (preset handles its own point setup)
    if (isApplyingPresetRef.current) {
      isApplyingPresetRef.current = false;
      return;
    }
    
    const currentPreset = PRESETS[selectedPreset];
    const targetLength = degree + 1;
    
    if (controlPoints.length !== targetLength) {
      // Scale the preset to match new degree
      const scaledPoints: Point[] = [];
      const presetPoints = currentPreset.points;
      
      for (let i = 0; i < targetLength; i++) {
        const ratio = targetLength === 1 ? 0 : i / (targetLength - 1);
        const presetIndex = Math.min(Math.floor(ratio * presetPoints.length), presetPoints.length - 1);
        const presetPoint = presetPoints[presetIndex];
        
        // Add some variation based on degree
        const variation = (i % 2 === 0 ? 1 : -1) * (degree - 3) * 10;
        scaledPoints.push({
          x: Math.max(50, Math.min(350, presetPoint.x + variation)),
          y: Math.max(50, Math.min(450, presetPoint.y + (i % 2 === 0 ? -variation : variation))),
        });
      }
      
      setControlPoints(scaledPoints);
      playSound('click');
    }
  }, [degree, selectedPreset]);

  // Sound effects
  const playSound = useCallback((type: 'tick' | 'point' | 'complete' | 'click' | 'sweep' | 'drag') => {
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
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.start(now);
      osc.stop(now + 0.03);
    } else if (type === 'point') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'complete') {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.05, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4 + i * 0.08);
        osc.start(now + i * 0.08);
        osc.stop(now + 0.5 + i * 0.08);
      });
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'sweep') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600 + t * 400, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'drag') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.start(now);
      osc.stop(now + 0.03);
    }
  }, [soundEnabled, t]);

  // Draw the main Bézier curve canvas
  const drawBezier = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw control polygon
    if (showControlPolygon && controlPoints.length > 1) {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(controlPoints[0].x, controlPoints[0].y);
      for (let i = 1; i < controlPoints.length; i++) {
        ctx.lineTo(controlPoints[i].x, controlPoints[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Bézier curve
    if (controlPoints.length >= 2) {
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      
      const steps = 200;
      for (let i = 0; i <= steps; i++) {
        const tVal = i / steps;
        const point = bezierPoint(controlPoints, tVal);
        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw control points
    controlPoints.forEach((point, i) => {
      const color = BASIS_COLORS[i % BASIS_COLORS.length];
      
      // Point glow
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      
      // Point circle
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.shadowBlur = 0;
      
      // Point border
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Index label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`P${i}`, point.x, point.y - 20);
    });

    // Draw current point on curve
    const currentPoint = bezierPoint(controlPoints, t);
    
    // Glow
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 20;
    
    // Point
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(currentPoint.x, currentPoint.y, 10, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    
    // Border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(currentPoint.x, currentPoint.y, 10, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Draw t label
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`t = ${t.toFixed(3)}`, currentPoint.x + 15, currentPoint.y);
  }, [controlPoints, t, showControlPolygon]);

  // Draw the basis polynomials graph
  const drawBasisGraph = useCallback(() => {
    const canvas = graphRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const graphWidth = width - 2 * padding;
    const graphHeight = height - 2 * padding;

    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
    ctx.lineWidth = 1;
    for (let x = padding; x <= width - padding; x += graphWidth / 10) {
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }
    for (let y = padding; y <= height - padding; y += graphHeight / 5) {
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.lineWidth = 2;
    
    // X axis
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // Y axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();

    // Draw axis labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('t', width - padding + 15, height - padding);
    ctx.textAlign = 'right';
    ctx.fillText('B(t)', padding - 10, padding - 5);

    // Draw tick labels
    ctx.textAlign = 'center';
    ctx.fillText('0', padding, height - padding + 15);
    ctx.fillText('0.5', padding + graphWidth / 2, height - padding + 15);
    ctx.fillText('1', width - padding, height - padding + 15);

    // Draw basis polynomials
    if (showBasis) {
      const n = degree;
      const steps = 200;
      
      for (let k = 0; k <= n; k++) {
        const color = BASIS_COLORS[k % BASIS_COLORS.length];
        const isHovered = hoveredBasis === k;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = isHovered ? 4 : 2;
        ctx.globalAlpha = isHovered ? 1 : hoveredBasis !== null ? 0.3 : 0.8;
        ctx.beginPath();
        
        for (let i = 0; i <= steps; i++) {
          const tVal = i / steps;
          const basis = bernsteinBasis(k, n, tVal);
          const x = padding + tVal * graphWidth;
          const y = height - padding - basis * graphHeight;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
        
        // Label at peak
        const peakT = k / n;
        if (peakT >= 0 && peakT <= 1) {
          const peakBasis = bernsteinBasis(k, n, peakT);
          const peakX = padding + peakT * graphWidth;
          const peakY = height - padding - peakBasis * graphHeight;
          
          ctx.fillStyle = color;
          ctx.font = isHovered ? 'bold 14px sans-serif' : '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`B${k},${n}`, peakX, peakY - 10);
        }
      }
    }

    // Draw vertical line at current t
    const tX = padding + t * graphWidth;
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(tX, padding);
    ctx.lineTo(tX, height - padding);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw current basis values at t
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`t = ${t.toFixed(3)}`, tX + 5, padding + 15);

    // Show partition of unity verification
    let sum = 0;
    for (let k = 0; k <= degree; k++) {
      sum += bernsteinBasis(k, degree, t);
    }
    ctx.fillStyle = '#34d399';
    ctx.fillText(`Σ = ${sum.toFixed(6)}`, tX + 5, padding + 30);
  }, [degree, t, showBasis, hoveredBasis]);

  // Animation loop
  const startAnimation = useCallback(() => {
    const startTime = performance.now();
    const duration = 4000 / speed;

    const animate = (timestamp: number) => {
      if (!isPlayingRef.current) return;

      const elapsed = timestamp - startTime;
      const newT = Math.min(elapsed / duration, 1);
      
      setT(newT);
      
      if (Math.random() < 0.3) playSound('tick');

      if (newT < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsPlaying(false);
        playSound('complete');
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [speed, playSound]);

  // Redraw when dependencies change
  useEffect(() => {
    drawBezier();
    drawBasisGraph();
  }, [drawBezier, drawBasisGraph]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      drawBezier();
      drawBasisGraph();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawBezier, drawBasisGraph]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  // Handle mouse events for dragging control points
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    // Scale mouse coordinates to canvas coordinate space
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // Check if clicking near a control point (use larger radius for better UX)
    controlPoints.forEach((point, i) => {
      const dist = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
      if (dist < 25) {
        setDraggedPoint(i);
        playSound('point');
      }
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedPoint === null) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    // Scale mouse coordinates to canvas coordinate space
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.max(20, Math.min(380, (e.clientX - rect.left) * scaleX));
    const y = Math.max(20, Math.min(480, (e.clientY - rect.top) * scaleY));
    
    setControlPoints(prev => {
      const newPoints = [...prev];
      newPoints[draggedPoint] = { x, y };
      return newPoints;
    });
    
    if (Math.random() < 0.1) playSound('drag');
  };

  const handleCanvasMouseUp = () => {
    setDraggedPoint(null);
  };

  // Apply preset
  const applyPreset = (index: number) => {
    const preset = PRESETS[index];
    setSelectedPreset(index);
    
    // Auto-adjust degree to match preset's natural point count (capped at max 7)
    const presetDegree = Math.min(preset.points.length - 1, 7);
    
    // Set flag to prevent useEffect from overriding
    isApplyingPresetRef.current = true;
    setDegree(presetDegree);
    
    // Use all preset points directly
    setControlPoints(preset.points.slice(0, presetDegree + 1));
    playSound('point');
  };

  // Control functions
  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      cancelAnimationFrame(animationRef.current);
    } else {
      if (t >= 1) setT(0);
      setIsPlaying(true);
      isPlayingRef.current = true;
      setTimeout(() => startAnimation(), 0);
      playSound('click');
    }
  };

  const reset = () => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    cancelAnimationFrame(animationRef.current);
    setT(0);
    playSound('click');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'r':
        case 'R':
          reset();
          break;
        case 'b':
        case 'B':
          setShowBasis(prev => !prev);
          playSound('click');
          break;
        case 'c':
        case 'C':
          setShowControlPolygon(prev => !prev);
          playSound('click');
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          applyPreset(parseInt(e.key) - 1);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, t, showBasis, showControlPolygon, degree]);

  // Calculate current basis values
  const currentBasisValues = useMemo(() => {
    return Array.from({ length: degree + 1 }, (_, k) => bernsteinBasis(k, degree, t));
  }, [degree, t]);

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-indigo-950/5 to-slate-950 rounded-xl border border-indigo-900/30 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-indigo-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/15 border border-indigo-500/40 relative">
              <Palette className="text-indigo-400" size={24} />
              {isPlaying && (
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Sparkles size={12} className="text-amber-300" />
                </motion.div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-indigo-300 tracking-wide">CURVE SCULPTOR</h2>
              <p className="text-xs text-indigo-500/70">Bernstein Basis Polynomials Explorer</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setShowBasis(!showBasis); playSound('click'); }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                showBasis
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {showBasis ? 'Basis On' : 'Basis Off'}
            </button>
            
            <button
              onClick={() => { setShowControlPolygon(!showControlPolygon); playSound('click'); }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                showControlPolygon
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {showControlPolygon ? 'Polygon On' : 'Polygon Off'}
            </button>
            
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled 
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' 
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
        
        {/* Degree Selector */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Calculator size={14} />
              Polynomial Degree (n)
            </div>
            <span className="text-lg font-bold text-indigo-400 font-mono">n = {degree}</span>
          </div>
          <input
            type="range"
            min="1"
            max="7"
            step="1"
            value={degree}
            onChange={(e) => setDegree(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-xs text-slate-600 mt-1">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
            <span>6</span>
            <span>7</span>
          </div>
        </div>

        {/* Presets */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-slate-400 mb-3 flex items-center gap-2">
            <Grid3X3 size={14} />
            Curve Presets
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => applyPreset(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                  selectedPreset === idx
                    ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50'
                    : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-indigo-500/30'
                }`}
              >
                <span>{preset.emoji}</span>
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Dual Canvas Visualization */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Bézier Curve Canvas */}
          <div className="bg-slate-900/30 rounded-xl border border-indigo-800/30 p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-indigo-400 flex items-center gap-2">
                <Palette size={14} />
                Bézier Curve (Drag points!)
              </div>
            </div>
            <div className="relative flex justify-center overflow-hidden">
              <canvas
                ref={canvasRef}
                width={400}
                height={500}
                className="rounded-lg cursor-crosshair touch-none max-w-full h-auto"
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">
              Drag the colored control points to reshape the curve
            </p>
          </div>

          {/* Basis Polynomials Graph */}
          <div className="bg-slate-900/30 rounded-xl border border-indigo-800/30 p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-indigo-400 flex items-center gap-2">
                <Calculator size={14} />
                Basis Polynomials B<sub>k,n</sub>(t)
              </div>
            </div>
            <div className="relative flex justify-center overflow-hidden">
              <canvas
                ref={graphRef}
                width={400}
                height={300}
                className="rounded-lg max-w-full h-auto"
              />
            </div>
            
            {/* Basis Legend */}
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {Array.from({ length: degree + 1 }, (_, k) => (
                <button
                  key={k}
                  onMouseEnter={() => setHoveredBasis(k)}
                  onMouseLeave={() => setHoveredBasis(null)}
                  className="px-2 py-1 rounded text-[10px] font-medium transition-all hover:scale-110"
                  style={{
                    backgroundColor: `${BASIS_COLORS[k % BASIS_COLORS.length]}20`,
                    color: BASIS_COLORS[k % BASIS_COLORS.length],
                    border: `1px solid ${BASIS_COLORS[k % BASIS_COLORS.length]}50`,
                  }}
                >
                  B<sub>{k},{degree}</sub>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Current Values Display */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-slate-400">Current Basis Values at t = {t.toFixed(3)}</div>
            <div className="text-xs text-emerald-400 font-mono">
              Σ = {currentBasisValues.reduce((a, b) => a + b, 0).toFixed(6)} ≈ 1
            </div>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {currentBasisValues.map((value, k) => (
              <motion.div
                key={k}
                className="bg-slate-800/50 rounded-lg p-2 text-center"
                animate={{ 
                  scale: hoveredBasis === k ? 1.05 : 1,
                  backgroundColor: hoveredBasis === k ? `${BASIS_COLORS[k % BASIS_COLORS.length]}20` : undefined
                }}
              >
                <div 
                  className="text-xs font-medium mb-1"
                  style={{ color: BASIS_COLORS[k % BASIS_COLORS.length] }}
                >
                  B<sub>{k},{degree}</sub>
                </div>
                <div className="text-xs font-mono text-slate-300">
                  {value.toFixed(3)}
                </div>
              </motion.div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            <span className="text-emerald-400">Partition of Unity:</span> The sum of all basis polynomials always equals 1 for any t ∈ [0,1]
          </p>
        </div>

        {/* Animation Controls */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={togglePlay}
              className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                isPlaying
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 hover:bg-indigo-500/30'
              }`}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              {isPlaying ? 'PAUSE' : 'ANIMATE'}
            </button>
            <button
              onClick={reset}
              className="px-4 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
            >
              <RotateCcw size={18} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-400">Parameter t</span>
                <span className="text-amber-400 font-mono">{t.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.001"
                value={t}
                onChange={(e) => setT(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>0</span>
                <span>0.5</span>
                <span>1</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">Speed:</span>
              <input
                type="range"
                min="0.25"
                max="3"
                step="0.25"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <span className="text-xs text-indigo-400 font-mono">{speed}x</span>
            </div>
          </div>
        </div>

        {/* Formula Display */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
            <h3 className="text-sm font-semibold text-indigo-300 mb-3 flex items-center gap-2">
              <Calculator size={16} />
              Bernstein Basis Formula
            </h3>
            <div className="bg-slate-900/50 p-3 rounded-lg font-mono text-xs text-indigo-300 mb-3 overflow-x-auto">
              B<sub>k,n</sub>(t) = C(n,k) · t<sup>k</sup> · (1-t)<sup>n-k</sup>
            </div>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">•</span>
                <span><span className="text-cyan-300">C(n,k)</span> is the binomial coefficient</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span><span className="text-amber-300">n</span> = degree, <span className="text-amber-300">k</span> = index (0 to n)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">•</span>
                <span><span className="text-emerald-300">t</span> ∈ [0, 1] is the parameter</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
            <h3 className="text-sm font-semibold text-indigo-300 mb-3 flex items-center gap-2">
              <Sparkles size={16} />
              Bézier Curve Formula
            </h3>
            <div className="bg-slate-900/50 p-3 rounded-lg font-mono text-xs text-indigo-300 mb-3 overflow-x-auto">
              P(t) = Σ B<sub>k,n</sub>(t) · P<sub>k</sub> for k = 0 to n
            </div>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-violet-400">•</span>
                <span><span className="text-violet-300">P(t)</span> is the point on the curve</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-400">•</span>
                <span><span className="text-pink-300">P<sub>k</sub></span> are the control points</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">•</span>
                <span>Curve is a <span className="text-cyan-300">weighted sum</span> of control points</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Degree</div>
            <div className="text-xl font-bold text-indigo-400 font-mono">{degree}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Control Points</div>
            <div className="text-xl font-bold text-violet-400 font-mono">{controlPoints.length}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Current t</div>
            <div className="text-xl font-bold text-amber-400 font-mono">{t.toFixed(2)}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Max Basis Value</div>
            <div className="text-xl font-bold text-cyan-400 font-mono">
              {Math.max(...currentBasisValues).toFixed(2)}
            </div>
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
            <kbd className="text-slate-400">B</kbd> Toggle Basis
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">C</kbd> Toggle Polygon
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">1-5</kbd> Presets
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-2">
          <Info size={16} />
          About Bernstein Basis Polynomials
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            <span className="text-indigo-300">Bernstein basis polynomials</span> are the mathematical 
            foundation of Bézier curves, widely used in computer graphics, CAD/CAM systems, and animation.
          </p>
          <p>
            <span className="text-cyan-300">Key Properties:</span>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><span className="text-emerald-300">Partition of Unity:</span> Σ B<sub>k,n</sub>(t) = 1 for all t ∈ [0,1]</li>
            <li><span className="text-amber-300">Non-negativity:</span> B<sub>k,n</sub>(t) ≥ 0 in [0,1]</li>
            <li><span className="text-violet-300">Symmetry:</span> B<sub>k,n</sub>(t) = B<sub>n-k,n</sub>(1-t)</li>
            <li><span className="text-pink-300">Maximum:</span> Each B<sub>k,n</sub> peaks at t = k/n</li>
          </ul>
          <p className="mt-2">
            <span className="text-amber-300">Applications:</span> Font design (TrueType, PostScript), 
            vector graphics (SVG, PDF), animation curves, industrial design, and game development.
          </p>
        </div>
      </details>
    </div>
  );
}
