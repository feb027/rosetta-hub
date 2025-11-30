import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Factory, Cog, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Fraction class for exact arithmetic
class Fraction {
  num: bigint;
  den: bigint;

  constructor(num: bigint | number, den: bigint | number = 1n) {
    this.num = BigInt(num);
    this.den = BigInt(den);
    this.reduce();
  }

  private gcd(a: bigint, b: bigint): bigint {
    a = a < 0n ? -a : a;
    b = b < 0n ? -b : b;
    while (b !== 0n) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a;
  }

  private reduce(): void {
    if (this.den < 0n) {
      this.num = -this.num;
      this.den = -this.den;
    }
    const g = this.gcd(this.num, this.den);
    if (g > 1n) {
      this.num /= g;
      this.den /= g;
    }
  }

  sub(other: Fraction): Fraction {
    return new Fraction(
      this.num * other.den - other.num * this.den,
      this.den * other.den
    );
  }

  mul(n: bigint | number): Fraction {
    return new Fraction(this.num * BigInt(n), this.den);
  }

  toString(): string {
    if (this.den === 1n) return this.num.toString();
    return `${this.num}/${this.den}`;
  }

  isZero(): boolean {
    return this.num === 0n;
  }

  toNumber(): number {
    return Number(this.num) / Number(this.den);
  }
}

interface BernoulliResult {
  index: number;
  value: Fraction;
  isZero: boolean;
}

// Akiyama-Tanigawa algorithm
function computeBernoulli(n: number): BernoulliResult[] {
  const results: BernoulliResult[] = [];
  const A: Fraction[] = [];

  for (let m = 0; m <= n; m++) {
    A[m] = new Fraction(1, m + 1);
    for (let j = m; j >= 1; j--) {
      A[j - 1] = A[j - 1].sub(A[j]).mul(BigInt(j));
    }
    results.push({
      index: m,
      value: A[0],
      isZero: A[0].isZero(),
    });
  }

  return results;
}

