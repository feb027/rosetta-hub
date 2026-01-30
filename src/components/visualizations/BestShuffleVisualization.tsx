import { useState, useRef, useCallback, useEffect } from 'react';
import { RotateCcw, Sparkles, Volume2, VolumeX, Shuffle, Trophy, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Card {
  char: string;
  originalIndex: number;
  currentIndex: number;
  isFixed: boolean;
}

// Generate random pastel color for cards
function getCardColor(char: string): string {
  const colors = [
    'from-red-500/30 to-red-600/30 border-red-400/50',
    'from-blue-500/30 to-blue-600/30 border-blue-400/50',
    'from-green-500/30 to-green-600/30 border-green-400/50',
    'from-yellow-500/30 to-yellow-600/30 border-yellow-400/50',
    'from-purple-500/30 to-purple-600/30 border-purple-400/50',
    'from-pink-500/30 to-pink-600/30 border-pink-400/50',
    'from-cyan-500/30 to-cyan-600/30 border-cyan-400/50',
    'from-orange-500/30 to-orange-600/30 border-orange-400/50',
  ];
  return colors[char.charCodeAt(0) % colors.length];
}

// Random shuffle (Fisher-Yates)
function randomShuffle(cards: Card[]): Card[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.map((card, i) => ({ ...card, currentIndex: i }));
}

// Best shuffle - try to minimize fixed points
function bestShuffle(cards: Card[]): Card[] {
  const n = cards.length;
  const result: Card[] = new Array(n);
  const used = new Set<number>();

  // Sort by character frequency (most frequent first)
  const freqMap = new Map<string, number>();
  cards.forEach(c => {
    freqMap.set(c.char, (freqMap.get(c.char) || 0) + 1);
  });

  const sortedCards = [...cards].sort((a, b) => {
    const freqDiff = (freqMap.get(b.char) || 0) - (freqMap.get(a.char) || 0);
    return freqDiff !== 0 ? freqDiff : a.originalIndex - b.originalIndex;
  });

  // Try to place each card in a different position
  for (const card of sortedCards) {
    let placed = false;
    // Try positions furthest from original
    for (let offset = n - 1; offset >= 0 && !placed; offset--) {
      for (let dir of [1, -1]) {
        const pos = (card.originalIndex + dir * offset + n) % n;
        if (!used.has(pos) && cards[pos].char !== card.char) {
          result[pos] = { ...card, currentIndex: pos };
          used.add(pos);
          placed = true;
          break;
        }
      }
    }
    // Fallback: place in any available position
    if (!placed) {
      for (let i = 0; i < n; i++) {
        if (!used.has(i)) {
          result[i] = { ...card, currentIndex: i };
          used.add(i);
          break;
        }
      }
    }
  }

  return result;
}

// Calculate score (number of fixed points)
function calculateScore(cards: Card[]): number {
  return cards.filter(card => card.originalIndex === card.currentIndex).length;
}

const TEST_CASES = [
  { label: 'tree', value: 'tree' },
  { label: 'abracadabra', value: 'abracadabra' },
  { label: 'seesaw', value: 'seesaw' },
  { label: 'elk', value: 'elk' },
  { label: 'grrrrrr', value: 'grrrrrr' },
  { label: 'up', value: 'up' },
  { label: 'a', value: 'a' },
];

export default function BestShuffleVisualization() {
  const [input, setInput] = useState('abracadabra');
  const [cards, setCards] = useState<Card[]>([]);
  const [shuffledCards, setShuffledCards] = useState<Card[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [algorithm, setAlgorithm] = useState<'random' | 'best'>('best');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [history, setHistory] = useState<Array<{ original: string; shuffled: string; score: number; algorithm: string }>>([]);
  const [showHistory, setShowHistory] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize cards from input
  useEffect(() => {
    const newCards = input.split('').map((char, i) => ({
      char,
      originalIndex: i,
      currentIndex: i,
      isFixed: false,
    }));
    setCards(newCards);
    setShuffledCards(newCards);
  }, [input]);

  // Sound effects
  const playSound = useCallback((type: 'shuffle' | 'card' | 'success' | 'fail' | 'click') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'shuffle') {
      // Shuffling sound - multiple quick card sounds
      for (let i = 0; i < 8; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200 + i * 50, now + i * 0.05);
        gain.gain.setValueAtTime(0.05, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.1);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.1);
      }
    } else if (type === 'card') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'success') {
      // Victory chord
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0.06, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3 + i * 0.05);
        osc.start(now + i * 0.05);
        osc.stop(now + 0.35 + i * 0.05);
      });
    } else if (type === 'fail') {
      // Low thud
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  }, [soundEnabled]);

  const handleShuffle = async () => {
    if (isAnimating || cards.length === 0) return;

    setIsAnimating(true);
    playSound('shuffle');

    // Perform shuffle
    const newShuffled = algorithm === 'random' 
      ? randomShuffle(cards) 
      : bestShuffle(cards);
    
    setShuffledCards(newShuffled);

    // Add to history
    const score = calculateScore(newShuffled);
    const shuffledString = newShuffled.map(c => c.char).join('');
    
    setHistory(prev => [{
      original: input,
      shuffled: shuffledString,
      score,
      algorithm: algorithm === 'random' ? 'Random' : 'Best'
    }, ...prev].slice(0, 10));

    // Play result sound
    setTimeout(() => {
      if (score === 0) {
        playSound('success');
      } else if (score > cards.length / 2) {
        playSound('fail');
      } else {
        playSound('card');
      }
    }, 600);

    setIsAnimating(false);
  };

  const handleReset = () => {
    setShuffledCards(cards);
    playSound('click');
  };

  const score = calculateScore(shuffledCards);
  const maxScore = cards.length;
  const isPerfect = score === 0 && cards.length > 1;
  const isImpossible = cards.length > 0 && 
    cards.every(c => cards.filter(x => x.char === c.char).length === cards.length);

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-emerald-950/10 to-slate-950 rounded-xl border border-emerald-900/30 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-emerald-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/40 relative">
              <Shuffle className="text-emerald-400" size={24} />
              {isAnimating && (
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles size={12} className="text-yellow-300" />
                </motion.div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-300 tracking-wide">CARD SHUFFLER</h2>
              <p className="text-xs text-emerald-500/70">Best Shuffle Algorithm Visualizer</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                showHistory
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              History
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled 
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' 
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        
        {/* Input Section */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs text-slate-400 mb-2">Input String</label>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={20}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                placeholder="Enter text to shuffle..."
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-2">Algorithm</label>
              <div className="flex gap-2">
                <button
                  onClick={() => { setAlgorithm('best'); playSound('click'); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    algorithm === 'best'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  Best
                </button>
                <button
                  onClick={() => { setAlgorithm('random'); playSound('click'); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    algorithm === 'random'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  Random
                </button>
              </div>
            </div>
          </div>

          {/* Test Cases */}
          <div className="mt-4">
            <label className="block text-xs text-slate-400 mb-2">Quick Select</label>
            <div className="flex flex-wrap gap-2">
              {TEST_CASES.map((tc) => (
                <button
                  key={tc.label}
                  onClick={() => { setInput(tc.value); playSound('click'); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    input === tc.value
                      ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                      : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-emerald-500/30'
                  }`}
                >
                  {tc.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cards Display */}
        <div className="bg-slate-900/30 rounded-xl border border-emerald-800/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-emerald-400 flex items-center gap-2">
              <Shuffle size={14} />
              Shuffled Result
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">Score:</span>
              <span className={`text-lg font-bold font-mono ${
                isPerfect ? 'text-emerald-400' : score > 0 ? 'text-amber-400' : 'text-slate-400'
              }`}>
                {score}
              </span>
              <span className="text-xs text-slate-500">/ {maxScore}</span>
            </div>
          </div>

          {/* Cards */}
          <div className="flex flex-wrap justify-center gap-2 min-h-[100px]">
            <AnimatePresence mode="popLayout">
              {shuffledCards.map((card, index) => {
                const isFixed = card.originalIndex === card.currentIndex;
                return (
                  <motion.div
                    key={`${card.originalIndex}-${card.char}`}
                    layout
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ 
                      scale: 1, 
                      rotate: 0,
                      y: isFixed ? 0 : [0, -10, 0],
                    }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ 
                      duration: 0.5, 
                      delay: index * 0.05,
                      y: { repeat: isFixed ? 0 : Infinity, duration: 2, repeatType: 'reverse' }
                    }}
                    className={`
                      relative w-12 h-16 md:w-14 md:h-20 flex items-center justify-center
                      rounded-lg font-bold text-lg md:text-xl
                      bg-gradient-to-br ${getCardColor(card.char)}
                      border-2 shadow-lg
                      ${isFixed ? 'ring-2 ring-red-500/50 opacity-60' : 'ring-2 ring-emerald-500/50'}
                    `}
                  >
                    <span className={isFixed ? 'text-slate-400' : 'text-white'}>
                      {card.char}
                    </span>
                    
                    {/* Fixed indicator */}
                    {isFixed && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">!</span>
                      </div>
                    )}

                    {/* Original position marker */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-slate-500 bg-slate-900/80 px-1 rounded">
                      {card.originalIndex + 1}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Result Message */}
          <div className="mt-4 text-center">
            {isPerfect && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/50 rounded-full text-emerald-300"
              >
                <Trophy size={16} />
                <span className="text-sm font-semibold">Perfect Shuffle! Score: 0</span>
              </motion.div>
            )}
            {isImpossible && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/50 rounded-full text-amber-300"
              >
                <AlertCircle size={16} />
                <span className="text-sm font-semibold">Impossible - All characters are identical!</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <button
            onClick={handleShuffle}
            disabled={isAnimating || input.length === 0}
            className="flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Shuffle size={18} />
            {isAnimating ? 'Shuffling...' : 'SHUFFLE'}
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        {/* History */}
        <AnimatePresence>
          {showHistory && history.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-slate-900/30 rounded-xl border border-slate-800 overflow-hidden"
            >
              <div className="p-4">
                <h3 className="text-sm font-semibold text-emerald-300 mb-3">Shuffle History</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {history.map((h, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">{h.original}</span>
                        <span className="text-slate-600">→</span>
                        <span className="text-emerald-400">{h.shuffled}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">{h.algorithm}</span>
                        <span className={`px-2 py-0.5 rounded ${
                          h.score === 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          Score: {h.score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Length</div>
            <div className="text-xl font-bold text-emerald-400 font-mono">{input.length}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Fixed Points</div>
            <div className={`text-xl font-bold font-mono ${score === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {score}
            </div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Unique Chars</div>
            <div className="text-xl font-bold text-cyan-400 font-mono">
              {new Set(input).size}
            </div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Success Rate</div>
            <div className="text-xl font-bold text-purple-400 font-mono">
              {maxScore > 0 ? Math.round(((maxScore - score) / maxScore) * 100) : 0}%
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <h3 className="text-sm font-semibold text-emerald-300 mb-3">About Best Shuffle</h3>
          <div className="space-y-2 text-xs text-slate-400">
            <p>
              <span className="text-emerald-300">Best Shuffle</span> attempts to rearrange characters 
              so that as many as possible are in different positions than their original.
            </p>
            <p>
              A <span className="text-emerald-300">perfect shuffle</span> (score = 0) is called a 
              <span className="text-cyan-300"> derangement</span> - no element appears in its original position.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><span className="text-emerald-400">Green cards</span>: Character moved (good!)</li>
              <li><span className="text-red-400">Red badges</span>: Character stayed in place (bad)</li>
              <li><span className="text-slate-500">Numbers</span>: Original position of each character</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
