import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, X, Minus, Divide, RotateCcw, FlipHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface Complex {
  re: number;
  im: number;
}

type Operation = 'add' | 'multiply' | 'negate' | 'invert' | 'conjugate';

// --- Complex number operations ---
const add = (a: Complex, b: Complex): Complex => ({ re: a.re + b.re, im: a.im + b.im });
const multiply = (a: Complex, b: Complex): Complex => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
});
const negate = (a: Complex): Complex => ({ re: -a.re, im: -a.im });
const invert = (a: Complex): Complex => {
  const denom = a.re * a.re + a.im * a.im;
  if (denom === 0) return { re: 0, im: 0 };
  return { re: a.re / denom, im: -a.im / denom };
};
const conjugate = (a: Complex): Complex => ({ re: a.re, im: -a.im });

const formatComplex = (c: Complex): string => {
  const re = c.re.toFixed(2).replace(/\.00$/, '');
  const im = Math.abs(c.im).toFixed(2).replace(/\.00$/, '');
  if (c.im === 0) return re;
  if (c.re === 0) return c.im < 0 ? `-${im}i` : `${im}i`;
  return c.im < 0 ? `${re} - ${im}i` : `${re} + ${im}i`;
};

// --- Component ---
export default function ArithmeticComplexVisualization() {
  const [numA, setNumA] = useState<Complex>({ re: 3, im: 2 });
  const [numB, setNumB] = useState<Complex>({ re: 1, im: -1 });
  const [operation, setOperation] = useState<Operation>('add');
  const [result, setResult] = useState<Complex | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio
  useEffect(() => {
    if (soundEnabled && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
  }, [soundEnabled]);

  // Play sounds
  const playSound = useCallback((type: 'click' | 'compute' | 'success') => {
    if (!soundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const currentTime = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    switch (type) {
      case 'click':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, currentTime);
        gain.gain.setValueAtTime(0.03, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.05);
        break;
      case 'compute':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.15);
        break;
      case 'success':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, currentTime);
        osc.frequency.setValueAtTime(659, currentTime + 0.1);
        gain.gain.setValueAtTime(0.06, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.2);
        break;
    }
    osc.start(currentTime);
    osc.stop(currentTime + 0.3);
  }, [soundEnabled]);

  // Compute result
  useEffect(() => {
    let res: Complex;
    switch (operation) {
      case 'add':
        res = add(numA, numB);
        break;
      case 'multiply':
        res = multiply(numA, numB);
        break;
      case 'negate':
        res = negate(numA);
        break;
      case 'invert':
        res = invert(numA);
        break;
      case 'conjugate':
        res = conjugate(numA);
        break;
    }
    setResult(res);
  }, [numA, numB, operation]);

  // Draw complex plane
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 30;

    // Clear
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Grid
    if (showGrid) {
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x <= width; x += scale) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += scale) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    // Axes
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '12px monospace';
    ctx.fillText('Re', width - 25, centerY - 8);
    ctx.fillText('Im', centerX + 8, 15);

    // Draw vector function
    const drawVector = (c: Complex, color: string, label: string, dashed = false) => {
      const x = centerX + c.re * scale;
      const y = centerY - c.im * scale;

      // Line
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      if (dashed) ctx.setLineDash([5, 5]);
      else ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Arrowhead
      const angle = Math.atan2(centerY - y, x - centerX);
      const arrowLen = 10;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - arrowLen * Math.cos(angle - 0.3), y + arrowLen * Math.sin(angle - 0.3));
      ctx.moveTo(x, y);
      ctx.lineTo(x - arrowLen * Math.cos(angle + 0.3), y + arrowLen * Math.sin(angle + 0.3));
      ctx.stroke();

      // Point
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = color;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(label, x + 10, y - 10);
    };

    // Draw vectors
    drawVector(numA, '#06b6d4', 'A'); // cyan
    if (operation === 'add' || operation === 'multiply') {
      drawVector(numB, '#f59e0b', 'B'); // amber
    }
    if (result) {
      drawVector(result, '#10b981', 'R', true); // emerald, dashed
    }

  }, [numA, numB, result, showGrid, operation]);

  const operations: { id: Operation; label: string; icon: React.ReactNode; desc: string; formula: string }[] = [
    { id: 'add', label: 'Add', icon: <Plus size={16} />, desc: 'A + B', formula: '(a+c) + (b+d)i' },
    { id: 'multiply', label: 'Multiply', icon: <X size={16} />, desc: 'A × B', formula: '(ac-bd) + (ad+bc)i' },
    { id: 'negate', label: 'Negate', icon: <Minus size={16} />, desc: '-A', formula: '-a - bi' },
    { id: 'invert', label: 'Invert', icon: <Divide size={16} />, desc: '1/A', formula: 'a/(a²+b²) - b/(a²+b²)i' },
    { id: 'conjugate', label: 'Conjugate', icon: <FlipHorizontal size={16} />, desc: 'A*', formula: 'a - bi' },
  ];

  const presets = [
    { label: '3+2i, 1-i', a: { re: 3, im: 2 }, b: { re: 1, im: -1 } },
    { label: '1+i, 1+i', a: { re: 1, im: 1 }, b: { re: 1, im: 1 } },
    { label: '0+i, 0+i', a: { re: 0, im: 1 }, b: { re: 0, im: 1 } },
    { label: '2+0i, 0+2i', a: { re: 2, im: 0 }, b: { re: 0, im: 2 } },
  ];

  return (
    <div className="w-full min-h-[750px] bg-gradient-to-br from-slate-950 via-cyan-950/10 to-slate-950 rounded-xl border border-cyan-900/30 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-cyan-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
              <span className="text-cyan-400 font-bold text-xl">ℂ</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-cyan-300 tracking-wide">COMPLEX PLANE NAVIGATOR</h2>
              <p className="text-xs text-cyan-500/70">Interactive Complex Arithmetic</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                showGrid
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-slate-800 text-slate-500 border border-slate-700'
              }`}
            >
              Grid
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        
        {/* Complex Plane Canvas */}
        <div className="bg-slate-900/50 rounded-xl border border-cyan-800/30 p-4">
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            className="w-full rounded-lg"
            style={{ maxHeight: '400px' }}
          />
          <div className="flex justify-center gap-6 mt-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-500" />
              <span className="text-slate-400">A = {formatComplex(numA)}</span>
            </div>
            {(operation === 'add' || operation === 'multiply') && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-slate-400">B = {formatComplex(numB)}</span>
              </div>
            )}
            {result && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-400">R = {formatComplex(result)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Number A Input */}
          <div className="bg-slate-900/50 rounded-xl border border-cyan-800/30 p-4">
            <h3 className="text-sm font-bold text-cyan-300 mb-3">COMPLEX A</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-sm w-8">Re:</span>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="0.5"
                  value={numA.re}
                  onChange={(e) => { setNumA({ ...numA, re: parseFloat(e.target.value) }); playSound('click'); }}
                  className="flex-1 accent-cyan-500"
                />
                <span className="text-cyan-400 font-mono w-10 text-right">{numA.re}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-sm w-8">Im:</span>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="0.5"
                  value={numA.im}
                  onChange={(e) => { setNumA({ ...numA, im: parseFloat(e.target.value) }); playSound('click'); }}
                  className="flex-1 accent-cyan-500"
                />
                <span className="text-cyan-400 font-mono w-10 text-right">{numA.im}i</span>
              </div>
              <div className="text-center text-lg font-mono text-cyan-300 bg-slate-800/50 rounded-lg py-2">
                A = {formatComplex(numA)}
              </div>
            </div>
          </div>

          {/* Number B Input */}
          <div className={`bg-slate-900/50 rounded-xl border p-4 transition-all ${
            operation === 'add' || operation === 'multiply'
              ? 'border-amber-800/30'
              : 'border-slate-700/30 opacity-50'
          }`}>
            <h3 className="text-sm font-bold text-amber-300 mb-3">COMPLEX B</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-sm w-8">Re:</span>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="0.5"
                  value={numB.re}
                  onChange={(e) => { setNumB({ ...numB, re: parseFloat(e.target.value) }); playSound('click'); }}
                  disabled={operation !== 'add' && operation !== 'multiply'}
                  className="flex-1 accent-amber-500"
                />
                <span className="text-amber-400 font-mono w-10 text-right">{numB.re}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-sm w-8">Im:</span>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="0.5"
                  value={numB.im}
                  onChange={(e) => { setNumB({ ...numB, im: parseFloat(e.target.value) }); playSound('click'); }}
                  disabled={operation !== 'add' && operation !== 'multiply'}
                  className="flex-1 accent-amber-500"
                />
                <span className="text-amber-400 font-mono w-10 text-right">{numB.im}i</span>
              </div>
              <div className="text-center text-lg font-mono text-amber-300 bg-slate-800/50 rounded-lg py-2">
                B = {formatComplex(numB)}
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="bg-slate-900/50 rounded-xl border border-emerald-800/30 p-4">
            <h3 className="text-sm font-bold text-emerald-300 mb-3">RESULT</h3>
            <AnimatePresence mode="wait">
              {result && (
                <motion.div
                  key={formatComplex(result)}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="space-y-3"
                >
                  <div className="text-center text-2xl font-mono text-emerald-400 bg-slate-800/50 rounded-lg py-4">
                    {formatComplex(result)}
                  </div>
                  <div className="text-xs text-slate-500 text-center">
                    |R| = {Math.sqrt(result.re ** 2 + result.im ** 2).toFixed(3)}
                  </div>
                  <div className="text-xs text-slate-500 text-center">
                    θ = {(Math.atan2(result.im, result.re) * 180 / Math.PI).toFixed(1)}°
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Operations */}
        <div className="bg-slate-900/50 rounded-xl border border-cyan-800/30 p-4">
          <h3 className="text-sm font-bold text-cyan-300 mb-3">OPERATIONS</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {operations.map(op => (
              <button
                key={op.id}
                onClick={() => { setOperation(op.id); playSound('compute'); }}
                className={`p-3 rounded-lg text-sm font-bold transition-all flex flex-col items-center gap-1 ${
                  operation === op.id
                    ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center gap-1">
                  {op.icon}
                  <span>{op.label}</span>
                </div>
                <span className="text-xs text-slate-500">{op.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap justify-center gap-2">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => { setNumA(preset.a); setNumB(preset.b); playSound('click'); }}
              className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
            >
              {preset.label}
            </button>
          ))}
          <button
            onClick={() => { setNumA({ re: 3, im: 2 }); setNumB({ re: 1, im: -1 }); setOperation('add'); }}
            className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
          >
            <RotateCcw size={12} className="inline mr-1" />
            Reset
          </button>
        </div>

        {/* Sound Toggle */}
        <div className="flex justify-center">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              soundEnabled
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}
          >
            Sound: {soundEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Explanation */}
        <details className="bg-slate-900/50 rounded-xl border border-cyan-800/30">
          <summary className="px-4 py-3 cursor-pointer text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
            What are Complex Numbers?
          </summary>
          <div className="px-4 pb-4 text-xs text-cyan-500 space-y-3">
            <p>
              A <span className="text-cyan-300">complex number</span> has the form a + bi, where 
              a is the real part, b is the imaginary part, and i = √-1.
            </p>
            <div className="grid grid-cols-2 gap-2 text-slate-400">
              <div className="bg-slate-800/50 rounded p-2">
                <div className="text-cyan-300">Addition</div>
                <div>(a+bi) + (c+di) = (a+c) + (b+d)i</div>
              </div>
              <div className="bg-slate-800/50 rounded p-2">
                <div className="text-cyan-300">Multiplication</div>
                <div>(a+bi)(c+di) = (ac-bd) + (ad+bc)i</div>
              </div>
              <div className="bg-slate-800/50 rounded p-2">
                <div className="text-cyan-300">Conjugate</div>
                <div>conj(a+bi) = a - bi</div>
              </div>
              <div className="bg-slate-800/50 rounded p-2">
                <div className="text-cyan-300">Inverse</div>
                <div>1/(a+bi) = conj/(|z|²)</div>
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
