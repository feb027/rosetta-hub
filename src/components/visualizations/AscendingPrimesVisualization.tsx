import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Mountain, TrendingUp, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Prime Generation ---
const isPrime = (n: number): boolean => {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
};

const hasAscendingDigits = (n: number): boolean => {
  const s = n.toString();
  for (let i = 1; i < s.length; i++) {
    if (s[i] <= s[i - 1]) return false;
  }
  return true;
};

// Generate all ascending primes efficiently using BFS
const generateAscendingPrimes = (): number[] => {
  const primes: number[] = [];
  const queue: number[] = [];
  
  // Start with single digits 1-9
  for (let d = 1; d <= 9; d++) {
    queue.push(d);
  }
  
  while (queue.length > 0) {
    const num = queue.shift()!;
    if (isPrime(num)) {
      primes.push(num);
    }
    
    // Get last digit and append larger digits
    const lastDigit = num % 10;
    for (let d = lastDigit + 1; d <= 9; d++) {
      queue.push(num * 10 + d);
    }
  }
  
  return primes.sort((a, b) => a - b);
};

// Pre-compute all ascending primes
const ALL_ASCENDING_PRIMES = generateAscendingPrimes();

// --- Component ---
export default function AscendingPrimesVisualization() {
  const [displayedPrimes, setDisplayedPrimes] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPrime, setSelectedPrime] = useState<number | null>(null);
  const [filterDigits, setFilterDigits] = useState<number | 'all'>('all');
  const [searchValue, setSearchValue] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [speed, setSpeed] = useState(100);

  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number>(0);


  // --- Audio ---
  const playSound = useCallback((type: 'discover' | 'complete' | 'select' | 'tick') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'discover') {
      const freq = 300 + (currentIndex % 50) * 10;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.08);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'complete') {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.08, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8 + i * 0.1);
        osc.start(now + i * 0.1);
        osc.stop(now + 1 + i * 0.1);
      });
    } else if (type === 'select') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      osc.start(now);
      osc.stop(now + 0.02);
    }
  }, [soundEnabled, currentIndex]);

  // --- Discovery Animation ---
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = window.setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= ALL_ASCENDING_PRIMES.length - 1) {
            setIsPlaying(false);
            playSound('complete');
            return prev;
          }
          const next = prev + 1;
          setDisplayedPrimes(ALL_ASCENDING_PRIMES.slice(0, next + 1));
          playSound('discover');
          return next;
        });
      }, speed);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed, playSound]);

  // --- Controls ---
  const togglePlay = () => {
    if (currentIndex >= ALL_ASCENDING_PRIMES.length - 1) {
      setCurrentIndex(0);
      setDisplayedPrimes([ALL_ASCENDING_PRIMES[0]]);
    }
    setIsPlaying(!isPlaying);
  };

  const reset = () => {
    setIsPlaying(false);
    clearInterval(intervalRef.current);
    setCurrentIndex(0);
    setDisplayedPrimes([]);
    setSelectedPrime(null);
  };

  const showAll = () => {
    setIsPlaying(false);
    setCurrentIndex(ALL_ASCENDING_PRIMES.length - 1);
    setDisplayedPrimes([...ALL_ASCENDING_PRIMES]);
    playSound('complete');
  };

  // Filter primes by digit count
  const filteredPrimes = filterDigits === 'all' 
    ? displayedPrimes 
    : displayedPrimes.filter(p => p.toString().length === filterDigits);

  // Search validation
  const isSearchValid = searchValue ? hasAscendingDigits(parseInt(searchValue)) && isPrime(parseInt(searchValue)) : null;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ') { e.preventDefault(); togglePlay(); }
      if (e.key === 'r' || e.key === 'R') reset();
      if (e.key === 'a' || e.key === 'A') showAll();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIndex, isPlaying]);

  // Get digit count distribution
  const digitCounts = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => ({
    digits: d,
    count: ALL_ASCENDING_PRIMES.filter(p => p.toString().length === d).length,
    discovered: displayedPrimes.filter(p => p.toString().length === d).length,
  }));


  // Render ascending staircase for a prime
  const renderStaircase = (prime: number) => {
    const digits = prime.toString().split('');
    const maxDigit = 9;
    
    return (
      <div className="flex items-end gap-0.5 h-20">
        {digits.map((digit, idx) => {
          const height = (parseInt(digit) / maxDigit) * 100;
          return (
            <motion.div
              key={idx}
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ delay: idx * 0.1, type: 'spring', stiffness: 200 }}
              className="w-6 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t flex items-end justify-center pb-1"
            >
              <span className="text-xs font-bold text-white">{digit}</span>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-emerald-950/20 to-slate-950 rounded-xl border border-emerald-900/40 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-emerald-800/40 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/40">
              <Mountain className="text-emerald-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-300 tracking-wide">PRIME PEAKS</h2>
              <p className="text-xs text-emerald-500/70">Ascending Primes Explorer</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value={200}>Slow</option>
              <option value={100}>Normal</option>
              <option value={50}>Fast</option>
              <option value={20}>Rapid</option>
            </select>
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
        
        {/* Progress & Stats */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500">Discovery Progress</span>
            <span className="text-xs text-emerald-400 font-mono">
              {displayedPrimes.length} / {ALL_ASCENDING_PRIMES.length} primes
            </span>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 rounded-full"
              animate={{ width: `${(displayedPrimes.length / ALL_ASCENDING_PRIMES.length) * 100}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
          
          {/* Digit distribution bars */}
          <div className="mt-4 flex gap-1">
            {digitCounts.map(({ digits, count, discovered }) => (
              <div key={digits} className="flex-1">
                <div className="h-12 bg-slate-800/50 rounded relative overflow-hidden">
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-600/50 to-emerald-400/50"
                    animate={{ height: `${count > 0 ? (discovered / count) * 100 : 0}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-mono text-slate-400">{discovered}</span>
                  </div>
                </div>
                <div className="text-center text-[10px] text-slate-600 mt-1">{digits}d</div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Prime Display */}
        <AnimatePresence mode="wait">
          {selectedPrime && (
            <motion.div
              key={selectedPrime}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-emerald-500/10 rounded-xl border border-emerald-500/40 p-6"
            >
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="text-center">
                  <div className="text-xs text-emerald-400 mb-2">Selected Prime</div>
                  <div className="text-4xl font-bold text-emerald-300 font-mono">{selectedPrime}</div>
                  <div className="text-xs text-slate-500 mt-1">{selectedPrime.toString().length} digits</div>
                </div>
                <div className="flex-1 flex justify-center">
                  {renderStaircase(selectedPrime)}
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-500 mb-1">Rank</div>
                  <div className="text-2xl font-bold text-amber-400">
                    #{ALL_ASCENDING_PRIMES.indexOf(selectedPrime) + 1}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Latest Discovery */}
        {displayedPrimes.length > 0 && !selectedPrime && (
          <div className="bg-slate-900/30 rounded-xl border border-emerald-500/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-emerald-400 mb-1">Latest Discovery</div>
                <div className="text-3xl font-bold text-emerald-300 font-mono">
                  {displayedPrimes[displayedPrimes.length - 1]}
                </div>
              </div>
              <div className="flex items-end gap-0.5 h-12">
                {displayedPrimes[displayedPrimes.length - 1]?.toString().split('').map((d, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${(parseInt(d) / 9) * 100}%` }}
                    className="w-4 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3">
          <button
            onClick={togglePlay}
            className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30'
            }`}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            {isPlaying ? 'PAUSE' : 'DISCOVER PRIMES'}
          </button>
          <button
            onClick={showAll}
            disabled={displayedPrimes.length === ALL_ASCENDING_PRIMES.length}
            className="px-4 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all disabled:opacity-50"
            title="Show all 511 primes"
          >
            <TrendingUp size={18} />
          </button>
          <button
            onClick={reset}
            className="px-4 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        {/* Filter & Search */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <div className="text-xs text-emerald-400 mb-3">Filter by Digits</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterDigits('all')}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                  filterDigits === 'all'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-emerald-500/30'
                }`}
              >
                All
              </button>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
                <button
                  key={d}
                  onClick={() => setFilterDigits(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                    filterDigits === d
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-emerald-500/30'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <div className="text-xs text-emerald-400 mb-3">Check a Number</div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter number..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                />
              </div>
            </div>
            {searchValue && (
              <div className={`mt-2 text-xs ${isSearchValid ? 'text-emerald-400' : 'text-red-400'}`}>
                {isSearchValid ? `✓ ${searchValue} is an ascending prime (#${ALL_ASCENDING_PRIMES.indexOf(parseInt(searchValue)) + 1})` : `✗ ${searchValue} is not an ascending prime`}
              </div>
            )}
          </div>
        </div>


        {/* Prime Grid */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-emerald-400">
              {filterDigits === 'all' ? 'All Discovered Primes' : `${filterDigits}-Digit Primes`}
            </span>
            <span className="text-xs text-slate-500">
              {filteredPrimes.length} shown
            </span>
          </div>
          
          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {filteredPrimes.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Mountain size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No primes discovered yet</p>
                <p className="text-xs">Press play to start exploring</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {filteredPrimes.map((prime, idx) => (
                  <motion.button
                    key={prime}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: Math.min(idx * 0.01, 0.5) }}
                    onClick={() => { setSelectedPrime(prime); playSound('select'); }}
                    className={`px-3 py-1.5 rounded-lg font-mono text-sm transition-all ${
                      selectedPrime === prime
                        ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/50 ring-2 ring-emerald-500/30'
                        : 'bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:border-emerald-500/30 hover:text-emerald-300'
                    }`}
                  >
                    {prime}
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Notable Primes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Smallest</div>
            <div className="text-xl font-bold text-emerald-400 font-mono">2</div>
            <div className="text-[10px] text-slate-600">1 digit</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Largest</div>
            <div className="text-lg font-bold text-emerald-400 font-mono">123456789</div>
            <div className="text-[10px] text-slate-600">9 digits</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Total Count</div>
            <div className="text-xl font-bold text-amber-400 font-mono">511</div>
            <div className="text-[10px] text-slate-600">ascending primes</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Most Common</div>
            <div className="text-xl font-bold text-cyan-400 font-mono">5d</div>
            <div className="text-[10px] text-slate-600">119 primes</div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Space</kbd> Play/Pause
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">A</kbd> Show All
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
          About Ascending Primes
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            An <span className="text-emerald-300">ascending prime</span> has digits that strictly increase 
            from left to right. For example: 2, 13, 37, 137, 1279, 123456789.
          </p>
          <p>
            There are exactly <span className="text-amber-300">511 ascending primes</span>. This is finite 
            because the longest possible ascending number is 123456789 (9 digits using 1-9 once each).
          </p>
          <p>
            <span className="text-cyan-300">Efficient generation:</span> Instead of checking all numbers, 
            we can generate candidates by building numbers with ascending digits and testing primality.
          </p>
          <p className="text-slate-500 italic">
            The visualization shows each prime as a "staircase" where each step's height represents the digit value.
          </p>
        </div>
      </details>
    </div>
  );
}
