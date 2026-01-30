import { useState, useRef, useCallback, useMemo } from 'react';
import { Calculator, ArrowRight, ArrowLeft, RotateCcw, Volume2, VolumeX, Sigma } from 'lucide-react';
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
};

export default function BinomialTransformVisualization() {
  const [sequence, setSequence] = useState<number[]>(PRESETS.catalan);
  const [mode, setMode] = useState<'forward' | 'inverse'>('forward');
  const [result, setResult] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showTriangle, setShowTriangle] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);

  const playSound = useCallback((type: 'calc' | 'complete') => {
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
      osc.frequency.setValueAtTime(500, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'complete') {
      [523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.04, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3 + i * 0.1);
        osc.start(now + i * 0.1);
        osc.stop(now + 0.4 + i * 0.1);
      });
    }
  }, [soundEnabled]);

  const transform = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setResult([]);

    const newResult: number[] = [];

    for (let n = 0; n < sequence.length; n++) {
      let sum = 0;
      for (let k = 0; k <= n; k++) {
        const coeff = binomial(n, k);
        const sign = mode === 'forward' ? 1 : Math.pow(-1, n - k);
        sum += sign * coeff * sequence[k];
        playSound('calc');
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      newResult.push(sum);
      setResult([...newResult]);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    playSound('complete');
    setIsProcessing(false);
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

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-purple-950/10 to-slate-950 rounded-xl border border-purple-900/30 font-sans overflow-hidden">
      <div className="bg-slate-900/80 border-b border-purple-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/15 border border-purple-500/40">
              <Sigma className="text-purple-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-purple-300 tracking-wide font-mono">BINOMIAL TRANSFORM</h2>
              <p className="text-xs text-purple-500/70">Sequence Transformation Visualizer</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTriangle(!showTriangle)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                showTriangle ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50' : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              Pascal's △
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(PRESETS).map(([key, values]) => (
            <button
              key={key}
              onClick={() => setSequence(values)}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-purple-500/30 transition-all capitalize"
            >
              {key}
            </button>
          ))}
        </div>

        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-slate-400 mb-2">Input Sequence</div>
          <div className="flex flex-wrap gap-2">
            {sequence.map((n, i) => (
              <input
                key={i}
                type="number"
                value={n}
                onChange={(e) => {
                  const newSeq = [...sequence];
                  newSeq[i] = parseInt(e.target.value) || 0;
                  setSequence(newSeq);
                }}
                className="w-16 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-sm text-center focus:outline-none focus:border-purple-500/50"
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setMode('forward')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              mode === 'forward' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50' : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <ArrowRight size={16} />
            Forward
          </button>
          <button
            onClick={() => setMode('inverse')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              mode === 'inverse' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50' : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <ArrowLeft size={16} />
            Inverse
          </button>
        </div>

        <button
          onClick={transform}
          disabled={isProcessing}
          className="w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all bg-purple-500/20 text-purple-300 border border-purple-500/50 hover:bg-purple-500/30 disabled:opacity-50"
        >
          <Calculator size={18} />
          {isProcessing ? 'Calculating...' : 'TRANSFORM'}
        </button>

        <AnimatePresence>
          {result.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-purple-900/20 rounded-xl border border-purple-500/50 p-4"
            >
              <div className="text-xs text-purple-400 mb-2">Result</div>
              <div className="flex flex-wrap gap-2">
                {result.map((n, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="w-14 h-10 flex items-center justify-center bg-purple-500/20 rounded-lg text-purple-300 font-mono text-sm font-bold"
                  >
                    {n}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showTriangle && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-slate-900/30 rounded-xl border border-slate-800 p-4 overflow-hidden"
            >
              <div className="text-xs text-slate-500 mb-3 text-center">Pascal's Triangle (Binomial Coefficients)</div>
              <div className="flex flex-col items-center gap-1">
                {pascalTriangle.map((row, i) => (
                  <div key={i} className="flex gap-2">
                    {row.map((n, j) => (
                      <div
                        key={j}
                        className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded text-[10px] text-purple-400 font-mono"
                      >
                        {n}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
