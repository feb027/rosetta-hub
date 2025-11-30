import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Layers, Box, Zap, Check, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Type Definitions ---
interface Method {
  name: string;
  params: string;
  returnType: string;
  implemented: boolean;
  body?: string;
}

interface TypeDefinition {
  id: string;
  name: string;
  kind: 'interface' | 'abstract' | 'concrete';
  methods: Method[];
  extends?: string;
  implements?: string;
  x: number;
  y: number;
  color: string;
}

// --- Preset Examples ---
const PRESETS: { name: string; types: TypeDefinition[] }[] = [
  {
    name: 'Shape Hierarchy',
    types: [
      {
        id: 'shape',
        name: 'Shape',
        kind: 'interface',
        methods: [
          { name: 'area', params: '', returnType: 'number', implemented: false },
          { name: 'perimeter', params: '', returnType: 'number', implemented: false },
        ],
        x: 200,
        y: 40,
        color: '#06b6d4',
      },
      {
        id: 'polygon',
        name: 'Polygon',
        kind: 'abstract',
        methods: [
          { name: 'area', params: '', returnType: 'number', implemented: false },
          { name: 'perimeter', params: '', returnType: 'number', implemented: true, body: 'sum(sides)' },
          { name: 'getSides', params: '', returnType: 'number[]', implemented: false },
        ],
        implements: 'shape',
        x: 200,
        y: 160,
        color: '#f59e0b',
      },
      {
        id: 'rectangle',
        name: 'Rectangle',
        kind: 'concrete',
        methods: [
          { name: 'area', params: '', returnType: 'number', implemented: true, body: 'w * h' },
          { name: 'perimeter', params: '', returnType: 'number', implemented: true, body: '2*(w+h)' },
          { name: 'getSides', params: '', returnType: 'number[]', implemented: true, body: '[w,h,w,h]' },
        ],
        extends: 'polygon',
        x: 80,
        y: 300,
        color: '#10b981',
      },
      {
        id: 'triangle',
        name: 'Triangle',
        kind: 'concrete',
        methods: [
          { name: 'area', params: '', returnType: 'number', implemented: true, body: '0.5*b*h' },
          { name: 'perimeter', params: '', returnType: 'number', implemented: true, body: 'a+b+c' },
          { name: 'getSides', params: '', returnType: 'number[]', implemented: true, body: '[a,b,c]' },
        ],
        extends: 'polygon',
        x: 320,
        y: 300,
        color: '#10b981',
      },
    ],
  },
  {
    name: 'Animal Kingdom',
    types: [
      {
        id: 'animal',
        name: 'Animal',
        kind: 'interface',
        methods: [
          { name: 'speak', params: '', returnType: 'string', implemented: false },
          { name: 'move', params: '', returnType: 'void', implemented: false },
        ],
        x: 200,
        y: 40,
        color: '#06b6d4',
      },
      {
        id: 'mammal',
        name: 'Mammal',
        kind: 'abstract',
        methods: [
          { name: 'speak', params: '', returnType: 'string', implemented: false },
          { name: 'move', params: '', returnType: 'void', implemented: true, body: 'walk()' },
          { name: 'breathe', params: '', returnType: 'void', implemented: true, body: 'lungs()' },
        ],
        implements: 'animal',
        x: 200,
        y: 160,
        color: '#f59e0b',
      },
      {
        id: 'dog',
        name: 'Dog',
        kind: 'concrete',
        methods: [
          { name: 'speak', params: '', returnType: 'string', implemented: true, body: '"Woof!"' },
          { name: 'move', params: '', returnType: 'void', implemented: true, body: 'run()' },
          { name: 'breathe', params: '', returnType: 'void', implemented: true, body: 'lungs()' },
        ],
        extends: 'mammal',
        x: 80,
        y: 300,
        color: '#10b981',
      },
      {
        id: 'cat',
        name: 'Cat',
        kind: 'concrete',
        methods: [
          { name: 'speak', params: '', returnType: 'string', implemented: true, body: '"Meow!"' },
          { name: 'move', params: '', returnType: 'void', implemented: true, body: 'prowl()' },
          { name: 'breathe', params: '', returnType: 'void', implemented: true, body: 'lungs()' },
        ],
        extends: 'mammal',
        x: 320,
        y: 300,
        color: '#10b981',
      },
    ],
  },
  {
    name: 'Vehicle System',
    types: [
      {
        id: 'vehicle',
        name: 'Vehicle',
        kind: 'interface',
        methods: [
          { name: 'start', params: '', returnType: 'void', implemented: false },
          { name: 'stop', params: '', returnType: 'void', implemented: false },
        ],
        x: 200,
        y: 40,
        color: '#06b6d4',
      },
      {
        id: 'motorized',
        name: 'Motorized',
        kind: 'abstract',
        methods: [
          { name: 'start', params: '', returnType: 'void', implemented: true, body: 'ignition()' },
          { name: 'stop', params: '', returnType: 'void', implemented: true, body: 'brake()' },
          { name: 'refuel', params: 'type', returnType: 'void', implemented: false },
        ],
        implements: 'vehicle',
        x: 200,
        y: 160,
        color: '#f59e0b',
      },
      {
        id: 'car',
        name: 'Car',
        kind: 'concrete',
        methods: [
          { name: 'start', params: '', returnType: 'void', implemented: true, body: 'ignition()' },
          { name: 'stop', params: '', returnType: 'void', implemented: true, body: 'brake()' },
          { name: 'refuel', params: 'type', returnType: 'void', implemented: true, body: 'gas()' },
        ],
        extends: 'motorized',
        x: 80,
        y: 300,
        color: '#10b981',
      },
      {
        id: 'electric',
        name: 'ElectricCar',
        kind: 'concrete',
        methods: [
          { name: 'start', params: '', returnType: 'void', implemented: true, body: 'power()' },
          { name: 'stop', params: '', returnType: 'void', implemented: true, body: 'regen()' },
          { name: 'refuel', params: 'type', returnType: 'void', implemented: true, body: 'charge()' },
        ],
        extends: 'motorized',
        x: 320,
        y: 300,
        color: '#10b981',
      },
    ],
  },
];

