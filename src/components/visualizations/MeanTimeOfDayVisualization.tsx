import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Plus, Trash2, Clock, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TimeEntry {
  id: number;
  time: string;
  seconds: number;
  angle: number;
}

const parseTime = (timeStr: string): number => {
  const parts = timeStr.split(':').map(Number);
  return parts[0] * 3600 + parts[1] * 60 + (parts[2] || 0);
};

const formatTime = (seconds: number): string => {
  const s = ((seconds % 86400) + 86400) % 86400;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
};

const timeToAngle = (seconds: number): number => (seconds / 86400) * 360;
const angleToTime = (angle: number): number => ((angle % 360 + 360) % 360 / 360) * 86400;

const PRESETS = [
  { name: 'Bat Activity', times: ['23:00:17', '23:40:20', '00:12:45', '00:17:19'] },
  { name: 'Morning', times: ['06:30:00', '07:15:00', '06:45:00', '07:00:00'] },
  { name: 'Noon', times: ['11:45:00', '12:15:00', '12:00:00', '12:30:00'] },
  { name: 'Midnight Cross', times: ['23:30:00', '00:30:00'] },
];

export default function MeanTimeOfDayVisualization() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [newTime, setNewTime] = useState('23:00:00');
  const [isCalculating, setIsCalculating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [meanAngle, setMeanAngle] = useState(0);
  const [meanTime, setMeanTime] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [idCounter, setIdCounter] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);


  // --- Audio ---
  const playSound = useCallback((type: 'add' | 'remove' | 'tick' | 'complete' | 'click') => {
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
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'complete') {
      [392, 523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        gain.gain.setValueAtTime(0.08, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + i * 0.12);
        osc.start(now + i * 0.12);
        osc.stop(now + 0.6 + i * 0.12);
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


  // --- Calculate Mean Time ---
  const calculate = useCallback(() => {
    if (entries.length === 0) return;
    
    setIsCalculating(true);
    setShowResult(false);
    setHighlightIndex(0);
    
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < entries.length) {
        setHighlightIndex(idx);
        playSound('tick');
        idx++;
      } else {
        clearInterval(interval);
        
        // Calculate mean angle using circular statistics
        let sumSin = 0;
        let sumCos = 0;
        entries.forEach(e => {
          const rad = (e.angle * Math.PI) / 180;
          sumSin += Math.sin(rad);
          sumCos += Math.cos(rad);
        });
        
        const avgSin = sumSin / entries.length;
        const avgCos = sumCos / entries.length;
        let avgAngle = (Math.atan2(avgSin, avgCos) * 180) / Math.PI;
        if (avgAngle < 0) avgAngle += 360;
        
        const avgSeconds = angleToTime(avgAngle);
        
        setMeanAngle(avgAngle);
        setMeanTime(formatTime(avgSeconds));
        setIsCalculating(false);
        setShowResult(true);
        setHighlightIndex(-1);
        playSound('complete');
      }
    }, 350);
  }, [entries, playSound]);

  const addTime = () => {
    if (!newTime) return;
    const seconds = parseTime(newTime);
    const angle = timeToAngle(seconds);
    
    setEntries(prev => [...prev, {
      id: idCounter,
      time: newTime,
      seconds,
      angle,
    }]);
    setIdCounter(prev => prev + 1);
    setShowResult(false);
    playSound('add');
  };

  const removeEntry = (id: number) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    setShowResult(false);
    playSound('remove');
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    const newEntries = preset.times.map((time, i) => {
      const seconds = parseTime(time);
      return {
        id: idCounter + i,
        time,
        seconds,
        angle: timeToAngle(seconds),
      };
    });
    setEntries(newEntries);
    setIdCounter(prev => prev + preset.times.length);
    setShowResult(false);
    playSound('click');
  };

  const reset = () => {
    setEntries([]);
    setShowResult(false);
    setHighlightIndex(-1);
    setMeanAngle(0);
    setMeanTime('');
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


  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-indigo-950/20 to-slate-950 rounded-xl border border-indigo-900/40 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-indigo-800/40 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/15 border border-indigo-500/40">
              <Moon className="text-indigo-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-indigo-300 tracking-wide">NOCTURNAL OBSERVATORY</h2>
              <p className="text-xs text-indigo-500/70">Mean Time Calculator</p>
            </div>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border transition-all ${
              soundEnabled 
                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' 
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
              className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-xs text-slate-400 hover:text-indigo-300 hover:border-indigo-500/50 transition-all"
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* 24-Hour Clock Visualization */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-6 relative overflow-hidden">
          {/* Stars background */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  opacity: Math.random() * 0.5 + 0.2,
                }}
              />
            ))}
          </div>

          <div className="relative flex justify-center">
            {/* Clock Face */}
            <svg width="300" height="300" viewBox="0 0 300 300" className="drop-shadow-lg">
              {/* Outer ring */}
              <circle cx="150" cy="150" r="140" fill="none" stroke="rgba(99,102,241,0.3)" strokeWidth="2" />
              <circle cx="150" cy="150" r="130" fill="rgba(15,23,42,0.8)" stroke="rgba(99,102,241,0.2)" strokeWidth="1" />
              
              {/* Hour markers */}
              {[...Array(24)].map((_, i) => {
                const angle = (i * 15 - 90) * (Math.PI / 180);
                const x1 = 150 + 120 * Math.cos(angle);
                const y1 = 150 + 120 * Math.sin(angle);
                const x2 = 150 + (i % 6 === 0 ? 105 : 112) * Math.cos(angle);
                const y2 = 150 + (i % 6 === 0 ? 105 : 112) * Math.sin(angle);
                const labelX = 150 + 95 * Math.cos(angle);
                const labelY = 150 + 95 * Math.sin(angle);
                
                return (
                  <g key={i}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={i % 6 === 0 ? 'rgba(99,102,241,0.8)' : 'rgba(99,102,241,0.4)'} strokeWidth={i % 6 === 0 ? 2 : 1} />
                    {i % 6 === 0 && (
                      <text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle" fill="rgba(165,180,252,0.8)" fontSize="12" fontFamily="monospace">
                        {i.toString().padStart(2, '0')}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Time entry markers */}
              {entries.map((entry, idx) => {
                const angle = (entry.angle - 90) * (Math.PI / 180);
                const x = 150 + 75 * Math.cos(angle);
                const y = 150 + 75 * Math.sin(angle);
                
                return (
                  <motion.g key={entry.id}>
                    {/* Line from center */}
                    <motion.line
                      x1="150" y1="150" x2={x} y2={y}
                      stroke={highlightIndex === idx ? '#22d3ee' : '#818cf8'}
                      strokeWidth={highlightIndex === idx ? 3 : 2}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                    {/* Marker dot */}
                    <motion.circle
                      cx={x} cy={y} r={highlightIndex === idx ? 8 : 6}
                      fill={highlightIndex === idx ? '#22d3ee' : '#818cf8'}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring' }}
                    />
                  </motion.g>
                );
              })}

              {/* Mean time indicator */}
              <AnimatePresence>
                {showResult && (
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.line
                      x1="150" y1="150"
                      x2={150 + 85 * Math.cos((meanAngle - 90) * Math.PI / 180)}
                      y2={150 + 85 * Math.sin((meanAngle - 90) * Math.PI / 180)}
                      stroke="#10b981"
                      strokeWidth="4"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5 }}
                    />
                    <motion.circle
                      cx={150 + 85 * Math.cos((meanAngle - 90) * Math.PI / 180)}
                      cy={150 + 85 * Math.sin((meanAngle - 90) * Math.PI / 180)}
                      r="10"
                      fill="#10b981"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: 'spring' }}
                    />
                  </motion.g>
                )}
              </AnimatePresence>

              {/* Center dot */}
              <circle cx="150" cy="150" r="5" fill="#818cf8" />
            </svg>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-400" />
              <span className="text-slate-400">Input times</span>
            </div>
            {showResult && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-400">Mean time</span>
              </div>
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
              className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center"
            >
              <div className="text-xs text-slate-500 mb-2">MEAN TIME OF DAY</div>
              <div className="text-4xl font-bold text-emerald-400 font-mono">{meanTime}</div>
              <div className="text-sm text-slate-400 mt-2">
                Angle: {meanAngle.toFixed(2)}°
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={calculate}
            disabled={isCalculating || entries.length === 0}
            className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${
              isCalculating
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 cursor-wait'
                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 hover:bg-indigo-500/30 disabled:opacity-50'
            }`}
          >
            {isCalculating ? (
              <div className="w-5 h-5 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" />
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

        {/* Add Time & Time List */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Add Time */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <div className="text-xs text-indigo-400 mb-3 flex items-center gap-2">
              <Plus size={14} />
              Add Time
            </div>
            <div className="flex gap-2">
              <input
                type="time"
                step="1"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 font-mono focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={addTime}
                disabled={entries.length >= 8}
                className="px-4 py-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 rounded-lg hover:bg-indigo-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Plus size={16} />
                ADD
              </button>
            </div>
          </div>

          {/* Time List */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <div className="text-xs text-slate-400 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock size={14} />
                Times ({entries.length})
              </span>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
              {entries.length === 0 ? (
                <div className="text-xs text-slate-600 text-center py-4">No times added</div>
              ) : (
                entries.map((entry, idx) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0,
                      backgroundColor: highlightIndex === idx ? 'rgba(34,211,238,0.2)' : 'transparent'
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                      highlightIndex === idx ? 'border-cyan-500' : 'border-slate-700'
                    }`}
                  >
                    <span className={`font-mono text-sm ${highlightIndex === idx ? 'text-cyan-300' : 'text-slate-300'}`}>
                      {entry.time}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{entry.angle.toFixed(1)}°</span>
                      <button
                        onClick={() => removeEntry(entry.id)}
                        className="p-1 text-rose-400 hover:bg-rose-500/20 rounded transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Count</div>
            <div className="text-xl font-bold text-indigo-400 font-mono">{entries.length}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Earliest</div>
            <div className="text-lg font-bold text-cyan-400 font-mono">
              {entries.length > 0 ? entries.reduce((a, b) => a.seconds < b.seconds ? a : b).time : '—'}
            </div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Latest</div>
            <div className="text-lg font-bold text-amber-400 font-mono">
              {entries.length > 0 ? entries.reduce((a, b) => a.seconds > b.seconds ? a : b).time : '—'}
            </div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-emerald-500/30 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Mean</div>
            <div className="text-lg font-bold text-emerald-400 font-mono">
              {showResult ? meanTime : '—'}
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
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
          About Mean Time of Day
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            <span className="text-indigo-300">Circular statistics</span> are needed because time wraps 
            around at midnight. A simple average of 23:00 and 01:00 would give 12:00, not 00:00!
          </p>
          <p>
            <span className="text-cyan-300">The method:</span> Convert times to angles (24h = 360°), 
            compute mean of sin/cos components, then convert back using atan2.
          </p>
          <p>
            <span className="text-emerald-300">Bat activity example:</span> Times near midnight 
            correctly average to around 23:47, not noon.
          </p>
        </div>
      </details>
    </div>
  );
}
