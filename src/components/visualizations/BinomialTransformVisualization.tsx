import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Calculator, ArrowRight, ArrowLeft, Volume2, VolumeX, Sigma, Grid3X3, Eye, EyeOff, Play, BookOpen, FunctionSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function binomial(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = result * (n - i) / (i + 1);
  }
  return Math.round(result);
}

const PRESETS = {
  catalan: [1, 1, 2, 5, 14, 42, 132, 429, 1430, 4862],
  primes: [0, 1, 1, 0, 1, 0, 1, 0, 0, 0],
  fibonacci: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34],
  powers2: [1, 2, 4, 8, 16, 32, 64, 128, 256, 512],
  natural: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
};

const PRESET_NAMES: Record<string, string> = {
  catalan: 'Catalan',
  primes: 'Primes',
  fibonacci: 'Fibonacci',
  powers2: 'Powers of 2',
  natural: 'Natural',
};

export default function BinomialTransformVisualization() {
  const [sequence, setSequence] = useState<number[]>(PRESETS.catalan);
  const [mode, setMode] = useState<'forward' | 'inverse'>('forward');
  const [result, setResult] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showTriangle, setShowTriangle] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [hoveredCell, setHoveredCell] = useState<{row: number; col: number} | null>(null);
  const [matrixAnimation, setMatrixAnimation] = useState<{phase: 'row' | 'calc' | 'write' | null; row: number}>({ phase: null, row: -1 });

  const audioContextRef = useRef<AudioContext | null>(null);

  const playSound = useCallback((type: 'calc' | 'complete' | 'tick') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'calc') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600 + Math.random() * 200, now);
      gain.gain.setValueAtTime(0.03, now);
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
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.05, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4 + i * 0.08);
        osc.start(now + i * 0.08);
        osc.stop(now + 0.5 + i * 0.08);
      });
    } else if (type === 'tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.start(now);
      osc.stop(now + 0.03);
    }
  }, [soundEnabled]);

  const transform = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setResult([]);
    setCurrentStep(-1);

    const newResult: number[] = [];
    const maxN = Math.min(sequence.length, 6);

    for (let n = 0; n < maxN; n++) {
      setCurrentStep(n);
      setMatrixAnimation({ phase: 'row', row: n });
      playSound('tick');
      await new Promise(resolve => setTimeout(resolve, 150));

      let sum = 0;
      const calculations: {k: number; coeff: number; sign: number; value: number; term: number}[] = [];

      for (let k = 0; k <= n; k++) {
        const coeff = binomial(n, k);
        const sign = mode === 'forward' ? 1 : Math.pow(-1, n - k);
        const term = sign * coeff * sequence[k];
        sum += term;
        calculations.push({ k, coeff, sign, value: sequence[k], term });
        playSound('calc');
        setMatrixAnimation({ phase: 'calc', row: n });
        await new Promise(resolve => setTimeout(resolve, 80));
      }

      setMatrixAnimation({ phase: 'write', row: n });
      newResult.push(sum);
      setResult([...newResult]);
      playSound('tick');
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setMatrixAnimation({ phase: null, row: -1 });
    playSound('complete');
    setIsProcessing(false);
    setCurrentStep(-1);
  };

  const pascalTriangle = useMemo(() => {
    const maxRows = 8;
    const triangle: number[][] = [];
    for (let i = 0; i < maxRows; i++) {
      const row: number[] = [];
      for (let j = 0; j <= i; j++) {
        row.push(binomial(i, j));
      }
      triangle.push(row);
    }
    return triangle;
  }, []);

  const matrix = useMemo(() => {
    const size = Math.min(sequence.length, 6);
    const m: number[][] = [];
    for (let n = 0; n < size; n++) {
      const row: number[] = [];
      for (let k = 0; k < size; k++) {
        if (k > n) {
          row.push(0);
        } else {
          const coeff = binomial(n, k);
          const sign = mode === 'forward' ? 1 : Math.pow(-1, n - k);
          row.push(sign * coeff);
        }
      }
      m.push(row);
    }
    return m;
  }, [sequence.length, mode]);

  const maxCoefficient = useMemo(() => {
    let max = 0;
    for (let i = 0; i < pascalTriangle.length; i++) {
      for (let j = 0; j < pascalTriangle[i].length; j++) {
        max = Math.max(max, pascalTriangle[i][j]);
      }
    }
    return max;
  }, [pascalTriangle]);

  const getCoefficientColor = (value: number) => {
    const intensity = Math.min(value / maxCoefficient, 1);
    return `rgba(139, 92, 246, ${0.2 + intensity * 0.5})`;
  };

  const getMatrixCellColor = (value: number) => {
    if (value === 0) return 'rgba(30, 41, 59, 0.5)';
    const absValue = Math.abs(value);
    const intensity = Math.min(absValue / 10, 1);
    const isPositive = value > 0;
    return isPositive 
      ? `rgba(139, 92, 246, ${0.3 + intensity * 0.4})`
      : `rgba(239, 68, 68, ${0.3 + intensity * 0.4})`;
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/20 rounded-xl border border-slate-800/60 font-sans overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900/60 backdrop-blur-sm border-b border-slate-800/60 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <motion.div 
              className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <FunctionSquare className="text-purple-400" size={26} />
            </motion.div>
            <div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent tracking-wide font-mono">BINOMIAL TRANSFORM</h2>
              <p className="text-xs text-slate-500">Sequence Transformation via Pascal's Triangle</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMatrix(!showMatrix)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                showMatrix ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              <Grid3X3 size={14} />
              Matrix
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowTriangle(!showTriangle)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                showTriangle ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              <Sigma size={14} />
              Pascal's △
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowDetails(!showDetails)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                showDetails ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {showDetails ? <Eye size={14} /> : <EyeOff size={14} />}
              Steps
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled ? 'bg-purple-500/15 border-purple-500/40 text-purple-300' : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </motion.button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Presets */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {Object.entries(PRESETS).map(([key, values]) => (
            <motion.button
              key={key}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSequence(values);
                setResult([]);
                playSound('tick');
              }}
              className={`px-3 py-2.5 rounded-lg text-xs font-medium border transition-all capitalize ${
                JSON.stringify(sequence) === JSON.stringify(values)
                  ? 'bg-purple-500/25 text-purple-300 border-purple-500/50'
                  : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:border-purple-500/30 hover:bg-slate-800/60'
              }`}
            >
              {PRESET_NAMES[key]}
            </motion.button>
          ))}
        </div>

        {/* Formula Display */}
        <div className="bg-gradient-to-r from-slate-900/60 to-slate-800/30 rounded-xl border border-slate-800/60 p-4">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="text-slate-500 text-sm font-mono">b(n) =</div>
            <div className="flex flex-col items-center">
              <span className="text-purple-400 text-lg">n</span>
              <div className="border-t border-slate-600 w-8"></div>
              <span className="text-slate-500 text-sm">Σ</span>
              <span className="text-slate-500 text-xs">k=0</span>
            </div>
            <div className="flex items-center gap-1 text-sm font-mono">
              <span className="text-slate-400">(</span>
              <span className="text-purple-400">n</span>
              <span className="text-slate-600">/</span>
              <span className="text-purple-400">k</span>
              <span className="text-slate-400">)</span>
              <span className="text-indigo-400">×</span>
              {mode === 'inverse' && <span className="text-red-400">(-1)</span>}
              {mode === 'inverse' && <span className="text-red-400/70 text-xs">^(n-k)</span>}
              <span className="text-emerald-400">×</span>
              <span className="text-emerald-400">a(k)</span>
            </div>
          </div>
        </div>

        {/* Input Sequence */}
        <div className="bg-slate-900/40 rounded-xl border border-slate-800/60 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500/50"></div>
            <div className="text-sm text-slate-400 font-medium">Input Sequence a(n)</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {sequence.slice(0, 8).map((n, i) => (
              <motion.div
                key={i}
                className="relative"
                whileHover={{ scale: 1.05 }}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-600 font-mono">
                  n={i}
                </div>
                <input
                  type="number"
                  value={n}
                  onChange={(e) => {
                    const newSeq = [...sequence];
                    newSeq[i] = parseInt(e.target.value) || 0;
                    setSequence(newSeq);
                    setResult([]);
                  }}
                  className="w-14 h-12 px-2 bg-slate-800 border border-slate-700 rounded-lg text-emerald-400 font-mono text-sm text-center focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mode Selection */}
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setMode('forward'); setResult([]); playSound('tick'); }}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 border ${
              mode === 'forward' 
                ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border-purple-500/50 shadow-lg shadow-purple-500/10' 
                : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:border-purple-500/30'
            }`}
          >
            <ArrowRight size={18} />
            <span className="font-bold">Forward Transform</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setMode('inverse'); setResult([]); playSound('tick'); }}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 border ${
              mode === 'inverse' 
                ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border-purple-500/50 shadow-lg shadow-purple-500/10' 
                : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:border-purple-500/30'
            }`}
          >
            <ArrowLeft size={18} />
            <span className="font-bold">Inverse Transform</span>
          </motion.button>
        </div>

        {/* Transform Button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={transform}
          disabled={isProcessing}
          className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-purple-500/20 text-purple-300 border border-purple-500/40 hover:from-purple-500/30 hover:via-indigo-500/30 hover:to-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/5"
        >
          {isProcessing ? (
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Calculator size={20} />
            </motion.div>
          ) : (
            <Play size={20} className="fill-current" />
          )}
          <span>{isProcessing ? 'Computing Transform...' : 'COMPUTE TRANSFORM'}</span>
        </motion.button>

        {/* Result */}
        <AnimatePresence>
          {result.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-gradient-to-br from-purple-900/30 to-indigo-900/20 rounded-xl border border-purple-500/40 p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-purple-500/40 border border-purple-500/60"></div>
                <div className="text-sm text-purple-400 font-medium">Result Sequence b(n)</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.map((n, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, delay: i * 0.03 }}
                    className="relative"
                  >
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] text-purple-500/70 font-mono">
                      n={i}
                    </div>
                    <div className="w-16 h-12 flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-lg text-purple-300 font-mono text-sm font-bold border border-purple-500/30">
                      {n}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Matrix View */}
        <AnimatePresence>
          {showMatrix && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-slate-900/40 rounded-xl border border-slate-800/60 p-4 overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-4">
                <Grid3X3 size={16} className="text-slate-500" />
                <div className="text-sm text-slate-400 font-medium">Transformation Matrix (b = M × a)</div>
              </div>
              <div className="overflow-x-auto">
                <div className="flex items-start gap-4">
                  {/* Matrix */}
                  <div className="flex flex-col gap-1">
                    <div className="text-center text-xs text-slate-600 mb-1 font-mono">M</div>
                    {matrix.map((row, i) => (
                      <motion.div 
                        key={i} 
                        className="flex gap-1"
                        animate={matrixAnimation.row === i && matrixAnimation.phase === 'row' ? {
                          backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        } : {}}
                      >
                        {row.map((val, j) => (
                          <motion.div
                            key={j}
                            onHoverStart={() => setHoveredCell({row: i, col: j})}
                            onHoverEnd={() => setHoveredCell(null)}
                            animate={matrixAnimation.row === i && j <= i ? {
                              scale: matrixAnimation.phase === 'calc' ? [1, 1.1, 1] : 1,
                            } : {}}
                            className="w-10 h-10 flex items-center justify-center rounded text-[10px] font-mono cursor-pointer transition-all"
                            style={{ 
                              backgroundColor: getMatrixCellColor(val),
                              color: val === 0 ? 'rgba(100, 116, 139, 0.5)' : val > 0 ? 'rgba(167, 139, 250, 1)' : 'rgba(248, 113, 113, 1)',
                              boxShadow: hoveredCell?.row === i && hoveredCell?.col === j ? '0 0 10px rgba(139, 92, 246, 0.5)' : 'none',
                            }}
                          >
                            {val !== 0 ? val : ''}
                          </motion.div>
                        ))}
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Times sign */}
                  <div className="flex items-center h-full pt-6">
                    <span className="text-slate-500 text-lg">×</span>
                  </div>
                  
                  {/* Input Vector */}
                  <div className="flex flex-col gap-1">
                    <div className="text-center text-xs text-emerald-600/70 mb-1 font-mono">a</div>
                    {sequence.slice(0, 6).map((val, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 flex items-center justify-center bg-emerald-500/10 rounded text-[10px] font-mono text-emerald-400 border border-emerald-500/20"
                      >
                        {val}
                      </div>
                    ))}
                  </div>
                  
                  {/* Equals sign */}
                  <div className="flex items-center h-full pt-6">
                    <span className="text-slate-500 text-lg">=</span>
                  </div>
                  
                  {/* Result Vector */}
                  <div className="flex flex-col gap-1">
                    <div className="text-center text-xs text-purple-500/70 mb-1 font-mono">b</div>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <motion.div
                        key={i}
                        animate={matrixAnimation.row === i && matrixAnimation.phase === 'write' ? {
                          backgroundColor: 'rgba(139, 92, 246, 0.3)',
                          scale: [1, 1.1, 1],
                        } : {}}
                        className={`w-10 h-10 flex items-center justify-center rounded text-[10px] font-mono border transition-all ${
                          i < result.length
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            : 'bg-slate-800/50 text-slate-600 border-slate-700/50'
                        }`}
                      >
                        {i < result.length ? result[i] : '?'}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex gap-4 mt-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-purple-500/30"></div>
                  <span>Positive</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-red-500/30"></div>
                  <span>Negative</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-slate-800"></div>
                  <span>Zero</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pascal's Triangle */}
        <AnimatePresence>
          {showTriangle && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-slate-900/40 rounded-xl border border-slate-800/60 p-4 overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-4">
                <Sigma size={16} className="text-slate-500" />
                <div className="text-sm text-slate-400 font-medium">Pascal's Triangle - Binomial Coefficients</div>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                {pascalTriangle.map((row, i) => (
                  <div key={i} className="flex gap-1.5">
                    {row.map((n, j) => {
                      const isHovered = hoveredCell?.row === i && hoveredCell?.col === j;
                      return (
                        <motion.div
                          key={j}
                          initial={{ scale: 0 }}
                          animate={{ 
                            scale: 1,
                            backgroundColor: isHovered ? 'rgba(139, 92, 246, 0.5)' : getCoefficientColor(n),
                          }}
                          transition={{ delay: (i * 0.05) + (j * 0.02) }}
                          onHoverStart={() => setHoveredCell({row: i, col: j})}
                          onHoverEnd={() => setHoveredCell(null)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg text-xs font-mono cursor-pointer transition-all"
                          style={{ 
                            color: n > maxCoefficient * 0.5 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(139, 92, 246, 0.9)',
                            boxShadow: isHovered ? '0 0 12px rgba(139, 92, 246, 0.5)' : 'none',
                          }}
                        >
                          {n}
                        </motion.div>
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="text-center text-xs text-slate-600 mt-3">
                C(n,k) = (n k) = n!/(k!(n-k)!)
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step-by-step Details */}
        <AnimatePresence>
          {showDetails && isProcessing && currentStep >= 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20 rounded-xl border border-indigo-500/30 p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={16} className="text-indigo-400" />
                <div className="text-sm text-indigo-300 font-medium">
                  Step-by-Step Calculation for b({currentStep})
                </div>
              </div>
              <div className="space-y-2">
                {Array.from({ length: currentStep + 1 }, (_, k) => {
                  const coeff = binomial(currentStep, k);
                  const sign = mode === 'forward' ? 1 : Math.pow(-1, currentStep - k);
                  const value = sequence[k];
                  const term = sign * coeff * value;
                  return (
                    <motion.div
                      key={k}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: k * 0.05 }}
                      className="flex items-center gap-2 text-sm font-mono"
                    >
                      <span className="text-slate-500">k={k}:</span>
                      <span className="text-purple-400">({currentStep} {k})</span>
                      <span className="text-slate-500">=</span>
                      <span className="text-purple-400">{coeff}</span>
                      {sign < 0 && <span className="text-red-400">×(-1)</span>}
                      <span className="text-slate-500">×</span>
                      <span className="text-emerald-400">a({k})</span>
                      <span className="text-slate-500">=</span>
                      <span className="text-emerald-400">{value}</span>
                      <span className="text-slate-500">→</span>
                      <span className={`font-bold ${term >= 0 ? 'text-indigo-400' : 'text-red-400'}`}>
                        {term > 0 ? '+' : ''}{term}
                      </span>
                    </motion.div>
                  );
                })}
                <div className="border-t border-indigo-500/30 pt-2 mt-2">
                  <div className="flex items-center gap-2 text-sm font-mono">
                    <span className="text-indigo-400 font-bold">b({currentStep}) =</span>
                    <span className="text-purple-300 font-bold">
                      {result[currentStep] !== undefined ? result[currentStep] : '...'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Panel */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800/50 p-4">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 mt-0.5">
              <BookOpen size={14} className="text-indigo-400" />
            </div>
            <div className="space-y-2">
              <p className="text-xs text-slate-400 leading-relaxed">
                The <strong className="text-slate-300">binomial transform</strong> converts a sequence a(n) to b(n) using binomial coefficients. 
                The forward transform uses the formula b(n) = Σ C(n,k) × a(k), while the inverse uses alternating signs.
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                This transform relates sequences through Pascal's triangle coefficients. For example, 
                the Catalan numbers are the binomial transform of the sequence (1, 0, 1, 0, 2, 0, 5, ...).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
