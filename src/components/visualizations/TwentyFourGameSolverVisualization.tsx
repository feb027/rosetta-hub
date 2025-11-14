import { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Search, Zap, Clock, CheckCircle2, XCircle, Volume2, VolumeX, BarChart3, PieChart, TrendingUp, Lightbulb, StopCircle, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Solution {
  expression: string;
  tree: string;
  evaluation: string;
  operatorCount: number;
  depth: number;
  operators: string[];
}

type SortOption = 'default' | 'simplest' | 'complex' | 'alphabetical';
type FilterOption = 'all' | 'addition' | 'multiplication' | 'division' | 'mixed';
type AlgorithmType = 'brute-force' | 'smart-pruning';

interface Statistics {
  operatorDistribution: Record<string, number>;
  patternDistribution: Record<string, number>;
  digitUsage: Record<number, number>;
  solutionsPerSecond: number;
}

// Safe expression evaluator without eval()
function evaluateExpression(expr: string): number | null {
  try {
    // Parse and evaluate the expression safely
    const tokens = expr.match(/(\d+\.?\d*|[+\-*/()])/g);
    if (!tokens) return null;

    const values: number[] = [];
    const ops: string[] = [];

    const precedence: Record<string, number> = {
      '+': 1,
      '-': 1,
      '*': 2,
      '/': 2,
    };

    const applyOp = (op: string, b: number, a: number): number => {
      switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return b !== 0 ? a / b : NaN;
        default: return NaN;
      }
    };

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token === ' ') continue;

      if (!isNaN(Number(token))) {
        values.push(Number(token));
      } else if (token === '(') {
        ops.push(token);
      } else if (token === ')') {
        while (ops.length > 0 && ops[ops.length - 1] !== '(') {
          const op = ops.pop()!;
          const b = values.pop()!;
          const a = values.pop()!;
          values.push(applyOp(op, b, a));
        }
        ops.pop(); // Remove '('
      } else if (['+', '-', '*', '/'].includes(token)) {
        while (
          ops.length > 0 &&
          ops[ops.length - 1] !== '(' &&
          precedence[ops[ops.length - 1]] >= precedence[token]
        ) {
          const op = ops.pop()!;
          const b = values.pop()!;
          const a = values.pop()!;
          values.push(applyOp(op, b, a));
        }
        ops.push(token);
      }
    }

    while (ops.length > 0) {
      const op = ops.pop()!;
      const b = values.pop()!;
      const a = values.pop()!;
      values.push(applyOp(op, b, a));
    }

    return values.length === 1 ? values[0] : null;
  } catch {
    return null;
  }
}

