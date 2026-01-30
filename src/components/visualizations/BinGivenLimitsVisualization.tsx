import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { BarChart3, RotateCcw, Volume2, VolumeX, Play, Hash, PieChart, TrendingUp, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Bin {
  label: string;
  count: number;
  color: string;
  range: [number, number];
}

interface DataPoint {
  value: number;
  binIndex: number;
  id: string;
}

interface Particle {
  id: string;
  value: number;
  x: number;
  y: number;
  targetBin: number;
  color: string;
}

export default function BinGivenLimitsVisualization() {
  const [limitsInput, setLimitsInput] = useState('23, 37, 43, 53, 67, 83');
  const [dataInput, setDataInput] = useState('95,21,94,12,99,4,70,75,83,93,52,80,57,5,53,86,65,17,92,83,71,61,54,58,47,16,8,9,32,84,7,87,46,19,30,37,96,6,98,40,79,97,45,64,60,29,49,36,43,55');
  const [bins, setBins] = useState<Bin[]>([]);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showPieChart, setShowPieChart] = useState(false);
  const [activeBin, setActiveBin] = useState<number | null>(null);
  const [processingIndex, setProcessingIndex] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const playSound = useCallback((type: 'drop' | 'complete' | 'hover', freq = 440) => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'drop') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'complete') {
      [523, 659, 784, 1047].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.08);
        gain.gain.setValueAtTime(0.05, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4 + i * 0.08);
        osc.start(now + i * 0.08);
        osc.stop(now + 0.5 + i * 0.08);
      });
    } else if (type === 'hover') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.start(now);
      osc.stop(now + 0.03);
    }
  }, [soundEnabled]);

  const stats = useMemo(() => {
    if (dataPoints.length === 0) return null;
    const values = dataPoints.map(d => d.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0 
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 
      : sorted[Math.floor(sorted.length / 2)];
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Calculate mode
    const frequency: Record<number, number> = {};
    values.forEach(v => frequency[v] = (frequency[v] || 0) + 1);
    const maxFreq = Math.max(...Object.values(frequency));
    const mode = Object.entries(frequency).filter(([_, f]) => f === maxFreq).map(([v]) => parseInt(v));
    
    return { mean: mean.toFixed(1), median, min, max, mode, count: values.length };
  }, [dataPoints]);

  const processBins = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setBins([]);
    setDataPoints([]);
    setParticles([]);
    setProcessingIndex(0);

    const limits = limitsInput.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x)).sort((a, b) => a - b);
    const data = dataInput.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));

    const colors = [
      'from-amber-500 to-orange-500',
      'from-emerald-500 to-teal-500', 
      'from-blue-500 to-cyan-500',
      'from-violet-500 to-purple-500',
      'from-pink-500 to-rose-500',
      'from-orange-500 to-red-500',
      'from-teal-500 to-green-500'
    ];

    const newBins: Bin[] = [];
    for (let i = 0; i <= limits.length; i++) {
      let label: string;
      let range: [number, number];
      if (i === 0) {
        label = `< ${limits[0]}`;
        range = [-Infinity, limits[0]];
      } else if (i === limits.length) {
        label = `>= ${limits[limits.length - 1]}`;
        range = [limits[limits.length - 1], Infinity];
      } else {
        label = `${limits[i - 1]} - ${limits[i] - 1}`;
        range = [limits[i - 1], limits[i]];
      }
      newBins.push({
        label,
        count: 0,
        color: colors[i % colors.length],
        range
      });
    }
    setBins(newBins);

    // Process each data point with animation
    const newDataPoints: DataPoint[] = [];
    
    for (let idx = 0; idx < data.length; idx++) {
      const num = data[idx];
      setProcessingIndex(idx);
      
      let binIndex = 0;
      for (let i = 0; i < limits.length; i++) {
        if (num >= limits[i]) {
          binIndex = i + 1;
        }
      }
      
      const point: DataPoint = {
        value: num,
        binIndex,
        id: `point-${idx}-${Date.now()}`
      };
      newDataPoints.push(point);
      setDataPoints([...newDataPoints]);
      
      // Update bin count
      newBins[binIndex].count++;
      setBins([...newBins]);
      setActiveBin(binIndex);
      
      // Play sound with varying pitch
      const baseFreq = 300 + (binIndex * 100);
      playSound('drop', baseFreq);
      
      await new Promise(resolve => setTimeout(resolve, 80));
      setActiveBin(null);
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
    playSound('complete');
    setIsProcessing(false);
    setProcessingIndex(-1);
  };

  const maxCount = Math.max(...bins.map(b => b.count), 1);
  const totalItems = dataPoints.length;

  return (
    <div ref={containerRef} className="w-full bg-gradient-to-br from-slate-950 via-amber-950/20 to-slate-950 rounded-xl border border-amber-800/40 font-sans overflow-hidden shadow-2xl shadow-amber-900/20">
      {/* Header */}
      <div className="bg-slate-900/90 border-b border-amber-700/40 px-6 py-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 border border-amber-400/50 shadow-lg shadow-amber-500/20">
              <BarChart3 className="text-amber-300" size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-amber-200 tracking-wide">DATA BINNING ANALYZER</h2>
              <p className="text-sm text-amber-400/70 flex items-center gap-2">
                <Activity size={14} />
                Interactive Distribution Analysis
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPieChart(!showPieChart)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all flex items-center gap-2 ${
                showPieChart 
                  ? 'bg-amber-500/30 text-amber-200 border-amber-400/60' 
                  : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-amber-500/40'
              }`}
            >
              <PieChart size={16} />
              {showPieChart ? 'Show Bars' : 'Show Pie'}
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-3 rounded-lg border transition-all ${
                soundEnabled ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Input Section */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-900/60 rounded-2xl border border-slate-700/60 p-5 shadow-xl">
            <label className="block text-sm text-amber-400/80 mb-3 flex items-center gap-2 font-medium">
              <Hash size={16} />
              Bin Limits (comma-separated)
            </label>
            <input
              type="text"
              value={limitsInput}
              onChange={(e) => setLimitsInput(e.target.value)}
              disabled={isProcessing}
              className="w-full px-4 py-3 bg-slate-800/80 border border-slate-600/50 rounded-xl text-slate-200 font-mono text-sm focus:outline-none focus:border-amber-500/70 transition-all disabled:opacity-50"
              placeholder="23, 37, 43, 53..."
            />
            <div className="mt-3 text-xs text-slate-500">
              Define boundaries for each bin
            </div>
          </div>
          
          <div className="bg-slate-900/60 rounded-2xl border border-slate-700/60 p-5 shadow-xl">
            <label className="block text-sm text-amber-400/80 mb-3 flex items-center gap-2 font-medium">
              <TrendingUp size={16} />
              Data Points (comma-separated)
            </label>
            <textarea
              value={dataInput}
              onChange={(e) => setDataInput(e.target.value)}
              disabled={isProcessing}
              rows={3}
              className="w-full px-4 py-3 bg-slate-800/80 border border-slate-600/50 rounded-xl text-slate-200 font-mono text-sm focus:outline-none focus:border-amber-500/70 transition-all resize-none disabled:opacity-50"
              placeholder="95, 21, 94, 12, 99..."
            />
            <div className="mt-3 text-xs text-slate-500">
              {isProcessing ? `Processing ${processingIndex + 1} of ${dataInput.split(',').filter(x => !isNaN(parseInt(x.trim()))).length} items...` : `${dataInput.split(',').filter(x => !isNaN(parseInt(x.trim()))).length} data points ready`}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-4">
          <motion.button
            onClick={processBins}
            disabled={isProcessing}
            whileHover={{ scale: isProcessing ? 1 : 1.02 }}
            whileTap={{ scale: isProcessing ? 1 : 0.98 }}
            className="flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all bg-gradient-to-r from-amber-500/30 via-orange-500/30 to-amber-500/30 text-amber-200 border border-amber-400/60 hover:border-amber-400/80 disabled:opacity-50 shadow-lg shadow-amber-500/10"
          >
            {isProcessing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Activity size={20} />
                </motion.div>
                PROCESSING {processingIndex + 1} ITEMS...
              </>
            ) : (
              <>
                <Play size={20} />
                ANALYZE DISTRIBUTION
              </>
            )}
          </motion.button>
          <button
            onClick={() => { setBins([]); setDataPoints([]); setParticles([]); setActiveBin(null); }}
            disabled={isProcessing}
            className="px-6 py-4 rounded-xl bg-slate-800/80 text-slate-400 border border-slate-700 hover:bg-slate-700/80 hover:text-slate-300 transition-all disabled:opacity-50"
          >
            <RotateCcw size={20} />
          </button>
        </div>

        {/* Stats Panel */}
        <AnimatePresence>
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-2 md:grid-cols-5 gap-3"
            >
              {[
                { label: 'Count', value: stats.count, color: 'amber' },
                { label: 'Mean', value: stats.mean, color: 'orange' },
                { label: 'Median', value: stats.median, color: 'yellow' },
                { label: 'Min / Max', value: `${stats.min} / ${stats.max}`, color: 'red' },
                { label: 'Mode', value: stats.mode.slice(0, 2).join(', ') + (stats.mode.length > 2 ? '...' : ''), color: 'pink' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className={`bg-slate-900/60 rounded-xl border border-${stat.color}-500/30 p-4 text-center`}
                >
                  <div className={`text-2xl font-bold text-${stat.color}-400 font-mono`}>{stat.value}</div>
                  <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Visualization */}
        <AnimatePresence>
          {bins.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900/60 rounded-2xl border border-amber-800/40 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-amber-300">Distribution Analysis</h3>
                  <p className="text-sm text-slate-500">Total items: <span className="text-amber-400 font-mono">{totalItems}</span></p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
                  Hover bars for details
                </div>
              </div>

              {/* Bar Chart or Pie Chart */}
              <div className="relative">
                {showPieChart ? (
                  // Pie Chart View
                  <div className="flex items-center justify-center py-8">
                    <div className="relative w-64 h-64">
                      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        {bins.map((bin, i) => {
                          const percentage = totalItems > 0 ? (bin.count / totalItems) * 100 : 0;
                          const startAngle = bins.slice(0, i).reduce((acc, b) => acc + (b.count / totalItems) * 360, 0);
                          const endAngle = startAngle + (percentage / 100) * 360;
                          
                          if (percentage === 0) return null;
                          
                          const startRad = (startAngle * Math.PI) / 180;
                          const endRad = (endAngle * Math.PI) / 180;
                          
                          const x1 = 50 + 40 * Math.cos(startRad);
                          const y1 = 50 + 40 * Math.sin(startRad);
                          const x2 = 50 + 40 * Math.cos(endRad);
                          const y2 = 50 + 40 * Math.sin(endRad);
                          
                          const largeArc = endAngle - startAngle > 180 ? 1 : 0;
                          
                          return (
                            <motion.path
                              key={i}
                              d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                              fill={`url(#gradient-${i})`}
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.1 }}
                              onMouseEnter={() => { setActiveBin(i); playSound('hover'); }}
                              onMouseLeave={() => setActiveBin(null)}
                              className="cursor-pointer"
                            />
                          );
                        })}
                        <defs>
                          {bins.map((bin, i) => (
                            <linearGradient key={i} id={`gradient-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor={bin.color.split(' ')[1].replace('from-', '').replace('-500', '') === 'amber' ? '#f59e0b' : 
                                bin.color.split(' ')[1].replace('from-', '').replace('-500', '') === 'emerald' ? '#10b981' :
                                bin.color.split(' ')[1].replace('from-', '').replace('-500', '') === 'blue' ? '#3b82f6' :
                                bin.color.split(' ')[1].replace('from-', '').replace('-500', '') === 'violet' ? '#8b5cf6' :
                                bin.color.split(' ')[1].replace('from-', '').replace('-500', '') === 'pink' ? '#ec4899' :
                                bin.color.split(' ')[1].replace('from-', '').replace('-500', '') === 'orange' ? '#f97316' : '#14b8a6'} />
                              <stop offset="100%" stopColor={bin.color.split(' ')[3].replace('to-', '').replace('-500', '') === 'orange' ? '#f97316' :
                                bin.color.split(' ')[3].replace('to-', '').replace('-500', '') === 'teal' ? '#14b8a6' :
                                bin.color.split(' ')[3].replace('to-', '').replace('-500', '') === 'cyan' ? '#06b6d4' :
                                bin.color.split(' ')[3].replace('to-', '').replace('-500', '') === 'purple' ? '#a855f7' :
                                bin.color.split(' ')[3].replace('to-', '').replace('-500', '') === 'rose' ? '#f43f5e' :
                                bin.color.split(' ')[3].replace('to-', '').replace('-500', '') === 'red' ? '#ef4444' : '#22c55e'} />
                            </linearGradient>
                          ))}
                        </defs>
                      </svg>
                      {/* Center text */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-amber-300">{totalItems}</div>
                          <div className="text-xs text-slate-500">Total</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Bar Chart View
                  <div className="space-y-4">
                    {bins.map((bin, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="relative"
                        onMouseEnter={() => { setActiveBin(i); playSound('hover'); }}
                        onMouseLeave={() => setActiveBin(null)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-28 text-xs text-slate-400 font-mono truncate">{bin.label}</div>
                          <div className="flex-1 h-12 bg-slate-800/50 rounded-xl overflow-hidden relative">
                            {/* Background grid */}
                            <div className="absolute inset-0 flex">
                              {[...Array(10)].map((_, j) => (
                                <div key={j} className="flex-1 border-r border-slate-700/30" />
                              ))}
                            </div>
                            
                            {/* Bar */}
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(bin.count / maxCount) * 100}%` }}
                              transition={{ duration: 0.8, delay: i * 0.1, type: 'spring', stiffness: 100 }}
                              className={`h-full bg-gradient-to-r ${bin.color} rounded-xl relative overflow-hidden ${activeBin === i ? 'ring-2 ring-white/50' : ''}`}
                            >
                              {/* Shine effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shine" />
                              
                              {/* Glow effect */}
                              {activeBin === i && (
                                <motion.div
                                  layoutId="glow"
                                  className="absolute inset-0 bg-white/20 blur-xl"
                                />
                              )}
                            </motion.div>
                            
                            {/* Count label */}
                            <div className="absolute inset-0 flex items-center justify-end pr-3">
                              <motion.span 
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 + i * 0.1 }}
                                className="text-sm font-bold text-white drop-shadow-lg"
                              >
                                {bin.count}
                              </motion.span>
                            </div>
                          </div>
                          <div className="w-16 text-right">
                            <span className="text-xs text-slate-500">
                              {totalItems > 0 ? ((bin.count / totalItems) * 100).toFixed(1) : 0}%
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Data Points Preview */}
              {dataPoints.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-700/50">
                  <h4 className="text-sm font-medium text-slate-400 mb-3">Data Points</h4>
                  <div className="flex flex-wrap gap-2">
                    {dataPoints.slice(0, 30).map((point, i) => (
                      <motion.div
                        key={point.id}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-mono font-bold cursor-pointer transition-all ${
                          activeBin === point.binIndex 
                            ? 'ring-2 ring-white scale-110 z-10' 
                            : 'hover:scale-105'
                        }`}
                        style={{
                          background: `linear-gradient(135deg, ${bins[point.binIndex]?.color.split(' ')[1].replace('from-', '').replace('-500', '') === 'amber' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(100, 100, 100, 0.3)'} 0%, rgba(30, 30, 30, 0.8) 100%)`,
                          borderColor: activeBin === point.binIndex ? 'white' : 'rgba(245, 158, 11, 0.3)',
                          borderWidth: '1px'
                        }}
                        onMouseEnter={() => setActiveBin(point.binIndex)}
                        onMouseLeave={() => setActiveBin(null)}
                      >
                        {point.value}
                      </motion.div>
                    ))}
                    {dataPoints.length > 30 && (
                      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-xs text-slate-500">
                        +{dataPoints.length - 30}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Panel */}
        <div className="bg-slate-900/40 rounded-xl border border-slate-800/60 p-5">
          <h4 className="text-sm font-semibold text-amber-400 mb-2">How Data Binning Works</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Data binning groups data points into ranges (bins) based on specified limits. 
            Each bin counts how many values fall within its range. The first bin contains values less than the first limit, 
            and the last bin contains values greater than or equal to the last limit. This visualization uses an efficient 
            algorithm that processes each data point in O(n) time without sorting.
          </p>
        </div>
      </div>
    </div>
  );
}
