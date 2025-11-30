import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, CheckCircle2, XCircle, AlertTriangle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type AssertionResult = 'pending' | 'pass' | 'fail';

interface AssertionTest {
  id: number;
  variable: string;
  value: number;
  expected: number;
  result: AssertionResult;
  message: string;
}

const PRESETS = [
  { name: 'The Answer', value: 42, expected: 42 },
  { name: 'Off by One', value: 41, expected: 42 },
  { name: 'Double', value: 84, expected: 42 },
  { name: 'Negative', value: -42, expected: 42 },
  { name: 'Zero', value: 0, expected: 42 },
  { name: 'Random', value: Math.floor(Math.random() * 100), expected: 42 },
];

export default function AssertionsVisualization() {
  const [inputValue, setInputValue] = useState(42);
  const [expectedValue, setExpectedValue] = useState(42);
  const [tests, setTests] = useState<AssertionTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<AssertionTest | null>(null);
  const [inspectorPhase, setInspectorPhase] = useState<'idle' | 'scanning' | 'judging' | 'done'>('idle');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [testCounter, setTestCounter] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);


  // --- Audio ---
  const playSound = useCallback((type: 'scan' | 'pass' | 'fail' | 'click' | 'alarm') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'scan') {
      // Scanning beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(1200, now + 0.1);
      osc.frequency.setValueAtTime(800, now + 0.2);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'pass') {
      // Success chime
      [523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.1, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4 + i * 0.1);
        osc.start(now + i * 0.1);
        osc.stop(now + 0.5 + i * 0.1);
      });
    } else if (type === 'fail') {
      // Failure buzz
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'alarm') {
      // Alert alarm
      [400, 300, 400, 300].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + i * 0.15);
        gain.gain.setValueAtTime(0.08, now + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12 + i * 0.15);
        osc.start(now + i * 0.15);
        osc.stop(now + 0.15 + i * 0.15);
      });
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  }, [soundEnabled]);


  // --- Run Assertion ---
  const runAssertion = useCallback(() => {
    if (isRunning) return;
    
    setIsRunning(true);
    setInspectorPhase('scanning');
    playSound('scan');
    
    const newTest: AssertionTest = {
      id: testCounter,
      variable: 'x',
      value: inputValue,
      expected: expectedValue,
      result: 'pending',
      message: '',
    };
    
    setCurrentTest(newTest);
    setTestCounter(prev => prev + 1);
    
    // Phase 1: Scanning (1s)
    setTimeout(() => {
      setInspectorPhase('judging');
      
      // Phase 2: Judging (0.8s)
      setTimeout(() => {
        const passed = inputValue === expectedValue;
        const finalTest: AssertionTest = {
          ...newTest,
          result: passed ? 'pass' : 'fail',
          message: passed 
            ? `✓ Assertion passed: ${inputValue} === ${expectedValue}`
            : `✗ AssertionError: Expected ${expectedValue}, got ${inputValue}`,
        };
        
        setCurrentTest(finalTest);
        setTests(prev => [finalTest, ...prev].slice(0, 10));
        setInspectorPhase('done');
        
        if (passed) {
          playSound('pass');
        } else {
          playSound('fail');
          setTimeout(() => playSound('alarm'), 200);
        }
        
        // Reset after showing result
        setTimeout(() => {
          setIsRunning(false);
          setInspectorPhase('idle');
          setCurrentTest(null);
        }, 1500);
      }, 800);
    }, 1000);
  }, [inputValue, expectedValue, isRunning, testCounter, playSound]);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setInputValue(preset.value);
    setExpectedValue(preset.expected);
    playSound('click');
  };

  const reset = () => {
    setTests([]);
    setCurrentTest(null);
    setIsRunning(false);
    setInspectorPhase('idle');
    setTestCounter(0);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); runAssertion(); }
      if (e.key === 'r' || e.key === 'R') reset();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [runAssertion]);

  const passCount = tests.filter(t => t.result === 'pass').length;
  const failCount = tests.filter(t => t.result === 'fail').length;


  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-amber-950/10 to-slate-950 rounded-xl border border-amber-900/40 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-amber-800/40 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/40">
              <AlertTriangle className="text-amber-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-300 tracking-wide">QUALITY CONTROL</h2>
              <p className="text-xs text-amber-500/70">Assertion Inspector Station</p>
            </div>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border transition-all ${
              soundEnabled 
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' 
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        
        {/* Inspector Station */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-6 relative overflow-hidden">
          {/* Warning stripes background */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(251,191,36,0.5) 10px,
                rgba(251,191,36,0.5) 20px
              )`,
            }} />
          </div>

          {/* Status lights */}
          <div className="relative flex items-center justify-between mb-6 pb-4 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
                inspectorPhase === 'idle' ? 'bg-slate-600' :
                inspectorPhase === 'scanning' ? 'bg-cyan-400 animate-pulse shadow-lg shadow-cyan-500/50' :
                inspectorPhase === 'judging' ? 'bg-amber-400 animate-pulse shadow-lg shadow-amber-500/50' :
                currentTest?.result === 'pass' ? 'bg-emerald-400 shadow-lg shadow-emerald-500/50' :
                'bg-rose-400 shadow-lg shadow-rose-500/50'
              }`} />
              <span className="text-sm font-mono text-slate-400">
                {inspectorPhase === 'idle' ? 'READY' :
                 inspectorPhase === 'scanning' ? 'SCANNING...' :
                 inspectorPhase === 'judging' ? 'EVALUATING...' :
                 currentTest?.result === 'pass' ? 'PASSED' : 'FAILED'}
              </span>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              TEST #{testCounter}
            </div>
          </div>

          {/* Main Inspection Area */}
          <div className="relative min-h-[200px] flex items-center justify-center">
            {/* Conveyor belt effect */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 rounded-b-lg overflow-hidden">
              <motion.div
                className="absolute inset-0"
                style={{
                  backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(0,0,0,0.3) 20px, rgba(0,0,0,0.3) 40px)',
                }}
                animate={isRunning ? { x: [0, -40] } : {}}
                transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
              />
            </div>

            {/* The Value Box */}
            <motion.div
              className={`relative z-10 w-48 h-32 rounded-xl border-4 flex flex-col items-center justify-center transition-colors duration-300 ${
                inspectorPhase === 'idle' ? 'bg-slate-800 border-slate-600' :
                inspectorPhase === 'scanning' ? 'bg-cyan-900/30 border-cyan-500' :
                inspectorPhase === 'judging' ? 'bg-amber-900/30 border-amber-500' :
                currentTest?.result === 'pass' ? 'bg-emerald-900/30 border-emerald-500' :
                'bg-rose-900/30 border-rose-500'
              }`}
              animate={
                inspectorPhase === 'scanning' ? { scale: [1, 1.02, 1] } :
                inspectorPhase === 'judging' ? { rotate: [-1, 1, -1] } :
                inspectorPhase === 'done' && currentTest?.result === 'fail' ? { x: [-5, 5, -5, 5, 0] } :
                {}
              }
              transition={{ duration: 0.3, repeat: inspectorPhase === 'scanning' || inspectorPhase === 'judging' ? Infinity : 0 }}
            >
              {/* Barcode decoration */}
              <div className="absolute top-2 right-2 flex gap-0.5">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className={`w-0.5 bg-slate-500 ${i % 2 === 0 ? 'h-3' : 'h-4'}`} />
                ))}
              </div>
              
              <div className="text-xs text-slate-500 mb-1">VALUE</div>
              <div className={`text-5xl font-bold font-mono transition-colors ${
                inspectorPhase === 'done' && currentTest?.result === 'pass' ? 'text-emerald-400' :
                inspectorPhase === 'done' && currentTest?.result === 'fail' ? 'text-rose-400' :
                'text-slate-200'
              }`}>
                {inputValue}
              </div>
              <div className="text-xs text-slate-500 mt-1">x = {inputValue}</div>

              {/* Scan line effect */}
              <AnimatePresence>
                {inspectorPhase === 'scanning' && (
                  <motion.div
                    className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                    initial={{ top: 0 }}
                    animate={{ top: '100%' }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                )}
              </AnimatePresence>
            </motion.div>

            {/* Expected value indicator */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-center">
              <div className="text-xs text-slate-500 mb-1">EXPECTED</div>
              <div className="text-3xl font-bold font-mono text-amber-400">{expectedValue}</div>
              <div className="text-[10px] text-slate-600 mt-1">assert(x === {expectedValue})</div>
            </div>

            {/* Result stamp */}
            <AnimatePresence>
              {inspectorPhase === 'done' && currentTest && (
                <motion.div
                  initial={{ scale: 3, opacity: 0, rotate: -20 }}
                  animate={{ scale: 1, opacity: 1, rotate: -12 }}
                  exit={{ opacity: 0 }}
                  className={`absolute top-4 left-4 px-4 py-2 rounded border-4 font-bold text-xl ${
                    currentTest.result === 'pass'
                      ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                      : 'border-rose-500 text-rose-400 bg-rose-500/10'
                  }`}
                >
                  {currentTest.result === 'pass' ? 'PASSED' : 'FAILED'}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>


        {/* Controls */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Input Values */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <div className="text-xs text-amber-400 mb-3 flex items-center gap-2">
              <Zap size={14} />
              Test Values
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[10px] text-slate-500 block mb-1">Variable (x)</label>
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-xl text-slate-200 font-mono text-center focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-slate-500 block mb-1">Expected</label>
                <input
                  type="number"
                  value={expectedValue}
                  onChange={(e) => setExpectedValue(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-xl text-amber-400 font-mono text-center focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>
            
            {/* Presets */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-slate-500 self-center">Presets:</span>
              {PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => applyPreset(preset)}
                  className="px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-slate-400 hover:text-amber-300 hover:border-amber-500/50 transition-all"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Run Button */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 flex flex-col justify-center">
            <button
              onClick={runAssertion}
              disabled={isRunning}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                isRunning
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 cursor-wait'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/20'
              }`}
            >
              {isRunning ? (
                <>
                  <div className="w-5 h-5 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                  INSPECTING...
                </>
              ) : (
                <>
                  <Play size={20} />
                  RUN ASSERTION
                </>
              )}
            </button>
            <div className="mt-3 flex gap-2">
              <button
                onClick={reset}
                className="flex-1 py-2 bg-slate-800 text-slate-400 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Code Display */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-amber-400 mb-3">Assertion Code</div>
          <div className="font-mono text-sm bg-black/30 rounded-lg p-4 space-y-1">
            <div>
              <span className="text-cyan-400">const</span>{' '}
              <span className="text-amber-300">x</span>{' '}
              <span className="text-slate-500">=</span>{' '}
              <span className="text-emerald-400">{inputValue}</span>
              <span className="text-slate-500">;</span>
            </div>
            <div className="mt-2">
              <span className="text-cyan-400">console</span>
              <span className="text-slate-300">.</span>
              <span className="text-amber-300">assert</span>
              <span className="text-slate-300">(</span>
              <span className="text-amber-300">x</span>
              <span className="text-slate-300"> === </span>
              <span className="text-emerald-400">{expectedValue}</span>
              <span className="text-slate-300">, </span>
              <span className="text-rose-400">"Expected {expectedValue}"</span>
              <span className="text-slate-300">);</span>
            </div>
            {currentTest && inspectorPhase === 'done' && (
              <div className={`mt-2 ${currentTest.result === 'pass' ? 'text-emerald-400' : 'text-rose-400'}`}>
                <span className="text-slate-500">// </span>
                {currentTest.message}
              </div>
            )}
          </div>
        </div>


        {/* Test History */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-slate-400 mb-3 flex items-center justify-between">
            <span>Test History</span>
            <div className="flex gap-3">
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={12} /> {passCount}
              </span>
              <span className="text-rose-400 flex items-center gap-1">
                <XCircle size={12} /> {failCount}
              </span>
            </div>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {tests.length === 0 ? (
              <div className="text-center py-6 text-slate-600 text-sm">
                No tests run yet. Click "RUN ASSERTION" to begin.
              </div>
            ) : (
              <AnimatePresence>
                {tests.map((test) => (
                  <motion.div
                    key={test.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      test.result === 'pass'
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-rose-500/10 border-rose-500/30'
                    }`}
                  >
                    {test.result === 'pass' ? (
                      <CheckCircle2 className="text-emerald-400 flex-shrink-0" size={20} />
                    ) : (
                      <XCircle className="text-rose-400 flex-shrink-0" size={20} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm truncate">
                        <span className="text-slate-400">assert(</span>
                        <span className={test.result === 'pass' ? 'text-emerald-300' : 'text-rose-300'}>
                          {test.value}
                        </span>
                        <span className="text-slate-400"> === </span>
                        <span className="text-amber-300">{test.expected}</span>
                        <span className="text-slate-400">)</span>
                      </div>
                      <div className={`text-xs mt-0.5 ${
                        test.result === 'pass' ? 'text-emerald-500/70' : 'text-rose-500/70'
                      }`}>
                        {test.result === 'pass' ? 'Assertion passed' : `Expected ${test.expected}, got ${test.value}`}
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 font-mono">
                      #{test.id + 1}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Total Tests</div>
            <div className="text-2xl font-bold text-slate-300 font-mono">{tests.length}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Passed</div>
            <div className="text-2xl font-bold text-emerald-400 font-mono">{passCount}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Failed</div>
            <div className="text-2xl font-bold text-rose-400 font-mono">{failCount}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Pass Rate</div>
            <div className={`text-2xl font-bold font-mono ${
              tests.length === 0 ? 'text-slate-500' :
              passCount / tests.length >= 0.8 ? 'text-emerald-400' :
              passCount / tests.length >= 0.5 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {tests.length === 0 ? '—' : `${Math.round((passCount / tests.length) * 100)}%`}
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Space</kbd> Run
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-amber-400 hover:text-amber-300 transition-colors">
          About Assertions
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            <span className="text-amber-300">Assertions</span> are debugging aids that test assumptions 
            in your code. If an assertion fails, it indicates a bug.
          </p>
          <p>
            <span className="text-emerald-300">console.assert()</span> in JavaScript logs an error 
            if the assertion is false, but doesn't stop execution.
          </p>
          <p>
            <span className="text-rose-300">In other languages</span> like C, Python, or Java, 
            failed assertions typically throw exceptions or halt the program.
          </p>
          <p>
            <span className="text-cyan-300">The number 42</span> is famously "the answer to life, 
            the universe, and everything" from The Hitchhiker's Guide to the Galaxy.
          </p>
        </div>
      </details>
    </div>
  );
}
