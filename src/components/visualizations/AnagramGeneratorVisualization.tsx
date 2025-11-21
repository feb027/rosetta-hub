import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Orbit, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Logic ---

// Curated "Golden Anagrams" for the best visual experience
const GOLDEN_ANAGRAMS: Record<string, string[]> = {
  "Clint Eastwood": ["Old West Action"],
  "Astronomer": ["Moon starer"],
  "The Eyes": ["They See"],
  "A Gentleman": ["Elegant Man"],
  "The Morse Code": ["Here Come Dots"],
  "Dormitory": ["Dirty Room"],
  "Slot Machines": ["Cash Lost in me"],
  "Conversation": ["Voices Rant On"],
  "Eleven plus two": ["Twelve plus one"],
  "Listen": ["Silent"],
  "Funeral": ["Real Fun"],
  "Election results": ["Lies let's recount"],
  "School master": ["The classroom"],
  "The cockroaches": ["Cook, catch, here's"],
  "Punishment": ["Nine Thumps"],
  "Desperation": ["A Rope Ends It"]
};

const SEEDS = Object.keys(GOLDEN_ANAGRAMS);

interface Particle {
  id: string;
  char: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  delay: number;
}

interface Planet {
  id: string;
  text: string;
  angle: number;
  distance: number;
  color: string;
}

// --- Component ---