export default function TwentyFourGameSolverVisualization() {
  const [digits, setDigits] = useState<number[]>([]);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchTime, setSearchTime] = useState(0);
  const [totalExpressions, setTotalExpressions] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedSolution, setSelectedSolution] = useState<number | null>(null);
  
  // New features
  const [targetNumber, setTargetNumber] = useState(24);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [currentExpression, setCurrentExpression] = useState('');
  const [currentPattern, setCurrentPattern] = useState('');
  const [showAnimation, setShowAnimation] = useState(true);
  
  // Advanced features
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('brute-force');
  const [showStatistics, setShowStatistics] = useState(false);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [incrementalResults, setIncrementalResults] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const audioContextRef = useState<AudioContext | null>(null)[0];

  useEffect(() => {
    generateDigits(false);
  }, []);

  const playSound = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!soundEnabled || !audioContextRef) return;
    
    const ctx = audioContextRef;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  };

  const playClickSound = () => playSound(800, 0.05, 'square');
  const playSuccessSound = () => {
    playSound(523.25, 0.1);
    setTimeout(() => playSound(659.25, 0.1), 100);
    setTimeout(() => playSound(783.99, 0.2), 200);
  };

  const generateDigits = (playAudio = true) => {
    if (playAudio) playClickSound();
    const newDigits = Array.from({ length: 4 }, () => Math.floor(Math.random() * 9) + 1);
    setDigits(newDigits);
    setSolutions([]);
    setSearchProgress(0);
    setTotalExpressions(0);
    setSelectedSolution(null);
    setCurrentExpression('');
    setCurrentPattern('');
  };

  // Calculate expression depth (parentheses nesting)
  const calculateDepth = (expr: string): number => {
    let maxDepth = 0;
    let currentDepth = 0;
    for (const char of expr) {
      if (char === '(') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === ')') {
        currentDepth--;
      }
    }
    return maxDepth;
  };

  // Extract operators from expression
  const extractOperators = (expr: string): string[] => {
    return expr.match(/[+\-*/]/g) || [];
  };

  // Filter solutions
  const getFilteredSolutions = () => {
    let filtered = [...solutions];

    if (filterBy !== 'all') {
      filtered = filtered.filter(sol => {
        const ops = sol.operators;
        switch (filterBy) {
          case 'addition':
            return ops.every(op => op === '+' || op === '-');
          case 'multiplication':
            return ops.every(op => op === '*' || op === '/');
          case 'division':
            return ops.includes('/');
          case 'mixed':
            return new Set(ops).size >= 3;
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  // Sort solutions
  const getSortedSolutions = () => {
    const filtered = getFilteredSolutions();

    switch (sortBy) {
      case 'simplest':
        return [...filtered].sort((a, b) => a.depth - b.depth || a.operatorCount - b.operatorCount);
      case 'complex':
        return [...filtered].sort((a, b) => b.depth - a.depth || b.operatorCount - a.operatorCount);
      case 'alphabetical':
        return [...filtered].sort((a, b) => a.expression.localeCompare(b.expression));
      default:
        return filtered;
    }
  };

  const displayedSolutions = getSortedSolutions();

  // Calculate statistics
  const calculateStatistics = (sols: Solution[], timeMs: number): Statistics => {
    const operatorDist: Record<string, number> = { '+': 0, '-': 0, '*': 0, '/': 0 };
    const patternDist: Record<string, number> = {};
    const digitUsage: Record<number, number> = {};

    sols.forEach(sol => {
      // Operator distribution
      sol.operators.forEach(op => {
        operatorDist[op] = (operatorDist[op] || 0) + 1;
      });

      // Pattern distribution
      patternDist[sol.tree] = (patternDist[sol.tree] || 0) + 1;

      // Digit usage
      const digitsInExpr = sol.expression.match(/\d/g) || [];
      digitsInExpr.forEach(d => {
        const digit = parseInt(d);
        digitUsage[digit] = (digitUsage[digit] || 0) + 1;
      });
    });

    return {
      operatorDistribution: operatorDist,
      patternDistribution: patternDist,
      digitUsage,
      solutionsPerSecond: sols.length / (timeMs / 1000),
    };
  };

  // Smart pruning algorithm helper
  const canReachTarget = (nums: number[], target: number): boolean => {
    // Quick heuristic: check if target is reachable with simple operations
    const min = Math.min(...nums);
    const sum = nums.reduce((a, b) => a + b, 0);
    const product = nums.reduce((a, b) => a * b, 1);

    // If target is way outside possible range, prune
    if (target > product * 2) return false;
    if (target < min - sum) return false;

    return true;
  };

  // Cancel search
  const cancelSearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsSearching(false);
      playClickSound();
    }
  };

  // Solver algorithm
  const solveGame = async () => {
    setIsSearching(true);
    setSearchProgress(0);
    if (!incrementalResults) {
      setSolutions([]);
    }
    setSelectedSolution(null);
    setCurrentExpression('');
    setCurrentPattern('');
    setStatistics(null);
    
    // Create abort controller
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;
    
    const startTime = performance.now();

    const ops = ['+', '-', '*', '/'];
    const patterns = [
      { template: '((a○b)○c)○d', format: (a: number, b: number, c: number, d: number, o1: string, o2: string, o3: string) => 
        `((${a}${o1}${b})${o2}${c})${o3}${d}` },
      { template: '(a○(b○c))○d', format: (a: number, b: number, c: number, d: number, o1: string, o2: string, o3: string) => 
        `(${a}${o1}(${b}${o2}${c}))${o3}${d}` },
      { template: '(a○b)○(c○d)', format: (a: number, b: number, c: number, d: number, o1: string, o2: string, o3: string) => 
        `(${a}${o1}${b})${o2}(${c}${o3}${d})` },
      { template: 'a○((b○c)○d)', format: (a: number, b: number, c: number, d: number, o1: string, o2: string, o3: string) => 
        `${a}${o1}((${b}${o2}${c})${o3}${d})` },
      { template: 'a○(b○(c○d))', format: (a: number, b: number, c: number, d: number, o1: string, o2: string, o3: string) => 
        `${a}${o1}(${b}${o2}(${c}${o3}${d}))` },
    ];

    const foundSolutions: Solution[] = [];
    const seenExpressions = new Set<string>();
    let expressionsChecked = 0;
    const totalPermutations = 24; // 4!
    const totalOperators = 64; // 4^3
    const totalPatterns = 5;
    const totalCombinations = totalPermutations * totalOperators * totalPatterns;

    // Generate all permutations
    const permutations: number[][] = [];
    const permute = (arr: number[], start = 0) => {
      if (start === arr.length - 1) {
        permutations.push([...arr]);
        return;
      }
      for (let i = start; i < arr.length; i++) {
        [arr[start], arr[i]] = [arr[i], arr[start]];
        permute(arr, start + 1);
        [arr[start], arr[i]] = [arr[i], arr[start]];
      }
    };
    permute([...digits]);

    // Search through all combinations
    for (const perm of permutations) {
      // Check for cancellation
      if (signal.aborted) {
        setIsSearching(false);
        return;
      }

      // Smart pruning check
      if (algorithm === 'smart-pruning' && !canReachTarget(perm, targetNumber)) {
        expressionsChecked += ops.length * ops.length * ops.length * patterns.length;
        continue;
      }

      for (const op1 of ops) {
        for (const op2 of ops) {
          for (const op3 of ops) {
            for (const pattern of patterns) {
              // Check for cancellation
              if (signal.aborted) {
                setIsSearching(false);
                return;
              }

              expressionsChecked++;
              
              const expr = pattern.format(perm[0], perm[1], perm[2], perm[3], op1, op2, op3);
              
              // Update progress and animation periodically
              if (expressionsChecked % 100 === 0) {
                setSearchProgress((expressionsChecked / totalCombinations) * 100);
                setTotalExpressions(expressionsChecked);
                if (showAnimation) {
                  setCurrentExpression(expr);
                  setCurrentPattern(pattern.template);
                }
                await new Promise(resolve => setTimeout(resolve, 0)); // Allow UI update
              }
              
              // Normalize expression for duplicate detection
              const normalized = expr.replace(/\s/g, '');
              if (seenExpressions.has(normalized)) continue;

              const result = evaluateExpression(expr);
              if (result !== null && !isNaN(result) && Math.abs(result - targetNumber) < 0.001) {
                seenExpressions.add(normalized);
                const operators = extractOperators(expr);
                const newSolution: Solution = {
                  expression: expr,
                  tree: pattern.template,
                  evaluation: `${expr} = ${targetNumber}`,
                  operatorCount: operators.length,
                  depth: calculateDepth(expr),
                  operators: operators,
                };
                foundSolutions.push(newSolution);

                // Incremental results
                if (incrementalResults) {
                  setSolutions(prev => [...prev, newSolution]);
                }
              }
            }
          }
        }
      }
    }

    setSearchProgress(100);
    setTotalExpressions(expressionsChecked);
    const elapsedTime = performance.now() - startTime;
    setSearchTime(elapsedTime);
    
    if (!incrementalResults) {
      setSolutions(foundSolutions);
    }
    
    // Calculate statistics
    if (foundSolutions.length > 0) {
      const stats = calculateStatistics(foundSolutions, elapsedTime);
      setStatistics(stats);
      playSuccessSound();
    }
    
    setIsSearching(false);
    abortControllerRef.current = null;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Controls */}
      <div className="glass rounded-xl p-4 border border-slate-600/50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold text-cyan-400">Solver Controls</h3>
          <div className="flex gap-2">
            <motion.button
              onClick={() => {
                setShowAnimation(!showAnimation);
                playClickSound();
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`p-2 rounded-lg transition-all ${
                showAnimation 
                  ? 'bg-cyan-500/20 text-cyan-400' 
                  : 'bg-slate-700/50 text-slate-500'
              }`}
              aria-label={showAnimation ? 'Disable animation' : 'Enable animation'}
              title={showAnimation ? 'Disable animation' : 'Enable animation'}
            >
              <Zap size={18} />
            </motion.button>
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
        </div>

        {/* Target Number Input */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-400 mb-2">
            Target Number
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={targetNumber}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val) && val > 0 && val <= 100) {
                  setTargetNumber(val);
                  playClickSound();
                }
              }}
              disabled={isSearching}
              className="flex-1 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-600 
                       text-white focus:outline-none focus:border-cyan-500 transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed"
              min="1"
              max="100"
            />
            <div className="flex gap-1">
              {[24, 36, 48, 100].map(num => (
                <motion.button
                  key={num}
                  onClick={() => {
                    setTargetNumber(num);
                    playClickSound();
                  }}
                  disabled={isSearching}
                  whileHover={{ scale: isSearching ? 1 : 1.05 }}
                  whileTap={{ scale: isSearching ? 1 : 0.95 }}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    targetNumber === num
                      ? 'bg-cyan-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {num}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Digits Display */}
        <div className="mb-4">
          <div className="flex justify-center gap-3 mb-4">
            <AnimatePresence mode="wait">
              {digits.map((digit, idx) => (
                <motion.div
                  key={`${digit}-${idx}`}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                  className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 
                           border-2 border-cyan-500/50 flex items-center justify-center"
                >
                  <span className="text-3xl font-bold text-cyan-400">{digit}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Algorithm Selection */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-400 mb-2">
            <Cpu size={14} className="inline mr-1" />
            Algorithm
          </label>
          <div className="flex gap-2">
            <motion.button
              onClick={() => {
                setAlgorithm('brute-force');
                playClickSound();
              }}
              disabled={isSearching}
              whileHover={{ scale: isSearching ? 1 : 1.02 }}
              whileTap={{ scale: isSearching ? 1 : 0.95 }}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                algorithm === 'brute-force'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Brute Force
            </motion.button>
            <motion.button
              onClick={() => {
                setAlgorithm('smart-pruning');
                playClickSound();
              }}
              disabled={isSearching}
              whileHover={{ scale: isSearching ? 1 : 1.02 }}
              whileTap={{ scale: isSearching ? 1 : 0.95 }}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                algorithm === 'smart-pruning'
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Smart Pruning
            </motion.button>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {algorithm === 'brute-force' ? 'Tests all 7,680 combinations' : 'Skips impossible branches (faster)'}
          </div>
        </div>

        {/* Options */}
        <div className="mb-4 flex items-center gap-4 text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={incrementalResults}
              onChange={(e) => {
                setIncrementalResults(e.target.checked);
                playClickSound();
              }}
              disabled={isSearching}
              className="rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
            />
            <span className="text-slate-300">Show results as found</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!isSearching ? (
            <>
              <motion.button
                onClick={solveGame}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-6 py-3 rounded-lg transition-all flex items-center 
                         justify-center gap-2 font-semibold shadow-lg bg-gradient-to-r 
                         from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 
                         hover:shadow-cyan-500/50"
                aria-label="Solve"
              >
                <Play size={20} />
                <span>Solve</span>
              </motion.button>
              <motion.button
                onClick={() => generateDigits()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 rounded-lg transition-all flex items-center gap-2 shadow-lg 
                         bg-slate-700 hover:bg-slate-600"
                aria-label="Generate new digits"
              >
                <RotateCcw size={20} />
                <span className="hidden sm:inline">New</span>
              </motion.button>
            </>
          ) : (
            <motion.button
              onClick={cancelSearch}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-6 py-3 rounded-lg transition-all flex items-center 
                       justify-center gap-2 font-semibold shadow-lg bg-gradient-to-r 
                       from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
              aria-label="Cancel search"
            >
              <StopCircle size={20} />
              <span>Cancel Search</span>
            </motion.button>
          )}
        </div>

        {/* Progress Bar */}
        <AnimatePresence>
          {isSearching && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>Progress: {searchProgress.toFixed(1)}%</span>
                <span>{totalExpressions.toLocaleString()} expressions checked</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${searchProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Live Algorithm Animation */}
      <AnimatePresence>
        {isSearching && showAnimation && currentExpression && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-xl p-4 border border-purple-500/20"
          >
            <div className="flex items-center gap-3 mb-3">
              <Search size={20} className="text-purple-400 animate-pulse" />
              <h3 className="text-sm font-semibold text-purple-400">Testing Expression</h3>
            </div>
            <div className="space-y-2">
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <div className="text-xs text-slate-400 mb-1">Current Expression:</div>
                <code className="text-sm font-mono text-cyan-300">{currentExpression}</code>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <div className="text-xs text-slate-400 mb-1">Pattern:</div>
                <code className="text-sm font-mono text-purple-300">{currentPattern}</code>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Summary */}
      {solutions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-4 border border-cyan-500/20"
        >
          <div className="text-center mb-3">
            <div className="text-sm text-slate-400">
              Found solutions for target: <span className="text-cyan-400 font-bold text-lg">{targetNumber}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <CheckCircle2 size={20} className="text-green-400" />
                <div className="text-3xl font-bold text-green-400">{solutions.length}</div>
              </div>
              <div className="text-xs text-slate-400">Solutions Found</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <Zap size={20} className="text-yellow-400" />
                <div className="text-3xl font-bold text-yellow-400">{searchTime.toFixed(0)}</div>
              </div>
              <div className="text-xs text-slate-400">Milliseconds</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock size={20} className="text-blue-400" />
                <div className="text-3xl font-bold text-blue-400">{totalExpressions.toLocaleString()}</div>
              </div>
              <div className="text-xs text-slate-400">Expressions Tested</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* No Solutions Message */}
      {!isSearching && solutions.length === 0 && digits.length > 0 && searchProgress === 100 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-6 border border-red-500/20 text-center"
        >
          <XCircle size={48} className="text-red-400 mx-auto mb-3" />
          <h3 className="text-xl font-semibold text-red-400 mb-2">No Solutions Found</h3>
          <p className="text-slate-400">
            These digits cannot be combined to make <span className="text-white font-bold">{targetNumber}</span> using +, -, *, and / operators.
          </p>
          <p className="text-slate-500 text-sm mt-2">
            Try a different target number or generate new digits.
          </p>
        </motion.div>
      )}

      {/* Statistics Dashboard */}
      {statistics && solutions.length > 0 && (
        <div className="glass rounded-xl p-4 border border-slate-600/50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-cyan-400">
              <BarChart3 size={16} className="inline mr-2" />
              Statistics Dashboard
            </h3>
            <motion.button
              onClick={() => {
                setShowStatistics(!showStatistics);
                playClickSound();
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-xs px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 transition-all"
            >
              {showStatistics ? 'Hide' : 'Show'}
            </motion.button>
          </div>

          <AnimatePresence>
            {showStatistics && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                {/* Operator Distribution */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-2">
                    <PieChart size={14} />
                    Operator Distribution
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(statistics.operatorDistribution).map(([op, count]) => {
                      const total = Object.values(statistics.operatorDistribution).reduce((a, b) => a + b, 0);
                      const percentage = ((count / total) * 100).toFixed(1);
                      const colors: Record<string, string> = {
                        '+': 'bg-green-500',
                        '-': 'bg-yellow-500',
                        '*': 'bg-blue-500',
                        '/': 'bg-purple-500',
                      };
                      return (
                        <div key={op} className="bg-slate-800/50 rounded-lg p-2 border border-slate-700/50">
                          <div className="text-2xl font-bold text-center mb-1">{op}</div>
                          <div className="text-xs text-center text-slate-400">{count} uses</div>
                          <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.5, delay: 0.2 }}
                              className={`h-full ${colors[op]}`}
                            />
                          </div>
                          <div className="text-xs text-center text-slate-500 mt-1">{percentage}%</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pattern Distribution */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-2">
                    <BarChart3 size={14} />
                    Expression Patterns
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(statistics.patternDistribution)
                      .sort(([, a], [, b]) => b - a)
                      .map(([pattern, count]) => {
                        const maxCount = Math.max(...Object.values(statistics.patternDistribution));
                        const percentage = ((count / maxCount) * 100);
                        return (
                          <div key={pattern} className="bg-slate-800/50 rounded-lg p-2 border border-slate-700/50">
                            <div className="flex justify-between items-center mb-1">
                              <code className="text-xs text-purple-400">{pattern}</code>
                              <span className="text-xs text-slate-400">{count} solutions</span>
                            </div>
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 0.5 }}
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Digit Usage Heatmap */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-2">
                    <TrendingUp size={14} />
                    Digit Usage in Solutions
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    {digits.map((digit) => {
                      const usage = statistics.digitUsage[digit] || 0;
                      const maxUsage = Math.max(...Object.values(statistics.digitUsage));
                      const intensity = maxUsage > 0 ? (usage / maxUsage) : 0;
                      const bgColor = intensity > 0.7 ? 'bg-cyan-500' :
                                     intensity > 0.4 ? 'bg-blue-500' :
                                     intensity > 0.2 ? 'bg-purple-500' : 'bg-slate-700';
                      return (
                        <motion.div
                          key={digit}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.3 }}
                          className={`${bgColor} rounded-lg p-3 border border-slate-600/50 text-center`}
                        >
                          <div className="text-2xl font-bold">{digit}</div>
                          <div className="text-xs text-slate-200 mt-1">{usage} times</div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                  <h4 className="text-xs font-semibold text-slate-400 mb-2">Performance</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-300">Solutions per second:</span>
                    <span className="text-lg font-bold text-cyan-400">
                      {statistics.solutionsPerSecond.toFixed(2)}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Filter and Sort Controls */}
      {solutions.length > 0 && (
        <div className="glass rounded-xl p-4 border border-slate-600/50">
          <h3 className="text-sm font-semibold text-cyan-400 mb-3">Filter & Sort</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Sort By */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as SortOption);
                  playClickSound();
                }}
                className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-600 
                         text-white text-sm focus:outline-none focus:border-cyan-500 transition-all"
              >
                <option value="default">Default Order</option>
                <option value="simplest">Simplest First</option>
                <option value="complex">Most Complex First</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </div>

            {/* Filter By */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">
                Filter By Operators
              </label>
              <select
                value={filterBy}
                onChange={(e) => {
                  setFilterBy(e.target.value as FilterOption);
                  playClickSound();
                }}
                className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-600 
                         text-white text-sm focus:outline-none focus:border-cyan-500 transition-all"
              >
                <option value="all">All Solutions</option>
                <option value="addition">Addition/Subtraction Only</option>
                <option value="multiplication">Multiplication/Division Only</option>
                <option value="division">Contains Division</option>
                <option value="mixed">Mixed (3+ operator types)</option>
              </select>
            </div>
          </div>
          
          {/* Results Count */}
          <div className="mt-3 text-xs text-slate-400">
            Showing {displayedSolutions.length} of {solutions.length} solutions
          </div>
        </div>
      )}

      {/* Solutions List */}
      {displayedSolutions.length > 0 && (
        <div className="glass rounded-xl p-4 border border-slate-600/50">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">
            Solutions ({displayedSolutions.length})
          </h3>
          <div className="grid gap-2 max-h-96 overflow-y-auto pr-2">
            {displayedSolutions.map((solution, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(idx * 0.05, 1) }}
                onClick={() => {
                  setSelectedSolution(selectedSolution === idx ? null : idx);
                  playClickSound();
                }}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedSolution === idx
                    ? 'bg-cyan-500/20 border-cyan-500/50'
                    : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <code className="text-sm font-mono text-cyan-300 flex-1">{solution.expression}</code>
                  <div className="flex items-center gap-2">
                    {/* Complexity badges */}
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-xs font-semibold"
                          title="Parentheses depth">
                      D:{solution.depth}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-xs font-semibold"
                          title="Number of operators">
                      {solution.operatorCount}ops
                    </span>
                    <span className="text-xs text-slate-500">#{idx + 1}</span>
                  </div>
                </div>
                <AnimatePresence>
                  {selectedSolution === idx && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 pt-2 border-t border-slate-700"
                    >
                      <div className="text-xs text-slate-400 space-y-2">
                        <div>
                          <span className="text-slate-500">Tree pattern:</span>{' '}
                          <code className="text-purple-400">{solution.tree}</code>
                        </div>
                        <div>
                          <span className="text-slate-500">Evaluation:</span>{' '}
                          <code className="text-green-400">{solution.evaluation}</code>
                        </div>
                        <div>
                          <span className="text-slate-500">Operators used:</span>{' '}
                          <span className="text-yellow-400">{solution.operators.join(', ')}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Complexity:</span>{' '}
                          <span className="text-cyan-400">
                            {solution.depth === 0 ? 'Simple (no nesting)' :
                             solution.depth === 1 ? 'Moderate (1 level)' :
                             solution.depth === 2 ? 'Complex (2 levels)' :
                             'Very Complex (3+ levels)'}
                          </span>
                        </div>
                        
                        {/* Educational Insight */}
                        <div className="mt-3 pt-3 border-t border-slate-700">
                          <div className="flex items-start gap-2">
                            <Lightbulb size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                            <div className="text-xs text-slate-400">
                              <span className="text-yellow-400 font-semibold">Why this works:</span>{' '}
                              {solution.operators.includes('*') && solution.operators.includes('/') ? 
                                'Uses multiplication and division to create intermediate values that sum to the target.' :
                               solution.operators.includes('*') ?
                                'Multiplication creates larger values that can be adjusted with addition/subtraction.' :
                               solution.operators.includes('/') ?
                                'Division creates fractions or smaller values for precise control.' :
                                'Pure addition and subtraction - straightforward arithmetic path.'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Algorithm Info */}
      <details className="glass rounded-xl border border-slate-600/50">
        <summary className="p-4 cursor-pointer font-semibold text-cyan-400 hover:text-cyan-300">
          How the Solver Works
        </summary>
        <div className="p-4 pt-0 space-y-3 text-slate-300 text-sm">
          <p>
            The solver uses <strong className="text-white">exhaustive search</strong> to find all possible
            solutions. It systematically tries every combination of:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong className="text-cyan-400">Digit permutations:</strong> All 24 ways to arrange 4 digits (4!)</li>
            <li><strong className="text-cyan-400">Operator combinations:</strong> All 64 ways to choose 3 operators (4³)</li>
            <li><strong className="text-cyan-400">Expression patterns:</strong> 5 different tree structures for parentheses</li>
          </ul>
          <p>
            <strong className="text-white">Total combinations:</strong> 24 × 64 × 5 = 7,680 expressions tested
          </p>
          <p>
            <strong className="text-white">Complexity:</strong> O(n! × m^(n-1) × p) where n=digits, m=operators, p=patterns
          </p>
          
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 mt-3">
            <h4 className="font-semibold text-white mb-2">New Features:</h4>
            <ul className="space-y-1 text-xs">
              <li className="text-green-400">✓ Custom target numbers (1-100)</li>
              <li className="text-green-400">✓ Filter by operator types</li>
              <li className="text-green-400">✓ Sort by complexity or alphabetically</li>
              <li className="text-green-400">✓ Live algorithm animation</li>
              <li className="text-green-400">✓ Complexity metrics (depth, operator count)</li>
            </ul>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 mt-3">
            <h4 className="font-semibold text-white mb-2">Expression Patterns:</h4>
            <ul className="space-y-1 font-mono text-xs">
              <li className="text-purple-400">((a○b)○c)○d</li>
              <li className="text-purple-400">(a○(b○c))○d</li>
              <li className="text-purple-400">(a○b)○(c○d)</li>
              <li className="text-purple-400">a○((b○c)○d)</li>
              <li className="text-purple-400">a○(b○(c○d))</li>
            </ul>
          </div>
        </div>
      </details>
    </div>
  );
}
