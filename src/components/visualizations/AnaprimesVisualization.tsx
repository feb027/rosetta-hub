import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, Pause, RotateCcw, Star, Sparkles, Telescope, Orbit } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Prime Generation & Logic ---

const isPrime = (n: number): boolean => {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
};

const getDigitSignature = (n: number): string => {
  return n.toString().split('').sort().join('');
};

// Pre-computed anagram groups for different digit ranges
const computeAnaprimeGroups = (maxDigits: number): Map<string, number[]> => {
  const groups = new Map<string, number[]>();
  const limit = Math.pow(10, maxDigits);
  const start = maxDigits === 1 ? 2 : Math.pow(10, maxDigits - 1);
  
  for (let n = start; n < limit; n++) {
    if (isPrime(n)) {
      const sig = getDigitSignature(n);
      if (!groups.has(sig)) {
        groups.set(sig, []);
      }
      groups.get(sig)!.push(n);
    }
  }
  
  // Filter to only groups with 2+ members (actual anagram groups)
  const result = new Map<string, number[]>();
  groups.forEach((primes, sig) => {
    if (primes.length >= 2) {
      result.set(sig, primes);
    }
  });
  
  return result;
};

interface Constellation {
  id: string;
  signature: string;
  primes: number[];
  x: number;
  y: number;
  size: number;
  color: string;
}

interface ScanResult {
  digits: number;
  totalPrimes: number;
  anagramGroups: number;
  largestGroup: number[];
  largestGroupSize: number;
}

// --- Component ---

