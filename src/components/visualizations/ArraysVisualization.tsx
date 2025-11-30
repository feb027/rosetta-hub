import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Plus, Trash2, Edit3, Eye, Database, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Operation = 'create' | 'assign' | 'retrieve' | 'push' | 'idle';

interface MemoryCell {
  address: string;
  value: string;
  index: number;
}

const generateAddress = (base: number, index: number): string => {
  return `0x${(base + index * 4).toString(16).toUpperCase().padStart(4, '0')}`;
};

export default function ArraysVisualization() {
  const [arrayType, setArrayType] = useState<'fixed' | 'dynamic'>('dynamic');
  const [fixedSize, setFixedSize] = useState(5);
  const [cells, setCells] = useState<MemoryCell[]>([]);
  const [currentOp, setCurrentOp] = useState<Operation>('idle');
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newValue, setNewValue] = useState('');
  const [retrievedValue, setRetrievedValue] = useState<string | null>(null);
  const [retrieveIndex, setRetrieveIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [log, setLog] = useState<string[]>([]);
  const [baseAddress] = useState(() => Math.floor(Math.random() * 0x1000) + 0x1000);

  const audioContextRef = useRef<AudioContext | null>(null);


  // --- Audio ---
  const playSound = useCallback((type: 'create' | 'assign' | 'retrieve' | 'push' | 'delete' | 'click' | 'error') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'create') {
      // Rising arpeggio for array creation
      [440, 554, 659, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.08, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3 + i * 0.08);
        osc.start(now + i * 0.08);
        osc.stop(now + 0.35 + i * 0.08);
      });
    } else if (type === 'assign') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.setValueAtTime(800, now + 0.05);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'retrieve') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'push') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'delete') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'error') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  }, [soundEnabled]);

  const addLog = (message: string) => {
    setLog(prev => [...prev.slice(-9), message]);
  };


  // --- Array Operations ---
  const createArray = useCallback(() => {
    setCurrentOp('create');
    const size = arrayType === 'fixed' ? fixedSize : 0;
    const newCells: MemoryCell[] = [];
    
    for (let i = 0; i < size; i++) {
      newCells.push({
        address: generateAddress(baseAddress, i),
        value: 'undefined',
        index: i,
      });
    }
    
    setCells(newCells);
    setRetrievedValue(null);
    setHighlightIndex(null);
    playSound('create');
    addLog(`Created ${arrayType} array${arrayType === 'fixed' ? ` of size ${size}` : ''}`);
    
    setTimeout(() => setCurrentOp('idle'), 500);
  }, [arrayType, fixedSize, baseAddress, playSound]);

  const assignValue = useCallback((index: number, value: string) => {
    if (index < 0 || (arrayType === 'fixed' && index >= cells.length)) {
      playSound('error');
      addLog(`Error: Index ${index} out of bounds`);
      return;
    }
    
    setCurrentOp('assign');
    setHighlightIndex(index);
    
    setCells(prev => {
      const newCells = [...prev];
      if (index < newCells.length) {
        newCells[index] = { ...newCells[index], value };
      }
      return newCells;
    });
    
    playSound('assign');
    addLog(`array[${index}] = "${value}"`);
    
    setTimeout(() => {
      setCurrentOp('idle');
      setHighlightIndex(null);
    }, 600);
  }, [arrayType, cells.length, playSound]);

  const retrieveValue = useCallback((index: number) => {
    if (index < 0 || index >= cells.length) {
      playSound('error');
      addLog(`Error: Index ${index} out of bounds`);
      setRetrievedValue('undefined');
      return;
    }
    
    setCurrentOp('retrieve');
    setHighlightIndex(index);
    
    const value = cells[index]?.value || 'undefined';
    setRetrievedValue(value);
    playSound('retrieve');
    addLog(`Retrieved array[${index}] = "${value}"`);
    
    setTimeout(() => {
      setCurrentOp('idle');
      setHighlightIndex(null);
    }, 600);
  }, [cells, playSound]);

  const pushValue = useCallback((value: string) => {
    if (arrayType === 'fixed') {
      playSound('error');
      addLog('Error: Cannot push to fixed-length array');
      return;
    }
    
    if (cells.length >= 10) {
      playSound('error');
      addLog('Error: Maximum array size reached (10)');
      return;
    }
    
    setCurrentOp('push');
    const newIndex = cells.length;
    setHighlightIndex(newIndex);
    
    setCells(prev => [...prev, {
      address: generateAddress(baseAddress, newIndex),
      value,
      index: newIndex,
    }]);
    
    playSound('push');
    addLog(`array.push("${value}") → length: ${cells.length + 1}`);
    setNewValue('');
    
    setTimeout(() => {
      setCurrentOp('idle');
      setHighlightIndex(null);
    }, 600);
  }, [arrayType, cells.length, baseAddress, playSound]);

  const deleteCell = useCallback((index: number) => {
    if (arrayType === 'fixed') {
      playSound('error');
      addLog('Error: Cannot delete from fixed-length array');
      return;
    }
    
    setCells(prev => prev.filter((_, i) => i !== index).map((cell, i) => ({
      ...cell,
      index: i,
      address: generateAddress(baseAddress, i),
    })));
    
    playSound('delete');
    addLog(`Deleted element at index ${index}`);
  }, [arrayType, baseAddress, playSound]);

  const reset = () => {
    setCells([]);
    setCurrentOp('idle');
    setHighlightIndex(null);
    setRetrievedValue(null);
    setEditIndex(null);
    setLog([]);
  };


  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'c' || e.key === 'C') createArray();
      if (e.key === 'r' || e.key === 'R') reset();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [createArray]);

  const handleEditSubmit = (index: number) => {
    if (editValue.trim()) {
      assignValue(index, editValue.trim());
    }
    setEditIndex(null);
    setEditValue('');
  };

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-teal-950/10 to-slate-950 rounded-xl border border-teal-900/40 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-teal-800/40 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/15 border border-teal-500/40">
              <Database className="text-teal-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-teal-300 tracking-wide">MEMORY BLOCKS</h2>
              <p className="text-xs text-teal-500/70">Array Operations Visualizer</p>
            </div>
          </div>

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

      {/* Main Content */}
      <div className="p-6 space-y-6">
        
        {/* Array Type Selection */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-teal-400 mb-3 flex items-center gap-2">
            <Cpu size={14} />
            Array Configuration
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <button
                onClick={() => { setArrayType('fixed'); playSound('click'); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  arrayType === 'fixed'
                    ? 'bg-teal-500/20 border border-teal-500/50 text-teal-300'
                    : 'bg-slate-800 border border-slate-700 text-slate-400 hover:border-teal-500/30'
                }`}
              >
                Fixed-Length
              </button>
              <button
                onClick={() => { setArrayType('dynamic'); playSound('click'); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  arrayType === 'dynamic'
                    ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-800 border border-slate-700 text-slate-400 hover:border-emerald-500/30'
                }`}
              >
                Dynamic
              </button>
            </div>
            
            {arrayType === 'fixed' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Size:</span>
                <input
                  type="number"
                  value={fixedSize}
                  onChange={(e) => setFixedSize(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                  className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sm text-teal-300 font-mono text-center focus:outline-none focus:border-teal-500"
                  min={1}
                  max={10}
                />
              </div>
            )}
            
            <button
              onClick={createArray}
              className="px-4 py-2 bg-teal-500/20 text-teal-300 border border-teal-500/50 rounded-lg hover:bg-teal-500/30 transition-all flex items-center gap-2 text-sm font-medium"
            >
              <Play size={16} />
              CREATE ARRAY
            </button>
            
            <button
              onClick={reset}
              className="px-3 py-2 bg-slate-800 text-slate-400 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>


        {/* Memory Visualization */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-6 relative overflow-hidden">
          {/* Circuit board pattern background */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(90deg, rgba(20,184,166,0.3) 1px, transparent 1px),
                linear-gradient(rgba(20,184,166,0.3) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
            }} />
          </div>

          {/* Header bar */}
          <div className="relative flex items-center justify-between mb-4 pb-3 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${cells.length > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              <span className="text-xs text-slate-400 font-mono">
                {cells.length > 0 ? `ALLOCATED: ${cells.length} cells` : 'NO ARRAY ALLOCATED'}
              </span>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              BASE: {generateAddress(baseAddress, 0)}
            </div>
          </div>

          {/* Memory Cells Grid */}
          <div className="relative min-h-[200px]">
            {cells.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-500">
                <div className="text-center">
                  <Database size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No array allocated</p>
                  <p className="text-xs text-slate-600 mt-1">Click "CREATE ARRAY" to begin</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 justify-center">
                <AnimatePresence mode="popLayout">
                  {cells.map((cell, idx) => (
                    <motion.div
                      key={`${cell.address}-${idx}`}
                      initial={{ scale: 0, opacity: 0, y: 20 }}
                      animate={{ 
                        scale: 1, 
                        opacity: 1, 
                        y: 0,
                        boxShadow: highlightIndex === idx 
                          ? currentOp === 'retrieve' 
                            ? '0 0 25px rgba(6,182,212,0.6)' 
                            : '0 0 25px rgba(16,185,129,0.6)'
                          : '0 4px 6px rgba(0,0,0,0.3)'
                      }}
                      exit={{ scale: 0, opacity: 0, y: -20 }}
                      transition={{ delay: idx * 0.05, type: 'spring', stiffness: 300 }}
                      layout
                      className="relative group"
                    >
                      {/* Memory Cell */}
                      <div className={`
                        w-28 rounded-lg border-2 transition-all duration-300 overflow-hidden
                        ${highlightIndex === idx 
                          ? currentOp === 'retrieve'
                            ? 'border-cyan-400 bg-cyan-500/10'
                            : 'border-emerald-400 bg-emerald-500/10'
                          : 'border-slate-600 bg-slate-800/80'
                        }
                      `}>
                        {/* Address header */}
                        <div className={`px-2 py-1 text-[10px] font-mono border-b ${
                          highlightIndex === idx 
                            ? currentOp === 'retrieve' ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                            : 'bg-slate-700/50 border-slate-600/50 text-slate-400'
                        }`}>
                          {cell.address}
                        </div>
                        
                        {/* Index badge */}
                        <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-slate-900 border border-slate-600 flex items-center justify-center z-10">
                          <span className="text-xs font-mono text-slate-300">{idx}</span>
                        </div>
                        
                        {/* Value area */}
                        <div className="p-3 min-h-[50px] flex items-center justify-center">
                          {editIndex === idx ? (
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleEditSubmit(idx);
                                if (e.key === 'Escape') { setEditIndex(null); setEditValue(''); }
                              }}
                              onBlur={() => handleEditSubmit(idx)}
                              autoFocus
                              className="w-full px-2 py-1 bg-slate-900 border border-teal-500 rounded text-sm text-center text-teal-300 focus:outline-none"
                              placeholder="value"
                            />
                          ) : (
                            <span className={`text-sm font-mono truncate max-w-full ${
                              cell.value === 'undefined' ? 'text-slate-500 italic' : 'text-slate-200'
                            }`}>
                              {cell.value === 'undefined' ? 'undefined' : `"${cell.value}"`}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons on hover */}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <button
                          onClick={() => { setEditIndex(idx); setEditValue(cell.value === 'undefined' ? '' : cell.value); }}
                          className="p-1.5 bg-teal-500/80 rounded text-white hover:bg-teal-500 transition-colors"
                          title="Edit value"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          onClick={() => retrieveValue(idx)}
                          className="p-1.5 bg-cyan-500/80 rounded text-white hover:bg-cyan-500 transition-colors"
                          title="Retrieve value"
                        >
                          <Eye size={12} />
                        </button>
                        {arrayType === 'dynamic' && (
                          <button
                            onClick={() => deleteCell(idx)}
                            className="p-1.5 bg-rose-500/80 rounded text-white hover:bg-rose-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>


        {/* Operations Panel */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Assign Value */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <div className="text-xs text-emerald-400 mb-3 flex items-center gap-2">
              <Edit3 size={14} />
              Assign Value
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-slate-500 block mb-1">Index</label>
                <input
                  type="number"
                  value={retrieveIndex}
                  onChange={(e) => setRetrieveIndex(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-300 font-mono focus:outline-none focus:border-emerald-500"
                  min={0}
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-slate-500 block mb-1">Value</label>
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newValue.trim()) {
                      assignValue(retrieveIndex, newValue.trim());
                      setNewValue('');
                    }
                  }}
                  placeholder="Enter value"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    if (newValue.trim()) {
                      assignValue(retrieveIndex, newValue.trim());
                      setNewValue('');
                    }
                  }}
                  disabled={!newValue.trim() || cells.length === 0}
                  className="px-4 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 rounded-lg hover:bg-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  SET
                </button>
              </div>
            </div>
          </div>

          {/* Retrieve / Push */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <div className="text-xs text-cyan-400 mb-3 flex items-center gap-2">
              <Eye size={14} />
              Retrieve / Push
            </div>
            <div className="flex gap-2">
              <div className="flex-1 flex gap-2">
                <button
                  onClick={() => retrieveValue(retrieveIndex)}
                  disabled={cells.length === 0}
                  className="flex-1 px-4 py-2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 rounded-lg hover:bg-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Eye size={16} />
                  GET [{retrieveIndex}]
                </button>
              </div>
              {arrayType === 'dynamic' && (
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newValue.trim()) {
                        pushValue(newValue.trim());
                      }
                    }}
                    placeholder="Push value"
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={() => newValue.trim() && pushValue(newValue.trim())}
                    disabled={!newValue.trim() || cells.length >= 10}
                    className="px-4 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/50 rounded-lg hover:bg-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <Plus size={16} />
                    PUSH
                  </button>
                </div>
              )}
            </div>
            
            {/* Retrieved Value Display */}
            <AnimatePresence>
              {retrievedValue !== null && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg"
                >
                  <span className="text-xs text-cyan-400">Retrieved: </span>
                  <span className="text-sm font-mono text-cyan-300">
                    {retrievedValue === 'undefined' ? 'undefined' : `"${retrievedValue}"`}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>


        {/* Code Display */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-teal-400 mb-3">Live Code Preview</div>
          <div className="font-mono text-sm bg-black/30 rounded-lg p-4 overflow-x-auto space-y-1">
            <div className="text-slate-500">
              <span className="text-teal-400">// {arrayType === 'fixed' ? 'Fixed-length' : 'Dynamic'} array</span>
            </div>
            <div>
              <span className="text-cyan-400">const</span>{' '}
              <span className="text-amber-300">array</span>{' '}
              <span className="text-slate-500">=</span>{' '}
              {arrayType === 'fixed' ? (
                <>
                  <span className="text-cyan-400">new</span>{' '}
                  <span className="text-emerald-400">Array</span>
                  <span className="text-slate-300">(</span>
                  <span className="text-amber-300">{fixedSize}</span>
                  <span className="text-slate-300">);</span>
                </>
              ) : (
                <span className="text-slate-300">[];</span>
              )}
            </div>
            {cells.length > 0 && (
              <>
                <div className="text-slate-600 mt-2">// Current state:</div>
                <div>
                  <span className="text-slate-500">// </span>
                  <span className="text-slate-400">[</span>
                  {cells.map((cell, idx) => (
                    <span key={idx}>
                      <span className={cell.value === 'undefined' ? 'text-slate-500' : 'text-emerald-400'}>
                        {cell.value === 'undefined' ? 'undefined' : `"${cell.value}"`}
                      </span>
                      {idx < cells.length - 1 && <span className="text-slate-500">, </span>}
                    </span>
                  ))}
                  <span className="text-slate-400">]</span>
                </div>
                <div className="text-slate-600 mt-1">
                  <span className="text-slate-500">// </span>
                  <span className="text-amber-300">array</span>
                  <span className="text-slate-300">.</span>
                  <span className="text-cyan-300">length</span>
                  <span className="text-slate-500"> = </span>
                  <span className="text-amber-300">{cells.length}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Operation Log */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-slate-400 mb-3 flex items-center justify-between">
            <span>Operation Log</span>
            <span className="text-slate-600">{log.length} entries</span>
          </div>
          <div className="font-mono text-xs bg-black/30 rounded-lg p-3 h-32 overflow-y-auto custom-scrollbar">
            {log.length === 0 ? (
              <span className="text-slate-600">No operations yet...</span>
            ) : (
              log.map((entry, idx) => (
                <div key={idx} className={`py-0.5 ${
                  entry.includes('Error') ? 'text-rose-400' : 
                  entry.includes('Created') ? 'text-teal-400' :
                  entry.includes('Retrieved') ? 'text-cyan-400' :
                  entry.includes('push') ? 'text-amber-400' :
                  entry.includes('Deleted') ? 'text-rose-400' :
                  'text-emerald-400'
                }`}>
                  <span className="text-slate-600">[{idx + 1}]</span> {entry}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Type</div>
            <div className={`text-lg font-bold ${arrayType === 'fixed' ? 'text-teal-400' : 'text-emerald-400'}`}>
              {arrayType === 'fixed' ? 'Fixed' : 'Dynamic'}
            </div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Length</div>
            <div className="text-lg font-bold text-cyan-400 font-mono">{cells.length}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Defined</div>
            <div className="text-lg font-bold text-emerald-400 font-mono">
              {cells.filter(c => c.value !== 'undefined').length}
            </div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Undefined</div>
            <div className="text-lg font-bold text-slate-400 font-mono">
              {cells.filter(c => c.value === 'undefined').length}
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">C</kbd> Create
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Enter</kbd> Submit
          </span>
        </div>
      </div>


      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-teal-400 hover:text-teal-300 transition-colors">
          About Arrays
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            <span className="text-teal-300">Arrays</span> are fundamental data structures that store 
            elements in contiguous memory locations, allowing O(1) access by index.
          </p>
          <p>
            <span className="text-emerald-300">Fixed-length arrays</span> have a predetermined size 
            set at creation. Elements are initialized to <code className="text-slate-300">undefined</code>.
          </p>
          <p>
            <span className="text-amber-300">Dynamic arrays</span> can grow and shrink. Use 
            <code className="text-cyan-300"> push()</code> to add elements and access by index.
          </p>
          <p>
            <span className="text-cyan-300">Key operations:</span> Create, Assign (set value at index), 
            Retrieve (get value at index), Push (add to end).
          </p>
        </div>
      </details>
    </div>
  );
}
