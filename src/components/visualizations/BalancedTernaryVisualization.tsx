import { useState, useRef, useCallback, useEffect } from 'react';
import { Calculator, RotateCcw, Volume2, VolumeX, ArrowRight, Plus, Minus, X, Equal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Balanced Ternary Logic ---
type Trit = '+' | '0' | '-';

const tritToValue = (t: Trit): number => (t === '+' ? 1 : t === '-' ? -1 : 0);
const valueToTrit = (v: number): Trit => (v === 1 ? '+' : v === -1 ? '-' : '0');

// Convert decimal to balanced ternary
const decimalToBalancedTernary = (n: number): string => {
  if (n === 0) return '0';
  
  const trits: Trit[] = [];
  let num = n;
  
  while (num !== 0) {
    let rem = ((num % 3) + 3) % 3; // Always positive remainder
    if (rem === 2) {
      rem = -1;
      num = Math.floor((num + 1) / 3);
    } else {
      num = Math.floor(num / 3);
    }
    trits.push(valueToTrit(rem));
  }
  
  return trits.reverse().join('');
};

// Convert balanced ternary to decimal
const balancedTernaryToDecimal = (bt: string): number => {
  let result = 0;
  for (let i = 0; i < bt.length; i++) {
    const trit = bt[i] as Trit;
    const power = bt.length - 1 - i;
    result += tritToValue(trit) * Math.pow(3, power);
  }
  return result;
};

// Negate balanced ternary
const negateBalancedTernary = (bt: string): string => {
  return bt.split('').map(t => {
    if (t === '+') return '-';
    if (t === '-') return '+';
    return '0';
  }).join('');
};

// Add two balanced ternary numbers
const addBalancedTernary = (a: string, b: string): string => {
  // Pad to same length
  const maxLen = Math.max(a.length, b.length);
  const padA = a.padStart(maxLen, '0');
  const padB = b.padStart(maxLen, '0');
  
  let carry = 0;
  const result: Trit[] = [];
  
  for (let i = maxLen - 1; i >= 0; i--) {
    const sum = tritToValue(padA[i] as Trit) + tritToValue(padB[i] as Trit) + carry;
    
    if (sum >= 2) {
      result.unshift(valueToTrit(sum - 3));
      carry = 1;
    } else if (sum <= -2) {
      result.unshift(valueToTrit(sum + 3));
      carry = -1;
    } else {
      result.unshift(valueToTrit(sum));
      carry = 0;
    }
  }
  
  if (carry !== 0) {
    result.unshift(valueToTrit(carry));
  }
  
  // Remove leading zeros
  let str = result.join('');
  while (str.length > 1 && str[0] === '0') {
    str = str.slice(1);
  }
  
  return str || '0';
};

// Multiply balanced ternary numbers
const multiplyBalancedTernary = (a: string, b: string): string => {
  let result = '0';
  
  for (let i = b.length - 1; i >= 0; i--) {
    const trit = b[i] as Trit;
    const shift = b.length - 1 - i;
    
    if (trit !== '0') {
      let partial = a + '0'.repeat(shift);
      if (trit === '-') {
        partial = negateBalancedTernary(partial);
      }
      result = addBalancedTernary(result, partial);
    }
  }
  
  return result;
};

// Validate balanced ternary string
const isValidBT = (s: string): boolean => /^[+\-0]+$/.test(s) && s.length > 0;

// Presets
const PRESETS = [
  { label: '11', decimal: 11, bt: '++-' },
  { label: '6', decimal: 6, bt: '+-0' },
  { label: '-13', decimal: -13, bt: '---' },
  { label: '27', decimal: 27, bt: '+000' },
  { label: '-436', decimal: -436, bt: '-+--+' },
];

export default function BalancedTernaryVisualization() {
  const [decimalInput, setDecimalInput] = useState('11');
  const [btInput, setBtInput] = useState('++-');
  const [convertedBT, setConvertedBT] = useState('++-');
  const [convertedDecimal, setConvertedDecimal] = useState(11);
  const [showBreakdown, setShowBreakdown] = useState(true);
  
  // Calculator state
  const [calcA, setCalcA] = useState('++-');
  const [calcB, setCalcB] = useState('+-0');
  const [calcOp, setCalcOp] = useState<'+' | '-' | '×'>('+');
  const [calcResult, setCalcResult] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);


  // --- Audio ---
  const playSound = useCallback((type: 'convert' | 'trit' | 'calculate' | 'result' | 'error') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'convert') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'trit') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'calculate') {
      [440, 550, 660].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.05, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15 + i * 0.1);
        osc.start(now + i * 0.1);
        osc.stop(now + 0.2 + i * 0.1);
      });
    } else if (type === 'result') {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.06, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2 + i * 0.08);
        osc.start(now + i * 0.08);
        osc.stop(now + 0.25 + i * 0.08);
      });
    } else if (type === 'error') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  }, [soundEnabled]);

  // Convert decimal to BT
  const convertFromDecimal = useCallback(() => {
    const num = parseInt(decimalInput);
    if (isNaN(num)) {
      playSound('error');
      return;
    }
    const bt = decimalToBalancedTernary(num);
    setConvertedBT(bt);
    setBtInput(bt);
    setConvertedDecimal(num);
    playSound('convert');
  }, [decimalInput, playSound]);

  // Convert BT to decimal
  const convertFromBT = useCallback(() => {
    if (!isValidBT(btInput)) {
      playSound('error');
      return;
    }
    const dec = balancedTernaryToDecimal(btInput);
    setConvertedDecimal(dec);
    setDecimalInput(dec.toString());
    setConvertedBT(btInput);
    playSound('convert');
  }, [btInput, playSound]);

  // Calculate
  const calculate = useCallback(() => {
    if (!isValidBT(calcA) || !isValidBT(calcB)) {
      playSound('error');
      return;
    }
    
    setIsCalculating(true);
    playSound('calculate');
    
    setTimeout(() => {
      let result: string;
      if (calcOp === '+') {
        result = addBalancedTernary(calcA, calcB);
      } else if (calcOp === '-') {
        result = addBalancedTernary(calcA, negateBalancedTernary(calcB));
      } else {
        result = multiplyBalancedTernary(calcA, calcB);
      }
      setCalcResult(result);
      setIsCalculating(false);
      playSound('result');
    }, 600);
  }, [calcA, calcB, calcOp, playSound]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'Enter') calculate();
      if (e.key === 'r' || e.key === 'R') {
        setCalcResult(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [calculate]);

  // Get breakdown of BT number
  const getBreakdown = (bt: string) => {
    const parts: { trit: string; power: number; value: number; contribution: number }[] = [];
    for (let i = 0; i < bt.length; i++) {
      const trit = bt[i];
      const power = bt.length - 1 - i;
      const value = tritToValue(trit as Trit);
      const contribution = value * Math.pow(3, power);
      parts.push({ trit, power, value, contribution });
    }
    return parts;
  };

  const breakdown = getBreakdown(convertedBT);

  // Trit display component
  const TritDisplay = ({ trit, size = 'md', animate = false }: { trit: string; size?: 'sm' | 'md' | 'lg'; animate?: boolean }) => {
    const sizeClasses = {
      sm: 'w-8 h-10 text-lg',
      md: 'w-12 h-14 text-2xl',
      lg: 'w-16 h-20 text-4xl',
    };
    
    const colorClasses = {
      '+': 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400',
      '-': 'bg-rose-500/20 border-rose-500/50 text-rose-400',
      '0': 'bg-slate-700/50 border-slate-600/50 text-slate-400',
    };
    
    return (
      <motion.div
        initial={animate ? { scale: 0, rotateY: 180 } : false}
        animate={{ scale: 1, rotateY: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`${sizeClasses[size]} ${colorClasses[trit as keyof typeof colorClasses] || colorClasses['0']} 
          rounded-lg border-2 flex items-center justify-center font-mono font-bold
          shadow-lg backdrop-blur-sm`}
      >
        {trit}
      </motion.div>
    );
  };

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-emerald-950/5 to-slate-950 rounded-xl border border-emerald-900/30 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-emerald-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <Calculator className="text-emerald-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-300 tracking-wide">TRIT CALCULATOR</h2>
              <p className="text-xs text-emerald-500/70">Balanced Ternary System</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled 
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' 
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
        </div>
      </div>


      {/* Main Content */}
      <div className="p-6 space-y-6">
        
        {/* Converter Section */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5 space-y-4">
          <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
            <ArrowRight size={16} />
            CONVERTER
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
            {/* Decimal Input */}
            <div>
              <label className="text-xs text-slate-500 mb-2 block">Decimal</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={decimalInput}
                  onChange={(e) => setDecimalInput(e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-xl text-emerald-300 font-mono text-center focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  onClick={convertFromDecimal}
                  className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-300 hover:bg-emerald-500/30 transition-all"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>

            {/* Swap indicator */}
            <div className="hidden md:flex items-center justify-center text-slate-600">
              ⇄
            </div>

            {/* Balanced Ternary Input */}
            <div>
              <label className="text-xs text-slate-500 mb-2 block">Balanced Ternary (+, 0, -)</label>
              <div className="flex gap-2">
                <button
                  onClick={convertFromBT}
                  className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-300 hover:bg-emerald-500/30 transition-all"
                >
                  <ArrowRight size={18} className="rotate-180" />
                </button>
                <input
                  type="text"
                  value={btInput}
                  onChange={(e) => setBtInput(e.target.value.replace(/[^+\-0]/g, ''))}
                  placeholder="++-"
                  className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-xl text-emerald-300 font-mono text-center tracking-widest focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="text-xs text-slate-500 self-center">Examples:</span>
            {PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDecimalInput(preset.decimal.toString());
                  setBtInput(preset.bt);
                  setConvertedBT(preset.bt);
                  setConvertedDecimal(preset.decimal);
                  playSound('trit');
                }}
                className="px-3 py-1.5 text-xs rounded-lg border bg-slate-800 border-slate-700 text-slate-400 hover:text-emerald-300 hover:border-emerald-500/50 transition-all font-mono"
              >
                {preset.label} = {preset.bt}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Display */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-6">
          <div className="flex flex-col items-center gap-6">
            {/* Large Trit Display */}
            <div className="flex gap-2 justify-center flex-wrap">
              {convertedBT.split('').map((trit, idx) => (
                <TritDisplay key={idx} trit={trit} size="lg" animate />
              ))}
            </div>
            
            {/* Decimal equivalent */}
            <div className="text-center">
              <div className="text-4xl font-bold text-white font-mono">{convertedDecimal}</div>
              <div className="text-xs text-slate-500 mt-1">Decimal Value</div>
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 overflow-hidden">
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="w-full px-4 py-3 flex items-center justify-between text-sm text-emerald-400 hover:bg-slate-800/50 transition-colors"
          >
            <span>Place Value Breakdown</span>
            <span className="text-xs text-slate-500">{showBreakdown ? 'Hide' : 'Show'}</span>
          </button>
          
          <AnimatePresence>
            {showBreakdown && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 border-t border-slate-800">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-slate-500 text-xs">
                          <th className="px-3 py-2 text-left">Trit</th>
                          <th className="px-3 py-2 text-center">Power</th>
                          <th className="px-3 py-2 text-center">3^n</th>
                          <th className="px-3 py-2 text-center">Value</th>
                          <th className="px-3 py-2 text-right">Contribution</th>
                        </tr>
                      </thead>
                      <tbody>
                        {breakdown.map((part, idx) => (
                          <motion.tr
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="border-t border-slate-800/50"
                          >
                            <td className="px-3 py-2">
                              <TritDisplay trit={part.trit} size="sm" />
                            </td>
                            <td className="px-3 py-2 text-center text-slate-400 font-mono">
                              3<sup>{part.power}</sup>
                            </td>
                            <td className="px-3 py-2 text-center text-slate-500 font-mono">
                              {Math.pow(3, part.power)}
                            </td>
                            <td className="px-3 py-2 text-center font-mono">
                              <span className={part.value > 0 ? 'text-emerald-400' : part.value < 0 ? 'text-rose-400' : 'text-slate-500'}>
                                {part.value > 0 ? '+1' : part.value < 0 ? '-1' : '0'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-bold">
                              <span className={part.contribution > 0 ? 'text-emerald-400' : part.contribution < 0 ? 'text-rose-400' : 'text-slate-500'}>
                                {part.contribution > 0 ? '+' : ''}{part.contribution}
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                        <tr className="border-t-2 border-emerald-500/30 bg-emerald-500/5">
                          <td colSpan={4} className="px-3 py-2 text-right text-emerald-400 font-bold">
                            Total =
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-emerald-300 text-lg">
                            {convertedDecimal}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>


        {/* Calculator Section */}
        <div className="bg-slate-900/50 rounded-xl border border-emerald-500/20 p-5 space-y-4">
          <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
            <Calculator size={16} />
            ARITHMETIC CALCULATOR
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_auto_1fr] gap-3 items-center">
            {/* Operand A */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">A (Balanced Ternary)</label>
              <input
                type="text"
                value={calcA}
                onChange={(e) => { setCalcA(e.target.value.replace(/[^+\-0]/g, '')); setCalcResult(null); }}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-lg text-emerald-300 font-mono text-center tracking-widest focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <div className="text-xs text-slate-600 text-center mt-1 font-mono">
                = {isValidBT(calcA) ? balancedTernaryToDecimal(calcA) : '?'}
              </div>
            </div>

            {/* Operator */}
            <div className="flex gap-1 justify-center">
              {(['+', '-', '×'] as const).map((op) => (
                <button
                  key={op}
                  onClick={() => { setCalcOp(op); setCalcResult(null); }}
                  className={`w-10 h-10 rounded-lg border-2 font-bold text-lg transition-all ${
                    calcOp === op
                      ? 'bg-emerald-500/30 border-emerald-500 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-emerald-500/50'
                  }`}
                >
                  {op === '+' ? <Plus size={18} className="mx-auto" /> : 
                   op === '-' ? <Minus size={18} className="mx-auto" /> : 
                   <X size={18} className="mx-auto" />}
                </button>
              ))}
            </div>

            {/* Operand B */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">B (Balanced Ternary)</label>
              <input
                type="text"
                value={calcB}
                onChange={(e) => { setCalcB(e.target.value.replace(/[^+\-0]/g, '')); setCalcResult(null); }}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-lg text-emerald-300 font-mono text-center tracking-widest focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <div className="text-xs text-slate-600 text-center mt-1 font-mono">
                = {isValidBT(calcB) ? balancedTernaryToDecimal(calcB) : '?'}
              </div>
            </div>

            {/* Equals */}
            <button
              onClick={calculate}
              disabled={isCalculating}
              className={`w-12 h-12 rounded-lg border-2 font-bold transition-all ${
                isCalculating
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse'
                  : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30'
              }`}
            >
              <Equal size={20} className="mx-auto" />
            </button>

            {/* Result */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Result</label>
              <div className="w-full px-4 py-3 bg-slate-900 border border-emerald-500/30 rounded-lg text-lg text-emerald-300 font-mono text-center tracking-widest min-h-[52px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {isCalculating ? (
                    <motion.span
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-amber-400"
                    >
                      ...
                    </motion.span>
                  ) : calcResult ? (
                    <motion.span
                      key="result"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-emerald-300"
                    >
                      {calcResult}
                    </motion.span>
                  ) : (
                    <span className="text-slate-600">?</span>
                  )}
                </AnimatePresence>
              </div>
              <div className="text-xs text-slate-600 text-center mt-1 font-mono">
                = {calcResult && isValidBT(calcResult) ? balancedTernaryToDecimal(calcResult) : '?'}
              </div>
            </div>
          </div>

          {/* Verification */}
          {calcResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700"
            >
              <div className="text-xs text-slate-400 text-center font-mono">
                Verification: {balancedTernaryToDecimal(calcA)} {calcOp === '×' ? '×' : calcOp} {balancedTernaryToDecimal(calcB)} = {balancedTernaryToDecimal(calcResult)}
              </div>
            </motion.div>
          )}

          {/* Reset */}
          <div className="flex justify-end">
            <button
              onClick={() => setCalcResult(null)}
              className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-emerald-300 hover:border-emerald-500/50 transition-all flex items-center gap-1"
            >
              <RotateCcw size={12} />
              Clear
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-[10px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-mono font-bold">+</span>
            = +1
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded bg-slate-700/50 border border-slate-600/50 flex items-center justify-center text-slate-400 font-mono font-bold">0</span>
            = 0
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 font-mono font-bold">-</span>
            = -1
          </span>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Enter</kbd> Calculate
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Clear Result
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
          What is Balanced Ternary?
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            <span className="text-emerald-300">Balanced ternary</span> is a non-standard positional numeral system 
            using base 3 with digits {'{+1, 0, -1}'} instead of {'{0, 1, 2}'}.
          </p>
          <p>
            <span className="text-amber-300">Advantages:</span> No separate sign needed for negative numbers, 
            rounding is simple (truncation), and arithmetic operations are elegant.
          </p>
          <p>
            <span className="text-cyan-300">History:</span> Used in the Soviet Setun computer (1958), 
            one of the few ternary computers ever built.
          </p>
        </div>
      </details>
    </div>
  );
}
