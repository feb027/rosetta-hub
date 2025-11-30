import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Shuffle, Volume2, VolumeX, Check, X, Layers, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Logic ---
const generateBrackets = (n: number): string => {
  const brackets = Array(n).fill('[').concat(Array(n).fill(']'));
  // Fisher-Yates shuffle
  for (let i = brackets.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [brackets[i], brackets[j]] = [brackets[j], brackets[i]];
  }
  return brackets.join('');
};

interface ValidationStep {
  index: number;
  char: string;
  action: 'push' | 'pop' | 'error';
  stackAfter: string[];
  isValid: boolean;
}

const validateBrackets = (str: string): { isBalanced: boolean; steps: ValidationStep[] } => {
  const steps: ValidationStep[] = [];
  const stack: string[] = [];
  let isValid = true;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '[') {
      stack.push('[');
      steps.push({ index: i, char, action: 'push', stackAfter: [...stack], isValid: true });
    } else if (char === ']') {
      if (stack.length === 0) {
        isValid = false;
        steps.push({ index: i, char, action: 'error', stackAfter: [...stack], isValid: false });
      } else {
        stack.pop();
        steps.push({ index: i, char, action: 'pop', stackAfter: [...stack], isValid: true });
      }
    }
  }

  const isBalanced = isValid && stack.length === 0;
  return { isBalanced, steps };
};

// Preset examples
const PRESETS = [
  { label: 'Empty', value: '' },
  { label: '[]', value: '[]' },
  { label: '[][]', value: '[][]' },
  { label: '[[]][]', value: '[[]][]' },
  { label: '][', value: '][' },
  { label: '][][', value: '][][' },
  { label: '[]][[]', value: '[]][[]' },
  { label: '[[[[]]]]', value: '[[[[]]]]' },
];

