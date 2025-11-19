import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shuffle, Plus, Equal, Zap } from 'lucide-react';

export default function APlusBVisualization() {
  const [a, setA] = useState(12);
  const [b, setB] = useState(30);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Trigger a subtle "calculating" pulse when inputs change
  useEffect(() => {
    setIsCalculating(true);
    const timer = setTimeout(() => setIsCalculating(false), 300);
    return () => clearTimeout(timer);
  }, [a, b]);

  const randomize = () => {
    setA(Math.floor(Math.random() * 100));
    setB(Math.floor(Math.random() * 100));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="glass p-8 md:p-12 rounded-3xl border border-slate-700/50 relative overflow-hidden">
        
        {/* Background Ambient Glow */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[100px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[100px] rounded-full" />
        </div>

        <div className="relative z-10 flex flex-col gap-12">
          
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                <Zap className="text-yellow-400 fill-yellow-400/20" size={24} />
                Data Fusion
              </h2>
              <p className="text-slate-400 text-sm">Cyber-Minimalist Adder</p>
            </div>
            <button
              onClick={randomize}
              className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all border border-slate-700 hover:border-slate-600"
              title="Randomize Inputs"
            >
              <Shuffle size={20} />
            </button>
          </div>

          {/* Main Interaction Area */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
            
            {/* Input A */}
            <div className="flex-1 w-full space-y-4 group">
              <div className="flex justify-between items-end">
                <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Input A</label>
                <span className="font-mono text-2xl text-white">{a}</span>
              </div>
              <div className="relative h-12 bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden group-hover:border-cyan-500/30 transition-colors">
                <motion.div 
                  className="absolute inset-y-0 left-0 bg-cyan-500/20"
                  initial={false}
                  animate={{ width: `${(a / 100) * 100}%` }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={a}
                  onChange={(e) => setA(parseInt(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="absolute inset-0 pointer-events-none flex items-center px-4">
                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                      initial={false}
                      animate={{ width: `${(a / 100) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Operator */}
            <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-slate-800/50 border border-slate-700 text-slate-500">
              <Plus size={24} />
            </div>

            {/* Input B */}
            <div className="flex-1 w-full space-y-4 group">
              <div className="flex justify-between items-end">
                <label className="text-xs font-bold text-amber-400 uppercase tracking-wider">Input B</label>
                <span className="font-mono text-2xl text-white">{b}</span>
              </div>
              <div className="relative h-12 bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden group-hover:border-amber-500/30 transition-colors">
                <motion.div 
                  className="absolute inset-y-0 left-0 bg-amber-500/20"
                  initial={false}
                  animate={{ width: `${(b / 100) * 100}%` }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={b}
                  onChange={(e) => setB(parseInt(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="absolute inset-0 pointer-events-none flex items-center px-4">
                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                      initial={false}
                      animate={{ width: `${(b / 100) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Result Section */}
          <div className="relative">
             <div className="absolute left-1/2 -translate-x-1/2 -top-6 text-slate-600">
                <Equal size={24} />
             </div>
             
             <div className="flex justify-center">
                <motion.div 
                  className="relative px-12 py-6 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col items-center gap-2 min-w-[200px]"
                  animate={{ 
                    borderColor: isCalculating ? 'rgba(255,255,255,0.5)' : 'rgba(51,65,85,0.5)',
                    scale: isCalculating ? 1.02 : 1
                  }}
                >
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Result</span>
                  <motion.span 
                    key={a + b}
                    initial={{ opacity: 0.5, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl md:text-6xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400"
                  >
                    {a + b}
                  </motion.span>
                  
                  {/* Glow Effect behind the number */}
                  <div className="absolute inset-0 bg-white/5 blur-2xl rounded-2xl -z-10" />
                </motion.div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
