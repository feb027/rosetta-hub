import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Split, Sparkles, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Logic ---

// Predefined list for simulation (since we don't have the full dictionary loaded)
const ANADROME_PAIRS = [
  ['desserts', 'stressed'],
  ['gateman', 'nametag'],
  ['deliver', 'reviled'],
  ['diaper', 'repaid'],
  ['animal', 'lamina'],
  ['scoccs', 'soccer'], // "scoccs" is rare but valid in some dicts, let's stick to common ones or just visual simulation
  ['sleets', 'steels'],
  ['spoons', 'snoops'],
  ['sports', 'strops'],
  ['strut', 'turts'],
  ['smart', 'trams'],
  ['stop', 'pots'],
  ['star', 'rats'],
  ['reward', 'drawer'],
  ['spacer', 'recaps'],
];

const NON_ANADROMES = [
  'hello', 'world', 'coding', 'react', 'visual', 'mirror', 'realm', 'galaxy', 'system'
];

interface WordOrb {
  id: string;
  text: string;
  reverse: string;
  isAnadrome: boolean;
  status: 'approaching' | 'reflecting' | 'matched' | 'shattered';
  y: number; // Vertical position %
}

// --- Component ---

export default function AnadromesVisualization() {
  const [orbs, setOrbs] = useState<WordOrb[]>([]);
  const [matches, setMatches] = useState<string[][]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled] = useState(true);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number>(0);
  const orbIdCounter = useRef(0);

  // --- Audio ---
  useEffect(() => {
    if (soundEnabled && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, [soundEnabled]);

  const playSound = useCallback((type: 'spawn' | 'match' | 'shatter') => {
    if (!soundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'spawn') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'match') {
      // Magical chime
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 1);
      osc.start(now);
      osc.stop(now + 1);
      
      // Add a second layer
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(554, now); // C#
      gain2.gain.setValueAtTime(0.05, now);
      gain2.gain.linearRampToValueAtTime(0, now + 1.2);
      osc2.start(now);
      osc2.stop(now + 1.2);

    } else if (type === 'shatter') {
      // Glass break / noise
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(50, now + 0.2);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  }, [soundEnabled]);

  // --- Simulation Loop ---

  const spawnOrb = useCallback(() => {
    if (!isRunning) return;

    // Chance to spawn a valid anadrome vs random word
    const isValid = Math.random() > 0.4;
    let word, reverse, isAnadrome;

    if (isValid) {
      const pair = ANADROME_PAIRS[Math.floor(Math.random() * ANADROME_PAIRS.length)];
      // Randomly pick one side of the pair
      word = Math.random() > 0.5 ? pair[0] : pair[1];
      reverse = word.split('').reverse().join('');
      isAnadrome = true;
    } else {
      word = NON_ANADROMES[Math.floor(Math.random() * NON_ANADROMES.length)];
      reverse = word.split('').reverse().join('');
      isAnadrome = false;
    }

    const newOrb: WordOrb = {
      id: `orb-${orbIdCounter.current++}`,
      text: word,
      reverse: reverse,
      isAnadrome,
      status: 'approaching',
      y: 10 + Math.random() * 80 // Random vertical position
    };

    setOrbs(prev => [...prev, newOrb]);
    playSound('spawn');

    // Schedule next spawn
    timerRef.current = window.setTimeout(spawnOrb, 1500);
  }, [isRunning, playSound]);

  // Start/Stop
  useEffect(() => {
    if (isRunning) {
      spawnOrb();
    } else {
      clearTimeout(timerRef.current);
    }
    return () => clearTimeout(timerRef.current);
  }, [isRunning, spawnOrb]);

  // Orb Lifecycle
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setOrbs(prev => {
        const next = prev.map(orb => {
          // State transitions would ideally be handled by animation completion callbacks
          // But for a simple simulation loop, we can just let them exist
          // We'll handle the "logic" of matching when they "hit" the center in the render/animation
          return orb;
        });
        
        // Cleanup old orbs? 
        // Actually, let's just use a timeout for each orb to change its state
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning]);

  // We need a way to transition orb states over time.
  // Let's use a separate effect that watches orbs and schedules their updates.
  useEffect(() => {
    orbs.forEach(orb => {
      if (orb.status === 'approaching') {
        // Time to reach center
        setTimeout(() => {
          setOrbs(prev => prev.map(o => o.id === orb.id ? { ...o, status: 'reflecting' } : o));
        }, 2000);
      }
      if (orb.status === 'reflecting') {
        setTimeout(() => {
          setOrbs(prev => prev.map(o => {
            if (o.id === orb.id) {
              if (o.isAnadrome) {
                playSound('match');
                setMatches(m => {
                  // Avoid duplicates in list
                  const exists = m.some(p => p.includes(o.text));
                  return exists ? m : [[o.text, o.reverse], ...m].slice(0, 8);
                });
                return { ...o, status: 'matched' };
              } else {
                playSound('shatter');
                return { ...o, status: 'shattered' };
              }
            }
            return o;
          }));
        }, 1000); // Delay at center
      }
      if (orb.status === 'matched' || orb.status === 'shattered') {
        setTimeout(() => {
           setOrbs(prev => prev.filter(o => o.id !== orb.id));
        }, 1000);
      }
    });
  }, [orbs.length]); // Simple dependency to trigger on new orbs, logic handles ID checks

  const reset = () => {
    setIsRunning(false);
    setOrbs([]);
    setMatches([]);
    clearTimeout(timerRef.current);
  };

  return (
    <div className="relative w-full h-[600px] bg-slate-950 overflow-hidden rounded-xl border border-slate-800 font-sans select-none">
      
      {/* Background - Split Screen */}
      <div className="absolute inset-0 flex">
        <div className="w-1/2 h-full bg-gradient-to-r from-slate-950 to-slate-900 border-r border-cyan-500/30 relative overflow-hidden">
           <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_0%_50%,_rgba(34,211,238,0.2),_transparent_50%)]" />
           {/* Vertical Text: Reality */}
           <div className="absolute left-2 top-1/2 -translate-y-1/2 -translate-x-1/2 -rotate-90 text-cyan-500/10 text-6xl font-black uppercase tracking-widest whitespace-nowrap pointer-events-none select-none">
             Reality
           </div>
        </div>
        <div className="w-1/2 h-full bg-gradient-to-l from-slate-950 to-slate-900 border-l border-fuchsia-500/30 relative overflow-hidden">
           <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_100%_50%,_rgba(232,121,249,0.2),_transparent_50%)]" />
           {/* Vertical Text: Reflection */}
           <div className="absolute right-2 top-1/2 -translate-y-1/2 translate-x-1/2 rotate-90 text-fuchsia-500/10 text-6xl font-black uppercase tracking-widest whitespace-nowrap pointer-events-none select-none">
             Reflection
           </div>
        </div>
      </div>

      {/* The Rift (Center Line) */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px -ml-px bg-transparent z-10">
        {/* Core */}
        <div className="absolute inset-0 bg-white/50 blur-[1px]" />
        {/* Glow */}
        <div className="absolute top-0 bottom-0 -left-1 -right-1 bg-white/20 blur-md" />
        {/* Energy Pulses */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-transparent animate-pulse" />
      </div>

      {/* Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-4">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`px-6 py-2 rounded-full font-bold flex items-center gap-2 transition-all ${
            isRunning 
              ? 'bg-slate-800 text-white border border-slate-600' 
              : 'bg-white text-slate-900 hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]'
          }`}
        >
          {isRunning ? <Split size={18} /> : <Play size={18} />}
          {isRunning ? 'PAUSE RIFT' : 'OPEN RIFT'}
        </button>
        <button
          onClick={reset}
          className="p-2 rounded-full bg-slate-900 text-slate-400 border border-slate-700 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Orbs */}
      <AnimatePresence>
        {orbs.map((orb) => (
          <div key={orb.id}>
            {/* Reality Orb (Left) */}
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ 
                x: orb.status === 'approaching' ? 'calc(50vw - 80px)' : 'calc(50vw - 60px)',
                opacity: orb.status === 'shattered' ? 0 : 1,
                scale: orb.status === 'matched' ? 1.2 : 1
              }}
              transition={{ duration: 2, ease: "linear" }}
              className="absolute left-0 flex items-center justify-end pr-4"
              style={{ top: `${orb.y}%`, width: '50%' }}
            >
              <div className={`
                px-6 py-3 rounded-full backdrop-blur-xl border transition-all duration-500 font-mono text-sm tracking-wider
                ${orb.status === 'matched' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-50 shadow-[0_0_30px_rgba(34,211,238,0.4)] scale-110' : 
                  orb.status === 'shattered' ? 'bg-red-500/10 border-red-500/50 text-red-200' : 
                  'bg-slate-900/60 border-slate-700 text-slate-300 shadow-lg'}
              `}>
                {orb.text}
              </div>
            </motion.div>

            {/* Reflection Orb (Right) - Only appears when 'reflecting' or later */}
            {(orb.status === 'reflecting' || orb.status === 'matched' || orb.status === 'shattered') && (
              <motion.div
                initial={{ x: 100, opacity: 0, filter: 'blur(10px)' }}
                animate={{ 
                  x: orb.status === 'matched' ? 'calc(-50vw + 60px)' : 'calc(-50vw + 80px)',
                  opacity: orb.status === 'shattered' ? 0 : 0.8,
                  filter: 'blur(0px)',
                  scale: orb.status === 'matched' ? 1.2 : 1
                }}
                transition={{ duration: 0.5 }}
                className="absolute right-0 flex items-center justify-start pl-4"
                style={{ top: `${orb.y}%`, width: '50%' }}
              >
                <div className={`
                  px-6 py-3 rounded-full backdrop-blur-xl border transition-all duration-500 font-mono text-sm tracking-wider
                  ${orb.status === 'matched' ? 'bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-50 shadow-[0_0_30px_rgba(232,121,249,0.4)] scale-110' : 
                    orb.status === 'shattered' ? 'bg-red-500/10 border-red-500/50 text-red-200' : 
                    'bg-slate-900/60 border-slate-700 text-slate-300 shadow-lg'}
                `}>
                  {orb.reverse}
                </div>
              </motion.div>
            )}

            {/* Connection Beam */}
            {orb.status === 'matched' && (
               <motion.div
                 initial={{ opacity: 0, scaleX: 0 }}
                 animate={{ opacity: 1, scaleX: 1 }}
                 exit={{ opacity: 0 }}
                 className="absolute left-1/2 top-0 h-1 bg-white shadow-[0_0_15px_white] z-20"
                 style={{ top: `calc(${orb.y}% + 15px)`, width: '120px', marginLeft: '-60px' }}
               />
            )}
            
             {/* Shatter Effect */}
             {orb.status === 'shattered' && (
               <motion.div
                 initial={{ opacity: 1, scale: 1 }}
                 animate={{ opacity: 0, scale: 2 }}
                 className="absolute left-1/2 z-20 text-red-500"
                 style={{ top: `${orb.y}%`, marginLeft: '-12px' }}
               >
                 <X size={24} />
               </motion.div>
            )}
          </div>
        ))}
      </AnimatePresence>

      {/* Match List (Floating) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-96 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4 z-20">
        <h3 className="text-center text-xs font-bold uppercase tracking-widest text-white/50 mb-2 flex items-center justify-center gap-2">
          <Sparkles size={12} /> Stabilized Anadromes
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <AnimatePresence>
            {matches.map((pair, i) => (
              <motion.div
                key={`${pair[0]}-${i}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-between items-center bg-white/5 rounded px-2 py-1 text-xs"
              >
                <span className="text-cyan-300">{pair[0]}</span>
                <Zap size={8} className="text-white/20" />
                <span className="text-fuchsia-300">{pair[1]}</span>
              </motion.div>
            ))}
          </AnimatePresence>
          {matches.length === 0 && (
            <div className="col-span-2 text-center text-white/20 text-xs py-2">
              Waiting for resonance...
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