export default function BalancedBracketsVisualization() {
  const [bracketString, setBracketString] = useState('[[]][]');
  const [pairCount, setPairCount] = useState(3);
  const [validationSteps, setValidationSteps] = useState<ValidationStep[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [result, setResult] = useState<boolean | null>(null);
  const [speed, setSpeed] = useState(500);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showStack, setShowStack] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);


  // --- Audio ---
  const playSound = useCallback((type: 'push' | 'pop' | 'error' | 'success' | 'fail' | 'generate') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'push') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.1);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'pop') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.1);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'error') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'success') {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.06, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2 + i * 0.08);
        osc.start(now + i * 0.08);
        osc.stop(now + 0.25 + i * 0.08);
      });
    } else if (type === 'fail') {
      [300, 250, 200].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.06, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15 + i * 0.1);
        osc.start(now + i * 0.1);
        osc.stop(now + 0.2 + i * 0.1);
      });
    } else if (type === 'generate') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    }
  }, [soundEnabled]);

  // --- Validation ---
  const startValidation = useCallback(() => {
    const { isBalanced, steps } = validateBrackets(bracketString);
    setValidationSteps(steps);
    setResult(isBalanced);
    setCurrentStep(-1);
    setIsComplete(false);
    setIsPlaying(true);
  }, [bracketString]);

  // --- Animation Loop ---
  useEffect(() => {
    if (isPlaying && !isComplete) {
      intervalRef.current = window.setInterval(() => {
        setCurrentStep(prev => {
          const next = prev + 1;
          if (next >= validationSteps.length) {
            setIsPlaying(false);
            setIsComplete(true);
            // Check final result
            const finalStack = validationSteps.length > 0 ? validationSteps[validationSteps.length - 1].stackAfter : [];
            const allValid = validationSteps.every(s => s.isValid);
            if (allValid && finalStack.length === 0) {
              playSound('success');
            } else {
              playSound('fail');
            }
            return prev;
          }
          const step = validationSteps[next];
          if (step) {
            playSound(step.action);
          }
          return next;
        });
      }, speed);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, isComplete, validationSteps, speed, playSound]);

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(false);
    setCurrentStep(-1);
    setIsComplete(false);
    setValidationSteps([]);
    setResult(null);
  };

  const generateRandom = () => {
    reset();
    const newStr = generateBrackets(pairCount);
    setBracketString(newStr);
    playSound('generate');
  };

  const togglePlay = () => {
    if (isComplete) {
      reset();
      setTimeout(() => startValidation(), 100);
    } else if (currentStep === -1) {
      startValidation();
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === ' ') { e.preventDefault(); togglePlay(); }
      if (e.key === 'r' || e.key === 'R') reset();
      if (e.key === 'g' || e.key === 'G') generateRandom();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [togglePlay, generateRandom]);

  // Get current stack state
  const currentStack = currentStep >= 0 && currentStep < validationSteps.length
    ? validationSteps[currentStep].stackAfter
    : [];

  // Determine bracket colors
  const getBracketColor = (index: number) => {
    if (currentStep < 0) return 'text-slate-400';
    if (index > currentStep) return 'text-slate-600';
    const step = validationSteps.find(s => s.index === index);
    if (!step) return 'text-slate-400';
    if (!step.isValid) return 'text-red-400';
    if (step.action === 'push') return 'text-cyan-400';
    if (step.action === 'pop') return 'text-emerald-400';
    return 'text-slate-400';
  };

  const getBracketBg = (index: number) => {
    if (index === currentStep) return 'bg-amber-500/30 border-amber-500';
    if (currentStep >= 0 && index < currentStep) {
      const step = validationSteps.find(s => s.index === index);
      if (step && !step.isValid) return 'bg-red-500/20 border-red-500/50';
    }
    return 'bg-slate-800/50 border-slate-700/50';
  };

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-cyan-950/5 to-slate-950 rounded-xl border border-cyan-900/30 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-cyan-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
              <Layers className="text-cyan-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-cyan-300 tracking-wide">SYNTAX VALIDATOR</h2>
              <p className="text-xs text-cyan-500/70">Bracket Balance Checker</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled 
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' 
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button
              onClick={() => setShowStack(!showStack)}
              className={`p-2 rounded-lg border transition-all ${
                showStack 
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' 
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
              title="Toggle Stack View"
            >
              <Layers size={16} />
            </button>
          </div>
        </div>
      </div>


      {/* Main Content */}
      <div className="p-6 space-y-6">
        
        {/* Input Section */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 space-y-4">
          {/* Bracket Input */}
          <div>
            <label className="text-xs text-slate-500 mb-2 block">Bracket String</label>
            <input
              type="text"
              value={bracketString}
              onChange={(e) => { setBracketString(e.target.value.replace(/[^\[\]]/g, '')); reset(); }}
              placeholder="Enter brackets [ and ]"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-xl text-cyan-300 font-mono tracking-widest focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Presets */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-slate-500 self-center">Presets:</span>
            {PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => { setBracketString(preset.value); reset(); }}
                className={`px-3 py-1.5 text-xs rounded-lg border font-mono transition-all ${
                  bracketString === preset.value
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50'
                }`}
              >
                {preset.label || '(empty)'}
              </button>
            ))}
          </div>

          {/* Generator */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Generate with</span>
              <input
                type="number"
                value={pairCount}
                onChange={(e) => setPairCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                className="w-16 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-cyan-300 font-mono text-center focus:outline-none focus:border-cyan-500"
                min={1}
                max={20}
              />
              <span className="text-xs text-slate-500">pairs</span>
            </div>
            <button
              onClick={generateRandom}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50 transition-all"
            >
              <Shuffle size={16} />
              <span className="text-sm">Random</span>
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={togglePlay}
            disabled={bracketString.length === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${
              bracketString.length === 0
                ? 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'
                : isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-500/30'
            }`}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            {isComplete ? 'REPLAY' : isPlaying ? 'PAUSE' : 'VALIDATE'}
          </button>
          
          <button
            onClick={reset}
            className="px-4 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
          >
            <RotateCcw size={18} />
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <Zap size={14} className="text-slate-500" />
            <input
              type="range"
              min={100}
              max={1000}
              step={100}
              value={1100 - speed}
              onChange={(e) => setSpeed(1100 - parseInt(e.target.value))}
              className="w-24 accent-cyan-500"
            />
            <span className="text-xs text-slate-500 w-12">{speed}ms</span>
          </div>
        </div>

        {/* Main Visualization Area */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-4">
          
          {/* Bracket Display */}
          <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-6 relative overflow-hidden min-h-[200px]">
            {/* Scanline effect */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <motion.div
                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"
                animate={{ y: [0, 200, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              />
            </div>

            {bracketString.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-600 text-sm">
                Enter brackets or generate a random string
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 justify-center items-center">
                {bracketString.split('').map((char, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ 
                      scale: idx === currentStep ? 1.2 : 1, 
                      opacity: 1,
                      y: idx === currentStep ? -4 : 0
                    }}
                    transition={{ duration: 0.2 }}
                    className={`relative w-12 h-16 flex items-center justify-center rounded-lg border-2 font-mono text-3xl font-bold transition-all ${getBracketBg(idx)} ${getBracketColor(idx)}`}
                  >
                    {char}
                    {/* Index badge */}
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-slate-600 font-normal">
                      {idx}
                    </span>
                    {/* Action indicator */}
                    <AnimatePresence>
                      {idx === currentStep && validationSteps[currentStep] && (
                        <motion.div
                          initial={{ scale: 0, y: -10 }}
                          animate={{ scale: 1, y: -30 }}
                          exit={{ scale: 0 }}
                          className={`absolute -top-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            validationSteps[currentStep].action === 'push' 
                              ? 'bg-cyan-500 text-slate-900'
                              : validationSteps[currentStep].action === 'pop'
                              ? 'bg-emerald-500 text-slate-900'
                              : 'bg-red-500 text-white'
                          }`}
                        >
                          {validationSteps[currentStep].action}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Progress bar */}
            {validationSteps.length > 0 && (
              <div className="mt-6">
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep + 1) / bracketString.length) * 100}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-slate-600">
                  <span>Step {Math.max(0, currentStep + 1)} of {bracketString.length}</span>
                  <span>{Math.round(((currentStep + 1) / bracketString.length) * 100)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Stack Visualization */}
          <AnimatePresence>
            {showStack && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-slate-900/30 rounded-xl border border-slate-800 p-4"
              >
                <div className="text-xs text-cyan-400 mb-3 flex items-center gap-2">
                  <Layers size={14} />
                  STACK
                </div>
                
                <div className="relative h-40 flex flex-col-reverse items-center justify-start gap-1 overflow-hidden">
                  {/* Stack base */}
                  <div className="w-full h-2 bg-slate-700 rounded-t" />
                  
                  {/* Stack items */}
                  <AnimatePresence mode="popLayout">
                    {currentStack.map((item, idx) => (
                      <motion.div
                        key={`stack-${idx}`}
                        initial={{ scale: 0, y: -20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0, y: -20, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="w-10 h-8 bg-gradient-to-r from-cyan-500/30 to-cyan-600/30 border border-cyan-500/50 rounded flex items-center justify-center text-cyan-300 font-mono font-bold"
                      >
                        {item}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {/* Empty state */}
                  {currentStack.length === 0 && currentStep >= 0 && (
                    <div className="text-slate-600 text-xs">Empty</div>
                  )}
                </div>

                <div className="mt-2 text-center text-xs text-slate-500">
                  Depth: {currentStack.length}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>


        {/* Result Display */}
        <AnimatePresence>
          {isComplete && result !== null && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`rounded-xl border-2 p-6 text-center ${
                result
                  ? 'bg-emerald-500/10 border-emerald-500/50'
                  : 'bg-red-500/10 border-red-500/50'
              }`}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                  result ? 'bg-emerald-500/20' : 'bg-red-500/20'
                }`}
              >
                {result ? (
                  <Check className="text-emerald-400" size={32} />
                ) : (
                  <X className="text-red-400" size={32} />
                )}
              </motion.div>
              
              <h3 className={`text-2xl font-bold mb-2 ${result ? 'text-emerald-300' : 'text-red-300'}`}>
                {result ? 'BALANCED' : 'NOT BALANCED'}
              </h3>
              
              <p className="text-sm text-slate-400">
                {result 
                  ? 'All brackets are properly matched and nested!'
                  : validationSteps.some(s => !s.isValid)
                    ? 'Found unmatched closing bracket'
                    : 'Unmatched opening brackets remain on stack'
                }
              </p>

              {/* Stats */}
              <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-slate-700/50">
                <div className="text-center">
                  <div className="text-lg font-bold text-cyan-400 font-mono">
                    {bracketString.split('[').length - 1}
                  </div>
                  <div className="text-[10px] text-slate-500">Opening [</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-400 font-mono">
                    {bracketString.split(']').length - 1}
                  </div>
                  <div className="text-[10px] text-slate-500">Closing ]</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-400 font-mono">
                    {validationSteps.filter(s => s.action === 'pop').length}
                  </div>
                  <div className="text-[10px] text-slate-500">Matched</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step History */}
        {validationSteps.length > 0 && currentStep >= 0 && (
          <div className="bg-slate-900/30 rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs text-cyan-400">Validation Log</span>
              <span className="text-[10px] text-slate-500">{currentStep + 1} operations</span>
            </div>
            <div className="max-h-32 overflow-y-auto custom-scrollbar">
              <div className="p-2 space-y-1">
                {validationSteps.slice(0, currentStep + 1).map((step, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center gap-3 px-3 py-1.5 rounded text-xs font-mono ${
                      !step.isValid 
                        ? 'bg-red-500/10 text-red-300'
                        : step.action === 'push'
                        ? 'bg-cyan-500/10 text-cyan-300'
                        : 'bg-emerald-500/10 text-emerald-300'
                    }`}
                  >
                    <span className="text-slate-500 w-6">[{step.index}]</span>
                    <span className="w-4">{step.char}</span>
                    <span className={`uppercase text-[10px] px-1.5 py-0.5 rounded ${
                      step.action === 'push' ? 'bg-cyan-500/30' :
                      step.action === 'pop' ? 'bg-emerald-500/30' : 'bg-red-500/30'
                    }`}>
                      {step.action}
                    </span>
                    <span className="text-slate-500 ml-auto">
                      stack: [{step.stackAfter.join('')}]
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-[10px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-cyan-500/30 border border-cyan-500/50"></span>
            Push [ to stack
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/50"></span>
            Pop ] from stack
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-500/30 border border-red-500/50"></span>
            Error (unmatched)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500"></span>
            Current position
          </span>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Space</kbd> Play/Pause
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">G</kbd> Generate
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
          How does bracket validation work?
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            The algorithm uses a <span className="text-cyan-300">stack</span> data structure to validate brackets:
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>For each <span className="text-cyan-300">[</span>, push it onto the stack</li>
            <li>For each <span className="text-emerald-300">]</span>, pop from the stack (if not empty)</li>
            <li>If we try to pop from an empty stack → <span className="text-red-300">unbalanced</span></li>
            <li>If stack is empty at the end → <span className="text-emerald-300">balanced!</span></li>
          </ol>
          <p className="mt-2">
            Time complexity: <span className="text-amber-300">O(n)</span> where n is the string length.
          </p>
        </div>
      </details>
    </div>
  );
}