export default function AnaprimesVisualization() {
  const [selectedDigits, setSelectedDigits] = useState(3);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [constellations, setConstellations] = useState<Constellation[]>([]);
  const [selectedConstellation, setSelectedConstellation] = useState<Constellation | null>(null);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [soundEnabled] = useState(true);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Color palette for constellations
  const colors = useMemo(() => [
    '#f472b6', '#a78bfa', '#60a5fa', '#34d399', '#fbbf24', '#f87171',
    '#c084fc', '#22d3ee', '#4ade80', '#fb923c', '#e879f9', '#38bdf8'
  ], []);

  // --- Audio ---
  useEffect(() => {
    if (soundEnabled && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, [soundEnabled]);

  const playSound = useCallback((type: 'scan' | 'discover' | 'complete' | 'select') => {
    if (!soundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'scan') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200 + Math.random() * 100, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'discover') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'complete') {
      // Triumphant chord
      [523, 659, 784].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, now);
        g.gain.setValueAtTime(0.08, now + i * 0.05);
        g.gain.linearRampToValueAtTime(0, now + 0.8);
        o.start(now + i * 0.05);
        o.stop(now + 0.8);
      });
    } else if (type === 'select') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  }, [soundEnabled]);

  // --- Scanning Logic ---
  const startScan = useCallback(() => {
    setIsScanning(true);
    setScanProgress(0);
    setConstellations([]);
    setSelectedConstellation(null);

    // Simulate progressive scanning
    let progress = 0;
    const scanInterval = setInterval(() => {
      progress += 2;
      setScanProgress(progress);
      playSound('scan');
      
      if (progress >= 100) {
        clearInterval(scanInterval);
        
        // Compute actual results
        const groups = computeAnaprimeGroups(selectedDigits);
        
        // Find largest group
        let largestGroup: number[] = [];
        groups.forEach((primes) => {
          if (primes.length > largestGroup.length) {
            largestGroup = primes;
          }
        });

        // Create constellations for visualization (top groups)
        const sortedGroups = Array.from(groups.entries())
          .sort((a, b) => b[1].length - a[1].length)
          .slice(0, 20);

        const newConstellations: Constellation[] = sortedGroups.map(([sig, primes], idx) => ({
          id: `const-${idx}`,
          signature: sig,
          primes,
          x: 10 + Math.random() * 80,
          y: 10 + Math.random() * 70,
          size: Math.min(primes.length * 8, 60),
          color: colors[idx % colors.length]
        }));

        setConstellations(newConstellations);
        
        // Store results
        const limit = Math.pow(10, selectedDigits);
        const start = selectedDigits === 1 ? 2 : Math.pow(10, selectedDigits - 1);
        let totalPrimes = 0;
        for (let n = start; n < limit; n++) {
          if (isPrime(n)) totalPrimes++;
        }

        setScanResults(prev => {
          const exists = prev.find(r => r.digits === selectedDigits);
          if (exists) return prev;
          return [...prev, {
            digits: selectedDigits,
            totalPrimes,
            anagramGroups: groups.size,
            largestGroup,
            largestGroupSize: largestGroup.length
          }].sort((a, b) => a.digits - b.digits);
        });

        playSound('complete');
        setIsScanning(false);
      }
    }, 30);

    return () => clearInterval(scanInterval);
  }, [selectedDigits, colors, playSound]);

  const reset = () => {
    setIsScanning(false);
    setScanProgress(0);
    setConstellations([]);
    setSelectedConstellation(null);
  };

  const handleConstellationClick = (constellation: Constellation) => {
    setSelectedConstellation(constellation);
    playSound('select');
  };

  // Get current scan result
  const currentResult = scanResults.find(r => r.digits === selectedDigits);

  return (
    <div className="w-full min-h-[700px] bg-[#0a0a1a] rounded-xl border border-indigo-900/30 font-sans overflow-hidden relative">
      
      {/* Starfield Background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute w-px h-px bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.2,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 bg-gradient-to-b from-indigo-950/80 to-transparent border-b border-indigo-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
              <Telescope className="text-indigo-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-indigo-300 tracking-wide">ANAPRIME OBSERVATORY</h2>
              <p className="text-xs text-indigo-500/70">Prime Constellation Mapper</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-indigo-950/50 rounded-lg px-3 py-2 border border-indigo-800/50">
              <span className="text-xs text-indigo-400">Digit Range:</span>
              <select
                value={selectedDigits}
                onChange={(e) => { setSelectedDigits(parseInt(e.target.value)); reset(); }}
                disabled={isScanning}
                className="bg-indigo-900/50 border border-indigo-700 rounded px-2 py-1 text-sm text-indigo-200 focus:outline-none focus:border-indigo-500"
              >
                <option value={2}>2 digits (10-99)</option>
                <option value={3}>3 digits (100-999)</option>
                <option value={4}>4 digits (1K-9.9K)</option>
                <option value={5}>5 digits (10K-99K)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Constellation Map */}
        <div className="lg:col-span-2">
          <div 
            ref={canvasRef}
            className="relative h-[400px] bg-indigo-950/20 rounded-xl border border-indigo-800/30 overflow-hidden"
          >
            {/* Scanning overlay */}
            {isScanning && (
              <div className="absolute inset-0 z-20">
                <motion.div
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent"
                  initial={{ top: 0 }}
                  animate={{ top: '100%' }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Orbit className="w-16 h-16 text-indigo-400 animate-spin mx-auto mb-4" />
                    <p className="text-indigo-300 font-mono">SCANNING PRIME FIELD...</p>
                    <p className="text-indigo-500 text-sm mt-1">{scanProgress}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Idle state */}
            {!isScanning && constellations.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Star className="w-16 h-16 text-indigo-500/30 mx-auto mb-4" />
                  <p className="text-indigo-400/50">Select digit range and start scanning</p>
                  <p className="text-indigo-500/30 text-xs mt-1">to discover prime constellations</p>
                </div>
              </div>
            )}

            {/* Constellations */}
            <AnimatePresence>
              {constellations.map((constellation, idx) => (
                <motion.div
                  key={constellation.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: idx * 0.05, type: 'spring' }}
                  className={`absolute cursor-pointer transition-all duration-300 ${
                    selectedConstellation?.id === constellation.id 
                      ? 'z-20 scale-125' 
                      : 'z-10 hover:scale-110'
                  }`}
                  style={{ 
                    left: `${constellation.x}%`, 
                    top: `${constellation.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  onClick={() => handleConstellationClick(constellation)}
                >
                  {/* Glow effect */}
                  <div 
                    className="absolute inset-0 rounded-full blur-xl opacity-50"
                    style={{ 
                      backgroundColor: constellation.color,
                      width: constellation.size * 1.5,
                      height: constellation.size * 1.5,
                      marginLeft: -constellation.size * 0.25,
                      marginTop: -constellation.size * 0.25
                    }}
                  />
                  
                  {/* Star cluster */}
                  <div 
                    className="relative rounded-full flex items-center justify-center border-2"
                    style={{ 
                      width: constellation.size,
                      height: constellation.size,
                      borderColor: constellation.color,
                      backgroundColor: `${constellation.color}20`
                    }}
                  >
                    <span className="text-white font-bold text-xs">
                      {constellation.primes.length}
                    </span>
                  </div>

                  {/* Mini stars around */}
                  {constellation.primes.slice(0, 5).map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 rounded-full"
                      style={{
                        backgroundColor: constellation.color,
                        left: `${50 + Math.cos(i * 72 * Math.PI / 180) * 60}%`,
                        top: `${50 + Math.sin(i * 72 * Math.PI / 180) * 60}%`,
                      }}
                    />
                  ))}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Connection lines for selected constellation */}
            {selectedConstellation && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-5">
                {constellations
                  .filter(c => c.id !== selectedConstellation.id)
                  .slice(0, 5)
                  .map((c, i) => (
                    <motion.line
                      key={i}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.2 }}
                      x1={`${selectedConstellation.x}%`}
                      y1={`${selectedConstellation.y}%`}
                      x2={`${c.x}%`}
                      y2={`${c.y}%`}
                      stroke={selectedConstellation.color}
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  ))}
              </svg>
            )}
          </div>

          {/* Controls */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={isScanning ? reset : startScan}
              disabled={isScanning}
              className={`
                flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all
                ${isScanning
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 hover:bg-indigo-500/30'
                }
              `}
            >
              {isScanning ? <Pause size={18} /> : <Play size={18} />}
              {isScanning ? 'SCANNING...' : 'START SCAN'}
            </button>
            <button
              onClick={reset}
              className="px-4 py-3 rounded-lg bg-indigo-950/50 text-indigo-400 border border-indigo-800/50 hover:bg-indigo-900/50 transition-all"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>

        {/* Info Panel */}
        <div className="space-y-4">
          {/* Selected Constellation Details */}
          <div className="bg-indigo-950/30 rounded-xl border border-indigo-800/30 p-4">
            <h3 className="text-sm font-bold text-indigo-300 mb-3 flex items-center gap-2">
              <Sparkles size={14} />
              {selectedConstellation ? 'CONSTELLATION DETAILS' : 'SELECT A CONSTELLATION'}
            </h3>
            
            {selectedConstellation ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: selectedConstellation.color }}
                  />
                  <span className="text-indigo-200 font-mono">
                    Signature: {selectedConstellation.signature}
                  </span>
                </div>
                
                <div className="text-xs text-indigo-400">
                  {selectedConstellation.primes.length} anaprimes in group
                </div>
                
                <div className="bg-indigo-950/50 rounded-lg p-3 max-h-40 overflow-y-auto custom-scrollbar">
                  <div className="flex flex-wrap gap-2">
                    {selectedConstellation.primes.map((prime, idx) => (
                      <motion.span
                        key={prime}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className="px-2 py-1 bg-indigo-900/50 border border-indigo-700/50 rounded text-indigo-200 text-xs font-mono"
                      >
                        {prime}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-indigo-500/50 text-xs">
                Click on a constellation to view its anaprimes
              </p>
            )}
          </div>

          {/* Scan Results */}
          <div className="bg-indigo-950/30 rounded-xl border border-indigo-800/30 p-4">
            <h3 className="text-sm font-bold text-indigo-300 mb-3 flex items-center gap-2">
              <Star size={14} />
              SCAN RESULTS
            </h3>
            
            {currentResult ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-indigo-400">
                  <span>Total Primes:</span>
                  <span className="text-indigo-200 font-mono">{currentResult.totalPrimes.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-indigo-400">
                  <span>Anagram Groups:</span>
                  <span className="text-indigo-200 font-mono">{currentResult.anagramGroups}</span>
                </div>
                <div className="flex justify-between text-indigo-400">
                  <span>Largest Group:</span>
                  <span className="text-indigo-200 font-mono">{currentResult.largestGroupSize} primes</span>
                </div>
                
                <div className="mt-3 pt-3 border-t border-indigo-800/30">
                  <div className="text-indigo-400 mb-2">Largest Group Members:</div>
                  <div className="flex flex-wrap gap-1">
                    {currentResult.largestGroup.slice(0, 10).map(p => (
                      <span key={p} className="px-1.5 py-0.5 bg-indigo-900/30 rounded text-indigo-300 font-mono">
                        {p}
                      </span>
                    ))}
                    {currentResult.largestGroup.length > 10 && (
                      <span className="text-indigo-500">+{currentResult.largestGroup.length - 10} more</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-indigo-500/50 text-xs">
                Run a scan to see results
              </p>
            )}
          </div>

          {/* History */}
          {scanResults.length > 0 && (
            <div className="bg-indigo-950/30 rounded-xl border border-indigo-800/30 p-4">
              <h3 className="text-sm font-bold text-indigo-300 mb-3">SCAN HISTORY</h3>
              <div className="space-y-2">
                {scanResults.map(result => (
                  <div 
                    key={result.digits}
                    className={`flex justify-between items-center p-2 rounded text-xs ${
                      result.digits === selectedDigits 
                        ? 'bg-indigo-800/30 border border-indigo-600/30' 
                        : 'bg-indigo-950/30'
                    }`}
                  >
                    <span className="text-indigo-400">{result.digits}-digit</span>
                    <span className="text-indigo-300 font-mono">
                      {result.anagramGroups} groups / max {result.largestGroupSize}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Footer */}
      <details className="relative z-10 mx-6 mb-6 bg-indigo-950/30 rounded-xl border border-indigo-800/30">
        <summary className="px-4 py-3 cursor-pointer text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
          What are Anaprimes?
        </summary>
        <div className="px-4 pb-4 text-xs text-indigo-500 space-y-2">
          <p>
            <span className="text-indigo-300">Anaprimes</span> are prime numbers that are anagrams of each other - 
            they contain exactly the same digits, just rearranged.
          </p>
          <p>
            For example, <span className="text-pink-400 font-mono">149, 419, 491, 941</span> are all prime 
            and all use the digits 1, 4, and 9 - making them a group of 4 anaprimes.
          </p>
          <p>
            Each constellation represents an anagram group. Larger constellations contain more anaprimes!
          </p>
        </div>
      </details>
    </div>
  );
}
