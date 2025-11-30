import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Zap, MousePointer2, Gauge } from 'lucide-react';
import { motion } from 'motion/react';

// --- Types ---

interface SpinnerConfig {
  id: string;
  x: number;
  y: number;
  baseAngle: number;
  speed: number;
  color: string;
  trailColor: string;
}

// --- Component ---

export default function AnimatedSpinnersVisualization() {
  const [isRunning, setIsRunning] = useState(true);
  const [speed, setSpeed] = useState(3);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [mouseEnabled, setMouseEnabled] = useState(true);
  const [trailLength, setTrailLength] = useState(8);
  const [soundEnabled] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const angleRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastSoundTimeRef = useRef(0);

  // Spinner configurations
  const spinners: SpinnerConfig[] = [
    { id: 'center', x: 0.5, y: 0.5, baseAngle: 0, speed: 1, color: '#f43f5e', trailColor: '#881337' },
    { id: 'top', x: 0.5, y: 0.2, baseAngle: 90, speed: 1.2, color: '#22c55e', trailColor: '#14532d' },
    { id: 'right', x: 0.8, y: 0.5, baseAngle: 180, speed: 0.8, color: '#3b82f6', trailColor: '#1e3a8a' },
    { id: 'bottom', x: 0.5, y: 0.8, baseAngle: 270, speed: 1.1, color: '#f59e0b', trailColor: '#78350f' },
    { id: 'left', x: 0.2, y: 0.5, baseAngle: 45, speed: 0.9, color: '#a855f7', trailColor: '#581c87' },
  ];

  // --- Audio ---
  useEffect(() => {
    if (soundEnabled && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, [soundEnabled]);

  const playTick = useCallback(() => {
    if (!soundEnabled || !audioContextRef.current) return;
    const now = Date.now();
    if (now - lastSoundTimeRef.current < 100) return; // Throttle
    lastSoundTimeRef.current = now;

    const ctx = audioContextRef.current;
    const currentTime = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800 + Math.random() * 400, currentTime);
    gain.gain.setValueAtTime(0.01, currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.02);
    osc.start(currentTime);
    osc.stop(currentTime + 0.02);
  }, [soundEnabled]);

  // --- Mouse tracking ---
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!mouseEnabled || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseOffset({ x: x * 50, y: y * 50 });
  }, [mouseEnabled]);

  const handleMouseLeave = useCallback(() => {
    setMouseOffset({ x: 0, y: 0 });
  }, []);

  // --- Canvas Animation ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const drawSpinner = (
      spinner: SpinnerConfig,
      angle: number,
      width: number,
      height: number
    ) => {
      const centerX = spinner.x * width + mouseOffset.x * (spinner.id !== 'center' ? 1 : 0.3);
      const centerY = spinner.y * height + mouseOffset.y * (spinner.id !== 'center' ? 1 : 0.3);
      const radius = Math.min(width, height) * 0.08;
      const currentAngle = angle * spinner.speed + spinner.baseAngle;

      // Draw trail lines
      for (let i = 0; i < trailLength; i++) {
        const trailAngle = currentAngle - i * 15;
        const radians = (trailAngle * Math.PI) / 180;
        const opacity = 1 - (i / trailLength) * 0.9;
        const lineWidth = 3 - (i / trailLength) * 2;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(radians) * radius,
          centerY + Math.sin(radians) * radius
        );
        ctx.strokeStyle = i === 0 ? spinner.color : spinner.trailColor;
        ctx.globalAlpha = opacity;
        ctx.lineWidth = Math.max(lineWidth, 1);
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      ctx.globalAlpha = 1;

      // Draw center dot
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
      ctx.fillStyle = spinner.color;
      ctx.fill();
    };

    const animate = () => {
      if (!canvas || !ctx) return;

      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Clear with fade effect for trails
      ctx.fillStyle = 'rgba(10, 10, 20, 0.3)';
      ctx.fillRect(0, 0, width, height);

      // Draw all spinners
      spinners.forEach(spinner => {
        drawSpinner(spinner, angleRef.current, width, height);
      });

      if (isRunning) {
        angleRef.current += speed * 2;
        if (angleRef.current % 30 < speed * 2) {
          playTick();
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, [isRunning, speed, mouseOffset, trailLength, spinners, playTick]);

  const reset = () => {
    angleRef.current = 0;
    setMouseOffset({ x: 0, y: 0 });
  };

  return (
    <div className="w-full min-h-[650px] bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 rounded-xl border border-violet-900/30 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-violet-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/30 animate-pulse">
              <Zap className="text-violet-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-violet-300 tracking-wide">HYPNOTIC VORTEX</h2>
              <p className="text-xs text-violet-500/70">Animated Spinner Array</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-violet-400/50">
            <MousePointer2 size={14} />
            <span>Move mouse to offset spinners</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Canvas Area */}
        <div className="lg:col-span-2">
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative h-[450px] bg-[#0a0a14] rounded-xl border border-violet-800/30 overflow-hidden cursor-crosshair"
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
            />

            {/* Overlay grid effect */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-5"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(139,92,246,0.3) 1px, transparent 1px)',
                backgroundSize: '30px 30px'
              }}
            />

            {/* Status indicator */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-xs text-slate-500 font-mono">
                {isRunning ? 'ACTIVE' : 'PAUSED'}
              </span>
            </div>

            {/* Mouse offset indicator */}
            {mouseEnabled && (mouseOffset.x !== 0 || mouseOffset.y !== 0) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-violet-800/30"
              >
                <div className="text-xs text-violet-400 font-mono">
                  Offset: ({mouseOffset.x.toFixed(1)}, {mouseOffset.y.toFixed(1)})
                </div>
              </motion.div>
            )}
          </div>

          {/* Playback Controls */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`
                flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all
                ${isRunning
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500/30'
                  : 'bg-violet-500/20 text-violet-300 border border-violet-500/50 hover:bg-violet-500/30'
                }
              `}
            >
              {isRunning ? <Pause size={18} /> : <Play size={18} />}
              {isRunning ? 'PAUSE' : 'PLAY'}
            </button>
            <button
              onClick={reset}
              className="px-4 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>

        {/* Controls Panel */}
        <div className="space-y-4">
          {/* Speed Control */}
          <div className="bg-slate-900/50 rounded-xl border border-violet-800/30 p-4">
            <h3 className="text-sm font-bold text-violet-300 mb-4 flex items-center gap-2">
              <Gauge size={16} />
              ROTATION SPEED
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-violet-400">Speed Multiplier</span>
                <span className="text-violet-200 font-mono">{speed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full accent-violet-500"
              />
              
              <div className="flex gap-2 mt-2">
                {[1, 3, 5, 8].map(s => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${
                      speed === s
                        ? 'bg-violet-500/30 text-violet-300 border border-violet-500/50'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Trail Length */}
          <div className="bg-slate-900/50 rounded-xl border border-violet-800/30 p-4">
            <h3 className="text-sm font-bold text-violet-300 mb-4">TRAIL LENGTH</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-violet-400">Lines per spinner</span>
                <span className="text-violet-200 font-mono">{trailLength}</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={trailLength}
                onChange={(e) => setTrailLength(parseInt(e.target.value))}
                className="w-full accent-violet-500"
              />
            </div>
          </div>

          {/* Mouse Control */}
          <div className="bg-slate-900/50 rounded-xl border border-violet-800/30 p-4">
            <h3 className="text-sm font-bold text-violet-300 mb-4 flex items-center gap-2">
              <MousePointer2 size={16} />
              MOUSE OFFSET
            </h3>
            
            <button
              onClick={() => setMouseEnabled(!mouseEnabled)}
              className={`w-full py-2 rounded-lg font-bold text-sm transition-all ${
                mouseEnabled
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {mouseEnabled ? 'ENABLED' : 'DISABLED'}
            </button>
            
            <p className="text-xs text-violet-500/50 mt-2">
              Move your mouse over the canvas to offset the outer spinners
            </p>
          </div>

          {/* Spinner Legend */}
          <div className="bg-slate-900/50 rounded-xl border border-violet-800/30 p-4">
            <h3 className="text-sm font-bold text-violet-300 mb-3">SPINNER ARRAY</h3>
            <div className="space-y-2">
              {spinners.map(spinner => (
                <div key={spinner.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: spinner.color }}
                    />
                    <span className="text-slate-400 capitalize">{spinner.id}</span>
                  </div>
                  <span className="text-slate-500 font-mono">{spinner.speed}x</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-violet-800/30">
        <summary className="px-4 py-3 cursor-pointer text-sm text-violet-400 hover:text-violet-300 transition-colors">
          How do animated spinners work?
        </summary>
        <div className="px-4 pb-4 text-xs text-violet-500 space-y-2">
          <p>
            Each <span className="text-violet-300">spinner</span> is created by drawing radius lines 
            from a center point, rotating the angle over time to create the illusion of motion.
          </p>
          <p>
            The <span className="text-violet-300">trail effect</span> is achieved by drawing multiple 
            lines at decreasing opacity, creating a smooth motion blur appearance.
          </p>
          <p>
            <span className="text-violet-300">Mouse offset</span> adds interactivity by shifting the 
            outer spinners based on cursor position, creating a parallax-like effect.
          </p>
        </div>
      </details>
    </div>
  );
}
