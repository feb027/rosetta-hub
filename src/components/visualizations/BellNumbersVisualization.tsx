import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Flower2, Grid3X3, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Colors for partition groups (no purple)
const PARTITION_COLORS = [
  'bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-cyan-500',
  'bg-sky-500', 'bg-orange-500', 'bg-teal-500', 'bg-pink-500',
];

const PARTITION_BORDERS = [
  'border-rose-400', 'border-amber-400', 'border-emerald-400', 'border-cyan-400',
  'border-sky-400', 'border-orange-400', 'border-teal-400', 'border-pink-400',
];

// Generate all partitions of a set
function generatePartitions(n: number): number[][][] {
  if (n === 0) return [[]];
  if (n === 1) return [[[0]]];
  
  const result: number[][][] = [];
  
  function partition(elements: number[], current: number[][], start: number) {
    if (start === elements.length) {
      result.push(current.map(p => [...p]));
      return;
    }
    
    const elem = elements[start];
    
    // Add to existing partitions
    for (let i = 0; i < current.length; i++) {
      current[i].push(elem);
      partition(elements, current, start + 1);
      current[i].pop();
    }
    
    // Create new partition
    current.push([elem]);
    partition(elements, current, start + 1);
    current.pop();
  }
  
  const elements = Array.from({ length: n }, (_, i) => i);
  partition(elements, [], 0);
  return result;
}

// Generate Bell triangle
function generateBellTriangle(rows: number): bigint[][] {
  const triangle: bigint[][] = [[1n]];
  
  for (let i = 1; i < rows; i++) {
    const prevRow = triangle[i - 1];
    const newRow: bigint[] = [prevRow[prevRow.length - 1]];
    
    for (let j = 1; j <= i; j++) {
      newRow.push(newRow[j - 1] + prevRow[j - 1]);
    }
    
    triangle.push(newRow);
  }
  
  return triangle;
}

