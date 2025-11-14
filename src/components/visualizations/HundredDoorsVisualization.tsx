import { useState } from 'react';
import { motion } from 'motion/react';

export default function HundredDoorsVisualization() {
  const [doors, setDoors] = useState<boolean[]>(Array(100).fill(false));
  const [currentPass, setCurrentPass] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(50);
  const [showOnlyOpen, setShowOnlyOpen] = useState(false);

  const resetDoors = () => {
    setDoors(Array(100).fill(false));
    setCurrentPass(0);
    setIsRunning(false);
  };

  const runSimulation = async () => {
    setIsRunning(true);
    const newDoors = Array(100).fill(false);
    
    for (let pass = 1; pass <= 100; pass++) {
      setCurrentPass(pass);
      
      for (let door = pass - 1; door < 100; door += pass) {
        newDoors[door] = !newDoors[door];
      }
      
      setDoors([...newDoors]);
      await new Promise(resolve => setTimeout(resolve, Math.max(10, 101 - speed)));
    }
    
    setIsRunning(false);
  };

  const showOptimized = () => {
    const optimizedDoors = Array(100).fill(false);
    for (let i = 1; i * i <= 100; i++) {
      optimizedDoors[i * i - 1] = true;
    }
    setDoors(optimizedDoors);
    setCurrentPass(100);
  };

  const openDoorsCount = doors.filter(d => d).length;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
        <div className="flex flex-wrap gap-3 items-center justify-between mb-3">
          <div className="flex gap-2">
            <button
              onClick={runSimulation}
              disabled={isRunning}
              className="px-3 py-1.5 text-sm bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              {isRunning ? 'Running...' : 'Run'}
            </button>
            <button
              onClick={showOptimized}
              disabled={isRunning}
              className="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              Optimized
            </button>
            <button
              onClick={resetDoors}
              disabled={isRunning}
              className="px-3 py-1.5 text-sm bg-slate-600 hover:bg-slate-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              Reset
            </button>
          </div>

          <label className="flex items-center gap-2 text-slate-300">
            <input
              type="checkbox"
              checked={showOnlyOpen}
              onChange={(e) => setShowOnlyOpen(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
            />
            <span className="text-xs">Only open</span>
          </label>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-xs mb-3">
          <div className="text-slate-400">
            Pass: <span className="text-cyan-400 font-semibold">{currentPass}</span>/100
          </div>
          <div className="text-slate-400">
            Open: <span className="text-green-400 font-semibold">{openDoorsCount}</span>
          </div>
          <div className="text-slate-400">
            Closed: <span className="text-slate-500 font-semibold">{100 - openDoorsCount}</span>
          </div>
        </div>

        {/* Speed Control */}
        <div>
          <label className="flex items-center gap-2 text-slate-300">
            <span className="text-xs font-medium min-w-[50px]">Speed:</span>
            <input
              type="range"
              min="1"
              max="100"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              disabled={isRunning}
              className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <span className="text-xs min-w-[40px] text-right text-slate-400">{speed}%</span>
          </label>
        </div>
      </div>

      {/* Doors Grid - Compact */}
      <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-3">
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))' }}>
          {doors.map((open, index) => {
            if (showOnlyOpen && !open) return null;
            
            return (
              <motion.div
                key={index}
                className={`
                  relative w-full aspect-square rounded border flex items-center justify-center
                  cursor-pointer
                  ${open 
                    ? 'bg-green-500/30 border-green-500/60' 
                    : 'bg-slate-700/40 border-slate-600/40'
                  }
                `}
                animate={{
                  backgroundColor: open ? 'rgba(34, 197, 94, 0.3)' : 'rgba(51, 65, 85, 0.4)',
                  borderColor: open ? 'rgba(34, 197, 94, 0.6)' : 'rgba(71, 85, 105, 0.4)',
                }}
                transition={{ duration: 0.1, ease: 'easeOut' }}
                title={`Door ${index + 1}: ${open ? 'Open' : 'Closed'}`}
              >
                <span className={`
                  text-[0.45rem] font-semibold transition-colors duration-100
                  ${open ? 'text-green-300' : 'text-slate-500'}
                `}>
                  {index + 1}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
          <span>💡</span>
          <span>Key Insight</span>
        </h3>
        <p className="text-slate-300 text-xs leading-relaxed mb-2">
          Only doors at perfect square positions (1, 4, 9, 16, 25, 36, 49, 64, 81, 100) remain open!
        </p>
        <p className="text-slate-400 text-xs leading-relaxed">
          Perfect squares have an odd number of divisors. A door is toggled once per divisor. 
          Door 16 has divisors: 1, 2, 4, 8, 16 (5 - odd) → open. 
          Door 12 has divisors: 1, 2, 3, 4, 6, 12 (6 - even) → closed.
        </p>
      </div>
    </div>
  );
}
