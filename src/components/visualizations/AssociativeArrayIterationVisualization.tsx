import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Key, FileText, Layers, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface KeyValuePair {
  key: string;
  value: string;
}

type IterationMode = 'entries' | 'keys' | 'values';

const SAMPLE_DATA: KeyValuePair[] = [
  { key: 'name', value: 'Alice' },
  { key: 'age', value: '30' },
  { key: 'city', value: 'NYC' },
  { key: 'role', value: 'Engineer' },
  { key: 'team', value: 'Frontend' },
];

const PRESETS = [
  { name: 'Person', data: SAMPLE_DATA },
  { name: 'Colors', data: [{ key: 'red', value: '#FF0000' }, { key: 'green', value: '#00FF00' }, { key: 'blue', value: '#0000FF' }] },
  { name: 'Scores', data: [{ key: 'Alice', value: '95' }, { key: 'Bob', value: '87' }, { key: 'Carol', value: '92' }] },
];

export default function AssociativeArrayIterationVisualization() {
  const [data, setData] = useState<KeyValuePair[]>(SAMPLE_DATA);
  const [mode, setMode] = useState<IterationMode>('entries');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [output, setOutput] = useState<string[]>([]);
  const [speed, setSpeed] = useState(800);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number>(0);


  // --- Audio ---
  const playSound = useCallback((type: 'tick' | 'complete' | 'click' | 'start') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600 + currentIndex * 50, now);
      gain.gain.setValueAtTime(0.06, now);
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
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4 + i * 0.1);
        osc.start(now + i * 0.1);
        osc.stop(now + 0.5 + i * 0.1);
      });
    } else if (type === 'start') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
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
      osc.frequency.setValueAtTime(500, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  }, [soundEnabled, currentIndex]);

  // --- Iteration Logic ---
  const getOutputForIndex = useCallback((idx: number): string => {
    const item = data[idx];
    if (!item) return '';
    
    switch (mode) {
      case 'entries':
        return `["${item.key}", "${item.value}"]`;
      case 'keys':
        return `"${item.key}"`;
      case 'values':
        return `"${item.value}"`;
    }
  }, [data, mode]);

  const startIteration = useCallback(() => {
    if (data.length === 0) return;
    
    setIsPlaying(true);
    setCurrentIndex(0);
    setOutput([]);
    playSound('start');
  }, [data.length, playSound]);

  const stopIteration = useCallback(() => {
    setIsPlaying(false);
    clearInterval(intervalRef.current);
  }, []);

  const reset = useCallback(() => {
    stopIteration();
    setCurrentIndex(-1);
    setOutput([]);
  }, [stopIteration]);

  // Animation loop
  useEffect(() => {
    if (isPlaying && currentIndex >= 0) {
      intervalRef.current = window.setTimeout(() => {
        if (currentIndex < data.length) {
          setOutput(prev => [...prev, getOutputForIndex(currentIndex)]);
          playSound('tick');
          
          if (currentIndex < data.length - 1) {
            setCurrentIndex(prev => prev + 1);
          } else {
            setIsPlaying(false);
            setCurrentIndex(-1);
            playSound('complete');
          }
        }
      }, speed);
      
      return () => clearTimeout(intervalRef.current);
    }
  }, [isPlaying, currentIndex, data.length, speed, getOutputForIndex, playSound]);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    reset();
    setData(preset.data);
    playSound('click');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ') { e.preventDefault(); isPlaying ? stopIteration() : startIteration(); }
      if (e.key === 'r' || e.key === 'R') reset();
      if (e.key === '1') setMode('entries');
      if (e.key === '2') setMode('keys');
      if (e.key === '3') setMode('values');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isPlaying, startIteration, stopIteration, reset]);


  const getModeColor = (m: IterationMode) => {
    switch (m) {
      case 'entries': return 'cyan';
      case 'keys': return 'amber';
      case 'values': return 'emerald';
    }
  };

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-cyan-950/10 to-slate-950 rounded-xl border border-cyan-900/40 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-cyan-800/40 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/15 border border-cyan-500/40">
              <Layers className="text-cyan-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-cyan-300 tracking-wide">DATA STREAM</h2>
              <p className="text-xs text-cyan-500/70">Map Iteration Pipeline</p>
            </div>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border transition-all ${
              soundEnabled 
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' 
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        
        {/* Mode Selection */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-slate-400 mb-3">Iteration Mode</div>
          <div className="flex flex-wrap gap-2">
            {(['entries', 'keys', 'values'] as IterationMode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); reset(); playSound('click'); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  mode === m
                    ? `bg-${getModeColor(m)}-500/20 border border-${getModeColor(m)}-500/50 text-${getModeColor(m)}-300`
                    : 'bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
                style={{
                  backgroundColor: mode === m ? (m === 'entries' ? 'rgba(6,182,212,0.2)' : m === 'keys' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)') : undefined,
                  borderColor: mode === m ? (m === 'entries' ? 'rgba(6,182,212,0.5)' : m === 'keys' ? 'rgba(245,158,11,0.5)' : 'rgba(16,185,129,0.5)') : undefined,
                  color: mode === m ? (m === 'entries' ? 'rgb(103,232,249)' : m === 'keys' ? 'rgb(252,211,77)' : 'rgb(110,231,183)') : undefined,
                }}
              >
                {m === 'entries' && <Layers size={16} />}
                {m === 'keys' && <Key size={16} />}
                {m === 'values' && <FileText size={16} />}
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {mode === 'entries' && 'Iterate over [key, value] pairs'}
            {mode === 'keys' && 'Iterate over keys only'}
            {mode === 'values' && 'Iterate over values only'}
          </div>
        </div>

        {/* Pipeline Visualization */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-6 relative overflow-hidden">
          {/* Conveyor belt pattern */}
          <div className="absolute inset-0 opacity-10">
            <motion.div
              className="absolute inset-0"
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(6,182,212,0.3) 30px, rgba(6,182,212,0.3) 32px)',
              }}
              animate={isPlaying ? { x: [0, -32] } : {}}
              transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          {/* Header */}
          <div className="relative flex items-center justify-between mb-4 pb-3 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              <span className="text-sm font-mono text-slate-400">
                {isPlaying ? `Processing item ${currentIndex + 1}/${data.length}` : 'Ready'}
              </span>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              map.{mode}()
            </div>
          </div>

          {/* Data Items */}
          <div className="relative flex items-center gap-4 overflow-x-auto pb-4 min-h-[100px]">
            <AnimatePresence>
              {data.map((item, idx) => (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    y: currentIndex === idx ? -8 : 0,
                  }}
                  className={`relative flex-shrink-0 rounded-lg border-2 overflow-hidden transition-all duration-300 ${
                    currentIndex === idx
                      ? 'border-cyan-400 shadow-lg shadow-cyan-500/30'
                      : output.length > idx
                      ? 'border-emerald-500/50 opacity-60'
                      : 'border-slate-700'
                  }`}
                >
                  {/* Key section */}
                  <div className={`px-3 py-2 border-b transition-colors ${
                    currentIndex === idx ? 'bg-cyan-500/20 border-cyan-500/30' : 'bg-slate-800/80 border-slate-700'
                  } ${mode === 'values' ? 'opacity-40' : ''}`}>
                    <div className="text-[10px] text-slate-500 mb-0.5">KEY</div>
                    <div className={`font-mono text-sm ${
                      currentIndex === idx && mode !== 'values' ? 'text-amber-300' : 'text-slate-400'
                    }`}>
                      {item.key}
                    </div>
                  </div>
                  
                  {/* Value section */}
                  <div className={`px-3 py-2 transition-colors ${
                    currentIndex === idx ? 'bg-cyan-500/10' : 'bg-slate-900/50'
                  } ${mode === 'keys' ? 'opacity-40' : ''}`}>
                    <div className="text-[10px] text-slate-500 mb-0.5">VALUE</div>
                    <div className={`font-mono text-sm ${
                      currentIndex === idx && mode !== 'keys' ? 'text-emerald-300' : 'text-slate-400'
                    }`}>
                      {item.value}
                    </div>
                  </div>

                  {/* Processing indicator */}
                  {currentIndex === idx && (
                    <motion.div
                      className="absolute inset-0 border-2 border-cyan-400 rounded-lg"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    />
                  )}

                  {/* Processed checkmark */}
                  {output.length > idx && currentIndex !== idx && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-[10px]">✓</span>
                    </div>
                  )}
                </motion.div>
              ))}
              
              {/* Arrow to output */}
              <div className="flex-shrink-0 flex items-center">
                <ArrowRight className="text-cyan-500" size={24} />
              </div>
            </AnimatePresence>
          </div>
        </div>


        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center">
          <button
            onClick={isPlaying ? stopIteration : startIteration}
            disabled={data.length === 0}
            className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-500/30'
            } disabled:opacity-50`}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            {isPlaying ? 'PAUSE' : 'ITERATE'}
          </button>
          
          <button
            onClick={reset}
            className="px-4 py-3 bg-slate-800 text-slate-400 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all"
          >
            <RotateCcw size={18} />
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-slate-500">Speed:</span>
            <input
              type="range"
              min={200}
              max={1500}
              step={100}
              value={1700 - speed}
              onChange={(e) => setSpeed(1700 - parseInt(e.target.value))}
              className="w-24 accent-cyan-500"
            />
          </div>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-slate-500 self-center">Data:</span>
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(preset)}
              className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-xs text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-all"
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* Output Console */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-emerald-400 mb-3 flex items-center justify-between">
            <span>Console Output</span>
            <span className="text-slate-500">{output.length} items printed</span>
          </div>
          <div className="font-mono text-sm bg-black/40 rounded-lg p-4 min-h-[120px] max-h-[200px] overflow-y-auto custom-scrollbar">
            {output.length === 0 ? (
              <span className="text-slate-600">// Output will appear here...</span>
            ) : (
              <div className="space-y-1">
                {output.map((line, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={
                      mode === 'entries' ? 'text-cyan-300' :
                      mode === 'keys' ? 'text-amber-300' :
                      'text-emerald-300'
                    }
                  >
                    <span className="text-slate-500">console.log(</span>
                    {line}
                    <span className="text-slate-500">);</span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Code Display */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-cyan-400 mb-3">JavaScript Code</div>
          <div className="font-mono text-sm bg-black/30 rounded-lg p-4 overflow-x-auto space-y-1">
            <div>
              <span className="text-cyan-400">const</span>{' '}
              <span className="text-amber-300">map</span>{' '}
              <span className="text-slate-500">=</span>{' '}
              <span className="text-cyan-400">new</span>{' '}
              <span className="text-emerald-400">Map</span>
              <span className="text-slate-300">([</span>
            </div>
            {data.map((item, idx) => (
              <div key={idx} className="pl-4">
                <span className="text-slate-300">[</span>
                <span className="text-emerald-400">"{item.key}"</span>
                <span className="text-slate-300">, </span>
                <span className="text-emerald-400">"{item.value}"</span>
                <span className="text-slate-300">]{idx < data.length - 1 ? ',' : ''}</span>
              </div>
            ))}
            <div><span className="text-slate-300">]);</span></div>
            <div className="mt-3 text-slate-600">// Iteration:</div>
            <div>
              <span className="text-cyan-400">for</span>
              <span className="text-slate-300"> (</span>
              <span className="text-cyan-400">const</span>
              {mode === 'entries' ? (
                <span className="text-slate-300"> [<span className="text-amber-300">key</span>, <span className="text-emerald-300">value</span>]</span>
              ) : mode === 'keys' ? (
                <span className="text-amber-300"> key</span>
              ) : (
                <span className="text-emerald-300"> value</span>
              )}
              <span className="text-slate-300"> </span>
              <span className="text-cyan-400">of</span>
              <span className="text-slate-300"> </span>
              <span className="text-amber-300">map</span>
              <span className="text-slate-300">.</span>
              <span className="text-cyan-300">{mode}</span>
              <span className="text-slate-300">()) {'{'}</span>
            </div>
            <div className="pl-4">
              <span className="text-cyan-400">console</span>
              <span className="text-slate-300">.</span>
              <span className="text-amber-300">log</span>
              <span className="text-slate-300">(</span>
              {mode === 'entries' ? (
                <span className="text-slate-300">[<span className="text-amber-300">key</span>, <span className="text-emerald-300">value</span>]</span>
              ) : mode === 'keys' ? (
                <span className="text-amber-300">key</span>
              ) : (
                <span className="text-emerald-300">value</span>
              )}
              <span className="text-slate-300">);</span>
            </div>
            <div><span className="text-slate-300">{'}'}</span></div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Mode</div>
            <div className={`text-lg font-bold capitalize ${
              mode === 'entries' ? 'text-cyan-400' :
              mode === 'keys' ? 'text-amber-400' : 'text-emerald-400'
            }`}>{mode}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Total Items</div>
            <div className="text-lg font-bold text-slate-300 font-mono">{data.length}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Processed</div>
            <div className="text-lg font-bold text-emerald-400 font-mono">{output.length}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Remaining</div>
            <div className="text-lg font-bold text-amber-400 font-mono">{Math.max(0, data.length - output.length)}</div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Space</kbd> Play/Pause
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">1/2/3</kbd> Mode
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
          About Map Iteration
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            <span className="text-cyan-300">map.entries()</span> returns an iterator of [key, value] pairs, 
            useful when you need both the key and value together.
          </p>
          <p>
            <span className="text-amber-300">map.keys()</span> returns an iterator of just the keys, 
            useful when you only need to check what keys exist.
          </p>
          <p>
            <span className="text-emerald-300">map.values()</span> returns an iterator of just the values, 
            useful when you only care about the stored data.
          </p>
          <p>
            <span className="text-slate-300">Iteration order</span> in JavaScript Maps is guaranteed to be 
            insertion order, unlike plain objects in older JS versions.
          </p>
        </div>
      </details>
    </div>
  );
}
