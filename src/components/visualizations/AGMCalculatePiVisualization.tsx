import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Circle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Reference π digits for comparison
const PI_REFERENCE = '3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651328230664709384460955058223172535940812848111745028410270193852110555964462294895493038196';

// --- Gauss-Legendre Algorithm ---
interface PiStep {
  iteration: number;
  a: number;
  b: number;
  t: number;
  p: number;
  pi: number;
  correctDigits: number;
}

const computePiSteps = (maxIterations = 10): PiStep[] => {
  const steps: PiStep[] = [];
  
  // Initial values
  let a = 1;
  let b = 1 / Math.sqrt(2);
  let t = 0.25;
  let p = 1;
  
  // Initial pi estimate
  let pi = Math.pow(a + b, 2) / (4 * t);
  steps.push({ 
    iteration: 0, 
    a, b, t, p, 
    pi, 
    correctDigits: countCorrectDigits(pi) 
  });
  
  for (let i = 1; i <= maxIterations; i++) {
    const aNext = (a + b) / 2;
    const bNext = Math.sqrt(a * b);
    const tNext = t - p * Math.pow(a - aNext, 2);
    const pNext = 2 * p;
    
    a = aNext;
    b = bNext;
    t = tNext;
    p = pNext;
    
    pi = Math.pow(a + b, 2) / (4 * t);
    const correctDigits = countCorrectDigits(pi);
    
    steps.push({ iteration: i, a, b, t, p, pi, correctDigits });
    
    // Stop if we've reached JS precision limit
    if (correctDigits >= 15) break;
  }
  
  return steps;
};

const countCorrectDigits = (value: number): number => {
  const piStr = value.toFixed(16);
  let count = 0;
  for (let i = 0; i < Math.min(piStr.length, PI_REFERENCE.length); i++) {
    if (piStr[i] === PI_REFERENCE[i]) count++;
    else if (piStr[i] !== '.' && PI_REFERENCE[i] !== '.') break;
  }
  return Math.max(0, count - 2); // Subtract "3."
};

