import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Plus, Trash2, Trophy, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const PRESETS = [
  { name: 'Odd Count', values: [4.1, 5.6, 7.2, 1.7, 9.3, 4.4, 3.2] },
  { name: 'Even Count', values: [4.1, 7.2, 1.7, 9.3, 4.4, 3.2] },
  { name: 'Two Values', values: [1.5, 3.5] },
  { name: 'Single', values: [42.0] },
  { name: 'Sorted', values: [1, 2, 3, 4, 5, 6, 7] },
];

const CAR_COLORS = [
  'from-rose-500 to-rose-600',
  'from-amber-500 to-amber-600',
  'from-emerald-500 to-emerald-600',
  'from-cyan-500 to-cyan-600',
  'from-sky-500 to-sky-600',
  'from-pink-500 to-pink-600',
  'from-orange-500 to-orange-600',
  'from-teal-500 to-teal-600',
];

export default function AveragesMedianVisualization() {
  const [values, setValues] = useState<number[]>([4.1, 5.6, 7.2, 1.7, 9.3, 4.4, 3.2]);
  const [sortedValues, setSortedValues] = useState<number[]>([]);
  const [newValue, setNewValue] = useState('');
  const [phase, setPhase] = useState<'unsorted' | 'sorting' | 'sorted' | 'result'>('unsorted');
  const [sortProgress, setSortProgress] = useState(0);
  const [medianIndices, setMedianIndices] = useState<number[]>([]);
  const [median, setMedian] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);


  // --- Audio ---
  const playSound = useCallback((type: 'add' | 'remove' | 'sort' | 'complete' | 'click' | 'medal') => {
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
    } else if (type === 'sort') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300 + sortProgress * 50, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'complete' || type === 'medal') {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.1, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + i * 0.1);
        osc.start(now + i * 0.1);
        osc.stop(now + 0.6 + i * 0.1);
      });
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
  }, [soundEnabled, sortProgress]);


  // --- Find Median ---
  const findMedian = useCallback(() => {
    if (values.length === 0) return;
    
    setPhase('sorting');
    setSortProgress(0);
    setSortedValues([]);
    setMedianIndices([]);
    setMedian(null);
    
    // Animate sorting
    const sorted = [...values].sort((a, b) => a - b);
    let progress = 0;
    
    const sortInterval = setInterval(() => {
      progress++;
      setSortProgress(progress);
      playSound('sort');
      
      if (progress >= values.length) {
        clearInterval(sortInterval);
        setSortedValues(sorted);
        setPhase('sorted');
        
        // Find median after short delay
        setTimeout(() => {
          const mid = Math.floor(sorted.length / 2);
          let medianValue: number;
          let indices: number[];
          
          if (sorted.length % 2 === 0) {
            // Even: average of two middle values
            medianValue = (sorted[mid - 1] + sorted[mid]) / 2;
            indices = [mid - 1, mid];
          } else {
            // Odd: middle value
            medianValue = sorted[mid];
            indices = [mid];
          }
          
          setMedianIndices(indices);
          setMedian(medianValue);
          setPhase('result');
          playSound('medal');
        }, 500);
      }
    }, 200);
  }, [values, playSound]);

  const addValue = () => {
    const num = parseFloat(newValue);
    if (!isNaN(num) && values.length < 10) {
      setValues([...values, num]);
      setNewValue('');
      setPhase('unsorted');
      playSound('add');
    }
  };

  const removeValue = (index: number) => {
    setValues(values.filter((_, i) => i !== index));
    setPhase('unsorted');
    playSound('remove');
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setValues([...preset.values]);
    setPhase('unsorted');
    setSortedValues([]);
    setMedianIndices([]);
    setMedian(null);
    playSound('click');
  };

  const reset = () => {
    setPhase('unsorted');
    setSortedValues([]);
    setSortProgress(0);
    setMedianIndices([]);
    setMedian(null);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); findMedian(); }
      if (e.key === 'r' || e.key === 'R') reset();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [findMedian]);

  const displayValues = phase === 'unsorted' ? values : sortedValues.length > 0 ? sortedValues : values;


  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-rose-950/10 to-slate-950 rounded-xl border border-rose-900/40 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-rose-800/40 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/15 border border-rose-500/40">
              <Trophy className="text-rose-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-rose-300 tracking-wide">SORTING RACETRACK</h2>
              <p className="text-xs text-rose-500/70">Median Finder</p>
            </div>
          </div>

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
              className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-xs text-slate-400 hover:text-rose-300 hover:border-rose-500/50 transition-all"
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* Racetrack Visualization */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-6 relative overflow-hidden">
          {/* Track pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(244,63,94,0.3) 40px, rgba(244,63,94,0.3) 42px)`,
            }} />
          </div>

          {/* Finish line */}
          <div className="absolute right-8 top-0 bottom-0 w-4 flex flex-col">
            {[...Array(20)].map((_, i) => (
              <div key={i} className={`flex-1 ${i % 2 === 0 ? 'bg-white/20' : 'bg-slate-900/50'}`} />
            ))}
          </div>

          {/* Header */}
          <div className="relative flex items-center justify-between mb-4 pb-3 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <Flag size={16} className={phase === 'result' ? 'text-emerald-400' : 'text-slate-500'} />
              <span className="text-sm font-mono text-slate-400">
                {phase === 'unsorted' ? 'Ready to race' : 
                 phase === 'sorting' ? `Sorting... ${sortProgress}/${values.length}` :
                 phase === 'sorted' ? 'Finding median...' : 'Race complete!'}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {values.length} racer{values.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Race Cars */}
          <div className="relative min-h-[200px] flex flex-col justify-center gap-2">
            {values.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                <Trophy size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No racers</p>
                <p className="text-xs text-slate-600 mt-1">Add values below</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {displayValues.map((value, idx) => {
                  const isMedian = phase === 'result' && medianIndices.includes(idx);
                  const originalIdx = values.indexOf(value);
                  const colorIdx = originalIdx >= 0 ? originalIdx % CAR_COLORS.length : idx % CAR_COLORS.length;
                  
                  return (
                    <motion.div
                      key={`${value}-${idx}`}
                      layout
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ 
                        x: phase === 'unsorted' ? 0 : (idx / (displayValues.length - 1 || 1)) * 200,
                        opacity: 1,
                        scale: isMedian ? 1.1 : 1,
                      }}
                      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                      className={`relative flex items-center gap-3 ${isMedian ? 'z-10' : ''}`}
                    >
                      {/* Position number */}
                      <div className={`w-6 text-right text-xs font-mono ${
                        isMedian ? 'text-amber-400 font-bold' : 'text-slate-500'
                      }`}>
                        {phase !== 'unsorted' ? `#${idx + 1}` : ''}
                      </div>

                      {/* Race car */}
                      <motion.div
                        className={`relative px-4 py-2 rounded-lg bg-gradient-to-r ${CAR_COLORS[colorIdx]} shadow-lg ${
                          isMedian ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900' : ''
                        }`}
                        animate={isMedian ? { y: [0, -3, 0] } : {}}
                        transition={isMedian ? { duration: 0.5, repeat: Infinity } : {}}
                      >
                        {/* Car body */}
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold font-mono text-sm">
                            {value.toFixed(1)}
                          </span>
                        </div>
                        
                        {/* Wheels */}
                        <div className="absolute -bottom-1 left-2 w-3 h-3 bg-slate-800 rounded-full border-2 border-slate-600" />
                        <div className="absolute -bottom-1 right-2 w-3 h-3 bg-slate-800 rounded-full border-2 border-slate-600" />

                        {/* Medal for median */}
                        {isMedian && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="absolute -top-3 -right-3 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-lg"
                          >
                            <Trophy size={12} className="text-white" />
                          </motion.div>
                        )}
                      </motion.div>

                      {/* Remove button (only in unsorted phase) */}
                      {phase === 'unsorted' && (
                        <button
                          onClick={() => removeValue(idx)}
                          className="opacity-0 hover:opacity-100 p-1 text-rose-400 hover:bg-rose-500/20 rounded transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>


        {/* Result Display */}
        <AnimatePresence>
          {phase === 'result' && median !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 text-center"
            >
              <div className="text-xs text-slate-500 mb-2">MEDIAN VALUE</div>
              <div className="text-4xl font-bold text-amber-400 font-mono">{median.toFixed(4)}</div>
              <div className="text-sm text-slate-400 mt-3">
                {medianIndices.length === 2 ? (
                  <>({sortedValues[medianIndices[0]]} + {sortedValues[medianIndices[1]]}) ÷ 2</>
                ) : (
                  <>Middle value at position {medianIndices[0] + 1}</>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={findMedian}
            disabled={phase === 'sorting' || values.length === 0}
            className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${
              phase === 'sorting'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 cursor-wait'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/50 hover:bg-rose-500/30 disabled:opacity-50'
            }`}
          >
            {phase === 'sorting' ? (
              <div className="w-5 h-5 border-2 border-rose-300 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play size={18} />
            )}
            {phase === 'sorting' ? 'RACING...' : 'START RACE'}
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
          <div className="text-xs text-rose-400 mb-3 flex items-center gap-2">
            <Plus size={14} />
            Add Racer
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.1"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addValue()}
              placeholder="Enter value"
              className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-600 font-mono focus:outline-none focus:border-rose-500"
            />
            <button
              onClick={addValue}
              disabled={!newValue || values.length >= 10}
              className="px-4 py-2 bg-rose-500/20 text-rose-300 border border-rose-500/50 rounded-lg hover:bg-rose-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Plus size={16} />
              ADD
            </button>
          </div>
          <div className="text-xs text-slate-600 mt-2">{values.length}/10 racers</div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Count</div>
            <div className="text-xl font-bold text-rose-400 font-mono">{values.length}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Type</div>
            <div className="text-lg font-bold text-slate-300">
              {values.length % 2 === 0 ? 'Even' : 'Odd'}
            </div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Min</div>
            <div className="text-lg font-bold text-cyan-400 font-mono">
              {values.length > 0 ? Math.min(...values).toFixed(1) : '—'}
            </div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Max</div>
            <div className="text-lg font-bold text-amber-400 font-mono">
              {values.length > 0 ? Math.max(...values).toFixed(1) : '—'}
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Space</kbd> Start Race
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-rose-400 hover:text-rose-300 transition-colors">
          About Median
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            The <span className="text-rose-300">median</span> is the middle value when data is sorted. 
            It's more robust to outliers than the mean.
          </p>
          <p>
            <span className="text-amber-300">Odd count:</span> The median is the single middle value 
            at position (n+1)/2.
          </p>
          <p>
            <span className="text-cyan-300">Even count:</span> The median is the average of the two 
            middle values at positions n/2 and n/2+1.
          </p>
        </div>
      </details>
    </div>
  );
}
