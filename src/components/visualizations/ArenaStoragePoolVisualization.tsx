import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Trash2, Plus, RotateCcw, Box, Layers, Zap, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface MemoryBlock {
  id: number;
  size: number;
  type: 'int' | 'float' | 'string' | 'object';
  color: string;
  allocatedAt: number;
}

interface Arena {
  id: number;
  name: string;
  capacity: number;
  blocks: MemoryBlock[];
  color: string;
}

// --- Constants ---
const BLOCK_TYPES: Array<{ type: MemoryBlock['type']; size: number; color: string; label: string }> = [
  { type: 'int', size: 4, color: '#06b6d4', label: 'Integer (4B)' },
  { type: 'float', size: 8, color: '#10b981', label: 'Float (8B)' },
  { type: 'string', size: 16, color: '#f59e0b', label: 'String (16B)' },
  { type: 'object', size: 32, color: '#3b82f6', label: 'Object (32B)' },
];

const ARENA_COLORS = ['#0891b2', '#0d9488', '#059669', '#0284c7'];
const MAX_ARENA_CAPACITY = 128;

// --- Component ---
export default function ArenaStoragePoolVisualization() {
  const [arenas, setArenas] = useState<Arena[]>([
    { id: 1, name: 'Arena A', capacity: MAX_ARENA_CAPACITY, blocks: [], color: ARENA_COLORS[0] },
  ]);
  const [selectedArena, setSelectedArena] = useState<number>(1);
  const [nextBlockId, setNextBlockId] = useState(1);
  const [nextArenaId, setNextArenaId] = useState(2);
  const [allocHistory, setAllocHistory] = useState<string[]>([]);
  const [isAutoAllocating, setIsAutoAllocating] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const autoAllocRef = useRef<number>(0);


  // --- Audio ---
  const playSound = useCallback((type: 'alloc' | 'free' | 'freeAll' | 'newArena' | 'error') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'alloc') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.1);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'free') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'freeAll') {
      [500, 400, 300, 200].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0.05, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3 + i * 0.05);
        osc.start(now + i * 0.05);
        osc.stop(now + 0.35 + i * 0.05);
      });
    } else if (type === 'newArena') {
      [440, 550, 660].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.08, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25 + i * 0.08);
        osc.start(now + i * 0.08);
        osc.stop(now + 0.3 + i * 0.08);
      });
    } else if (type === 'error') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  }, [soundEnabled]);

  // --- Arena Operations ---
  const getArenaUsed = (arena: Arena): number => {
    return arena.blocks.reduce((sum, b) => sum + b.size, 0);
  };

  const allocateBlock = useCallback((typeIndex: number) => {
    const arena = arenas.find(a => a.id === selectedArena);
    if (!arena) return;

    const blockType = BLOCK_TYPES[typeIndex];
    const used = getArenaUsed(arena);

    if (used + blockType.size > arena.capacity) {
      playSound('error');
      setAllocHistory(prev => [`❌ Arena full! Cannot allocate ${blockType.label}`, ...prev.slice(0, 19)]);
      return;
    }

    const newBlock: MemoryBlock = {
      id: nextBlockId,
      size: blockType.size,
      type: blockType.type,
      color: blockType.color,
      allocatedAt: Date.now(),
    };

    setArenas(prev => prev.map(a => 
      a.id === selectedArena 
        ? { ...a, blocks: [...a.blocks, newBlock] }
        : a
    ));
    setNextBlockId(prev => prev + 1);
    playSound('alloc');
    setAllocHistory(prev => [`✓ Allocated ${blockType.label} in ${arena.name}`, ...prev.slice(0, 19)]);
  }, [arenas, selectedArena, nextBlockId, playSound]);


  const freeArena = useCallback((arenaId: number) => {
    const arena = arenas.find(a => a.id === arenaId);
    if (!arena || arena.blocks.length === 0) return;

    const blockCount = arena.blocks.length;
    setArenas(prev => prev.map(a => 
      a.id === arenaId ? { ...a, blocks: [] } : a
    ));
    playSound('freeAll');
    setAllocHistory(prev => [`🗑️ Freed ${blockCount} blocks from ${arena.name}`, ...prev.slice(0, 19)]);
  }, [arenas, playSound]);

  const createArena = useCallback(() => {
    if (arenas.length >= 4) {
      playSound('error');
      setAllocHistory(prev => ['❌ Maximum 4 arenas allowed', ...prev.slice(0, 19)]);
      return;
    }

    const newArena: Arena = {
      id: nextArenaId,
      name: `Arena ${String.fromCharCode(64 + nextArenaId)}`,
      capacity: MAX_ARENA_CAPACITY,
      blocks: [],
      color: ARENA_COLORS[(nextArenaId - 1) % ARENA_COLORS.length],
    };

    setArenas(prev => [...prev, newArena]);
    setSelectedArena(nextArenaId);
    setNextArenaId(prev => prev + 1);
    playSound('newArena');
    setAllocHistory(prev => [`🆕 Created ${newArena.name}`, ...prev.slice(0, 19)]);
  }, [arenas.length, nextArenaId, playSound]);

  const deleteArena = useCallback((arenaId: number) => {
    if (arenas.length <= 1) {
      playSound('error');
      return;
    }

    const arena = arenas.find(a => a.id === arenaId);
    setArenas(prev => prev.filter(a => a.id !== arenaId));
    if (selectedArena === arenaId) {
      setSelectedArena(arenas.find(a => a.id !== arenaId)?.id || 1);
    }
    playSound('freeAll');
    setAllocHistory(prev => [`🗑️ Deleted ${arena?.name}`, ...prev.slice(0, 19)]);
  }, [arenas, selectedArena, playSound]);

  // --- Auto Allocation ---
  useEffect(() => {
    if (isAutoAllocating) {
      autoAllocRef.current = window.setInterval(() => {
        const randomType = Math.floor(Math.random() * BLOCK_TYPES.length);
        allocateBlock(randomType);
      }, 400);
    } else {
      clearInterval(autoAllocRef.current);
    }
    return () => clearInterval(autoAllocRef.current);
  }, [isAutoAllocating, allocateBlock]);

  const reset = () => {
    setIsAutoAllocating(false);
    clearInterval(autoAllocRef.current);
    setArenas([{ id: 1, name: 'Arena A', capacity: MAX_ARENA_CAPACITY, blocks: [], color: ARENA_COLORS[0] }]);
    setSelectedArena(1);
    setNextBlockId(1);
    setNextArenaId(2);
    setAllocHistory([]);
  };

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === '1') allocateBlock(0);
      if (e.key === '2') allocateBlock(1);
      if (e.key === '3') allocateBlock(2);
      if (e.key === '4') allocateBlock(3);
      if (e.key === 'f' || e.key === 'F') freeArena(selectedArena);
      if (e.key === 'n' || e.key === 'N') createArena();
      if (e.key === 'r' || e.key === 'R') reset();
      if (e.key === ' ') {
        e.preventDefault();
        setIsAutoAllocating(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [allocateBlock, freeArena, selectedArena, createArena]);

  const currentArena = arenas.find(a => a.id === selectedArena);
  const currentUsed = currentArena ? getArenaUsed(currentArena) : 0;
  const currentPercent = currentArena ? (currentUsed / currentArena.capacity) * 100 : 0;


  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-cyan-950/10 to-slate-950 rounded-xl border border-cyan-900/30 font-sans overflow-hidden">
      
      {/* Header - Industrial Control Panel */}
      <div className="bg-slate-900/80 border-b border-cyan-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
              <Layers className="text-cyan-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-cyan-300 tracking-wide">MEMORY ARENA FACTORY</h2>
              <p className="text-xs text-cyan-500/70">Allocate Individually • Free by Groups</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled 
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' 
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <div className="text-xs text-cyan-400/70 bg-cyan-950/30 px-3 py-2 rounded-lg border border-cyan-800/30">
              Arenas: <span className="text-cyan-300 font-bold">{arenas.length}</span> / 4
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        
        {/* Arena Tabs */}
        <div className="flex flex-wrap gap-2">
          {arenas.map(arena => {
            const used = getArenaUsed(arena);
            const percent = (used / arena.capacity) * 100;
            return (
              <button
                key={arena.id}
                onClick={() => setSelectedArena(arena.id)}
                className={`relative px-4 py-2 rounded-lg border transition-all ${
                  selectedArena === arena.id
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: arena.color }}
                  />
                  <span className="font-medium text-sm">{arena.name}</span>
                  <span className="text-xs opacity-70">({percent.toFixed(0)}%)</span>
                </div>
                {/* Mini progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-700 rounded-b-lg overflow-hidden">
                  <div 
                    className="h-full transition-all duration-300"
                    style={{ width: `${percent}%`, backgroundColor: arena.color }}
                  />
                </div>
              </button>
            );
          })}
          <button
            onClick={createArena}
            disabled={arenas.length >= 4}
            className="px-3 py-2 rounded-lg border border-dashed border-slate-600 text-slate-500 hover:border-cyan-500/50 hover:text-cyan-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Memory Arena Visualization */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(6,182,212,0.03),_transparent_70%)]" />
          
          {/* Arena Header */}
          <div className="flex items-center justify-between mb-4 relative">
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: currentArena?.color }}
              />
              <span className="text-lg font-bold text-slate-200">{currentArena?.name}</span>
              <span className="text-xs text-slate-500 font-mono">
                {currentUsed}B / {currentArena?.capacity}B
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => freeArena(selectedArena)}
                disabled={!currentArena?.blocks.length}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Trash2 size={12} />
                FREE ALL
              </button>
              {arenas.length > 1 && (
                <button
                  onClick={() => deleteArena(selectedArena)}
                  className="px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-500 text-xs hover:text-red-400 hover:border-red-500/30 transition-all"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Capacity Bar */}
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden mb-4 border border-slate-700">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: currentArena?.color }}
              initial={{ width: 0 }}
              animate={{ width: `${currentPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>


          {/* Memory Blocks Grid */}
          <div className="min-h-[180px] bg-slate-950/50 rounded-lg border border-slate-800 p-3 relative">
            {/* Grid background */}
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'linear-gradient(rgba(6,182,212,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.1) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }} />
            
            <div className="relative flex flex-wrap gap-1.5 content-start">
              <AnimatePresence mode="popLayout">
                {currentArena?.blocks.map((block) => {
                  const widthUnits = Math.max(1, Math.floor(block.size / 4));
                  return (
                    <motion.div
                      key={block.id}
                      layout
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0, y: -20 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="relative group"
                      style={{ width: `${widthUnits * 24}px` }}
                    >
                      <div
                        className="h-10 rounded border-2 flex items-center justify-center text-[10px] font-bold text-white/90 shadow-lg cursor-default transition-transform hover:scale-105"
                        style={{ 
                          backgroundColor: block.color,
                          borderColor: `${block.color}88`,
                          boxShadow: `0 0 10px ${block.color}33`
                        }}
                      >
                        {block.size}B
                      </div>
                      {/* Tooltip */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[9px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {block.type} #{block.id}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              
              {/* Empty state */}
              {(!currentArena?.blocks.length) && (
                <div className="w-full h-32 flex items-center justify-center text-slate-600 text-sm">
                  <div className="text-center">
                    <Box size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Arena is empty</p>
                    <p className="text-xs text-slate-700">Allocate some memory blocks</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Allocation Controls */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-cyan-400 mb-3 flex items-center gap-2">
            <Zap size={12} />
            Allocate Memory Block (Keys: 1-4)
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {BLOCK_TYPES.map((bt, idx) => (
              <button
                key={bt.type}
                onClick={() => allocateBlock(idx)}
                className="relative px-3 py-3 rounded-lg border transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: `${bt.color}15`,
                  borderColor: `${bt.color}40`,
                }}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: bt.color }}
                  />
                  <div className="text-left">
                    <div className="text-xs font-bold" style={{ color: bt.color }}>{bt.type}</div>
                    <div className="text-[10px] text-slate-500">{bt.size} bytes</div>
                  </div>
                </div>
                <div className="absolute top-1 right-1 text-[9px] text-slate-600 font-mono">{idx + 1}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsAutoAllocating(!isAutoAllocating)}
            className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
              isAutoAllocating
                ? 'bg-red-500/20 text-red-300 border border-red-500/50 hover:bg-red-500/30'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-500/30'
            }`}
          >
            <Play size={18} className={isAutoAllocating ? 'animate-pulse' : ''} />
            {isAutoAllocating ? 'STOP AUTO-ALLOC' : 'AUTO ALLOCATE'}
          </button>
          <button
            onClick={reset}
            className="px-4 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
          >
            <RotateCcw size={18} />
          </button>
        </div>


        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {BLOCK_TYPES.map(bt => {
            const count = arenas.reduce((sum, a) => 
              sum + a.blocks.filter(b => b.type === bt.type).length, 0
            );
            return (
              <div 
                key={bt.type}
                className="bg-slate-900/30 rounded-lg border border-slate-800 p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded" style={{ backgroundColor: bt.color }} />
                  <span className="text-xs text-slate-500 uppercase">{bt.type}s</span>
                </div>
                <div className="text-xl font-bold" style={{ color: bt.color }}>{count}</div>
              </div>
            );
          })}
        </div>

        {/* Allocation Log */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-800 text-xs text-slate-500 flex items-center justify-between">
            <span>Allocation Log</span>
            <span className="text-slate-600">{allocHistory.length} events</span>
          </div>
          <div className="max-h-32 overflow-y-auto custom-scrollbar">
            {allocHistory.length === 0 ? (
              <div className="px-4 py-3 text-xs text-slate-600 text-center">
                No allocations yet
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {allocHistory.slice(0, 10).map((log, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="px-4 py-2 text-xs text-slate-400 font-mono"
                  >
                    {log}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">1-4</kbd> Allocate
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">F</kbd> Free Arena
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">N</kbd> New Arena
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Space</kbd> Auto-Alloc
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
          What is an Arena Storage Pool?
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            An <span className="text-cyan-300">arena allocator</span> (also called a region-based allocator) 
            is a memory management strategy where objects are allocated individually from a contiguous block 
            of memory, but freed all at once.
          </p>
          <p>
            <span className="text-cyan-300">Benefits:</span> Extremely fast allocation (just bump a pointer), 
            no fragmentation within the arena, and instant deallocation of all objects.
          </p>
          <p>
            <span className="text-cyan-300">Use cases:</span> Compilers (AST nodes), game engines (per-frame allocations), 
            parsers, and any scenario where many objects share the same lifetime.
          </p>
          <p>
            The key insight: <span className="text-emerald-400">allocate individually, free by groups</span>.
          </p>
        </div>
      </details>
    </div>
  );
}
