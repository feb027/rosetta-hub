import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Volume2, VolumeX, FileCode, Cpu, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Diagram Parser ---
interface Field {
  name: string;
  bits: number;
  startBit: number;
  row: number;
}

interface ParseResult {
  fields: Field[];
  totalBits: number;
  rows: number;
  error?: string;
}

const parseDiagram = (input: string): ParseResult => {
  const lines = input.split('\n').filter(l => l.trim());
  const fields: Field[] = [];
  let currentBit = 0;
  let row = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip border lines (only + and -)
    if (/^[\s+\-]+$/.test(line)) continue;
    
    // Parse field line (contains |)
    if (line.includes('|')) {
      const parts = line.split('|').slice(1, -1); // Remove empty first/last
      
      for (const part of parts) {
        const name = part.trim();
        if (name) {
          // Count bits: each +--+ segment is 1 bit (4 chars per bit)
          const bits = Math.max(1, Math.floor((part.length + 1) / 4));
          fields.push({ name, bits, startBit: currentBit, row });
          currentBit += bits;
        }
      }
      row++;
    }
  }
  
  return { fields, totalBits: currentBit, rows: row };
};

// Preset diagrams
const PRESETS = {
  dns: {
    name: 'DNS Header',
    diagram: `+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                      ID                       |
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|QR|   Opcode  |AA|TC|RD|RA|   Z    |   RCODE   |
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                    QDCOUNT                    |
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                    ANCOUNT                    |
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                    NSCOUNT                    |
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                    ARCOUNT                    |
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+`
  },
  simple: {
    name: 'Simple',
    diagram: `+--+--+--+--+--+--+--+--+
|  A   |   B   |   C   |
+--+--+--+--+--+--+--+--+`
  },
  tcp: {
    name: 'TCP Flags',
    diagram: `+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|          Source Port          |       Dest Port       |
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                    Sequence Number                    |
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|URG|ACK|PSH|RST|SYN|FIN|        Window         |
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+`
  },
  custom: {
    name: 'Custom',
    diagram: `+--+--+--+--+--+--+--+--+
| Header |    Payload   |
+--+--+--+--+--+--+--+--+
|  Type  | Len |  Data  |
+--+--+--+--+--+--+--+--+`
  }
};

// Field colors
const FIELD_COLORS = [
  { bg: 'bg-sky-500/30', border: 'border-sky-400', text: 'text-sky-300', glow: 'shadow-sky-500/30' },
  { bg: 'bg-amber-500/30', border: 'border-amber-400', text: 'text-amber-300', glow: 'shadow-amber-500/30' },
  { bg: 'bg-emerald-500/30', border: 'border-emerald-400', text: 'text-emerald-300', glow: 'shadow-emerald-500/30' },
  { bg: 'bg-rose-500/30', border: 'border-rose-400', text: 'text-rose-300', glow: 'shadow-rose-500/30' },
  { bg: 'bg-cyan-500/30', border: 'border-cyan-400', text: 'text-cyan-300', glow: 'shadow-cyan-500/30' },
  { bg: 'bg-orange-500/30', border: 'border-orange-400', text: 'text-orange-300', glow: 'shadow-orange-500/30' },
  { bg: 'bg-teal-500/30', border: 'border-teal-400', text: 'text-teal-300', glow: 'shadow-teal-500/30' },
  { bg: 'bg-pink-500/30', border: 'border-pink-400', text: 'text-pink-300', glow: 'shadow-pink-500/30' },
];

