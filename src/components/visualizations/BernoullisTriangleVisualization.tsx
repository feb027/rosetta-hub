import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Gem, Sparkles, Triangle, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Binomial coefficient C(n, k)
function binomial(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = result * (n - i) / (i + 1);
  }
  return Math.round(result);
}

// Bernoulli's triangle value: B(n, k) = sum of C(n, 0) to C(n, k)
function bernoulliValue(n: number, k: number): number {
  let sum = 0;
  for (let p = 0; p <= k; p++) {
    sum += binomial(n, p);
  }
  return sum;
}

// Generate full Bernoulli triangle up to row n
function generateBernoulliTriangle(maxRow: number): number[][] {
  const triangle: number[][] = [];
  for (let n = 0; n <= maxRow; n++) {
    const row: number[] = [];
    for (let k = 0; k <= n; k++) {
      row.push(bernoulliValue(n, k));
    }
    triangle.push(row);
  }
  return triangle;
}

// Generate Pascal's triangle for comparison
function generatePascalTriangle(maxRow: number): number[][] {
  const triangle: number[][] = [];
  for (let n = 0; n <= maxRow; n++) {
    const row: number[] = [];
    for (let k = 0; k <= n; k++) {
      row.push(binomial(n, k));
    }
    triangle.push(row);
  }
  return triangle;
}

// Color for cell based on value characteristics
function getCellColor(value: number, n: number, k: number, isPowerOf2: boolean, isMersenne: boolean): string {
  if (k === n) {
    // Rightmost diagonal - powers of 2
    return 'from-violet-500/40 to-purple-600/40 border-violet-400/60';
  }
  if (k === n - 1 && n > 0) {
    // Second rightmost - Mersenne numbers (2^n - 1)
    return 'from-amber-500/30 to-orange-600/30 border-amber-400/50';
  }
  if (k === 0) {
    // First column - always 1
    return 'from-cyan-500/30 to-blue-600/30 border-cyan-400/50';
  }
  // Default crystal blue
  return 'from-slate-700/50 to-slate-800/50 border-slate-600/50';
}

