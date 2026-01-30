import { useState, useRef, useCallback } from 'react';
import { BarChart3, RotateCcw, Volume2, VolumeX, Play, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Bin {
  label: string;
  count: number;
  color: string;
}

export default function BinGivenLimitsVisualization() {
  const [limitsInput, setLimitsInput] = useState('23, 37, 43, 53, 67, 83');
  const [dataInput, setDataInput] = useState('95,21,94,12,99,4,70,75,83,93,52,80,57,5,53,86,65,17,92,83,71,61,54,58,47,16,8,9,32,84,7,87,46,19,30,37,96,6,98,40,79,97,45,64,60,29,49,36,43,55');
  const [bins, setBins] = useState<Bin[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);

  const playSound = useCallback((type: 'process' | 'complete') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'process') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'complete') {
      [523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.05, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3 + i * 0.1);
        osc.start(now + i * 0.1);
        osc.stop(now + 0.4 + i * 0.1);
      });
    }
  }, [soundEnabled]);

  const processBins = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    playSound('process');

    const limits = limitsInput.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x)).sort((a, b) => a - b);
    const data = dataInput.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));

    const counts = new Array(limits.length + 1).fill(0);
    
    data.forEach(num => {
      let binIndex = 0;
      for (let i = 0; i < limits.length; i++) {
        if (num >= limits[i]) {
          binIndex = i + 1;
        } else {
          break;
        }
      }
      counts[binIndex]++;
    });

    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6'];
    const newBins: Bin[] = [];

    for (let i = 0; i <= limits.length; i++) {
      let label: string;
      if (i === 0) {
        label = `< ${limits[0]}`;
      } else if (i === limits.length) {
        label = `>= ${limits[limits.length - 1]}`;
      } else {
        label = `${limits[i - 1]} - ${limits[i] - 1}`;
      }
      newBins.push({
        label,
        count: counts[i],
        color: colors[i % colors.length]
      });
    }

    setBins(newBins);
    setTotalItems(data.length);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    playSound('complete');
    setIsProcessing(false);
  };

  const maxCount = Math.max(...bins.map(b => b.count), 1);

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-amber-950/10 to-slate-950 rounded-xl border border-amber-900/30 font-sans overflow-hidden">
      <div className="bg-slate-900/80 border-b border-amber-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/40">
              <BarChart3 className="text-amber-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-300 tracking-wide">DATA BINNING</h2>
              <p className="text-xs text-amber-500/70">Bin Given Limits Visualizer</p>
            </div>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border transition-all ${
              soundEnabled ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
            <label className="block text-xs text-slate-400 mb-2 flex items-center gap-2">
              <Hash size={14} />
              Limits (comma-separated)
            </label>
            <input
              type="text"
              value={limitsInput}
              onChange={(e) => setLimitsInput(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
            <label className="block text-xs text-slate-400 mb-2">Data (comma-separated)</label>
            <textarea
              value={dataInput}
              onChange={(e) => setDataInput(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:border-amber-500/50 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={processBins}
            disabled={isProcessing}
            className="flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30 disabled:opacity-50"
          >
            <Play size={18} />
            {isProcessing ? 'Processing...' : 'BIN DATA'}
          </button>
          <button
            onClick={() => { setBins([]); setTotalItems(0); }}
            className="px-4 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        <AnimatePresence>
          {bins.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/30 rounded-xl border border-amber-800/30 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-amber-400">Distribution</span>
                <span className="text-xs text-slate-500">Total: {totalItems}</span>
              </div>
              <div className="space-y-3">
                {bins.map((bin, i) => (
                  <motion.div
                    key={i}
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-24 text-xs text-slate-400 font-mono">{bin.label}</div>
                    <div className="flex-1 h-8 bg-slate-800 rounded-lg overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(bin.count / maxCount) * 100}%` }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        className="h-full flex items-center justify-end px-2"
                        style={{ backgroundColor: bin.color }}
                      >
                        <span className="text-xs font-bold text-white">{bin.count}</span>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
