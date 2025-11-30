import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Minus, X, Divide, Percent, Zap, Calculator, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface Operation {
  id: string;
  symbol: string;
  name: string;
  icon: React.ReactNode;
  compute: (a: number, b: number) => number | string;
  note?: string;
  color: string;
}

// --- Component ---
export default function ArithmeticIntegerVisualization() {
  const [numA, setNumA] = useState(17);
  const [numB, setNumB] = useState(5);
  const [results, setResults] = useState<{ op: string; value: string }[]>([]);
  const [computing, setComputing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [highlightedOp, setHighlightedOp] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);

  // Operations
  const operations: Operation[] = [
    { 
      id: 'sum', 
      symbol: '+', 
      name: 'Sum', 
      icon: <Plus size={16} />, 
      compute: (a, b) => a + b,
      color: 'emerald'
    },
    { 
      id: 'diff', 
      symbol: '−', 
      name: 'Difference', 
      icon: <Minus size={16} />, 
      compute: (a, b) => a - b,
      color: 'rose'
    },
    { 
      id: 'prod', 
      symbol: '×', 
      name: 'Product', 
      icon: <X size={16} />, 
      compute: (a, b) => a * b,
      color: 'amber'
    },
    { 
      id: 'quot', 
      symbol: '÷', 
      name: 'Quotient', 
      icon: <Divide size={16} />, 
      compute: (a, b) => b === 0 ? 'undefined' : Math.trunc(a / b),
      note: 'Rounds towards zero',
      color: 'cyan'
    },
    { 
      id: 'rem', 
      symbol: '%', 
      name: 'Remainder', 
      icon: <Percent size={16} />, 
      compute: (a, b) => b === 0 ? 'undefined' : a % b,
      note: 'Sign matches first operand',
      color: 'sky'
    },
    { 
      id: 'exp', 
      symbol: '^', 
      name: 'Exponent', 
      icon: <Zap size={16} />, 
      compute: (a, b) => b < 0 ? 'N/A (negative exp)' : Math.pow(a, b),
      color: 'pink'
    },
  ];

  // Initialize audio
  useEffect(() => {
    if (soundEnabled && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
  }, [soundEnabled]);

  // Play sounds
  const playSound = useCallback((type: 'tick' | 'compute' | 'complete') => {
    if (!soundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const currentTime = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    switch (type) {
      case 'tick':
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, currentTime);
        gain.gain.setValueAtTime(0.02, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.03);
        break;
      case 'compute':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, currentTime + 0.08);
        gain.gain.setValueAtTime(0.04, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.1);
        break;
      case 'complete':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, currentTime);
        osc.frequency.setValueAtTime(659, currentTime + 0.1);
        osc.frequency.setValueAtTime(784, currentTime + 0.2);
        gain.gain.setValueAtTime(0.06, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.35);
        break;
    }
    osc.start(currentTime);
    osc.stop(currentTime + 0.5);
  }, [soundEnabled]);

  // Compute all operations
  const computeAll = async () => {
    setComputing(true);
    setResults([]);
    setHighlightedOp(null);

    for (const op of operations) {
      setHighlightedOp(op.id);
      playSound('compute');
      
      await new Promise(r => setTimeout(r, 200));
      
      const value = op.compute(numA, numB);
      setResults(prev => [...prev, { op: op.id, value: String(value) }]);
      
      await new Promise(r => setTimeout(r, 150));
    }

    setHighlightedOp(null);
    playSound('complete');
    setComputing(false);
  };

  // Auto-compute on input change
  useEffect(() => {
    const newResults = operations.map(op => ({
      op: op.id,
      value: String(op.compute(numA, numB))
    }));
    setResults(newResults);
  }, [numA, numB]);

  const getResult = (opId: string) => results.find(r => r.op === opId)?.value ?? '—';

  const presets = [
    { label: '17, 5', a: 17, b: 5 },
    { label: '-17, 5', a: -17, b: 5 },
    { label: '17, -5', a: 17, b: -5 },
    { label: '-17, -5', a: -17, b: -5 },
    { label: '2, 10', a: 2, b: 10 },
    { label: '100, 7', a: 100, b: 7 },
  ];

  const getColorClasses = (color: string, isHighlighted: boolean) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      emerald: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-400' },
      rose: { bg: 'bg-rose-500/20', border: 'border-rose-500/50', text: 'text-rose-400' },
      amber: { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-400' },
      cyan: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400' },
      sky: { bg: 'bg-sky-500/20', border: 'border-sky-500/50', text: 'text-sky-400' },
      pink: { bg: 'bg-pink-500/20', border: 'border-pink-500/50', text: 'text-pink-400' },
    };
    const c = colors[color] || colors.cyan;
    return isHighlighted 
      ? `${c.bg} ${c.border} ${c.text} ring-2 ring-white/30` 
      : `bg-slate-800/50 border-slate-700/50 ${c.text}`;
  };

  return (
    <div className="w-full min-h-[700px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-xl border border-slate-700/50 font-sans overflow-hidden">
      
      {/* Header - Calculator Display Style */}
      <div className="bg-slate-900 border-b border-slate-700/50 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
              <Calculator className="text-emerald-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-200 tracking-wide">CALCULATOR CONSOLE</h2>
              <p className="text-xs text-slate-500">Integer Arithmetic Operations</p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-sm">
            <span className="text-slate-500">Mode:</span>
            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">
              INTEGER
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        
        {/* Input Display */}
        <div className="bg-slate-900 rounded-xl border border-slate-700/50 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input A */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 font-mono">OPERAND A</span>
                <span className="text-xs text-slate-600">Integer</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={numA}
                  onChange={(e) => { setNumA(parseInt(e.target.value) || 0); playSound('tick'); }}
                  className="w-full px-4 py-4 bg-slate-950 border border-slate-700 rounded-lg text-3xl font-mono text-emerald-400 text-right focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-lg">a =</div>
              </div>
            </div>

            {/* Input B */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 font-mono">OPERAND B</span>
                <span className="text-xs text-slate-600">Integer</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={numB}
                  onChange={(e) => { setNumB(parseInt(e.target.value) || 0); playSound('tick'); }}
                  className="w-full px-4 py-4 bg-slate-950 border border-slate-700 rounded-lg text-3xl font-mono text-amber-400 text-right focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-lg">b =</div>
              </div>
            </div>
          </div>

          {/* Presets */}
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => { setNumA(preset.a); setNumB(preset.b); playSound('tick'); }}
                className="px-3 py-1.5 rounded text-xs font-mono bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-slate-300 transition-all"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {operations.map((op) => {
              const isHighlighted = highlightedOp === op.id;
              return (
                <motion.div
                  key={op.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`rounded-xl border p-4 transition-all ${getColorClasses(op.color, isHighlighted)}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {op.icon}
                      <span className="text-sm font-medium">{op.name}</span>
                    </div>
                    <span className="text-2xl font-mono opacity-50">{op.symbol}</span>
                  </div>
                  
                  <div className="text-xs text-slate-500 font-mono mb-2">
                    {numA} {op.symbol} {numB} =
                  </div>
                  
                  <motion.div
                    key={getResult(op.id)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl font-bold font-mono"
                  >
                    {getResult(op.id)}
                  </motion.div>
                  
                  {op.note && (
                    <div className="mt-2 text-xs text-slate-500 italic">
                      {op.note}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Divmod Bonus */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-bold text-slate-300">BONUS: divmod</span>
            <span className="text-xs text-slate-500 font-mono">(quotient, remainder)</span>
          </div>
          <div className="flex items-center gap-4 font-mono">
            <span className="text-slate-500">divmod({numA}, {numB}) =</span>
            <span className="text-lg">
              <span className="text-cyan-400">({numB === 0 ? '?' : Math.trunc(numA / numB)}</span>
              <span className="text-slate-500">, </span>
              <span className="text-sky-400">{numB === 0 ? '?' : numA % numB})</span>
            </span>
          </div>
        </div>

        {/* Animate Button */}
        <div className="flex justify-center gap-4">
          <button
            onClick={computeAll}
            disabled={computing}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
              computing
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30'
            }`}
          >
            <Calculator size={18} />
            {computing ? 'COMPUTING...' : 'ANIMATE'}
          </button>
          <button
            onClick={() => { setNumA(17); setNumB(5); }}
            className="px-4 py-3 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        {/* Sound Toggle */}
        <div className="flex justify-center">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              soundEnabled
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}
          >
            Sound: {soundEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Explanation */}
        <details className="bg-slate-900/50 rounded-xl border border-slate-700/50">
          <summary className="px-4 py-3 cursor-pointer text-sm text-slate-400 hover:text-slate-300 transition-colors">
            Notes on Integer Arithmetic
          </summary>
          <div className="px-4 pb-4 text-xs text-slate-500 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-800/50 rounded p-3">
                <div className="text-cyan-400 font-medium mb-1">Integer Division</div>
                <p>JavaScript's Math.trunc() rounds towards zero. For -17 ÷ 5, the result is -3 (not -4).</p>
              </div>
              <div className="bg-slate-800/50 rounded p-3">
                <div className="text-sky-400 font-medium mb-1">Remainder (Modulo)</div>
                <p>The % operator's result has the same sign as the dividend (first operand). -17 % 5 = -2.</p>
              </div>
              <div className="bg-slate-800/50 rounded p-3">
                <div className="text-pink-400 font-medium mb-1">Exponentiation</div>
                <p>The ** operator (or Math.pow) handles integer exponents. Negative exponents return fractions.</p>
              </div>
              <div className="bg-slate-800/50 rounded p-3">
                <div className="text-amber-400 font-medium mb-1">Divmod</div>
                <p>Returns both quotient and remainder in one operation. Useful for time/date calculations.</p>
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
