import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Zap, GitBranch, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CallNode {
  id: number;
  m: number;
  n: number;
  result?: number;
  depth: number;
  parent?: number;
  rule: 'base' | 'zero-n' | 'recursive';
}

// Memoized Ackermann with call tracking
function computeAckermann(
  m: number,
  n: number,
  calls: CallNode[],
  maxCalls: number,
  depth = 0,
  parentId?: number
): { result: number; overflow: boolean } {
  if (calls.length >= maxCalls) {
    return { result: -1, overflow: true };
  }

  const id = calls.length;
  let rule: 'base' | 'zero-n' | 'recursive' = 'recursive';
  
  if (m === 0) rule = 'base';
  else if (n === 0) rule = 'zero-n';

  calls.push({ id, m, n, depth, parent: parentId, rule });

  let result: number;
  let overflow = false;

  if (m === 0) {
    result = n + 1;
  } else if (n === 0) {
    const sub = computeAckermann(m - 1, 1, calls, maxCalls, depth + 1, id);
    result = sub.result;
    overflow = sub.overflow;
  } else {
    const inner = computeAckermann(m, n - 1, calls, maxCalls, depth + 1, id);
    if (inner.overflow) {
      return { result: -1, overflow: true };
    }
    const outer = computeAckermann(m - 1, inner.result, calls, maxCalls, depth + 1, id);
    result = outer.result;
    overflow = outer.overflow;
  }

  calls[id].result = result;
  return { result, overflow };
}

// Pre-computed safe values
const SAFE_VALUES: Record<string, number> = {
  '0,0': 1, '0,1': 2, '0,2': 3, '0,3': 4, '0,4': 5, '0,5': 6,
  '1,0': 2, '1,1': 3, '1,2': 4, '1,3': 5, '1,4': 6, '1,5': 7,
  '2,0': 3, '2,1': 5, '2,2': 7, '2,3': 9, '2,4': 11, '2,5': 13,
  '3,0': 5, '3,1': 13, '3,2': 29, '3,3': 61, '3,4': 125, '3,5': 253,
  '4,0': 13, '4,1': 65533,
};

