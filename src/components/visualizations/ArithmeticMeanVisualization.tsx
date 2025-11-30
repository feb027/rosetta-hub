import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Plus, Trash2, Scale, Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const PRESETS = [
  { name: '1-10', values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  { name: 'Grades', values: [85, 90, 78, 92, 88] },
  { name: 'Temps', values: [72, 75, 68, 80, 77, 73] },
  { name: 'Single', values: [42] },
  { name: 'Empty', values: [] },
];

export default function ArithmeticMeanVisualization() {
  const [values, setValues] = useState<number[]>([4, 8, 15, 16, 23, 42]);
  const [newValue, setNewValue] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [runningSum, setRunningSum] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);


  const sum = values.reduce((a, b) => a + b, 0);
  const mean = values.length > 0 ? sum / values.length : NaN;

  // --- Audio ---
  const playSound = useCallback((type: 'add' | 'remove' | 'tick' | 'complete' | 'click' | 'error') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'add') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.1);
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
    } else if (type === 'tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500 + highlightIndex * 30, now);
      gain.gain.setValueAtTime(0.05, now);
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
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.08, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4 + i * 0.1);
        osc.start(now + i * 0.1);
        osc.stop(now + 0.5 + i * 0.1);
      });
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
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  }, [soundEnabled, highlightIndex]);


  // --- Calculate Animation ---
  const calculate = useCallback(() => {
    if (values.length === 0) {
      playSound('error');
      setShowResult(true);
      return;
    }
    
    setIsCalculating(true);
    setShowResult(false);
    setHighlightIndex(0);
    setRunningSum(0);
    
    let idx = 0;
    let currentSum = 0;
    
    const interval = setInterval(() => {
      if (idx < values.length) {
        currentSum += values[idx];
        setRunningSum(currentSum);
        setHighlightIndex(idx);
        playSound('tick');
        idx++;
      } else {
        clearInterval(interval);
        setIsCalculating(false);
        setShowResult(true);
        setHighlightIndex(-1);
        playSound('complete');
      }
    }, 400);
  }, [values, playSound]);

  const addValue = () => {
    const num = parseFloat(newValue);
    if (!isNaN(num) && values.length < 12) {
      setValues([...values, num]);
      setNewValue('');
      setShowResult(false);
      playSound('add');
    }
  };

  const removeValue = (index: number) => {
    setValues(values.filter((_, i) => i !== index));
    setShowResult(false);
    playSound('remove');
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setValues([...preset.values]);
    setShowResult(false);
    setHighlightIndex(-1);
    setRunningSum(0);
    playSound('click');
  };

  const reset = () => {
    setValues([]);
    setShowResult(false);
    setHighlightIndex(-1);
    setRunningSum(0);
    setIsCalculating(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); calculate(); }
      if (e.key === 'r' || e.key === 'R') reset();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [calculate]);

  const maxValue = Math.max(...values, 1);


  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-sky-950/10 to-slate-950 rounded-xl border border-sky-900/40 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-sky-800/40 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/15 border border-sky-500/40">
              <Scale className="text-sky-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-sky-300 tracking-wide">BALANCE LAB</h2>
              <p className="text-xs text-sky-500/70">Arithmetic Mean Calculator</p>
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
              {preset.name}
            </button>
          ))}
        </div>

        {/* Values Visualization */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-6 relative overflow-hidden">
          {/* Grid background */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `linear-gradient(rgba(56,189,248,0.3) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(56,189,248,0.3) 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
            }} />
          </div>

          {/* Header */}
          <div className="relative flex items-center justify-between mb-4 pb-3 border-b border-slate-700/50">
            <div className="text-sm font-mono text-slate-400">
              Vector [{values.length}]
            </div>
            {isCalculating && (
              <div className="text-xs text-sky-400 animate-pulse">
                Summing... {runningSum}
              </div>
            )}
          </div>

          {/* Values as weighted blocks */}
          <div className="relative min-h-[160px]">
            {values.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-slate-500">
                <div className="text-center">
                  <Calculator size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No values</p>
                  <p className="text-xs text-slate-600 mt-1">Add numbers below</p>
                </div>
              </div>
            ) : (
              <div className="flex items-end justify-center gap-2 h-40">
                {values.map((value, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ scale: 0, y: 20 }}
                    animate={{ 
                      scale: 1, 
                      y: highlightIndex === idx ? -10 : 0,
                    }}
                    className="relative group"
                  >
                    {/* Block */}
                    <motion.div
                      className={`w-12 rounded-t-lg flex flex-col items-center justify-end pb-2 transition-colors ${
                        highlightIndex === idx
                          ? 'bg-gradient-to-t from-sky-500 to-sky-400 shadow-lg shadow-sky-500/40'
                          : highlightIndex > idx
                          ? 'bg-gradient-to-t from-emerald-600 to-emerald-500'
                          : 'bg-gradient-to-t from-slate-600 to-slate-500'
                      }`}
                      animate={{ height: `${Math.max(30, (value / maxValue) * 120)}px` }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                      <span className={`text-xs font-bold ${
                        highlightIndex >= idx ? 'text-white' : 'text-slate-300'
                      }`}>
                        {value}
                      </span>
                    </motion.div>

                    {/* Index label */}
                    <div className="text-center mt-1">
                      <span className="text-[10px] text-slate-500">[{idx}]</span>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => removeValue(idx)}
                      disabled={isCalculating}
                      className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 p-1 bg-rose-500 rounded-full text-white transition-all disabled:opacity-0"
                    >
                      <Trash2 size={10} />
                    </button>

                    {/* Highlight indicator */}
                    {highlightIndex === idx && (
                      <motion.div
                        className="absolute -top-6 left-1/2 -translate-x-1/2 text-sky-400 text-xs font-mono"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        +{value}
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Mean line indicator */}
            {showResult && values.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute left-0 right-0 border-t-2 border-dashed border-amber-500"
                style={{ bottom: `${Math.max(30, (mean / maxValue) * 120) + 40}px` }}
              >
                <span className="absolute -top-5 right-0 text-xs text-amber-400 font-mono">
                  μ = {mean.toFixed(2)}
                </span>
              </motion.div>
            )}
          </div>
        </div>


        {/* Result Display */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`rounded-xl border p-6 ${
                values.length === 0
                  ? 'bg-rose-500/10 border-rose-500/30'
                  : 'bg-emerald-500/10 border-emerald-500/30'
              }`}
            >
              {values.length === 0 ? (
                <div className="text-center">
                  <div className="text-rose-400 text-lg font-bold">Undefined</div>
                  <div className="text-xs text-rose-400/70 mt-1">
                    Mean of empty set is undefined (NaN)
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-xs text-slate-500 mb-2">ARITHMETIC MEAN</div>
                  <div className="text-4xl font-bold text-emerald-400 font-mono">
                    {mean.toFixed(4)}
                  </div>
                  <div className="text-sm text-slate-400 mt-3 font-mono">
                    ({sum}) ÷ {values.length} = {mean.toFixed(4)}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={calculate}
            disabled={isCalculating}
            className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${
              isCalculating
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 cursor-wait'
                : 'bg-sky-500/20 text-sky-300 border border-sky-500/50 hover:bg-sky-500/30'
            }`}
          >
            {isCalculating ? (
              <div className="w-5 h-5 border-2 border-sky-300 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play size={18} />
            )}
            {isCalculating ? 'CALCULATING...' : 'CALCULATE MEAN'}
          </button>
          
          <button
            onClick={reset}
            className="px-4 py-3 bg-slate-800 text-slate-400 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        {/* Add Value */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-sky-400 mb-3 flex items-center gap-2">
            <Plus size={14} />
            Add Value
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addValue()}
              placeholder="Enter number"
              className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-600 font-mono focus:outline-none focus:border-sky-500"
            />
            <button
              onClick={addValue}
              disabled={!newValue || values.length >= 12}
              className="px-4 py-2 bg-sky-500/20 text-sky-300 border border-sky-500/50 rounded-lg hover:bg-sky-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus size={16} />
              ADD
            </button>
          </div>
          <div className="text-xs text-slate-600 mt-2">
            {values.length}/12 values
          </div>
        </div>

        {/* Formula Display */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-sky-400 mb-3">Formula</div>
          <div className="font-mono text-sm bg-black/30 rounded-lg p-4 text-center">
            <div className="text-slate-300">
              <span className="text-amber-400">μ</span> = (
              {values.length > 0 ? (
                <span className="text-emerald-400">
                  {values.slice(0, 5).join(' + ')}
                  {values.length > 5 && ' + ...'}
                </span>
              ) : (
                <span className="text-slate-500">∅</span>
              )}
              ) ÷ <span className="text-cyan-400">{values.length || 'n'}</span>
            </div>
            {values.length > 0 && (
              <div className="mt-2 text-slate-400">
                = <span className="text-emerald-400">{sum}</span> ÷ <span className="text-cyan-400">{values.length}</span> = <span className="text-amber-400">{mean.toFixed(4)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Count (n)</div>
            <div className="text-xl font-bold text-cyan-400 font-mono">{values.length}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Sum (Σ)</div>
            <div className="text-xl font-bold text-emerald-400 font-mono">{sum}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Min</div>
            <div className="text-xl font-bold text-sky-400 font-mono">
              {values.length > 0 ? Math.min(...values) : '—'}
            </div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Max</div>
            <div className="text-xl font-bold text-amber-400 font-mono">
              {values.length > 0 ? Math.max(...values) : '—'}
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Space</kbd> Calculate
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Enter</kbd> Add value
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-sky-400 hover:text-sky-300 transition-colors">
          About Arithmetic Mean
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            The <span className="text-sky-300">arithmetic mean</span> (or average) is the sum of all 
            values divided by the count of values: μ = Σx / n
          </p>
          <p>
            <span className="text-amber-300">Empty set:</span> The mean of an empty set is undefined 
            (NaN in JavaScript) since division by zero is not allowed.
          </p>
          <p>
            <span className="text-emerald-300">Properties:</span> The mean is sensitive to outliers 
            and represents the "center of mass" of the data.
          </p>
        </div>
      </details>
    </div>
  );
}
