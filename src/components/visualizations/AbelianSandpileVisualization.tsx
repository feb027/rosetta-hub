import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Zap, MousePointer2, Layers, Paintbrush } from 'lucide-react';

const GRID_SIZE = 100;
const CANVAS_SIZE = 600;
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;

// Neon / Cyberpunk Palette
const COLORS = [
  '#0f172a', // 0: Slate 900 (Background)
  '#0891b2', // 1: Cyan 600 (Stable)
  '#7c3aed', // 2: Violet 600 (Charged)
  '#db2777', // 3: Pink 600 (Critical)
  '#ffffff', // 4+: White (Toppling)
];

// Glow colors for the canvas shadow
const GLOW_COLOR = 'rgba(139, 92, 246, 0.3)'; // Violet glow

export default function AbelianSandpileVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(5); // Default faster speed
  const [stats, setStats] = useState({ grains: 0, topples: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  // Simulation state (refs for performance)
  const gridRef = useRef<number[]>(new Array(GRID_SIZE * GRID_SIZE).fill(0));
  const unstableRef = useRef<number[]>([]); // Stack of unstable indices
  const statsRef = useRef({ grains: 0, topples: 0 });
  const animationRef = useRef<number>(0);

  // Initialize / Reset
  const reset = () => {
    gridRef.current.fill(0);
    unstableRef.current = [];
    statsRef.current = { grains: 0, topples: 0 };
    setStats({ grains: 0, topples: 0 });
    draw();
  };

  // Draw the grid
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const grid = gridRef.current;
    const imgData = ctx.createImageData(CANVAS_SIZE, CANVAS_SIZE);
    const data = imgData.data;

    for (let i = 0; i < grid.length; i++) {
      const val = grid[i];
      // Use modulo for colors if > 4 to create interesting patterns for huge piles?
      // Or just clamp. Clamping is standard for the model visualization.
      const colorIdx = Math.min(val, 4);
      const colorHex = COLORS[colorIdx];
      
      const r = parseInt(colorHex.slice(1, 3), 16);
      const g = parseInt(colorHex.slice(3, 5), 16);
      const b = parseInt(colorHex.slice(5, 7), 16);

      const x = (i % GRID_SIZE) * CELL_SIZE;
      const y = Math.floor(i / GRID_SIZE) * CELL_SIZE;

      for (let dy = 0; dy < CELL_SIZE; dy++) {
        for (let dx = 0; dx < CELL_SIZE; dx++) {
          const px = (Math.floor(x) + dx + Math.floor(y) * CANVAS_SIZE + dy * CANVAS_SIZE) * 4;
          data[px] = r;
          data[px + 1] = g;
          data[px + 2] = b;
          data[px + 3] = 255;
        }
      }
    }
    
    ctx.putImageData(imgData, 0, 0);
  };

  // Simulation Step
  const step = () => {
    const grid = gridRef.current;
    const unstable = unstableRef.current;
    let topples = 0;
    
    const limit = 5000 * speed; 
    let ops = 0;

    while (unstable.length > 0 && ops < limit) {
      const idx = unstable.pop()!;
      
      if (grid[idx] >= 4) {
        grid[idx] -= 4;
        topples++;
        ops++;

        const x = idx % GRID_SIZE;
        const y = Math.floor(idx / GRID_SIZE);

        const neighbors = [
          y > 0 ? idx - GRID_SIZE : -1,
          y < GRID_SIZE - 1 ? idx + GRID_SIZE : -1,
          x > 0 ? idx - 1 : -1,
          x < GRID_SIZE - 1 ? idx + 1 : -1
        ];

        for (const nIdx of neighbors) {
          if (nIdx !== -1) {
            grid[nIdx]++;
            if (grid[nIdx] === 4) {
              unstable.push(nIdx);
            }
          }
        }
        
        if (grid[idx] >= 4) {
           unstable.push(idx);
        }
      }
    }

    statsRef.current.topples += topples;
    
    if (animationRef.current! % 5 === 0) {
        setStats({ ...statsRef.current });
    }

    draw();

    if (unstable.length > 0 && isRunning) {
      animationRef.current = requestAnimationFrame(step);
    } else if (unstable.length === 0 && isRunning) {
       animationRef.current = requestAnimationFrame(step);
    }
  };

  useEffect(() => {
    if (isRunning) {
      animationRef.current = requestAnimationFrame(step);
    } else {
      cancelAnimationFrame(animationRef.current!);
    }
    return () => cancelAnimationFrame(animationRef.current!);
  }, [isRunning, speed]);

  useEffect(() => {
    draw();
  }, []);

  const addSand = (x: number, y: number, amount: number) => {
    const idx = y * GRID_SIZE + x;
    if (idx >= 0 && idx < gridRef.current.length) {
      gridRef.current[idx] += amount;
      statsRef.current.grains += amount;
      if (gridRef.current[idx] >= 4) {
        unstableRef.current.push(idx);
      }
      // Only redraw immediately if not running, otherwise the loop handles it
      if (!isRunning) {
        draw();
        setStats({ ...statsRef.current });
      }
    }
  };

  // Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    handlePaint(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      handlePaint(e);
    }
  };

  const handlePaint = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / (rect.width / GRID_SIZE));
    const y = Math.floor((e.clientY - rect.top) / (rect.height / GRID_SIZE));
    
    // Add sand at cursor
    addSand(x, y, 4);
    
    // Add a bit of "spray" around it for better painting feel
    // Randomly add to neighbors
    if (Math.random() > 0.5) addSand(x + 1, y, 2);
    if (Math.random() > 0.5) addSand(x - 1, y, 2);
    if (Math.random() > 0.5) addSand(x, y + 1, 2);
    if (Math.random() > 0.5) addSand(x, y - 1, 2);
  };

  const supercharge = () => {
    const center = Math.floor(GRID_SIZE / 2);
    addSand(center, center, 25000); // Increased amount for more spectacle
    if (!isRunning) setIsRunning(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Canvas Container */}
        <div className="lg:col-span-2">
          <div className="relative aspect-square glass rounded-3xl border border-slate-700/50 overflow-hidden shadow-2xl shadow-purple-500/20 group transition-all duration-500 hover:shadow-purple-500/40">
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onMouseMove={handleMouseMove}
              className="w-full h-full cursor-crosshair rendering-pixelated"
              style={{ imageRendering: 'pixelated' }}
            />
            
            {/* Overlay Hint */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900/80 backdrop-blur text-xs text-slate-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-2 border border-slate-700">
              <Paintbrush size={12} className="text-purple-400" />
              Click & Drag to paint sand
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-6">
          {/* Stats Card */}
          <div className="glass p-6 rounded-2xl border border-slate-700/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 pointer-events-none" />
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2 relative z-10">
              <Layers size={16} className="text-purple-400" />
              Quantum Lattice
            </h3>
            <div className="space-y-4 relative z-10">
              <div>
                <div className="text-3xl font-mono font-bold text-white tabular-nums">
                  {stats.grains.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Grains</div>
              </div>
              <div>
                <div className="text-3xl font-mono font-bold text-purple-400 tabular-nums">
                  {stats.topples.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Avalanche Events</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                isRunning 
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700' 
                  : 'bg-emerald-500 text-slate-900 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'
              }`}
            >
              {isRunning ? <Pause size={20} /> : <Play size={20} />}
              {isRunning ? 'Pause Simulation' : 'Resume Simulation'}
            </button>

            <button
              onClick={supercharge}
              className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-violet-500/20 border border-white/10"
            >
              <Zap size={20} className="text-yellow-300 fill-yellow-300" />
              Supercharge Core
            </button>

            <button
              onClick={reset}
              className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-700/50"
            >
              <RotateCcw size={18} />
              Reset Grid
            </button>
          </div>

          {/* Speed Control */}
          <div className="glass p-4 rounded-xl border border-slate-700/50">
            <div className="flex justify-between text-xs text-slate-400 mb-2 font-bold uppercase tracking-wider">
              <span>Simulation Speed</span>
              <span className="text-purple-400">{speed}x</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
              className="w-full accent-purple-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Legend */}
          <div className="flex gap-3 justify-center p-4 glass rounded-xl border border-slate-700/50">
             {COLORS.slice(1).map((color, i) => (
               <div key={i} className="flex flex-col items-center gap-2">
                 <div 
                    className="w-6 h-6 rounded-md shadow-lg border border-white/10 transition-transform hover:scale-110" 
                    style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}40` }} 
                 />
                 <span className="text-[10px] font-bold text-slate-500">{i+1}{i===3 ? '+' : ''}</span>
               </div>
             ))}
          </div>

        </div>
      </div>
    </div>
  );
}