export default function AnagramGeneratorVisualization() {
  const [seed, setSeed] = useState(SEEDS[0]);
  const [isExploding, setIsExploding] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [planets, setPlanets] = useState<Planet[]>([]);
  const [soundEnabled] = useState(true);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Audio ---
  useEffect(() => {
    if (soundEnabled && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, [soundEnabled]);

  const playSound = useCallback((type: 'charge' | 'explode' | 'orbit') => {
    if (!soundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'charge') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 1);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 1);
      gain.gain.linearRampToValueAtTime(0, now + 1.1);
      osc.start(now);
      osc.stop(now + 1.1);
    } else if (type === 'explode') {
      // Deep boom
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(20, now + 0.5);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      osc.start(now);
      osc.stop(now + 1.5);
      
      // Noise burst
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
      noiseGain.gain.setValueAtTime(0.2, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      noise.start(now);
    } else if (type === 'orbit') {
      // Ethereal drone
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0, now + 3);
      osc.start(now);
      osc.stop(now + 3);
    }
  }, [soundEnabled]);

  // --- Simulation ---

  const triggerSupernova = () => {
    if (isExploding) return;
    setIsExploding(true);
    setParticles([]);
    setPlanets([]);
    playSound('charge');

    // 1. Charge Phase (1s)
    setTimeout(() => {
      playSound('explode');
      
      // 2. Explosion Phase
      // Create particles for each letter
      const rect = containerRef.current?.getBoundingClientRect();
      const centerX = (rect?.width || 600) / 2;
      const centerY = (rect?.height || 600) / 2;
      
      const chars = seed.split('');
      const newParticles: Particle[] = chars.map((char, i) => {
        const angle = (Math.PI * 2 * i) / chars.length;
        const dist = 100 + Math.random() * 100;
        return {
          id: `p-${i}`,
          char,
          x: centerX,
          y: centerY,
          targetX: centerX + Math.cos(angle) * dist,
          targetY: centerY + Math.sin(angle) * dist,
          delay: Math.random() * 0.5
        };
      });
      setParticles(newParticles);

      // 3. Formation Phase (after explosion settles)
      setTimeout(() => {
        const anagrams = GOLDEN_ANAGRAMS[seed] || ["No anagrams found"];
        const newPlanets = anagrams.map((text, i) => ({
          id: `planet-${i}`,
          text,
          angle: (Math.PI * 2 * i) / anagrams.length,
          distance: 180,
          color: i % 2 === 0 ? '#facc15' : '#f472b6' // Yellow / Pink
        }));
        setPlanets(newPlanets);
        playSound('orbit');
        
        // Clear particles after they "form" the planets
        setTimeout(() => {
          setParticles([]);
          setIsExploding(false);
        }, 1000);

      }, 1500);

    }, 1000);
  };

  const cycleSeed = () => {
    const idx = SEEDS.indexOf(seed);
    setSeed(SEEDS[(idx + 1) % SEEDS.length]);
    setParticles([]);
    setPlanets([]);
    setIsExploding(false);
  };

  return (
    <div ref={containerRef} className="relative w-full h-[600px] bg-[#0b0014] overflow-hidden rounded-xl border border-purple-900/50 font-sans select-none">
      
      {/* Background - Deep Space */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#2e1065_0%,_#0b0014_70%)] opacity-50" />
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '50px 50px', opacity: 0.1 }} />

      {/* Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-4">
        <button
          onClick={triggerSupernova}
          disabled={isExploding}
          className={`px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-all uppercase tracking-widest text-sm ${
            isExploding 
              ? 'bg-purple-900/50 text-purple-300 cursor-wait' 
              : 'bg-white text-purple-950 hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.4)]'
          }`}
        >
          <Zap size={16} className={isExploding ? "animate-pulse" : ""} />
          {isExploding ? 'Critical Mass...' : 'Initiate Supernova'}
        </button>
        <button
          onClick={cycleSeed}
          disabled={isExploding}
          className="p-3 rounded-full bg-purple-900/30 text-purple-400 border border-purple-700 hover:bg-purple-800 hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Center Star (Seed) */}
      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
        <AnimatePresence>
          {!isExploding && planets.length === 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 3, opacity: 0, filter: 'blur(20px)' }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-white blur-2xl opacity-20 animate-pulse" />
              <div className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-purple-200 to-purple-500 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] text-center">
                {seed}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Explosion Particles */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: p.x, y: p.y, opacity: 1, scale: 1 }}
            animate={{ x: p.targetX, y: p.targetY, opacity: 0, scale: 0.5 }}
            transition={{ duration: 1.5, delay: p.delay, ease: "easeOut" }}
            className="absolute text-purple-200 font-bold text-xl pointer-events-none"
            style={{ left: 0, top: 0 }} // Positioning handled by motion x/y
          >
            {p.char}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Formed Planets (Anagrams) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <AnimatePresence>
          {planets.map((planet) => (
            <motion.div
              key={planet.id}
              initial={{ opacity: 0, scale: 0, rotate: planet.angle * (180/Math.PI) }}
              animate={{ opacity: 1, scale: 1, rotate: planet.angle * (180/Math.PI) + 360 }}
              transition={{ duration: 20, ease: "linear", repeat: Infinity }}
              className="absolute w-[400px] h-[400px] flex items-center justify-center" // Orbit container
            >
              <div 
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ transform: `rotate(-${planet.angle * (180/Math.PI)}deg)` }} // Counter-rotate text
              >
                 <motion.div 
                   initial={{ scale: 0 }}
                   animate={{ scale: 1 }}
                   className="bg-black/50 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full text-xl font-bold text-white shadow-[0_0_30px_rgba(255,255,255,0.2)] whitespace-nowrap flex items-center gap-3"
                 >
                   <Orbit size={16} className="text-purple-400" />
                   {planet.text}
                 </motion.div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Orbital Rings Visual */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <div className="w-[300px] h-[300px] rounded-full border border-purple-500" />
        <div className="w-[500px] h-[500px] rounded-full border border-purple-500 absolute" />
      </div>

      {/* Current Status Text */}
      <div className="absolute top-6 left-6 text-purple-400/50 text-xs font-mono uppercase tracking-widest">
        System Status: {isExploding ? 'CRITICAL MASS' : planets.length > 0 ? 'STABLE ORBIT' : 'AWAITING IGNITION'}
      </div>

    </div>
  );
}