// --- Component ---
export default function AGMCalculatePiVisualization() {
  const [steps, setSteps] = useState<PiStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [speed, setSpeed] = useState(1000);
  const [showDetails, setShowDetails] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number>(0);


  // Initialize
  useEffect(() => {
    const newSteps = computePiSteps();
    setSteps(newSteps);
  }, []);

  // --- Audio ---
  const playSound = useCallback((type: 'step' | 'digit' | 'complete' | 'start') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'step') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440 + currentStep * 80, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'digit') {
      // Sparkle sound for each new digit
      [800, 1000, 1200].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.03);
        gain.gain.setValueAtTime(0.04, now + i * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1 + i * 0.03);
        osc.start(now + i * 0.03);
        osc.stop(now + 0.15 + i * 0.03);
      });
    } else if (type === 'complete') {
      // Triumphant chord
      const freqs = [261.63, 329.63, 392, 523.25];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0.1, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2);
        osc.start(now + i * 0.05);
        osc.stop(now + 2);
      });
    } else if (type === 'start') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  }, [soundEnabled, currentStep]);

  // --- Playback ---
  useEffect(() => {
    if (isPlaying && steps.length > 0) {
      intervalRef.current = window.setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            playSound('complete');
            return prev;
          }
          const nextStep = prev + 1;
          if (steps[nextStep]?.correctDigits > steps[prev]?.correctDigits) {
            playSound('digit');
          } else {
            playSound('step');
          }
          return nextStep;
        });
      }, speed);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, steps, speed, playSound]);

  // --- Controls ---
  const togglePlay = () => {
    if (currentStep >= steps.length - 1) {
      setCurrentStep(0);
    }
    setIsPlaying(!isPlaying);
    if (!isPlaying) playSound('start');
  };

  const reset = () => {
    setIsPlaying(false);
    clearInterval(intervalRef.current);
    setCurrentStep(0);
  };

  const stepForward = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      playSound('step');
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ') { e.preventDefault(); togglePlay(); }
      if (e.key === 'r' || e.key === 'R') reset();
      if (e.key === 'ArrowRight') stepForward();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [steps.length, currentStep, isPlaying]);

  const current = steps[currentStep];
  const isComplete = currentStep === steps.length - 1 && steps.length > 1;

  // Render π with highlighted correct digits
  const renderPiDigits = () => {
    if (!current) return null;
    const piStr = current.pi.toFixed(16);
    const correctCount = current.correctDigits + 2; // Include "3."
    
    return (
      <div className="font-mono text-2xl md:text-3xl tracking-wider">
        {piStr.split('').map((char, idx) => (
          <motion.span
            key={idx}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.02 }}
            className={idx < correctCount ? 'text-emerald-400' : 'text-slate-600'}
          >
            {char}
          </motion.span>
        ))}
      </div>
    );
  };


  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-rose-950/15 to-slate-950 rounded-xl border border-rose-900/40 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-rose-800/40 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/15 border border-rose-500/40">
              <Circle className="text-rose-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-rose-300 tracking-wide">PI OBSERVATORY</h2>
              <p className="text-xs text-rose-500/70">Gauss-Legendre AGM Algorithm</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-rose-500"
            >
              <option value={1500}>Slow</option>
              <option value={1000}>Normal</option>
              <option value={600}>Fast</option>
              <option value={300}>Rapid</option>
            </select>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled 
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' 
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
        
        {/* Pi Display - Main Feature */}
        <div className="bg-slate-900/50 rounded-xl border border-rose-500/30 p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(244,63,94,0.08),_transparent_70%)]" />
          
          {/* Orbiting circles decoration */}
          <div className="absolute top-4 right-4 w-24 h-24 opacity-20">
            <motion.div
              className="absolute inset-0 border-2 border-rose-400 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute inset-2 border border-rose-300 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute inset-4 border border-rose-200 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-6xl font-bold text-rose-400">π</span>
              <span className="text-slate-500">=</span>
            </div>
            
            {renderPiDigits()}
            
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-xs text-slate-400">Correct digits: <span className="text-emerald-400 font-bold">{current?.correctDigits || 0}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-600" />
                <span className="text-xs text-slate-500">Approximating...</span>
              </div>
            </div>
          </div>

          {/* Convergence celebration */}
          <AnimatePresence>
            {isComplete && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 pointer-events-none"
              >
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-rose-400"
                    style={{ left: '50%', top: '50%' }}
                    animate={{
                      x: Math.cos(i * Math.PI / 6) * 150,
                      y: Math.sin(i * Math.PI / 6) * 80,
                      opacity: [1, 0],
                      scale: [1, 0],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Iteration Progress */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500">Iteration Progress</span>
            <span className="text-xs text-rose-400 font-mono">
              {currentStep} / {steps.length - 1}
            </span>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full"
              animate={{ width: `${steps.length > 1 ? (currentStep / (steps.length - 1)) * 100 : 0}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          
          {/* Digit milestones */}
          <div className="mt-3 flex justify-between">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  idx <= currentStep
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                    : 'bg-slate-800 text-slate-600 border border-slate-700'
                }`}
                animate={idx === currentStep ? { scale: [1, 1.2, 1] } : {}}
              >
                {step.correctDigits}
              </motion.div>
            ))}
          </div>
          <div className="text-center text-[10px] text-slate-600 mt-1">Correct digits at each iteration</div>
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <button
            onClick={togglePlay}
            className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/50 hover:bg-rose-500/30'
            }`}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            {isPlaying ? 'PAUSE' : 'COMPUTE π'}
          </button>
          <button
            onClick={stepForward}
            disabled={currentStep >= steps.length - 1}
            className="px-4 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            <Zap size={18} />
          </button>
          <button
            onClick={reset}
            className="px-4 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
          >
            <RotateCcw size={18} />
          </button>
        </div>


        {/* AGM Variables Display */}
        {current && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <motion.div 
              className="bg-slate-900/30 rounded-lg border border-rose-500/20 p-3"
              animate={isPlaying ? { borderColor: ['rgba(244,63,94,0.2)', 'rgba(244,63,94,0.5)', 'rgba(244,63,94,0.2)'] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <div className="text-xs text-rose-400 mb-1">aₙ (arithmetic)</div>
              <div className="text-sm font-mono text-slate-300 truncate">{current.a.toFixed(12)}</div>
            </motion.div>
            <motion.div 
              className="bg-slate-900/30 rounded-lg border border-amber-500/20 p-3"
              animate={isPlaying ? { borderColor: ['rgba(245,158,11,0.2)', 'rgba(245,158,11,0.5)', 'rgba(245,158,11,0.2)'] } : {}}
              transition={{ duration: 1, repeat: Infinity, delay: 0.25 }}
            >
              <div className="text-xs text-amber-400 mb-1">bₙ (geometric)</div>
              <div className="text-sm font-mono text-slate-300 truncate">{current.b.toFixed(12)}</div>
            </motion.div>
            <motion.div 
              className="bg-slate-900/30 rounded-lg border border-cyan-500/20 p-3"
              animate={isPlaying ? { borderColor: ['rgba(6,182,212,0.2)', 'rgba(6,182,212,0.5)', 'rgba(6,182,212,0.2)'] } : {}}
              transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
            >
              <div className="text-xs text-cyan-400 mb-1">tₙ (sum term)</div>
              <div className="text-sm font-mono text-slate-300 truncate">{current.t.toFixed(12)}</div>
            </motion.div>
            <motion.div 
              className="bg-slate-900/30 rounded-lg border border-emerald-500/20 p-3"
              animate={isPlaying ? { borderColor: ['rgba(16,185,129,0.2)', 'rgba(16,185,129,0.5)', 'rgba(16,185,129,0.2)'] } : {}}
              transition={{ duration: 1, repeat: Infinity, delay: 0.75 }}
            >
              <div className="text-xs text-emerald-400 mb-1">pₙ (power)</div>
              <div className="text-sm font-mono text-slate-300">{current.p}</div>
            </motion.div>
          </div>
        )}

        {/* Iteration Details Table */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 overflow-hidden">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full px-4 py-3 flex items-center justify-between text-sm text-rose-400 hover:bg-slate-800/50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Play size={12} className={showDetails ? 'rotate-90' : ''} />
              Iteration History
            </span>
            <span className="text-xs text-slate-500">Click to {showDetails ? 'hide' : 'show'}</span>
          </button>
          
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="border-t border-slate-800 max-h-48 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-800/50 sticky top-0">
                      <tr className="text-slate-500">
                        <th className="px-3 py-2 text-left">n</th>
                        <th className="px-3 py-2 text-right">π approximation</th>
                        <th className="px-3 py-2 text-right">Digits</th>
                        <th className="px-3 py-2 text-right">Gain</th>
                      </tr>
                    </thead>
                    <tbody>
                      {steps.map((step, idx) => {
                        const prevDigits = idx > 0 ? steps[idx - 1].correctDigits : 0;
                        const gain = step.correctDigits - prevDigits;
                        return (
                          <motion.tr
                            key={idx}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`border-t border-slate-800/50 ${
                              idx === currentStep ? 'bg-rose-500/10' : ''
                            }`}
                          >
                            <td className="px-3 py-2 font-mono text-slate-400">{step.iteration}</td>
                            <td className="px-3 py-2 font-mono text-slate-300 text-right">{step.pi.toFixed(14)}</td>
                            <td className="px-3 py-2 font-mono text-emerald-400 text-right font-bold">{step.correctDigits}</td>
                            <td className="px-3 py-2 font-mono text-amber-400 text-right">
                              {gain > 0 ? `+${gain}` : gain}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Formula Display */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-rose-400 mb-3 flex items-center gap-2">
            <Circle size={12} />
            Gauss-Legendre Formula
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono text-slate-400">
            <div className="space-y-1">
              <div><span className="text-rose-300">aₙ₊₁</span> = (aₙ + bₙ) / 2</div>
              <div><span className="text-amber-300">bₙ₊₁</span> = √(aₙ × bₙ)</div>
            </div>
            <div className="space-y-1">
              <div><span className="text-cyan-300">tₙ₊₁</span> = tₙ - pₙ(aₙ - aₙ₊₁)²</div>
              <div><span className="text-emerald-300">pₙ₊₁</span> = 2pₙ</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800 text-center">
            <span className="text-rose-400 text-lg">π</span>
            <span className="text-slate-500"> ≈ </span>
            <span className="text-slate-300 font-mono">(aₙ + bₙ)² / 4tₙ</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Convergence</div>
            <div className="text-lg font-bold text-rose-400">Quadratic</div>
            <div className="text-[10px] text-slate-600">~2× digits/iter</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Iterations</div>
            <div className="text-lg font-bold text-amber-400 font-mono">{steps.length - 1}</div>
            <div className="text-[10px] text-slate-600">to JS precision</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Final Digits</div>
            <div className="text-lg font-bold text-emerald-400 font-mono">{steps[steps.length - 1]?.correctDigits || 0}</div>
            <div className="text-[10px] text-slate-600">correct</div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Space</kbd> Play/Pause
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">→</kbd> Step
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-rose-400 hover:text-rose-300 transition-colors">
          About the Gauss-Legendre Algorithm
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            The <span className="text-rose-300">Gauss-Legendre algorithm</span> is one of the fastest known 
            methods for computing π. It uses the arithmetic-geometric mean and converges quadratically.
          </p>
          <p>
            <span className="text-amber-300">Quadratic convergence</span> means the number of correct digits 
            roughly doubles with each iteration. Just 25 iterations gives over 45 million correct digits!
          </p>
          <p>
            <span className="text-emerald-300">Initial values:</span> a₀ = 1, b₀ = 1/√2, t₀ = 1/4, p₀ = 1
          </p>
          <p className="text-slate-500 italic">
            Note: JavaScript's 64-bit floating point limits us to ~15 correct digits. 
            For more precision, arbitrary-precision libraries are needed.
          </p>
        </div>
      </details>
    </div>
  );
}