export default function BernoullisTriangleVisualization() {
  const [maxRows, setMaxRows] = useState(10);
  const [currentRow, setCurrentRow] = useState(-1);
  const [currentCol, setCurrentCol] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(200);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showPascal, setShowPascal] = useState(false);
  const [highlightMode, setHighlightMode] = useState<'none' | 'powers' | 'diagonal'>('powers');
  const [triangle, setTriangle] = useState<number[][]>([]);
  const [pascalTriangle, setPascalTriangle] = useState<number[][]>([]);
  const [revealedCells, setRevealedCells] = useState<Set<string>>(new Set());

  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Generate triangles when maxRows changes
  useEffect(() => {
    setTriangle(generateBernoulliTriangle(maxRows));
    setPascalTriangle(generatePascalTriangle(maxRows));
  }, [maxRows]);

  // --- Audio ---
  const playSound = useCallback((type: 'crystal' | 'chime' | 'complete' | 'click' | 'power' | 'reveal') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'crystal') {
      // Crystal chime - harmonious tone
      const frequencies = [523, 659, 784]; // C, E, G chord
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq + Math.random() * 20, now);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3 + i * 0.05);
        osc.start(now);
        osc.stop(now + 0.35 + i * 0.05);
      });
    } else if (type === 'chime') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      const baseFreq = 400 + (currentRow * 30) + (currentCol * 20);
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.15);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'power') {
      // Special sound for powers of 2
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc2.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc2.frequency.setValueAtTime(1320, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc2.start(now);
      osc.stop(now + 0.3);
      osc2.stop(now + 0.3);
    } else if (type === 'complete') {
      // Completion fanfare
      [523, 659, 784, 1047, 1319].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.07, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + i * 0.1);
        osc.start(now + i * 0.1);
        osc.stop(now + 0.6 + i * 0.1);
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
    } else if (type === 'reveal') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  }, [soundEnabled, currentRow, currentCol]);

  // Process next cell
  const processNext = useCallback(() => {
    setRevealedCells(prev => {
      const newSet = new Set(prev);
      
      // Find next cell to reveal
      let nextRow = currentRow;
      let nextCol = currentCol + 1;
      
      if (nextRow === -1) {
        nextRow = 0;
        nextCol = 0;
      } else if (nextCol > nextRow) {
        nextRow++;
        nextCol = 0;
      }
      
      if (nextRow > maxRows) {
        setIsPlaying(false);
        playSound('complete');
        return prev;
      }
      
      newSet.add(`${nextRow}-${nextCol}`);
      setCurrentRow(nextRow);
      setCurrentCol(nextCol);
      
      // Play appropriate sound
      if (nextCol === nextRow) {
        playSound('power'); // Power of 2 diagonal
      } else {
        playSound('chime');
      }
      
      return newSet;
    });
  }, [currentRow, currentCol, maxRows, playSound]);

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
    setCurrentRow(-1);
    setCurrentCol(-1);
    setRevealedCells(new Set());
    playSound('click');
  }, [playSound]);

  const revealAll = useCallback(() => {
    const allCells = new Set<string>();
    for (let n = 0; n <= maxRows; n++) {
      for (let k = 0; k <= n; k++) {
        allCells.add(`${n}-${k}`);
      }
    }
    setRevealedCells(allCells);
    setCurrentRow(maxRows);
    setCurrentCol(maxRows);
    playSound('complete');
  }, [maxRows, playSound]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ') { e.preventDefault(); setIsPlaying(p => !p); }
      if (e.key === 'r' || e.key === 'R') reset();
      if (e.key === 'a' || e.key === 'A') revealAll();
      if (e.key === 'p' || e.key === 'P') { setShowPascal(p => !p); playSound('click'); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [reset, revealAll, playSound]);

  // Calculate statistics
  const totalCells = ((maxRows + 1) * (maxRows + 2)) / 2;
  const revealedCount = revealedCells.size;
  const progress = (revealedCount / totalCells) * 100;
  const isComplete = revealedCount === totalCells;

  // Current row sum (should be 2^n)
  const currentRowSum = currentRow >= 0 ? Math.pow(2, currentRow) : 0;

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-indigo-950/10 to-slate-950 rounded-xl border border-indigo-900/40 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-indigo-800/40 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/15 border border-indigo-500/40 relative">
              <Gem className="text-indigo-400" size={24} />
              {isPlaying && (
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Sparkles size={12} className="text-violet-300" />
                </motion.div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-indigo-300 tracking-wide">CRYSTAL PYRAMID</h2>
              <p className="text-xs text-indigo-500/70">Bernoulli's Triangle Explorer</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setShowPascal(!showPascal); playSound('click'); }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-2 ${
                showPascal
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-amber-300'
              }`}
            >
              {showPascal ? <Eye size={14} /> : <EyeOff size={14} />}
              Pascal's △
            </button>
            
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled 
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' 
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
        
        {/* Row Selector */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Triangle size={14} />
              Triangle Size (Rows 0 to n)
            </div>
            <span className="text-lg font-bold text-indigo-400 font-mono">n = {maxRows}</span>
          </div>
          <input
            type="range"
            min="5"
            max="15"
            value={maxRows}
            onChange={(e) => {
              if (revealedCells.size === 0) {
                setMaxRows(parseInt(e.target.value));
                playSound('click');
              }
            }}
            disabled={revealedCells.size > 0}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-50"
          />
          <div className="flex justify-between text-xs text-slate-600 mt-1">
            <span>5</span>
            <span>15</span>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Crystal Formation Progress</span>
            <span className="text-xs text-indigo-400 font-mono">
              {revealedCount} / {totalCells} cells
            </span>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-600 via-violet-500 to-purple-500 rounded-full relative"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.2 }}
            >
              {isPlaying && (
                <motion.div
                  className="absolute right-0 top-0 bottom-0 w-6 bg-white/30"
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              )}
            </motion.div>
          </div>
        </div>

        {/* Triangle Visualization */}
        <div className="bg-slate-900/30 rounded-xl border border-indigo-800/30 p-6 relative overflow-x-auto">
          {/* Crystal background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `linear-gradient(60deg, rgba(99,102,241,0.2) 1px, transparent 1px),
                               linear-gradient(-60deg, rgba(99,102,241,0.2) 1px, transparent 1px)`,
              backgroundSize: '30px 52px',
            }} />
          </div>

          {/* Glow effect when building */}
          {isPlaying && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ 
                background: [
                  'radial-gradient(circle at 50% 30%, rgba(139,92,246,0.1) 0%, transparent 50%)',
                  'radial-gradient(circle at 50% 30%, rgba(139,92,246,0.2) 0%, transparent 60%)',
                  'radial-gradient(circle at 50% 30%, rgba(139,92,246,0.1) 0%, transparent 50%)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}

          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs text-indigo-400 flex items-center gap-2">
                <Gem size={14} />
                {showPascal ? "Pascal's Triangle (Binomial Coefficients)" : "Bernoulli's Triangle (Partial Sums)"}
              </div>
              <div className="text-xs text-slate-500">
                Row {currentRow >= 0 ? currentRow : '—'} | Col {currentCol >= 0 ? currentCol : '—'}
              </div>
            </div>

            {/* Triangle Grid */}
            <div className="flex flex-col items-center gap-2 min-h-[400px]">
              <AnimatePresence>
                {triangle.map((row, n) => (
                  <motion.div
                    key={n}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-2 justify-center"
                  >
                    {row.map((value, k) => {
                      const cellKey = `${n}-${k}`;
                      const isRevealed = revealedCells.has(cellKey);
                      const isCurrent = n === currentRow && k === currentCol;
                      const isPowerOf2 = k === n;
                      const isMersenne = k === n - 1 && n > 0;
                      const isFirstCol = k === 0;
                      const pascalValue = pascalTriangle[n]?.[k] ?? 0;
                      const displayValue = showPascal ? pascalValue : value;
                      
                      const colorClass = getCellColor(value, n, k, isPowerOf2, isMersenne);
                      
                      return (
                        <motion.div
                          key={cellKey}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ 
                            scale: isRevealed ? 1 : 0.5, 
                            opacity: isRevealed ? 1 : 0.2 
                          }}
                          transition={{ 
                            duration: 0.3, 
                            type: 'spring', 
                            stiffness: 200,
                            damping: 15
                          }}
                          className={`
                            relative w-12 h-12 md:w-14 md:h-14 flex items-center justify-center
                            rounded-lg font-mono text-xs md:text-sm font-bold
                            bg-gradient-to-br ${colorClass} border-2
                            transition-all duration-300
                            ${isCurrent ? 'ring-2 ring-violet-400 ring-offset-2 ring-offset-slate-900 scale-110 z-10' : ''}
                            ${isRevealed ? 'shadow-lg' : 'bg-slate-900/50 border-slate-800/50'}
                            ${isPowerOf2 && isRevealed ? 'shadow-violet-500/30' : ''}
                            ${isMersenne && isRevealed ? 'shadow-amber-500/20' : ''}
                          `}
                          style={{
                            boxShadow: isCurrent 
                              ? '0 0 20px rgba(139,92,246,0.5), inset 0 0 10px rgba(139,92,246,0.2)'
                              : undefined
                          }}
                        >
                          {isRevealed ? (
                            <>
                              <span className={`
                                ${isPowerOf2 ? 'text-violet-300' : ''}
                                ${isMersenne ? 'text-amber-300' : ''}
                                ${isFirstCol ? 'text-cyan-300' : ''}
                                ${!isPowerOf2 && !isMersenne && !isFirstCol ? 'text-slate-200' : ''}
                              `}>
                                {displayValue}
                              </span>
                              
                              {/* Tooltip */}
                              <div className="absolute opacity-0 hover:opacity-100 -bottom-10 left-1/2 -translate-x-1/2 bg-black/90 text-[10px] px-2 py-1 rounded whitespace-nowrap pointer-events-none z-20 transition-opacity">
                                B({n},{k}) = {value}
                                {showPascal && <span className="text-amber-300 ml-1">C({n},{k})={pascalValue}</span>}
                              </div>
                            </>
                          ) : (
                            <span className="text-slate-700">?</span>
                          )}
                        </motion.div>
                      );
                    })}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-br from-cyan-500/40 to-blue-600/40 border border-cyan-400/60" />
                <span className="text-slate-400">First Column (1s)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-br from-violet-500/40 to-purple-600/40 border border-violet-400/60" />
                <span className="text-slate-400">Powers of 2 (2ⁿ)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-br from-amber-500/30 to-orange-600/30 border border-amber-400/50" />
                <span className="text-slate-400">Mersenne (2ⁿ-1)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={isComplete}
            className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 hover:bg-indigo-500/30'
            } disabled:opacity-50`}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            {isPlaying ? 'PAUSE' : isComplete ? 'COMPLETE' : 'BUILD'}
          </button>
          
          <button
            onClick={processNext}
            disabled={isPlaying || isComplete}
            className="px-4 py-3 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            Step →
          </button>
          
          <button
            onClick={revealAll}
            disabled={isComplete}
            className="px-4 py-3 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            Reveal All
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
              max="500"
              step="50"
              value={550 - speed}
              onChange={(e) => setSpeed(550 - parseInt(e.target.value))}
              className="w-20 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>

        {/* Properties Panel */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
            <h3 className="text-sm font-semibold text-indigo-300 mb-3 flex items-center gap-2">
              <Sparkles size={16} />
              Key Properties
            </h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5">◆</span>
                <span>
                  <span className="text-violet-300">Rightmost diagonal</span>: Powers of 2 
                  <span className="font-mono text-violet-400 ml-1">(1, 2, 4, 8, 16, ...)</span>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">◆</span>
                <span>
                  <span className="text-amber-300">Second diagonal</span>: Mersenne numbers 
                  <span className="font-mono text-amber-400 ml-1">(1, 3, 7, 15, 31, ...)</span>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">◆</span>
                <span>
                  <span className="text-cyan-300">First column</span>: All 1s (single partition)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 mt-0.5">◆</span>
                <span>
                  Each entry is a <span className="text-indigo-300">partial sum</span> of Pascal's row
                </span>
              </li>
            </ul>
          </div>
          
          <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
            <h3 className="text-sm font-semibold text-indigo-300 mb-3">Formula</h3>
            <div className="bg-slate-900/50 p-3 rounded-lg font-mono text-xs text-indigo-300 mb-3">
              B(n, k) = Σ C(n, p) for p = 0 to k
            </div>
            <p className="text-xs text-slate-400">
              Where <span className="font-mono text-amber-300">C(n, p)</span> is the binomial coefficient 
              from Pascal's triangle.
            </p>
            {currentRow >= 0 && (
              <div className="mt-3 p-2 bg-violet-500/10 rounded-lg border border-violet-500/30">
                <div className="text-xs text-violet-300">
                  Row {currentRow} sum: <span className="font-mono font-bold">{currentRowSum}</span> = 2<sup>{currentRow}</sup>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Rows</div>
            <div className="text-xl font-bold text-indigo-400 font-mono">{maxRows + 1}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Cells Revealed</div>
            <div className="text-xl font-bold text-violet-400 font-mono">{revealedCount}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Current Row Sum</div>
            <div className="text-xl font-bold text-amber-400 font-mono">
              {currentRow >= 0 ? currentRowSum : '—'}
            </div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Max Value</div>
            <div className="text-xl font-bold text-cyan-400 font-mono">
              {triangle[maxRows]?.[maxRows] ?? '—'}
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Space</kbd> Play/Pause
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">A</kbd> Reveal All
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">P</kbd> Toggle Pascal
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
          About Bernoulli's Triangle
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            <span className="text-indigo-300">Bernoulli's Triangle</span> is an array of partial sums 
            of the binomial coefficients from Pascal's triangle. Each entry B(n, k) represents the 
            sum of the first k+1 binomial coefficients in row n.
          </p>
          <p>
            <span className="text-violet-300">Connection to Pascal's:</span> If Pascal's triangle shows 
            "how many ways to choose k from n", Bernoulli's shows "how many ways to choose 
            <em>at most</em> k from n".
          </p>
          <p>
            <span className="text-amber-300">Named after:</span> Jacob Bernoulli (1655-1705), a Swiss 
            mathematician from the famous Bernoulli family, who made significant contributions to 
            probability theory and calculus.
          </p>
          <div className="mt-3 p-3 bg-slate-800/50 rounded-lg font-mono text-[11px]">
            <div className="text-slate-500 mb-1">// Example: Row 4</div>
            <div className="text-slate-400">Pascal:    1  4  6  4  1</div>
            <div className="text-indigo-300">Bernoulli: 1  5 11 15 16  (cumulative sums)</div>
          </div>
        </div>
      </details>
    </div>
  );
}
