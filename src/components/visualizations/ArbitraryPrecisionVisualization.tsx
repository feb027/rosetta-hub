import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Sparkles, Hash, CheckCircle, XCircle, Telescope } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Component ---
export default function ArbitraryPrecisionVisualization() {
  const [isComputing, setIsComputing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [digitCount, setDigitCount] = useState<number | null>(null);
  const [first20, setFirst20] = useState<string | null>(null);
  const [last20, setLast20] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [exponentSteps, setExponentSteps] = useState<{ exp: string; value: string }[]>([]);
  const [verified, setVerified] = useState<boolean | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);

  // Expected values from Rosetta Code
  const expectedFirst20 = '62060698786608744707';
  const expectedLast20 = '92256259918212890625';

  // Initialize audio
  useEffect(() => {
    if (soundEnabled && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
  }, [soundEnabled]);

  // Play sounds
  const playSound = useCallback((type: 'tick' | 'complete' | 'success' | 'error') => {
    if (!soundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const currentTime = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    switch (type) {
      case 'tick':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600 + Math.random() * 200, currentTime);
        gain.gain.setValueAtTime(0.02, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.05);
        break;
      case 'complete':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, currentTime);
        osc.frequency.setValueAtTime(659, currentTime + 0.15);
        osc.frequency.setValueAtTime(784, currentTime + 0.3);
        gain.gain.setValueAtTime(0.08, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.5);
        break;
      case 'success':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(784, currentTime);
        osc.frequency.setValueAtTime(988, currentTime + 0.1);
        gain.gain.setValueAtTime(0.08, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.2);
        break;
      case 'error':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, currentTime);
        gain.gain.setValueAtTime(0.06, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.2);
        break;
    }
    osc.start(currentTime);
    osc.stop(currentTime + 0.6);
  }, [soundEnabled]);

  // Compute 5^(4^(3^2)) using BigInt
  const compute = async () => {
    setIsComputing(true);
    setResult(null);
    setDigitCount(null);
    setFirst20(null);
    setLast20(null);
    setVerified(null);
    setProgress(0);
    setExponentSteps([]);

    // Step 1: Calculate 3^2 = 9
    await new Promise(r => setTimeout(r, 300));
    setExponentSteps([{ exp: '3²', value: '9' }]);
    setProgress(25);
    playSound('tick');

    // Step 2: Calculate 4^9 = 262144
    await new Promise(r => setTimeout(r, 300));
    const exp1 = BigInt(4) ** BigInt(9);
    setExponentSteps(prev => [...prev, { exp: '4⁹', value: exp1.toString() }]);
    setProgress(50);
    playSound('tick');

    // Step 3: Calculate 5^262144 (this is the big one!)
    await new Promise(r => setTimeout(r, 300));
    setProgress(75);
    playSound('tick');

    // Use setTimeout to not block UI
    await new Promise(r => setTimeout(r, 100));
    
    const bigResult = BigInt(5) ** exp1;
    const resultStr = bigResult.toString();
    
    setResult(resultStr);
    setDigitCount(resultStr.length);
    setFirst20(resultStr.slice(0, 20));
    setLast20(resultStr.slice(-20));
    
    setExponentSteps(prev => [...prev, { exp: '5^262144', value: `${resultStr.length} digits` }]);
    setProgress(100);

    // Verify
    const isCorrect = resultStr.slice(0, 20) === expectedFirst20 && resultStr.slice(-20) === expectedLast20;
    setVerified(isCorrect);
    
    playSound('complete');
    if (isCorrect) {
      setTimeout(() => playSound('success'), 300);
    } else {
      setTimeout(() => playSound('error'), 300);
    }

    setIsComputing(false);
  };

  const reset = () => {
    setIsComputing(false);
    setResult(null);
    setDigitCount(null);
    setFirst20(null);
    setLast20(null);
    setVerified(null);
    setProgress(0);
    setExponentSteps([]);
  };

  // Format large number with ellipsis
  const formatLargeNumber = (num: string, maxLen: number = 50) => {
    if (num.length <= maxLen) return num;
    const half = Math.floor(maxLen / 2) - 2;
    return `${num.slice(0, half)}...${num.slice(-half)}`;
  };

  return (
    <div className="w-full min-h-[750px] bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950 rounded-xl border border-indigo-900/30 font-sans overflow-hidden relative">
      
      {/* Starfield background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.2,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative bg-slate-900/80 border-b border-indigo-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
              <Telescope className="text-indigo-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-indigo-300 tracking-wide">BIG NUMBER OBSERVATORY</h2>
              <p className="text-xs text-indigo-500/70">Arbitrary Precision Calculator</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <Sparkles size={14} className="text-amber-400" />
            <span className="text-xs text-slate-400">
              Computing: <span className="text-amber-300 font-mono">5^(4^(3²))</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative p-6 space-y-6">
        
        {/* Expression Display */}
        <div className="bg-slate-900/50 rounded-xl border border-indigo-800/30 p-6 text-center">
          <div className="text-4xl md:text-6xl font-bold text-indigo-300 font-mono mb-4">
            5<sup className="text-2xl md:text-3xl">4<sup className="text-lg md:text-xl">3<sup className="text-sm md:text-base">2</sup></sup></sup>
          </div>
          <div className="text-sm text-slate-500">
            = 5<sup>4<sup>9</sup></sup> = 5<sup>262144</sup>
          </div>
        </div>

        {/* Computation Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {[
              { exp: '3²', expected: '9', index: 0 },
              { exp: '4⁹', expected: '262,144', index: 1 },
              { exp: '5^262144', expected: '183,231 digits', index: 2 },
            ].map((step, idx) => {
              const computed = exponentSteps[idx];
              return (
                <motion.div
                  key={step.exp}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`bg-slate-900/50 rounded-xl border p-4 text-center transition-all ${
                    computed
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : 'border-slate-700/50'
                  }`}
                >
                  <div className="text-xs text-slate-500 mb-1">Step {idx + 1}</div>
                  <div className="text-2xl font-bold text-indigo-300 font-mono mb-2">{step.exp}</div>
                  <div className={`text-lg font-mono ${computed ? 'text-emerald-400' : 'text-slate-600'}`}>
                    {computed ? computed.value : '—'}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Progress Bar */}
        <div className="bg-slate-900/50 rounded-xl border border-indigo-800/30 p-4">
          <div className="flex justify-between text-xs text-slate-500 mb-2">
            <span>Computation Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Results */}
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            {/* Digit Count */}
            <div className="bg-slate-900/50 rounded-xl border border-indigo-800/30 p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Hash size={20} className="text-amber-400" />
                <span className="text-sm text-slate-400">Total Digits</span>
              </div>
              <div className="text-5xl font-bold text-amber-400 font-mono">
                {digitCount?.toLocaleString()}
              </div>
            </div>

            {/* Verification */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First 20 */}
              <div className={`bg-slate-900/50 rounded-xl border p-4 ${
                verified === true ? 'border-emerald-500/50' : verified === false ? 'border-rose-500/50' : 'border-slate-700/50'
              }`}>
                <div className="text-xs text-slate-500 mb-2">First 20 Digits</div>
                <div className="font-mono text-lg text-cyan-400 break-all">{first20}</div>
                <div className="mt-2 text-xs text-slate-600">
                  Expected: <span className="text-slate-400">{expectedFirst20}</span>
                </div>
                {verified !== null && (
                  <div className={`mt-2 flex items-center gap-1 text-xs ${verified ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {verified ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {verified ? 'Match!' : 'Mismatch'}
                  </div>
                )}
              </div>

              {/* Last 20 */}
              <div className={`bg-slate-900/50 rounded-xl border p-4 ${
                verified === true ? 'border-emerald-500/50' : verified === false ? 'border-rose-500/50' : 'border-slate-700/50'
              }`}>
                <div className="text-xs text-slate-500 mb-2">Last 20 Digits</div>
                <div className="font-mono text-lg text-cyan-400 break-all">{last20}</div>
                <div className="mt-2 text-xs text-slate-600">
                  Expected: <span className="text-slate-400">{expectedLast20}</span>
                </div>
                {verified !== null && (
                  <div className={`mt-2 flex items-center gap-1 text-xs ${verified ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {verified ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {verified ? 'Match!' : 'Mismatch'}
                  </div>
                )}
              </div>
            </div>

            {/* Full Result Preview */}
            <div className="bg-slate-900/50 rounded-xl border border-indigo-800/30 p-4">
              <div className="text-xs text-slate-500 mb-2">Result Preview</div>
              <div className="font-mono text-xs text-slate-400 break-all leading-relaxed max-h-32 overflow-auto">
                {formatLargeNumber(result, 200)}
              </div>
            </div>
          </motion.div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <button
            onClick={compute}
            disabled={isComputing}
            className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
              isComputing
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50 hover:bg-indigo-500/30'
            }`}
          >
            <Play size={18} />
            {isComputing ? 'COMPUTING...' : 'COMPUTE'}
          </button>
          <button
            onClick={reset}
            className="px-6 py-3 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
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
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}
          >
            Sound: {soundEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Explanation */}
        <details className="bg-slate-900/50 rounded-xl border border-indigo-800/30">
          <summary className="px-4 py-3 cursor-pointer text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
            What is Arbitrary-Precision Arithmetic?
          </summary>
          <div className="px-4 pb-4 text-xs text-indigo-500 space-y-3">
            <p>
              <span className="text-indigo-300">Arbitrary-precision arithmetic</span> (also called 
              bignum arithmetic) allows calculations on integers of unlimited size, limited only 
              by available memory.
            </p>
            <p>
              Standard integer types (like 32-bit or 64-bit) can only represent numbers up to 
              certain limits. JavaScript's <span className="text-cyan-300">BigInt</span> type 
              enables working with integers of any size.
            </p>
            <div className="bg-slate-800/50 rounded-lg p-3 font-mono">
              <div className="text-slate-400">// JavaScript BigInt</div>
              <div className="text-emerald-300">const result = 5n ** (4n ** (3n ** 2n));</div>
              <div className="text-slate-500">// Result has 183,231 digits!</div>
            </div>
            <p>
              The expression 5^(4^(3^2)) evaluates right-to-left: first 3² = 9, then 4⁹ = 262,144, 
              and finally 5^262144 which produces a number with over 183,000 digits.
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}