export default function BernoulliNumbersVisualization() {
  const [maxN, setMaxN] = useState(20);
  const [results, setResults] = useState<BernoulliResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(300);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showZeros, setShowZeros] = useState(false);
  const [triangleRow, setTriangleRow] = useState<Fraction[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rowRef = useRef<Fraction[]>([]);


  // --- Audio ---
  const playSound = useCallback((type: 'tick' | 'produce' | 'complete' | 'click' | 'gear' | 'zero') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'produce') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
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
        gain.gain.setValueAtTime(0.07, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4 + i * 0.1);
        osc.start(now + i * 0.1);
        osc.stop(now + 0.5 + i * 0.1);
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
    } else if (type === 'gear') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'zero') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  }, [soundEnabled]);

  // Process next Bernoulli number
  const processNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    
    if (nextIndex > maxN) {
      setIsPlaying(false);
      playSound('complete');
      return;
    }

    // Akiyama-Tanigawa step
    rowRef.current[nextIndex] = new Fraction(1, nextIndex + 1);
    for (let j = nextIndex; j >= 1; j--) {
      rowRef.current[j - 1] = rowRef.current[j - 1].sub(rowRef.current[j]).mul(BigInt(j));
    }

    const bernoulli = rowRef.current[0];
    const newResult: BernoulliResult = {
      index: nextIndex,
      value: bernoulli,
      isZero: bernoulli.isZero(),
    };

    setResults(prev => [...prev, newResult]);
    setTriangleRow([...rowRef.current.slice(0, nextIndex + 1)]);
    setCurrentIndex(nextIndex);

    if (newResult.isZero) {
      playSound('zero');
    } else {
      playSound('produce');
    }
  }, [currentIndex, maxN, playSound]);

  // Auto-play effect
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(processNext, speed);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, processNext, speed]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex(-1);
    setResults([]);
    setTriangleRow([]);
    rowRef.current = [];
    playSound('click');
  }, [playSound]);

  const computeAll = useCallback(() => {
    const allResults = computeBernoulli(maxN);
    setResults(allResults);
    setCurrentIndex(maxN);
    playSound('complete');
  }, [maxN, playSound]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ') { e.preventDefault(); setIsPlaying(p => !p); }
      if (e.key === 'r' || e.key === 'R') reset();
      if (e.key === 'a' || e.key === 'A') computeAll();
      if (e.key === 'z' || e.key === 'Z') setShowZeros(p => !p);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [reset, computeAll]);

  const displayResults = showZeros ? results : results.filter(r => !r.isZero);
  const progress = maxN > 0 ? ((currentIndex + 1) / (maxN + 1)) * 100 : 0;


  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-orange-950/10 to-slate-950 rounded-xl border border-orange-900/40 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-orange-800/40 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/15 border border-orange-500/40 relative">
              <Factory className="text-orange-400" size={24} />
              {isPlaying && (
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Cog size={12} className="text-orange-300" />
                </motion.div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-orange-300 tracking-wide">FRACTION FACTORY</h2>
              <p className="text-xs text-orange-500/70">Bernoulli Numbers Generator</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setShowZeros(!showZeros); playSound('click'); }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                showZeros
                  ? 'bg-slate-700 border-slate-600 text-slate-300'
                  : 'bg-orange-500/20 border-orange-500/50 text-orange-300'
              }`}
            >
              {showZeros ? 'Show All' : 'Hide Zeros'}
            </button>
            
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled 
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-300' 
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
        
        {/* Max N Selector */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Zap size={14} />
              Compute B₀ through B<sub>n</sub>
            </div>
            <span className="text-lg font-bold text-orange-400 font-mono">n = {maxN}</span>
          </div>
          <input
            type="range"
            min="10"
            max="60"
            value={maxN}
            onChange={(e) => {
              if (currentIndex < 0) {
                setMaxN(parseInt(e.target.value));
                playSound('click');
              }
            }}
            disabled={currentIndex >= 0}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500 disabled:opacity-50"
          />
          <div className="flex justify-between text-xs text-slate-600 mt-1">
            <span>10</span>
            <span>60</span>
          </div>
        </div>

        {/* Production Line Visualization */}
        <div className="bg-slate-900/30 rounded-xl border border-orange-800/30 p-6 relative overflow-hidden">
          {/* Factory pattern background */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `repeating-linear-gradient(45deg, rgba(249,115,22,0.3) 0px, rgba(249,115,22,0.3) 2px, transparent 2px, transparent 10px)`,
            }} />
          </div>

          {/* Conveyor belt animation */}
          {isPlaying && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-600/30 via-amber-500/30 to-orange-600/30"
              animate={{ backgroundPosition: ['0% 0%', '100% 0%'] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ backgroundSize: '200% 100%' }}
            />
          )}

          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs text-orange-400 flex items-center gap-2">
                <Factory size={14} />
                Production Line - Akiyama-Tanigawa Algorithm
              </div>
              <span className="text-xs text-slate-500 font-mono">
                B<sub>{currentIndex >= 0 ? currentIndex : '?'}</sub> producing...
              </span>
            </div>

            {/* Current row visualization */}
            {triangleRow.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-slate-500 mb-2">Working Array A[]:</div>
                <div className="flex flex-wrap gap-2">
                  {triangleRow.map((frac, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`px-3 py-2 rounded-lg font-mono text-xs ${
                        idx === 0
                          ? 'bg-orange-500/30 border-2 border-orange-400 text-orange-300'
                          : 'bg-slate-800 border border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="text-[10px] text-slate-500 mb-1">A[{idx}]</div>
                      <div className="truncate max-w-[80px]" title={frac.toString()}>
                        {frac.toString().length > 10 ? frac.toString().slice(0, 8) + '...' : frac.toString()}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress bar */}
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-orange-600 to-amber-500 rounded-full relative"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
              >
                {isPlaying && (
                  <motion.div
                    className="absolute right-0 top-0 bottom-0 w-4 bg-white/30"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  />
                )}
              </motion.div>
            </div>
            <div className="text-xs text-slate-500 mt-1 text-right">
              {currentIndex + 1} / {maxN + 1} computed
            </div>
          </div>
        </div>


        {/* Results Table */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-slate-400">
              Bernoulli Numbers {showZeros ? '(All)' : '(Non-zero only)'}
            </div>
            <span className="text-xs text-orange-400 font-mono">
              {displayResults.length} results
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-900">
                <tr className="text-slate-500 text-xs border-b border-slate-700">
                  <th className="text-left py-2 px-3 w-20">Index</th>
                  <th className="text-left py-2 px-3">Fraction</th>
                  <th className="text-right py-2 px-3 w-32">Decimal</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {displayResults.map((result) => (
                    <motion.tr
                      key={result.index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className={`border-t border-slate-800 ${
                        result.index === currentIndex ? 'bg-orange-500/10' : ''
                      }`}
                    >
                      <td className="py-2 px-3">
                        <span className="font-mono text-orange-400">
                          B<sub>{result.index}</sub>
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono">
                        {result.isZero ? (
                          <span className="text-slate-600">0</span>
                        ) : (
                          <span className="text-amber-300">
                            {result.value.toString().length > 40 
                              ? result.value.toString().slice(0, 35) + '...'
                              : result.value.toString()}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono text-right text-slate-400 text-xs">
                        {result.isZero ? '0' : result.value.toNumber().toFixed(6)}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {displayResults.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Factory size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Press START to begin production</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={currentIndex >= maxN}
            className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'bg-orange-500/20 text-orange-300 border border-orange-500/50 hover:bg-orange-500/30'
            } disabled:opacity-50`}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            {isPlaying ? 'PAUSE' : currentIndex >= maxN ? 'COMPLETE' : 'START'}
          </button>
          
          <button
            onClick={processNext}
            disabled={isPlaying || currentIndex >= maxN}
            className="px-4 py-3 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            Step →
          </button>
          
          <button
            onClick={computeAll}
            disabled={currentIndex >= maxN}
            className="px-4 py-3 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            Compute All
          </button>
          
          <button
            onClick={reset}
            className="px-4 py-3 bg-slate-800 text-slate-400 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all"
          >
            <RotateCcw size={18} />
          </button>

          {/* Speed control */}
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <span className="text-xs text-slate-500">Speed:</span>
            <input
              type="range"
              min="50"
              max="800"
              step="50"
              value={850 - speed}
              onChange={(e) => setSpeed(850 - parseInt(e.target.value))}
              className="w-20 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
          </div>
        </div>

        {/* Notable Values */}
        {results.length > 0 && (
          <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
            <div className="text-xs text-slate-400 mb-3">Notable Bernoulli Numbers</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[0, 1, 2, 4, 6, 8, 10, 12].map(idx => {
                const result = results.find(r => r.index === idx);
                if (!result) return null;
                return (
                  <div key={idx} className="bg-slate-800/50 rounded-lg p-3">
                    <div className="text-xs text-orange-400 mb-1">B<sub>{idx}</sub></div>
                    <div className="font-mono text-sm text-amber-300 truncate" title={result.value.toString()}>
                      {result.value.toString().length > 12 
                        ? result.value.toString().slice(0, 10) + '...'
                        : result.value.toString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Target</div>
            <div className="text-xl font-bold text-orange-400 font-mono">B<sub>{maxN}</sub></div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Computed</div>
            <div className="text-xl font-bold text-amber-400 font-mono">{currentIndex + 1}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Non-zero</div>
            <div className="text-xl font-bold text-emerald-400 font-mono">
              {results.filter(r => !r.isZero).length}
            </div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Zero</div>
            <div className="text-xl font-bold text-slate-400 font-mono">
              {results.filter(r => r.isZero).length}
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Space</kbd> Play/Pause
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">A</kbd> Compute All
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Z</kbd> Toggle Zeros
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-orange-400 hover:text-orange-300 transition-colors">
          About Bernoulli Numbers
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            <span className="text-orange-300">Bernoulli numbers</span> are a sequence of rational numbers 
            with deep connections to number theory, appearing in Taylor series expansions of trigonometric 
            and hyperbolic functions.
          </p>
          <p>
            <span className="text-amber-300">Key property:</span> All odd-indexed Bernoulli numbers 
            (except B₁) are zero. B₁ = -1/2 in the modern (NIST) convention.
          </p>
          <p>
            <span className="text-emerald-300">Akiyama-Tanigawa:</span> An efficient algorithm that 
            computes Bernoulli numbers using a triangular array, where each B<sub>n</sub> = A[0] after 
            processing row n.
          </p>
          <div className="mt-3 p-3 bg-slate-800/50 rounded-lg font-mono text-[11px]">
            <div className="text-slate-500 mb-1">// First non-zero Bernoulli numbers</div>
            <div className="text-slate-300">B₀=1, B₁=-1/2, B₂=1/6, B₄=-1/30, B₆=1/42</div>
          </div>
        </div>
      </details>
    </div>
  );
}
