import { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, Trophy, Zap, Volume2, VolumeX, Gamepad2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Tile colors based on value - neon arcade theme
const TILE_COLORS: Record<number, { bg: string; text: string; glow: string }> = {
  2: { bg: 'from-cyan-600 to-cyan-700', text: 'text-white', glow: 'shadow-cyan-500/50' },
  4: { bg: 'from-teal-500 to-teal-600', text: 'text-white', glow: 'shadow-teal-500/50' },
  8: { bg: 'from-emerald-500 to-emerald-600', text: 'text-white', glow: 'shadow-emerald-500/50' },
  16: { bg: 'from-green-500 to-green-600', text: 'text-white', glow: 'shadow-green-500/50' },
  32: { bg: 'from-lime-500 to-lime-600', text: 'text-slate-900', glow: 'shadow-lime-500/50' },
  64: { bg: 'from-yellow-500 to-yellow-600', text: 'text-slate-900', glow: 'shadow-yellow-500/50' },
  128: { bg: 'from-amber-500 to-amber-600', text: 'text-slate-900', glow: 'shadow-amber-500/50' },
  256: { bg: 'from-orange-500 to-orange-600', text: 'text-white', glow: 'shadow-orange-500/50' },
  512: { bg: 'from-red-500 to-red-600', text: 'text-white', glow: 'shadow-red-500/50' },
  1024: { bg: 'from-rose-500 to-rose-600', text: 'text-white', glow: 'shadow-rose-500/50' },
  2048: { bg: 'from-pink-500 to-pink-600', text: 'text-white', glow: 'shadow-pink-500/60' },
  4096: { bg: 'from-fuchsia-500 to-fuchsia-600', text: 'text-white', glow: 'shadow-fuchsia-500/60' },
};

interface Tile {
  id: number;
  value: number;
  row: number;
  col: number;
  isNew?: boolean;
  isMerged?: boolean;
}

type Direction = 'up' | 'down' | 'left' | 'right';

export default function TwentyFortyEightVisualization() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [keepPlaying, setKeepPlaying] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastMove, setLastMove] = useState<Direction | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [highestTile, setHighestTile] = useState(0);
  
  const tileIdRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize game
  useEffect(() => {
    initGame();
  }, []);

  // Sound effects
  const playSound = useCallback((type: 'move' | 'merge' | 'spawn' | 'win' | 'lose') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'move') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'merge') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'spawn') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'win') {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        gain.gain.setValueAtTime(0.1, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3 + i * 0.12);
        osc.start(now + i * 0.12);
        osc.stop(now + 0.35 + i * 0.12);
      });
    } else if (type === 'lose') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.4);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  }, [soundEnabled]);


  // Get empty cells
  const getEmptyCells = (currentTiles: Tile[]): { row: number; col: number }[] => {
    const occupied = new Set(currentTiles.map(t => `${t.row},${t.col}`));
    const empty: { row: number; col: number }[] = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (!occupied.has(`${row},${col}`)) {
          empty.push({ row, col });
        }
      }
    }
    return empty;
  };

  // Add random tile
  const addRandomTile = (currentTiles: Tile[]): Tile[] => {
    const empty = getEmptyCells(currentTiles);
    if (empty.length === 0) return currentTiles;
    
    const { row, col } = empty[Math.floor(Math.random() * empty.length)];
    const value = Math.random() < 0.9 ? 2 : 4;
    
    return [...currentTiles, {
      id: ++tileIdRef.current,
      value,
      row,
      col,
      isNew: true,
    }];
  };

  // Initialize game
  const initGame = () => {
    tileIdRef.current = 0;
    let newTiles: Tile[] = [];
    newTiles = addRandomTile(newTiles);
    newTiles = addRandomTile(newTiles);
    setTiles(newTiles);
    setScore(0);
    setGameOver(false);
    setWon(false);
    setKeepPlaying(false);
    setMoveCount(0);
    setHighestTile(Math.max(...newTiles.map(t => t.value)));
    setLastMove(null);
  };

  // Check if moves are possible
  const canMove = (currentTiles: Tile[]): boolean => {
    if (getEmptyCells(currentTiles).length > 0) return true;
    
    // Check for possible merges
    const grid: number[][] = Array(4).fill(null).map(() => Array(4).fill(0));
    currentTiles.forEach(t => { grid[t.row][t.col] = t.value; });
    
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const val = grid[row][col];
        if (
          (row < 3 && grid[row + 1][col] === val) ||
          (col < 3 && grid[row][col + 1] === val)
        ) {
          return true;
        }
      }
    }
    return false;
  };

  // Move tiles in a direction
  const move = useCallback((direction: Direction) => {
    if (gameOver && !keepPlaying) return;
    
    setTiles(prevTiles => {
      // Clear animation flags
      let currentTiles = prevTiles.map(t => ({ ...t, isNew: false, isMerged: false }));
      
      // Build grid
      const grid: (Tile | null)[][] = Array(4).fill(null).map(() => Array(4).fill(null));
      currentTiles.forEach(t => { grid[t.row][t.col] = t; });
      
      let moved = false;
      let scoreGain = 0;
      const newTiles: Tile[] = [];
      
      const processLine = (line: (Tile | null)[]): Tile[] => {
        // Filter out nulls
        const tiles = line.filter((t): t is Tile => t !== null);
        const result: Tile[] = [];
        
        let i = 0;
        while (i < tiles.length) {
          if (i + 1 < tiles.length && tiles[i].value === tiles[i + 1].value) {
            // Merge
            const newValue = tiles[i].value * 2;
            result.push({
              id: ++tileIdRef.current,
              value: newValue,
              row: 0, // Will be set later
              col: 0,
              isMerged: true,
            });
            scoreGain += newValue;
            i += 2;
          } else {
            result.push({ ...tiles[i] });
            i++;
          }
        }
        return result;
      };
      
      // Process based on direction
      if (direction === 'left' || direction === 'right') {
        for (let row = 0; row < 4; row++) {
          let line = grid[row].slice();
          if (direction === 'right') line.reverse();
          
          const processed = processLine(line);
          if (direction === 'right') processed.reverse();
          
          // Check if moved
          const originalPositions = grid[row].map((t, i) => t ? i : -1).filter(i => i >= 0);
          const newPositions = processed.map((_, i) => direction === 'right' ? 3 - i : i);
          if (JSON.stringify(originalPositions) !== JSON.stringify(newPositions.slice(0, originalPositions.length))) {
            moved = true;
          }
          
          // Assign positions
          processed.forEach((tile, col) => {
            tile.row = row;
            tile.col = direction === 'right' ? 3 - (processed.length - 1 - col) : col;
            newTiles.push(tile);
          });
        }
      } else {
        for (let col = 0; col < 4; col++) {
          let line = [grid[0][col], grid[1][col], grid[2][col], grid[3][col]];
          if (direction === 'down') line.reverse();
          
          const processed = processLine(line);
          if (direction === 'down') processed.reverse();
          
          // Check if moved
          const originalPositions = line.map((t, i) => t ? i : -1).filter(i => i >= 0);
          const newPositions = processed.map((_, i) => direction === 'down' ? 3 - i : i);
          if (JSON.stringify(originalPositions) !== JSON.stringify(newPositions.slice(0, originalPositions.length))) {
            moved = true;
          }
          
          // Assign positions
          processed.forEach((tile, row) => {
            tile.col = col;
            tile.row = direction === 'down' ? 3 - (processed.length - 1 - row) : row;
            newTiles.push(tile);
          });
        }
      }
      
      if (!moved) return prevTiles;
      
      // Play sounds
      playSound('move');
      if (scoreGain > 0) {
        setTimeout(() => playSound('merge'), 50);
      }
      
      // Add new tile
      const withNewTile = addRandomTile(newTiles);
      setTimeout(() => playSound('spawn'), 100);
      
      // Update score
      setScore(prev => {
        const newScore = prev + scoreGain;
        if (newScore > bestScore) setBestScore(newScore);
        return newScore;
      });
      
      // Update stats
      setMoveCount(prev => prev + 1);
      setLastMove(direction);
      
      const maxTile = Math.max(...withNewTile.map(t => t.value));
      setHighestTile(maxTile);
      
      // Check win
      if (maxTile >= 2048 && !won && !keepPlaying) {
        setWon(true);
        setShowConfetti(true);
        playSound('win');
        setTimeout(() => setShowConfetti(false), 3000);
      }
      
      // Check game over
      if (!canMove(withNewTile)) {
        setGameOver(true);
        playSound('lose');
      }
      
      return withNewTile;
    });
  }, [gameOver, keepPlaying, won, bestScore, playSound]);


  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          move('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          move('down');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          move('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          move('right');
          break;
        case 'r':
        case 'R':
          initGame();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  // Touch controls
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    
    if (Math.max(absDx, absDy) < 30) return; // Too short
    
    if (absDx > absDy) {
      move(dx > 0 ? 'right' : 'left');
    } else {
      move(dy > 0 ? 'down' : 'up');
    }
    
    touchStartRef.current = null;
  };

  const getTileStyle = (value: number) => {
    return TILE_COLORS[value] || { 
      bg: 'from-slate-500 to-slate-600', 
      text: 'text-white', 
      glow: 'shadow-slate-500/50' 
    };
  };

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-xl border border-cyan-900/30 font-sans overflow-hidden">
      
      {/* Confetti Effect */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50"
          >
            {[...Array(40)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: '50vw', y: '50vh', scale: 0 }}
                animate={{
                  x: `${Math.random() * 100}vw`,
                  y: `${Math.random() * 100}vh`,
                  scale: Math.random() + 0.5,
                  rotate: Math.random() * 720,
                }}
                transition={{ duration: 2, ease: 'easeOut' }}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  backgroundColor: ['#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'][i % 5],
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-slate-900/80 border-b border-cyan-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30">
              <Gamepad2 className="text-cyan-400" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400 tracking-wider">
                2048
              </h2>
              <p className="text-xs text-cyan-500/70">Neon Arcade Edition</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Score Display */}
            <div className="flex gap-2">
              <div className="px-4 py-2 rounded-lg bg-slate-800/80 border border-cyan-500/30">
                <div className="text-[10px] text-cyan-400/70 uppercase tracking-wider">Score</div>
                <div className="text-xl font-bold text-cyan-300 font-mono">{score}</div>
              </div>
              <div className="px-4 py-2 rounded-lg bg-slate-800/80 border border-amber-500/30">
                <div className="text-[10px] text-amber-400/70 uppercase tracking-wider">Best</div>
                <div className="text-xl font-bold text-amber-300 font-mono">{bestScore}</div>
              </div>
            </div>
            
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled 
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' 
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            
            <button
              onClick={initGame}
              className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-all"
              title="New Game (R)"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        
        {/* Game Board */}
        <div className="flex justify-center">
          <div 
            className="relative bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 shadow-2xl"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Grid Background */}
            <div className="grid grid-cols-4 gap-2">
              {[...Array(16)].map((_, i) => (
                <div
                  key={i}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-slate-900/50 border border-slate-700/30"
                />
              ))}
            </div>
            
            {/* Tiles */}
            <div className="absolute inset-3">
              <AnimatePresence mode="popLayout">
                {tiles.map(tile => {
                  const style = getTileStyle(tile.value);
                  return (
                    <motion.div
                      key={tile.id}
                      initial={tile.isNew ? { scale: 0, opacity: 0 } : false}
                      animate={{
                        x: tile.col * (window.innerWidth < 640 ? 72 : 88),
                        y: tile.row * (window.innerWidth < 640 ? 72 : 88),
                        scale: tile.isMerged ? [1, 1.15, 1] : 1,
                        opacity: 1,
                      }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{
                        x: { type: 'spring', stiffness: 300, damping: 30 },
                        y: { type: 'spring', stiffness: 300, damping: 30 },
                        scale: { duration: 0.15 },
                      }}
                      className={`
                        absolute w-16 h-16 sm:w-20 sm:h-20 rounded-lg
                        bg-gradient-to-br ${style.bg}
                        flex items-center justify-center
                        font-bold ${tile.value >= 1000 ? 'text-lg sm:text-xl' : tile.value >= 100 ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'}
                        ${style.text}
                        shadow-lg ${style.glow}
                        border border-white/10
                      `}
                    >
                      {tile.value}
                      {tile.value >= 2048 && (
                        <motion.div
                          className="absolute inset-0 rounded-lg bg-white/20"
                          animate={{ opacity: [0.2, 0.4, 0.2] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Win Overlay */}
            <AnimatePresence>
              {won && !keepPlaying && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-900/90 rounded-xl flex flex-col items-center justify-center gap-4 z-10"
                >
                  <Trophy className="text-amber-400" size={48} />
                  <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">
                    YOU WIN!
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setKeepPlaying(true)}
                      className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30 transition-all"
                    >
                      Keep Playing
                    </button>
                    <button
                      onClick={initGame}
                      className="px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 transition-all"
                    >
                      New Game
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Game Over Overlay */}
            <AnimatePresence>
              {gameOver && !won && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-900/90 rounded-xl flex flex-col items-center justify-center gap-4 z-10"
                >
                  <div className="text-3xl font-black text-red-400">GAME OVER</div>
                  <div className="text-slate-400">Final Score: <span className="text-cyan-300 font-bold">{score}</span></div>
                  <button
                    onClick={initGame}
                    className="px-6 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30 transition-all"
                  >
                    Try Again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>


        {/* Direction Controls (Mobile) */}
        <div className="flex justify-center md:hidden">
          <div className="grid grid-cols-3 gap-2">
            <div />
            <button
              onClick={() => move('up')}
              className="p-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50 active:bg-cyan-500/20 transition-all"
            >
              <ArrowUp size={24} />
            </button>
            <div />
            <button
              onClick={() => move('left')}
              className="p-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50 active:bg-cyan-500/20 transition-all"
            >
              <ArrowLeft size={24} />
            </button>
            <button
              onClick={() => move('down')}
              className="p-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50 active:bg-cyan-500/20 transition-all"
            >
              <ArrowDown size={24} />
            </button>
            <button
              onClick={() => move('right')}
              className="p-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50 active:bg-cyan-500/20 transition-all"
            >
              <ArrowRight size={24} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Moves</div>
            <div className="text-xl font-bold text-cyan-400 font-mono">{moveCount}</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Highest Tile</div>
            <div className="text-xl font-bold text-emerald-400 font-mono">{highestTile}</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Last Move</div>
            <div className="text-xl font-bold text-amber-400 capitalize">{lastMove || '—'}</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Tiles</div>
            <div className="text-xl font-bold text-rose-400 font-mono">{tiles.length}</div>
          </div>
        </div>

        {/* Tile Legend */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-slate-500 mb-3">Tile Progression</div>
          <div className="flex flex-wrap gap-2">
            {[2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048].map(value => {
              const style = getTileStyle(value);
              const isAchieved = highestTile >= value;
              return (
                <motion.div
                  key={value}
                  className={`
                    w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold
                    bg-gradient-to-br ${style.bg} ${style.text}
                    ${isAchieved ? 'opacity-100' : 'opacity-30'}
                    border border-white/10
                  `}
                  animate={value === highestTile ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.5, repeat: value === highestTile ? Infinity : 0, repeatDelay: 1 }}
                >
                  {value}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="hidden md:flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">↑↓←→</kbd> or <kbd className="text-slate-400">WASD</kbd> Move
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> New Game
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            Swipe on mobile
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-2">
          <Zap size={14} />
          How to Play
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            <span className="text-cyan-300">Goal:</span> Combine tiles to create the <span className="text-amber-300 font-bold">2048</span> tile!
          </p>
          <p>
            <span className="text-cyan-300">Controls:</span> Use arrow keys, WASD, or swipe to slide all tiles in a direction.
          </p>
          <p>
            <span className="text-cyan-300">Merging:</span> When two tiles with the same number touch, they merge into one with their sum.
          </p>
          <p>
            <span className="text-cyan-300">Spawning:</span> After each move, a new tile (2 or 4) appears in a random empty spot.
          </p>
          <p>
            <span className="text-red-300">Game Over:</span> When no moves are possible and the board is full.
          </p>
        </div>
      </details>
    </div>
  );
}
