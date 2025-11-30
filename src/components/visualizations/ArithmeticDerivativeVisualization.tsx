import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, RotateCcw, FlaskConical, Atom, Sparkles, Volume2, VolumeX, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Math Logic ---

const isPrime = (n: number): boolean => {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
};

const smallestPrimeFactor = (n: number): number => {
  if (n < 2) return n;
  if (n % 2 === 0) return 2;
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return i;
  }
  return n;
};

// Arithmetic derivative with step tracking
interface DerivativeStep {
  n: number;
  rule: 'zero' | 'one' | 'prime' | 'leibniz';
  result: number;
  m?: number;
  k?: number;
  dm?: number;
  dk?: number;
}

const arithmeticDerivative = (n: number, steps: DerivativeStep[] = []): number => {
  const absN = Math.abs(n);
  
  if (absN === 0) {
    steps.push({ n, rule: 'zero', result: 0 });
    return 0;
  }
  if (absN === 1) {
    steps.push({ n, rule: 'one', result: 0 });
    return 0;
  }
  if (isPrime(absN)) {
    const result = n < 0 ? -1 : 1;
    steps.push({ n, rule: 'prime', result });
    return result;
  }

  // Find smallest prime factor
  const p = smallestPrimeFactor(absN);
  const q = absN / p;
  
  // D(pq) = D(p)*q + p*D(q) = 1*q + p*D(q)
  const dq = arithmeticDerivative(q, steps);
  const result = q + p * dq;
  const finalResult = n < 0 ? -result : result;
  
  steps.push({ 
    n, 
    rule: 'leibniz', 
    result: finalResult,
    m: p,
    k: q,
    dm: 1,
    dk: dq
  });
  
  return finalResult;
};

// Compute derivative without steps (for batch)
const D = (n: number): number => {
  const absN = Math.abs(n);
  if (absN <= 1) return 0;
  if (isPrime(absN)) return n < 0 ? -1 : 1;
  const p = smallestPrimeFactor(absN);
  const q = absN / p;
  const result = q + p * D(q);
  return n < 0 ? -result : result;
};

