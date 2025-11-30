import { useState, useRef, useCallback, useEffect } from 'react';
import { RotateCcw, Volume2, VolumeX, Plus, Trash2, Zap, Database, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface KeyValue {
  key: string;
  value: string;
}

interface MergeStep {
  type: 'base' | 'override' | 'new';
  key: string;
  value: string;
  fromBase?: string;
}

// --- Presets ---
const PRESETS = {
  classic: {
    name: 'Classic',
    base: [
      { key: 'name', value: 'Rocket Skates' },
      { key: 'price', value: '12.75' },
      { key: 'color', value: 'yellow' },
    ],
    update: [
      { key: 'price', value: '15.25' },
      { key: 'color', value: 'red' },
      { key: 'year', value: '1974' },
    ],
  },
  config: {
    name: 'Config',
    base: [
      { key: 'host', value: 'localhost' },
      { key: 'port', value: '3000' },
      { key: 'debug', value: 'false' },
    ],
    update: [
      { key: 'port', value: '8080' },
      { key: 'debug', value: 'true' },
    ],
  },
  user: {
    name: 'User Data',
    base: [
      { key: 'id', value: '42' },
      { key: 'role', value: 'guest' },
      { key: 'theme', value: 'light' },
    ],
    update: [
      { key: 'role', value: 'admin' },
      { key: 'theme', value: 'dark' },
      { key: 'verified', value: 'true' },
    ],
  },
};

export default function AssociativeArrayMergingVisualization() {
  const [baseArray, setBaseArray] = useState<KeyValue[]>(PRESETS.classic.base);
  const [updateArray, setUpdateArray] = useState<KeyValue[]>(PRESETS.classic.update);
  const [mergedArray, setMergedArray] = useState<MergeStep[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showAddBase, setShowAddBase] = useState(false);
  const [showAddUpdate, setShowAddUpdate] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const audioContextRef = useRef<AudioContext | null>(null);
  const mergeIntervalRef = useRef<number>(0);

  // --- Audio ---
  const playSound = useCallback((type: 'merge' | 'override' | 'new' | 'complete' | 'click' | 'add' | 'remove') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'merge') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.setValueAtTime(500, now + 0.05);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'override') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.setValueAtTime(800, now + 0.08);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'new') {
      [500, 700].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(0.06, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1 + i * 0.06);
        osc.start(now + i * 0.06);
        osc.stop(now + 0.15 + i * 0.06);
      });
    } else if (type === 'complete') {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.08, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3 + i * 0.1);
        osc.start(now + i * 0.1);
        osc.stop(now + 0.4 + i * 0.1);
      });
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.start(now);
      osc.stop(now + 0.03);
    } else if (type === 'add') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.setValueAtTime(900, now + 0.05);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'remove') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.setValueAtTime(200, now + 0.1);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  }, [soundEnabled]);


  // --- Merge Logic ---
  const startMerge = useCallback(() => {
    setIsMerging(true);
    setMergedArray([]);
    setHighlightedKey(null);

    // Build merge steps
    const steps: MergeStep[] = [];
    const updateKeys = new Set(updateArray.map(u => u.key));

    // First, add base items (mark if they'll be overridden)
    baseArray.forEach(item => {
      if (updateKeys.has(item.key)) {
        const updateItem = updateArray.find(u => u.key === item.key)!;
        steps.push({ type: 'override', key: item.key, value: updateItem.value, fromBase: item.value });
      } else {
        steps.push({ type: 'base', key: item.key, value: item.value });
      }
    });

    // Then add new items from update
    updateArray.forEach(item => {
      const baseKeys = new Set(baseArray.map(b => b.key));
      if (!baseKeys.has(item.key)) {
        steps.push({ type: 'new', key: item.key, value: item.value });
      }
    });

    let idx = 0;
    mergeIntervalRef.current = window.setInterval(() => {
      if (idx < steps.length) {
        const currentStep = steps[idx];
        setHighlightedKey(currentStep.key);
        setMergedArray(prev => [...prev, currentStep]);
        
        if (currentStep.type === 'base') playSound('merge');
        else if (currentStep.type === 'override') playSound('override');
        else playSound('new');
        
        idx++;
      } else {
        clearInterval(mergeIntervalRef.current);
        setIsMerging(false);
        setHighlightedKey(null);
        playSound('complete');
      }
    }, 600);
  }, [baseArray, updateArray, playSound]);

  const reset = () => {
    clearInterval(mergeIntervalRef.current);
    setIsMerging(false);
    setMergedArray([]);
    setHighlightedKey(null);
  };

  const applyPreset = (key: keyof typeof PRESETS) => {
    setBaseArray([...PRESETS[key].base]);
    setUpdateArray([...PRESETS[key].update]);
    reset();
    playSound('click');
  };

  const addToBase = () => {
    if (newKey.trim() && newValue.trim()) {
      setBaseArray(prev => [...prev, { key: newKey.trim(), value: newValue.trim() }]);
      setNewKey('');
      setNewValue('');
      setShowAddBase(false);
      reset();
      playSound('add');
    }
  };

  const addToUpdate = () => {
    if (newKey.trim() && newValue.trim()) {
      setUpdateArray(prev => [...prev, { key: newKey.trim(), value: newValue.trim() }]);
      setNewKey('');
      setNewValue('');
      setShowAddUpdate(false);
      reset();
      playSound('add');
    }
  };

  const removeFromBase = (index: number) => {
    setBaseArray(prev => prev.filter((_, i) => i !== index));
    reset();
    playSound('remove');
  };

  const removeFromUpdate = (index: number) => {
    setUpdateArray(prev => prev.filter((_, i) => i !== index));
    reset();
    playSound('remove');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!isMerging) startMerge(); }
      if (e.key === 'r' || e.key === 'R') reset();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [startMerge, isMerging]);

  useEffect(() => {
    return () => clearInterval(mergeIntervalRef.current);
  }, []);

  // Check if key exists in update array
  const isOverridden = (key: string) => updateArray.some(u => u.key === key);
  const isNewKey = (key: string) => !baseArray.some(b => b.key === key);

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-teal-950/10 to-slate-950 rounded-xl border border-teal-900/40 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950/30 to-slate-900 border-b border-teal-500/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2 rounded-lg bg-teal-500/20 border border-teal-500/50">
                <Database className="text-teal-400" size={24} />
              </div>
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-teal-400 rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-teal-300 tracking-wider">DATA FUSION LAB</h2>
              <p className="text-xs text-teal-500/70">Associative Array Merger</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled 
                  ? 'bg-teal-500/20 border-teal-500/50 text-teal-300' 
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Presets */}
      <div className="px-6 py-3 border-b border-slate-800/50 bg-slate-900/30">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Presets:</span>
          {Object.entries(PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => applyPreset(key as keyof typeof PRESETS)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                JSON.stringify(baseArray) === JSON.stringify(preset.base)
                  ? 'bg-teal-500/20 border-teal-500/50 text-teal-300'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-teal-500/30 hover:text-teal-300'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>


      {/* Main Content */}
      <div className="p-6 space-y-6">
        
        {/* Input Arrays - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Base Array */}
          <div className="bg-slate-900/50 rounded-xl border border-cyan-900/50 overflow-hidden">
            <div className="px-4 py-3 bg-cyan-950/30 border-b border-cyan-900/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-500/50 border border-cyan-400" />
                <span className="text-sm font-bold text-cyan-300">BASE</span>
                <span className="text-xs text-cyan-500/70">({baseArray.length} items)</span>
              </div>
              <button
                onClick={() => { setShowAddBase(!showAddBase); setShowAddUpdate(false); }}
                className="p-1.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-all"
              >
                <Plus size={14} />
              </button>
            </div>
            
            <div className="p-3 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {baseArray.map((item, idx) => (
                <motion.div
                  key={`base-${item.key}-${idx}`}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0,
                    scale: highlightedKey === item.key ? 1.02 : 1,
                  }}
                  className={`group flex items-center gap-2 p-2 rounded-lg border transition-all ${
                    highlightedKey === item.key
                      ? 'bg-cyan-500/20 border-cyan-500/50'
                      : isOverridden(item.key)
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/30'
                  }`}
                >
                  <div className="flex-1 flex items-center gap-2 font-mono text-sm">
                    <span className="text-cyan-400">{item.key}</span>
                    <span className="text-slate-600">:</span>
                    <span className={`${isOverridden(item.key) ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                      "{item.value}"
                    </span>
                  </div>
                  {isOverridden(item.key) && (
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">OVERRIDE</span>
                  )}
                  <button
                    onClick={() => removeFromBase(idx)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-500 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </motion.div>
              ))}
              
              {/* Add form */}
              <AnimatePresence>
                {showAddBase && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex gap-2 p-2 bg-slate-800/50 rounded-lg border border-cyan-500/30">
                      <input
                        type="text"
                        placeholder="key"
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                        className="flex-1 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sm text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                      />
                      <input
                        type="text"
                        placeholder="value"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        className="flex-1 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        onClick={addToBase}
                        className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/50 rounded text-cyan-300 text-sm hover:bg-cyan-500/30 transition-all"
                      >
                        Add
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Update Array */}
          <div className="bg-slate-900/50 rounded-xl border border-amber-900/50 overflow-hidden">
            <div className="px-4 py-3 bg-amber-950/30 border-b border-amber-900/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500/50 border border-amber-400" />
                <span className="text-sm font-bold text-amber-300">UPDATE</span>
                <span className="text-xs text-amber-500/70">({updateArray.length} items)</span>
              </div>
              <button
                onClick={() => { setShowAddUpdate(!showAddUpdate); setShowAddBase(false); }}
                className="p-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all"
              >
                <Plus size={14} />
              </button>
            </div>
            
            <div className="p-3 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {updateArray.map((item, idx) => (
                <motion.div
                  key={`update-${item.key}-${idx}`}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0,
                    scale: highlightedKey === item.key ? 1.02 : 1,
                  }}
                  className={`group flex items-center gap-2 p-2 rounded-lg border transition-all ${
                    highlightedKey === item.key
                      ? 'bg-amber-500/20 border-amber-500/50'
                      : isNewKey(item.key)
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-slate-800/50 border-slate-700/50 hover:border-amber-500/30'
                  }`}
                >
                  <div className="flex-1 flex items-center gap-2 font-mono text-sm">
                    <span className="text-amber-400">{item.key}</span>
                    <span className="text-slate-600">:</span>
                    <span className="text-slate-300">"{item.value}"</span>
                  </div>
                  {isNewKey(item.key) && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">NEW</span>
                  )}
                  <button
                    onClick={() => removeFromUpdate(idx)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-500 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </motion.div>
              ))}
              
              {/* Add form */}
              <AnimatePresence>
                {showAddUpdate && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex gap-2 p-2 bg-slate-800/50 rounded-lg border border-amber-500/30">
                      <input
                        type="text"
                        placeholder="key"
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                        className="flex-1 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sm text-amber-300 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                      />
                      <input
                        type="text"
                        placeholder="value"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        className="flex-1 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={addToUpdate}
                        className="px-3 py-1 bg-amber-500/20 border border-amber-500/50 rounded text-amber-300 text-sm hover:bg-amber-500/30 transition-all"
                      >
                        Add
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Merge Button */}
        <div className="flex justify-center">
          <div className="flex items-center gap-4">
            <button
              onClick={startMerge}
              disabled={isMerging}
              className={`px-8 py-3 rounded-xl font-bold flex items-center gap-3 transition-all ${
                isMerging
                  ? 'bg-teal-500/10 text-teal-400/50 border border-teal-500/30 cursor-wait'
                  : 'bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-300 border border-teal-500/50 hover:from-teal-500/30 hover:to-cyan-500/30 hover:shadow-lg hover:shadow-teal-500/20'
              }`}
            >
              {isMerging ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Zap size={20} />
                  </motion.div>
                  MERGING...
                </>
              ) : (
                <>
                  <Zap size={20} />
                  MERGE ARRAYS
                  <ArrowRight size={18} />
                </>
              )}
            </button>
            <button
              onClick={reset}
              className="p-3 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-slate-300 transition-all"
            >
              <RotateCcw size={20} />
            </button>
          </div>
        </div>


        {/* Merged Result */}
        <div className="bg-slate-900/50 rounded-xl border border-emerald-900/50 overflow-hidden">
          <div className="px-4 py-3 bg-emerald-950/30 border-b border-emerald-900/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div 
                className="w-3 h-3 rounded-full bg-emerald-500/50 border border-emerald-400"
                animate={isMerging ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.5, repeat: isMerging ? Infinity : 0 }}
              />
              <span className="text-sm font-bold text-emerald-300">MERGED RESULT</span>
              <span className="text-xs text-emerald-500/70">({mergedArray.length} items)</span>
            </div>
            {mergedArray.length > 0 && !isMerging && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full"
              >
                ✓ Complete
              </motion.span>
            )}
          </div>
          
          <div className="p-4 min-h-[120px]">
            {mergedArray.length === 0 ? (
              <div className="h-24 flex flex-col items-center justify-center text-slate-500">
                <Database size={32} className="mb-2 opacity-30" />
                <p className="text-sm">Click MERGE to combine arrays</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {mergedArray.filter(Boolean).map((item, idx) => (
                  <motion.div
                    key={`merged-${item.key}-${idx}`}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`relative p-3 rounded-lg border overflow-hidden ${
                      item.type === 'base'
                        ? 'bg-cyan-500/10 border-cyan-500/30'
                        : item.type === 'override'
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-emerald-500/10 border-emerald-500/30'
                    }`}
                  >
                    {/* Type indicator */}
                    <div className={`absolute top-0 right-0 px-2 py-0.5 text-[9px] font-bold rounded-bl ${
                      item.type === 'base'
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : item.type === 'override'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {item.type === 'base' ? 'BASE' : item.type === 'override' ? 'UPDATED' : 'NEW'}
                    </div>
                    
                    <div className="font-mono">
                      <div className={`text-sm font-bold ${
                        item.type === 'base' ? 'text-cyan-300' : item.type === 'override' ? 'text-amber-300' : 'text-emerald-300'
                      }`}>
                        {item.key}
                      </div>
                      <div className="text-slate-300 text-sm mt-1">"{item.value}"</div>
                      
                      {/* Show old value for overrides */}
                      {item.type === 'override' && item.fromBase && (
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <span className="line-through">"{item.fromBase}"</span>
                          <ArrowRight size={10} />
                          <span className="text-amber-400">"{item.value}"</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Code Preview */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
          <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700/50 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
            </div>
            <span className="text-xs text-slate-500 font-mono ml-2">merge.js</span>
          </div>
          <div className="p-4 font-mono text-xs overflow-x-auto">
            <div className="text-slate-500">// JavaScript spread operator</div>
            <div>
              <span className="text-cyan-400">const</span>
              <span className="text-slate-300"> merged </span>
              <span className="text-slate-500">=</span>
              <span className="text-slate-300"> {'{'} </span>
              <span className="text-amber-400">...base</span>
              <span className="text-slate-500">,</span>
              <span className="text-emerald-400"> ...update</span>
              <span className="text-slate-300"> {'}'}</span>
              <span className="text-slate-500">;</span>
            </div>
            <div className="mt-3 text-slate-500">// Result:</div>
            <div className="text-slate-300">
              {'{'}{' '}
              {mergedArray.filter(Boolean).map((item, idx) => (
                <span key={idx}>
                  <span className={
                    item.type === 'base' ? 'text-cyan-400' : item.type === 'override' ? 'text-amber-400' : 'text-emerald-400'
                  }>{item.key}</span>
                  <span className="text-slate-500">:</span>
                  <span className="text-slate-300"> "{item.value}"</span>
                  {idx < mergedArray.length - 1 && <span className="text-slate-500">, </span>}
                </span>
              ))}
              {mergedArray.length === 0 && <span className="text-slate-600">...</span>}
              {' }'}
            </div>
          </div>
        </div>

        {/* Legend & Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-cyan-500/10 rounded-lg border border-cyan-500/30 p-3 text-center">
            <div className="text-2xl font-bold text-cyan-400">
              {mergedArray.filter(m => m && m.type === 'base').length}
            </div>
            <div className="text-xs text-cyan-300/70">Kept from Base</div>
          </div>
          <div className="bg-amber-500/10 rounded-lg border border-amber-500/30 p-3 text-center">
            <div className="text-2xl font-bold text-amber-400">
              {mergedArray.filter(m => m && m.type === 'override').length}
            </div>
            <div className="text-xs text-amber-300/70">Overridden</div>
          </div>
          <div className="bg-emerald-500/10 rounded-lg border border-emerald-500/30 p-3 text-center">
            <div className="text-2xl font-bold text-emerald-400">
              {mergedArray.filter(m => m && m.type === 'new').length}
            </div>
            <div className="text-xs text-emerald-300/70">New Keys</div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Space</kbd> Merge
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-teal-400 hover:text-teal-300 transition-colors">
          How does array merging work?
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            <span className="text-teal-300">Associative array merging</span> combines two key-value collections 
            into one. The <span className="text-cyan-300">base</span> array provides default values, while the 
            <span className="text-amber-300"> update</span> array overrides matching keys.
          </p>
          <p>
            In JavaScript, this is commonly done with the spread operator: <code className="text-slate-300 bg-slate-800 px-1 rounded">{'{...base, ...update}'}</code>
          </p>
          <p>
            <span className="text-emerald-300">New keys</span> from the update array are added to the result. 
            The original arrays remain unchanged (immutable operation).
          </p>
        </div>
      </details>
    </div>
  );
}
