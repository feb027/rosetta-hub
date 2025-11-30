import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, ChevronRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- AGM Calculation ---
interface AGMStep {
  iteration: number;
  a: number;
  g: number;
  diff: number;
}

const computeAGM = (a0: number, g0: number, maxIterations = 20, epsilon = 1e-15): AGMStep[] => {
  const steps: AGMStep[] = [{ iteration: 0, a: a0, g: g0, diff: Math.abs(a0 - g0) }];
  let a = a0;
  let g = g0;
  
  for (let i = 1; i <= maxIterations; i++) {
    const newA = (a + g) / 2;
    const newG = Math.sqrt(a * g);
    const diff = Math.abs(newA - newG);
    steps.push({ iteration: i, a: newA, g: newG, diff });
    
    if (diff < epsilon) break;
    a = newA;
    g = newG;
  }
  
  return steps;
};

// Presets
const PRESETS = [
  { name: 'Classic (1, 1/√2)', a: 1, g: 1 / Math.sqrt(2), description: 'Gauss\'s famous example' },
  { name: 'Simple (1, 2)', a: 1, g: 2, description: 'Basic demonstration' },
  { name: 'Golden (1, φ)', a: 1, g: (1 + Math.sqrt(5)) / 2, description: 'With golden ratio' },
  { name: 'Large Gap (1, 100)', a: 1, g: 100, description: 'Wide initial spread' },
  { name: 'Close (0.9, 1.1)', a: 0.9, g: 1.1, description: 'Near convergence' },
];

