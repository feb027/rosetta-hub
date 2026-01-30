import { useState, useRef, useCallback } from 'react';
import { Binary, RotateCcw, Volume2, VolumeX, Play, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function BinaryDigitsVisualization() {
  const [input, setInput] = useState('50');
  const [binary, setBinary] = useState('');
  const [bits, setBits] = useState<Array<{ value: number; position: number }>>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copied, setCopied] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);

  const playSound = useCallback((type: 'tick' | 'complete') => {
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
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'complete') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  }, [soundEnabled]);

  const convert = async () => {
    const num = parseInt(input);
    if (isNaN(num) || num < 0) return;
    
    setIsConverting(true);
    setBinary('');
    setBits([]);

    if (num === 0) {
      setBinary('0');
      setBits([{ value: 0, position: 0 }]);
      setIsConverting(false);
      return;
    }

    let temp = num;
    const bitArray: Array<{ value: number; position: number }> = [];
    let position = 0;

    while (temp > 0) {
      const bit = temp % 2;
      bitArray.unshift({ value: bit, position });
      temp = Math.floor(temp / 2);
      position++;
      playSound('tick');
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setBits(bitArray);
    setBinary(bitArray.map(b => b.value).join(''));
    playSound('complete');
    setIsConverting(false);
  };

  const copyBinary = () => {
    navigator.clipboard.writeText(binary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const testValues = ['5', '50', '9000', '255', '1024'];

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-emerald-950/10 to-slate-950 rounded-xl border border-emerald-900/30 font-sans overflow-hidden">
      <div className="bg-slate-900/80 border-b border-emerald-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/40">
              <Binary className="text-emerald-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-300 tracking-wide font-mono">BINARY CONVERTER</h2>
              <p className="text-xs text-emerald-500/70">Decimal to Binary Visualizer</p>
            </div>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border transition-all ${
              soundEnabled ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <label className="block text-xs text-slate-400 mb-2">Decimal Number</label>
          <div className="flex gap-3">
            <input
              type="number"
              min="0"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono text-lg focus:outline-none focus:border-emerald-500/50"
            />
            <button
              onClick={convert}
              disabled={isConverting}
              className="px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30 disabled:opacity-50"
            >
              <Play size={18} />
              {isConverting ? '...' : 'CONVERT'}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {testValues.map(v => (
              <button
                key={v}
                onClick={() => setInput(v)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-emerald-500/30 transition-all font-mono"
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {binary && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-900/20 rounded-xl border border-emerald-500/50 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-emerald-400 font-mono">BINARY RESULT</span>
                <button
                  onClick={copyBinary}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs hover:bg-emerald-500/30 transition-all"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="text-3xl font-bold text-emerald-300 font-mono tracking-wider break-all">
                {binary}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {bits.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/30 rounded-xl border border-slate-800 p-4"
            >
              <div className="text-xs text-slate-500 mb-3">Bit Breakdown (2^n values)</div>
              <div className="flex flex-wrap gap-2">
                {bits.map((bit, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex flex-col items-center"
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${
                      bit.value === 1 ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {bit.value}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 font-mono">
                      2^{bits.length - 1 - i}
                    </div>
                    <div className="text-[10px] text-slate-600">
                      = {Math.pow(2, bits.length - 1 - i)}
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