const RULE_COLORS = {
  base: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-400' },
  'zero-n': { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-400' },
  recursive: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400' },
};

export default function AckermannFunctionVisualization() {
  const [m, setM] = useState(2);
  const [n, setN] = useState(3);
  const [calls, setCalls] = useState<CallNode[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(200);
  const [result, setResult] = useState<number | null>(null);
  const [overflow, setOverflow] = useState(false);
  const [maxCalls] = useState(500);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [maxDepth, setMaxDepth] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);

  // --- Audio ---
  const playSound = useCallback((type: 'step' | 'base' | 'complete' | 'reset' | 'warning') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'step') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      const depth = calls[currentStep]?.depth || 0;
      osc.frequency.setValueAtTime(300 + depth * 50, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'base') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'complete') {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.08, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3 + i * 0.1);
        osc.start(now + i * 0.1);
        osc.stop(now + 0.35 + i * 0.1);
      });
    } else if (type === 'warning') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'reset') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  }, [soundEnabled, calls, currentStep]);

  // Compute the call tree
  const compute = useCallback(() => {
    const newCalls: CallNode[] = [];
    const { result: res, overflow: ovf } = computeAckermann(m, n, newCalls, maxCalls);
    setCalls(newCalls);
    setResult(ovf ? null : res);
    setOverflow(ovf);
    setCurrentStep(0);
    setMaxDepth(Math.max(...newCalls.map(c => c.depth), 0));
    if (ovf) playSound('warning');
  }, [m, n, maxCalls, playSound]);

  // Animation
  useEffect(() => {
    if (isPlaying && currentStep < calls.length - 1) {
      intervalRef.current = window.setTimeout(() => {
        const nextCall = calls[currentStep + 1];
        if (nextCall?.rule === 'base') {
          playSound('base');
        } else {
          playSound('step');
        }
        setCurrentStep(prev => prev + 1);
      }, speed);
      return () => {
        if (intervalRef.current) clearTimeout(intervalRef.current);
      };
    } else if (currentStep >= calls.length - 1 && calls.length > 0) {
      setIsPlaying(false);
      if (!overflow) playSound('complete');
    }
  }, [isPlaying, currentStep, calls, speed, overflow, playSound]);

  const reset = useCallback(() => {
    if (intervalRef.current) clearTimeout(intervalRef.current);
    setIsPlaying(false);
    setCalls([]);
    setCurrentStep(0);
    setResult(null);
    setOverflow(false);
    setMaxDepth(0);
    playSound('reset');
  }, [playSound]);

  const togglePlay = () => {
    if (calls.length === 0) {
      compute();
      setIsPlaying(true);
    } else if (currentStep >= calls.length - 1) {
      setCurrentStep(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ') { e.preventDefault(); togglePlay(); }
      if (e.key === 'r' || e.key === 'R') reset();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [togglePlay, reset]);

  const currentCall = calls[currentStep];
  const visibleCalls = calls.slice(0, currentStep + 1);

  // Group calls by depth for visualization
  const depthGroups: Record<number, CallNode[]> = {};
  visibleCalls.forEach(call => {
    if (!depthGroups[call.depth]) depthGroups[call.depth] = [];
    depthGroups[call.depth].push(call);
  });

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-teal-950/10 to-slate-950 rounded-xl border border-teal-900/30 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-teal-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/30">
              <GitBranch className="text-teal-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-teal-300 tracking-wide">RECURSION DEPTH EXPLORER</h2>
              <p className="text-xs text-teal-500/70">Ackermann Function Call Tree</p>
            </div>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border transition-all ${
              soundEnabled 
                ? 'bg-teal-500/20 border-teal-500/50 text-teal-300' 
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        
        {/* Input Controls */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">A(</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-teal-400">m =</span>
                <select
                  value={m}
                  onChange={(e) => { setM(parseInt(e.target.value)); reset(); }}
                  disabled={isPlaying}
                  className="w-16 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-teal-300 font-mono focus:outline-none focus:border-teal-500 disabled:opacity-50"
                >
                  {[0, 1, 2, 3, 4].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <span className="text-slate-500">,</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-cyan-400">n =</span>
                <select
                  value={n}
                  onChange={(e) => { setN(parseInt(e.target.value)); reset(); }}
                  disabled={isPlaying}
                  className="w-16 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-cyan-300 font-mono focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                >
                  {[0, 1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <span className="text-sm text-slate-400">)</span>
            </div>

            {/* Warning for large values */}
            {(m >= 4 && n >= 2) && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <AlertTriangle size={14} className="text-amber-400" />
                <span className="text-xs text-amber-400">Large value - may truncate</span>
              </div>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-slate-500">Speed:</span>
              <input
                type="range"
                min={50}
                max={500}
                step={50}
                value={500 - speed + 50}
                onChange={(e) => setSpeed(500 - parseInt(e.target.value) + 50)}
                className="w-20 accent-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={togglePlay}
            className={`flex-1 min-w-[140px] py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30'
                : 'bg-teal-500/20 text-teal-300 border border-teal-500/50 hover:bg-teal-500/30'
            }`}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            {calls.length === 0 ? 'COMPUTE' : isPlaying ? 'PAUSE' : 'PLAY'}
          </button>
          
          <button
            onClick={() => { compute(); setCurrentStep(calls.length > 0 ? calls.length - 1 : 0); }}
            disabled={isPlaying}
            className="px-4 py-3 rounded-lg bg-emerald-900/30 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-900/50 transition-all disabled:opacity-50 flex items-center gap-2"
            title="Instant Complete"
          >
            <Zap size={18} />
          </button>
          
          <button
            onClick={reset}
            className="px-4 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        {/* Formula Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className={`rounded-lg p-3 border ${RULE_COLORS.base.bg} ${RULE_COLORS.base.border}`}>
            <div className="text-xs text-slate-500 mb-1">Base Case</div>
            <div className={`font-mono text-sm ${RULE_COLORS.base.text}`}>A(0, n) = n + 1</div>
          </div>
          <div className={`rounded-lg p-3 border ${RULE_COLORS['zero-n'].bg} ${RULE_COLORS['zero-n'].border}`}>
            <div className="text-xs text-slate-500 mb-1">Zero n</div>
            <div className={`font-mono text-sm ${RULE_COLORS['zero-n'].text}`}>A(m, 0) = A(m-1, 1)</div>
          </div>
          <div className={`rounded-lg p-3 border ${RULE_COLORS.recursive.bg} ${RULE_COLORS.recursive.border}`}>
            <div className="text-xs text-slate-500 mb-1">Recursive</div>
            <div className={`font-mono text-sm ${RULE_COLORS.recursive.text}`}>A(m, n) = A(m-1, A(m, n-1))</div>
          </div>
        </div>

        {/* Stats Panel */}
        {calls.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-3 text-center">
              <div className="text-xs text-slate-500 mb-1">Total Calls</div>
              <div className="text-2xl font-mono font-bold text-teal-400">
                {visibleCalls.length}
                <span className="text-sm text-slate-600">/{calls.length}</span>
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-3 text-center">
              <div className="text-xs text-slate-500 mb-1">Max Depth</div>
              <div className="text-2xl font-mono font-bold text-amber-400">{maxDepth}</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-3 text-center">
              <div className="text-xs text-slate-500 mb-1">Base Cases</div>
              <div className="text-2xl font-mono font-bold text-emerald-400">
                {visibleCalls.filter(c => c.rule === 'base').length}
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-3 text-center">
              <div className="text-xs text-slate-500 mb-1">Result</div>
              <div className="text-2xl font-mono font-bold text-cyan-400">
                {overflow ? '∞' : result !== null ? result.toLocaleString() : '—'}
              </div>
            </div>
          </div>
        )}

        {/* Current Call Display */}
        {currentCall && (
          <motion.div
            key="current-call"
            initial={false}
            animate={{ 
              backgroundColor: currentCall.rule === 'base' 
                ? 'rgba(16, 185, 129, 0.2)' 
                : currentCall.rule === 'zero-n' 
                  ? 'rgba(245, 158, 11, 0.2)' 
                  : 'rgba(6, 182, 212, 0.2)'
            }}
            transition={{ duration: 0.15 }}
            className={`rounded-xl border p-4 ${RULE_COLORS[currentCall.rule].border}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`text-3xl font-mono font-bold transition-colors duration-150 ${RULE_COLORS[currentCall.rule].text}`}>
                  A({currentCall.m}, {currentCall.n})
                </div>
                {currentCall.result !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">=</span>
                    <span className="text-2xl font-mono font-bold text-white">{currentCall.result}</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">Depth</div>
                <div className="text-lg font-mono text-slate-300">{currentCall.depth}</div>
              </div>
            </div>
            <div className="mt-2 text-sm text-slate-400">
              {currentCall.rule === 'base' && `Base case: ${currentCall.n} + 1 = ${currentCall.result}`}
              {currentCall.rule === 'zero-n' && `Zero n: A(${currentCall.m - 1}, 1)`}
              {currentCall.rule === 'recursive' && `Recursive: A(${currentCall.m - 1}, A(${currentCall.m}, ${currentCall.n - 1}))`}
            </div>
          </motion.div>
        )}

        {/* Call Tree Visualization */}
        {calls.length > 0 && (
          <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4 overflow-x-auto">
            <div className="text-xs text-slate-500 mb-3">Call Tree by Depth</div>
            <div className="space-y-2 min-w-[400px]">
              {Object.entries(depthGroups).slice(0, 15).map(([depth, nodes]) => (
                <div key={depth} className="flex items-center gap-2">
                  <div className="w-8 text-xs text-slate-600 font-mono text-right">{depth}</div>
                  <div className="flex-1 flex flex-wrap gap-1">
                    {nodes.slice(0, 30).map((node) => (
                      <div
                        key={node.id}
                        className={`px-2 py-1 rounded text-xs font-mono border transition-all duration-100 ${RULE_COLORS[node.rule].bg} ${RULE_COLORS[node.rule].border} ${RULE_COLORS[node.rule].text} ${
                          node.id === currentStep ? 'ring-2 ring-white/50 scale-110' : ''
                        }`}
                        title={`A(${node.m}, ${node.n}) = ${node.result ?? '?'}`}
                      >
                        ({node.m},{node.n})
                      </div>
                    ))}
                    {nodes.length > 30 && (
                      <span className="text-xs text-slate-600">+{nodes.length - 30} more</span>
                    )}
                  </div>
                </div>
              ))}
              {Object.keys(depthGroups).length > 15 && (
                <div className="text-xs text-slate-600 text-center">
                  ... {Object.keys(depthGroups).length - 15} more depth levels
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {calls.length > 0 && (
          <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-3">
            <div className="flex justify-between text-xs text-slate-500 mb-2">
              <span>Step {currentStep + 1} of {calls.length}</span>
              <span>{((currentStep + 1) / calls.length * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full transition-all duration-100"
                style={{ width: `${((currentStep + 1) / calls.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Quick Reference Table */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-slate-500 mb-3">Known Values (click to compute)</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="p-2 text-left">m \ n</th>
                  {[0, 1, 2, 3, 4, 5].map(nVal => (
                    <th key={nVal} className="p-2 text-center text-cyan-400">{nVal}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3, 4].map(mVal => (
                  <tr key={mVal} className="border-t border-slate-800">
                    <td className="p-2 text-teal-400 font-mono">{mVal}</td>
                    {[0, 1, 2, 3, 4, 5].map(nVal => {
                      const key = `${mVal},${nVal}`;
                      const val = SAFE_VALUES[key];
                      const isSelected = m === mVal && n === nVal;
                      const isSafe = mVal < 4 || (mVal === 4 && nVal <= 1);
                      return (
                        <td key={nVal} className="p-2 text-center">
                          <button
                            onClick={() => { setM(mVal); setN(nVal); reset(); }}
                            disabled={!isSafe}
                            className={`px-2 py-1 rounded font-mono transition-all ${
                              isSelected
                                ? 'bg-teal-500/30 text-teal-300 border border-teal-500'
                                : isSafe
                                  ? 'hover:bg-slate-800 text-slate-300'
                                  : 'text-slate-600 cursor-not-allowed'
                            }`}
                          >
                            {val !== undefined ? (val > 9999 ? '65533' : val) : '—'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Overflow Warning */}
        <AnimatePresence>
          {overflow && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-amber-900/20 rounded-xl border border-amber-500/30 p-4 flex items-center gap-3"
            >
              <AlertTriangle className="text-amber-400" size={24} />
              <div>
                <div className="text-amber-300 font-bold">Computation Truncated</div>
                <div className="text-xs text-amber-400/70">
                  Exceeded {maxCalls} calls. The Ackermann function grows extremely fast!
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Space</kbd> Play/Pause
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-teal-400 hover:text-teal-300 transition-colors">
          Why is the Ackermann function special?
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            The <span className="text-teal-300">Ackermann function</span> is famous for being one of the 
            simplest examples of a <span className="text-amber-300">total computable function</span> that 
            is not <span className="text-cyan-300">primitive recursive</span>.
          </p>
          <p>
            It grows <span className="text-rose-400">incredibly fast</span>:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>A(1, n) ≈ n + 2</li>
            <li>A(2, n) ≈ 2n + 3</li>
            <li>A(3, n) ≈ 2^(n+3) - 3</li>
            <li>A(4, n) is a tower of 2s with height n+3</li>
            <li>A(4, 2) = 2^65536 - 3 (a number with ~19,729 digits!)</li>
          </ul>
          <p className="mt-2">
            Named after <span className="text-teal-300">Wilhelm Ackermann</span> (1928), it's used in 
            computer science to test recursion limits and compiler optimization.
          </p>
        </div>
      </details>
    </div>
  );
}
