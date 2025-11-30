import { useState, useRef, useCallback, useEffect } from 'react';
import { Volume2, VolumeX, RotateCcw, Compass, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

type AngleUnit = 'degrees' | 'gradians' | 'mils' | 'radians';

interface ConversionResult {
  original: number;
  unit: AngleUnit;
  normalized: Record<AngleUnit, number>;
}

// Full circle values for each unit
const FULL_CIRCLE: Record<AngleUnit, number> = {
  degrees: 360,
  gradians: 400,
  mils: 6400,
  radians: 2 * Math.PI,
};

// Unit display info
const UNIT_INFO: Record<AngleUnit, { symbol: string; name: string; color: string; bg: string; border: string }> = {
  degrees: { symbol: '°', name: 'Degrees', color: 'text-cyan-400', bg: 'bg-cyan-900/40', border: 'border-cyan-500/50' },
  gradians: { symbol: 'g', name: 'Gradians', color: 'text-emerald-400', bg: 'bg-emerald-900/40', border: 'border-emerald-500/50' },
  mils: { symbol: 'mil', name: 'Mils', color: 'text-amber-400', bg: 'bg-amber-900/40', border: 'border-amber-500/50' },
  radians: { symbol: 'rad', name: 'Radians', color: 'text-rose-400', bg: 'bg-rose-900/40', border: 'border-rose-500/50' },
};

// Test values from Rosetta Code
const TEST_VALUES = [-2, -1, 0, 1, 2, 6.2831853, 16, 57.2957795, 359, 399, 6399, 1000000];

// Normalize angle to (-fullCircle, fullCircle) keeping sign
const normalize = (value: number, fullCircle: number): number => {
  if (value === 0) return 0;
  const sign = value < 0 ? -1 : 1;
  const absVal = Math.abs(value);
  const normalized = absVal % fullCircle;
  return sign * normalized;
};

// Convert from one unit to another
const convert = (value: number, from: AngleUnit, to: AngleUnit): number => {
  // Convert to turns first, then to target unit
  const turns = value / FULL_CIRCLE[from];
  return turns * FULL_CIRCLE[to];
};

// Get all normalized conversions
const getAllConversions = (value: number, unit: AngleUnit): Record<AngleUnit, number> => {
  const result: Record<AngleUnit, number> = {} as Record<AngleUnit, number>;
  const units: AngleUnit[] = ['degrees', 'gradians', 'mils', 'radians'];
  
  for (const targetUnit of units) {
    const converted = convert(value, unit, targetUnit);
    result[targetUnit] = normalize(converted, FULL_CIRCLE[targetUnit]);
  }
  
  return result;
};

export default function AnglesConversionVisualization() {
  const [inputValue, setInputValue] = useState('45');
  const [inputUnit, setInputUnit] = useState<AngleUnit>('degrees');
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedTestIdx, setSelectedTestIdx] = useState<number | null>(null);
  const [showAllResults, setShowAllResults] = useState(false);
  const [allResults, setAllResults] = useState<ConversionResult[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);


  // Sound effects
  const playSound = useCallback((type: 'click' | 'convert' | 'tick' | 'complete') => {
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
    } else if (type === 'convert') {
      [400, 500, 600].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0.04, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1 + i * 0.05);
        osc.start(now + i * 0.05);
        osc.stop(now + 0.15 + i * 0.05);
      });
    } else if (type === 'tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      osc.start(now);
      osc.stop(now + 0.02);
    } else if (type === 'complete') {
      [523, 659, 784, 1047].forEach((freq, i) => {
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

  // Run all test values
  const runAllTests = useCallback(() => {
    const results: ConversionResult[] = TEST_VALUES.map(value => ({
      original: value,
      unit: 'degrees' as AngleUnit,
      normalized: getAllConversions(value, 'degrees'),
    }));
    setAllResults(results);
    setShowAllResults(true);
    playSound('complete');
  }, [playSound]);

  // Select test value
  const selectTestValue = useCallback((idx: number) => {
    setSelectedTestIdx(idx);
    setInputValue(TEST_VALUES[idx].toString());
    setInputUnit('degrees');
    playSound('tick');
  }, [playSound]);

  // Auto-convert on input change
  useEffect(() => {
    const value = parseFloat(inputValue);
    if (!isNaN(value)) {
      const normalized = getAllConversions(value, inputUnit);
      setResult({ original: value, unit: inputUnit, normalized });
    }
  }, [inputValue, inputUnit]);

  // Get rotation for dial (in degrees)
  const getDialRotation = (): number => {
    if (!result) return 0;
    return result.normalized.degrees;
  };

  const formatNumber = (n: number): string => {
    if (Math.abs(n) < 0.0001 && n !== 0) return n.toExponential(4);
    if (Number.isInteger(n)) return n.toString();
    return n.toFixed(6).replace(/\.?0+$/, '');
  };


  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-xl border border-slate-700/50 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="relative bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 border-b border-cyan-800/30 px-6 py-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(6,182,212,0.3) 0%, transparent 50%)`
        }} />
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative p-3 rounded-xl bg-cyan-900/30 border border-cyan-600/40">
              <Compass className="text-cyan-400" size={28} />
              <motion.div
                className="absolute inset-0 rounded-xl border-2 border-cyan-400/30"
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-cyan-300 tracking-wide">
                UNIVERSAL ANGLE TRANSLATOR
              </h2>
              <p className="text-xs text-slate-500">Degrees • Gradians • Mils • Radians</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={runAllTests}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-900/30 border border-emerald-600/50 text-emerald-400 hover:bg-emerald-900/50 transition-all"
            >
              Run All Tests
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled 
                  ? 'bg-slate-800/50 border-slate-600/50 text-slate-300' 
                  : 'bg-slate-900 border-slate-700 text-slate-600'
              }`}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6">
        
        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left: Input Controls */}
          <div className="space-y-4">
            <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Input Angle</div>
            
            {/* Value Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-lg text-xl font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50"
                placeholder="Enter angle..."
              />
              <button
                onClick={() => { setInputValue(''); setResult(null); playSound('click'); }}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition-all"
              >
                <RotateCcw size={18} />
              </button>
            </div>

            {/* Unit Selector */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(['degrees', 'gradians', 'mils', 'radians'] as AngleUnit[]).map(unit => {
                const info = UNIT_INFO[unit];
                return (
                  <button
                    key={unit}
                    onClick={() => { setInputUnit(unit); playSound('click'); }}
                    className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      inputUnit === unit
                        ? `${info.bg} ${info.border} ${info.color}`
                        : 'bg-slate-900/50 border-slate-700 text-slate-500 hover:border-slate-600'
                    }`}
                  >
                    {info.name}
                  </button>
                );
              })}
            </div>

            {/* Test Values */}
            <div className="space-y-2">
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Test Values (in degrees)</div>
              <div className="flex flex-wrap gap-1.5">
                {TEST_VALUES.map((val, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectTestValue(idx)}
                    className={`px-2 py-1 rounded text-xs font-mono transition-all ${
                      selectedTestIdx === idx
                        ? 'bg-cyan-900/50 border border-cyan-500/50 text-cyan-300'
                        : 'bg-slate-800/50 border border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Dial Visualization */}
          <div className="flex items-center justify-center">
            <div className="relative w-64 h-64">
              {/* Outer ring with markings */}
              <svg viewBox="0 0 220 220" className="w-full h-full">
                {/* Background circle */}
                <circle cx="110" cy="110" r="85" fill="none" stroke="rgba(100,116,139,0.2)" strokeWidth="2" />
                <circle cx="110" cy="110" r="70" fill="none" stroke="rgba(100,116,139,0.1)" strokeWidth="1" />
                
                {/* Degree markings */}
                {Array.from({ length: 36 }).map((_, i) => {
                  const angle = (i * 10 - 90) * (Math.PI / 180);
                  const x1 = 110 + 80 * Math.cos(angle);
                  const y1 = 110 + 80 * Math.sin(angle);
                  const x2 = 110 + (i % 9 === 0 ? 65 : 73) * Math.cos(angle);
                  const y2 = 110 + (i % 9 === 0 ? 65 : 73) * Math.sin(angle);
                  return (
                    <line
                      key={i}
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={i % 9 === 0 ? 'rgba(6,182,212,0.5)' : 'rgba(100,116,139,0.3)'}
                      strokeWidth={i % 9 === 0 ? 2 : 1}
                    />
                  );
                })}
                
                {/* Cardinal labels - outside the dial */}
                {[
                  { deg: 0, x: 110, y: 12 },
                  { deg: 90, x: 205, y: 110 },
                  { deg: 180, x: 110, y: 208 },
                  { deg: 270, x: 15, y: 110 },
                ].map(({ deg, x, y }) => (
                  <text
                    key={deg}
                    x={x} y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-cyan-400/70 text-[10px] font-mono"
                  >
                    {deg}°
                  </text>
                ))}
                
                {/* Needle */}
                <motion.g
                  animate={{ rotate: getDialRotation() }}
                  transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                  style={{ transformOrigin: '110px 110px' }}
                >
                  <line x1="110" y1="110" x2="110" y2="35" stroke="url(#needleGradient)" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="110" cy="35" r="4" fill="#06b6d4" />
                </motion.g>
                
                {/* Center dot */}
                <circle cx="110" cy="110" r="6" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" />
                
                {/* Center display text */}
                <text x="110" y="105" textAnchor="middle" className="fill-cyan-300 text-lg font-bold font-mono">
                  {result ? formatNumber(result.normalized.degrees) : '—'}°
                </text>
                <text x="110" y="122" textAnchor="middle" className="fill-slate-500 text-[8px]">
                  normalized
                </text>
                
                <defs>
                  <linearGradient id="needleGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#0f172a" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>


        {/* Conversion Results */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="font-mono">{formatNumber(result.original)}</span>
              <span className={UNIT_INFO[result.unit].color}>{UNIT_INFO[result.unit].symbol}</span>
              <ArrowRight size={14} className="text-slate-600" />
              <span className="text-slate-500">normalized to all units</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['degrees', 'gradians', 'mils', 'radians'] as AngleUnit[]).map(unit => {
                const info = UNIT_INFO[unit];
                const value = result.normalized[unit];
                return (
                  <motion.div
                    key={unit}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`p-4 rounded-xl border-2 ${info.bg} ${info.border}`}
                  >
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{info.name}</div>
                    <div className={`text-xl font-bold font-mono ${info.color}`}>
                      {formatNumber(value)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {info.symbol} (1 turn = {FULL_CIRCLE[unit]})
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* All Test Results Table */}
        {showAllResults && allResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/30 flex items-center justify-between">
              <span className="text-sm font-mono text-slate-300">All Test Values (normalized)</span>
              <button
                onClick={() => setShowAllResults(false)}
                className="text-xs text-slate-500 hover:text-slate-300"
              >
                Hide
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="px-4 py-2 text-left text-slate-500 font-mono">Input (°)</th>
                    <th className={`px-3 py-2 text-right ${UNIT_INFO.degrees.color}`}>Degrees</th>
                    <th className={`px-3 py-2 text-right ${UNIT_INFO.gradians.color}`}>Gradians</th>
                    <th className={`px-3 py-2 text-right ${UNIT_INFO.mils.color}`}>Mils</th>
                    <th className={`px-3 py-2 text-right ${UNIT_INFO.radians.color}`}>Radians</th>
                  </tr>
                </thead>
                <tbody>
                  {allResults.map((res, idx) => (
                    <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="px-4 py-2 font-mono text-slate-300">{res.original}</td>
                      <td className={`px-3 py-2 text-right font-mono ${UNIT_INFO.degrees.color}`}>
                        {formatNumber(res.normalized.degrees)}
                      </td>
                      <td className={`px-3 py-2 text-right font-mono ${UNIT_INFO.gradians.color}`}>
                        {formatNumber(res.normalized.gradians)}
                      </td>
                      <td className={`px-3 py-2 text-right font-mono ${UNIT_INFO.mils.color}`}>
                        {formatNumber(res.normalized.mils)}
                      </td>
                      <td className={`px-3 py-2 text-right font-mono ${UNIT_INFO.radians.color}`}>
                        {formatNumber(res.normalized.radians)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Reference Info */}
        <details className="bg-slate-900/40 rounded-xl border border-slate-700/50">
          <summary className="px-4 py-3 cursor-pointer text-sm text-slate-400 hover:text-slate-300">
            Angle Unit Reference
          </summary>
          <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {(['degrees', 'gradians', 'mils', 'radians'] as AngleUnit[]).map(unit => {
              const info = UNIT_INFO[unit];
              return (
                <div key={unit} className={`p-3 rounded-lg ${info.bg} border ${info.border}`}>
                  <div className={`font-bold ${info.color}`}>{info.name}</div>
                  <div className="text-slate-500 mt-1">
                    {FULL_CIRCLE[unit]} per circle
                  </div>
                  <div className="text-slate-600 text-[10px] mt-1">
                    {unit === 'degrees' && '1/360 of a turn'}
                    {unit === 'gradians' && '1/400 of a turn (gon)'}
                    {unit === 'mils' && '1/6400 of a turn (NATO)'}
                    {unit === 'radians' && '1/2π of a turn'}
                  </div>
                </div>
              );
            })}
          </div>
        </details>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700/30 px-4 py-3 bg-slate-900/50">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
          <div>
            Normalization keeps sign, reduces magnitude to &lt; 1 full circle
          </div>
          <div className="flex gap-4">
            <span>360° = 400g = 6400mil = 2π rad</span>
          </div>
        </div>
      </div>
    </div>
  );
}
