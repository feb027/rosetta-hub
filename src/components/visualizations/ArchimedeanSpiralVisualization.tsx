import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Compass, Settings, Sparkles } from 'lucide-react';

// --- Spiral Drawing ---
interface SpiralParams {
  a: number;
  b: number;
  turns: number;
  color: string;
}

const drawSpiral = (
  ctx: CanvasRenderingContext2D,
  params: SpiralParams,
  progress: number,
  centerX: number,
  centerY: number,
  scale: number
) => {
  const { a, b, turns, color } = params;
  const maxTheta = turns * 2 * Math.PI * progress;
  const steps = Math.floor(1000 * progress);

  if (steps < 2) return;

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';

  for (let i = 0; i <= steps; i++) {
    const theta = (i / 1000) * turns * 2 * Math.PI;
    if (theta > maxTheta) break;

    const r = (a + b * theta) * scale;
    const x = centerX + r * Math.cos(theta);
    const y = centerY - r * Math.sin(theta);

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  // Draw current point
  if (progress > 0) {
    const theta = maxTheta;
    const r = (a + b * theta) * scale;
    const x = centerX + r * Math.cos(theta);
    const y = centerY - r * Math.sin(theta);

    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
};

const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const centerX = width / 2;
  const centerY = height / 2;

  ctx.strokeStyle = 'rgba(100, 116, 139, 0.2)';
  ctx.lineWidth = 1;

  for (let r = 30; r < Math.max(width, height); r += 30) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, r, 0, 2 * Math.PI);
    ctx.stroke();
  }

  for (let angle = 0; angle < 360; angle += 30) {
    const rad = (angle * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(rad) * Math.max(width, height),
      centerY - Math.sin(rad) * Math.max(width, height)
    );
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(width, centerY);
  ctx.moveTo(centerX, 0);
  ctx.lineTo(centerX, height);
  ctx.stroke();
};

const PRESETS: Array<{ name: string; a: number; b: number; turns: number }> = [
  { name: 'Classic', a: 0, b: 5, turns: 6 },
  { name: 'Tight Coil', a: 0, b: 2, turns: 10 },
  { name: 'Loose Spiral', a: 10, b: 12, turns: 4 },
  { name: 'Offset Start', a: 30, b: 5, turns: 5 },
  { name: 'Nautilus-like', a: 5, b: 8, turns: 3 },
];

