import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scan, Search, CheckCircle2, XCircle, Play, RotateCcw, History } from 'lucide-react';

type ScanStatus = 'idle' | 'scanning' | 'success' | 'error';

export default function ABCWordsVisualization() {
  const [input, setInput] = useState("AMBULANCE");
  const [scanIndex, setScanIndex] = useState(-1);
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [foundIndices, setFoundIndices] = useState<{ a: number; b: number; c: number }>({ a: -1, b: -1, c: -1 });
  const [history, setHistory] = useState<string[]>([]);

  const scanSpeed = 150; // ms per char

  const handleScan = () => {
    if (!input) return;
    setStatus('scanning');
    setScanIndex(-1);
    setFoundIndices({ a: -1, b: -1, c: -1 });
  };

  useEffect(() => {
    if (status !== 'scanning') return;

    let currentIndex = -1;
    let found = { a: -1, b: -1, c: -1 };
    
    const interval = setInterval(() => {
      currentIndex++;
      setScanIndex(currentIndex);

      if (currentIndex >= input.length) {
        clearInterval(interval);
        // Final check
        if (found.a !== -1 && found.b !== -1 && found.c !== -1) {
          setStatus('success');
          if (!history.includes(input)) setHistory(prev => [input, ...prev].slice(0, 5));
        } else {
          setStatus('error');
        }
        return;
      }

      const char = input[currentIndex].toLowerCase();

      // Logic: Only consider FIRST occurrence
      if (char === 'a' && found.a === -1) {
        found.a = currentIndex;
        setFoundIndices(prev => ({ ...prev, a: currentIndex }));
      } else if (char === 'b' && found.b === -1) {
        if (found.a === -1) {
          // B found before A -> Fail immediately
          setStatus('error');
          clearInterval(interval);
        } else {
          found.b = currentIndex;
          setFoundIndices(prev => ({ ...prev, b: currentIndex }));
        }
      } else if (char === 'c' && found.c === -1) {
        if (found.b === -1) {
           // C found before B -> Fail immediately
           setStatus('error');
           clearInterval(interval);
        } else {
          found.c = currentIndex;
          setFoundIndices(prev => ({ ...prev, c: currentIndex }));
        }
      }

    }, scanSpeed);

    return () => clearInterval(interval);
  }, [status, input]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Scanner Bed */}
      <div className="relative h-64 glass rounded-3xl border border-slate-700/50 overflow-hidden flex flex-col items-center justify-center p-8">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.5)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20" />
        
        {/* Status Overlay */}
        <div className="absolute top-6 right-6">
           <StatusBadge status={status} />
        </div>

        {/* The Word Display */}
        <div className="relative z-10 flex gap-2 text-4xl font-black font-mono tracking-wider">
          {input.split('').map((char, index) => {
            let colorClass = "text-slate-600";
            if (index === foundIndices.a) colorClass = "text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]";
            if (index === foundIndices.b) colorClass = "text-magenta-400 drop-shadow-[0_0_10px_rgba(232,121,249,0.8)]"; // Using magenta-400 equivalent
            if (index === foundIndices.c) colorClass = "text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]";
            
            // Specific fix for magenta since tailwind might not have 'text-magenta-400' by default, using fuchsia
            if (index === foundIndices.b) colorClass = "text-fuchsia-400 drop-shadow-[0_0_10px_rgba(232,121,249,0.8)]";

            const isScanned = index <= scanIndex;
            const isCurrent = index === scanIndex;

            return (
              <div key={index} className="relative">
                <span className={`transition-colors duration-200 ${colorClass} ${!isScanned && status === 'scanning' ? 'opacity-30' : 'opacity-100'}`}>
                  {char}
                </span>
                
                {/* Laser Scanner Effect */}
                {isCurrent && status === 'scanning' && (
                  <motion.div 
                    layoutId="scanner"
                    className="absolute -inset-y-4 -inset-x-1 bg-emerald-500/20 border-x border-emerald-500/50 z-20"
                  >
                    <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-b from-transparent via-emerald-500/30 to-transparent" />
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress Indicators */}
        <div className="absolute bottom-8 flex gap-12">
          <Indicator label="A" active={foundIndices.a !== -1} color="cyan" />
          <Indicator label="B" active={foundIndices.b !== -1} color="fuchsia" />
          <Indicator label="C" active={foundIndices.c !== -1} color="yellow" />
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <Search size={18} className="text-emerald-400" />
              Input Word
            </h3>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''));
                setStatus('idle');
                setScanIndex(-1);
                setFoundIndices({ a: -1, b: -1, c: -1 });
              }}
              disabled={status === 'scanning'}
              className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono tracking-widest focus:outline-none focus:border-emerald-500/50 transition-all disabled:opacity-50"
              placeholder="TYPE HERE..."
            />
            <button
              onClick={handleScan}
              disabled={status === 'scanning' || !input}
              className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all bg-emerald-500 hover:bg-emerald-600 text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'scanning' ? <Scan size={18} className="animate-spin" /> : <Play size={18} />}
              SCAN
            </button>
          </div>
        </div>

        {/* History */}
        <div className="glass rounded-xl p-4 border border-slate-700/50">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-3">
            <History size={14} />
            Recent Discoveries
          </h3>
          <div className="flex flex-wrap gap-2">
            {history.length === 0 ? (
              <span className="text-slate-600 text-sm italic">No valid ABC words found yet...</span>
            ) : (
              history.map((word, i) => (
                <span key={i} className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/20">
                  {word}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

function Indicator({ label, active, color }: { label: string, active: boolean, color: string }) {
  const colorClasses = {
    cyan: 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.6)]',
    fuchsia: 'bg-fuchsia-500 shadow-[0_0_15px_rgba(232,121,249,0.6)]',
    yellow: 'bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]'
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-4 h-4 rounded-full transition-all duration-300 ${active ? colorClasses[color as keyof typeof colorClasses] : 'bg-slate-800'}`} />
      <span className={`text-xs font-bold font-mono ${active ? 'text-white' : 'text-slate-600'}`}>{label}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: ScanStatus }) {
  if (status === 'idle') return null;
  
  if (status === 'scanning') {
    return (
      <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold flex items-center gap-2 animate-pulse">
        <Scan size={14} />
        SCANNING...
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
        <CheckCircle2 size={14} />
        ABC WORD CONFIRMED
      </div>
    );
  }

  return (
    <div className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-2">
      <XCircle size={14} />
      SEQUENCE ERROR
    </div>
  );
}
