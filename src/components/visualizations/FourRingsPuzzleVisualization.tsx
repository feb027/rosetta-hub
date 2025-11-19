import { useState, useEffect, useMemo } from 'react';
import { Play, Pause, RotateCcw, Sparkles, Settings, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Solution {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
  g: number;
  sum: number;
}

export default function FourRingsPuzzleVisualization() {
  const [minRange, setMinRange] = useState(1);
  const [maxRange, setMaxRange] = useState(7);
  const [uniqueOnly, setUniqueOnly] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speed, setSpeed] = useState(1000);
  const [showSettings, setShowSettings] = useState(false);

  // Find all solutions
  const solutions = useMemo(() => {
    const found: Solution[] = [];
    
    for (let a = minRange; a <= maxRange; a++) {
      for (let b = minRange; b <= maxRange; b++) {
        if (uniqueOnly && a === b) continue;
        
        const sum = a + b;
        
        for (let c = minRange; c <= maxRange; c++) {
          if (uniqueOnly && (c === a || c === b)) continue;
          
          for (let d = minRange; d <= maxRange; d++) {
            if (uniqueOnly && (d === a || d === b || d === c)) continue;
            if (b + c + d !== sum) continue;
            
            for (let e = minRange; e <= maxRange; e++) {
              if (uniqueOnly && (e === a || e === b || e === c || e === d)) continue;
              
              for (let f = minRange; f <= maxRange; f++) {
                if (uniqueOnly && (f === a || f === b || f === c || f === d || f === e)) continue;
                if (d + e + f !== sum) continue;
                
                for (let g = minRange; g <= maxRange; g++) {
                  if (uniqueOnly && (g === a || g === b || g === c || g === d || g === e || g === f)) continue;
                  if (f + g !== sum) continue;
                  
                  found.push({ a, b, c, d, e, f, g, sum });
                }
              }
            }
          }
        }
      }
    }
    
    return found;
  }, [minRange, maxRange, uniqueOnly]);

  const currentSolution = solutions[currentIndex] || null;

  // Auto-play animation
  useEffect(() => {
    if (!isPlaying || solutions.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % solutions.length);
    }, speed);
    
    return () => clearInterval(interval);
  }, [isPlaying, solutions.length, speed]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
      if (e.key === 'r') reset();
      if (e.key === 'ArrowLeft' && !isPlaying) {
        setCurrentIndex((prev) => (prev - 1 + solutions.length) % solutions.length);
      }
      if (e.key === 'ArrowRight' && !isPlaying) {
        setCurrentIndex((prev) => (prev + 1) % solutions.length);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isPlaying, solutions.length]);

  const reset = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
  };

  const presets = [
    { name: '1-7 (Classic)', min: 1, max: 7, unique: true },
    { name: '3-9', min: 3, max: 9, unique: true },
    { name: '0-9 (All)', min: 0, max: 9, unique: false },
  ];

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Compact Controls */}
      <div className="glass rounded-xl p-3 border border-slate-600/50">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          {/* Left: Play Controls */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={solutions.length === 0}
              className="px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 disabled:bg-slate-700/30 disabled:cursor-not-allowed border border-cyan-500/30 hover:border-cyan-500/50 disabled:border-slate-600/30 rounded-lg transition-all flex items-center gap-2 text-cyan-400 disabled:text-slate-500 hover:shadow-lg hover:shadow-cyan-500/20"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              <span className="text-sm font-medium">{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
            <button
              onClick={reset}
              className="px-3 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 hover:border-slate-500 rounded-lg transition-all flex items-center gap-2 text-slate-300 hover:text-slate-100 hover:shadow-lg"
              aria-label="Reset"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          {/* Center: Navigation */}
          {solutions.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentIndex((prev) => (prev - 1 + solutions.length) % solutions.length);
                }}
                className="p-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 hover:border-cyan-500/50 rounded-lg transition-all text-slate-300 hover:text-cyan-400"
                aria-label="Previous solution"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="px-3 py-1.5 bg-slate-800/70 rounded-lg border border-slate-600/50 text-sm font-mono min-w-[80px] text-center">
                <span className="text-cyan-400 font-bold">{currentIndex + 1}</span>
                <span className="text-slate-500 mx-1">/</span>
                <span className="text-slate-400">{solutions.length}</span>
              </div>
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentIndex((prev) => (prev + 1) % solutions.length);
                }}
                className="p-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 hover:border-cyan-500/50 rounded-lg transition-all text-slate-300 hover:text-cyan-400"
                aria-label="Next solution"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* Right: Presets & Settings */}
          <div className="flex gap-2 items-center">
            {presets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => {
                  setMinRange(preset.min);
                  setMaxRange(preset.max);
                  setUniqueOnly(preset.unique);
                  reset();
                }}
                className="px-2.5 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 rounded-lg text-xs border border-slate-600/50 hover:border-cyan-500/50 transition-all hover:shadow-lg hidden sm:flex items-center gap-1.5"
              >
                <Zap size={12} />
                {preset.name}
              </button>
            ))}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-all border ${
                showSettings 
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' 
                  : 'bg-slate-700/50 hover:bg-slate-700 border-slate-600/50 hover:border-slate-500 text-slate-300 hover:text-slate-100'
              }`}
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-slate-600/50 space-y-4"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Min Range: {minRange}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="9"
                    value={minRange}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setMinRange(val);
                      if (val > maxRange) setMaxRange(val);
                      reset();
                    }}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Max Range: {maxRange}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="9"
                    value={maxRange}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setMaxRange(val);
                      if (val < minRange) setMinRange(val);
                      reset();
                    }}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="unique"
                  checked={uniqueOnly}
                  onChange={(e) => {
                    setUniqueOnly(e.target.checked);
                    reset();
                  }}
                  className="w-4 h-4"
                />
                <label htmlFor="unique" className="text-sm text-slate-300">
                  Unique digits only
                </label>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Animation Speed: {speed}ms
                </label>
                <input
                  type="range"
                  min="200"
                  max="2000"
                  step="100"
                  value={speed}
                  onChange={(e) => setSpeed(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Visualization - More Compact */}
      <div className="glass rounded-xl p-4 md:p-6 border border-cyan-500/20">
        <AnimatePresence mode="wait">
          {currentSolution ? (
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Visual Representation - 2x2 Grid with Overlapping Squares */}
              <div className="flex justify-center items-center">
                <svg viewBox="0 0 700 420" className="w-full max-w-3xl h-auto" style={{ maxHeight: '350px' }}>
                  <defs>
                    {/* Gradient definitions */}
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.2 }} />
                      <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 0.05 }} />
                    </linearGradient>
                    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.2 }} />
                      <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0.05 }} />
                    </linearGradient>
                    <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.2 }} />
                      <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.05 }} />
                    </linearGradient>
                    <linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0.2 }} />
                      <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 0.05 }} />
                    </linearGradient>
                  </defs>

                  {/* Square 1: a + b (Top Left) */}
                  <motion.rect
                    x="80"
                    y="50"
                    width="200"
                    height="180"
                    fill="url(#grad1)"
                    stroke="#06b6d4"
                    strokeWidth="3"
                    rx="12"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                  
                  {/* Square 2: b + c + d (Bottom Left, overlaps with Square 1) */}
                  <motion.rect
                    x="80"
                    y="150"
                    width="280"
                    height="180"
                    fill="url(#grad2)"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    rx="12"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  />
                  
                  {/* Square 3: d + e + f (Top Right, overlaps with Square 2) */}
                  <motion.rect
                    x="280"
                    y="50"
                    width="280"
                    height="180"
                    fill="url(#grad3)"
                    stroke="#8b5cf6"
                    strokeWidth="3"
                    rx="12"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                  
                  {/* Square 4: f + g (Bottom Right, overlaps with Square 3) */}
                  <motion.rect
                    x="420"
                    y="150"
                    width="200"
                    height="180"
                    fill="url(#grad4)"
                    stroke="#10b981"
                    strokeWidth="3"
                    rx="12"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  />

                  {/* Values with correct positioning */}
                  {[
                    { val: currentSolution.a, x: 180, y: 110, label: 'a', color: '#06b6d4' },
                    { val: currentSolution.b, x: 180, y: 200, label: 'b', color: '#3b82f6' },
                    { val: currentSolution.c, x: 220, y: 270, label: 'c', color: '#3b82f6' },
                    { val: currentSolution.d, x: 320, y: 200, label: 'd', color: '#8b5cf6' },
                    { val: currentSolution.e, x: 380, y: 110, label: 'e', color: '#8b5cf6' },
                    { val: currentSolution.f, x: 480, y: 200, label: 'f', color: '#10b981' },
                    { val: currentSolution.g, x: 520, y: 270, label: 'g', color: '#10b981' },
                  ].map((item, idx) => (
                    <motion.g
                      key={item.label}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.5 + idx * 0.08, type: 'spring', stiffness: 200 }}
                    >
                      {/* Glow effect */}
                      <circle
                        cx={item.x}
                        cy={item.y}
                        r="38"
                        fill={item.color}
                        opacity="0.15"
                        filter="blur(8px)"
                      />
                      {/* Main circle background */}
                      <circle
                        cx={item.x}
                        cy={item.y}
                        r="32"
                        fill="rgba(15, 23, 42, 0.95)"
                        stroke={item.color}
                        strokeWidth="3"
                      />
                      {/* Value */}
                      <text
                        x={item.x}
                        y={item.y + 10}
                        textAnchor="middle"
                        fill="white"
                        fontSize="32"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {item.val}
                      </text>
                      {/* Label */}
                      <text
                        x={item.x}
                        y={item.y - 48}
                        textAnchor="middle"
                        fill={item.color}
                        fontSize="16"
                        fontWeight="700"
                        opacity="0.9"
                      >
                        {item.label}
                      </text>
                    </motion.g>
                  ))}

                  {/* Sum labels below each square */}
                  {[
                    { sum: currentSolution.sum, x: 180, y: 380, label: 'a+b', color: '#06b6d4', square: '□₁' },
                    { sum: currentSolution.sum, x: 220, y: 380, label: 'b+c+d', color: '#3b82f6', square: '□₂' },
                    { sum: currentSolution.sum, x: 420, y: 380, label: 'd+e+f', color: '#8b5cf6', square: '□₃' },
                    { sum: currentSolution.sum, x: 520, y: 380, label: 'f+g', color: '#10b981', square: '□₄' },
                  ].map((item, idx) => (
                    <motion.g
                      key={idx}
                      initial={{ y: 400, opacity: 0 }}
                      animate={{ y: 380, opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.9 + idx * 0.08 }}
                    >
                      {/* Background */}
                      <rect
                        x={item.x - 45}
                        y={item.y - 22}
                        width="90"
                        height="44"
                        fill="rgba(15, 23, 42, 0.9)"
                        stroke={item.color}
                        strokeWidth="2"
                        rx="8"
                      />
                      {/* Formula */}
                      <text
                        x={item.x}
                        y={item.y - 5}
                        textAnchor="middle"
                        fill={item.color}
                        fontSize="11"
                        fontWeight="600"
                        opacity="0.8"
                      >
                        {item.label}
                      </text>
                      {/* Sum value */}
                      <text
                        x={item.x}
                        y={item.y + 12}
                        textAnchor="middle"
                        fill="white"
                        fontSize="20"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {item.sum}
                      </text>
                    </motion.g>
                  ))}

                  {/* Decorative connecting lines */}
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.2 }}
                    transition={{ duration: 0.5, delay: 1.2 }}
                    strokeDasharray="4,4"
                  >
                    <line x1="180" y1="142" x2="180" y2="168" stroke="#06b6d4" strokeWidth="2" />
                    <line x1="320" y1="142" x2="320" y2="168" stroke="#8b5cf6" strokeWidth="2" />
                    <line x1="480" y1="142" x2="480" y2="168" stroke="#10b981" strokeWidth="2" />
                  </motion.g>
                </svg>
              </div>

              {/* Compact Solution Info */}
              <div className="flex flex-wrap gap-3 items-center justify-center text-center">
                <div className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                  <div className="text-xs text-cyan-400/70 mb-0.5">Solution</div>
                  <div className="text-xl font-bold text-cyan-400">#{currentIndex + 1}</div>
                </div>
                <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <div className="text-xs text-purple-400/70 mb-0.5">Sum</div>
                  <div className="text-xl font-bold text-purple-400">{currentSolution.sum}</div>
                </div>
                <div className="px-4 py-2 bg-slate-700/30 border border-slate-600/50 rounded-lg">
                  <div className="text-xs text-slate-400 mb-0.5">Values</div>
                  <div className="text-sm font-mono text-slate-300">
                    {currentSolution.a}, {currentSolution.b}, {currentSolution.c}, {currentSolution.d}, {currentSolution.e}, {currentSolution.f}, {currentSolution.g}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Sparkles className="mx-auto mb-4 text-slate-500" size={48} />
              <p className="text-xl text-slate-400">
                No solutions found for the current range
              </p>
              <p className="text-sm text-slate-500 mt-2">
                Try adjusting the range or disabling unique digits
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Compact Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass rounded-lg p-3 border border-cyan-500/30 hover:border-cyan-500/50 transition-all hover:shadow-lg hover:shadow-cyan-500/10 cursor-default">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-cyan-500/20 rounded-md">
              <Sparkles className="text-cyan-400" size={16} />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wide">Solutions</div>
              <div className="text-xl font-bold text-cyan-400">{solutions.length}</div>
            </div>
          </div>
        </div>
        
        <div className="glass rounded-lg p-3 border border-blue-500/30 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10 cursor-default">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/20 rounded-md">
              <Settings className="text-blue-400" size={16} />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wide">Range</div>
              <div className="text-xl font-bold text-blue-400 font-mono">
                {minRange}–{maxRange}
              </div>
            </div>
          </div>
        </div>
        
        <div className="glass rounded-lg p-3 border border-purple-500/30 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10 cursor-default">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-500/20 rounded-md">
              <Zap className="text-purple-400" size={16} />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wide">Mode</div>
              <div className="text-xl font-bold text-purple-400">
                {uniqueOnly ? 'Unique' : 'All'}
              </div>
            </div>
          </div>
        </div>

        <div className="glass rounded-lg p-3 border border-green-500/30 hover:border-green-500/50 transition-all hover:shadow-lg hover:shadow-green-500/10 cursor-default">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-500/20 rounded-md">
              <Play className="text-green-400" size={16} />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wide">Speed</div>
              <div className="text-xl font-bold text-green-400">
                {(1000 / speed).toFixed(1)}x
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Algorithm Details */}
      <details className="glass rounded-xl border border-slate-600/50">
        <summary className="p-4 cursor-pointer text-lg font-semibold hover:text-cyan-400 transition-colors">
          Algorithm Details
        </summary>
        <div className="p-4 pt-0 space-y-4 text-slate-300">
          <div>
            <h3 className="text-cyan-400 font-semibold mb-2">Problem</h3>
            <p>
              Find combinations of digits where the sum of values in each of four overlapping squares is equal:
            </p>
            <code className="block mt-2 p-3 bg-slate-900/50 rounded text-sm">
              a + b = b + c + d = d + e + f = f + g
            </code>
          </div>

          <div>
            <h3 className="text-cyan-400 font-semibold mb-2">Approach</h3>
            <p>Brute force search with early termination:</p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Iterate through all possible combinations of digits</li>
              <li>Check uniqueness constraint if enabled</li>
              <li>Verify sum equality across all four squares</li>
              <li>Store valid solutions</li>
            </ol>
          </div>

          <div>
            <h3 className="text-cyan-400 font-semibold mb-2">Complexity</h3>
            <ul className="space-y-1">
              <li><strong>Time:</strong> O(n⁷) where n is the range size</li>
              <li><strong>Space:</strong> O(s) where s is the number of solutions</li>
            </ul>
          </div>

          <div>
            <h3 className="text-cyan-400 font-semibold mb-2">Keyboard Shortcuts</h3>
            <ul className="space-y-1">
              <li><kbd className="px-2 py-1 bg-slate-700 rounded text-xs">Space</kbd> - Play/Pause</li>
              <li><kbd className="px-2 py-1 bg-slate-700 rounded text-xs">R</kbd> - Reset</li>
              <li><kbd className="px-2 py-1 bg-slate-700 rounded text-xs">←</kbd> / <kbd className="px-2 py-1 bg-slate-700 rounded text-xs">→</kbd> - Navigate solutions</li>
            </ul>
          </div>
        </div>
      </details>
    </div>
  );
}
