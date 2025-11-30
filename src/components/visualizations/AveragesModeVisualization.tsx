import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Plus, Trash2, Vote, Award, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const PRESETS = [
  { name: 'Single Mode', values: [1, 2, 3, 3, 3, 4, 4, 5] },
  { name: 'Bimodal', values: [1, 1, 2, 3, 3] },
  { name: 'Trimodal', values: [1, 1, 2, 2, 3, 3] },
  { name: 'All Unique', values: [1, 2, 3, 4, 5] },
  { name: 'All Same', values: [7, 7, 7, 7, 7] },
];

interface FrequencyEntry {
  value: number;
  count: number;
  isMode: boolean;
}

export default function AveragesModeVisualization() {
  const [values, setValues] = useState<number[]>([1, 2, 3, 3, 3, 4, 4, 5]);
  const [newValue, setNewValue] = useState('');
  const [phase, setPhase] = useState<'input' | 'counting' | 'result'>('input');
  const [frequencies, setFrequencies] = useState<FrequencyEntry[]>([]);
  const [countingIndex, setCountingIndex] = useState(-1);
  const [modes, setModes] = useState<number[]>([]);
  const [maxCount, setMaxCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);


  // --- Audio ---
  const playSound = useCallback((type: 'add' | 'remove' | 'count' | 'winner' | 'click') => {
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
    } else if (type === 'count') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(500, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'winner') {
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
  }, [soundEnabled]);

  // --- Find Mode ---
  const findMode = useCallback(() => {
    if (values.length === 0) return;
    
    // Build frequency map
    const freqMap = new Map<number, number>();
    values.forEach(v => freqMap.set(v, (freqMap.get(v) || 0) + 1));
    
    const freqArray: FrequencyEntry[] = Array.from(freqMap.entries())
      .map(([value, count]) => ({ value, count, isMode: false }))
      .sort((a, b) => b.count - a.count);
    
    setFrequencies(freqArray);
    setPhase('counting');
    setCountingIndex(0);
    
    // Animate counting
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < freqArray.length) {
        setCountingIndex(idx);
        playSound('count');
        idx++;
      } else {
        clearInterval(interval);
        
        // Find max and modes
        const max = Math.max(...freqArray.map(f => f.count));
        const modeValues = freqArray.filter(f => f.count === max).map(f => f.value);
        
        setMaxCount(max);
        setModes(modeValues);
        setFrequencies(freqArray.map(f => ({ ...f, isMode: f.count === max })));
        setPhase('result');
        setCountingIndex(-1);
        playSound('winner');
      }
    }, 300);
  }, [values, playSound]);

  const addValue = () => {
    const num = parseInt(newValue);
    if (!isNaN(num) && values.length < 20) {
      setValues([...values, num]);
      setNewValue('');
      setPhase('input');
      playSound('add');
    }
  };

  const removeValue = (index: number) => {
    setValues(values.filter((_, i) => i !== index));
    setPhase('input');
    playSound('remove');
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setValues([...preset.values]);
    setPhase('input');
    setFrequencies([]);
    setModes([]);
    playSound('click');
  };

  const reset = () => {
    setPhase('input');
    setFrequencies([]);
    setCountingIndex(-1);
    setModes([]);
    setMaxCount(0);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); findMode(); }
      if (e.key === 'r' || e.key === 'R') reset();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [findMode]);


  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-sky-950/10 to-slate-950 rounded-xl border border-sky-900/40 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-sky-800/40 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/15 border border-sky-500/40">
              <Vote className="text-sky-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-sky-300 tracking-wide">VOTING BOOTH</h2>
              <p className="text-xs text-sky-500/70">Mode Finder</p>
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

        {/* Input Values Display */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Users size={14} />
              Input Collection [{values.length}]
            </div>
          </div>
          <div className="flex flex-wrap gap-2 min-h-[40px]">
            {values.length === 0 ? (
              <span className="text-slate-600 text-sm">No values added</span>
            ) : (
              values.map((v, idx) => (
                <motion.div
                  key={idx}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="group relative px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm font-mono text-slate-300"
                >
                  {v}
                  <button
                    onClick={() => removeValue(idx)}
                    className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center transition-opacity"
                  >
                    <Trash2 size={10} className="text-white" />
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Voting Results Visualization */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-6 relative overflow-hidden">
          {/* Ballot pattern background */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(56,189,248,0.3) 20px, rgba(56,189,248,0.3) 21px)`,
            }} />
          </div>

          <div className="relative">
            <div className="text-xs text-slate-400 mb-4 flex items-center gap-2">
              <Award size={14} />
              Vote Tally
            </div>

            {frequencies.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Vote size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Click "COUNT VOTES" to find the mode</p>
              </div>
            ) : (
              <div className="space-y-3">
                {frequencies.map((entry, idx) => (
                  <motion.div
                    key={entry.value}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ 
                      opacity: countingIndex >= idx || phase === 'result' ? 1 : 0.3,
                      x: 0,
                    }}
                    className={`relative flex items-center gap-4 p-3 rounded-lg border-2 transition-all ${
                      entry.isMode && phase === 'result'
                        ? 'bg-amber-500/10 border-amber-500/50'
                        : countingIndex === idx
                        ? 'bg-sky-500/10 border-sky-500/50'
                        : 'bg-slate-800/50 border-slate-700/50'
                    }`}
                  >
                    {/* Candidate value */}
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl ${
                      entry.isMode && phase === 'result'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-slate-700 text-slate-300'
                    }`}>
                      {entry.value}
                    </div>

                    {/* Vote bar */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-500">Votes</span>
                        <span className={`text-sm font-bold font-mono ${
                          entry.isMode && phase === 'result' ? 'text-amber-400' : 'text-slate-300'
                        }`}>
                          {entry.count}
                        </span>
                      </div>
                      <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            entry.isMode && phase === 'result'
                              ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                              : 'bg-gradient-to-r from-sky-600 to-sky-500'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${(entry.count / maxCount) * 100}%` }}
                          transition={{ duration: 0.5, delay: idx * 0.1 }}
                        />
                      </div>
                    </div>

                    {/* Winner badge */}
                    {entry.isMode && phase === 'result' && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shadow-lg"
                      >
                        <Award size={16} className="text-white" />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>


        {/* Result Display */}
        <AnimatePresence>
          {phase === 'result' && modes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 text-center"
            >
              <div className="text-xs text-slate-500 mb-2">
                {modes.length === 1 ? 'MODE (WINNER)' : `MODES (${modes.length}-WAY TIE)`}
              </div>
              <div className="flex justify-center gap-3 flex-wrap">
                {modes.map(m => (
                  <span key={m} className="text-3xl font-bold text-amber-400 font-mono px-4 py-2 bg-amber-500/10 rounded-lg">
                    {m}
                  </span>
                ))}
              </div>
              <div className="text-sm text-slate-400 mt-3">
                {maxCount} vote{maxCount !== 1 ? 's' : ''} each
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={findMode}
            disabled={phase === 'counting' || values.length === 0}
            className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${
              phase === 'counting'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 cursor-wait'
                : 'bg-sky-500/20 text-sky-300 border border-sky-500/50 hover:bg-sky-500/30 disabled:opacity-50'
            }`}
          >
            {phase === 'counting' ? (
              <div className="w-5 h-5 border-2 border-sky-300 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play size={18} />
            )}
            {phase === 'counting' ? 'COUNTING...' : 'COUNT VOTES'}
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
            Cast Vote (Add Value)
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addValue()}
              placeholder="Enter integer"
              className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-600 font-mono focus:outline-none focus:border-sky-500"
            />
            <button
              onClick={addValue}
              disabled={!newValue || values.length >= 20}
              className="px-4 py-2 bg-sky-500/20 text-sky-300 border border-sky-500/50 rounded-lg hover:bg-sky-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Plus size={16} />
              VOTE
            </button>
          </div>
          <div className="text-xs text-slate-600 mt-2">{values.length}/20 votes</div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Total Votes</div>
            <div className="text-xl font-bold text-sky-400 font-mono">{values.length}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Unique Values</div>
            <div className="text-xl font-bold text-slate-300 font-mono">{new Set(values).size}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Mode Count</div>
            <div className="text-xl font-bold text-amber-400 font-mono">{modes.length || '—'}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Max Frequency</div>
            <div className="text-xl font-bold text-emerald-400 font-mono">{maxCount || '—'}</div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Space</kbd> Count
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-sky-400 hover:text-sky-300 transition-colors">
          About Mode
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            The <span className="text-sky-300">mode</span> is the value that appears most frequently 
            in a dataset. Unlike mean and median, mode can be non-numeric.
          </p>
          <p>
            <span className="text-amber-300">Multimodal:</span> A dataset can have multiple modes 
            if several values share the highest frequency (bimodal, trimodal, etc.).
          </p>
          <p>
            <span className="text-emerald-300">No mode:</span> If all values appear with equal 
            frequency, technically all values are modes.
          </p>
        </div>
      </details>
    </div>
  );
}
