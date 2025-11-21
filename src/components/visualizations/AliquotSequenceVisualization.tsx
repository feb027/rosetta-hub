import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Rocket, Disc, Activity, AlertTriangle, CheckCircle2, XCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Logic ---

const getProperDivisorsSum = (n: number): number => {
  if (n <= 1) return 0;
  let sum = 1;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) {
      sum += i;
      if (i * i !== n) sum += n / i;
    }
  }
  return sum;
};

type Classification = 
  | 'Terminating' 
  | 'Perfect' 
  | 'Amicable' 
  | 'Sociable' 
  | 'Aspiring' 
  | 'Cyclic' 
  | 'Non-terminating'
  | 'Analyzing...';

interface SequenceResult {
  start: number;
  sequence: number[];
  classification: Classification;
}

const MAX_TERMS = 16;
const MAX_VALUE = 140737488355328; // 2^47

const classifySequence = (k: number): SequenceResult => {
  const sequence = [k];
  let current = k;
  
  for (let i = 0; i < MAX_TERMS; i++) {
    if (current === 0) {
      return { start: k, sequence, classification: 'Terminating' };
    }
    
    // Check for overflow
    if (current > MAX_VALUE) {
      return { start: k, sequence, classification: 'Non-terminating' };
    }

    const next = getProperDivisorsSum(current);
    
    // Check for loops
    const existingIndex = sequence.indexOf(next);
    if (existingIndex !== -1) {
      // Loop found!
      const period = sequence.length - existingIndex;
      sequence.push(next); // Add the repeating term to show the loop connection
      
      if (existingIndex === 0) {
        // Pure loop starting from K
        if (period === 1) return { start: k, sequence, classification: 'Perfect' };
        if (period === 2) return { start: k, sequence, classification: 'Amicable' };
        return { start: k, sequence, classification: 'Sociable' };
      } else {
        // Pre-periodic (Aspiring or Cyclic)
        if (period === 1) return { start: k, sequence, classification: 'Aspiring' };
        return { start: k, sequence, classification: 'Cyclic' };
      }
    }

    sequence.push(next);
    current = next;
  }

  return { start: k, sequence, classification: 'Non-terminating' };
};

// --- Component ---

