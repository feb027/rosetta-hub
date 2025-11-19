import { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, Shuffle, Trophy, Clock, Target, Lightbulb, BookOpen, Volume2, VolumeX, Keyboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MoveHistory {
  board: number[];
  move: number;
  timestamp: number;
}

interface PuzzleNode {
  board: number[];
  emptyIdx: number;
  g: number; // cost from start
  h: number; // heuristic (Manhattan distance)
  f: number; // g + h
  parent: PuzzleNode | null;
  move: number; // tile that was moved
}

export default function FifteenPuzzleVisualization() {
  const [board, setBoard] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSolved, setIsSolved] = useState(false);
  const [message, setMessage] = useState('Click Shuffle to start!');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [bestMoves, setBestMoves] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [lastMovedTile, setLastMovedTile] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [history, setHistory] = useState<MoveHistory[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [hintTile, setHintTile] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const timerRef = useRef<number | null>(null);
  const audioContext = useRef<AudioContext | null>(null);

  // Initialize solved board and audio
  useEffect(() => {
    resetBoard();
    if (typeof window !== 'undefined' && soundEnabled) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return () => {
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  // Timer effect
  useEffect(() => {
    if (isPlaying && !isSolved && startTime) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isSolved, startTime]);

  // Sound effects
  const playSound = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!soundEnabled || !audioContext.current) return;
    
    try {
      const oscillator = audioContext.current.createOscillator();
      const gainNode = audioContext.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.current.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0.15, audioContext.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + duration);
      
      oscillator.start(audioContext.current.currentTime);
      oscillator.stop(audioContext.current.currentTime + duration);
    } catch (e) {
      // Silently fail if audio context is not available
    }
  }, [soundEnabled]);

  // Check if board is solved
  useEffect(() => {
    if (board.length === 0) return;
    const solved = board.every((val, idx) => idx === 15 ? val === 0 : val === idx + 1);
    setIsSolved(solved);
    if (solved && moves > 0) {
      setMessage(`🎉 Solved in ${moves} moves!`);
      setIsPlaying(false);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      
      // Play victory sound
      playSound(523, 0.15, 'sine'); // C
      setTimeout(() => playSound(659, 0.15, 'sine'), 150); // E
      setTimeout(() => playSound(784, 0.15, 'sine'), 300); // G
      setTimeout(() => playSound(1047, 0.3, 'sine'), 450); // C (octave)
      
      // Update best scores
      if (!bestMoves || moves < bestMoves) {
        setBestMoves(moves);
      }
      if (!bestTime || elapsedTime < bestTime) {
        setBestTime(elapsedTime);
      }
    }
  }, [board, moves, playSound, bestMoves, bestTime, elapsedTime]);

  const resetBoard = () => {
    setBoard([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0]);
    setMoves(0);
    setIsPlaying(false);
    setIsSolved(false);
    setMessage('Click Shuffle to start!');
    setStartTime(null);
    setElapsedTime(0);
    setLastMovedTile(null);
    setHistory([]);
  };



  const shuffleBoard = () => {
    let newBoard: number[];
    const shuffleCount = difficulty === 'easy' ? 20 : difficulty === 'medium' ? 50 : 100;
    
    // Start with solved board and make random valid moves
    newBoard = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0];
    let emptyIdx = 15;
    
    for (let i = 0; i < shuffleCount; i++) {
      const validMoves = getValidMoves(emptyIdx);
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      [newBoard[emptyIdx], newBoard[randomMove]] = [newBoard[randomMove], newBoard[emptyIdx]];
      emptyIdx = randomMove;
    }
    
    // Ensure it's not already solved
    if (newBoard.every((val, idx) => idx === 15 ? val === 0 : val === idx + 1)) {
      const validMoves = getValidMoves(emptyIdx);
      const randomMove = validMoves[0];
      [newBoard[emptyIdx], newBoard[randomMove]] = [newBoard[randomMove], newBoard[emptyIdx]];
    }
    
    setBoard(newBoard);
    setMoves(0);
    setIsPlaying(true);
    setIsSolved(false);
    setMessage('Slide tiles to solve the puzzle!');
    setStartTime(Date.now());
    setElapsedTime(0);
    setLastMovedTile(null);
    setHistory([]);
    setHintTile(null);
    
    // Play shuffle sound
    playSound(800, 0.15, 'sawtooth');
  };

  const getValidMoves = (emptyIdx: number): number[] => {
    const row = Math.floor(emptyIdx / 4);
    const col = emptyIdx % 4;
    const moves: number[] = [];
    
    if (row > 0) moves.push(emptyIdx - 4); // up
    if (row < 3) moves.push(emptyIdx + 4); // down
    if (col > 0) moves.push(emptyIdx - 1); // left
    if (col < 3) moves.push(emptyIdx + 1); // right
    
    return moves;
  };

  const getEmptyIndex = () => board.indexOf(0);

  const canMove = (index: number): boolean => {
    const emptyIdx = getEmptyIndex();
    const emptyRow = Math.floor(emptyIdx / 4);
    const emptyCol = emptyIdx % 4;
    const tileRow = Math.floor(index / 4);
    const tileCol = index % 4;

    // Check if tile is adjacent to empty space
    return (
      (Math.abs(emptyRow - tileRow) === 1 && emptyCol === tileCol) ||
      (Math.abs(emptyCol - tileCol) === 1 && emptyRow === tileRow)
    );
  };

  const moveTile = (index: number) => {
    if (!isPlaying || isSolved || !canMove(index)) return;

    const emptyIdx = getEmptyIndex();
    const newBoard = [...board];
    const movedTile = newBoard[index];
    [newBoard[emptyIdx], newBoard[index]] = [newBoard[index], newBoard[emptyIdx]];
    
    setBoard(newBoard);
    setMoves(m => m + 1);
    setMessage(`Moves: ${moves + 1}`);
    setLastMovedTile(movedTile);
    
    // Play move sound
    playSound(440 + (movedTile * 20), 0.08, 'square');
    
    // Add to history
    setHistory(prev => [...prev, {
      board: newBoard,
      move: moves + 1,
      timestamp: Date.now()
    }]);
    
    setTimeout(() => setLastMovedTile(null), 300);
  };

  const undoMove = () => {
    if (history.length === 0) return;
    
    const newHistory = [...history];
    newHistory.pop(); // Remove current state
    
    if (newHistory.length === 0) {
      resetBoard();
      return;
    }
    
    const previousState = newHistory[newHistory.length - 1];
    setBoard(previousState.board);
    setMoves(previousState.move);
    setHistory(newHistory);
    setMessage(`Undo! Moves: ${previousState.move}`);
    
    // Play undo sound
    playSound(350, 0.1, 'sine');
  };

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getManhattanDistance = (boardState: number[] = board): number => {
    let distance = 0;
    boardState.forEach((val, idx) => {
      if (val === 0) return;
      const targetIdx = val - 1;
      const currentRow = Math.floor(idx / 4);
      const currentCol = idx % 4;
      const targetRow = Math.floor(targetIdx / 4);
      const targetCol = targetIdx % 4;
      distance += Math.abs(currentRow - targetRow) + Math.abs(currentCol - targetCol);
    });
    return distance;
  };

  // A* algorithm for hint system
  const findNextMove = useCallback((): number | null => {
    if (board.length === 0) return null;

    const boardKey = (b: number[]) => b.join(',');
    const goalKey = boardKey([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0]);
    
    if (boardKey(board) === goalKey) return null;

    const emptyIdx = getEmptyIndex();
    const startNode: PuzzleNode = {
      board: [...board],
      emptyIdx,
      g: 0,
      h: getManhattanDistance(board),
      f: getManhattanDistance(board),
      parent: null,
      move: -1
    };

    const openSet: PuzzleNode[] = [startNode];
    const closedSet = new Set<string>();
    const maxIterations = 1000; // Limit to prevent hanging
    let iterations = 0;

    while (openSet.length > 0 && iterations < maxIterations) {
      iterations++;
      
      // Get node with lowest f score
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;
      
      const currentKey = boardKey(current.board);
      if (currentKey === goalKey) {
        // Trace back to find first move
        let node = current;
        while (node.parent && node.parent.parent) {
          node = node.parent;
        }
        return node.move;
      }

      closedSet.add(currentKey);

      // Generate neighbors
      const validMoves = getValidMoves(current.emptyIdx);
      for (const moveIdx of validMoves) {
        const newBoard = [...current.board];
        [newBoard[current.emptyIdx], newBoard[moveIdx]] = [newBoard[moveIdx], newBoard[current.emptyIdx]];
        
        const newKey = boardKey(newBoard);
        if (closedSet.has(newKey)) continue;

        const neighbor: PuzzleNode = {
          board: newBoard,
          emptyIdx: moveIdx,
          g: current.g + 1,
          h: getManhattanDistance(newBoard),
          f: 0,
          parent: current,
          move: newBoard[current.emptyIdx]
        };
        neighbor.f = neighbor.g + neighbor.h;

        const existingIdx = openSet.findIndex(n => boardKey(n.board) === newKey);
        if (existingIdx === -1) {
          openSet.push(neighbor);
        } else if (neighbor.g < openSet[existingIdx].g) {
          openSet[existingIdx] = neighbor;
        }
      }
    }

    return null;
  }, [board]);

  const showHint = useCallback(() => {
    const nextTile = findNextMove();
    if (nextTile !== null) {
      setHintTile(nextTile);
      playSound(600, 0.2, 'sine');
      setTimeout(() => setHintTile(null), 2000);
    } else {
      playSound(300, 0.2, 'sawtooth');
    }
  }, [findNextMove, playSound]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying || isSolved) return;
      
      const emptyIdx = getEmptyIndex();
      const row = Math.floor(emptyIdx / 4);
      const col = emptyIdx % 4;
      let targetIdx = -1;

      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          if (row < 3) targetIdx = emptyIdx + 4;
          break;
        case 'arrowdown':
        case 's':
          if (row > 0) targetIdx = emptyIdx - 4;
          break;
        case 'arrowleft':
        case 'a':
          if (col < 3) targetIdx = emptyIdx + 1;
          break;
        case 'arrowright':
        case 'd':
          if (col > 0) targetIdx = emptyIdx - 1;
          break;
        case 'h':
          e.preventDefault();
          showHint();
          return;
        case 'u':
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            undoMove();
          }
          return;
        case '?':
          setShowKeyboardHelp(prev => !prev);
          return;
        default:
          return;
      }

      if (targetIdx !== -1) {
        e.preventDefault();
        moveTile(targetIdx);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, isSolved, board, showHint]);

  // Tutorial steps
  const tutorialSteps = [
    {
      title: "Welcome to 15-Puzzle!",
      content: "This is a classic sliding puzzle. Your goal is to arrange the tiles in numerical order (1-15) with the empty space at the bottom-right."
    },
    {
      title: "How to Move Tiles",
      content: "Click on any tile adjacent to the empty space to slide it. You can also use arrow keys or WASD to move tiles."
    },
    {
      title: "Visual Feedback",
      content: "Green tiles are in the correct position. Cyan glowing tiles can be moved. The progress bar shows how close you are to solving."
    },
    {
      title: "Get Help",
      content: "Press 'H' for a hint, 'U' or Ctrl+Z to undo. The hint system uses A* algorithm to find the optimal next move!"
    },
    {
      title: "Ready to Play!",
      content: "Choose a difficulty and click Shuffle to start. Good luck!"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Confetti Effect */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
          >
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: 0, 
                  y: 0, 
                  scale: 0,
                  rotate: 0
                }}
                animate={{ 
                  x: (Math.random() - 0.5) * 1000,
                  y: Math.random() * 1000 - 500,
                  scale: Math.random() + 0.5,
                  rotate: Math.random() * 360
                }}
                transition={{ 
                  duration: 2,
                  ease: 'easeOut'
                }}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  backgroundColor: ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][i % 5]
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Controls & Stats */}
        <div className="space-y-4">
          {/* Controls Section */}
          <div className="glass rounded-xl p-4 border border-slate-600/50">
            <h3 className="text-lg font-semibold mb-3 text-slate-100">Controls</h3>
            
            <div className="mb-3">
              <label className="block text-xs text-slate-400 mb-1">Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    disabled={isPlaying}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      difficulty === level
                        ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                    } disabled:opacity-50`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={shuffleBoard}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg border border-cyan-500/50 transition-all"
              >
                <Shuffle size={18} />
                <span className="text-sm font-medium">Shuffle</span>
              </button>
              <button
                onClick={resetBoard}
                className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-600/50 transition-all"
                title="Reset"
              >
                <RotateCcw size={18} />
              </button>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-600/50 transition-all"
                title={soundEnabled ? 'Mute' : 'Unmute'}
              >
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                onClick={showHint}
                disabled={!isPlaying || isSolved}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg border border-yellow-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Get hint (H)"
              >
                <Lightbulb size={16} />
                <span className="text-xs font-medium">Hint</span>
              </button>
              <button
                onClick={() => setShowTutorial(true)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg border border-purple-500/50 transition-all"
                title="Show tutorial"
              >
                <BookOpen size={16} />
                <span className="text-xs font-medium">Tutorial</span>
              </button>
              <button
                onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
                className="px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-600/50 transition-all"
                title="Keyboard shortcuts"
              >
                <Keyboard size={16} />
              </button>
            </div>

            {showKeyboardHelp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 text-xs"
              >
                <div className="font-semibold text-cyan-400 mb-2">Keyboard Shortcuts</div>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div><kbd className="px-1.5 py-0.5 bg-slate-700 rounded">↑↓←→</kbd> Move tiles</div>
                  <div><kbd className="px-1.5 py-0.5 bg-slate-700 rounded">WASD</kbd> Move tiles</div>
                  <div><kbd className="px-1.5 py-0.5 bg-slate-700 rounded">H</kbd> Hint</div>
                  <div><kbd className="px-1.5 py-0.5 bg-slate-700 rounded">U</kbd> Undo</div>
                  <div><kbd className="px-1.5 py-0.5 bg-slate-700 rounded">?</kbd> Toggle help</div>
                  <div><kbd className="px-1.5 py-0.5 bg-slate-700 rounded">Ctrl+Z</kbd> Undo</div>
                </div>
              </motion.div>
            )}

            <motion.div 
              className="mt-3 text-center p-3 rounded-lg bg-slate-800/50"
              animate={{ scale: isSolved ? [1, 1.05, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              <p className={`text-sm font-semibold ${isSolved ? 'text-green-400' : 'text-slate-300'}`}>
                {message}
              </p>
            </motion.div>
          </div>

          {/* Stats Section */}
          <div className="glass rounded-xl p-4 border border-slate-600/50">
            <h3 className="text-lg font-semibold mb-3 text-slate-100">Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                  <Target size={14} />
                  <span>Moves</span>
                </div>
                <div className="text-2xl font-bold text-cyan-400">{moves}</div>
                {bestMoves && (
                  <div className="text-xs text-slate-500 mt-1">Best: {bestMoves}</div>
                )}
              </div>
              
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                  <Clock size={14} />
                  <span>Time</span>
                </div>
                <div className="text-2xl font-bold text-cyan-400">
                  {formatTime(elapsedTime)}
                </div>
                {bestTime && (
                  <div className="text-xs text-slate-500 mt-1">Best: {formatTime(bestTime)}</div>
                )}
              </div>
            </div>

            {isPlaying && !isSolved && (
              <div className="mt-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Distance to Solution</span>
                  <span className="text-cyan-400 font-semibold">{getManhattanDistance()}</span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    initial={{ width: '100%' }}
                    animate={{ width: `${Math.max(0, 100 - (getManhattanDistance() / 24) * 100)}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Best Scores */}
          {(bestMoves || bestTime) && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-4 border border-yellow-500/30 bg-yellow-500/5"
            >
              <div className="flex items-center gap-2 mb-2">
                <Trophy size={18} className="text-yellow-400" />
                <h3 className="text-sm font-semibold text-yellow-400">Personal Best</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {bestMoves && (
                  <div className="text-slate-300">
                    <span className="text-slate-400">Moves:</span>{' '}
                    <span className="font-semibold text-yellow-400">{bestMoves}</span>
                  </div>
                )}
                {bestTime && (
                  <div className="text-slate-300">
                    <span className="text-slate-400">Time:</span>{' '}
                    <span className="font-semibold text-yellow-400">{formatTime(bestTime)}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* How It Works */}
          <div className="glass rounded-xl p-4 border border-slate-600/50">
            <h3 className="text-lg font-semibold mb-2 text-slate-100">How to Play</h3>
            <div className="space-y-2 text-sm text-slate-300">
              <p>
                <strong className="text-cyan-400">Goal:</strong> Arrange tiles 1-15 in order with the empty space at bottom-right.
              </p>
              <p>
                <strong className="text-cyan-400">Controls:</strong> Click any tile adjacent to the empty space to slide it.
              </p>
              <p>
                <strong className="text-cyan-400">Visual Feedback:</strong>
              </p>
              <ul className="list-disc list-inside ml-2 space-y-1 text-xs">
                <li><span className="text-green-400">Green</span> = correct position</li>
                <li><span className="text-cyan-400">Cyan glow</span> = movable tile</li>
                <li><span className="text-slate-400">Gray</span> = needs moving</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column - Puzzle Board */}
        <div className="space-y-4">
          <div className="glass rounded-xl p-4 border border-slate-600/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-100">Puzzle Board</h3>
              {history.length > 0 && (
                <button
                  onClick={undoMove}
                  className="text-xs px-3 py-1 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded border border-slate-600/50 transition-all"
                >
                  Undo
                </button>
              )}
            </div>
            
            <div className="flex justify-center">
              <div className="grid grid-cols-4 gap-2 p-4 bg-slate-900/50 rounded-lg relative">
                {board.map((tile, index) => {
                  const isCorrect = tile === 0 ? false : tile === index + 1;
                  const isEmpty = tile === 0;
                  const isMovable = canMove(index);
                  const isLastMoved = tile === lastMovedTile;

                  const isHint = tile === hintTile;

                  return (
                    <motion.button
                      key={`tile-${tile}-${index}`}
                      onClick={() => moveTile(index)}
                      disabled={isEmpty || !isPlaying || isSolved}
                      animate={{ 
                        scale: isLastMoved ? [1, 1.1, 1] : isHint ? [1, 1.08, 1] : 1,
                        opacity: isEmpty ? 0 : 1
                      }}
                      whileHover={isMovable && !isEmpty && isPlaying && !isSolved ? { 
                        scale: 1.05,
                        y: -4
                      } : {}}
                      whileTap={isMovable && !isEmpty && isPlaying && !isSolved ? { 
                        scale: 0.95 
                      } : {}}
                      transition={{ 
                        scale: { duration: 0.2 },
                        opacity: { duration: 0.15 },
                        y: { type: 'spring', stiffness: 400, damping: 25 }
                      }}
                      className={`
                        w-16 h-16 md:w-20 md:h-20 rounded-lg font-bold text-xl
                        transition-colors duration-200 relative overflow-hidden
                        ${isEmpty 
                          ? 'bg-slate-900/50 cursor-default border-2 border-slate-800/50' 
                          : isCorrect
                            ? 'bg-gradient-to-br from-green-500 to-green-600 text-white border-2 border-green-400/50 shadow-lg shadow-green-500/20'
                            : 'bg-gradient-to-br from-slate-700 to-slate-800 text-white border-2 border-slate-600/50'
                        }
                        ${isHint
                          ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-slate-900'
                          : ''
                        }
                        ${isMovable && !isEmpty && isPlaying && !isSolved
                          ? 'cursor-pointer shadow-lg shadow-cyan-500/30 border-cyan-500/50 hover:shadow-cyan-500/50'
                          : ''
                        }
                        ${!isPlaying || isSolved ? 'cursor-not-allowed opacity-70' : ''}
                      `}
                    >
                      {!isEmpty && (
                        <>
                          <div className="relative z-10">
                            {tile}
                          </div>
                          {isMovable && !isEmpty && isPlaying && !isSolved && (
                            <motion.div
                              className="absolute inset-0 bg-cyan-400/20"
                              animate={{ opacity: [0.2, 0.4, 0.2] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                          )}
                          {isHint && (
                            <motion.div
                              className="absolute inset-0 bg-yellow-400/30"
                              animate={{ opacity: [0.3, 0.6, 0.3] }}
                              transition={{ duration: 0.8, repeat: Infinity }}
                            />
                          )}
                          {isCorrect && (
                            <div className="absolute top-1 right-1 w-2 h-2 bg-green-300 rounded-full" />
                          )}
                        </>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-xs justify-center">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-gradient-to-br from-cyan-500 to-cyan-600 border border-cyan-400/50 shadow-sm shadow-cyan-500/30"></div>
                <span className="text-slate-400">Movable</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-gradient-to-br from-green-500 to-green-600 border border-green-400/50"></div>
                <span className="text-slate-400">Correct</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600/50"></div>
                <span className="text-slate-400">Wrong Position</span>
              </div>
            </div>
          </div>

          {isSolved && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass rounded-xl p-4 border border-green-500/50 bg-green-500/5"
            >
              <div className="text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: 3 }}
                  className="text-4xl mb-2"
                >
                  🎉
                </motion.div>
                <div className="font-semibold text-green-400 mb-1">Puzzle Solved!</div>
                <div className="text-sm text-slate-300">
                  {moves} moves in {formatTime(elapsedTime)}
                </div>
                {bestMoves && moves === bestMoves && (
                  <div className="text-xs text-yellow-400 mt-2">🏆 New Best Score!</div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Tutorial Modal */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowTutorial(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-xl p-6 border border-cyan-500/50 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-cyan-400">
                  {tutorialSteps[tutorialStep].title}
                </h3>
                <button
                  onClick={() => setShowTutorial(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              </div>
              
              <p className="text-slate-300 mb-6">
                {tutorialSteps[tutorialStep].content}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {tutorialSteps.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === tutorialStep ? 'bg-cyan-400 w-6' : 'bg-slate-600'
                      }`}
                    />
                  ))}
                </div>
                
                <div className="flex gap-2">
                  {tutorialStep > 0 && (
                    <button
                      onClick={() => setTutorialStep(tutorialStep - 1)}
                      className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-all text-sm"
                    >
                      Back
                    </button>
                  )}
                  {tutorialStep < tutorialSteps.length - 1 ? (
                    <button
                      onClick={() => setTutorialStep(tutorialStep + 1)}
                      className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg border border-cyan-500/50 transition-all text-sm"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowTutorial(false);
                        setTutorialStep(0);
                      }}
                      className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg border border-green-500/50 transition-all text-sm"
                    >
                      Got it!
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Algorithm Explanation */}
      <details className="glass rounded-xl border border-slate-600/50">
        <summary className="p-4 cursor-pointer text-slate-100 font-semibold hover:text-cyan-400 transition-colors">
          📚 Algorithm & Implementation Details
        </summary>
        <div className="px-4 pb-4 space-y-4">
          <div>
            <h4 className="font-semibold text-cyan-300 mb-2">Solvability Check</h4>
            <p className="text-sm text-slate-300 mb-2">
              The 15-puzzle has a mathematical property: only half of all possible configurations are solvable.
              A configuration is solvable if the number of inversions plus the row of the empty tile (from bottom) is even.
            </p>
            <pre className="bg-slate-900 p-3 rounded-lg overflow-x-auto text-xs">
              <code className="text-slate-300">{`function isSolvable(board: number[]): boolean {
  let inversions = 0;
  const filtered = board.filter(n => n !== 0);
  
  for (let i = 0; i < filtered.length; i++) {
    for (let j = i + 1; j < filtered.length; j++) {
      if (filtered[i] > filtered[j]) inversions++;
    }
  }
  
  const emptyRow = Math.floor(board.indexOf(0) / 4);
  const emptyFromBottom = 4 - emptyRow;
  
  return (inversions + emptyFromBottom) % 2 === 0;
}`}</code>
            </pre>
          </div>

          <div>
            <h4 className="font-semibold text-cyan-300 mb-2">Manhattan Distance Heuristic</h4>
            <p className="text-sm text-slate-300 mb-2">
              The Manhattan distance calculates how far each tile is from its goal position.
              This gives you a measure of how close you are to solving the puzzle.
            </p>
            <pre className="bg-slate-900 p-3 rounded-lg overflow-x-auto text-xs">
              <code className="text-slate-300">{`function getManhattanDistance(board: number[]): number {
  let distance = 0;
  board.forEach((val, idx) => {
    if (val === 0) return;
    const targetIdx = val - 1;
    const currentRow = Math.floor(idx / 4);
    const currentCol = idx % 4;
    const targetRow = Math.floor(targetIdx / 4);
    const targetCol = targetIdx % 4;
    distance += Math.abs(currentRow - targetRow) 
              + Math.abs(currentCol - targetCol);
  });
  return distance;
}`}</code>
            </pre>
          </div>

          <div>
            <h4 className="font-semibold text-cyan-300 mb-2">Complexity Analysis</h4>
            <div className="text-sm text-slate-300 space-y-2">
              <p><strong className="text-cyan-400">Time:</strong> O(1) per move, O(n²) for solvability check</p>
              <p><strong className="text-cyan-400">Space:</strong> O(1) - fixed 4×4 board</p>
              <p><strong className="text-cyan-400">State Space:</strong> 16!/2 ≈ 10.4 trillion solvable configurations</p>
              <p><strong className="text-cyan-400">Optimal Solution:</strong> Up to 80 moves required in worst case</p>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