export default function BellNumbersVisualization() {
  const [n, setN] = useState(3);
  const [showTriangle, setShowTriangle] = useState(false);
  const [triangleRows, setTriangleRows] = useState(10);
  const [partitions, setPartitions] = useState<number[][][]>([]);
  const [currentPartitionIdx, setCurrentPartitionIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(800);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bellTriangle, setBellTriangle] = useState<bigint[][]>([]);
  const [highlightedCell, setHighlightedCell] = useState<[number, number] | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Generate partitions when n changes
  useEffect(() => {
    if (n <= 6) {
      setPartitions(generatePartitions(n));
    } else {
      setPartitions([]);
    }
    setCurrentPartitionIdx(-1);
  }, [n]);

  // Generate Bell triangle
  useEffect(() => {
    setBellTriangle(generateBellTriangle(triangleRows));
  }, [triangleRows]);


  // --- Audio ---
  const playSound = useCallback((type: 'bloom' | 'tick' | 'complete' | 'click' | 'triangle') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'bloom') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.exponentialRampToValueAtTime(784, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'complete') {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        gain.gain.setValueAtTime(0.07, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4 + i * 0.12);
        osc.start(now + i * 0.12);
        osc.stop(now + 0.5 + i * 0.12);
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
    } else if (type === 'triangle') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.1);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  }, [soundEnabled]);

  // Auto-play partitions
  useEffect(() => {
    if (isPlaying && partitions.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentPartitionIdx(prev => {
          if (prev >= partitions.length - 1) {
            setIsPlaying(false);
            playSound('complete');
            return prev;
          }
          playSound('bloom');
          return prev + 1;
        });
      }, speed);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, partitions.length, speed, playSound]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentPartitionIdx(-1);
    playSound('click');
  }, [playSound]);

  const showAll = useCallback(() => {
    setCurrentPartitionIdx(partitions.length - 1);
    playSound('complete');
  }, [partitions.length, playSound]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ') { e.preventDefault(); setIsPlaying(p => !p); }
      if (e.key === 'r' || e.key === 'R') reset();
      if (e.key === 't' || e.key === 'T') { setShowTriangle(p => !p); playSound('triangle'); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [reset, playSound]);

  const elementLabels = ['a', 'b', 'c', 'd', 'e', 'f'];
  const bellNumber = bellTriangle[n]?.[0] ?? 0n;

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-rose-950/10 to-slate-950 rounded-xl border border-rose-900/40 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-rose-800/40 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/15 border border-rose-500/40">
              <Flower2 className="text-rose-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-rose-300 tracking-wide">PARTITION GARDEN</h2>
              <p className="text-xs text-rose-500/70">Bell Numbers Explorer</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setShowTriangle(!showTriangle); playSound('triangle'); }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-2 ${
                showTriangle
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-amber-300'
              }`}
            >
              <Grid3X3 size={14} />
              Bell Triangle
            </button>
            
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
        
        {/* N Selector */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Sparkles size={14} />
              Set Size (n) - Elements to Partition
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-rose-400 font-mono">n = {n}</span>
              <span className="text-sm text-slate-500">→</span>
              <span className="text-2xl font-bold text-amber-400 font-mono">B<sub className="text-sm">{n}</sub> = {bellNumber.toString()}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4, 5, 6].map(val => (
              <button
                key={val}
                onClick={() => { setN(val); reset(); playSound('click'); }}
                className={`flex-1 py-2 rounded-lg font-mono font-bold transition-all ${
                  n === val
                    ? 'bg-rose-500/30 border-2 border-rose-400 text-rose-300'
                    : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-rose-300 hover:border-rose-500/50'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Partitions Visualization */}
        {!showTriangle && (
          <div className="bg-slate-900/30 rounded-xl border border-rose-800/30 p-6 relative overflow-hidden min-h-[300px]">
            {/* Garden background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 20% 80%, rgba(244,63,94,0.3) 0%, transparent 50%),
                                  radial-gradient(circle at 80% 20%, rgba(251,191,36,0.3) 0%, transparent 50%),
                                  radial-gradient(circle at 50% 50%, rgba(34,211,238,0.2) 0%, transparent 60%)`,
              }} />
            </div>

            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs text-rose-400 flex items-center gap-2">
                  <Flower2 size={14} />
                  Set Partitions of {'{' + elementLabels.slice(0, n).join(', ') + '}'}
                </div>
                <span className="text-xs text-slate-500">
                  {currentPartitionIdx >= 0 ? currentPartitionIdx + 1 : 0} / {partitions.length} partitions
                </span>
              </div>

              {n === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">∅</div>
                  <div className="text-slate-400">Empty set has exactly 1 partition: the empty partition { }</div>
                  <div className="mt-4 text-2xl font-bold text-amber-400">B₀ = 1</div>
                </div>
              ) : partitions.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <div className="text-4xl mb-4">🌱</div>
                  <p>Too many partitions to display visually.</p>
                  <p className="text-sm mt-2">Use the Bell Triangle view for larger values.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {partitions.map((partition, idx) => {
                      const isVisible = idx <= currentPartitionIdx;
                      if (!isVisible && currentPartitionIdx >= 0) return null;
                      
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.8, y: 20 }}
                          animate={{ 
                            opacity: isVisible || currentPartitionIdx < 0 ? 1 : 0.3,
                            scale: 1,
                            y: 0,
                          }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.3, type: 'spring' }}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            idx === currentPartitionIdx
                              ? 'bg-rose-500/10 border-rose-400 shadow-lg shadow-rose-500/20'
                              : 'bg-slate-800/50 border-slate-700/50'
                          }`}
                        >
                          <div className="text-xs text-slate-500 mb-2">Partition #{idx + 1}</div>
                          
                          {/* Visual representation */}
                          <div className="flex flex-wrap gap-2 mb-3 justify-center min-h-[40px]">
                            {partition.map((group, gIdx) => (
                              <motion.div
                                key={gIdx}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: gIdx * 0.1 }}
                                className={`flex items-center gap-1 px-2 py-1 rounded-lg border-2 ${PARTITION_COLORS[gIdx % PARTITION_COLORS.length]}/20 ${PARTITION_BORDERS[gIdx % PARTITION_BORDERS.length]}`}
                              >
                                {group.map((elem, eIdx) => (
                                  <motion.span
                                    key={eIdx}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: gIdx * 0.1 + eIdx * 0.05 }}
                                    className={`w-7 h-7 rounded-full ${PARTITION_COLORS[gIdx % PARTITION_COLORS.length]} flex items-center justify-center text-white font-bold text-sm shadow-md`}
                                  >
                                    {elementLabels[elem]}
                                  </motion.span>
                                ))}
                              </motion.div>
                            ))}
                          </div>
                          
                          {/* Set notation */}
                          <div className="text-center text-xs font-mono text-slate-400">
                            {partition.map((group, gIdx) => (
                              <span key={gIdx}>
                                {'{' + group.map(e => elementLabels[e]).join(' ') + '}'}
                                {gIdx < partition.length - 1 ? ' ' : ''}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        )}


        {/* Bell Triangle View */}
        {showTriangle && (
          <div className="bg-slate-900/30 rounded-xl border border-amber-800/30 p-6 overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs text-amber-400 flex items-center gap-2">
                <Grid3X3 size={14} />
                Bell Triangle (Aitken's Array) - First {triangleRows} Rows
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Rows:</span>
                <select
                  value={triangleRows}
                  onChange={(e) => setTriangleRows(parseInt(e.target.value))}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-slate-300"
                >
                  {[10, 15, 20, 25, 30, 40, 50].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1 min-w-max">
              {bellTriangle.map((row, rowIdx) => (
                <motion.div
                  key={rowIdx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: rowIdx * 0.03 }}
                  className="flex items-center gap-1"
                >
                  <span className="w-8 text-xs text-slate-600 font-mono text-right mr-2">
                    {rowIdx}:
                  </span>
                  {row.map((val, colIdx) => {
                    const isBellNumber = colIdx === 0;
                    const isHighlighted = highlightedCell?.[0] === rowIdx && highlightedCell?.[1] === colIdx;
                    
                    return (
                      <motion.div
                        key={colIdx}
                        onMouseEnter={() => setHighlightedCell([rowIdx, colIdx])}
                        onMouseLeave={() => setHighlightedCell(null)}
                        className={`px-2 py-1 rounded text-xs font-mono cursor-default transition-all ${
                          isBellNumber
                            ? 'bg-amber-500/30 border border-amber-500/50 text-amber-300 font-bold'
                            : isHighlighted
                            ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
                            : 'bg-slate-800/50 border border-slate-700/50 text-slate-400'
                        }`}
                        whileHover={{ scale: 1.1 }}
                      >
                        {val.toString().length > 12 ? val.toString().slice(0, 10) + '...' : val.toString()}
                      </motion.div>
                    );
                  })}
                </motion.div>
              ))}
            </div>

            {/* Triangle construction explanation */}
            <div className="mt-4 p-3 bg-slate-800/50 rounded-lg text-xs text-slate-400">
              <div className="font-bold text-amber-400 mb-1">Construction Rule:</div>
              <div>• Row 0 starts with 1</div>
              <div>• Each row starts with the last value of the previous row</div>
              <div>• Each subsequent value = current cell + cell above it</div>
              <div className="mt-2 text-amber-300">Bell numbers B<sub>n</sub> are the first column values (highlighted)</div>
            </div>
          </div>
        )}

        {/* First 15 Bell Numbers */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-slate-400 mb-3">First 15 Bell Numbers</div>
          <div className="flex flex-wrap gap-2">
            {bellTriangle.slice(0, 15).map((row, idx) => (
              <motion.div
                key={idx}
                onClick={() => { if (idx <= 6) { setN(idx); reset(); } playSound('click'); }}
                className={`px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                  idx === n
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                    : idx <= 6
                    ? 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:border-rose-500/30'
                    : 'bg-slate-800/30 border-slate-700/30 text-slate-500'
                }`}
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-[10px] text-slate-500">B<sub>{idx}</sub></div>
                <div className="font-mono font-bold text-sm">
                  {row[0].toString().length > 8 ? row[0].toString().slice(0, 6) + '...' : row[0].toString()}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Controls */}
        {!showTriangle && n > 0 && partitions.length > 0 && (
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={currentPartitionIdx >= partitions.length - 1 && !isPlaying}
              className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${
                isPlaying
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/50 hover:bg-rose-500/30'
              } disabled:opacity-50`}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              {isPlaying ? 'PAUSE' : currentPartitionIdx >= partitions.length - 1 ? 'COMPLETE' : 'BLOOM'}
            </button>
            
            <button
              onClick={showAll}
              disabled={currentPartitionIdx >= partitions.length - 1}
              className="px-4 py-3 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all disabled:opacity-50"
            >
              Show All
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
                min="200"
                max="1500"
                step="100"
                value={1700 - speed}
                onChange={(e) => setSpeed(1700 - parseInt(e.target.value))}
                className="w-20 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
            </div>
          </div>
        )}


        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Set Size (n)</div>
            <div className="text-xl font-bold text-rose-400 font-mono">{n}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Bell Number B<sub>{n}</sub></div>
            <div className="text-xl font-bold text-amber-400 font-mono">{bellNumber.toString()}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Partitions Shown</div>
            <div className="text-xl font-bold text-cyan-400 font-mono">
              {currentPartitionIdx >= 0 ? currentPartitionIdx + 1 : 0}
            </div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Elements</div>
            <div className="text-xl font-bold text-slate-300 font-mono">
              {n > 0 ? elementLabels.slice(0, n).join(', ') : '∅'}
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Space</kbd> Play/Pause
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">T</kbd> Toggle Triangle
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-rose-400 hover:text-rose-300 transition-colors">
          About Bell Numbers
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            <span className="text-rose-300">Bell numbers</span> (B<sub>n</sub>) count the number of ways 
            to partition a set of n elements into non-empty subsets.
          </p>
          <p>
            <span className="text-amber-300">Bell Triangle:</span> Also known as Aitken's array or Peirce triangle. 
            Each row starts with the last element of the previous row, and each subsequent element is the sum 
            of the element to its left and the element above that.
          </p>
          <p>
            <span className="text-cyan-300">Growth:</span> Bell numbers grow very rapidly. B<sub>10</sub> = 115,975 
            and B<sub>50</sub> has 50 digits!
          </p>
          <div className="mt-3 p-3 bg-slate-800/50 rounded-lg font-mono text-[11px]">
            <div className="text-slate-500 mb-1">// First Bell numbers</div>
            <div className="text-slate-300">1, 1, 2, 5, 15, 52, 203, 877, 4140, 21147, ...</div>
          </div>
        </div>
      </details>
    </div>
  );
}
