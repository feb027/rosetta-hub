import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Settings, Volume2, VolumeX, Factory } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

interface Accumulator {
  id: number;
  name: string;
  value: number;
  history: number[];
  createdAt: number;
}

// --- Constants ---

// --- Component ---

export default function AccumulatorFactoryVisualization() {
  const [accumulators, setAccumulators] = useState<Accumulator[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const [initValue, setInitValue] = useState<string>('0');
  const [isAnimating, setIsAnimating] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const audioContextRef = useRef<AudioContext | null>(null);

  // --- Audio ---

  useEffect(() => {
    if (soundEnabled && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, [soundEnabled]);

  const playSound = useCallback((type: 'clank' | 'steam' | 'create') => {
    if (!soundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'clank') {
      // Metallic clank
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'steam') {
      // White noise hiss
      const bufferSize = ctx.sampleRate * 0.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = ctx.createGain();
      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      
      noiseGain.gain.setValueAtTime(0.05, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      noise.start(now);
    } else if (type === 'create') {
      // Heavy machinery start
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(50, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.3);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  }, [soundEnabled]);

  // --- Logic ---

  const createAccumulator = () => {
    const startVal = parseFloat(initValue) || 0;
    const newAcc: Accumulator = {
      id: Date.now(),
      name: `Machine #${accumulators.length + 1}`,
      value: startVal,
      history: [startVal],
      createdAt: Date.now(),
    };
    setAccumulators(prev => [...prev, newAcc]);
    setActiveId(newAcc.id);
    setInitValue('0');
    playSound('create');
  };

  const addToAccumulator = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeId === null) return;
    
    const val = parseFloat(inputValue);
    if (isNaN(val)) return;

    setIsAnimating(true);
    playSound('clank');
    playSound('steam');

    setTimeout(() => {
      setAccumulators(prev => prev.map(acc => {
        if (acc.id === activeId) {
          const newValue = acc.value + val;
          return {
            ...acc,
            value: newValue,
            history: [...acc.history, val]
          };
        }
        return acc;
      }));
      setInputValue('');
      setIsAnimating(false);
    }, 500);
  };

  const activeAcc = accumulators.find(a => a.id === activeId);

  return (
    <div className="space-y-6 font-mono">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Machine View */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video bg-[#0f172a] rounded-3xl border-2 border-[#f59e0b]/30 overflow-hidden shadow-2xl group flex flex-col items-center justify-center p-8">
            
            {/* Background Gears */}
            <div className="absolute inset-0 opacity-5 pointer-events-none overflow-hidden">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-20 -left-20 text-[#f59e0b]"
              >
                <Settings size={300} />
              </motion.div>
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-20 -right-20 text-[#f59e0b]"
              >
                <Settings size={250} />
              </motion.div>
            </div>

            {activeAcc ? (
              <div className="relative z-10 flex flex-col items-center justify-between h-full w-full max-w-md py-4">
                
                {/* The Tank */}
                {/* The Tank */}
                <div className="relative w-48 h-64 bg-slate-900/80 border-2 border-[#f59e0b]/30 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                  {/* Liquid */}
                  <motion.div 
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#b45309] to-[#f59e0b] opacity-80"
                    initial={{ height: '0%' }}
                    animate={{ 
                      height: `${Math.min(100, Math.max(5, (activeAcc.value / 100) * 100))}%` 
                    }}
                    transition={{ type: "spring", stiffness: 50 }}
                  />
                  
                  {/* Glass Shine */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent pointer-events-none" />
                  
                  {/* Value Display */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white drop-shadow-md">
                      {activeAcc.value}
                    </span>
                  </div>

                  {/* Steam Effect */}
                  <AnimatePresence>
                    {isAnimating && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: -50 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-0 left-1/2 -translate-x-1/2 text-white/50"
                      >
                        <Factory size={48} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Controls */}
                <form onSubmit={addToAccumulator} className="flex gap-3 w-full mt-8">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Enter number..."
                      className="w-full bg-[#0f172a] border border-[#f59e0b] rounded-lg px-4 py-3 text-[#f59e0b] placeholder-[#f59e0b]/30 focus:outline-none focus:ring-1 focus:ring-[#f59e0b] transition-all font-mono"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isAnimating || !inputValue}
                    className="bg-[#7c2d12] hover:bg-[#9a3412] text-[#f59e0b] px-6 py-2 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-[#f59e0b]/20"
                  >
                    <Plus size={20} />
                    ADD
                  </button>
                </form>

                <div className="text-[#b45309] text-xs uppercase tracking-widest">
                  {activeAcc.name} Online
                </div>

              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="text-[#b45309] opacity-50">
                  <Factory size={64} className="mx-auto mb-4" />
                  <p>No Active Accumulator</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-6">
          
          {/* Create New */}
          <div className="bg-[#0f172a] p-6 rounded-3xl border border-[#f59e0b]/30">
            <h3 className="text-[#f59e0b] font-bold mb-4 flex items-center gap-2 font-mono">
              <Settings size={18} />
              NEW MACHINE
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="number"
                value={initValue}
                onChange={(e) => setInitValue(e.target.value)}
                className="flex-1 bg-[#1e293b] border border-[#f59e0b]/30 rounded-lg px-4 py-2 text-[#f59e0b] text-sm focus:outline-none focus:border-[#f59e0b] min-w-0"
                placeholder="0"
              />
              <button
                onClick={createAccumulator}
                className="bg-[#7c2d12]/50 hover:bg-[#7c2d12] text-[#f59e0b] px-4 py-2 rounded-lg border border-[#f59e0b]/30 transition-colors text-sm font-bold whitespace-nowrap"
              >
                CREATE
              </button>
            </div>
          </div>

          {/* Machine List */}
          <div className="bg-[#0f172a] p-6 rounded-3xl border border-[#f59e0b]/30 flex flex-col h-[400px]">
            <h3 className="text-[#f59e0b] font-bold mb-4 flex items-center gap-2 font-mono">
              <Factory size={18} />
              FACTORY FLOOR
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
              {accumulators.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => setActiveId(acc.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all group ${
                    activeId === acc.id
                      ? 'bg-[#7c2d12]/20 border-[#f59e0b] text-[#f59e0b]'
                      : 'bg-[#1e293b] border-transparent text-slate-400 hover:bg-[#1e293b]/80 hover:text-[#f59e0b]'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm group-hover:text-[#f59e0b] transition-colors">{acc.name}</span>
                    <span className="font-mono text-xs opacity-70">Val: {acc.value}</span>
                  </div>
                  <div className="text-[10px] opacity-50 truncate font-mono">
                    Hist: {acc.history.join(', ')}
                  </div>
                </button>
              ))}
              {accumulators.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-2">
                  <Factory size={32} className="opacity-20" />
                  <span className="text-xs italic">Factory floor is empty</span>
                </div>
              )}
            </div>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-center gap-2 ${
              soundEnabled
                ? 'bg-[#7c2d12]/20 border-[#f59e0b]/50 text-[#f59e0b]'
                : 'bg-[#0f172a] border-[#f59e0b]/30 text-slate-500'
            }`}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            <span className="text-sm font-bold font-mono">MECHANICAL AUDIO</span>
          </button>

        </div>
      </div>
    </div>
  );
}
