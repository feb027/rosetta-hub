import { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, Trash2, RotateCcw, Wrench, Sparkles, Volume2, VolumeX, Zap, Eye, Code2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface DynamicProperty {
  id: number;
  name: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'function';
  addedAt: number;
}

interface ObjectInstance {
  id: number;
  className: string;
  color: string;
  properties: DynamicProperty[];
}

// --- Constants ---
const PROPERTY_TYPES: Array<{ type: DynamicProperty['type']; color: string; icon: string }> = [
  { type: 'string', color: '#10b981', icon: '"' },
  { type: 'number', color: '#06b6d4', icon: '#' },
  { type: 'boolean', color: '#f59e0b', icon: '?' },
  { type: 'function', color: '#ec4899', icon: 'ƒ' },
];

const OBJECT_COLORS = ['#0891b2', '#059669', '#d97706', '#dc2626'];
const CLASS_NAMES = ['Robot', 'Vehicle', 'Animal', 'Widget'];

const PRESET_PROPERTIES: Array<{ name: string; value: string; type: DynamicProperty['type'] }> = [
  { name: 'nickname', value: '"Sparky"', type: 'string' },
  { name: 'powerLevel', value: '9001', type: 'number' },
  { name: 'isActive', value: 'true', type: 'boolean' },
  { name: 'greet', value: '() => "Hello!"', type: 'function' },
  { name: 'serialNumber', value: '"XJ-9"', type: 'string' },
  { name: 'speed', value: '120', type: 'number' },
  { name: 'canFly', value: 'false', type: 'boolean' },
  { name: 'calculate', value: '(x) => x * 2', type: 'function' },
];

// --- Component ---
export default function AddVariableRuntimeVisualization() {
  const [objects, setObjects] = useState<ObjectInstance[]>([
    { id: 1, className: 'Robot', color: OBJECT_COLORS[0], properties: [] },
  ]);
  const [selectedObject, setSelectedObject] = useState<number>(1);
  const [nextPropId, setNextPropId] = useState(1);
  const [nextObjectId, setNextObjectId] = useState(2);
  const [newPropName, setNewPropName] = useState('');
  const [newPropValue, setNewPropValue] = useState('');
  const [newPropType, setNewPropType] = useState<DynamicProperty['type']>('string');
  const [actionLog, setActionLog] = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showCode, setShowCode] = useState(false);
  const [forgeAnimation, setForgeAnimation] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);


  // --- Audio ---
  const playSound = useCallback((type: 'forge' | 'attach' | 'remove' | 'newObject' | 'error' | 'click') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'forge') {
      // Metallic forging sound - hammer strike
      [800, 600, 400].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.12, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2 + i * 0.08);
        osc.start(now + i * 0.08);
        osc.stop(now + 0.25 + i * 0.08);
      });
    } else if (type === 'attach') {
      // Satisfying click-attach sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'remove') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'newObject') {
      [440, 550, 660, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(0.08, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2 + i * 0.06);
        osc.start(now + i * 0.06);
        osc.stop(now + 0.25 + i * 0.06);
      });
    } else if (type === 'error') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  }, [soundEnabled]);

  // --- Object Operations ---
  const addProperty = useCallback(() => {
    if (!newPropName.trim()) {
      playSound('error');
      setActionLog(prev => ['❌ Property name is required', ...prev.slice(0, 19)]);
      return;
    }

    const obj = objects.find(o => o.id === selectedObject);
    if (!obj) return;

    // Check for duplicate property name
    if (obj.properties.some(p => p.name === newPropName.trim())) {
      playSound('error');
      setActionLog(prev => [`❌ Property "${newPropName}" already exists`, ...prev.slice(0, 19)]);
      return;
    }

    // Trigger forge animation
    setForgeAnimation(true);
    playSound('forge');

    setTimeout(() => {
      const newProp: DynamicProperty = {
        id: nextPropId,
        name: newPropName.trim(),
        value: newPropValue || getDefaultValue(newPropType),
        type: newPropType,
        addedAt: Date.now(),
      };

      setObjects(prev => prev.map(o =>
        o.id === selectedObject
          ? { ...o, properties: [...o.properties, newProp] }
          : o
      ));
      setNextPropId(prev => prev + 1);
      playSound('attach');
      setActionLog(prev => [`✨ Added ${obj.className}.${newProp.name} = ${newProp.value}`, ...prev.slice(0, 19)]);
      setNewPropName('');
      setNewPropValue('');
      setForgeAnimation(false);
    }, 300);
  }, [objects, selectedObject, newPropName, newPropValue, newPropType, nextPropId, playSound]);

  const getDefaultValue = (type: DynamicProperty['type']): string => {
    switch (type) {
      case 'string': return '""';
      case 'number': return '0';
      case 'boolean': return 'false';
      case 'function': return '() => {}';
    }
  };

  const removeProperty = useCallback((propId: number) => {
    const obj = objects.find(o => o.id === selectedObject);
    const prop = obj?.properties.find(p => p.id === propId);
    if (!obj || !prop) return;

    setObjects(prev => prev.map(o =>
      o.id === selectedObject
        ? { ...o, properties: o.properties.filter(p => p.id !== propId) }
        : o
    ));
    playSound('remove');
    setActionLog(prev => [`🗑️ Removed ${obj.className}.${prop.name}`, ...prev.slice(0, 19)]);
  }, [objects, selectedObject, playSound]);

  const addPresetProperty = useCallback((preset: typeof PRESET_PROPERTIES[0]) => {
    const obj = objects.find(o => o.id === selectedObject);
    if (!obj) return;

    if (obj.properties.some(p => p.name === preset.name)) {
      playSound('error');
      setActionLog(prev => [`❌ Property "${preset.name}" already exists`, ...prev.slice(0, 19)]);
      return;
    }

    setForgeAnimation(true);
    playSound('forge');

    setTimeout(() => {
      const newProp: DynamicProperty = {
        id: nextPropId,
        name: preset.name,
        value: preset.value,
        type: preset.type,
        addedAt: Date.now(),
      };

      setObjects(prev => prev.map(o =>
        o.id === selectedObject
          ? { ...o, properties: [...o.properties, newProp] }
          : o
      ));
      setNextPropId(prev => prev + 1);
      playSound('attach');
      setActionLog(prev => [`✨ Added ${obj.className}.${newProp.name} = ${newProp.value}`, ...prev.slice(0, 19)]);
      setForgeAnimation(false);
    }, 300);
  }, [objects, selectedObject, nextPropId, playSound]);

  const createObject = useCallback(() => {
    if (objects.length >= 4) {
      playSound('error');
      setActionLog(prev => ['❌ Maximum 4 objects allowed', ...prev.slice(0, 19)]);
      return;
    }

    const newObj: ObjectInstance = {
      id: nextObjectId,
      className: CLASS_NAMES[(nextObjectId - 1) % CLASS_NAMES.length],
      color: OBJECT_COLORS[(nextObjectId - 1) % OBJECT_COLORS.length],
      properties: [],
    };

    setObjects(prev => [...prev, newObj]);
    setSelectedObject(nextObjectId);
    setNextObjectId(prev => prev + 1);
    playSound('newObject');
    setActionLog(prev => [`🆕 Created new ${newObj.className} instance`, ...prev.slice(0, 19)]);
  }, [objects.length, nextObjectId, playSound]);

  const deleteObject = useCallback((objId: number) => {
    if (objects.length <= 1) {
      playSound('error');
      return;
    }

    const obj = objects.find(o => o.id === objId);
    setObjects(prev => prev.filter(o => o.id !== objId));
    if (selectedObject === objId) {
      setSelectedObject(objects.find(o => o.id !== objId)?.id || 1);
    }
    playSound('remove');
    setActionLog(prev => [`🗑️ Deleted ${obj?.className} instance`, ...prev.slice(0, 19)]);
  }, [objects, selectedObject, playSound]);

  const reset = () => {
    setObjects([{ id: 1, className: 'Robot', color: OBJECT_COLORS[0], properties: [] }]);
    setSelectedObject(1);
    setNextPropId(1);
    setNextObjectId(2);
    setNewPropName('');
    setNewPropValue('');
    setActionLog([]);
    setShowCode(false);
  };


  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'n' || e.key === 'N') createObject();
      if (e.key === 'r' || e.key === 'R') reset();
      if (e.key === 'c' || e.key === 'C') {
        setShowCode(prev => !prev);
        playSound('click');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [createObject, playSound]);

  const currentObject = objects.find(o => o.id === selectedObject);

  // Generate code representation
  const generateCode = (obj: ObjectInstance): string => {
    const lines = [
      `// Create instance`,
      `const ${obj.className.toLowerCase()} = new ${obj.className}();`,
      ``,
    ];
    
    if (obj.properties.length > 0) {
      lines.push(`// Add properties at runtime (monkeypatching)`);
      obj.properties.forEach(prop => {
        lines.push(`${obj.className.toLowerCase()}.${prop.name} = ${prop.value};`);
      });
      lines.push(``);
      lines.push(`// Access the dynamic properties`);
      lines.push(`console.log(${obj.className.toLowerCase()});`);
      lines.push(`// Output: { ${obj.properties.map(p => `${p.name}: ${p.value}`).join(', ')} }`);
    } else {
      lines.push(`// No dynamic properties added yet`);
    }
    
    return lines.join('\n');
  };

  const getTypeColor = (type: DynamicProperty['type']): string => {
    return PROPERTY_TYPES.find(t => t.type === type)?.color || '#64748b';
  };

  const getTypeIcon = (type: DynamicProperty['type']): string => {
    return PROPERTY_TYPES.find(t => t.type === type)?.icon || '?';
  };

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-amber-950/5 to-slate-950 rounded-xl border border-amber-900/30 font-sans overflow-hidden">
      
      {/* Header - Workshop Theme */}
      <div className="bg-slate-900/80 border-b border-amber-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 relative">
              <Wrench className="text-amber-400" size={24} />
              {forgeAnimation && (
                <motion.div
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 bg-amber-500/30 rounded-lg"
                />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-300 tracking-wide">PROPERTY FORGE</h2>
              <p className="text-xs text-amber-500/70">Dynamically Attach Variables at Runtime</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled 
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' 
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button
              onClick={() => { setShowCode(!showCode); playSound('click'); }}
              className={`p-2 rounded-lg border transition-all ${
                showCode 
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' 
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
              title="Toggle Code View"
            >
              <Code2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        
        {/* Object Tabs */}
        <div className="flex flex-wrap gap-2">
          {objects.map(obj => (
            <button
              key={obj.id}
              onClick={() => { setSelectedObject(obj.id); playSound('click'); }}
              className={`relative px-4 py-2 rounded-lg border transition-all ${
                selectedObject === obj.id
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: obj.color }}
                />
                <span className="font-medium text-sm">{obj.className}</span>
                <span className="text-xs opacity-70">({obj.properties.length})</span>
              </div>
            </button>
          ))}
          <button
            onClick={createObject}
            disabled={objects.length >= 4}
            className="px-3 py-2 rounded-lg border border-dashed border-slate-600 text-slate-500 hover:border-amber-500/50 hover:text-amber-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Main Grid - Object Visualization + Code */}
        <div className={`grid gap-6 ${showCode ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
          
          {/* Object Visualization */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(245,158,11,0.03),_transparent_70%)]" />
            
            {/* Object Header */}
            <div className="flex items-center justify-between mb-4 relative">
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold text-white shadow-lg relative"
                  style={{ backgroundColor: currentObject?.color }}
                  animate={forgeAnimation ? { scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {currentObject?.className[0]}
                  <AnimatePresence>
                    {forgeAnimation && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute -top-1 -right-1"
                      >
                        <Sparkles className="text-amber-400" size={16} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                <div>
                  <span className="text-lg font-bold text-slate-200">{currentObject?.className}</span>
                  <div className="text-xs text-slate-500 font-mono">
                    {currentObject?.properties.length} dynamic properties
                  </div>
                </div>
              </div>
              {objects.length > 1 && (
                <button
                  onClick={() => deleteObject(selectedObject)}
                  className="px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-500 text-xs hover:text-red-400 hover:border-red-500/30 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {/* Properties Display */}
            <div className="min-h-[200px] bg-slate-950/50 rounded-lg border border-slate-800 p-3 relative">
              {/* Blueprint grid background */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'linear-gradient(rgba(245,158,11,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.2) 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }} />
              
              <div className="relative space-y-2">
                <AnimatePresence mode="popLayout">
                  {currentObject?.properties.map((prop, idx) => (
                    <motion.div
                      key={prop.id}
                      layout
                      initial={{ scale: 0, opacity: 0, x: -50 }}
                      animate={{ scale: 1, opacity: 1, x: 0 }}
                      exit={{ scale: 0, opacity: 0, x: 50 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30, delay: idx * 0.05 }}
                      className="group flex items-center gap-3 p-3 rounded-lg border transition-all hover:scale-[1.02]"
                      style={{
                        backgroundColor: `${getTypeColor(prop.type)}10`,
                        borderColor: `${getTypeColor(prop.type)}30`,
                      }}
                    >
                      {/* Type Badge */}
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-md"
                        style={{ backgroundColor: getTypeColor(prop.type) }}
                      >
                        {getTypeIcon(prop.type)}
                      </div>
                      
                      {/* Property Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold" style={{ color: getTypeColor(prop.type) }}>
                            .{prop.name}
                          </span>
                          <span className="text-slate-600">=</span>
                          <span className="font-mono text-xs text-slate-400 truncate">
                            {prop.value}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-600 uppercase tracking-wider">
                          {prop.type}
                        </div>
                      </div>
                      
                      {/* Remove Button */}
                      <button
                        onClick={() => removeProperty(prop.id)}
                        className="p-1.5 rounded-lg bg-slate-800/50 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {/* Empty state */}
                {(!currentObject?.properties.length) && (
                  <div className="h-40 flex items-center justify-center text-slate-600 text-sm">
                    <div className="text-center">
                      <Eye size={32} className="mx-auto mb-2 opacity-50" />
                      <p>No dynamic properties</p>
                      <p className="text-xs text-slate-700">Add properties using the forge below</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Code View */}
          <AnimatePresence>
            {showCode && currentObject && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-slate-900/50 rounded-xl border border-emerald-800/30 overflow-hidden"
              >
                <div className="px-4 py-2 border-b border-emerald-800/30 flex items-center gap-2 text-emerald-400 text-xs">
                  <Code2 size={14} />
                  <span>JavaScript / TypeScript</span>
                </div>
                <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto">
                  <code>{generateCode(currentObject)}</code>
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </div>


        {/* Property Forge - Add New Property */}
        <div className="bg-slate-900/30 rounded-xl border border-amber-800/30 p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-orange-500/5" />
          
          <div className="relative">
            <div className="text-xs text-amber-400 mb-3 flex items-center gap-2">
              <Zap size={12} />
              Forge New Property
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Property Name */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 block">Name</label>
                <input
                  ref={inputRef}
                  type="text"
                  value={newPropName}
                  onChange={(e) => setNewPropName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addProperty()}
                  placeholder="propertyName"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm font-mono placeholder:text-slate-600 focus:border-amber-500/50 focus:outline-none transition-colors"
                />
              </div>
              
              {/* Property Value */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 block">Value</label>
                <input
                  type="text"
                  value={newPropValue}
                  onChange={(e) => setNewPropValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addProperty()}
                  placeholder={getDefaultValue(newPropType)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm font-mono placeholder:text-slate-600 focus:border-amber-500/50 focus:outline-none transition-colors"
                />
              </div>
              
              {/* Property Type */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 block">Type</label>
                <div className="flex gap-1">
                  {PROPERTY_TYPES.map(pt => (
                    <button
                      key={pt.type}
                      onClick={() => { setNewPropType(pt.type); playSound('click'); }}
                      className={`flex-1 px-2 py-2 rounded-lg border text-xs font-bold transition-all ${
                        newPropType === pt.type
                          ? 'border-opacity-70 scale-105'
                          : 'border-opacity-30 opacity-60 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: `${pt.color}20`,
                        borderColor: pt.color,
                        color: pt.color,
                      }}
                      title={pt.type}
                    >
                      {pt.icon}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Add Button */}
              <div className="flex items-end">
                <button
                  onClick={addProperty}
                  disabled={!newPropName.trim()}
                  className="w-full py-2 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold text-sm hover:bg-amber-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Wrench size={14} />
                  FORGE
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-slate-500 mb-3 flex items-center gap-2">
            <Sparkles size={12} />
            Quick Presets (click to add)
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_PROPERTIES.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => addPresetProperty(preset)}
                className="px-3 py-1.5 rounded-lg border transition-all hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: `${getTypeColor(preset.type)}10`,
                  borderColor: `${getTypeColor(preset.type)}30`,
                }}
              >
                <span className="font-mono text-xs" style={{ color: getTypeColor(preset.type) }}>
                  .{preset.name}
                </span>
              </button>
            ))}
          </div>
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

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PROPERTY_TYPES.map(pt => {
            const count = objects.reduce((sum, o) => 
              sum + o.properties.filter(p => p.type === pt.type).length, 0
            );
            return (
              <div 
                key={pt.type}
                className="bg-slate-900/30 rounded-lg border border-slate-800 p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div 
                    className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold text-white" 
                    style={{ backgroundColor: pt.color }} 
                  >
                    {pt.icon}
                  </div>
                  <span className="text-xs text-slate-500 uppercase">{pt.type}s</span>
                </div>
                <div className="text-xl font-bold" style={{ color: pt.color }}>{count}</div>
              </div>
            );
          })}
        </div>

        {/* Action Log */}
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
            <kbd className="text-slate-400">Enter</kbd> Add Property
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">N</kbd> New Object
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">C</kbd> Toggle Code
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-amber-400 hover:text-amber-300 transition-colors">
          What is Runtime Property Addition?
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            <span className="text-amber-300">Dynamic property addition</span> (also called "monkeypatching") 
            allows you to add new variables or methods to an object instance after it has been created.
          </p>
          <p>
            <span className="text-amber-300">In JavaScript/TypeScript:</span> Objects are dynamic by nature. 
            You can add properties using bracket notation (<code className="text-emerald-400">obj["prop"] = value</code>) 
            or dot notation (<code className="text-emerald-400">obj.prop = value</code>).
          </p>
          <p>
            <span className="text-amber-300">Use cases:</span> CSV parsers that create properties from headers, 
            plugin systems, mocking in tests, extending third-party objects, and configuration objects.
          </p>
          <p>
            <span className="text-rose-400">Caution:</span> While powerful, excessive monkeypatching can make 
            code harder to understand and maintain. Use TypeScript's index signatures for type safety.
          </p>
        </div>
      </details>
    </div>
  );
}
