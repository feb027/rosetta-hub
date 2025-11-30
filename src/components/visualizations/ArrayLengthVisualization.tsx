import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Plus, Trash2, Container, ScanLine } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Preset arrays
const PRESETS = [
  { name: 'Fruits', items: ['apple', 'orange'] },
  { name: 'Numbers', items: ['1', '2', '3', '4', '5'] },
  { name: 'Empty', items: [] },
  { name: 'Single', items: ['lonely'] },
  { name: 'Colors', items: ['red', 'green', 'blue', 'yellow', 'cyan'] },
  { name: 'Mixed', items: ['hello', '42', 'true', 'π', '🚀', 'world'] },
];

// Container colors for variety
const CONTAINER_COLORS = [
  'from-sky-500 to-sky-600',
  'from-amber-500 to-amber-600',
  'from-emerald-500 to-emerald-600',
  'from-rose-500 to-rose-600',
  'from-cyan-500 to-cyan-600',
  'from-orange-500 to-orange-600',
];

export default function ArrayLengthVisualization() {
  const [items, setItems] = useState<string[]>(['apple', 'orange']);
  const [newItem, setNewItem] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanIndex, setScanIndex] = useState(-1);
  const [countedLength, setCountedLength] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const scanIntervalRef = useRef<number>(0);


  // --- Audio ---
  const playSound = useCallback((type: 'scan' | 'complete' | 'add' | 'remove' | 'beep') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'scan') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(1000, now + 0.05);
      gain.gain.setValueAtTime(0.05, now);
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
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + i * 0.1);
        osc.start(now + i * 0.1);
        osc.stop(now + 0.6 + i * 0.1);
      });
    } else if (type === 'add') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'remove') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.1);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'beep') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  }, [soundEnabled]);

  // --- Scan Animation ---
  const startScan = useCallback(() => {
    if (isScanning) return;
    setIsScanning(true);
    setScanIndex(-1);
    setCountedLength(null);

    let idx = 0;
    scanIntervalRef.current = window.setInterval(() => {
      if (idx < items.length) {
        setScanIndex(idx);
        playSound('scan');
        idx++;
      } else {
        clearInterval(scanIntervalRef.current);
        setIsScanning(false);
        setCountedLength(items.length);
        playSound('complete');
      }
    }, 400);
  }, [items.length, isScanning, playSound]);

  // --- Item Management ---
  const addItem = () => {
    if (newItem.trim() && items.length < 10) {
      setItems([...items, newItem.trim()]);
      setNewItem('');
      setCountedLength(null);
      setScanIndex(-1);
      playSound('add');
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    setCountedLength(null);
    setScanIndex(-1);
    playSound('remove');
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setItems([...preset.items]);
    setCountedLength(null);
    setScanIndex(-1);
    playSound('beep');
  };

  const reset = () => {
    clearInterval(scanIntervalRef.current);
    setIsScanning(false);
    setScanIndex(-1);
    setCountedLength(null);
    setItems(['apple', 'orange']);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ') { e.preventDefault(); startScan(); }
      if (e.key === 'r' || e.key === 'R') reset();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [startScan]);

  // Cleanup
  useEffect(() => {
    return () => clearInterval(scanIntervalRef.current);
  }, []);


  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-sky-950/20 to-slate-950 rounded-xl border border-sky-900/40 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-sky-800/40 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/15 border border-sky-500/40">
              <Container className="text-sky-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-sky-300 tracking-wide">CARGO YARD SCANNER</h2>
              <p className="text-xs text-sky-500/70">Array Length Counter</p>
            </div>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border transition-all ${
              soundEnabled 
                ? 'bg-sky-500/20 border-sky-500/50 text-sky-300' 
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        
        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-slate-500 self-center">Presets:</span>
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(preset)}
              className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-xs text-slate-400 hover:text-sky-300 hover:border-sky-500/50 transition-all"
            >
              {preset.name} [{preset.items.length}]
            </button>
          ))}
        </div>

        {/* Container Yard Visualization */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-6 relative overflow-hidden">
          {/* Ground pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(56,189,248,0.3) 40px, rgba(56,189,248,0.3) 42px)',
            }} />
          </div>

          {/* Scanner beam */}
          <AnimatePresence>
            {isScanning && (
              <motion.div
                className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-400 z-20 shadow-lg shadow-emerald-500/50"
                initial={{ left: '0%' }}
                animate={{ left: `${items.length > 0 ? ((scanIndex + 1) / items.length) * 100 : 0}%` }}
                transition={{ duration: 0.3 }}
              />
            )}
          </AnimatePresence>

          {/* Scanner header */}
          <div className="relative flex items-center justify-between mb-4 pb-3 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <ScanLine size={16} className={isScanning ? 'text-emerald-400 animate-pulse' : 'text-slate-500'} />
              <span className="text-xs text-slate-400 font-mono">
                {isScanning ? `SCANNING... [${scanIndex + 1}/${items.length}]` : 'READY TO SCAN'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              <span className="text-xs text-slate-500">STATUS</span>
            </div>
          </div>

          {/* Containers Grid */}
          <div className="relative min-h-[160px]">
            {items.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-slate-500">
                <div className="text-center">
                  <Container size={48} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Empty yard - no containers</p>
                  <p className="text-xs text-slate-600">Length = 0</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 justify-center">
                {items.map((item, idx) => (
                  <motion.div
                    key={`${item}-${idx}`}
                    initial={{ scale: 0, y: 20 }}
                    animate={{ 
                      scale: 1, 
                      y: 0,
                      boxShadow: scanIndex === idx ? '0 0 20px rgba(52,211,153,0.5)' : '0 4px 6px rgba(0,0,0,0.3)'
                    }}
                    exit={{ scale: 0, y: -20 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`relative group`}
                  >
                    {/* Container */}
                    <div className={`
                      w-24 h-20 rounded-lg bg-gradient-to-br ${CONTAINER_COLORS[idx % CONTAINER_COLORS.length]}
                      border-2 transition-all duration-300
                      ${scanIndex === idx ? 'border-emerald-400 ring-2 ring-emerald-400/50' : 'border-white/20'}
                      ${scanIndex > idx ? 'opacity-60' : 'opacity-100'}
                    `}>
                      {/* Container ridges */}
                      <div className="absolute inset-x-2 top-2 bottom-2 flex flex-col justify-between">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="h-0.5 bg-black/20 rounded" />
                        ))}
                      </div>
                      
                      {/* Content label */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white font-bold text-sm truncate px-2 drop-shadow-lg">
                          {item}
                        </span>
                      </div>

                      {/* Index badge */}
                      <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-slate-900 border border-slate-600 flex items-center justify-center">
                        <span className="text-xs font-mono text-slate-300">{idx}</span>
                      </div>

                      {/* Scanned checkmark */}
                      <AnimatePresence>
                        {scanIndex >= idx && countedLength === null && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center"
                          >
                            <span className="text-white text-xs">✓</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => removeItem(idx)}
                      disabled={isScanning}
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 p-1 bg-red-500/80 rounded-full text-white transition-all disabled:opacity-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Result Display */}
        <AnimatePresence>
          {countedLength !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-emerald-500/10 rounded-xl border border-emerald-500/40 p-6 text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(52,211,153,0.1),_transparent_70%)]" />
              <div className="relative">
                <div className="text-sm text-emerald-400 mb-2">SCAN COMPLETE</div>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-slate-400 font-mono">array.length =</span>
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-5xl font-bold text-emerald-400"
                  >
                    {countedLength}
                  </motion.span>
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  {countedLength === 0 ? 'Empty array' : `${countedLength} container${countedLength !== 1 ? 's' : ''} counted`}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        <div className="flex gap-3">
          <button
            onClick={startScan}
            disabled={isScanning}
            className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
              isScanning
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 cursor-wait'
                : 'bg-sky-500/20 text-sky-300 border border-sky-500/50 hover:bg-sky-500/30'
            }`}
          >
            {isScanning ? (
              <>
                <ScanLine size={18} className="animate-pulse" />
                SCANNING...
              </>
            ) : (
              <>
                <Play size={18} />
                COUNT LENGTH
              </>
            )}
          </button>
          <button
            onClick={reset}
            className="px-4 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        {/* Add Item Section */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-sky-400 mb-3">Add Container to Array</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
              placeholder="Enter item value..."
              maxLength={20}
              className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
            />
            <button
              onClick={addItem}
              disabled={!newItem.trim() || items.length >= 10}
              className="px-4 py-2 bg-sky-500/20 text-sky-300 border border-sky-500/50 rounded-lg hover:bg-sky-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus size={18} />
              ADD
            </button>
          </div>
          <div className="text-xs text-slate-600 mt-2">
            {items.length}/10 containers • Press Enter to add
          </div>
        </div>

        {/* Code Display */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-sky-400 mb-3">Code Representation</div>
          <div className="font-mono text-sm bg-black/30 rounded-lg p-3 overflow-x-auto">
            <div className="text-slate-500">
              <span className="text-sky-400">const</span>{' '}
              <span className="text-amber-300">array</span>{' '}
              <span className="text-slate-500">=</span>{' '}
              <span className="text-slate-300">[</span>
              {items.map((item, idx) => (
                <span key={idx}>
                  <span className="text-emerald-400">'{item}'</span>
                  {idx < items.length - 1 && <span className="text-slate-500">, </span>}
                </span>
              ))}
              <span className="text-slate-300">];</span>
            </div>
            <div className="mt-2 text-slate-500">
              <span className="text-sky-400">console</span>
              <span className="text-slate-300">.</span>
              <span className="text-amber-300">log</span>
              <span className="text-slate-300">(</span>
              <span className="text-amber-300">array</span>
              <span className="text-slate-300">.</span>
              <span className="text-cyan-300">length</span>
              <span className="text-slate-300">);</span>
              <span className="text-slate-600"> // {items.length}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Elements</div>
            <div className="text-2xl font-bold text-sky-400 font-mono">{items.length}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">First Index</div>
            <div className="text-2xl font-bold text-amber-400 font-mono">{items.length > 0 ? '0' : '—'}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Last Index</div>
            <div className="text-2xl font-bold text-emerald-400 font-mono">{items.length > 0 ? items.length - 1 : '—'}</div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Space</kbd> Scan
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Enter</kbd> Add item
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-sky-400 hover:text-sky-300 transition-colors">
          About Array Length
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            <span className="text-sky-300">Array length</span> is a fundamental property that returns 
            the number of elements in an array. It's essential for loops, bounds checking, and understanding data size.
          </p>
          <p>
            <span className="text-amber-300">Zero-indexed:</span> Arrays start at index 0, so the last 
            element is at index <code className="text-emerald-300">length - 1</code>.
          </p>
          <p>
            <span className="text-emerald-300">Time complexity:</span> O(1) — accessing the length property 
            is instant as it's stored with the array, not calculated.
          </p>
        </div>
      </details>
    </div>
  );
}