// --- Component ---
export default function ArithmeticDerivativeVisualization() {
  const [inputValue, setInputValue] = useState<string>('30');
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [steps, setSteps] = useState<DerivativeStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [rangeResults, setRangeResults] = useState<Array<{ n: number; d: number }>>([]);
  const [showRange, setShowRange] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number>(0);


  // --- Audio ---
  const playSound = useCallback((type: 'step' | 'complete' | 'prime' | 'zero' | 'compute') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'step') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440 + currentStepIndex * 50, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'prime') {
      [660, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.08, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15 + i * 0.08);
        osc.start(now + i * 0.08);
        osc.stop(now + 0.2 + i * 0.08);
      });
    } else if (type === 'zero') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'complete') {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.08, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3 + i * 0.1);
        osc.start(now + i * 0.1);
        osc.stop(now + 0.4 + i * 0.1);
      });
    } else if (type === 'compute') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(300, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  }, [soundEnabled, currentStepIndex]);

  // --- Compute Derivative ---
  const computeDerivative = useCallback(() => {
    const n = parseInt(inputValue);
    if (isNaN(n) || Math.abs(n) > 10000) return;

    setCurrentNumber(n);
    setCurrentStepIndex(-1);
    setIsAnimating(true);
    setShowRange(false);

    const newSteps: DerivativeStep[] = [];
    arithmeticDerivative(n, newSteps);
    setSteps(newSteps);

    // Animate through steps
    let idx = 0;
    const animate = () => {
      if (idx < newSteps.length) {
        setCurrentStepIndex(idx);
        const step = newSteps[idx];
        if (step.rule === 'prime') playSound('prime');
        else if (step.rule === 'zero' || step.rule === 'one') playSound('zero');
        else playSound('step');
        idx++;
        animationRef.current = window.setTimeout(animate, 600);
      } else {
        setIsAnimating(false);
        playSound('complete');
      }
    };

    animationRef.current = window.setTimeout(animate, 300);
  }, [inputValue, playSound]);

  // --- Compute Range ---
  const computeRange = useCallback(() => {
    setShowRange(true);
    setCurrentNumber(null);
    setSteps([]);
    setCurrentStepIndex(-1);

    const results: Array<{ n: number; d: number }> = [];
    for (let i = -99; i <= 100; i++) {
      results.push({ n: i, d: D(i) });
    }
    setRangeResults(results);
    playSound('complete');
  }, [playSound]);

  const reset = () => {
    clearTimeout(animationRef.current);
    setIsAnimating(false);
    setCurrentNumber(null);
    setSteps([]);
    setCurrentStepIndex(-1);
    setShowRange(false);
    setRangeResults([]);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'Enter') computeDerivative();
      if (e.key === 'r' || e.key === 'R') reset();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [computeDerivative]);

  const finalResult = steps.length > 0 ? steps[steps.length - 1].result : null;

  // Get color based on rule type
  const getRuleColor = (rule: string) => {
    switch (rule) {
      case 'prime': return '#10b981';
      case 'zero': case 'one': return '#64748b';
      case 'leibniz': return '#06b6d4';
      default: return '#94a3b8';
    }
  };


  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-emerald-950/10 to-slate-950 rounded-xl border border-emerald-900/30 font-sans overflow-hidden">
      
      {/* Header - Laboratory Style */}
      <div className="bg-slate-900/80 border-b border-emerald-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <FlaskConical className="text-emerald-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-300 tracking-wide">DERIVATIVE LABORATORY</h2>
              <p className="text-xs text-emerald-500/70">Lagarias Arithmetic Derivative</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled 
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' 
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
        
        {/* Input Section */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-xs text-emerald-400 mb-2 block flex items-center gap-1">
                <Atom size={12} />
                Enter Number (n)
              </label>
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="e.g., 30"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-lg text-emerald-300 font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                disabled={isAnimating}
              />
            </div>
            <div className="flex gap-2 sm:items-end">
              <button
                onClick={computeDerivative}
                disabled={isAnimating || !inputValue}
                className={`flex-1 sm:flex-none px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                  isAnimating
                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-wait'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30'
                }`}
              >
                <Play size={18} />
                D(n)
              </button>
              <button
                onClick={reset}
                className="px-3 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </div>
          
          {/* Quick presets */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-slate-500">Try:</span>
            {[6, 27, 30, 100, -15, 97].map(n => (
              <button
                key={n}
                onClick={() => { setInputValue(String(n)); }}
                className="px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-slate-400 hover:text-emerald-300 hover:border-emerald-500/50 transition-all"
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Result Display */}
        {currentNumber !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-emerald-900/20 to-slate-900/50 rounded-xl border border-emerald-800/30 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-emerald-400 flex items-center gap-2">
                <Sparkles size={14} />
                Computing D({currentNumber})
              </div>
              {finalResult !== null && !isAnimating && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-bold text-emerald-300"
                >
                  = {finalResult}
                </motion.div>
              )}
            </div>

            {/* Steps Visualization */}
            <div className="space-y-2">
              <AnimatePresence>
                {steps.slice(0, currentStepIndex + 1).map((step, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                    style={{
                      backgroundColor: `${getRuleColor(step.rule)}10`,
                      borderColor: `${getRuleColor(step.rule)}30`,
                    }}
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: `${getRuleColor(step.rule)}20`, color: getRuleColor(step.rule) }}
                    >
                      {idx + 1}
                    </div>
                    
                    <div className="flex-1">
                      {step.rule === 'zero' && (
                        <span className="text-slate-400">D(0) = <span className="text-slate-300 font-bold">0</span> (base case)</span>
                      )}
                      {step.rule === 'one' && (
                        <span className="text-slate-400">D(1) = <span className="text-slate-300 font-bold">0</span> (base case)</span>
                      )}
                      {step.rule === 'prime' && (
                        <span className="text-emerald-400">
                          D({Math.abs(step.n)}) = <span className="text-emerald-300 font-bold">1</span> 
                          <span className="text-emerald-600 text-xs ml-2">(prime)</span>
                          {step.n < 0 && <span className="text-slate-500 text-xs ml-1">→ -{step.result}</span>}
                        </span>
                      )}
                      {step.rule === 'leibniz' && (
                        <div className="text-cyan-400">
                          <span>D({Math.abs(step.n)}) = D({step.m})·{step.k} + {step.m}·D({step.k})</span>
                          <ChevronRight size={14} className="inline mx-1 text-slate-600" />
                          <span>= 1·{step.k} + {step.m}·{step.dk}</span>
                          <ChevronRight size={14} className="inline mx-1 text-slate-600" />
                          <span className="text-cyan-300 font-bold">{Math.abs(step.result)}</span>
                          {step.n < 0 && <span className="text-slate-500 text-xs ml-1">→ {step.result}</span>}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}


        {/* Range Computation */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-emerald-400 flex items-center gap-2">
              <FlaskConical size={12} />
              Batch Computation: D(-99) to D(100)
            </div>
            <button
              onClick={computeRange}
              disabled={isAnimating}
              className="px-3 py-1.5 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-all disabled:opacity-50"
            >
              Compute Range
            </button>
          </div>

          {showRange && rangeResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-h-64 overflow-y-auto custom-scrollbar"
            >
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
                {rangeResults.map(({ n, d }) => (
                  <div
                    key={n}
                    className={`p-1.5 rounded text-center text-[10px] font-mono border transition-all cursor-default hover:scale-105 ${
                      n === 0 || n === 1 || n === -1
                        ? 'bg-slate-800/50 border-slate-700 text-slate-500'
                        : isPrime(Math.abs(n))
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                    }`}
                    title={`D(${n}) = ${d}`}
                  >
                    <div className="text-slate-500 text-[8px]">{n}</div>
                    <div className="font-bold">{d}</div>
                  </div>
                ))}
              </div>
              
              {/* Legend */}
              <div className="mt-3 flex flex-wrap gap-3 text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700"></span>
                  <span className="text-slate-500">Base (0, ±1)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30"></span>
                  <span className="text-emerald-400">Prime</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-cyan-500/20 border border-cyan-500/30"></span>
                  <span className="text-cyan-400">Composite</span>
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Formula Reference */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3">
            <div className="text-xs text-slate-500 mb-1">Base Cases</div>
            <div className="text-sm text-slate-300 font-mono">D(0) = D(1) = 0</div>
          </div>
          <div className="bg-emerald-900/20 rounded-lg border border-emerald-800/30 p-3">
            <div className="text-xs text-emerald-500 mb-1">Prime Rule</div>
            <div className="text-sm text-emerald-300 font-mono">D(p) = 1</div>
          </div>
          <div className="bg-cyan-900/20 rounded-lg border border-cyan-800/30 p-3">
            <div className="text-xs text-cyan-500 mb-1">Leibniz Rule</div>
            <div className="text-sm text-cyan-300 font-mono">D(mn) = D(m)n + mD(n)</div>
          </div>
        </div>

        {/* Examples */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-slate-500 mb-3">Examples from Rosetta Code</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            {[
              { n: 6, calc: 'D(2·3) = D(2)·3 + 2·D(3) = 1·3 + 2·1 = 5' },
              { n: 9, calc: 'D(3·3) = D(3)·3 + 3·D(3) = 1·3 + 3·1 = 6' },
              { n: 27, calc: 'D(3·9) = D(3)·9 + 3·D(9) = 1·9 + 3·6 = 27' },
              { n: 30, calc: 'D(2·15) = D(2)·15 + 2·D(15) = 15 + 2·8 = 31' },
            ].map(({ n, calc }) => (
              <div 
                key={n}
                className="p-2 bg-slate-800/50 rounded border border-slate-700/50 text-slate-400"
              >
                <span className="text-emerald-400">D({n})</span>: {calc}
              </div>
            ))}
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Enter</kbd> Compute
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
          What is the Arithmetic Derivative?
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            The <span className="text-emerald-300">arithmetic derivative</span> is a function on integers 
            that mimics the product rule from calculus, but applied to prime factorization.
          </p>
          <p>
            Just like the calculus derivative where (fg)' = f'g + fg', the arithmetic derivative follows:
            <span className="text-cyan-300 font-mono ml-1">D(mn) = D(m)·n + m·D(n)</span>
          </p>
          <p>
            Interesting property: <span className="text-emerald-300">D(n) = n</span> only when n is a 
            prime power p^p (like 4 = 2², 27 = 3³).
          </p>
        </div>
      </details>
    </div>
  );
}
