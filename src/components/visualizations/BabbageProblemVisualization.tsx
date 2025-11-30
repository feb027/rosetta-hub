import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Cog, Search, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// The target ending digits
const TARGET_ENDING = 269696;
const TARGET_STR = '269696';

// Check if n² ends with target
const checkNumber = (n: number): { square: number; ending: string; matches: boolean } => {
  const square = n * n;
  const ending = square.toString().slice(-6).padStart(6, '0');
  return { square, ending, matches: ending === TARGET_STR };
};

// Find the answer (smallest positive integer whose square ends in 269696)
const findAnswer = (): number => {
  let n = 1;
  while (true) {
    if ((n * n) % 1000000 === TARGET_ENDING) return n;
    n++;
    if (n > 1000000) break; // Safety limit
  }
  return -1;
};

const ANSWER = findAnswer(); // Pre-compute: 25264

export default function BabbageProblemVisualization() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentNumber, setCurrentNumber] = useState(1);
  const [speed, setSpeed] = useState(50);
  const [found, setFound] = useState(false);
  const [testHistory, setTestHistory] = useState<Array<{ n: number; square: number; ending: string }>>([]);
  const [manualTest, setManualTest] = useState('');
  const [manualResult, setManualResult] = useState<{ n: number; square: number; ending: string; matches: boolean } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [gearRotation, setGearRotation] = useState(0);
  const [showBabbageGuess, setShowBabbageGuess] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);


  // --- Audio ---
  const playSound = useCallback((type: 'tick' | 'gear' | 'found' | 'test' | 'wrong' | 'steam') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(120 + Math.random() * 40, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.start(now);
      osc.stop(now + 0.03);
    } else if (type === 'gear') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'found') {
      // Triumphant brass fanfare
      [261, 329, 392, 523].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + i * 0.15);
        gain.gain.setValueAtTime(0.1, now + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + i * 0.15);
        osc.start(now + i * 0.15);
        osc.stop(now + 0.6 + i * 0.15);
      });
    } else if (type === 'test') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'wrong') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'steam') {
      // White noise burst for steam
      const bufferSize = ctx.sampleRate * 0.1;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const gain = ctx.createGain();
      noise.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      noise.start(now);
      noise.stop(now + 0.1);
    }
  }, [soundEnabled]);

  // --- Engine Loop ---
  useEffect(() => {
    if (isRunning && !found) {
      const delay = Math.max(10, 200 - speed * 2);
      intervalRef.current = window.setInterval(() => {
        setCurrentNumber(prev => {
          const result = checkNumber(prev);
          
          // Add to history (keep last 8)
          setTestHistory(h => [...h.slice(-7), { n: prev, square: result.square, ending: result.ending }]);
          
          // Rotate gears
          setGearRotation(r => r + 15);
          
          if (speed < 80) playSound('tick');
          
          if (result.matches) {
            setFound(true);
            setIsRunning(false);
            playSound('found');
            playSound('steam');
            return prev;
          }
          return prev + 1;
        });
      }, delay);
      
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [isRunning, found, speed, playSound]);

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setCurrentNumber(1);
    setFound(false);
    setTestHistory([]);
    setGearRotation(0);
    setManualResult(null);
    setShowBabbageGuess(false);
  };

  const toggleRun = () => {
    if (found) return;
    setIsRunning(!isRunning);
    if (!isRunning) playSound('gear');
  };

  const jumpToAnswer = () => {
    setCurrentNumber(ANSWER - 5);
    setFound(false);
    setTestHistory([]);
  };

  const testManual = () => {
    const n = parseInt(manualTest);
    if (isNaN(n) || n < 1) return;
    const result = checkNumber(n);
    setManualResult({ n, ...result });
    playSound(result.matches ? 'found' : 'test');
  };

  const testBabbageGuess = () => {
    const result = checkNumber(99736);
    setManualResult({ n: 99736, ...result });
    setShowBabbageGuess(true);
    playSound(result.matches ? 'found' : 'wrong');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ') { e.preventDefault(); toggleRun(); }
      if (e.key === 'r' || e.key === 'R') reset();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [found]);

  const currentResult = checkNumber(currentNumber);


  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-amber-950/20 to-slate-950 rounded-xl border border-amber-800/40 font-sans overflow-hidden">
      
      {/* Header - Victorian Style */}
      <div className="bg-gradient-to-r from-amber-900/30 via-amber-800/20 to-amber-900/30 border-b border-amber-700/40 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <motion.div
                animate={{ rotate: gearRotation }}
                transition={{ duration: 0.1 }}
                className="p-2 rounded-lg bg-amber-600/20 border border-amber-500/40"
              >
                <Cog className="text-amber-400" size={24} />
              </motion.div>
              {isRunning && (
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-300 tracking-wide font-serif">THE ANALYTICAL ENGINE</h2>
              <p className="text-xs text-amber-500/70 italic">Babbage's Problem — Anno Domini 1837</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        
        {/* The Question - Parchment Style */}
        <div className="relative bg-amber-100/5 rounded-xl border-2 border-amber-700/30 p-5 overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTEsMTkxLDM2LDAuMDMpIi8+PC9zdmc+')] opacity-50" />
          <div className="relative">
            <p className="text-amber-200/90 font-serif text-center italic leading-relaxed">
              "What is the smallest positive integer whose square ends in the digits{' '}
              <span className="text-amber-400 font-bold not-italic">269,696</span>?"
            </p>
            <p className="text-amber-500/50 text-xs text-center mt-2 font-serif">
              — Charles Babbage, letter to Lord Bowden, 1837
            </p>
          </div>
        </div>

        {/* Mechanical Display */}
        <div className="bg-slate-900/60 rounded-xl border border-amber-800/30 p-6 relative overflow-hidden">
          {/* Decorative Gears */}
          <div className="absolute -top-8 -right-8 opacity-10">
            <motion.div animate={{ rotate: gearRotation }} transition={{ duration: 0.1 }}>
              <Cog size={80} className="text-amber-500" />
            </motion.div>
          </div>
          <div className="absolute -bottom-6 -left-6 opacity-10">
            <motion.div animate={{ rotate: -gearRotation * 0.7 }} transition={{ duration: 0.1 }}>
              <Cog size={60} className="text-amber-500" />
            </motion.div>
          </div>

          <div className="relative grid md:grid-cols-2 gap-6">
            {/* Current Number Display */}
            <div className="space-y-3">
              <div className="text-xs text-amber-500/70 uppercase tracking-wider font-serif">Testing Integer</div>
              <div className="bg-slate-950 rounded-lg border-2 border-amber-700/40 p-4 font-mono">
                <motion.div
                  key={currentNumber}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl text-amber-300 text-center"
                >
                  {currentNumber.toLocaleString()}
                </motion.div>
              </div>
              <div className="text-xs text-slate-500 text-center">n</div>
            </div>

            {/* Square Display */}
            <div className="space-y-3">
              <div className="text-xs text-amber-500/70 uppercase tracking-wider font-serif">Square Result</div>
              <div className="bg-slate-950 rounded-lg border-2 border-amber-700/40 p-4 font-mono">
                <motion.div
                  key={currentResult.square}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl text-center"
                >
                  <span className="text-slate-400">
                    {currentResult.square.toLocaleString().slice(0, -7)}
                  </span>
                  <span className={found ? 'text-emerald-400' : 'text-amber-400'}>
                    {currentResult.ending}
                  </span>
                </motion.div>
              </div>
              <div className="text-xs text-slate-500 text-center">n² (last 6 digits highlighted)</div>
            </div>
          </div>

          {/* Target Comparison */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <div className="text-sm text-slate-400">Target ending:</div>
            <div className="flex gap-1">
              {TARGET_STR.split('').map((digit, i) => {
                const currentDigit = currentResult.ending[i];
                const matches = digit === currentDigit;
                return (
                  <motion.div
                    key={i}
                    className={`w-8 h-10 rounded border-2 flex items-center justify-center font-mono text-lg font-bold ${
                      matches
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                        : 'bg-slate-800 border-slate-700 text-slate-500'
                    }`}
                    animate={matches ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.2 }}
                  >
                    {digit}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={toggleRun}
            disabled={found}
            className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all border-2 ${
              found
                ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                : isRunning
                ? 'bg-red-500/20 text-red-300 border-red-500/50 hover:bg-red-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
            }`}
          >
            {isRunning ? <Pause size={18} /> : <Play size={18} />}
            {isRunning ? 'HALT ENGINE' : 'START ENGINE'}
          </button>
          
          <button
            onClick={reset}
            className="px-4 py-3 rounded-lg bg-slate-800 text-slate-400 border-2 border-slate-700 hover:bg-slate-700 transition-all"
          >
            <RotateCcw size={18} />
          </button>

          <button
            onClick={jumpToAnswer}
            className="px-4 py-3 rounded-lg bg-amber-500/10 text-amber-400 border-2 border-amber-500/30 hover:bg-amber-500/20 transition-all flex items-center gap-2"
          >
            <Zap size={18} />
            Near Answer
          </button>
        </div>

        {/* Speed Control */}
        <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-4">
          <div className="flex items-center gap-4">
            <span className="text-xs text-amber-500/70 uppercase tracking-wider font-serif whitespace-nowrap">Engine Speed</span>
            <input
              type="range"
              min={1}
              max={100}
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
              className="flex-1 accent-amber-500"
            />
            <span className="text-sm text-amber-400 font-mono w-12 text-right">{speed}%</span>
          </div>
        </div>


        {/* Found Result */}
        <AnimatePresence>
          {found && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-emerald-500/10 rounded-xl border-2 border-emerald-500/40 p-6 text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.1),_transparent_70%)]" />
              <div className="relative">
                <div className="text-emerald-400 text-sm uppercase tracking-wider mb-2 font-serif">Eureka! Solution Found!</div>
                <div className="text-5xl font-bold text-emerald-300 font-mono mb-2">{ANSWER.toLocaleString()}</div>
                <div className="text-slate-400 text-sm">
                  {ANSWER.toLocaleString()}² = <span className="text-emerald-400">{(ANSWER * ANSWER).toLocaleString()}</span>
                </div>
                <div className="mt-4 text-xs text-slate-500">
                  Babbage's guess of 99,736 was <span className="text-red-400">incorrect</span> — the true answer is smaller!
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Test History - Punch Card Style */}
        {testHistory.length > 0 && (
          <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
            <div className="text-xs text-amber-500/70 uppercase tracking-wider mb-3 font-serif">Computation Log</div>
            <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
              {testHistory.map((entry, idx) => (
                <motion.div
                  key={entry.n}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 text-xs font-mono bg-slate-800/30 rounded px-3 py-1.5"
                >
                  <span className="text-slate-500 w-8">#{idx + 1}</span>
                  <span className="text-amber-400 w-20">{entry.n.toLocaleString()}</span>
                  <span className="text-slate-600">→</span>
                  <span className="text-slate-400 flex-1">{entry.square.toLocaleString()}</span>
                  <span className={entry.ending === TARGET_STR ? 'text-emerald-400' : 'text-slate-500'}>
                    ...{entry.ending}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Manual Test Section */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-amber-500/70 uppercase tracking-wider mb-3 font-serif">Manual Verification</div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2 flex-1">
              <input
                type="number"
                value={manualTest}
                onChange={(e) => setManualTest(e.target.value)}
                placeholder="Enter a number..."
                className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-amber-300 font-mono focus:outline-none focus:border-amber-500 transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && testManual()}
              />
              <button
                onClick={testManual}
                className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30 transition-all"
              >
                <Search size={18} />
              </button>
            </div>
            
            <button
              onClick={testBabbageGuess}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all text-sm whitespace-nowrap"
            >
              Test Babbage's Guess (99,736)
            </button>
          </div>

          {/* Manual Result */}
          <AnimatePresence>
            {manualResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mt-4 p-4 rounded-lg border ${
                  manualResult.matches
                    ? 'bg-emerald-500/10 border-emerald-500/40'
                    : 'bg-red-500/10 border-red-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-sm">{manualResult.n.toLocaleString()}² = </span>
                    <span className={`font-mono ${manualResult.matches ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {manualResult.square.toLocaleString()}
                    </span>
                  </div>
                  <div className={`text-sm font-bold ${manualResult.matches ? 'text-emerald-400' : 'text-red-400'}`}>
                    {manualResult.matches ? '✓ MATCHES!' : '✗ Does not match'}
                  </div>
                </div>
                {showBabbageGuess && !manualResult.matches && manualResult.n === 99736 && (
                  <div className="mt-2 text-xs text-slate-500">
                    Babbage was wrong! 99,736² = 9,947,269,696 ends in <span className="text-red-400">269696</span>... 
                    wait, that's correct! But {ANSWER.toLocaleString()} is smaller.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Answer</div>
            <div className="text-xl font-bold text-emerald-400 font-mono">{ANSWER.toLocaleString()}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Answer²</div>
            <div className="text-xl font-bold text-amber-400 font-mono">{(ANSWER * ANSWER).toLocaleString()}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Babbage's Guess</div>
            <div className="text-xl font-bold text-red-400 font-mono">99,736</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Difference</div>
            <div className="text-xl font-bold text-cyan-400 font-mono">{(99736 - ANSWER).toLocaleString()}</div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Space</kbd> Start/Stop
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-amber-400 hover:text-amber-300 transition-colors font-serif">
          About Charles Babbage & The Analytical Engine
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            <span className="text-amber-300">Charles Babbage</span> (1791-1871) was an English mathematician and inventor 
            who originated the concept of a programmable computer. His <span className="text-amber-300">Analytical Engine</span>, 
            designed in the 1830s, was the first general-purpose computing machine.
          </p>
          <p>
            In 1837, Babbage posed this problem as an example of what his engine could solve. He guessed the answer 
            might be <span className="text-red-400">99,736</span>, but the actual smallest answer is{' '}
            <span className="text-emerald-400">{ANSWER.toLocaleString()}</span>.
          </p>
          <p>
            Interestingly, 99,736² = 9,947,269,696 <em>does</em> end in 269,696 — Babbage found <em>a</em> solution, 
            just not the <em>smallest</em> one!
          </p>
        </div>
      </details>
    </div>
  );
}
