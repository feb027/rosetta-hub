import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipForward, RotateCcw, Calculator, ArrowRight, CheckCircle2, Plus, Equal, ChevronUp, ChevronDown } from 'lucide-react';

// Types
type Grid3x3 = number[]; // Flattened 3x3 array

// Constants
const GRID_SIZE = 3;

// Presets from the problem description
const PRESETS = {
  s1: [1, 2, 0, 2, 1, 1, 0, 1, 3],
  s2: [2, 1, 3, 1, 0, 1, 0, 1, 0],
  s3: [3, 3, 3, 3, 3, 3, 3, 3, 3],
  s3_id: [2, 1, 2, 1, 0, 1, 2, 1, 2],
  zero: [0, 0, 0, 0, 0, 0, 0, 0, 0],
};

// Helper: Check if grid is stable (all cells < 4)
const isStable = (grid: Grid3x3) => grid.every(cell => cell < 4);

// Helper: Add two grids
const addGrids = (a: Grid3x3, b: Grid3x3): Grid3x3 => {
  return a.map((val, i) => val + b[i]);
};

// Helper: Perform a single topple step
// Returns { newGrid, toppledIndices }
const toppleStep = (grid: Grid3x3): { newGrid: Grid3x3; toppledIndices: number[] } => {
  const newGrid = [...grid];
  const toppledIndices: number[] = [];
  const changes = new Array(9).fill(0);

  // Identify unstable cells
  for (let i = 0; i < 9; i++) {
    if (grid[i] >= 4) {
      toppledIndices.push(i);
      newGrid[i] -= 4; // Lose 4 grains

      const r = Math.floor(i / 3);
      const c = i % 3;

      // Distribute to neighbors
      const neighbors = [
        { r: r - 1, c: c }, // Up
        { r: r + 1, c: c }, // Down
        { r: r, c: c - 1 }, // Left
        { r: r, c: c + 1 }, // Right
      ];

      for (const n of neighbors) {
        if (n.r >= 0 && n.r < 3 && n.c >= 0 && n.c < 3) {
          const nIdx = n.r * 3 + n.c;
          changes[nIdx]++;
        }
      }
    }
  }

  // Apply changes
  for (let i = 0; i < 9; i++) {
    newGrid[i] += changes[i];
  }

  return { newGrid, toppledIndices };
};

// Helper: Full stabilization sequence
const getStabilizationSequence = (startGrid: Grid3x3) => {
  const sequence: { grid: Grid3x3; toppled: number[] }[] = [];
  let current = [...startGrid];
  
  // Initial state
  sequence.push({ grid: [...current], toppled: [] });

  let iterations = 0;
  const MAX_ITERATIONS = 1000; // Safety break

  while (!isStable(current) && iterations < MAX_ITERATIONS) {
    const { newGrid, toppledIndices } = toppleStep(current);
    current = newGrid;
    sequence.push({ grid: [...current], toppled: toppledIndices });
    iterations++;
  }

  return sequence;
};