export default function AliquotSequenceVisualization() {
  const [inputNumber, setInputNumber] = useState<string>('10');
  const [currentResult, setCurrentResult] = useState<SequenceResult | null>(null);
  const [history, setHistory] = useState<SequenceResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanIndex, setScanIndex] = useState(0);
  const [soundEnabled] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const scanQueue = [11, 12, 28, 496, 220, 1184, 12496, 1264460, 790, 909, 562, 1064, 1488];

  // --- Audio ---

  useEffect(() => {
    if (soundEnabled && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, [soundEnabled]);

  const playSound = useCallback((type: 'launch' | 'ping' | 'success' | 'crash' | 'alarm') => {
    if (!soundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'launch') {
      // Thruster sweep
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.5);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'ping') {
      // Sonar ping
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'success') {
      // Positive chime
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554, now + 0.1); // C#
      osc.frequency.setValueAtTime(659, now + 0.2); // E
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'crash') {
      // Low boom
      osc.type = 'square';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(20, now + 0.5);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'alarm') {
      // Warning beep
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(600, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  }, [soundEnabled]);

  // --- Logic ---

  const launchProbe = (n: number) => {
    playSound('launch');
    const result = classifySequence(n);
    setCurrentResult(result);
    setHistory(prev => [result, ...prev].slice(0, 10)); // Keep last 10
    
    if (result.classification === 'Terminating') playSound('crash');
    else if (result.classification === 'Non-terminating') playSound('alarm');
    else playSound('success');
  };

  const handleManualLaunch = () => {
    const n = parseInt(inputNumber, 10);
    if (!isNaN(n) && n > 0) {
      launchProbe(n);
    }
  };

  const adjustInput = (delta: number) => {
    const n = parseInt(inputNumber, 10) || 0;
    setInputNumber(Math.max(1, n + delta).toString());
  };

  // --- Auto Scan ---

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (isScanning) {
      timeout = setTimeout(() => {
        if (scanIndex < scanQueue.length) {
          launchProbe(scanQueue[scanIndex]);
          setScanIndex(prev => prev + 1);
        } else {
          setIsScanning(false);
          setScanIndex(0);
        }
      }, 1500); // Delay between scans
    }
    return () => clearTimeout(timeout);
  }, [isScanning, scanIndex, scanQueue]); // Added scanQueue to dependency array, though it's constant

  // --- UI Helpers ---

  const getClassificationColor = (c: Classification) => {
    switch (c) {
      case 'Perfect': return 'text-yellow-400 border-yellow-400 shadow-yellow-400/50';
      case 'Amicable': return 'text-pink-400 border-pink-400 shadow-pink-400/50';
      case 'Sociable': return 'text-purple-400 border-purple-400 shadow-purple-400/50';
      case 'Terminating': return 'text-red-500 border-red-500 shadow-red-500/50';
      case 'Non-terminating': return 'text-blue-400 border-blue-400 shadow-blue-400/50';
      default: return 'text-emerald-400 border-emerald-400 shadow-emerald-400/50';
    }
  };

  const getClassificationIcon = (c: Classification) => {
    switch (c) {
      case 'Terminating': return <XCircle />;
      case 'Non-terminating': return <AlertTriangle />;
      case 'Perfect': return <Disc />;
      case 'Amicable': return <Activity />;
      default: return <CheckCircle2 />;
    }
  };

  return (
    <div className="space-y-6 font-mono bg-[#020617] text-slate-200 p-6 rounded-xl border border-slate-800">
      
      {/* Header / Dashboard */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <Rocket className="text-cyan-400" size={32} />
          <div>
            <h2 className="text-2xl font-bold text-cyan-400 tracking-widest uppercase">Cosmic Aliquot Explorer</h2>
            <div className="text-xs text-slate-500">SYSTEM STATUS: ONLINE // PROBE READY</div>
          </div>
        </div>

        <div className="flex gap-3 bg-slate-900/50 p-2 rounded-lg border border-slate-800">
          <div className="relative flex items-center">
            <style>{`
              input[type=number]::-webkit-inner-spin-button, 
              input[type=number]::-webkit-outer-spin-button { 
                -webkit-appearance: none; 
                margin: 0; 
              }
              input[type=number] {
                -moz-appearance: textfield;
              }
            `}</style>
            <input
              type="number"
              value={inputNumber}
              onChange={(e) => setInputNumber(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-l px-3 py-2 w-28 text-right text-cyan-400 focus:outline-none focus:border-cyan-500 font-mono"
              placeholder="K"
            />
            <div className="flex flex-col h-full">
              <button 
                onClick={() => adjustInput(1)}
                className="bg-slate-900 border-t border-r border-slate-700 hover:bg-slate-800 text-cyan-400 px-1 h-1/2 rounded-tr flex items-center justify-center transition-colors"
              >
                <ChevronUp size={12} />
              </button>
              <button 
                onClick={() => adjustInput(-1)}
                className="bg-slate-900 border-b border-r border-t border-slate-700 hover:bg-slate-800 text-cyan-400 px-1 h-1/2 rounded-br flex items-center justify-center transition-colors"
              >
                <ChevronDown size={12} />
              </button>
            </div>
          </div>
          <button
            onClick={handleManualLaunch}
            disabled={isScanning}
            className="px-4 py-2 bg-cyan-900/30 text-cyan-400 border border-cyan-800 rounded hover:bg-cyan-900/50 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Rocket size={16} /> LAUNCH
          </button>
          <button
            onClick={() => setIsScanning(!isScanning)}
            className={`px-4 py-2 border rounded transition-all flex items-center gap-2 ${
              isScanning 
                ? 'bg-red-900/30 text-red-400 border-red-800 hover:bg-red-900/50' 
                : 'bg-emerald-900/30 text-emerald-400 border-emerald-800 hover:bg-emerald-900/50'
            }`}
          >
            {isScanning ? <Pause size={16} /> : <Play size={16} />}
            {isScanning ? 'ABORT SCAN' : 'AUTO SCAN'}
          </button>
        </div>
      </div>

      {/* Main Display: Trajectory View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Current Probe Telemetry */}
        <div className="lg:col-span-2 bg-slate-950 rounded-xl border border-slate-800 p-6 relative overflow-hidden min-h-[400px] flex flex-col">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black opacity-50 pointer-events-none" />
          
          {/* Starfield Effect */}
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>

          {currentResult ? (
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Target Identifier</div>
                  <div className="text-4xl font-bold text-white">{currentResult.start}</div>
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  key={currentResult.classification}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border bg-slate-900/80 backdrop-blur-md ${getClassificationColor(currentResult.classification)}`}
                >
                  {getClassificationIcon(currentResult.classification)}
                  <span className="font-bold uppercase">{currentResult.classification}</span>
                </motion.div>
              </div>

              {/* Sequence Visualization */}
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-wrap items-center justify-center gap-4 max-w-full">
                  {currentResult.sequence.map((num, idx) => (
                    <motion.div
                      key={`${currentResult.start}-${idx}`}
                      initial={{ opacity: 0, scale: 0, x: -20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center"
                    >
                      {idx > 0 && <div className="w-8 h-0.5 bg-slate-700 mx-2" />}
                      <div className={`
                        relative group cursor-default
                        w-12 h-12 rounded-full flex items-center justify-center border-2 bg-slate-900
                        ${idx === currentResult.sequence.length - 1 ? 'border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'border-slate-700 text-slate-400'}
                      `}>
                        <span className="text-xs font-bold">{num > 9999 ? '...' : num}</span>
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                          {num}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              <div className="mt-8 text-center text-xs text-slate-600 font-mono">
                TRAJECTORY LENGTH: {currentResult.sequence.length} TERMS // MAX VALUE: {Math.max(...currentResult.sequence)}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-600 flex-col gap-4">
              <Rocket size={48} className="opacity-20 animate-pulse" />
              <div className="text-sm tracking-widest">WAITING FOR LAUNCH COMMAND...</div>
            </div>
          )}
        </div>

        {/* Right: Mission Log */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Mission Log</h3>
            <button 
              onClick={() => setHistory([])}
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
            >
              CLEAR
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
            <AnimatePresence>
              {history.map((res, idx) => (
                <motion.div
                  key={`${res.start}-${idx}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-slate-950 p-3 rounded border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group"
                  onClick={() => setCurrentResult(res)}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-white group-hover:text-cyan-400 transition-colors">#{res.start}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getClassificationColor(res.classification).replace('shadow-', '')} bg-opacity-10`}>
                      {res.classification}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 truncate font-mono">
                    {res.sequence.join(' → ')}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {history.length === 0 && (
              <div className="text-center py-8 text-slate-700 text-xs italic">
                No missions recorded.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