// --- Component ---
export default function AbstractTypeVisualization() {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [types, setTypes] = useState<TypeDefinition[]>(PRESETS[0].types);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [animatingType, setAnimatingType] = useState<string | null>(null);
  const [phase, setPhase] = useState<'idle' | 'building' | 'done'>('idle');
  const [builtTypes, setBuiltTypes] = useState<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showCode, setShowCode] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number>(0);

  // --- Audio ---
  const playSound = useCallback((type: 'interface' | 'abstract' | 'concrete' | 'connect' | 'complete' | 'select') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'interface') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'abstract') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'concrete') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'connect') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'select') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'complete') {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        gain.gain.setValueAtTime(0.1, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35 + i * 0.12);
        osc.start(now + i * 0.12);
        osc.stop(now + 0.5 + i * 0.12);
      });
    }
  }, [soundEnabled]);

  // --- Build Animation ---
  const runBuild = useCallback(() => {
    setPhase('building');
    setBuiltTypes(new Set());
    setSelectedType(null);

    const buildOrder = types.slice().sort((a, b) => a.y - b.y);
    let idx = 0;

    const buildStep = () => {
      if (idx < buildOrder.length) {
        const t = buildOrder[idx];
        setAnimatingType(t.id);
        playSound(t.kind);
        
        setTimeout(() => {
          setBuiltTypes(prev => new Set([...prev, t.id]));
          if (t.implements || t.extends) {
            playSound('connect');
          }
          idx++;
          animationRef.current = window.setTimeout(buildStep, 600);
        }, 300);
      } else {
        setAnimatingType(null);
        setPhase('done');
        playSound('complete');
      }
    };

    buildStep();
  }, [types, playSound]);

  const reset = () => {
    clearTimeout(animationRef.current);
    setPhase('idle');
    setBuiltTypes(new Set());
    setAnimatingType(null);
    setSelectedType(null);
  };

  const changePreset = (idx: number) => {
    reset();
    setSelectedPreset(idx);
    setTypes(PRESETS[idx].types);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (phase === 'idle' || phase === 'done') runBuild();
      }
      if (e.key === 'r' || e.key === 'R') reset();
      if (e.key === 'c' || e.key === 'C') setShowCode(prev => !prev);
      if (e.key === 'Escape') setSelectedType(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, runBuild]);

  // Get type by id
  const getTypeById = (id: string) => types.find(t => t.id === id);

  // Generate code for a type
  const generateCode = (t: TypeDefinition): string => {
    const methodsCode = t.methods.map(m => {
      if (t.kind === 'interface') {
        return `  ${m.name}(${m.params}): ${m.returnType};`;
      } else if (!m.implemented) {
        return `  abstract ${m.name}(${m.params}): ${m.returnType};`;
      } else {
        return `  ${m.name}(${m.params}): ${m.returnType} { return ${m.body || '...'} }`;
      }
    }).join('\n');

    if (t.kind === 'interface') {
      return `interface ${t.name} {\n${methodsCode}\n}`;
    } else if (t.kind === 'abstract') {
      const ext = t.implements ? ` implements ${getTypeById(t.implements)?.name || t.implements}` : '';
      return `abstract class ${t.name}${ext} {\n${methodsCode}\n}`;
    } else {
      const ext = t.extends ? ` extends ${getTypeById(t.extends)?.name || t.extends}` : '';
      return `class ${t.name}${ext} {\n${methodsCode}\n}`;
    }
  };

  // Render connection lines
  const renderConnections = () => {
    return types.map(t => {
      const parentId = t.implements || t.extends;
      if (!parentId) return null;
      const parent = getTypeById(parentId);
      if (!parent) return null;
      
      const isBuilt = builtTypes.has(t.id) && builtTypes.has(parentId);
      const isDashed = t.implements !== undefined;
      
      return (
        <motion.g key={`conn-${t.id}`}>
          <motion.line
            x1={parent.x + 70}
            y1={parent.y + 80}
            x2={t.x + 70}
            y2={t.y}
            stroke={isBuilt ? (isDashed ? '#06b6d4' : '#f59e0b') : '#334155'}
            strokeWidth={isBuilt ? 3 : 2}
            strokeDasharray={isDashed ? '8 4' : undefined}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: isBuilt ? 1 : 0, 
              opacity: isBuilt ? 1 : 0.3 
            }}
            transition={{ duration: 0.4 }}
          />
          {isBuilt && (
            <motion.polygon
              points={`${t.x + 70},${t.y} ${t.x + 62},${t.y - 12} ${t.x + 78},${t.y - 12}`}
              fill={isDashed ? '#06b6d4' : '#f59e0b'}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            />
          )}
        </motion.g>
      );
    });
  };

  // Render type box
  const renderTypeBox = (t: TypeDefinition) => {
    const isBuilt = builtTypes.has(t.id);
    const isAnimating = animatingType === t.id;
    const isSelected = selectedType === t.id;
    
    const kindIcon = t.kind === 'interface' ? '◇' : t.kind === 'abstract' ? '◈' : '■';
    const kindLabel = t.kind === 'interface' ? 'interface' : t.kind === 'abstract' ? 'abstract class' : 'class';
    
    return (
      <motion.g
        key={t.id}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: isBuilt || isAnimating ? 1 : 0.3, 
          scale: isAnimating ? 1.05 : 1 
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        style={{ cursor: 'pointer' }}
        onClick={() => {
          setSelectedType(isSelected ? null : t.id);
          playSound('select');
        }}
      >
        {/* Glow effect */}
        {(isAnimating || isSelected) && (
          <motion.rect
            x={t.x - 4}
            y={t.y - 4}
            width={148}
            height={88}
            rx={12}
            fill="none"
            stroke={t.color}
            strokeWidth={2}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
        
        {/* Main box */}
        <rect
          x={t.x}
          y={t.y}
          width={140}
          height={80}
          rx={8}
          fill={isBuilt ? `${t.color}15` : '#1e293b'}
          stroke={isBuilt ? t.color : '#334155'}
          strokeWidth={isSelected ? 3 : 2}
          strokeDasharray={t.kind === 'interface' ? '6 3' : t.kind === 'abstract' ? '12 4' : undefined}
        />
        
        {/* Header bar */}
        <rect
          x={t.x}
          y={t.y}
          width={140}
          height={24}
          rx={8}
          fill={isBuilt ? `${t.color}30` : '#334155'}
        />
        <rect
          x={t.x}
          y={t.y + 16}
          width={140}
          height={8}
          fill={isBuilt ? `${t.color}30` : '#334155'}
        />
        
        {/* Kind icon */}
        <text
          x={t.x + 12}
          y={t.y + 16}
          fill={isBuilt ? t.color : '#64748b'}
          fontSize={12}
          fontFamily="monospace"
        >
          {kindIcon}
        </text>
        
        {/* Type name */}
        <text
          x={t.x + 28}
          y={t.y + 16}
          fill={isBuilt ? '#f1f5f9' : '#94a3b8'}
          fontSize={12}
          fontWeight="bold"
          fontFamily="monospace"
        >
          {t.name}
        </text>
        
        {/* Kind label */}
        <text
          x={t.x + 70}
          y={t.y + 40}
          textAnchor="middle"
          fill={isBuilt ? '#94a3b8' : '#475569'}
          fontSize={9}
          fontFamily="monospace"
        >
          {kindLabel}
        </text>
        
        {/* Method count */}
        <text
          x={t.x + 70}
          y={t.y + 58}
          textAnchor="middle"
          fill={isBuilt ? t.color : '#475569'}
          fontSize={10}
          fontFamily="monospace"
        >
          {t.methods.filter(m => m.implemented).length}/{t.methods.length} implemented
        </text>
        
        {/* Blueprint pattern overlay */}
        {t.kind !== 'concrete' && (
          <g opacity={0.1}>
            {[0, 1, 2].map(i => (
              <line
                key={i}
                x1={t.x + 10}
                y1={t.y + 30 + i * 15}
                x2={t.x + 130}
                y2={t.y + 30 + i * 15}
                stroke={t.color}
                strokeWidth={1}
                strokeDasharray="2 4"
              />
            ))}
          </g>
        )}
      </motion.g>
    );
  };

  const selectedTypeData = selectedType ? getTypeById(selectedType) : null;

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-teal-950/5 to-slate-950 rounded-xl border border-teal-900/30 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-teal-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/30">
              <Layers className="text-teal-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-teal-300 tracking-wide">TYPE BLUEPRINT FACTORY</h2>
              <p className="text-xs text-teal-500/70">Interfaces • Abstract Classes • Concrete Types</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
              phase === 'idle' ? 'bg-slate-800 border-slate-700 text-slate-400' :
              phase === 'building' ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' :
              'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
            }`}>
              {phase === 'idle' ? 'READY' : phase === 'building' ? 'BUILDING' : 'COMPLETE'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="text-xs text-teal-400 mb-2 block">Preset Example</label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset, idx) => (
                <button
                  key={preset.name}
                  onClick={() => changePreset(idx)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedPreset === idx
                      ? 'bg-teal-500/20 border-teal-500/50 text-teal-300 border'
                      : 'bg-slate-800 border-slate-700 text-slate-400 border hover:border-teal-500/30'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2 items-end">
            <button
              onClick={runBuild}
              disabled={phase === 'building'}
              className={`px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all ${
                phase === 'building'
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-wait'
                  : 'bg-teal-500/20 text-teal-300 border border-teal-500/50 hover:bg-teal-500/30'
              }`}
            >
              <Play size={18} />
              BUILD
            </button>
            <button
              onClick={reset}
              className="px-3 py-2.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>

        {/* Type Hierarchy Visualization */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-teal-400 flex items-center gap-2">
              <Box size={12} />
              Type Hierarchy
            </div>
            <button
              onClick={() => setShowCode(prev => !prev)}
              className={`px-3 py-1 rounded text-xs font-medium transition-all flex items-center gap-1 ${
                showCode 
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50' 
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              <Zap size={12} />
              {showCode ? 'Hide Code' : 'Show Code'}
            </button>
          </div>
          
          <div className="bg-slate-950/50 rounded-lg border border-slate-800 overflow-hidden">
            <svg viewBox="0 0 400 400" className="w-full h-80 md:h-96">
              {/* Grid background */}
              <defs>
                <pattern id="blueprint-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#0d4a4a" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#blueprint-grid)" />
              
              {/* Connections */}
              {renderConnections()}
              
              {/* Type boxes */}
              {types.map(t => renderTypeBox(t))}
            </svg>
          </div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-4 text-[10px]">
            <span className="flex items-center gap-2">
              <span className="w-6 h-4 rounded border-2 border-dashed border-cyan-500 bg-cyan-500/10"></span>
              <span className="text-slate-400">Interface</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-6 h-4 rounded border-2 border-dashed border-amber-500 bg-amber-500/10" style={{ borderStyle: 'dashed' }}></span>
              <span className="text-slate-400">Abstract Class</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-6 h-4 rounded border-2 border-emerald-500 bg-emerald-500/10"></span>
              <span className="text-slate-400">Concrete Class</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-6 h-0.5 bg-cyan-500" style={{ borderStyle: 'dashed' }}></span>
              <span className="text-slate-400">implements</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-6 h-0.5 bg-amber-500"></span>
              <span className="text-slate-400">extends</span>
            </span>
          </div>
        </div>

        {/* Selected Type Details */}
        <AnimatePresence>
          {selectedTypeData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden"
            >
              <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: selectedTypeData.color }}
                  />
                  <span className="font-bold text-slate-200">{selectedTypeData.name}</span>
                  <span className="text-xs text-slate-500">({selectedTypeData.kind})</span>
                </div>
                <button
                  onClick={() => setSelectedType(null)}
                  className="p-1 rounded hover:bg-slate-700 text-slate-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Methods */}
                <div>
                  <div className="text-xs text-teal-400 mb-2">Methods</div>
                  <div className="space-y-2">
                    {selectedTypeData.methods.map((m, idx) => (
                      <div 
                        key={idx}
                        className={`flex items-center justify-between p-2 rounded-lg border ${
                          m.implemented 
                            ? 'bg-emerald-500/10 border-emerald-500/30' 
                            : 'bg-slate-800/50 border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {m.implemented ? (
                            <Check size={14} className="text-emerald-400" />
                          ) : (
                            <span className="w-3.5 h-3.5 rounded border-2 border-dashed border-slate-500" />
                          )}
                          <code className="text-sm text-slate-300">
                            {m.name}({m.params}): {m.returnType}
                          </code>
                        </div>
                        {m.body && (
                          <code className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                            {m.body}
                          </code>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Relationships */}
                {(selectedTypeData.implements || selectedTypeData.extends) && (
                  <div>
                    <div className="text-xs text-teal-400 mb-2">Relationships</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedTypeData.implements && (
                        <span className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-xs text-cyan-300">
                          implements {getTypeById(selectedTypeData.implements)?.name}
                        </span>
                      )}
                      {selectedTypeData.extends && (
                        <span className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300">
                          extends {getTypeById(selectedTypeData.extends)?.name}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Code View */}
        <AnimatePresence>
          {showCode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={14} className="text-teal-400" />
                  <span className="text-xs text-teal-400">TypeScript Code</span>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {types.map(t => (
                    <motion.pre
                      key={t.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: builtTypes.has(t.id) ? 1 : 0.3 }}
                      className={`p-3 rounded-lg text-xs font-mono overflow-x-auto ${
                        builtTypes.has(t.id) 
                          ? 'bg-slate-800/80 border border-slate-700' 
                          : 'bg-slate-900/50 border border-slate-800'
                      }`}
                      style={{ color: builtTypes.has(t.id) ? t.color : '#64748b' }}
                    >
                      {generateCode(t)}
                    </motion.pre>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Interfaces', count: types.filter(t => t.kind === 'interface').length, color: '#06b6d4', icon: '◇' },
            { label: 'Abstract', count: types.filter(t => t.kind === 'abstract').length, color: '#f59e0b', icon: '◈' },
            { label: 'Concrete', count: types.filter(t => t.kind === 'concrete').length, color: '#10b981', icon: '■' },
          ].map(({ label, count, color, icon }) => (
            <div
              key={label}
              className="p-3 rounded-lg bg-slate-900/30 border border-slate-800 text-center"
            >
              <div className="text-2xl font-bold" style={{ color }}>{icon} {count}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          ))}
        </div>


        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Space</kbd> Build
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">C</kbd> Toggle Code
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Esc</kbd> Deselect
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-2">
          <ChevronDown size={16} />
          What are abstract types?
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-3">
          <p>
            <span className="text-cyan-300">Interfaces</span> define a contract with no implementation. 
            They specify what methods a type must have, but not how they work. Types that implement 
            an interface must provide all method implementations.
          </p>
          <p>
            <span className="text-amber-300">Abstract classes</span> are partial implementations. They can 
            have some methods implemented and others left abstract (unimplemented). Subclasses must 
            implement the abstract methods but inherit the implemented ones.
          </p>
          <p>
            <span className="text-emerald-300">Concrete classes</span> are fully implemented types that 
            can be instantiated. They provide implementations for all methods, either directly or 
            inherited from parent classes.
          </p>
          <p className="text-slate-500 italic">
            This pattern enables polymorphism - different concrete types can be used interchangeably 
            through their shared interface or abstract base class.
          </p>
        </div>
      </details>
    </div>
  );
}
