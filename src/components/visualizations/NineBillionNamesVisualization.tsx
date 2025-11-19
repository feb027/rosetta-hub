import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Calculator, Grid3X3, Info } from 'lucide-react';

// --- Logic ---

// Generate partitions for small n
function generatePartitions(n: number): number[][] {
  const parts: number[][] = [];
  function recurse(target: number, min: number, current: number[]) {
    if (target === 0) {
      parts.push([...current]);
      return;
    }
    for (let i = min; i <= target; i++) {
      recurse(target - i, i, [...current, i]);
    }
  }
  recurse(n, 1, []);
  return parts.reverse(); // Show largest parts first usually looks better
}

// Calculate p(n) for larger n (using memoization)
// Calculate p(n) for larger n (using memoization)
const partitionCache = new Map<number, number>();
partitionCache.set(0, 1);
partitionCache.set(1, 1);

function getPartitionCount(n: number): number {
  if (n < 0) return 0;
  if (partitionCache.has(n)) return partitionCache.get(n)!;

  let sum = 0;
  for (let k = 1; k <= n; k++) {
    const pent1 = (k * (3 * k - 1)) / 2;
    const pent2 = (k * (3 * k + 1)) / 2;
    const sign = k % 2 === 1 ? 1 : -1;

    if (pent1 <= n) sum += sign * getPartitionCount(n - pent1);
    if (pent2 <= n) sum += sign * getPartitionCount(n - pent2);
    
    if (pent1 > n && pent2 > n) break;
  }
  
  partitionCache.set(n, sum);
  return sum;
}

// --- Components ---

