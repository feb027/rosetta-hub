import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Dna, Zap, CheckCircle2, XCircle, Sparkles, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Logic ---

// Curated deranged anagram pairs (longest first)
const DERANGED_PAIRS: [string, string][] = [
  ['excitation', 'intoxicate'],
  ['percussion', 'supersonic'],
  ['coordinate', 'decoration'],
  ['introduces', 'reductions'],
  ['streaming', 'mastering'],
  ['admirer', 'married'],
  ['observe', 'verbose'],
  ['allergy', 'largely'],
  ['players', 'replays'],
  ['present', 'serpent'],
  ['danger', 'garden'],
  ['listen', 'silent'],
  ['rescue', 'secure'],
  ['master', 'stream'],
  ['night', 'thing'],
  ['earth', 'heart'],
  ['state', 'taste'],
  ['below', 'elbow'],
  ['post', 'stop'],
  ['evil', 'vile'],
];

// Non-deranged anagrams (same chars but some in same position)
const NON_DERANGED: [string, string][] = [
  ['angel', 'angle'], // 'a' at position 0
  ['steal', 'tales'], // 'e' at position 2
  ['notes', 'stone'], // 'o' at position 2
  ['spare', 'pears'], // 'a' at position 2
];

interface CharComparison {
  char1: string;
  char2: string;
  position: number;
  isDeranged: boolean;
}

interface AnalysisResult {
  word1: string;
  word2: string;
  comparisons: CharComparison[];
  isDeranged: boolean;
  isAnagram: boolean;
}

type AnalysisStep = 
  | { type: 'idle' }
  | { type: 'sorting'; word1: string; word2: string }
  | { type: 'comparing'; word1: string; word2: string; position: number; comparisons: CharComparison[] }
  | { type: 'result'; result: AnalysisResult };

// --- Component ---