export default function ASCIIArtDiagramVisualization() {
  const [diagram, setDiagram] = useState(PRESETS.dns.diagram);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedIndex, setParsedIndex] = useState(-1);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<'visual' | 'binary'>('visual');

  const audioContextRef = useRef<AudioContext | null>(null);
  const parseIntervalRef = useRef<number>(0);


  // --- Audio ---
  const playSound = useCallback((type: 'parse' | 'complete' | 'select' | 'beep') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'parse') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(200 + parsedIndex * 30, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'complete') {
      [400, 500, 600, 800].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.08, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4 + i * 0.08);
        osc.start(now + i * 0.08);
        osc.stop(now + 0.5 + i * 0.08);
      });
    } else if (type === 'select') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.setValueAtTime(800, now + 0.05);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'beep') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.start(now);
      osc.stop(now + 0.03);
    }
  }, [soundEnabled, parsedIndex]);

  // --- Parse Animation ---
  const startParsing = useCallback(() => {
    const result = parseDiagram(diagram);
    setParseResult(result);
    setIsParsing(true);
    setParsedIndex(-1);
    setSelectedField(null);

    let idx = 0;
    parseIntervalRef.current = window.setInterval(() => {
      if (idx < result.fields.length) {
        setParsedIndex(idx);
        playSound('parse');
        idx++;
      } else {
        clearInterval(parseIntervalRef.current);
        setIsParsing(false);
        playSound('complete');
      }
    }, 200);
  }, [diagram, playSound]);

  const reset = () => {
    clearInterval(parseIntervalRef.current);
    setIsParsing(false);
    setParsedIndex(-1);
    setParseResult(null);
    setSelectedField(null);
  };

  const applyPreset = (key: keyof typeof PRESETS) => {
    setDiagram(PRESETS[key].diagram);
    reset();
    playSound('beep');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement) return;
      if (e.key === ' ') { e.preventDefault(); startParsing(); }
      if (e.key === 'r' || e.key === 'R') reset();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [startParsing]);

  useEffect(() => {
    return () => clearInterval(parseIntervalRef.current);
  }, []);

  const getFieldColor = (index: number) => FIELD_COLORS[index % FIELD_COLORS.length];


  return (
    <div className="w-full bg-slate-950 rounded-xl border border-sky-900/40 font-sans overflow-hidden">
      
      {/* Header - Blueprint style */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950/50 to-slate-900 border-b border-sky-500/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2 rounded bg-sky-500/20 border border-sky-500/50">
                <FileCode className="text-sky-400" size={24} />
              </div>
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-sky-400 rounded-full"
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-sky-300 tracking-wider font-mono">BLUEPRINT DECODER</h2>
              <p className="text-xs text-sky-500/70 font-mono">ASCII Diagram Parser v1.0</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800/50 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => setViewMode('visual')}
                className={`px-3 py-1 rounded text-xs font-mono transition-all ${
                  viewMode === 'visual' ? 'bg-sky-500/30 text-sky-300' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                VISUAL
              </button>
              <button
                onClick={() => setViewMode('binary')}
                className={`px-3 py-1 rounded text-xs font-mono transition-all ${
                  viewMode === 'binary' ? 'bg-sky-500/30 text-sky-300' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                BINARY
              </button>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded border transition-all ${
                soundEnabled 
                  ? 'bg-sky-500/20 border-sky-500/50 text-sky-300' 
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:divide-x divide-sky-900/30">
        
        {/* Left Panel - Input */}
        <div className="p-4 space-y-4">
          {/* Presets */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => applyPreset(key as keyof typeof PRESETS)}
                className={`px-3 py-1.5 rounded text-xs font-mono transition-all border ${
                  diagram === preset.diagram
                    ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-sky-500/30'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>

          {/* ASCII Input */}
          <div className="relative">
            <div className="absolute top-2 left-2 text-[10px] text-sky-500/50 font-mono">INPUT DIAGRAM</div>
            <textarea
              value={diagram}
              onChange={(e) => { setDiagram(e.target.value); reset(); }}
              className="w-full h-64 p-3 pt-6 bg-slate-900/80 border border-sky-900/50 rounded-lg text-sky-300 font-mono text-xs leading-relaxed focus:outline-none focus:border-sky-500/50 resize-none custom-scrollbar"
              spellCheck={false}
            />
            {/* Grid overlay effect */}
            <div className="absolute inset-0 pointer-events-none rounded-lg opacity-5"
              style={{
                backgroundImage: 'linear-gradient(rgba(56,189,248,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.3) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}
            />
          </div>

          {/* Parse Button */}
          <button
            onClick={startParsing}
            disabled={isParsing}
            className={`w-full py-3 rounded-lg font-mono font-bold flex items-center justify-center gap-2 transition-all ${
              isParsing
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'bg-sky-500/20 text-sky-300 border border-sky-500/50 hover:bg-sky-500/30'
            }`}
          >
            {isParsing ? (
              <>
                <Cpu size={18} className="animate-spin" />
                PARSING...
              </>
            ) : (
              <>
                <Play size={18} />
                DECODE DIAGRAM
              </>
            )}
          </button>
        </div>

        {/* Right Panel - Output */}
        <div className="p-4 space-y-4 bg-slate-900/30 max-h-[500px] overflow-y-auto custom-scrollbar">
          
          {/* Visual Output */}
          {parseResult && viewMode === 'visual' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between sticky top-0 bg-slate-900/90 py-2 -mt-2 z-10">
                <span className="text-[10px] text-sky-500/50 font-mono">DECODED STRUCTURE</span>
                <span className="text-[10px] text-sky-400 font-mono">{parseResult.totalBits} BITS • {parseResult.fields.length} FIELDS</span>
              </div>

              {/* Fields visualization - compact list */}
              <div className="space-y-1.5">
                {parseResult.fields.map((field, idx) => {
                  const color = getFieldColor(idx);
                  const isRevealed = idx <= parsedIndex;
                  const isSelected = selectedField?.name === field.name;
                  
                  return (
                    <motion.div
                      key={`${field.name}-${idx}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ 
                        opacity: isRevealed ? 1 : 0.2, 
                        x: isRevealed ? 0 : -20,
                      }}
                      onClick={() => { setSelectedField(field); playSound('select'); }}
                      className={`
                        relative p-2 rounded-lg border cursor-pointer transition-all
                        ${color.bg} ${color.border} ${isSelected ? `ring-2 ring-offset-1 ring-offset-slate-950 ${color.glow}` : ''}
                      `}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-mono font-bold text-sm truncate ${color.text}`}>{field.name}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] text-slate-400 font-mono bg-slate-800/50 px-1.5 py-0.5 rounded">{field.bits}b</span>
                          <span className="text-[10px] text-slate-500 font-mono">@{field.startBit}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Binary View */}
          {parseResult && viewMode === 'binary' && (
            <div className="space-y-3">
              <div className="text-[10px] text-sky-500/50 font-mono">BINARY LAYOUT</div>
              <div className="bg-black/50 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                <div className="flex flex-wrap gap-1">
                  {parseResult.fields.map((field, idx) => {
                    const color = getFieldColor(idx);
                    const isRevealed = idx <= parsedIndex;
                    return (
                      <motion.div
                        key={`${field.name}-${idx}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isRevealed ? 1 : 0.2 }}
                        className={`px-2 py-1 rounded ${color.bg} border ${color.border}`}
                      >
                        <span className={color.text}>{field.name}</span>
                        <span className="text-slate-500 ml-1">[{field.bits}]</span>
                      </motion.div>
                    );
                  })}
                </div>
                
                {/* Struct-like output */}
                <div className="mt-4 border-t border-slate-700 pt-4">
                  <div className="text-slate-500">// Generated structure</div>
                  <div className="text-sky-400">struct <span className="text-amber-300">Header</span> {'{'}</div>
                  {parseResult.fields.slice(0, parsedIndex + 1).map((field, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="pl-4"
                    >
                      <span className="text-emerald-400">uint{field.bits}</span>
                      <span className="text-slate-300"> {field.name.toLowerCase().replace(/\s+/g, '_')}</span>
                      <span className="text-slate-500">;</span>
                      <span className="text-slate-600"> // bits {field.startBit}-{field.startBit + field.bits - 1}</span>
                    </motion.div>
                  ))}
                  <div className="text-sky-400">{'}'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!parseResult && (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500">
              <Zap size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-mono">No diagram decoded</p>
              <p className="text-xs text-slate-600">Click DECODE to parse the ASCII diagram</p>
            </div>
          )}

          {/* Selected field details */}
          <AnimatePresence>
            {selectedField && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-slate-800/50 rounded-lg border border-sky-500/30 p-4 sticky bottom-0"
              >
                <div className="text-[10px] text-sky-500/50 font-mono mb-3">FIELD INSPECTOR</div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-mono font-bold text-sky-300">{selectedField.name}</span>
                  <button 
                    onClick={() => setSelectedField(null)}
                    className="text-slate-500 hover:text-slate-300 text-xs"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Bit visualization */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {Array.from({ length: selectedField.bits }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="w-6 h-6 rounded bg-sky-500/20 border border-sky-500/50 flex items-center justify-center"
                    >
                      <span className="text-[9px] text-sky-300 font-mono">{selectedField.startBit + i}</span>
                    </motion.div>
                  ))}
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-900/50 rounded p-2 text-center">
                    <div className="text-slate-500">Size</div>
                    <div className="text-amber-300 font-mono font-bold">{selectedField.bits} bits</div>
                  </div>
                  <div className="bg-slate-900/50 rounded p-2 text-center">
                    <div className="text-slate-500">Offset</div>
                    <div className="text-emerald-300 font-mono font-bold">{selectedField.startBit}</div>
                  </div>
                  <div className="bg-slate-900/50 rounded p-2 text-center">
                    <div className="text-slate-500">Max Value</div>
                    <div className="text-cyan-300 font-mono font-bold">{Math.pow(2, selectedField.bits) - 1}</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="border-t border-sky-900/30 px-4 py-3 bg-slate-900/50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-4 text-xs font-mono">
            <span className="text-slate-500">Fields: <span className="text-sky-400">{parseResult?.fields.length || 0}</span></span>
            <span className="text-slate-500">Total: <span className="text-amber-400">{parseResult?.totalBits || 0}</span> bits</span>
            <span className="text-slate-500">Rows: <span className="text-emerald-400">{parseResult?.rows || 0}</span></span>
          </div>
          <div className="flex gap-2 text-[10px] text-slate-600">
            <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
              <kbd className="text-slate-400">Space</kbd> Parse
            </span>
            <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
              <kbd className="text-slate-400">R</kbd> Reset
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
