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
      {/* Controls - Enhanced */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 relative overflow-hidden">
        {/* Decorative gradient */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 blur-2xl pointer-events-none" />
        
        <div className="relative">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={runSimulation}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              {isRunning ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <span>▶</span>
                  <span>Run Simulation</span>
                </>
              )}
            </button>
            <button
              onClick={showOptimized}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              <span>⚡</span>
              <span>Show Answer</span>
            </button>
            <button
              onClick={resetDoors}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-600 hover:bg-slate-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              <span>↺</span>
              <span>Reset</span>
            </button>

            {/* Only Open Toggle */}
            <label className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700/70 rounded-lg cursor-pointer transition-colors ml-auto">
              <input
                type="checkbox"
                checked={showOnlyOpen}
                onChange={(e) => setShowOnlyOpen(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 cursor-pointer"
              />
              <span className="text-xs text-slate-300 font-medium">Show only open</span>
            </label>
          </div>

          {/* Stats - Enhanced */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="bg-slate-700/30 rounded-lg p-2 border border-slate-600/30">
              <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Pass</div>
              <div className="text-lg font-bold text-cyan-400">{currentPass}<span className="text-xs text-slate-500">/100</span></div>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-2 border border-slate-600/30">
              <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Open</div>
              <div className="text-lg font-bold text-green-400">{openDoorsCount}</div>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-2 border border-slate-600/30">
              <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Closed</div>
              <div className="text-lg font-bold text-slate-500">{100 - openDoorsCount}</div>
            </div>
          </div>

          {/* Speed Control - Enhanced */}
          <div className="bg-slate-700/20 rounded-lg p-3 border border-slate-600/20">
            <label className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-300 min-w-[50px]">Speed:</span>
              <div className="flex-1 relative">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  disabled={isRunning}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:cursor-not-allowed"
                  style={{
                    background: `linear-gradient(to right, rgb(6 182 212) 0%, rgb(6 182 212) ${speed}%, rgb(51 65 85) ${speed}%, rgb(51 65 85) 100%)`
                  }}
                />
              </div>
              <span className="text-xs font-semibold text-cyan-400 min-w-[45px] text-right">{speed}%</span>
            </label>
          </div>
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

      {/* Explanation - Enhanced */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-24 h-24 bg-cyan-500/5 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl pointer-events-none" />
        
        <div className="relative">
          <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <span className="text-lg">💡</span>
            <span>Key Insight</span>
            <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/30 to-transparent ml-2" />
          </h3>
          
          <div className="space-y-3">
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
              <p className="text-cyan-300 text-xs font-semibold mb-1">The Pattern</p>
              <p className="text-slate-300 text-xs leading-relaxed">
                Only doors at perfect square positions remain open: <span className="font-mono text-cyan-400">1, 4, 9, 16, 25, 36, 49, 64, 81, 100</span>
              </p>
            </div>
            
            <div className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-3">
              <p className="text-slate-300 text-xs font-semibold mb-1">Why?</p>
              <p className="text-slate-400 text-xs leading-relaxed">
                Perfect squares have an odd number of divisors. A door is toggled once per divisor.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-green-500/10 border border-green-500/20 rounded p-2">
                <p className="text-green-400 font-semibold mb-1">Door 16 (Open)</p>
                <p className="text-slate-400">Divisors: 1, 2, 4, 8, 16</p>
                <p className="text-green-300 text-[10px] mt-1">5 divisors (odd) → Open</p>
              </div>
              <div className="bg-slate-700/30 border border-slate-600/30 rounded p-2">
                <p className="text-slate-400 font-semibold mb-1">Door 12 (Closed)</p>
                <p className="text-slate-500">Divisors: 1, 2, 3, 4, 6, 12</p>
                <p className="text-slate-500 text-[10px] mt-1">6 divisors (even) → Closed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
