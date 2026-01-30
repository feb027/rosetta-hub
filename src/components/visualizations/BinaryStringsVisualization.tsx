import { useState, useRef, useCallback } from 'react';
import { FileDigit, Plus, Trash2, Copy, Scissors, Replace, Volume2, VolumeX, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function BinaryStringsVisualization() {
  const [strings, setStrings] = useState<string[]>(['Hello', 'World', '!']);
  const [newString, setNewString] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);

  const playSound = useCallback((type: 'click' | 'add' | 'remove') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'add') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'remove') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  }, [soundEnabled]);

  const addString = () => {
    if (newString.trim()) {
      setStrings([...strings, newString.trim()]);
      setNewString('');
      playSound('add');
    }
  };

  const removeString = (index: number) => {
    setStrings(strings.filter((_, i) => i !== index));
    if (selectedIndex === index) setSelectedIndex(null);
    playSound('remove');
  };

  const cloneString = (index: number) => {
    const cloned = [...strings];
    cloned.splice(index + 1, 0, strings[index]);
    setStrings(cloned);
    playSound('add');
  };

  const joinStrings = () => {
    if (strings.length === 0) return;
    const joined = strings.join('');
    setStrings([joined]);
    setSelectedIndex(null);
    playSound('add');
  };

  const toHex = (str: string) => {
    return str.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
  };

  const toBinary = (str: string) => {
    return str.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
  };

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-cyan-950/10 to-slate-950 rounded-xl border border-cyan-900/30 font-sans overflow-hidden">
      <div className="bg-slate-900/80 border-b border-cyan-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/15 border border-cyan-500/40">
              <FileDigit className="text-cyan-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-cyan-300 tracking-wide font-mono">BINARY STRINGS</h2>
              <p className="text-xs text-cyan-500/70">Byte String Operations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={joinStrings}
              disabled={strings.length < 2}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 disabled:opacity-50"
            >
              <Layers size={14} className="inline mr-1" />
              Join All
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newString}
            onChange={(e) => setNewString(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addString()}
            placeholder="Add new string..."
            className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-cyan-500/50"
          />
          <button
            onClick={addString}
            className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-500/30 transition-all"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          <AnimatePresence>
            {strings.map((str, index) => (
              <motion.div
                key={`${index}-${str}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedIndex === index 
                    ? 'bg-cyan-900/30 border-cyan-500/50' 
                    : 'bg-slate-900/30 border-slate-800 hover:border-cyan-500/30'
                }`}
                onClick={() => { setSelectedIndex(index); playSound('click'); }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-mono text-cyan-300">"{str}"</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); cloneString(index); }}
                      className="p-1.5 rounded hover:bg-slate-700 text-slate-400 transition-all"
                      title="Clone"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeString(index); }}
                      className="p-1.5 rounded hover:bg-red-900/30 text-red-400 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="text-slate-500">ASCII: {str.split('').map(c => c.charCodeAt(0)).join(' ')}</div>
                  <div className="text-slate-500">Length: {str.length} bytes</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {selectedIndex !== null && strings[selectedIndex] && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/50 rounded-xl border border-cyan-800/30 p-4"
          >
            <div className="text-xs text-cyan-400 mb-2">Detailed View</div>
            <div className="space-y-2 font-mono text-xs">
              <div className="text-slate-300">String: "{strings[selectedIndex]}"</div>
              <div className="text-slate-500">Hex: {toHex(strings[selectedIndex])}</div>
              <div className="text-slate-600 break-all">Binary: {toBinary(strings[selectedIndex])}</div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
