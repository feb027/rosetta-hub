import { useState, useRef, useCallback, useEffect } from 'react';
import { Binary, RotateCcw, Volume2, VolumeX, Play, Copy, Check, Calculator, FlipHorizontal, ArrowLeftRight, Plus, Minus, Divide } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function BinaryDigitsVisualization() {
  const [input, setInput] = useState('50');
  const [binary, setBinary] = useState('');
  const [hex, setHex] = useState('');
  const [octal, setOctal] = useState('');
  const [bits, setBits] = useState<Array<{ value: number; position: number; power: number }>>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'binary' | 'hex' | 'octal'>('binary');
  const [secondInput, setSecondInput] = useState('10');
  const [operation, setOperation] = useState<'and' | 'or' | 'xor' | 'not' | 'shl' | 'shr'>('and');
  const [result, setResult] = useState<number | null>(null);
  const [counterMode, setCounterMode] = useState(false);
  const [counterValue, setCounterValue] = useState(0);
  const [flippedBits, setFlippedBits] = useState<Set<number>>(new Set());

  const audioContextRef = useRef<AudioContext | null>(null);
  const counterRef = useRef<NodeJS.Timeout | null>(null);

  const playSound = useCallback((type: 'tick' | 'complete' | 'flip', freq = 800) => {
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
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.start(now);
      osc.stop(now + 0.03);
    } else if (type === 'complete') {
      [523, 659, 784, 1047].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.08);
        gain.gain.setValueAtTime(0.04, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3 + i * 0.08);
        osc.start(now + i * 0.08);
        osc.stop(now + 0.4 + i * 0.08);
      });
    } else if (type === 'flip') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  }, [soundEnabled]);

  const convert = async () => {
    const num = parseInt(input);
    if (isNaN(num) || num < 0) return;
    
    setIsConverting(true);
    setBinary('');
    setHex('');
    setOctal('');
    setBits([]);
    setFlippedBits(new Set());

    if (num === 0) {
      setBinary('0');
      setHex('0');
      setOctal('0');
      setBits([{ value: 0, position: 0, power: 1 }]);
      setIsConverting(false);
      return;
    }

    // Set hex and octal immediately
    setHex(num.toString(16).toUpperCase());
    setOctal(num.toString(8));

    let temp = num;
    const bitArray: Array<{ value: number; position: number; power: number }> = [];
    let position = 0;

    while (temp > 0) {
      const bit = temp % 2;
      bitArray.unshift({ value: bit, position, power: Math.pow(2, position) });
      temp = Math.floor(temp / 2);
      position++;
      playSound('tick', 600 + position * 50);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Add leading zeros to make it byte-aligned
    while (bitArray.length % 8 !== 0) {
      bitArray.unshift({ value: 0, position: bitArray.length, power: Math.pow(2, bitArray.length) });
    }

    setBits(bitArray);
    setBinary(bitArray.map(b => b.value).join(''));
    playSound('complete');
    setIsConverting(false);
  };

  const flipBit = (index: number) => {
    const newBits = [...bits];
    newBits[index].value = newBits[index].value === 1 ? 0 : 1;
    setBits(newBits);
    setBinary(newBits.map(b => b.value).join(''));
    
    // Recalculate decimal
    const newValue = newBits.reduce((acc, bit, i) => {
      return acc + bit.value * Math.pow(2, newBits.length - 1 - i);
    }, 0);
    setInput(newValue.toString());
    setHex(newValue.toString(16).toUpperCase());
    setOctal(newValue.toString(8));
    
    const newFlipped = new Set(flippedBits);
    newFlipped.add(index);
    setFlippedBits(newFlipped);
    
    playSound('flip');
    
    setTimeout(() => {
      const resetFlipped = new Set(flippedBits);
      resetFlipped.delete(index);
      setFlippedBits(resetFlipped);
    }, 300);
  };

  const calculateBitwise = () => {
    const a = parseInt(input) || 0;
    const b = parseInt(secondInput) || 0;
    let res = 0;
    
    switch (operation) {
      case 'and': res = a & b; break;
      case 'or': res = a | b; break;
      case 'xor': res = a ^ b; break;
      case 'not': res = ~a; break;
      case 'shl': res = a << b; break;
      case 'shr': res = a >> b; break;
    }
    
    setResult(res);
    playSound('complete');
  };

  const copyBinary = () => {
    navigator.clipboard.writeText(binary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleCounter = () => {
    if (counterMode) {
      setCounterMode(false);
      if (counterRef.current) clearInterval(counterRef.current);
    } else {
      setCounterMode(true);
      setCounterValue(parseInt(input) || 0);
      counterRef.current = setInterval(() => {
        setCounterValue(v => {
          const newVal = (v + 1) % 256;
          setInput(newVal.toString());
          return newVal;
        });
      }, 500);
    }
  };

  useEffect(() => {
    return () => {
      if (counterRef.current) clearInterval(counterRef.current);
    };
  }, []);

  useEffect(() => {
    if (counterMode) {
      convert();
    }
  }, [counterValue, counterMode]);

  const testValues = ['5', '50', '255', '1024', '9000'];

  return (
    <div className="w-full bg-gradient-to-br from-slate-950 via-emerald-950/30 to-slate-950 rounded-xl border border-emerald-800/50 font-sans overflow-hidden shadow-2xl shadow-emerald-900/30">
      {/* Header */}
      <div className="bg-slate-900/90 border-b border-emerald-700/50 px-6 py-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 border border-emerald-400/50 shadow-lg shadow-emerald-500/20">
              <Binary className="text-emerald-300" size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-emerald-200 tracking-wide font-mono">BINARY CONVERTER</h2>
              <p className="text-sm text-emerald-400/70">Decimal → Binary → Hex → Octal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleCounter}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all flex items-center gap-2 ${
                counterMode 
                  ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400/60 animate-pulse' 
                  : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-emerald-500/40'
              }`}
            >
              <ArrowLeftRight size={16} />
              {counterMode ? 'Stop Counter' : 'Auto Counter'}
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-3 rounded-lg border transition-all ${
                soundEnabled ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-2">
          {(['binary', 'hex', 'octal'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-xl font-medium transition-all capitalize ${
                activeTab === tab
                  ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/60'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-emerald-500/30'
              }`}
            >
              {tab === 'binary' ? 'Binary' : tab === 'hex' ? 'Hexadecimal' : 'Octal'}
            </button>
          ))}
        </div>

        {/* Main Input */}
        <div className="bg-slate-900/60 rounded-2xl border border-slate-700/60 p-6 shadow-xl">
          <label className="block text-sm text-emerald-400/80 mb-3 font-medium">Decimal Number</label>
          <div className="flex gap-4">
            <input
              type="number"
              min="0"
              max="999999"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={counterMode}
              className="flex-1 px-5 py-4 bg-slate-800/80 border border-slate-600/50 rounded-xl text-slate-200 font-mono text-2xl focus:outline-none focus:border-emerald-500/70 transition-all disabled:opacity-50"
            />
            <motion.button
              onClick={convert}
              disabled={isConverting || counterMode}
              whileHover={{ scale: isConverting ? 1 : 1.05 }}
              whileTap={{ scale: isConverting ? 1 : 0.95 }}
              className="px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition-all bg-gradient-to-r from-emerald-500/30 to-teal-500/30 text-emerald-200 border border-emerald-400/60 hover:border-emerald-400/80 disabled:opacity-50 shadow-lg shadow-emerald-500/10"
            >
              {isConverting ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <Binary size={20} />
                </motion.div>
              ) : (
                <Play size={20} />
              )}
              CONVERT
            </motion.button>
          </div>

          {/* Quick Values */}
          <div className="mt-4 flex flex-wrap gap-2">
            {testValues.map(v => (
              <button
                key={v}
                onClick={() => setInput(v)}
                disabled={counterMode}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-emerald-500/40 hover:text-emerald-300 transition-all font-mono disabled:opacity-50"
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Results Display */}
        <AnimatePresence mode="wait">
          {binary && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Main Display */}
              <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 rounded-2xl border border-emerald-500/50 p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-emerald-400/80 font-mono uppercase tracking-wider">
                    {activeTab === 'binary' ? 'Binary Result' : activeTab === 'hex' ? 'Hexadecimal' : 'Octal'}
                  </span>
                  <button
                    onClick={copyBinary}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 text-sm hover:bg-emerald-500/30 transition-all"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                
                {/* LED Display Style */}
                <div className="bg-black/40 rounded-xl p-6 font-mono text-3xl md:text-4xl font-bold text-emerald-400 tracking-wider break-all text-center border-2 border-emerald-500/30 shadow-inner shadow-black/50">
                  {activeTab === 'binary' ? binary : activeTab === 'hex' ? hex : octal}
                </div>

                {/* All Conversions */}
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">Binary</div>
                    <div className="text-sm font-mono text-emerald-300">{binary}</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">Hexadecimal</div>
                    <div className="text-sm font-mono text-emerald-300">0x{hex}</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">Octal</div>
                    <div className="text-sm font-mono text-emerald-300">0{octal}</div>
                  </div>
                </div>
              </div>

              {/* Bit Breakdown */}
              <div className="bg-slate-900/60 rounded-2xl border border-slate-700/60 p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-emerald-400">Bit Breakdown (Click to Flip)</h3>
                  <span className="text-xs text-slate-500">Toggle individual bits</span>
                </div>
                
                <div className="grid grid-cols-8 gap-2">
                  {bits.map((bit, i) => (
                    <motion.button
                      key={i}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ 
                        scale: flippedBits.has(i) ? 1.2 : 1, 
                        rotate: 0,
                        backgroundColor: bit.value === 1 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(30, 41, 59, 0.8)'
                      }}
                      transition={{ delay: i * 0.05, type: 'spring', stiffness: 200 }}
                      onClick={() => flipBit(i)}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center border-2 transition-all ${
                        bit.value === 1 
                          ? 'border-emerald-400/60 shadow-lg shadow-emerald-500/20' 
                          : 'border-slate-600/50'
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <span className={`text-xl font-bold ${bit.value === 1 ? 'text-emerald-300' : 'text-slate-500'}`}>
                        {bit.value}
                      </span>
                      <span className="text-[8px] text-slate-600 mt-1">
                        2^{bits.length - 1 - i}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bitwise Calculator */}
        <div className="bg-slate-900/60 rounded-2xl border border-slate-700/60 p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <Calculator size={20} className="text-emerald-400" />
            <h3 className="text-lg font-semibold text-emerald-300">Bitwise Operations</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <input
              type="number"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="px-4 py-3 bg-slate-800/80 border border-slate-600/50 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-emerald-500/70"
              placeholder="First number"
            />
            <select
              value={operation}
              onChange={(e) => setOperation(e.target.value as any)}
              className="px-4 py-3 bg-slate-800/80 border border-slate-600/50 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500/70"
            >
              <option value="and">AND (&)</option>
              <option value="or">OR (|)</option>
              <option value="xor">XOR (^)</option>
              <option value="not">NOT (~)</option>
              <option value="shl">Left Shift (&lt;&lt;)</option>
              <option value="shr">Right Shift (&gt;&gt;)</option>
            </select>
            <input
              type="number"
              value={secondInput}
              onChange={(e) => setSecondInput(e.target.value)}
              disabled={operation === 'not'}
              className="px-4 py-3 bg-slate-800/80 border border-slate-600/50 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-emerald-500/70 disabled:opacity-50"
              placeholder="Second number"
            />
          </div>
          
          <button
            onClick={calculateBitwise}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-400/40 hover:border-emerald-400/60 transition-all font-medium"
          >
            Calculate
          </button>
          
          <AnimatePresence>
            {result !== null && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 bg-emerald-900/30 rounded-xl border border-emerald-500/40"
              >
                <div className="text-center">
                  <div className="text-sm text-emerald-400/70 mb-1">Result</div>
                  <div className="text-2xl font-mono font-bold text-emerald-300">{result}</div>
                  <div className="text-xs text-emerald-500/60 mt-2">
                    Binary: {result.toString(2)} | Hex: 0x{result.toString(16).toUpperCase()}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