// Shuffle helper
const shuffleArray = <T,>(arr: T[]): T[] => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function DerangedAnagramsVisualization() {
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [analysisStep, setAnalysisStep] = useState<AnalysisStep>({ type: 'idle' });
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(400);
  const [discoveredPairs, setDiscoveredPairs] = useState<AnalysisResult[]>([]);
  const [mode, setMode] = useState<'curated' | 'random'>('curated');
  const [soundEnabled] = useState(true);
  const [pairKey, setPairKey] = useState(0); // Key to force re-render of word display

  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number>(0);
  
  // Memoize shuffled pairs to prevent re-shuffle on every render
  const allPairsRef = useRef<[string, string][]>([]);
  
  // Initialize pairs on mount and mode change
  useEffect(() => {
    allPairsRef.current = mode === 'curated' 
      ? shuffleArray([...DERANGED_PAIRS, ...NON_DERANGED])
      : [...DERANGED_PAIRS];
  }, [mode]);
  
  const allPairs = allPairsRef.current.length > 0 
    ? allPairsRef.current 
    : (mode === 'curated' ? [...DERANGED_PAIRS, ...NON_DERANGED] : DERANGED_PAIRS);

  // --- Audio ---
  useEffect(() => {
    if (soundEnabled && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, [soundEnabled]);

  const playSound = useCallback((type: 'scan' | 'match' | 'mismatch' | 'success' | 'fail') => {
    if (!soundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'scan') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600 + Math.random() * 200, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'match') {
      // Good beep - chars are different
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'mismatch') {
      // Bad buzz - chars are same
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'success') {
      // Victory chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(659, now + 0.1);
      osc.frequency.setValueAtTime(784, now + 0.2);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'fail') {
      // Failure sound
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.3);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  }, [soundEnabled]);

  // --- Analysis Logic ---
  const analyzeNextPair = useCallback(() => {
    if (currentPairIndex >= allPairs.length) {
      setIsRunning(false);
      return;
    }

    const [word1, word2] = allPairs[currentPairIndex];
    
    // Step 1: Show sorting
    setAnalysisStep({ type: 'sorting', word1, word2 });
    playSound('scan');

    timerRef.current = window.setTimeout(() => {
      // Step 2: Compare character by character
      const comparisons: CharComparison[] = [];
      let position = 0;

      const compareNext = () => {
        if (position < word1.length) {
          const comp: CharComparison = {
            char1: word1[position],
            char2: word2[position],
            position,
            isDeranged: word1[position] !== word2[position]
          };
          comparisons.push(comp);
          
          playSound(comp.isDeranged ? 'match' : 'mismatch');
          
          setAnalysisStep({
            type: 'comparing',
            word1,
            word2,
            position,
            comparisons: [...comparisons]
          });

          position++;
          timerRef.current = window.setTimeout(compareNext, speed);
        } else {
          // All positions compared - determine result
          const isDeranged = comparisons.every(c => c.isDeranged);
          const sorted1 = word1.split('').sort().join('');
          const sorted2 = word2.split('').sort().join('');
          const isAnagram = sorted1 === sorted2;

          const result: AnalysisResult = {
            word1,
            word2,
            comparisons,
            isDeranged,
            isAnagram
          };

          playSound(isDeranged && isAnagram ? 'success' : 'fail');

          setAnalysisStep({ type: 'result', result });

          if (isDeranged && isAnagram) {
            setDiscoveredPairs(prev => {
              const exists = prev.some(p => p.word1 === word1 && p.word2 === word2);
              return exists ? prev : [result, ...prev].slice(0, 6);
            });
          }

          // Move to next pair after delay
          timerRef.current = window.setTimeout(() => {
            setPairKey(prev => prev + 1); // Force re-render with new key
            setCurrentPairIndex(prev => prev + 1);
          }, speed * 2);
        }
      };

      compareNext();
    }, speed);
  }, [currentPairIndex, allPairs, speed, playSound]);

  // Auto-advance when running
  useEffect(() => {
    if (isRunning && analysisStep.type === 'idle') {
      analyzeNextPair();
    }
  }, [isRunning, analysisStep.type, analyzeNextPair]);

  // Continue analysis when pair index changes
  useEffect(() => {
    if (isRunning && currentPairIndex < allPairs.length) {
      setAnalysisStep({ type: 'idle' });
    } else if (currentPairIndex >= allPairs.length) {
      setIsRunning(false);
    }
  }, [currentPairIndex, isRunning, allPairs.length]);

  const reset = () => {
    clearTimeout(timerRef.current);
    setIsRunning(false);
    setCurrentPairIndex(0);
    setAnalysisStep({ type: 'idle' });
    setDiscoveredPairs([]);
    setPairKey(0);
    // Re-shuffle on reset
    allPairsRef.current = mode === 'curated' 
      ? shuffleArray([...DERANGED_PAIRS, ...NON_DERANGED])
      : [...DERANGED_PAIRS];
  };

  const toggleRunning = () => {
    if (isRunning) {
      clearTimeout(timerRef.current);
      setIsRunning(false);
    } else {
      if (currentPairIndex >= allPairs.length) {
        reset();
      }
      setIsRunning(true);
    }
  };

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  // Get current comparison data for visualization
  const getCurrentWord1 = () => {
    if (analysisStep.type === 'sorting' || analysisStep.type === 'comparing') return analysisStep.word1;
    if (analysisStep.type === 'result') return analysisStep.result.word1;
    return '';
  };

  const getCurrentWord2 = () => {
    if (analysisStep.type === 'sorting' || analysisStep.type === 'comparing') return analysisStep.word2;
    if (analysisStep.type === 'result') return analysisStep.result.word2;
    return '';
  };

  const getComparisons = () => {
    if (analysisStep.type === 'comparing') return analysisStep.comparisons;
    if (analysisStep.type === 'result') return analysisStep.result.comparisons;
    return [];
  };

  const getCurrentPosition = () => {
    if (analysisStep.type === 'comparing') return analysisStep.position;
    return -1;
  };

  return (
    <div className="w-full min-h-[650px] bg-gradient-to-br from-slate-950 via-emerald-950/20 to-slate-950 rounded-xl border border-emerald-900/30 font-mono overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-emerald-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <Dna className="text-emerald-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-400 tracking-wide">DERANGED ANAGRAM SCANNER</h2>
              <p className="text-xs text-slate-500">Genetic Sequence Comparator v2.0</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={mode}
              onChange={(e) => { setMode(e.target.value as 'curated' | 'random'); reset(); }}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="curated">Mixed Dataset</option>
              <option value="random">Deranged Only</option>
            </select>
            
            <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-1.5 border border-slate-700">
              <span className="text-xs text-slate-500">Speed:</span>
              <input
                type="range"
                min="100"
                max="800"
                step="100"
                value={800 - speed}
                onChange={(e) => setSpeed(800 - parseInt(e.target.value))}
                className="w-16 accent-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        
        {/* DNA Strand Comparison */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 relative overflow-hidden">
          {/* Background helix pattern */}
          <div className="absolute inset-0 opacity-5">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0,50 Q25,20 50,50 T100,50" stroke="currentColor" fill="none" strokeWidth="0.5" className="text-emerald-500" />
              <path d="M0,50 Q25,80 50,50 T100,50" stroke="currentColor" fill="none" strokeWidth="0.5" className="text-emerald-500" />
            </svg>
          </div>

          {analysisStep.type === 'idle' && currentPairIndex === 0 ? (
            <div className="text-center py-12">
              <Search size={48} className="mx-auto text-emerald-500/30 mb-4" />
              <p className="text-slate-500 text-sm">Press START to begin scanning word pairs</p>
              <p className="text-slate-600 text-xs mt-2">Looking for anagrams where no character shares the same position</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Word 1 - Top Strand */}
              <div className="relative">
                <div className="text-xs text-slate-500 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                  SEQUENCE A
                </div>
                <div className="flex justify-center gap-1">
                  {getCurrentWord1().split('').map((char, idx) => {
                    const comparison = getComparisons().find(c => c.position === idx);
                    const isCurrentPos = getCurrentPosition() === idx;
                    const isChecked = comparison !== undefined;
                    
                    return (
                      <motion.div
                        key={`w1-${pairKey}-${idx}`}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ 
                          scale: isCurrentPos ? 1.2 : 1, 
                          opacity: 1,
                          y: isCurrentPos ? -4 : 0
                        }}
                        transition={{ delay: idx * 0.03 }}
                        className={`
                          w-10 h-12 rounded-lg flex items-center justify-center text-xl font-bold uppercase
                          border-2 transition-all duration-200
                          ${isCurrentPos 
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.3)]' 
                            : isChecked
                              ? comparison?.isDeranged
                                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                                : 'bg-red-500/10 border-red-500/50 text-red-400'
                              : 'bg-slate-800/50 border-slate-700 text-slate-400'
                          }
                        `}
                      >
                        {char}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Connection Lines */}
              <div className="flex justify-center gap-1">
                {getCurrentWord1().split('').map((_, idx) => {
                  const comparison = getComparisons().find(c => c.position === idx);
                  const isCurrentPos = getCurrentPosition() === idx;
                  
                  return (
                    <div key={`conn-${pairKey}-${idx}`} className="w-10 flex flex-col items-center">
                      <AnimatePresence>
                        {comparison && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex flex-col items-center"
                          >
                            <div className={`w-0.5 h-6 ${comparison.isDeranged ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {comparison.isDeranged ? (
                              <CheckCircle2 size={16} className="text-emerald-400" />
                            ) : (
                              <XCircle size={16} className="text-red-400" />
                            )}
                            <div className={`w-0.5 h-6 ${comparison.isDeranged ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          </motion.div>
                        )}
                        {isCurrentPos && !comparison && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center"
                          >
                            <div className="w-0.5 h-6 bg-cyan-500/50" />
                            <Zap size={16} className="text-cyan-400 animate-pulse" />
                            <div className="w-0.5 h-6 bg-cyan-500/50" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Word 2 - Bottom Strand */}
              <div className="relative">
                <div className="text-xs text-slate-500 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-fuchsia-500"></span>
                  SEQUENCE B
                </div>
                <div className="flex justify-center gap-1">
                  {getCurrentWord2().split('').map((char, idx) => {
                    const comparison = getComparisons().find(c => c.position === idx);
                    const isCurrentPos = getCurrentPosition() === idx;
                    const isChecked = comparison !== undefined;
                    
                    return (
                      <motion.div
                        key={`w2-${pairKey}-${idx}`}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ 
                          scale: isCurrentPos ? 1.2 : 1, 
                          opacity: 1,
                          y: isCurrentPos ? 4 : 0
                        }}
                        transition={{ delay: idx * 0.03 }}
                        className={`
                          w-10 h-12 rounded-lg flex items-center justify-center text-xl font-bold uppercase
                          border-2 transition-all duration-200
                          ${isCurrentPos 
                            ? 'bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-300 shadow-[0_0_20px_rgba(232,121,249,0.3)]' 
                            : isChecked
                              ? comparison?.isDeranged
                                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                                : 'bg-red-500/10 border-red-500/50 text-red-400'
                              : 'bg-slate-800/50 border-slate-700 text-slate-400'
                          }
                        `}
                      >
                        {char}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Result Banner */}
          <AnimatePresence>
            {analysisStep.type === 'result' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`
                  mt-6 p-4 rounded-lg border text-center
                  ${analysisStep.result.isDeranged && analysisStep.result.isAnagram
                    ? 'bg-emerald-500/10 border-emerald-500/50'
                    : 'bg-red-500/10 border-red-500/50'
                  }
                `}
              >
                <div className="flex items-center justify-center gap-2">
                  {analysisStep.result.isDeranged && analysisStep.result.isAnagram ? (
                    <>
                      <Sparkles className="text-emerald-400" size={20} />
                      <span className="text-emerald-400 font-bold">DERANGED ANAGRAM CONFIRMED</span>
                      <Sparkles className="text-emerald-400" size={20} />
                    </>
                  ) : (
                    <>
                      <XCircle className="text-red-400" size={20} />
                      <span className="text-red-400 font-bold">
                        {!analysisStep.result.isAnagram ? 'NOT AN ANAGRAM' : 'NOT DERANGED - POSITION COLLISION'}
                      </span>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Controls */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Scanner Controls</span>
              <span className="text-xs text-slate-600">
                {currentPairIndex} / {allPairs.length} pairs
              </span>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={toggleRunning}
                className={`
                  flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all
                  ${isRunning
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30'
                  }
                `}
              >
                {isRunning ? <Pause size={18} /> : <Play size={18} />}
                {isRunning ? 'PAUSE' : 'START'}
              </button>
              <button
                onClick={reset}
                className="px-4 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all"
              >
                <RotateCcw size={18} />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentPairIndex / allPairs.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Discovered Pairs */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={12} className="text-emerald-400" />
                Discovered Deranged Pairs
              </span>
              <span className="text-xs text-emerald-400 font-bold">{discoveredPairs.length}</span>
            </div>
            
            <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
              <AnimatePresence>
                {discoveredPairs.map((pair) => (
                  <motion.div
                    key={`${pair.word1}-${pair.word2}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/20 rounded px-3 py-2"
                  >
                    <span className="text-cyan-400 text-sm">{pair.word1}</span>
                    <Dna size={12} className="text-emerald-500/50" />
                    <span className="text-fuchsia-400 text-sm">{pair.word2}</span>
                    <span className="text-xs text-slate-600 ml-2">{pair.word1.length} chars</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {discoveredPairs.length === 0 && (
                <div className="text-center py-4 text-slate-600 text-xs">
                  No deranged anagrams found yet...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <details className="bg-slate-900/30 rounded-xl border border-slate-800">
          <summary className="px-4 py-3 cursor-pointer text-sm text-slate-400 hover:text-slate-300 transition-colors">
            What is a Deranged Anagram?
          </summary>
          <div className="px-4 pb-4 text-xs text-slate-500 space-y-2">
            <p>
              A <span className="text-emerald-400">deranged anagram</span> is a special type of anagram where:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Both words contain exactly the same characters (anagram property)</li>
              <li>No character appears in the same position in both words (derangement property)</li>
            </ul>
            <p className="mt-2">
              For example: <span className="text-cyan-400">"excitation"</span> and <span className="text-fuchsia-400">"intoxicate"</span> are deranged anagrams - 
              they share all the same letters, but no letter occupies the same position in both words.
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}
