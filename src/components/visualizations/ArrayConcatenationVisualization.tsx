import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Train, Link } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Component ---
export default function ArrayConcatenationVisualization() {
  const [arrayA, setArrayA] = useState<(string | number)[]>([1, 2, 3]);
  const [arrayB, setArrayB] = useState<(string | number)[]>([4, 5, 6]);
  const [result, setResult] = useState<(string | number)[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'moving' | 'coupled'>('idle');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [inputA, setInputA] = useState('1, 2, 3');
  const [inputB, setInputB] = useState('4, 5, 6');

  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio
  useEffect(() => {
    if (soundEnabled && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
  }, [soundEnabled]);

  // Play sounds
  const playSound = useCallback((type: 'chug' | 'couple' | 'whistle') => {
    if (!soundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const currentTime = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    switch (type) {
      case 'chug':
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, currentTime);
        osc.frequency.setValueAtTime(80, currentTime + 0.05);
        gain.gain.setValueAtTime(0.03, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.1);
        break;
      case 'couple':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, currentTime + 0.15);
        gain.gain.setValueAtTime(0.08, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.2);
        break;
      case 'whistle':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, currentTime);
        osc.frequency.setValueAtTime(600, currentTime + 0.2);
        osc.frequency.setValueAtTime(800, currentTime + 0.4);
        gain.gain.setValueAtTime(0.06, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.5);
        break;
    }
    osc.start(currentTime);
    osc.stop(currentTime + 0.6);
  }, [soundEnabled]);

  // Parse input string to array
  const parseInput = (input: string): (string | number)[] => {
    return input.split(',').map(s => {
      const trimmed = s.trim();
      const num = Number(trimmed);
      return isNaN(num) ? trimmed : num;
    }).filter(v => v !== '');
  };

  // Update arrays from input
  useEffect(() => {
    setArrayA(parseInput(inputA));
  }, [inputA]);

  useEffect(() => {
    setArrayB(parseInput(inputB));
  }, [inputB]);

  // Animate concatenation
  const animate = async () => {
    setIsAnimating(true);
    setResult([]);
    setPhase('idle');

    playSound('whistle');
    await new Promise(r => setTimeout(r, 600));

    // Moving phase
    setPhase('moving');
    for (let i = 0; i < 3; i++) {
      playSound('chug');
      await new Promise(r => setTimeout(r, 200));
    }
    await new Promise(r => setTimeout(r, 400));

    // Coupling
    playSound('couple');
    setPhase('coupled');
    setResult([...arrayA, ...arrayB]);

    await new Promise(r => setTimeout(r, 500));
    playSound('whistle');

    setIsAnimating(false);
  };

  const reset = () => {
    setIsAnimating(false);
    setResult([]);
    setPhase('idle');
  };

  // Train car component
  const TrainCar = ({ value, index, color, isResult = false }: { 
    value: string | number; 
    index: number; 
    color: string;
    isResult?: boolean;
  }) => (
    <motion.div
      initial={isResult ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: isResult ? index * 0.1 : 0, type: 'spring', stiffness: 300 }}
      className={`
        relative w-14 h-14 rounded-lg flex items-center justify-center font-mono font-bold text-lg
        border-2 ${color}
        shadow-lg
      `}
    >
      {/* Wheels */}
      <div className="absolute -bottom-2 left-1 w-3 h-3 bg-slate-600 rounded-full border border-slate-500" />
      <div className="absolute -bottom-2 right-1 w-3 h-3 bg-slate-600 rounded-full border border-slate-500" />
      {/* Coupler */}
      {index > 0 && (
        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-3 h-1 bg-slate-500 rounded" />
      )}
      {value}
    </motion.div>
  );

  const presets = [
    { label: 'Numbers', a: '1, 2, 3', b: '4, 5, 6' },
    { label: 'Letters', a: 'a, b, c', b: 'd, e, f' },
    { label: 'Mixed', a: '1, two, 3', b: 'four, 5' },
    { label: 'Single', a: '42', b: '7' },
  ];

  return (
    <div className="w-full min-h-[650px] bg-gradient-to-br from-slate-950 via-orange-950/10 to-slate-950 rounded-xl border border-orange-900/30 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-orange-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
              <Train className="text-orange-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-orange-300 tracking-wide">TRAIN COUPLING YARD</h2>
              <p className="text-xs text-orange-500/70">Array Concatenation Visualizer</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link size={14} />
            <span>array1.concat(array2)</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        
        {/* Train Yard Visualization */}
        <div className="bg-slate-900/50 rounded-xl border border-orange-800/30 p-6 min-h-[200px] relative overflow-hidden">
          {/* Track lines */}
          <div className="absolute bottom-8 left-0 right-0 h-2 bg-slate-800 border-t-2 border-slate-700" />
          <div className="absolute bottom-8 left-0 right-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-4 h-1 bg-amber-900/50"
                style={{ left: `${i * 5 + 2}%`, bottom: -2 }}
              />
            ))}
          </div>

          <div className="relative z-10">
            {phase === 'idle' && (
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8">
                {/* Array A */}
                <div className="text-center">
                  <div className="text-xs text-cyan-400 mb-2 font-mono">Array A</div>
                  <div className="flex gap-1">
                    {arrayA.map((val, idx) => (
                      <TrainCar 
                        key={`a-${idx}`} 
                        value={val} 
                        index={idx} 
                        color="bg-cyan-500/20 border-cyan-500 text-cyan-300"
                      />
                    ))}
                  </div>
                </div>

                <div className="text-4xl text-slate-600">+</div>

                {/* Array B */}
                <div className="text-center">
                  <div className="text-xs text-amber-400 mb-2 font-mono">Array B</div>
                  <div className="flex gap-1">
                    {arrayB.map((val, idx) => (
                      <TrainCar 
                        key={`b-${idx}`} 
                        value={val} 
                        index={idx} 
                        color="bg-amber-500/20 border-amber-500 text-amber-300"
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {phase === 'moving' && (
              <div className="flex justify-center gap-8 mb-8">
                <motion.div
                  animate={{ x: [0, 50, 100] }}
                  transition={{ duration: 0.8, ease: 'easeInOut' }}
                  className="flex gap-1"
                >
                  {arrayA.map((val, idx) => (
                    <TrainCar 
                      key={`a-${idx}`} 
                      value={val} 
                      index={idx} 
                      color="bg-cyan-500/20 border-cyan-500 text-cyan-300"
                    />
                  ))}
                </motion.div>
                <motion.div
                  animate={{ x: [100, 50, 0] }}
                  transition={{ duration: 0.8, ease: 'easeInOut' }}
                  className="flex gap-1"
                >
                  {arrayB.map((val, idx) => (
                    <TrainCar 
                      key={`b-${idx}`} 
                      value={val} 
                      index={idx} 
                      color="bg-amber-500/20 border-amber-500 text-amber-300"
                    />
                  ))}
                </motion.div>
              </div>
            )}

            {phase === 'coupled' && (
              <div className="text-center mb-8">
                <div className="text-xs text-emerald-400 mb-2 font-mono">Result: [{result.join(', ')}]</div>
                <div className="flex justify-center gap-1">
                  <AnimatePresence>
                    {result.map((val, idx) => (
                      <TrainCar 
                        key={`r-${idx}`} 
                        value={val} 
                        index={idx} 
                        color={idx < arrayA.length 
                          ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
                          : "bg-amber-500/20 border-amber-500 text-amber-300"
                        }
                        isResult
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>

          {/* Smoke effect during animation */}
          {isAnimating && (
            <div className="absolute top-4 left-1/4">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-4 h-4 bg-slate-500/30 rounded-full"
                  animate={{
                    y: [-10, -50],
                    x: [0, 20],
                    opacity: [0.5, 0],
                    scale: [1, 2],
                  }}
                  transition={{
                    duration: 1,
                    delay: i * 0.2,
                    repeat: Infinity,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Input Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/50 rounded-xl border border-cyan-800/30 p-4">
            <h3 className="text-sm font-bold text-cyan-300 mb-3">ARRAY A</h3>
            <input
              type="text"
              value={inputA}
              onChange={(e) => setInputA(e.target.value)}
              disabled={isAnimating}
              placeholder="1, 2, 3"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-cyan-400 font-mono focus:outline-none focus:border-cyan-500/50 disabled:opacity-50"
            />
            <div className="mt-2 text-xs text-slate-500">
              Length: {arrayA.length} | [{arrayA.join(', ')}]
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-xl border border-amber-800/30 p-4">
            <h3 className="text-sm font-bold text-amber-300 mb-3">ARRAY B</h3>
            <input
              type="text"
              value={inputB}
              onChange={(e) => setInputB(e.target.value)}
              disabled={isAnimating}
              placeholder="4, 5, 6"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-amber-400 font-mono focus:outline-none focus:border-amber-500/50 disabled:opacity-50"
            />
            <div className="mt-2 text-xs text-slate-500">
              Length: {arrayB.length} | [{arrayB.join(', ')}]
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <button
            onClick={animate}
            disabled={isAnimating}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
              isAnimating
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                : 'bg-orange-500/20 text-orange-400 border border-orange-500/50 hover:bg-orange-500/30'
            }`}
          >
            <Play size={18} />
            {isAnimating ? 'COUPLING...' : 'CONCATENATE'}
          </button>
          <button
            onClick={reset}
            className="px-4 py-3 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap justify-center gap-2">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => { setInputA(preset.a); setInputB(preset.b); reset(); }}
              disabled={isAnimating}
              className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 disabled:opacity-50"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Code Display */}
        <div className="bg-slate-900/50 rounded-xl border border-orange-800/30 p-4">
          <h3 className="text-sm font-bold text-orange-300 mb-3">CODE</h3>
          <pre className="text-sm font-mono bg-slate-800/50 rounded-lg p-4 overflow-x-auto">
            <span className="text-slate-500">// JavaScript</span>
            {'\n'}
            <span className="text-cyan-400">const</span> <span className="text-orange-300">a</span> <span className="text-slate-400">=</span> <span className="text-emerald-400">[{arrayA.map(v => typeof v === 'string' ? `'${v}'` : v).join(', ')}]</span><span className="text-slate-400">;</span>
            {'\n'}
            <span className="text-cyan-400">const</span> <span className="text-orange-300">b</span> <span className="text-slate-400">=</span> <span className="text-emerald-400">[{arrayB.map(v => typeof v === 'string' ? `'${v}'` : v).join(', ')}]</span><span className="text-slate-400">;</span>
            {'\n\n'}
            <span className="text-slate-500">// Method 1: concat()</span>
            {'\n'}
            <span className="text-cyan-400">const</span> <span className="text-orange-300">result1</span> <span className="text-slate-400">=</span> <span className="text-orange-300">a</span><span className="text-slate-400">.</span><span className="text-sky-400">concat</span><span className="text-slate-400">(</span><span className="text-orange-300">b</span><span className="text-slate-400">);</span>
            {'\n\n'}
            <span className="text-slate-500">// Method 2: spread operator</span>
            {'\n'}
            <span className="text-cyan-400">const</span> <span className="text-orange-300">result2</span> <span className="text-slate-400">=</span> <span className="text-slate-400">[...</span><span className="text-orange-300">a</span><span className="text-slate-400">, ...</span><span className="text-orange-300">b</span><span className="text-slate-400">];</span>
            {'\n\n'}
            <span className="text-slate-500">// Result: [{result.length > 0 ? result.map(v => typeof v === 'string' ? `'${v}'` : v).join(', ') : '...'}]</span>
          </pre>
        </div>

        {/* Sound Toggle */}
        <div className="flex justify-center">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              soundEnabled
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}
          >
            Sound: {soundEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Explanation */}
        <details className="bg-slate-900/50 rounded-xl border border-orange-800/30">
          <summary className="px-4 py-3 cursor-pointer text-sm text-orange-400 hover:text-orange-300 transition-colors">
            About Array Concatenation
          </summary>
          <div className="px-4 pb-4 text-xs text-orange-500 space-y-2">
            <p>
              <span className="text-orange-300">Array concatenation</span> combines two or more arrays 
              into a single array, preserving the order of elements.
            </p>
            <p>
              In JavaScript, you can use <span className="text-cyan-300">.concat()</span> method or 
              the <span className="text-cyan-300">spread operator (...)</span> for concatenation.
            </p>
            <p>
              The original arrays remain unchanged - concatenation creates a new array.
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}
