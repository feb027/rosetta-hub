import { useState, useEffect } from 'react';
import { Play, RotateCcw, User, Cpu, Trophy, Target, Zap, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function TwentyOneGameVisualization() {
  const [total, setTotal] = useState(0);
  const [gameState, setGameState] = useState<'idle' | 'player' | 'computer' | 'won' | 'lost'>('idle');
  const [lastMove, setLastMove] = useState<{ player: string; value: number } | null>(null);
  const [history, setHistory] = useState<Array<{ player: string; value: number; total: number }>>([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('hard');
  const [showHint, setShowHint] = useState(false);

  const GOAL = 21;
  const WINNING_POSITIONS = [1, 5, 9, 13, 17, 21];

  const computerMove = () => {
    // Difficulty-based strategy
    if (difficulty === 'easy') {
      // Random moves
      const available = [1, 2, 3].filter(v => total + v <= GOAL);
      return available[Math.floor(Math.random() * available.length)];
    }
    
    if (difficulty === 'medium') {
      // 50% optimal, 50% random
      if (Math.random() < 0.5) {
        const available = [1, 2, 3].filter(v => total + v <= GOAL);
        return available[Math.floor(Math.random() * available.length)];
      }
    }
    
    // Hard: Optimal strategy - aim for 1, 5, 9, 13, 17
    let move = 1;
    for (const target of WINNING_POSITIONS) {
      if (target > total && target - total <= 3) {
        move = target - total;
        break;
      }
    }
    return move;
  };

  const getOptimalMove = () => {
    for (const target of WINNING_POSITIONS) {
      if (target > total && target - total <= 3) {
        return target - total;
      }
    }
    return 1;
  };

  const handlePlayerMove = (value: number) => {
    if (gameState !== 'player' || total + value > GOAL) return;

    const newTotal = total + value;
    setTotal(newTotal);
    setLastMove({ player: 'You', value });
    setHistory(prev => [...prev, { player: 'You', value, total: newTotal }]);

    if (newTotal === GOAL) {
      setGameState('won');
      setPlayerScore(prev => prev + 1);
      return;
    }

    setGameState('computer');
  };

  const availableMoves = [1, 2, 3].filter(v => total + v <= GOAL);

  useEffect(() => {
    if (gameState === 'computer') {
      const timer = setTimeout(() => {
        const move = computerMove();
        const newTotal = total + move;
        setTotal(newTotal);
        setLastMove({ player: 'Computer', value: move });
        setHistory(prev => [...prev, { player: 'Computer', value: move, total: newTotal }]);

        if (newTotal === GOAL) {
          setGameState('lost');
          setComputerScore(prev => prev + 1);
        } else {
          setGameState('player');
        }
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [gameState, total]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState !== 'player') return;
      
      const key = e.key;
      if (key === '1' || key === '2' || key === '3') {
        const value = parseInt(key);
        if (availableMoves.includes(value)) {
          handlePlayerMove(value);
        }
      } else if (key === 'h' || key === 'H') {
        if (difficulty === 'hard') {
          setShowHint(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, total, availableMoves, difficulty]);

  const startGame = () => {
    setTotal(0);
    setLastMove(null);
    setHistory([]);
    setShowHint(false);
    // Randomly decide who goes first
    setGameState(Math.random() < 0.5 ? 'player' : 'computer');
  };

  const resetGame = () => {
    setTotal(0);
    setLastMove(null);
    setHistory([]);
    setGameState('idle');
    setShowHint(false);
  };

  const resetScores = () => {
    setPlayerScore(0);
    setComputerScore(0);
    resetGame();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Score Board */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-sm rounded-xl p-4 border border-cyan-500/30"
        >
          <div className="flex items-center gap-2 mb-2">
            <User size={18} className="text-cyan-400" />
            <span className="text-sm text-slate-300">You</span>
          </div>
          <div className="text-3xl font-bold text-cyan-400">{playerScore}</div>
          <div className="text-xs text-slate-400 mt-1">Wins</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-600/50 flex flex-col items-center justify-center"
        >
          <Trophy size={24} className="text-yellow-400 mb-2" />
          <div className="text-xs text-slate-400">Best of</div>
          <div className="text-lg font-bold text-slate-300">{playerScore + computerScore}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30"
        >
          <div className="flex items-center gap-2 mb-2">
            <Cpu size={18} className="text-blue-400" />
            <span className="text-sm text-slate-300">Computer</span>
          </div>
          <div className="text-3xl font-bold text-blue-400">{computerScore}</div>
          <div className="text-xs text-slate-400 mt-1">Wins</div>
        </motion.div>
      </div>

      {/* Game Board */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-cyan-500/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-semibold text-cyan-400">21 Game</h3>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
              disabled={gameState !== 'idle'}
              className="px-3 py-1.5 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div className="flex gap-2 flex-wrap">
            {gameState === 'idle' && (
              <button
                onClick={startGame}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors shadow-lg shadow-cyan-500/20"
                aria-label="Start game"
              >
                <Play size={16} />
                Start Game
              </button>
            )}
            {gameState !== 'idle' && (
              <>
                <button
                  onClick={startGame}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
                  aria-label="New round"
                >
                  <RotateCcw size={16} />
                  New Round
                </button>
                <button
                  onClick={resetScores}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition-colors"
                  aria-label="Reset scores"
                >
                  Reset Scores
                </button>
              </>
            )}
          </div>
        </div>

        {/* Progress Bar - Fixed overflow */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>Progress to 21</span>
            <span className="text-cyan-400 font-mono">{total} / {GOAL}</span>
          </div>
          <div className="h-10 bg-slate-700/50 rounded-lg overflow-hidden relative">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${(total / GOAL) * 100}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
            {WINNING_POSITIONS.slice(0, -1).map(pos => (
              <div
                key={pos}
                className="absolute top-0 bottom-0 w-1 bg-yellow-400/60"
                style={{ left: `${(pos / GOAL) * 100}%` }}
                title={`Winning position: ${pos}`}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/50" />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-2 px-1">
            <span>0</span>
            {WINNING_POSITIONS.slice(0, -1).map(pos => (
              <span key={pos} className="text-yellow-400 font-semibold">{pos}</span>
            ))}
            <span className="text-cyan-400 font-bold">21</span>
          </div>
        </div>

        {/* Current Total Display */}
        <div className="text-center mb-6 relative">
          <motion.div
            key={total}
            initial={{ scale: 1.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="inline-block"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-2xl" />
              <div className="relative text-7xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 font-mono">
                {total}
              </div>
            </div>
          </motion.div>
          <p className="text-slate-400 mt-3 text-sm">Current Total</p>
          {WINNING_POSITIONS.includes(total) && total !== 0 && total !== 21 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-400 text-xs"
            >
              <Target size={12} />
              <span>Winning Position!</span>
            </motion.div>
          )}
        </div>

        {/* Player Controls */}
        {gameState === 'player' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-2 text-cyan-400">
                <User size={20} />
                <span className="font-semibold">Your Turn</span>
              </div>
              {difficulty === 'hard' && (
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400 rounded-lg text-xs transition-colors"
                >
                  <Brain size={14} />
                  {showHint ? 'Hide' : 'Show'} Hint
                </button>
              )}
            </div>
            
            {showHint && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-center"
              >
                <div className="flex items-center justify-center gap-2 text-yellow-400 text-sm">
                  <Zap size={14} />
                  <span>Optimal move: <span className="font-bold text-lg">{getOptimalMove()}</span></span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Aim for: {WINNING_POSITIONS.filter(p => p > total).slice(0, 2).join(', ')}
                </p>
              </motion.div>
            )}

            <div className="flex gap-3 justify-center flex-wrap">
              {availableMoves.map(value => {
                const isOptimal = value === getOptimalMove();
                return (
                  <motion.button
                    key={value}
                    onClick={() => handlePlayerMove(value)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative w-20 h-20 rounded-xl text-3xl font-bold transition-all shadow-lg ${
                      isOptimal && showHint
                        ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white shadow-yellow-500/50'
                        : 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-cyan-500/30 hover:shadow-cyan-500/50'
                    }`}
                    aria-label={`Add ${value} (Press ${value} key)`}
                  >
                    {value}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-900/80 rounded text-[10px] flex items-center justify-center text-slate-400 border border-slate-700">
                      {value}
                    </div>
                    {isOptimal && showHint && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center"
                      >
                        <Zap size={12} className="text-slate-900" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
            <p className="text-center text-xs text-slate-500 mt-2">
              💡 Tip: Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">1</kbd>, <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">2</kbd>, or <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">3</kbd> on your keyboard
              {difficulty === 'hard' && <> • Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">H</kbd> for hint</>}
            </p>
          </motion.div>
        )}

        {/* Computer Turn Indicator */}
        {gameState === 'computer' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="flex items-center gap-2 text-blue-400">
              <Cpu size={20} />
              <span className="font-semibold">Computer thinking...</span>
            </div>
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 bg-blue-400 rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Game Over */}
        <AnimatePresence>
          {(gameState === 'won' || gameState === 'lost') && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`text-center p-6 rounded-xl relative overflow-hidden ${
                gameState === 'won' 
                  ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/50' 
                  : 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/50'
              }`}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="text-6xl mb-3"
              >
                {gameState === 'won' ? '🎉' : '🤖'}
              </motion.div>
              <div className={`text-3xl font-bold mb-2 ${
                gameState === 'won' ? 'text-green-400' : 'text-blue-400'
              }`}>
                {gameState === 'won' ? 'You Won!' : 'Computer Won!'}
              </div>
              <p className="text-slate-300 mb-4">
                {gameState === 'won' 
                  ? 'Congratulations! You reached 21 first!' 
                  : difficulty === 'hard' 
                    ? 'The computer played optimally. Try the hint feature!'
                    : 'Better luck next time!'}
              </p>
              <div className="flex items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-cyan-400" />
                  <span className="text-slate-300">{playerScore}</span>
                </div>
                <span className="text-slate-500">-</span>
                <div className="flex items-center gap-2">
                  <Cpu size={16} className="text-blue-400" />
                  <span className="text-slate-300">{computerScore}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Last Move */}
        {lastMove && gameState !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700/50 rounded-lg border border-slate-600/50">
              {lastMove.player === 'You' ? (
                <User size={14} className="text-cyan-400" />
              ) : (
                <Cpu size={14} className="text-blue-400" />
              )}
              <span className="text-sm text-slate-400">
                <span className={`font-semibold ${lastMove.player === 'You' ? 'text-cyan-400' : 'text-blue-400'}`}>
                  {lastMove.player}
                </span>
                {' '}added{' '}
                <span className="font-mono text-white font-bold">+{lastMove.value}</span>
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Move History */}
      {history.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-cyan-500/20">
          <h4 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
            <span>Move History</span>
            <span className="text-xs text-slate-400 font-normal">({history.length} moves)</span>
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {history.map((move, idx) => {
              const isWinningPosition = WINNING_POSITIONS.includes(move.total);
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.5) }}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    isWinningPosition
                      ? 'bg-yellow-500/10 border border-yellow-500/30'
                      : 'bg-slate-700/30 border border-slate-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-700/50 flex items-center justify-center text-xs text-slate-400">
                      {idx + 1}
                    </div>
                    {move.player === 'You' ? (
                      <User size={16} className="text-cyan-400" />
                    ) : (
                      <Cpu size={16} className="text-blue-400" />
                    )}
                    <span className="text-slate-300 text-sm">{move.player}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-sm">
                    <span className="text-white font-semibold">+{move.value}</span>
                    <span className="text-slate-500">→</span>
                    <span className={`font-bold ${isWinningPosition ? 'text-yellow-400' : 'text-cyan-400'}`}>
                      {move.total}
                    </span>
                    {isWinningPosition && move.total !== 21 && (
                      <Target size={14} className="text-yellow-400" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Strategy Guide */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-cyan-500/20">
        <h4 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
          <Brain size={20} />
          Winning Strategy
        </h4>
        <div className="space-y-4 text-slate-300 text-sm">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="font-semibold text-yellow-400 mb-2">🎯 Key Insight</p>
            <p>
              Control the <span className="text-yellow-400 font-bold">winning positions</span>: 
              {' '}{WINNING_POSITIONS.slice(0, -1).map((pos, idx) => (
                <span key={pos}>
                  <span className="font-mono font-bold">{pos}</span>
                  {idx < WINNING_POSITIONS.length - 2 && ', '}
                </span>
              ))}, and <span className="font-mono font-bold">21</span>.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-700/30 rounded-lg p-4">
              <p className="font-semibold text-cyan-400 mb-2">📊 The Pattern</p>
              <p className="text-slate-400">
                Each winning position is <span className="text-white font-semibold">4 apart</span>. 
                If you reach one, you can always reach the next!
              </p>
            </div>
            
            <div className="bg-slate-700/30 rounded-lg p-4">
              <p className="font-semibold text-cyan-400 mb-2">🔄 Counter Strategy</p>
              <ul className="space-y-1 text-slate-400 text-xs">
                <li>• Opponent adds 1 → You add 3</li>
                <li>• Opponent adds 2 → You add 2</li>
                <li>• Opponent adds 3 → You add 1</li>
              </ul>
            </div>
          </div>

          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
            <p className="text-cyan-400 font-semibold text-center">
              💡 Formula: Total = 4n + 1 (where n = 0, 1, 2, 3, 4, 5)
            </p>
          </div>
        </div>
      </div>

      {/* Code Example */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20">
        <h4 className="text-lg font-semibold text-cyan-400 mb-3">Implementation</h4>
        <pre className="text-sm text-slate-300 overflow-x-auto">
          <code>{`function optimalMove(currentTotal) {
  const winningPositions = [1, 5, 9, 13, 17, 21];
  
  // Try to reach the next winning position
  for (const target of winningPositions) {
    if (target > currentTotal && target - currentTotal <= 3) {
      return target - currentTotal;
    }
  }
  
  // Fallback: add 1
  return 1;
}

// Game loop
let total = 0;
while (total < 21) {
  const playerMove = getPlayerInput(); // 1, 2, or 3
  total += playerMove;
  if (total === 21) {
    console.log("Player wins!");
    break;
  }
  
  const computerMove = optimalMove(total);
  total += computerMove;
  if (total === 21) {
    console.log("Computer wins!");
    break;
  }
}`}</code>
        </pre>
      </div>

      {/* Complexity Analysis */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-cyan-500/20">
        <h4 className="text-lg font-semibold text-cyan-400 mb-4">Complexity Analysis</h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-yellow-400" />
              <span className="text-slate-400 font-semibold">Time Complexity:</span>
            </div>
            <p className="text-white font-mono text-lg mb-1">O(1)</p>
            <p className="text-slate-400 text-xs">Optimal move calculation is constant time</p>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target size={16} className="text-cyan-400" />
              <span className="text-slate-400 font-semibold">Space Complexity:</span>
            </div>
            <p className="text-white font-mono text-lg mb-1">O(n)</p>
            <p className="text-slate-400 text-xs">Where n is the number of moves (max ~21)</p>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(51, 65, 85, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.7);
        }
      `}</style>
    </div>
  );
}