export default function AbelianSandpileIdentityVisualization() {
  const [gridA, setGridA] = useState<Grid3x3>(PRESETS.s1);
  const [gridB, setGridB] = useState<Grid3x3>(PRESETS.s2);
  const [resultSequence, setResultSequence] = useState<{ grid: Grid3x3; toppled: number[] }[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>('s1+s2');

  // Calculate result whenever inputs change
  useEffect(() => {
    const sum = addGrids(gridA, gridB);
    const sequence = getStabilizationSequence(sum);
    setResultSequence(sequence);
    setCurrentStep(sequence.length - 1); // Jump to result by default? Or 0? Let's jump to result.
    setIsPlaying(false);
  }, [gridA, gridB]);

  // Auto-play logic
  useEffect(() => {
    let timer: number;
    if (isPlaying) {
      timer = window.setInterval(() => {
        setCurrentStep(prev => {
          if (prev < resultSequence.length - 1) return prev + 1;
          setIsPlaying(false);
          return prev;
        });
      }, 300); // Speed of animation
    }
    return () => clearInterval(timer);
  }, [isPlaying, resultSequence]);

  const handleCellChange = (grid: 'A' | 'B', index: number, value: number) => {
    const newGrid = grid === 'A' ? [...gridA] : [...gridB];
    newGrid[index] = Math.max(0, Math.min(9, value)); // Clamp 0-9 for manual input
    if (grid === 'A') setGridA(newGrid);
    else setGridB(newGrid);
    setActivePreset(null);
  };

  const loadPreset = (name: string) => {
    setActivePreset(name);
    setIsPlaying(false);
    if (name === 's1+s2') {
      setGridA(PRESETS.s1);
      setGridB(PRESETS.s2);
    } else if (name === 's3+id') {
      setGridA(PRESETS.s3);
      setGridB(PRESETS.s3_id);
    } else if (name === 'id+id') {
      setGridA(PRESETS.s3_id);
      setGridB(PRESETS.s3_id);
    }
  };

  const currentResultState = resultSequence[currentStep] || { grid: PRESETS.zero, toppled: [] };
  const isResultStable = isStable(currentResultState.grid);
  const isIdentityMatch = activePreset === 's3+id' && 
    JSON.stringify(currentResultState.grid) === JSON.stringify(PRESETS.s3);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Presets Toolbar */}
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={() => loadPreset('s1+s2')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all border ${
            activePreset === 's1+s2' 
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' 
              : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800'
          }`}
        >
          Example 1 (s1 + s2)
        </button>
        <button
          onClick={() => loadPreset('s3+id')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all border ${
            activePreset === 's3+id' 
              ? 'bg-purple-500/20 text-purple-300 border-purple-500/50' 
              : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800'
          }`}
        >
          Identity Check (s3 + id)
        </button>
        <button
          onClick={() => loadPreset('id+id')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all border ${
            activePreset === 'id+id' 
              ? 'bg-pink-500/20 text-pink-300 border-pink-500/50' 
              : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800'
          }`}
        >
          Identity + Identity
        </button>
      </div>

      {/* Equation Area */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
        
        {/* Grid A */}
        <GridInput 
          label="Grid A" 
          grid={gridA} 
          onChange={(i, v) => handleCellChange('A', i, v)} 
          color="cyan"
        />

        <Plus className="text-slate-600" size={32} />

        {/* Grid B */}
        <GridInput 
          label="Grid B" 
          grid={gridB} 
          onChange={(i, v) => handleCellChange('B', i, v)} 
          color="purple"
        />

        <Equal className="text-slate-600" size={32} />

        {/* Result Grid */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
          <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-4 rounded-xl shadow-2xl">
             <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 text-center flex justify-between items-center">
                <span>Result</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] ${isResultStable ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {isResultStable ? 'STABLE' : 'UNSTABLE'}
                </span>
             </div>
             <div className="grid grid-cols-3 gap-1.5">
              {currentResultState.grid.map((val, i) => (
                <motion.div
                  key={i}
                  layout
                  initial={false}
                  animate={{
                    backgroundColor: currentResultState.toppled.includes(i) ? 'rgba(239, 68, 68, 0.4)' : val >= 4 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(30, 41, 59, 0.5)',
                    scale: currentResultState.toppled.includes(i) ? 1.1 : 1,
                  }}
                  className={`w-12 h-12 flex items-center justify-center rounded-md border border-slate-700 text-lg font-mono font-bold transition-colors ${
                    val >= 4 ? 'text-amber-400' : 'text-slate-200'
                  }`}
                >
                  {val}
                </motion.div>
              ))}
            </div>
            {/* Step Counter */}
            <div className="mt-3 flex justify-between items-center text-xs text-slate-500 font-mono">
               <span>Step: {currentStep} / {resultSequence.length - 1}</span>
            </div>
          </div>
          
          {/* Identity Match Indicator */}
          <AnimatePresence>
            {isIdentityMatch && isResultStable && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute -bottom-12 left-0 right-0 flex justify-center"
              >
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs font-bold">
                  <CheckCircle2 size={14} />
                  Identity Verified!
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Playback Controls */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => { setCurrentStep(0); setIsPlaying(false); }}
          className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          title="Reset"
        >
          <RotateCcw size={20} />
        </button>
        <button
          onClick={() => {
            setIsPlaying(false);
            setCurrentStep(prev => Math.max(0, prev - 1));
          }}
          className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          disabled={currentStep === 0}
        >
          <ArrowRight size={20} className="rotate-180" />
        </button>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`p-2 rounded-lg transition-colors ${
            isPlaying 
              ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' 
              : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
          }`}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button
          onClick={() => {
            setIsPlaying(false);
            setCurrentStep(prev => Math.min(resultSequence.length - 1, prev + 1));
          }}
          className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          disabled={currentStep === resultSequence.length - 1}
        >
          <ArrowRight size={20} />
        </button>
        <button
          onClick={() => {
            setIsPlaying(false);
            setCurrentStep(resultSequence.length - 1);
          }}
          className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          title="Jump to End"
        >
          <SkipForward size={20} />
        </button>
      </div>

      {/* Explanation */}
      <div className="glass p-6 rounded-2xl border border-slate-700/50 text-sm text-slate-400 leading-relaxed">
        <h3 className="text-slate-200 font-bold mb-2 flex items-center gap-2">
          <Calculator size={16} className="text-cyan-400" />
          Sandpile Algebra
        </h3>
        <p>
          In the Abelian Sandpile Model, addition is performed element-wise, followed by stabilization (toppling). 
          Surprisingly, this system forms an abelian group on the set of recurrent configurations. 
          This means there exists a unique <strong>Identity Element</strong> which, when added to any recurrent sandpile, leaves it unchanged.
        </p>
        <p className="mt-2">
          Use the presets above to verify that <code className="text-purple-300">s3 + id = s3</code>, or experiment with your own values.
        </p>
      </div>

    </div>
  );
}

// Sub-component for Grid Input
function GridInput({ label, grid, onChange, color }: { label: string, grid: Grid3x3, onChange: (i: number, v: number) => void, color: 'cyan' | 'purple' }) {
  const colorClass = color === 'cyan' ? 'focus:border-cyan-500 text-cyan-400' : 'focus:border-purple-500 text-purple-400';
  const hoverBorderClass = color === 'cyan' ? 'group-hover:border-cyan-500/50' : 'group-hover:border-purple-500/50';
  
  return (
    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 text-center">{label}</div>
      <div className="grid grid-cols-3 gap-1.5">
        {grid.map((val, i) => (
          <div key={i} className="relative group">
            <input
              type="number"
              min="0"
              max="9"
              value={val}
              onChange={(e) => onChange(i, parseInt(e.target.value) || 0)}
              className={`w-12 h-12 text-center bg-slate-800 border border-slate-700 rounded-md text-lg font-mono font-bold outline-none transition-colors ${colorClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
            />
            {/* Custom Spin Buttons */}
            <div className="absolute right-0 top-0 bottom-0 flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => onChange(i, Math.min(9, val + 1))}
                className="h-6 w-4 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white rounded-tr-md transition-colors"
              >
                <ChevronUp size={10} />
              </button>
              <button 
                onClick={() => onChange(i, Math.max(0, val - 1))}
                className="h-6 w-4 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white rounded-br-md transition-colors"
              >
                <ChevronDown size={10} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
