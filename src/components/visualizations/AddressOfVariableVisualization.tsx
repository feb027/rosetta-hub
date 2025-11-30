import { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, Trash2, RotateCcw, Cpu, Volume2, VolumeX, ArrowRight, Link2, Unlink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface MemoryCell {
  address: string;
  value: string | number;
  type: 'int' | 'float' | 'char' | 'string';
  varName: string;
  color: string;
}

interface Pointer {
  id: number;
  name: string;
  targetAddress: string | null;
  color: string;
}

// --- Constants ---
const TYPE_COLORS: Record<string, string> = {
  int: '#06b6d4',
  float: '#10b981',
  char: '#f59e0b',
  string: '#ec4899',
};

const POINTER_COLORS = ['#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

const generateAddress = (): string => {
  return '0x' + Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
};

// --- Component ---
export default function AddressOfVariableVisualization() {
  const [memory, setMemory] = useState<MemoryCell[]>([
    { address: '0x1000', value: 42, type: 'int', varName: 'x', color: TYPE_COLORS.int },
    { address: '0x1004', value: 3.14, type: 'float', varName: 'pi', color: TYPE_COLORS.float },
    { address: '0x1008', value: 'A', type: 'char', varName: 'ch', color: TYPE_COLORS.char },
  ]);
  const [pointers, setPointers] = useState<Pointer[]>([
    { id: 1, name: 'ptr', targetAddress: '0x1000', color: POINTER_COLORS[0] },
  ]);
  const [nextPointerId, setNextPointerId] = useState(2);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [selectedPointer, setSelectedPointer] = useState<number | null>(null);
  const [newVarName, setNewVarName] = useState('');
  const [newVarValue, setNewVarValue] = useState('');
  const [newVarType, setNewVarType] = useState<'int' | 'float' | 'char' | 'string'>('int');
  const [actionLog, setActionLog] = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [highlightedAddress, setHighlightedAddress] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);


  // --- Audio ---
  const playSound = useCallback((type: 'allocate' | 'pointer' | 'link' | 'unlink' | 'delete' | 'click' | 'error') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'allocate') {
      [400, 500, 600].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0.1, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15 + i * 0.05);
        osc.start(now + i * 0.05);
        osc.stop(now + 0.2 + i * 0.05);
      });
    } else if (type === 'pointer') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'link') {
      [523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(0.1, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2 + i * 0.06);
        osc.start(now + i * 0.06);
        osc.stop(now + 0.25 + i * 0.06);
      });
    } else if (type === 'unlink') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'delete') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.start(now);
      osc.stop(now + 0.03);
    } else if (type === 'error') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  }, [soundEnabled]);

  // --- Memory Operations ---
  const allocateVariable = useCallback(() => {
    if (!newVarName.trim()) {
      playSound('error');
      setActionLog(prev => ['❌ Variable name required', ...prev.slice(0, 19)]);
      return;
    }
    if (memory.some(m => m.varName === newVarName.trim())) {
      playSound('error');
      setActionLog(prev => [`❌ Variable "${newVarName}" already exists`, ...prev.slice(0, 19)]);
      return;
    }
    if (memory.length >= 8) {
      playSound('error');
      setActionLog(prev => ['❌ Memory full (max 8 cells)', ...prev.slice(0, 19)]);
      return;
    }

    const address = generateAddress();
    let value: string | number = newVarValue || '0';
    if (newVarType === 'int') value = parseInt(value as string) || 0;
    else if (newVarType === 'float') value = parseFloat(value as string) || 0.0;
    else if (newVarType === 'char') value = (value as string)[0] || '?';

    const newCell: MemoryCell = {
      address,
      value,
      type: newVarType,
      varName: newVarName.trim(),
      color: TYPE_COLORS[newVarType],
    };

    setMemory(prev => [...prev, newCell]);
    playSound('allocate');
    setActionLog(prev => [`📦 Allocated ${newVarType} ${newVarName} at ${address}`, ...prev.slice(0, 19)]);
    setNewVarName('');
    setNewVarValue('');
    setHighlightedAddress(address);
    setTimeout(() => setHighlightedAddress(null), 1000);
  }, [memory, newVarName, newVarValue, newVarType, playSound]);

  const deleteVariable = useCallback((address: string) => {
    const cell = memory.find(m => m.address === address);
    if (!cell) return;

    // Unlink any pointers pointing to this address
    setPointers(prev => prev.map(p => 
      p.targetAddress === address ? { ...p, targetAddress: null } : p
    ));
    setMemory(prev => prev.filter(m => m.address !== address));
    playSound('delete');
    setActionLog(prev => [`🗑️ Freed ${cell.varName} at ${address}`, ...prev.slice(0, 19)]);
    setSelectedCell(null);
  }, [memory, playSound]);

  const createPointer = useCallback(() => {
    if (pointers.length >= 4) {
      playSound('error');
      setActionLog(prev => ['❌ Max 4 pointers allowed', ...prev.slice(0, 19)]);
      return;
    }

    const newPointer: Pointer = {
      id: nextPointerId,
      name: `ptr${nextPointerId}`,
      targetAddress: null,
      color: POINTER_COLORS[(nextPointerId - 1) % POINTER_COLORS.length],
    };

    setPointers(prev => [...prev, newPointer]);
    setNextPointerId(prev => prev + 1);
    playSound('pointer');
    setActionLog(prev => [`🔗 Created pointer ${newPointer.name}`, ...prev.slice(0, 19)]);
  }, [pointers.length, nextPointerId, playSound]);

  const linkPointer = useCallback((pointerId: number, address: string) => {
    const pointer = pointers.find(p => p.id === pointerId);
    const cell = memory.find(m => m.address === address);
    if (!pointer || !cell) return;

    setPointers(prev => prev.map(p =>
      p.id === pointerId ? { ...p, targetAddress: address } : p
    ));
    playSound('link');
    setActionLog(prev => [`🔗 ${pointer.name} = &${cell.varName} (${address})`, ...prev.slice(0, 19)]);
    setSelectedPointer(null);
    setSelectedCell(null);
  }, [pointers, memory, playSound]);

  const unlinkPointer = useCallback((pointerId: number) => {
    const pointer = pointers.find(p => p.id === pointerId);
    if (!pointer) return;

    setPointers(prev => prev.map(p =>
      p.id === pointerId ? { ...p, targetAddress: null } : p
    ));
    playSound('unlink');
    setActionLog(prev => [`🔓 ${pointer.name} = NULL`, ...prev.slice(0, 19)]);
  }, [pointers, playSound]);

  const deletePointer = useCallback((pointerId: number) => {
    const pointer = pointers.find(p => p.id === pointerId);
    if (!pointer) return;

    setPointers(prev => prev.filter(p => p.id !== pointerId));
    playSound('delete');
    setActionLog(prev => [`🗑️ Deleted pointer ${pointer.name}`, ...prev.slice(0, 19)]);
    setSelectedPointer(null);
  }, [pointers, playSound]);

  const reset = () => {
    setMemory([
      { address: '0x1000', value: 42, type: 'int', varName: 'x', color: TYPE_COLORS.int },
      { address: '0x1004', value: 3.14, type: 'float', varName: 'pi', color: TYPE_COLORS.float },
      { address: '0x1008', value: 'A', type: 'char', varName: 'ch', color: TYPE_COLORS.char },
    ]);
    setPointers([{ id: 1, name: 'ptr', targetAddress: '0x1000', color: POINTER_COLORS[0] }]);
    setNextPointerId(2);
    setSelectedCell(null);
    setSelectedPointer(null);
    setActionLog([]);
    setNewVarName('');
    setNewVarValue('');
  };

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'r' || e.key === 'R') reset();
      if (e.key === 'p' || e.key === 'P') createPointer();
      if (e.key === 'Escape') {
        setSelectedCell(null);
        setSelectedPointer(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [createPointer]);

  // Get dereferenced value for a pointer
  const getDereferencedValue = (pointer: Pointer): string => {
    if (!pointer.targetAddress) return 'NULL';
    const cell = memory.find(m => m.address === pointer.targetAddress);
    return cell ? String(cell.value) : 'INVALID';
  };


  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-rose-950/5 to-slate-950 rounded-xl border border-rose-900/30 font-sans overflow-hidden">
      
      {/* Header - Memory Inspector Theme */}
      <div className="bg-slate-900/80 border-b border-rose-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30">
              <Cpu className="text-rose-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-rose-300 tracking-wide">MEMORY INSPECTOR</h2>
              <p className="text-xs text-rose-500/70">Addresses, Pointers & References</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled 
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' 
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <div className="text-xs text-rose-400/70 bg-rose-950/30 px-3 py-2 rounded-lg border border-rose-800/30">
              Cells: <span className="text-rose-300 font-bold">{memory.length}</span> / 8
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        
        {/* Instruction Banner */}
        {selectedPointer && !selectedCell && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-center text-sm text-rose-300"
          >
            Click a memory cell to link pointer <span className="font-bold">{pointers.find(p => p.id === selectedPointer)?.name}</span> to it
          </motion.div>
        )}

        {/* Memory Grid */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(244,63,94,0.03),_transparent_70%)]" />
          
          <div className="flex items-center justify-between mb-4 relative">
            <div className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              RAM Memory
            </div>
            <div className="text-xs text-slate-500 font-mono">
              {memory.length * 4} bytes allocated
            </div>
          </div>

          {/* Memory Cells */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative">
            <AnimatePresence mode="popLayout">
              {memory.map((cell) => {
                const pointersToThis = pointers.filter(p => p.targetAddress === cell.address);
                const isHighlighted = highlightedAddress === cell.address;
                const isSelected = selectedCell === cell.address;
                
                return (
                  <motion.div
                    key={cell.address}
                    layout
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className={`relative group cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-rose-500 ring-offset-2 ring-offset-slate-900' : ''
                    } ${isHighlighted ? 'animate-pulse' : ''}`}
                    onClick={() => {
                      if (selectedPointer) {
                        linkPointer(selectedPointer, cell.address);
                      } else {
                        setSelectedCell(isSelected ? null : cell.address);
                        playSound('click');
                      }
                    }}
                  >
                    {/* Pointer indicators */}
                    {pointersToThis.length > 0 && (
                      <div className="absolute -top-2 -right-2 flex gap-0.5 z-10">
                        {pointersToThis.map(ptr => (
                          <div
                            key={ptr.id}
                            className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-lg"
                            style={{ backgroundColor: ptr.color }}
                            title={`${ptr.name} points here`}
                          >
                            →
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div
                      className="p-3 rounded-lg border-2 transition-all hover:scale-105"
                      style={{
                        backgroundColor: `${cell.color}10`,
                        borderColor: isSelected ? cell.color : `${cell.color}40`,
                      }}
                    >
                      {/* Address */}
                      <div className="text-[10px] font-mono text-slate-500 mb-1">
                        {cell.address}
                      </div>
                      
                      {/* Variable Name */}
                      <div className="text-xs font-bold mb-1" style={{ color: cell.color }}>
                        {cell.varName}
                      </div>
                      
                      {/* Value */}
                      <div className="text-lg font-mono font-bold text-slate-200 truncate">
                        {cell.type === 'char' ? `'${cell.value}'` : cell.value}
                      </div>
                      
                      {/* Type Badge */}
                      <div 
                        className="mt-2 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded inline-block"
                        style={{ backgroundColor: `${cell.color}30`, color: cell.color }}
                      >
                        {cell.type}
                      </div>
                    </div>
                    
                    {/* Delete button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteVariable(cell.address); }}
                      className="absolute top-1 right-1 p-1 rounded bg-slate-800/80 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-rose-400 transition-all"
                    >
                      <Trash2 size={10} />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {/* Empty slots */}
            {Array.from({ length: Math.max(0, 4 - memory.length) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="p-3 rounded-lg border-2 border-dashed border-slate-800 bg-slate-900/30 flex items-center justify-center min-h-[100px]"
              >
                <span className="text-xs text-slate-700">Empty</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pointers Section */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <Link2 size={16} className="text-rose-400" />
              Pointers
            </div>
            <button
              onClick={createPointer}
              disabled={pointers.length >= 4}
              className="px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-bold hover:bg-rose-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Plus size={12} />
              New Pointer
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {pointers.map((pointer) => {
                const targetCell = memory.find(m => m.address === pointer.targetAddress);
                const isSelected = selectedPointer === pointer.id;
                
                return (
                  <motion.div
                    key={pointer.id}
                    layout
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      isSelected 
                        ? 'ring-2 ring-rose-500 ring-offset-2 ring-offset-slate-900' 
                        : ''
                    }`}
                    style={{
                      backgroundColor: `${pointer.color}10`,
                      borderColor: `${pointer.color}40`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: pointer.color }}
                        />
                        <span className="font-mono font-bold text-sm" style={{ color: pointer.color }}>
                          {pointer.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {pointer.targetAddress && (
                          <button
                            onClick={() => unlinkPointer(pointer.id)}
                            className="p-1 rounded bg-slate-800/80 text-slate-500 hover:text-amber-400 transition-all"
                            title="Unlink"
                          >
                            <Unlink size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => deletePointer(pointer.id)}
                          className="p-1 rounded bg-slate-800/80 text-slate-500 hover:text-rose-400 transition-all"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Pointer Value (Address) */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500">stores:</span>
                      <span className="font-mono text-slate-300">
                        {pointer.targetAddress || 'NULL'}
                      </span>
                    </div>
                    
                    {/* Dereferenced Value */}
                    <div className="flex items-center gap-2 text-xs mt-1">
                      <span className="text-slate-500">*{pointer.name} =</span>
                      <span className={`font-mono font-bold ${
                        pointer.targetAddress ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {getDereferencedValue(pointer)}
                      </span>
                    </div>
                    
                    {/* Target Info */}
                    {targetCell && (
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
                        <ArrowRight size={10} />
                        <span>points to <span className="text-slate-300">{targetCell.varName}</span></span>
                      </div>
                    )}
                    
                    {/* Link Button */}
                    <button
                      onClick={() => {
                        setSelectedPointer(isSelected ? null : pointer.id);
                        setSelectedCell(null);
                        playSound('click');
                      }}
                      className={`mt-2 w-full py-1.5 rounded text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                          : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:border-rose-500/30 hover:text-rose-300'
                      }`}
                    >
                      {isSelected ? 'Click a cell to link...' : 'Link to Address'}
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>


        {/* Allocate New Variable */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-slate-500 mb-3 flex items-center gap-2">
            <Plus size={12} />
            Allocate New Variable
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 block">Name</label>
              <input
                type="text"
                value={newVarName}
                onChange={(e) => setNewVarName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && allocateVariable()}
                placeholder="varName"
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm font-mono placeholder:text-slate-600 focus:border-rose-500/50 focus:outline-none transition-colors"
              />
            </div>
            
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 block">Value</label>
              <input
                type="text"
                value={newVarValue}
                onChange={(e) => setNewVarValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && allocateVariable()}
                placeholder="0"
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm font-mono placeholder:text-slate-600 focus:border-rose-500/50 focus:outline-none transition-colors"
              />
            </div>
            
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 block">Type</label>
              <div className="flex gap-1">
                {(['int', 'float', 'char', 'string'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => { setNewVarType(type); playSound('click'); }}
                    className={`flex-1 px-2 py-2 rounded-lg border text-xs font-bold transition-all ${
                      newVarType === type
                        ? 'border-opacity-70 scale-105'
                        : 'border-opacity-30 opacity-60 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: `${TYPE_COLORS[type]}20`,
                      borderColor: TYPE_COLORS[type],
                      color: TYPE_COLORS[type],
                    }}
                  >
                    {type[0].toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={allocateVariable}
                disabled={!newVarName.trim() || memory.length >= 8}
                className="w-full py-2 rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-300 font-bold text-sm hover:bg-rose-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus size={14} />
                ALLOCATE
              </button>
            </div>
          </div>
        </div>

        {/* Code Preview */}
        <div className="bg-slate-900/30 rounded-xl border border-emerald-800/30 overflow-hidden">
          <div className="px-4 py-2 border-b border-emerald-800/30 text-xs text-emerald-400 flex items-center gap-2">
            <span className="font-mono">C-style Code</span>
          </div>
          <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto">
            <code>
{memory.map(cell => {
  const typeStr = cell.type === 'string' ? 'char*' : cell.type;
  const valStr = cell.type === 'char' ? `'${cell.value}'` : 
                 cell.type === 'string' ? `"${cell.value}"` : cell.value;
  return `${typeStr} ${cell.varName} = ${valStr};  // at ${cell.address}`;
}).join('\n')}

{pointers.length > 0 && '\n// Pointers'}
{pointers.map(ptr => {
  const target = memory.find(m => m.address === ptr.targetAddress);
  if (target) {
    return `${target.type}* ${ptr.name} = &${target.varName};  // ${ptr.name} = ${ptr.targetAddress}`;
  }
  return `void* ${ptr.name} = NULL;`;
}).join('\n')}

{pointers.filter(p => p.targetAddress).length > 0 && '\n// Dereferencing'}
{pointers.filter(p => p.targetAddress).map(ptr => {
  const target = memory.find(m => m.address === ptr.targetAddress);
  if (target) {
    return `*${ptr.name} == ${target.value}  // true`;
  }
  return '';
}).filter(Boolean).join('\n')}
            </code>
          </pre>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={reset}
            className="px-4 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all flex items-center gap-2"
          >
            <RotateCcw size={18} />
            Reset
          </button>
        </div>

        {/* Activity Log */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-800 text-xs text-slate-500 flex items-center justify-between">
            <span>Activity Log</span>
            <span className="text-slate-600">{actionLog.length} events</span>
          </div>
          <div className="max-h-32 overflow-y-auto custom-scrollbar">
            {actionLog.length === 0 ? (
              <div className="px-4 py-3 text-xs text-slate-600 text-center">
                No activity yet
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {actionLog.slice(0, 10).map((log, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="px-4 py-2 text-xs text-slate-400 font-mono"
                  >
                    {log}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">P</kbd> New Pointer
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Esc</kbd> Deselect
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-rose-400 hover:text-rose-300 transition-colors">
          What is a Memory Address?
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            A <span className="text-rose-300">memory address</span> is a unique identifier for a location 
            in computer memory where data is stored. Think of it like a house address for your data.
          </p>
          <p>
            <span className="text-rose-300">Getting an address:</span> In C, use the <code className="text-cyan-400">&</code> operator: 
            <code className="text-cyan-400 ml-1">int* ptr = &x;</code> stores x's address in ptr.
          </p>
          <p>
            <span className="text-rose-300">Dereferencing:</span> Use <code className="text-cyan-400">*</code> to access the value 
            at an address: <code className="text-cyan-400 ml-1">*ptr</code> gives you the value of x.
          </p>
          <p>
            <span className="text-amber-400">Note:</span> JavaScript doesn't expose raw memory addresses, 
            but this visualization simulates the concept for educational purposes.
          </p>
        </div>
      </details>
    </div>
  );
}
