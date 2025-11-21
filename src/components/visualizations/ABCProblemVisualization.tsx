import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Box, Check, X, RefreshCw, Cuboid } from 'lucide-react';

// The 20 blocks defined in the problem
const BLOCKS = [
  ['B', 'O'], ['X', 'K'], ['D', 'Q'], ['C', 'P'], ['N', 'A'],
  ['G', 'T'], ['R', 'E'], ['T', 'G'], ['Q', 'D'], ['F', 'S'],
  ['J', 'W'], ['H', 'U'], ['V', 'I'], ['A', 'N'], ['O', 'B'],
  ['E', 'R'], ['F', 'S'], ['L', 'Y'], ['P', 'C'], ['Z', 'M']
];

type BlockState = {
  id: number;
  letters: string[];
  isUsed: boolean;
  usedForChar?: string; // The character this block is currently satisfying
};

export default function ABCProblemVisualization() {
  const [input, setInput] = useState("BARK");
  const [solution, setSolution] = useState<{ success: boolean; usedBlocks: number[] } | null>(null);

  // Initialize blocks with unique IDs
  const initialBlocks: BlockState[] = useMemo(() => 
    BLOCKS.map((letters, index) => ({ id: index, letters, isUsed: false })), 
  []);

  // Solver Logic
  const solve = (word: string, availableBlocks: BlockState[]): { success: boolean; usedBlocks: number[] } => {
    if (word.length === 0) return { success: true, usedBlocks: [] };

    const char = word[0].toUpperCase();
    
    for (let i = 0; i < availableBlocks.length; i++) {
      const block = availableBlocks[i];
      if (block.letters.includes(char)) {
        const remainingBlocks = [...availableBlocks];
        remainingBlocks.splice(i, 1); // Remove used block
        
        const result = solve(word.slice(1), remainingBlocks);
        if (result.success) {
          return { success: true, usedBlocks: [block.id, ...result.usedBlocks] };
        }
      }
    }

    return { success: false, usedBlocks: [] };
  };

  // Run solver when input changes
  useEffect(() => {
    const cleanInput = input.trim();
    if (!cleanInput) {
      setSolution(null);
      return;
    }
    
    const result = solve(cleanInput, initialBlocks);
    setSolution(result);
  }, [input, initialBlocks]);

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      
      {/* Input Section */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Cuboid className="text-emerald-400" />
            Word Builder
          </h3>
          <div className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 transition-colors ${
            !input ? 'bg-slate-800 text-slate-500' :
            solution?.success ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
          }`}>
            {!input ? 'Waiting for input...' :
             solution?.success ? <><Check size={16} /> Possible</> : <><X size={16} /> Impossible</>}
          </div>
        </div>

        <div className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
            placeholder="TYPE A WORD..."
            className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl p-6 text-4xl font-black tracking-[0.2em] text-center text-white placeholder:text-slate-700 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all uppercase"
          />
          {input && (
            <button 
              onClick={() => setInput('')}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
            >
              <RefreshCw size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Assembly Line (Used Blocks) */}
      <div className="min-h-[160px] relative">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/0 via-slate-900/50 to-slate-900/0 rounded-full blur-xl" />
        
        <div className="relative z-10 flex flex-wrap justify-center gap-4 perspective-[1000px]">
          <AnimatePresence mode='popLayout'>
            {input.split('').map((char, index) => {
              const usedBlockId = solution?.usedBlocks[index];
              const blockData = initialBlocks.find(b => b.id === usedBlockId);
              const isSolved = solution?.success;

              return (
                <motion.div
                  key={`${index}-${char}`}
                  initial={{ opacity: 0, y: 50, rotateX: -45 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    rotateX: 0,
                    transition: { delay: index * 0.05, type: "spring" }
                  }}
                  exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                  className="relative group"
                >
                  {/* Connection Line */}
                  {index > 0 && (
                    <div className="absolute top-1/2 right-full w-4 h-1 bg-slate-800 -translate-y-1/2 -mr-2 z-0" />
                  )}

                  {/* The Block */}
                  <div className={`
                    w-20 h-20 rounded-xl flex items-center justify-center text-3xl font-black shadow-xl border-b-4 transition-all duration-500 transform-style-3d
                    ${blockData 
                      ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white border-emerald-700 shadow-emerald-500/20' 
                      : 'bg-slate-800 text-slate-600 border-slate-900'
                    }
                    ${!isSolved && blockData ? 'grayscale opacity-50' : ''}
                  `}>
                    {blockData ? (
                      <div className="relative z-10">
                        {char}
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-emerald-300/70 whitespace-nowrap">
                          ({blockData.letters.join('-')})
                        </span>
                      </div>
                    ) : (
                      <span className="opacity-20">?</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Block Pool */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <Box size={16} />
          Available Block Pool ({initialBlocks.length})
        </h3>
        
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-3">
          {initialBlocks.map((block) => {
            const isUsed = solution?.usedBlocks.includes(block.id);
            
            return (
              <motion.div
                key={block.id}
                layout
                initial={false}
                animate={{
                  scale: isUsed ? 0.9 : 1,
                  opacity: isUsed ? 0.3 : 1,
                }}
                className={`
                  aspect-square rounded-lg border-2 flex flex-col items-center justify-center text-sm font-bold transition-colors
                  ${isUsed 
                    ? 'bg-slate-900/50 border-slate-800 text-slate-700' 
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                  }
                `}
              >
                <span>{block.letters[0]}</span>
                <div className={`w-full h-px ${isUsed ? 'bg-slate-800' : 'bg-slate-700'}`} />
                <span>{block.letters[1]}</span>
              </motion.div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
