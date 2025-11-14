import { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Lightbulb, Trophy, Target, TrendingUp, Sparkles, Volume2, VolumeX, Delete } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function TwentyFourGameVisualization() {
  const [digits, setDigits] = useState<number[]>([]);
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [wins, setWins] = useState(0);

  const [showConfetti, setShowConfetti] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hintLevel, setHintLevel] = useState(0);
  const [validationError, setValidationError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Sound effect functions
  const playSound = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!soundEnabled || !audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  };

  const playSuccessSound = () => {
    playSound(523.25, 0.1); // C5
    setTimeout(() => playSound(659.25, 0.1), 100); // E5
    setTimeout(() => playSound(783.99, 0.2), 200); // G5
  };

  const playErrorSound = () => {
    playSound(200, 0.1, 'square');
    setTimeout(() => playSound(150, 0.15, 'square'), 100);
  };

  const playClickSound = () => {
    playSound(800, 0.05, 'square');
  };

  const playStreakSound = () => {
    playSound(659.25, 0.1); // E5
    setTimeout(() => playSound(783.99, 0.1), 80); // G5
    setTimeout(() => playSound(1046.50, 0.15), 160); // C6
  };

  const generateDigits = (playSound = true) => {
    if (playSound) playClickSound();
    const newDigits = Array.from({ length: 4 }, () => Math.floor(Math.random() * 9) + 1);
    setDigits(newDigits);
    setExpression('');
    setResult(null);
    setMessage('');
    setShowConfetti(false);
    setHintLevel(0);
    setValidationError('');
    // Focus input after generating new digits
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  useEffect(() => {
    generateDigits(false); // Don't play sound on initial load
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        checkExpression();
      } else if (e.key === 'r' || e.key === 'R') {
        generateDigits();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [expression, digits]);

  const validateExpression = (expr: string, realTime = false): { valid: boolean; error?: string } => {
    // Remove spaces
    const cleaned = expr.replace(/\s/g, '');
    
    // For real-time validation, allow empty or partial expressions
    if (realTime && !cleaned) {
      return { valid: true };
    }

    // Check for valid characters
    if (!/^[\d+\-*/()]+$/.test(cleaned)) {
      return { valid: false, error: 'Only digits, +, -, *, /, and () allowed' };
    }

    // Extract digits from expression
    const usedDigits = cleaned.match(/\d/g)?.map(Number) || [];
    
    // For real-time, allow partial input
    if (!realTime) {
      // Check if exactly 4 digits used
      if (usedDigits.length !== 4) {
        return { valid: false, error: 'Must use exactly 4 digits' };
      }
    }

    // Check for multi-digit numbers
    if (/\d{2,}/.test(cleaned)) {
      return { valid: false, error: 'Cannot combine digits (e.g., 12)' };
    }

    // Check if correct digits used (only for complete expressions)
    if (!realTime && usedDigits.length === 4) {
      const sortedUsed = [...usedDigits].sort();
      const sortedGiven = [...digits].sort();
      if (JSON.stringify(sortedUsed) !== JSON.stringify(sortedGiven)) {
        return { valid: false, error: 'Must use each given digit exactly once' };
      }
    }

    return { valid: true };
  };

  // Real-time validation as user types
  useEffect(() => {
    if (!expression) {
      setValidationError('');
      return;
    }

    const validation = validateExpression(expression, true);
    if (!validation.valid) {
      setValidationError(validation.error || '');
    } else {
      setValidationError('');
    }
  }, [expression, digits]);

  const checkExpression = () => {
    if (!expression.trim()) {
      setMessage('Enter an expression first!');
      playErrorSound();
      return;
    }

    const validation = validateExpression(expression, false);
    if (!validation.valid) {
      setMessage(validation.error || 'Invalid expression');
      setResult(null);
      playErrorSound();
      return;
    }

    try {
      // Evaluate the expression safely
      const evalResult = Function(`"use strict"; return (${expression})`)();
      setResult(evalResult);
      setAttempts(prev => prev + 1);

      if (Math.abs(evalResult - 24) < 0.001) {
        setMessage('🎉 Correct! You got 24!');
        setWins(prev => prev + 1);
        const newStreak = streak + 1;
        setStreak(newStreak);
        if (newStreak > bestStreak) {
          setBestStreak(newStreak);
        }
        
        // Play appropriate sound
        if (newStreak > 1) {
          playStreakSound();
        } else {
          playSuccessSound();
        }
        
        setShowConfetti(true);
        setHintLevel(0); // Reset hint level on success
        setTimeout(() => setShowConfetti(false), 3000);
      } else {
        setMessage(`Not quite! Your expression equals ${evalResult.toFixed(2)}`);
        setStreak(0);
        playErrorSound();
      }
    } catch (error) {
      setMessage('Invalid expression syntax');
      setResult(null);
      playErrorSound();
    }
  };

  const getHint = () => {
    playClickSound();
    
    // Progressive hints based on hint level
    const progressiveHints = [
      // Level 0: General strategy
      [
        'Try using parentheses to change order of operations',
        'Look for factors of 24: 1, 2, 3, 4, 6, 8, 12, 24',
        'Consider what operations might get you close to 24',
        'Try combining pairs of numbers first',
      ],
      // Level 1: More specific
      [
        `Try making ${digits.includes(6) ? '6 × 4' : digits.includes(8) ? '8 × 3' : '12 × 2'} = 24`,
        'Can you create 24 by adding/subtracting first, then multiplying?',
        'Division can create fractions that multiply to whole numbers',
        `Look at ${digits[0]} and ${digits[1]} - what operations give useful results?`,
      ],
      // Level 2: Very specific
      [
        `Try: (${digits[0]} ${['+', '-', '*', '/'][Math.floor(Math.random() * 4)]} ${digits[1]}) with the other two digits`,
        'Think about making intermediate results like 4, 6, or 8',
        `Can you make 24 using ${digits[0]} and ${digits[1]} together?`,
        'Try different parenthesis groupings: ((a○b)○c)○d vs (a○b)○(c○d)',
      ],
    ];

    const currentHints = progressiveHints[Math.min(hintLevel, 2)];
    const hint = currentHints[Math.floor(Math.random() * currentHints.length)];
    
    setMessage(`💡 Hint ${hintLevel + 1}: ${hint}`);
    setHintLevel(prev => Math.min(prev + 1, 2));
  };

  const insertChar = (char: string) => {
    playClickSound();
    setExpression(prev => prev + char);
    inputRef.current?.focus();
  };

  const deleteChar = () => {
    playClickSound();
    setExpression(prev => prev.slice(0, -1));
    inputRef.current?.focus();
  };

  const clearExpression = () => {
    playClickSound();
    setExpression('');
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Confetti Effect */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: -20,
                  rotate: 0,
                  opacity: 1,
                }}
                animate={{
                  y: window.innerHeight + 20,
                  rotate: Math.random() * 720 - 360,
                  opacity: 0,
                }}
                transition={{
                  duration: Math.random() * 2 + 2,
                  ease: 'linear',
                }}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  backgroundColor: ['#06b6d4', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'][
                    Math.floor(Math.random() * 5)
                  ],
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Game Stats */}
      <div className="glass rounded-xl p-4 border border-cyan-500/20">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold text-cyan-400">Game Stats</h3>
          <motion.button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              playClickSound();
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-all"
            aria-label={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
          >
            {soundEnabled ? <Volume2 size={18} className="text-cyan-400" /> : <VolumeX size={18} className="text-slate-500" />}
          </motion.button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <motion.div 
            className="text-center"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <Trophy size={16} className="text-cyan-400" />
              <div className="text-2xl font-bold text-cyan-400">{wins}</div>
            </div>
            <div className="text-xs text-slate-400">Wins</div>
          </motion.div>
          <motion.div 
            className="text-center"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <Target size={16} className="text-slate-300" />
              <div className="text-2xl font-bold text-slate-300">{attempts}</div>
            </div>
            <div className="text-xs text-slate-400">Attempts</div>
          </motion.div>
          <motion.div 
            className="text-center"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingUp size={16} className="text-purple-400" />
              <div className="text-2xl font-bold text-purple-400">
                {attempts > 0 ? ((wins / attempts) * 100).toFixed(0) : 0}%
              </div>
            </div>
            <div className="text-xs text-slate-400">Success</div>
          </motion.div>
          <motion.div 
            className="text-center"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <Sparkles size={16} className="text-yellow-400" />
              <div className="text-2xl font-bold text-yellow-400">{streak}</div>
            </div>
            <div className="text-xs text-slate-400">Streak</div>
          </motion.div>
          <motion.div 
            className="text-center"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <Trophy size={16} className="text-green-400" />
              <div className="text-2xl font-bold text-green-400">{bestStreak}</div>
            </div>
            <div className="text-xs text-slate-400">Best</div>
          </motion.div>
        </div>
      </div>

      {/* Digits Display */}
      <div className="glass rounded-xl p-8 border border-cyan-500/20">
        <h3 className="text-xl font-semibold text-center mb-6 text-cyan-400">
          Make 24 using these digits:
        </h3>
        <div className="flex justify-center gap-4 mb-6">
          <AnimatePresence mode="wait">
            {digits.map((digit, idx) => (
              <motion.div
                key={`${digit}-${idx}`}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                className="w-20 h-20 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 
                         border-2 border-cyan-500/50 flex items-center justify-center"
              >
                <span className="text-4xl font-bold text-cyan-400">{digit}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Input */}
        <div className="space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="Enter expression (e.g., (8+3)*(9-6))"
              className={`w-full px-4 py-3 rounded-lg bg-slate-800/50 border 
                       text-white placeholder-slate-500 focus:outline-none 
                       transition-all duration-200 ${
                         validationError 
                           ? 'border-red-500/50 focus:border-red-500' 
                           : 'border-slate-600 focus:border-cyan-500'
                       }`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  checkExpression();
                }
              }}
              aria-label="Mathematical expression input"
              aria-invalid={!!validationError}
              aria-describedby={validationError ? 'validation-error' : undefined}
            />
            <AnimatePresence>
              {validationError && (
                <motion.div
                  id="validation-error"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute left-0 right-0 -bottom-6 text-xs text-red-400"
                  role="alert"
                >
                  {validationError}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Number Pad */}
          <div className="glass rounded-xl p-4 border border-slate-600/50 mt-6">
            <h4 className="text-sm font-semibold text-cyan-400 mb-3">Quick Input</h4>
            
            {/* Digits */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {digits.map((digit, idx) => (
                <motion.button
                  key={`digit-btn-${idx}`}
                  onClick={() => insertChar(digit.toString())}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="h-12 rounded-lg bg-gradient-to-br from-cyan-500/30 to-blue-500/30 
                           border border-cyan-500/50 hover:border-cyan-400 transition-all
                           font-bold text-xl text-cyan-400 shadow-lg hover:shadow-cyan-500/30"
                  aria-label={`Insert digit ${digit}`}
                >
                  {digit}
                </motion.button>
              ))}
            </div>

            {/* Operators */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {['+', '-', '*', '/'].map((op) => (
                <motion.button
                  key={`op-${op}`}
                  onClick={() => insertChar(op)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="h-12 rounded-lg bg-purple-600/30 border border-purple-500/50 
                           hover:border-purple-400 transition-all font-bold text-xl text-purple-300
                           shadow-lg hover:shadow-purple-500/30"
                  aria-label={`Insert ${op === '+' ? 'plus' : op === '-' ? 'minus' : op === '*' ? 'multiply' : 'divide'}`}
                >
                  {op}
                </motion.button>
              ))}
            </div>

            {/* Parentheses and Controls */}
            <div className="grid grid-cols-4 gap-2">
              <motion.button
                onClick={() => insertChar('(')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="h-12 rounded-lg bg-slate-700/50 border border-slate-600 
                         hover:border-slate-500 transition-all font-bold text-xl text-slate-300"
                aria-label="Insert left parenthesis"
              >
                (
              </motion.button>
              <motion.button
                onClick={() => insertChar(')')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="h-12 rounded-lg bg-slate-700/50 border border-slate-600 
                         hover:border-slate-500 transition-all font-bold text-xl text-slate-300"
                aria-label="Insert right parenthesis"
              >
                )
              </motion.button>
              <motion.button
                onClick={deleteChar}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="h-12 rounded-lg bg-orange-600/30 border border-orange-500/50 
                         hover:border-orange-400 transition-all flex items-center justify-center
                         shadow-lg hover:shadow-orange-500/30"
                aria-label="Delete last character"
              >
                <Delete size={20} className="text-orange-300" />
              </motion.button>
              <motion.button
                onClick={clearExpression}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="h-12 rounded-lg bg-red-600/30 border border-red-500/50 
                         hover:border-red-400 transition-all font-semibold text-sm text-red-300
                         shadow-lg hover:shadow-red-500/30"
                aria-label="Clear expression"
              >
                Clear
              </motion.button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <motion.button
              onClick={() => {
                playClickSound();
                checkExpression();
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 
                       hover:from-cyan-600 hover:to-blue-600 transition-all flex items-center 
                       justify-center gap-2 font-semibold shadow-lg hover:shadow-cyan-500/50"
              aria-label="Check expression"
            >
              <Play size={20} />
              <span className="hidden sm:inline">Check</span>
              <span className="text-xs opacity-70">(Enter)</span>
            </motion.button>
            <motion.button
              onClick={() => generateDigits()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 transition-all 
                       flex items-center gap-2 shadow-lg"
              aria-label="Generate new digits"
            >
              <RotateCcw size={20} />
              <span className="hidden sm:inline">New</span>
              <span className="text-xs opacity-70">(R)</span>
            </motion.button>
            <motion.button
              onClick={getHint}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 shadow-lg ${
                hintLevel === 0 
                  ? 'bg-purple-600 hover:bg-purple-700' 
                  : hintLevel === 1 
                  ? 'bg-yellow-600 hover:bg-yellow-700' 
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
              aria-label={`Get hint (level ${hintLevel + 1})`}
            >
              <Lightbulb size={20} />
              <span className="hidden sm:inline">Hint</span>
              {hintLevel > 0 && (
                <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">{hintLevel}</span>
              )}
            </motion.button>
          </div>
        </div>

        {/* Result Display */}
        <AnimatePresence mode="wait">
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`mt-4 p-4 rounded-lg ${
                result === 24
                  ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                  : result !== null
                  ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                  : 'bg-blue-500/20 border border-blue-500/50 text-blue-400'
              }`}
              role="alert"
              aria-live="polite"
            >
              <p className="text-center font-semibold">{message}</p>
              {result !== null && result !== 24 && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-center text-sm mt-2 opacity-80"
                >
                  Result: {result.toFixed(2)} (Target: 24)
                  {Math.abs(result - 24) <= 3 && ' - So close!'}
                </motion.p>
              )}
              {result === 24 && streak > 1 && (
                <motion.p
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                  className="text-center text-sm mt-2 font-bold"
                >
                  🔥 {streak} in a row!
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Reference */}
      <div className="glass rounded-xl p-4 border border-slate-600/50">
        <h4 className="text-sm font-semibold text-cyan-400 mb-3">Quick Reference</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700/50">
            <div className="font-mono text-cyan-400 mb-1">+</div>
            <div className="text-slate-400">Addition</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700/50">
            <div className="font-mono text-cyan-400 mb-1">-</div>
            <div className="text-slate-400">Subtraction</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700/50">
            <div className="font-mono text-cyan-400 mb-1">*</div>
            <div className="text-slate-400">Multiplication</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700/50">
            <div className="font-mono text-cyan-400 mb-1">/</div>
            <div className="text-slate-400">Division</div>
          </div>
        </div>
        <div className="mt-3 text-xs text-slate-400">
          <span className="text-cyan-400 font-semibold">Tip:</span> Use parentheses ( ) to control order of operations
        </div>
      </div>

      {/* Rules */}
      <details className="glass rounded-xl border border-slate-600/50">
        <summary className="p-4 cursor-pointer font-semibold text-cyan-400 hover:text-cyan-300">
          Game Rules & Tips
        </summary>
        <div className="p-4 pt-0 space-y-3 text-slate-300">
          <div>
            <h4 className="font-semibold text-white mb-2">Rules:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Use all four digits exactly once</li>
              <li>Only operators allowed: + - * / ( )</li>
              <li>Cannot combine digits (e.g., 1 and 2 cannot make 12)</li>
              <li>Goal is to make the expression equal 24</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">Examples:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm font-mono">
              <li>Digits [3, 8, 3, 8]: (8/(3-(8/3))) = 24</li>
              <li>Digits [1, 2, 3, 4]: (1+2+3)*4 = 24</li>
              <li>Digits [6, 6, 6, 6]: (6+6)*(6/6) = 24</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">Keyboard Shortcuts:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><kbd className="px-2 py-1 bg-slate-700 rounded">Enter</kbd> - Check expression</li>
              <li><kbd className="px-2 py-1 bg-slate-700 rounded">R</kbd> - New digits</li>
            </ul>
          </div>
        </div>
      </details>

      {/* Algorithm Info */}
      <details className="glass rounded-xl border border-slate-600/50">
        <summary className="p-4 cursor-pointer font-semibold text-cyan-400 hover:text-cyan-300">
          About the 24 Game
        </summary>
        <div className="p-4 pt-0 space-y-3 text-slate-300 text-sm">
          <p>
            The 24 Game is a mathematical puzzle that tests mental arithmetic and problem-solving skills.
            Players must use four given digits and basic arithmetic operations to create an expression
            that evaluates to exactly 24.
          </p>
          <p>
            <strong className="text-white">Complexity:</strong> The game involves combinatorial search
            through possible expressions. For 4 digits, there are multiple ways to arrange them with
            different operators and parentheses, making it a challenging mental exercise.
          </p>
          <p>
            <strong className="text-white">Strategy Tips:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Look for factors of 24 (1, 2, 3, 4, 6, 8, 12, 24)</li>
            <li>Try to make intermediate results that are factors of 24</li>
            <li>Consider using division to create fractions that multiply to 24</li>
            <li>Parentheses can dramatically change the result</li>
          </ul>
        </div>
      </details>
    </div>
  );
}
