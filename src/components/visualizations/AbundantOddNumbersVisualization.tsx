import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Wind, Sprout, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

interface Seed {
  number: number;
  divisors: number[];
  sum: number;
  isAbundant: boolean;
  status: 'growing' | 'blooming' | 'withering';
  progress: number; // 0 to 1
  x: number; // Canvas position
  y: number;
  color: string;
  petalCount: number;
  scale: number;
}

interface Flower {
  number: number;
  sum: number;
  color: string;
  petalCount: number;
  timestamp: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

// --- Constants ---

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const CENTER_X = CANVAS_WIDTH / 2;
const CENTER_Y = CANVAS_HEIGHT / 2;

// Bioluminescent / Organic Palette
const COLORS = [
  '#22d3ee', // Cyan
  '#e879f9', // Fuchsia
  '#818cf8', // Indigo
  '#34d399', // Emerald
  '#f472b6', // Pink
  '#a78bfa', // Violet
];

// --- Helper Functions ---

const getDivisors = (n: number): number[] => {
  if (n < 1) return [];
  const divisors = [1];
  const sqrt = Math.sqrt(n);
  for (let i = 3; i <= sqrt; i += 2) {
    if (n % i === 0) {
      divisors.push(i);
      if (i !== n / i) {
        divisors.push(n / i);
      }
    }
  }
  return divisors.sort((a, b) => a - b);
};

const getSum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

// --- Component ---

export default function AbundantOddNumbersVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentNumber, setCurrentNumber] = useState(1); 
  const [garden, setGarden] = useState<Flower[]>([]);
  const [speed, setSpeed] = useState(1); // 1 = Normal, 2 = Fast, 3 = Warp
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [stats, setStats] = useState({ checked: 0, abundant: 0 });
  
  // Simulation State Refs
  const activeSeedRef = useRef<Seed | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastTickRef = useRef<number>(0);
  const warpModeRef = useRef(false);

  // --- Audio ---

  useEffect(() => {
    if (soundEnabled && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [soundEnabled]);

  const playSound = useCallback((type: 'grow' | 'bloom' | 'wither' | 'warp') => {
    if (!soundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'grow') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300 + Math.random() * 50, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'bloom') {
      // Rich Major Chord
      const baseFreq = 220; 
      [0, 4, 7, 12].forEach((semitone, i) => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        
        osc2.type = 'triangle';
        osc2.frequency.value = baseFreq * Math.pow(2, semitone / 12);
        
        gain2.gain.setValueAtTime(0, now);
        gain2.gain.linearRampToValueAtTime(0.05, now + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
        
        osc2.start(now);
        osc2.stop(now + 2.5);
      });
    } else if (type === 'wither') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.1);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'warp') {
      // High speed scanning sound
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  }, [soundEnabled]);

  // --- Simulation Logic ---

  const spawnSeed = (num: number): Seed => {
    const divisors = getDivisors(num);
    const sum = getSum(divisors);
    const isAbundant = sum > num;
    
    return {
      number: num,
      divisors,
      sum,
      isAbundant,
      status: 'growing',
      progress: 0,
      x: CENTER_X,
      y: CENTER_Y,
      color: COLORS[num % COLORS.length],
      petalCount: Math.max(3, divisors.length),
      scale: 0.1,
    };
  };

  const createParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 1;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color,
        size: Math.random() * 3 + 1
      });
    }
  };

  const updateSimulation = useCallback(() => {
    if (!isRunning) return;

    // WARP MODE: Skip non-abundant numbers instantly
    if (warpModeRef.current || speed >= 3) {
      let next = currentNumber;
      let checks = 0;
      const maxChecks = 50; // Don't freeze UI

      while (checks < maxChecks) {
        if (next % 2 === 0) next++; // Ensure odd
        
        const divisors = getDivisors(next);
        const sum = getSum(divisors);
        
        if (sum > next) {
          // Found one! Stop warp and show it
          activeSeedRef.current = {
            number: next,
            divisors,
            sum,
            isAbundant: true,
            status: 'growing',
            progress: 0,
            x: CENTER_X,
            y: CENTER_Y,
            color: COLORS[next % COLORS.length],
            petalCount: Math.max(3, divisors.length),
            scale: 0.1,
          };
          setCurrentNumber(next + 2);
          setStats(prev => ({ checked: prev.checked + checks + 1, abundant: prev.abundant }));
          playSound('grow');
          return; // Exit loop to animate this one
        }
        
        next += 2;
        checks++;
      }
      
      // If we didn't find one in this batch, just update stats and continue next frame
      setCurrentNumber(next);
      setStats(prev => ({ ...prev, checked: prev.checked + checks }));
      if (Math.random() > 0.8) playSound('warp'); // Occasional blip
      return;
    }

    // NORMAL MODE: Animate one by one
    if (!activeSeedRef.current) {
      let next = currentNumber;
      if (next % 2 === 0) next++;
      
      activeSeedRef.current = spawnSeed(next);
      setCurrentNumber(next + 2);
      setStats(prev => ({ ...prev, checked: prev.checked + 1 }));
      playSound('grow');
    }

    const seed = activeSeedRef.current;
    if (!seed) return;

    // Animate Seed
    if (seed.status === 'growing') {
      seed.progress += 0.02 * (speed === 2 ? 3 : 1); 
      seed.scale = 0.1 + (seed.progress * 0.9);
      
      if (seed.progress >= 1) {
        if (seed.isAbundant) {
          seed.status = 'blooming';
          playSound('bloom');
          createParticles(seed.x, seed.y, seed.color, 50);
          
          setGarden(prev => [{
            number: seed.number,
            sum: seed.sum,
            color: seed.color,
            petalCount: seed.petalCount,
            timestamp: Date.now()
          }, ...prev].slice(0, 50));
          setStats(prev => ({ ...prev, abundant: prev.abundant + 1 }));
        } else {
          seed.status = 'withering';
          playSound('wither');
        }
      }
    } else if (seed.status === 'blooming' || seed.status === 'withering') {
      seed.scale *= 1.05;
      seed.progress -= 0.05;
      
      if (seed.progress <= 0) {
        activeSeedRef.current = null;
      }
    }

  }, [isRunning, currentNumber, speed, playSound]);

  const updateParticles = () => {
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      p.size *= 0.95;
      
      if (p.life <= 0) {
        particlesRef.current.splice(i, 1);
      }
    }
  };

  // --- Rendering ---

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with trail effect
    ctx.fillStyle = 'rgba(15, 23, 42, 0.3)'; 
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Particles
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    const seed = activeSeedRef.current;
    if (seed) {
      ctx.save();
      ctx.translate(seed.x, seed.y);
      ctx.scale(seed.scale, seed.scale);
      
      // Draw Core
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fillStyle = seed.color;
      ctx.shadowBlur = 30;
      ctx.shadowColor = seed.color;
      ctx.fill();
      
      // Draw Petals
      const angleStep = (Math.PI * 2) / seed.petalCount;
      for (let i = 0; i < seed.petalCount; i++) {
        const angle = i * angleStep + (Date.now() * 0.0005); 
        const length = 80 * seed.progress;
        
        ctx.save();
        ctx.rotate(angle);
        ctx.beginPath();
        // More organic petal shape
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(10, length * 0.5, 30, length, 0, length);
        ctx.bezierCurveTo(-30, length, -10, length * 0.5, 0, 0);
        
        ctx.fillStyle = `${seed.color}60`; 
        ctx.fill();
        ctx.strokeStyle = `${seed.color}aa`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      // Draw Number
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#000';
      ctx.fillText(seed.number.toString(), 0, 0);

      ctx.restore();
    }

  }, []);

  // --- Animation Loop ---

  useEffect(() => {
    const loop = (time: number) => {
      if (time - lastTickRef.current > 16) {
        updateSimulation();
        updateParticles();
        draw();
        lastTickRef.current = time;
      }
      animationRef.current = requestAnimationFrame(loop);
    };
    animationRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationRef.current);
  }, [updateSimulation, draw]);

  // --- Handlers ---

  const reset = () => {
    setIsRunning(false);
    setCurrentNumber(1);
    setGarden([]);
    setStats({ checked: 0, abundant: 0 });
    activeSeedRef.current = null;
    particlesRef.current = [];
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  };

  const jumpTo900 = () => {
    setCurrentNumber(901);
    setIsRunning(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Visualization Area */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video glass rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl group">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="w-full h-full"
            />
            
            {/* Overlay Info */}
            <div className="absolute top-4 left-4 flex gap-4">
              <div className="px-3 py-1.5 rounded-lg bg-slate-900/50 backdrop-blur border border-slate-700/50 text-xs text-slate-300">
                <span className="text-slate-500 uppercase tracking-wider mr-2">Scanning</span>
                <span className="font-mono text-cyan-400 text-lg">{activeSeedRef.current?.number || currentNumber}</span>
              </div>
              {activeSeedRef.current && (
                <div className="px-3 py-1.5 rounded-lg bg-slate-900/50 backdrop-blur border border-slate-700/50 text-xs text-slate-300">
                  <span className="text-slate-500 uppercase tracking-wider mr-2">Divisors</span>
                  <span className="font-mono text-purple-400">{activeSeedRef.current.divisors.length}</span>
                </div>
              )}
            </div>

            {/* Hint for first abundant number */}
            {currentNumber < 945 && !isRunning && stats.abundant === 0 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900/80 backdrop-blur rounded-full border border-slate-700/50 text-xs text-slate-400">
                Tip: First odd abundant number is 945. Use Warp Speed!
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="glass p-4 rounded-xl border border-slate-700/50 flex flex-wrap items-center gap-4">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`p-3 rounded-xl transition-all ${
                isRunning 
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                  : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/50'
              }`}
            >
              {isRunning ? <Pause size={20} /> : <Play size={20} />}
            </button>
            
            <button
              onClick={reset}
              className="p-3 rounded-xl bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all"
            >
              <RotateCcw size={20} />
            </button>

            <div className="h-8 w-px bg-slate-700/50 mx-2 hidden sm:block" />

            <div className="flex-1 min-w-[200px]">
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1"><Wind size={12} /> Speed Mode</span>
                <span className={`${speed === 3 ? 'text-purple-400 font-bold' : ''}`}>
                  {speed === 1 ? 'Normal' : speed === 2 ? 'Fast' : 'WARP'}
                </span>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3].map(s => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      speed === s
                        ? s === 3 
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                          : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                        : 'bg-slate-800/50 text-slate-500 hover:bg-slate-800'
                    }`}
                  >
                    {s === 1 ? 'Normal' : s === 2 ? 'Fast' : 'WARP'}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={jumpTo900}
              className="px-4 py-2 rounded-xl bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 text-xs font-medium transition-all border border-slate-700/50"
              title="Jump near 945"
            >
              Jump to 900
            </button>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-3 rounded-xl transition-all ${
                soundEnabled
                  ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/50'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
          </div>
        </div>

        {/* Garden / Stats Sidebar */}
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass p-4 rounded-xl border border-slate-700/50 text-center">
              <div className="text-2xl font-bold text-slate-100">{stats.checked.toLocaleString()}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Checked</div>
            </div>
            <div className="glass p-4 rounded-xl border border-slate-700/50 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-cyan-500/5" />
              <div className="text-2xl font-bold text-cyan-400">{stats.abundant}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Abundant</div>
            </div>
          </div>

          {/* The Garden */}
          <div className="glass rounded-xl border border-slate-700/50 flex flex-col h-[400px]">
            <div className="p-4 border-b border-slate-700/50 flex items-center gap-2">
              <Sprout size={16} className="text-green-400" />
              <h3 className="font-bold text-slate-200 text-sm">Abundance Garden</h3>
              {garden.length > 0 && (
                 <span className="ml-auto text-xs text-slate-500">{garden.length} flowers</span>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              <AnimatePresence initial={false}>
                {garden.map((flower) => (
                  <motion.div
                    key={flower.number}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/30 transition-colors group relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: flower.color }} />
                    <div className="flex items-center justify-between mb-1 pl-2">
                      <span className="font-mono font-bold text-slate-200">#{flower.number}</span>
                      <span className="text-xs text-slate-500">Sum: {flower.sum}</span>
                    </div>
                    <div className="flex gap-1 pl-2">
                      {Array.from({ length: Math.min(12, flower.petalCount) }).map((_, i) => (
                        <div 
                          key={i} 
                          className="w-1 h-2 rounded-full opacity-80"
                          style={{ backgroundColor: flower.color }}
                        />
                      ))}
                      {flower.petalCount > 12 && (
                        <span className="text-[10px] text-slate-500 self-end">+{flower.petalCount - 12}</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {garden.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-500 space-y-4">
                  <Sparkles size={32} className="opacity-20" />
                  <p className="text-sm italic">
                    The garden is empty.<br/>
                    First bloom at 945.
                  </p>
                  <button 
                    onClick={jumpTo900}
                    className="text-xs text-cyan-400 hover:text-cyan-300 underline"
                  >
                    Jump there now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