export default function NineBillionNamesVisualization() {
  const [n, setN] = useState(5);
  const [mode, setMode] = useState<'visual' | 'calc'>('visual');
  const [isPlaying, setIsPlaying] = useState(false);
  const [partitions, setPartitions] = useState<number[][]>([]);
  const [count, setCount] = useState(0);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Update data when n changes
  useEffect(() => {
    if (mode === 'visual') {
      // Limit visual mode to n <= 40 (increased from 25 due to pagination)
      const safeN = Math.min(n, 40);
      if (safeN !== n) setN(safeN);
      setPartitions(generatePartitions(safeN));
      setCount(getPartitionCount(safeN));
      setCurrentPage(1); // Reset to first page on n change
    } else {
      setCount(getPartitionCount(n));
    }
  }, [n, mode]);

  // Auto-play effect
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setN(prev => {
          const next = prev + 1;
          if (mode === 'visual' && next > 40) {
            setIsPlaying(false);
            return prev;
          }
          if (mode === 'calc' && next > 100) {
             setIsPlaying(false);
             return prev;
          }
          return next;
        });
      }, mode === 'visual' ? 1500 : 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, mode]);

  // Pagination logic
  const totalPages = Math.ceil(partitions.length / itemsPerPage);
  const currentPartitions = partitions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Header / Controls */}
      <div className="glass p-6 rounded-2xl border border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            {mode === 'visual' ? <Grid3X3 size={24} /> : <Calculator size={24} />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Integer Partition {mode === 'visual' ? 'Visualizer' : 'Calculator'}</h2>
            <p className="text-sm text-slate-400">
              {mode === 'visual' ? 'Visualizing Ferrers diagrams' : 'Calculating p(n) growth'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/50 p-1 rounded-xl border border-slate-700/50">
          <button
            onClick={() => { setMode('visual'); setN(5); setIsPlaying(false); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'visual' ? 'bg-cyan-500 text-slate-900 shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Visual Mode
          </button>
          <button
            onClick={() => { setMode('calc'); setN(50); setIsPlaying(false); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'calc' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Calc Mode
          </button>
        </div>
      </div>

      {/* Main Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Input & Stats Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass p-6 rounded-2xl border border-slate-700/50 space-y-6">
            <div>
              <label className="flex justify-between text-sm font-medium text-slate-300 mb-2">
                <span>Integer (n)</span>
                <span className="text-cyan-400 font-mono text-lg">{n}</span>
              </label>
              <input
                type="range"
                min="1"
                max={mode === 'visual' ? "40" : "200"}
                value={n}
                onChange={(e) => setN(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>1</span>
                <span>{mode === 'visual' ? '40' : '200'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 transition-all"
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                <span className="font-medium">{isPlaying ? 'Pause' : 'Auto-Increment'}</span>
              </button>
              <button
                onClick={() => { setN(1); setIsPlaying(false); }}
                className="p-3 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 text-slate-400 hover:text-white border border-slate-600/30 transition-all"
                title="Reset"
              >
                <RotateCcw size={18} />
              </button>
            </div>

            <div className="pt-6 border-t border-slate-700/50">
              <div className="text-center">
                <p className="text-slate-400 text-sm mb-1">Total Partitions p(n)</p>
                <motion.div
                  key={count}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 font-mono"
                >
                  {count.toLocaleString()}
                </motion.div>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="glass p-5 rounded-2xl border border-slate-700/50 bg-blue-500/5">
            <div className="flex items-start gap-3">
              <Info className="text-blue-400 shrink-0 mt-1" size={18} />
              <div className="text-sm text-slate-300 space-y-2">
                <p>
                  <strong>Partitions</strong> represent the number of ways to write {n} as a sum of positive integers.
                </p>
                <p className="text-slate-400 text-xs">
                  The order of addends does not matter. For example, 2+1 and 1+2 are the same partition.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Visualization Area */}
        <div className="lg:col-span-2 min-h-[500px] glass rounded-2xl border border-slate-700/50 p-6 relative overflow-hidden flex flex-col">
          
          {mode === 'visual' ? (
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin mb-4">
                <div className="flex flex-wrap gap-4 content-start">
                  <AnimatePresence mode='popLayout'>
                    {currentPartitions.map((partition, idx) => (
                      <FerrersDiagram 
                        key={partition.join('-') + idx} 
                        partition={partition} 
                        index={idx} 
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg text-sm bg-slate-800 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-slate-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg text-sm bg-slate-800 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center relative">
              {/* Simple Graph Visualization for Calc Mode */}
              <div className="absolute inset-0 flex items-end justify-between px-4 pb-4 gap-1 opacity-50">
                {Array.from({ length: 20 }).map((_, i) => {
                  const val = getPartitionCount(Math.max(1, n - 19 + i));
                  const maxVal = getPartitionCount(n);
                  const height = (val / maxVal) * 100;
                  return (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(5, height)}%` }}
                      className="flex-1 bg-gradient-to-t from-purple-500/20 to-cyan-500/50 rounded-t-sm"
                    />
                  );
                })}
              </div>
              <div className="z-10 text-center space-y-4">
                <div className="text-6xl font-bold text-white tracking-tighter drop-shadow-2xl">
                  {n}
                </div>
                <div className="text-purple-300 font-mono">
                  p({n}) ≈ {Math.exp(Math.PI * Math.sqrt(2 * n / 3)) / (4 * n * Math.sqrt(3)) | 0} (Hardy-Ramanujan)
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

const FerrersDiagram = memo(function FerrersDiagram({ partition, index }: { partition: number[]; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: 0.3, delay: (index % 20) * 0.02 }} // Stagger only first few
      className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 hover:border-cyan-500/30 transition-colors group"
    >
      <div className="flex flex-col gap-1 items-start">
        {partition.map((num, rowIdx) => (
          <div key={rowIdx} className="flex gap-1">
            {Array.from({ length: num }).map((_, colIdx) => (
              <div
                key={colIdx}
                className={`w-3 h-3 rounded-sm transition-all duration-500 ${
                  colIdx === 0 ? 'bg-cyan-500/80' : 'bg-cyan-500/30 group-hover:bg-cyan-500/50'
                }`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 text-xs text-slate-500 font-mono group-hover:text-cyan-400 transition-colors">
        {partition.join(' + ')}
      </div>
    </motion.div>
  );
});