export default function ArchimedeanSpiralVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [progress, setProgress] = useState(1);
  const [a, setA] = useState(0);
  const [b, setB] = useState(5);
  const [turns, setTurns] = useState(6);
  const [showGrid, setShowGrid] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number>(0);
  const isAnimatingRef = useRef(false);

  // Keep ref in sync
  useEffect(() => {
    isAnimatingRef.current = isAnimating;
  }, [isAnimating]);

  const playSound = useCallback(
    (type: 'draw' | 'complete' | 'click', prog = 0) => {
      if (!soundEnabled) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;

      if (type === 'draw') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200 + prog * 600, now);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'complete') {
        const freqs = [523, 659, 784, 1047];
        freqs.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.1);
          gain.gain.setValueAtTime(0.08, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + i * 0.1);
          osc.start(now + i * 0.1);
          osc.stop(now + 0.6 + i * 0.1);
        });
      } else if (type === 'click') {
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
      }
    },
    [soundEnabled]
  );

  const draw = useCallback(
    (prog: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      if (showGrid) {
        drawGrid(ctx, width, height);
      }

      const maxR = a + b * turns * 2 * Math.PI;
      const maxDim = Math.min(width, height) / 2 - 20;
      const scale = maxDim / maxR;

      drawSpiral(ctx, { a, b, turns, color: '#14b8a6' }, prog, centerX, centerY, scale);

      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#f97316';
      ctx.fill();
    },
    [a, b, turns, showGrid]
  );

  // Animation loop - runs independently
  const startAnimationLoop = useCallback(() => {
    const startTime = performance.now();
    const duration = 3000;

    const animate = (timestamp: number) => {
      if (!isAnimatingRef.current) return;

      const elapsed = timestamp - startTime;
      const newProgress = Math.min(elapsed / duration, 1);

      setProgress(newProgress);
      draw(newProgress);

      if (newProgress < 1) {
        if (Math.random() < 0.1) playSound('draw', newProgress);
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        playSound('complete');
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [draw, playSound]);

  // Redraw when params change (not animating)
  useEffect(() => {
    if (!isAnimating) {
      draw(progress);
    }
  }, [draw, progress, isAnimating]);

  // Canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const container = canvas.parentElement;
      if (!container) return;
      const size = Math.min(container.clientWidth - 32, 500);
      canvas.width = size;
      canvas.height = size;
      draw(progress);
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [draw, progress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  const startAnimation = () => {
    cancelAnimationFrame(animationRef.current);
    setProgress(0);
    setIsAnimating(true);
    isAnimatingRef.current = true;
    setTimeout(() => startAnimationLoop(), 0);
  };

  const pauseAnimation = () => {
    cancelAnimationFrame(animationRef.current);
    setIsAnimating(false);
    isAnimatingRef.current = false;
  };

  const reset = () => {
    cancelAnimationFrame(animationRef.current);
    setIsAnimating(false);
    isAnimatingRef.current = false;
    setProgress(1);
  };

  const applyPreset = (index: number) => {
    const preset = PRESETS[index];
    setA(preset.a);
    setB(preset.b);
    setTurns(preset.turns);
    setSelectedPreset(index);
    setProgress(1);
    playSound('click');
  };

  const currentTheta = progress * turns * 2 * Math.PI;
  const currentR = a + b * currentTheta;

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-xl border border-teal-900/50 font-sans overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-teal-800/50 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/20 border border-teal-500/50">
              <Compass className="text-teal-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-teal-300 tracking-wide">SPIRAL FORGE</h2>
              <p className="text-xs text-teal-500/70">Archimedean Spiral Generator</p>
            </div>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
              soundEnabled
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50'
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}
          >
            {soundEnabled ? '🔊 Sound On' : '🔇 Sound Off'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Canvas Container */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-4">
          <div className="flex justify-center mb-4">
            <canvas ref={canvasRef} className="rounded-lg" style={{ maxWidth: '100%' }} />
          </div>

          {/* Stats below canvas */}
          <div className="flex justify-between items-center px-2">
            <div className="bg-slate-800/80 rounded-lg px-3 py-2 border border-slate-700/50">
              <div className="text-xs text-slate-500">θ = {(currentTheta / Math.PI).toFixed(2)}π</div>
              <div className="text-xs text-teal-400">r = {currentR.toFixed(1)}</div>
            </div>

            <div className="bg-slate-800/80 rounded-lg px-3 py-2 border border-slate-700/50">
              <div className="text-sm font-mono text-orange-400">r = {a} + {b}θ</div>
            </div>

            <div className="bg-slate-800/80 rounded-lg px-3 py-2 border border-slate-700/50">
              <div className="text-xs text-slate-500">Progress</div>
              <div className="text-xs text-cyan-400">{(progress * 100).toFixed(0)}%</div>
            </div>
          </div>
        </div>

        {/* Presets */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-4">
          <div className="text-xs text-slate-500 mb-3 flex items-center gap-2">
            <Sparkles size={12} className="text-orange-400" />
            PRESETS
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => applyPreset(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedPreset === idx
                    ? 'bg-teal-500/30 text-teal-300 border border-teal-500/50'
                    : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-teal-500/30'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Parameters */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-4">
          <div className="text-xs text-slate-500 mb-4 flex items-center gap-2">
            <Settings size={12} className="text-teal-400" />
            PARAMETERS
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-400">a (start radius)</span>
                <span className="text-orange-400 font-mono">{a}</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={a}
                onChange={(e) => {
                  setA(Number(e.target.value));
                  setProgress(1);
                }}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-400">b (growth rate)</span>
                <span className="text-orange-400 font-mono">{b}</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={b}
                onChange={(e) => {
                  setB(Number(e.target.value));
                  setProgress(1);
                }}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-400">Turns</span>
                <span className="text-orange-400 font-mono">{turns}</span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                value={turns}
                onChange={(e) => {
                  setTurns(Number(e.target.value));
                  setProgress(1);
                }}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                showGrid
                  ? 'bg-slate-700 text-slate-300 border border-slate-600'
                  : 'bg-slate-800/50 text-slate-500 border border-slate-700/50'
              }`}
            >
              {showGrid ? '◉ Grid On' : '○ Grid Off'}
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <button
            onClick={isAnimating ? pauseAnimation : startAnimation}
            className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
              isAnimating
                ? 'bg-orange-500/30 text-orange-300 border border-orange-500/50'
                : 'bg-teal-500/20 text-teal-300 border border-teal-500/50 hover:bg-teal-500/30'
            }`}
          >
            {isAnimating ? <Pause size={18} /> : <Play size={18} />}
            {isAnimating ? 'PAUSE' : 'ANIMATE SPIRAL'}
          </button>
          <button
            onClick={reset}
            className="px-4 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-4 text-center">
            <div className="text-2xl font-bold text-teal-400">{turns}</div>
            <div className="text-xs text-slate-500">Total Turns</div>
          </div>
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-4 text-center">
            <div className="text-2xl font-bold text-orange-400">{(2 * Math.PI * b).toFixed(1)}</div>
            <div className="text-xs text-slate-500">Gap per Turn</div>
          </div>
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-4 text-center">
            <div className="text-2xl font-bold text-cyan-400">{(a + b * turns * 2 * Math.PI).toFixed(0)}</div>
            <div className="text-xs text-slate-500">Final Radius</div>
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-700/50">
        <summary className="px-4 py-3 cursor-pointer text-sm text-teal-400 hover:text-teal-300 transition-colors">
          About Archimedean Spirals
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            The <span className="text-teal-300">Archimedean spiral</span> is defined by the polar equation
            <span className="text-orange-300 font-mono"> r = a + bθ</span>.
          </p>
          <p>
            <span className="text-orange-300">a</span> determines where the spiral starts (distance from center at θ=0).
          </p>
          <p>
            <span className="text-orange-300">b</span> controls the spacing between turns - larger values create looser
            spirals.
          </p>
          <p className="text-slate-500 italic">
            Unlike logarithmic spirals found in nature (nautilus shells), Archimedean spirals have constant spacing
            between turns.
          </p>
        </div>
      </details>
    </div>
  );
}