// --- Component ---
export default function ArithmeticGeometricMeanVisualization() {
  const [inputA, setInputA] = useState(1);
  const [inputG, setInputG] = useState(1 / Math.sqrt(2));
  const [steps, setSteps] = useState<AGMStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showAllSteps, setShowAllSteps] = useState(false);
  const [speed, setSpeed] = useState(800);

  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number>(0);


  // --- Audio ---
  const playSound = useCallback((type: 'step' | 'converge' | 'start' | 'tick') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'step') {
      // Rising tone as sequences converge
      const baseFreq = 300 + currentStep * 50;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.2, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'converge') {
      // Harmonic chord for convergence
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0.1, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        osc.start(now + i * 0.05);
        osc.stop(now + 1.5);
      });
    } else if (type === 'start') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.start(now);
      osc.stop(now + 0.03);
    }
  }, [soundEnabled, currentStep]);

  // --- Initialize ---
  const initialize = useCallback(() => {
    const newSteps = computeAGM(inputA, inputG);
    setSteps(newSteps);
    setCurrentStep(0);
    setIsPlaying(false);
    playSound('start');
  }, [inputA, inputG, playSound]);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, []);

  // --- Playback ---
  useEffect(() => {
    if (isPlaying && steps.length > 0) {
      intervalRef.current = window.setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            playSound('converge');
            return prev;
          }
          playSound('step');
          return prev + 1;
        });
      }, speed);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, steps.length, speed, playSound]);

  // --- Controls ---
  const togglePlay = () => {
    if (currentStep >= steps.length - 1) {
      setCurrentStep(0);
    }
    setIsPlaying(!isPlaying);
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

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setInputA(preset.a);
    setInputG(preset.g);
    const newSteps = computeAGM(preset.a, preset.g);
    setSteps(newSteps);
    setCurrentStep(0);
    setIsPlaying(false);
    playSound('start');
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

  const current = steps[currentStep] || { iteration: 0, a: inputA, g: inputG, diff: Math.abs(inputA - inputG) };
  const final = steps[steps.length - 1];
  const isConverged = currentStep === steps.length - 1 && steps.length > 1;

  // Calculate visual positions (normalized 0-1 range for the pendulum display)
  const getPosition = (value: number) => {
    if (steps.length === 0) return 0.5;
    const minVal = Math.min(steps[0].a, steps[0].g);
    const maxVal = Math.max(steps[0].a, steps[0].g);
    const range = maxVal - minVal;
    if (range === 0) return 0.5;
    return (value - minVal) / range;
  };


  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-teal-950/20 to-slate-950 rounded-xl border border-teal-900/40 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-teal-800/40 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/15 border border-teal-500/40">
              <Sparkles className="text-teal-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-teal-300 tracking-wide">CONVERGENCE PENDULUM</h2>
              <p className="text-xs text-teal-500/70">Arithmetic-Geometric Mean Calculator</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-teal-500"
            >
              <option value={1200}>Slow</option>
              <option value={800}>Normal</option>
              <option value={400}>Fast</option>
              <option value={200}>Rapid</option>
            </select>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled 
                  ? 'bg-teal-500/20 border-teal-500/50 text-teal-300' 
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-teal-400 mb-1 block">Initial a₀</label>
              <input
                type="number"
                value={inputA}
                onChange={(e) => setInputA(parseFloat(e.target.value) || 0)}
                step="0.1"
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-teal-300 font-mono focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-cyan-400 mb-1 block">Initial g₀</label>
              <input
                type="number"
                value={inputG}
                onChange={(e) => setInputG(parseFloat(e.target.value) || 0)}
                step="0.1"
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-cyan-300 font-mono focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>
          
          <button
            onClick={initialize}
            className="w-full py-2 bg-teal-500/20 text-teal-300 border border-teal-500/50 rounded-lg hover:bg-teal-500/30 transition-all font-medium"
          >
            Calculate AGM
          </button>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(preset)}
              className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-xs text-slate-400 hover:text-teal-300 hover:border-teal-500/50 transition-all"
              title={preset.description}
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* Pendulum Visualization */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(20,184,166,0.05),_transparent_70%)]" />
          
          {/* Scale/Track */}
          <div className="relative h-48 mb-6">
            {/* Track line */}
            <div className="absolute top-1/2 left-8 right-8 h-1 bg-gradient-to-r from-teal-500/30 via-slate-600/50 to-cyan-500/30 rounded-full" />
            
            {/* Center marker (convergence point) */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-emerald-400/50"
              animate={isConverged ? { scale: [1, 1.3, 1], borderColor: ['rgba(52,211,153,0.5)', 'rgba(52,211,153,1)', 'rgba(52,211,153,0.5)'] } : {}}
              transition={{ duration: 1, repeat: isConverged ? Infinity : 0 }}
            />

            {/* Arithmetic Mean Pendulum (a) */}
            <motion.div
              className="absolute top-0 h-full flex flex-col items-center"
              style={{ left: '8%', width: '84%' }}
              animate={{ x: `${getPosition(current.a) * 100}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            >
              {/* Pendulum string */}
              <div className="w-0.5 h-16 bg-gradient-to-b from-teal-400/80 to-teal-400/20" />
              {/* Pendulum bob */}
              <motion.div
                className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 shadow-lg shadow-teal-500/30 flex items-center justify-center border-2 border-teal-300/50"
                animate={isConverged ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <span className="text-xs font-bold text-white">a</span>
              </motion.div>
              {/* Value label */}
              <div className="mt-2 px-2 py-1 bg-teal-500/20 rounded text-xs font-mono text-teal-300 border border-teal-500/30">
                {current.a.toFixed(10)}
              </div>
            </motion.div>

            {/* Geometric Mean Pendulum (g) */}
            <motion.div
              className="absolute top-0 h-full flex flex-col items-center"
              style={{ left: '8%', width: '84%' }}
              animate={{ x: `${getPosition(current.g) * 100}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            >
              {/* Pendulum string */}
              <div className="w-0.5 h-16 bg-gradient-to-b from-cyan-400/80 to-cyan-400/20" />
              {/* Pendulum bob */}
              <motion.div
                className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-lg shadow-cyan-500/30 flex items-center justify-center border-2 border-cyan-300/50"
                animate={isConverged ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <span className="text-xs font-bold text-white">g</span>
              </motion.div>
              {/* Value label */}
              <div className="mt-2 px-2 py-1 bg-cyan-500/20 rounded text-xs font-mono text-cyan-300 border border-cyan-500/30">
                {current.g.toFixed(10)}
              </div>
            </motion.div>

            {/* Convergence celebration */}
            <AnimatePresence>
              {isConverged && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                >
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full bg-emerald-400"
                      initial={{ x: 0, y: 0, opacity: 1 }}
                      animate={{
                        x: Math.cos(i * Math.PI / 4) * 60,
                        y: Math.sin(i * Math.PI / 4) * 60,
                        opacity: 0,
                        scale: 0,
                      }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Iteration info */}
          <div className="flex justify-between items-center text-sm">
            <div className="text-slate-500">
              Iteration: <span className="text-teal-300 font-mono">{current.iteration}</span>
            </div>
            <div className="text-slate-500">
              Difference: <span className="text-amber-300 font-mono">{current.diff.toExponential(4)}</span>
            </div>
          </div>
        </div>


        {/* Controls */}
        <div className="flex gap-3">
          <button
            onClick={togglePlay}
            className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'bg-teal-500/20 text-teal-300 border border-teal-500/50 hover:bg-teal-500/30'
            }`}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            {isPlaying ? 'PAUSE' : 'ANIMATE CONVERGENCE'}
          </button>
          <button
            onClick={stepForward}
            disabled={currentStep >= steps.length - 1}
            className="px-4 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={reset}
            className="px-4 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        {/* Result Display */}
        <AnimatePresence>
          {final && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-slate-900/50 rounded-xl border p-4 ${
                isConverged ? 'border-emerald-500/50' : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-400">AGM Result</span>
                {isConverged && (
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs rounded-full border border-emerald-500/30">
                    ✓ Converged
                  </span>
                )}
              </div>
              <div className="text-2xl font-mono text-emerald-400 mb-2">
                {final.a.toFixed(15)}
              </div>
              <div className="text-xs text-slate-500">
                agm({steps[0]?.a.toFixed(4)}, {steps[0]?.g.toFixed(4)}) in {steps.length - 1} iterations
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step History */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 overflow-hidden">
          <button
            onClick={() => setShowAllSteps(!showAllSteps)}
            className="w-full px-4 py-3 flex items-center justify-between text-sm text-teal-400 hover:bg-slate-800/50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Play size={12} className={showAllSteps ? 'rotate-90' : ''} />
              Iteration History ({steps.length} steps)
            </span>
            <span className="text-xs text-slate-500">Click to {showAllSteps ? 'hide' : 'show'}</span>
          </button>
          
          <AnimatePresence>
            {showAllSteps && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="border-t border-slate-800 max-h-64 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-800/50 sticky top-0">
                      <tr className="text-slate-500">
                        <th className="px-3 py-2 text-left">n</th>
                        <th className="px-3 py-2 text-right">aₙ</th>
                        <th className="px-3 py-2 text-right">gₙ</th>
                        <th className="px-3 py-2 text-right">|aₙ - gₙ|</th>
                      </tr>
                    </thead>
                    <tbody>
                      {steps.map((step, idx) => (
                        <motion.tr
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className={`border-t border-slate-800/50 ${
                            idx === currentStep ? 'bg-teal-500/10' : ''
                          }`}
                        >
                          <td className="px-3 py-2 font-mono text-slate-400">{step.iteration}</td>
                          <td className="px-3 py-2 font-mono text-teal-300 text-right">{step.a.toFixed(12)}</td>
                          <td className="px-3 py-2 font-mono text-cyan-300 text-right">{step.g.toFixed(12)}</td>
                          <td className="px-3 py-2 font-mono text-amber-300 text-right">{step.diff.toExponential(2)}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Formula Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/30 rounded-xl border border-teal-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-teal-400" />
              <span className="text-xs text-teal-400 font-medium">Arithmetic Mean</span>
            </div>
            <div className="font-mono text-lg text-slate-300">
              aₙ₊₁ = (aₙ + gₙ) / 2
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Average of the two values
            </div>
          </div>
          <div className="bg-slate-900/30 rounded-xl border border-cyan-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-cyan-400" />
              <span className="text-xs text-cyan-400 font-medium">Geometric Mean</span>
            </div>
            <div className="font-mono text-lg text-slate-300">
              gₙ₊₁ = √(aₙ × gₙ)
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Square root of the product
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Initial a₀</div>
            <div className="text-lg font-bold text-teal-400 font-mono">{steps[0]?.a.toFixed(4) || '—'}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Initial g₀</div>
            <div className="text-lg font-bold text-cyan-400 font-mono">{steps[0]?.g.toFixed(4) || '—'}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Iterations</div>
            <div className="text-lg font-bold text-amber-400 font-mono">{steps.length - 1}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Final Precision</div>
            <div className="text-lg font-bold text-emerald-400 font-mono">
              {final ? `10⁻${Math.abs(Math.floor(Math.log10(final.diff + 1e-20)))}` : '—'}
            </div>
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
        <summary className="px-4 py-3 cursor-pointer text-sm text-teal-400 hover:text-teal-300 transition-colors">
          About the Arithmetic-Geometric Mean
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            The <span className="text-teal-300">arithmetic-geometric mean (AGM)</span> was discovered by 
            Lagrange and extensively studied by Gauss. It converges quadratically — the number of correct 
            digits roughly doubles with each iteration!
          </p>
          <p>
            The classic example <span className="text-cyan-300">agm(1, 1/√2)</span> equals approximately 
            0.8472130848... and is related to the lemniscate constant and elliptic integrals.
          </p>
          <p>
            <span className="text-emerald-300">Applications:</span> Computing π (via Gauss-Legendre), 
            elliptic integrals, and high-precision arithmetic.
          </p>
          <p className="text-slate-500 italic">
            Notice how the two pendulums swing toward each other, meeting at the AGM — a beautiful 
            demonstration of mathematical convergence!
          </p>
        </div>
      </details>
    </div>
  );
}
