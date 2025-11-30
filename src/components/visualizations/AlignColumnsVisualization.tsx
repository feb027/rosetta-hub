import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, AlignLeft, AlignCenter, AlignRight, Type, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Alignment = 'left' | 'center' | 'right';

interface TypeBlock {
  text: string;
  col: number;
  row: number;
  width: number;
  targetX: number;
  isMoving: boolean;
}

const DEFAULT_INPUT = `Given$a$text$file$of$many$lines,$where$fields$within$a$line$
are$delineated$by$a$single$'dollar'$character,$write$a$program
that$aligns$each$column$of$fields$by$ensuring$that$words$in$each$
column$are$separated$by$at$least$one$space.
Further,$allow$for$each$word$in$a$column$to$be$either$left$
justified,$right$justified,$or$center$justified$within$its$column.`;

const PRESETS = {
  rosetta: {
    name: 'Rosetta Code',
    text: DEFAULT_INPUT
  },
  simple: {
    name: 'Simple',
    text: `Name$Age$City
Alice$25$New York
Bob$30$Los Angeles
Charlie$35$Chicago`
  },
  code: {
    name: 'Code Table',
    text: `Function$Return$Description
parseInt$number$Parse integer
toString$string$Convert to string
isNaN$boolean$Check if NaN`
  },
  menu: {
    name: 'Menu',
    text: `Item$Price$Calories
Burger$9.99$650
Salad$7.50$250
Pizza$12.99$800
Soup$5.99$180`
  }
};

export default function AlignColumnsVisualization() {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [alignment, setAlignment] = useState<Alignment>('left');
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [typeBlocks, setTypeBlocks] = useState<TypeBlock[][]>([]);
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const [showOutput, setShowOutput] = useState(false);
  const [speed, setSpeed] = useState(150);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number>(0);


  // Parse input into rows and columns
  const parseInput = useCallback((text: string) => {
    const lines = text.trim().split('\n').filter(l => l.trim());
    const rows = lines.map(line => 
      line.split('$').map(field => field.trim()).filter(f => f.length > 0)
    );
    
    // Calculate max columns
    const maxCols = Math.max(...rows.map(r => r.length));
    
    // Calculate column widths
    const widths: number[] = [];
    for (let col = 0; col < maxCols; col++) {
      let maxWidth = 0;
      for (const row of rows) {
        if (row[col]) {
          maxWidth = Math.max(maxWidth, row[col].length);
        }
      }
      widths.push(maxWidth);
    }
    
    return { rows, widths };
  }, []);

  // Sound effects
  const playSound = useCallback((type: 'click' | 'slide' | 'lock' | 'complete' | 'print') => {
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
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      osc.start(now);
      osc.stop(now + 0.02);
    } else if (type === 'slide') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(400, now + 0.1);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'lock') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'complete') {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.06, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3 + i * 0.1);
        osc.start(now + i * 0.1);
        osc.stop(now + 0.4 + i * 0.1);
      });
    } else if (type === 'print') {
      // Mechanical printing sound
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noise = ctx.createOscillator();
        osc.connect(gain);
        noise.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        noise.type = 'sawtooth';
        osc.frequency.setValueAtTime(100 + i * 20, now + i * 0.05);
        noise.frequency.setValueAtTime(50, now + i * 0.05);
        gain.gain.setValueAtTime(0.02, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04 + i * 0.05);
        osc.start(now + i * 0.05);
        noise.start(now + i * 0.05);
        osc.stop(now + 0.05 + i * 0.05);
        noise.stop(now + 0.05 + i * 0.05);
      }
    }
  }, [soundEnabled]);

  // Initialize type blocks
  const initializeBlocks = useCallback(() => {
    const { rows, widths } = parseInput(input);
    setColumnWidths(widths);
    
    const blocks: TypeBlock[][] = rows.map((row, rowIdx) => 
      row.map((text, colIdx) => ({
        text,
        col: colIdx,
        row: rowIdx,
        width: widths[colIdx],
        targetX: 0,
        isMoving: false
      }))
    );
    
    setTypeBlocks(blocks);
    setAnimationStep(0);
    setShowOutput(false);
  }, [input, parseInput]);

  // Calculate aligned position
  const getAlignedPosition = useCallback((text: string, width: number, align: Alignment): number => {
    const padding = width - text.length;
    switch (align) {
      case 'left': return 0;
      case 'right': return padding;
      case 'center': return Math.floor(padding / 2);
    }
  }, []);


  // Run alignment animation
  const runAnimation = useCallback(() => {
    if (typeBlocks.length === 0) {
      initializeBlocks();
      return;
    }
    
    setIsAnimating(true);
    setShowOutput(false);
    let step = 0;
    const totalBlocks = typeBlocks.flat().length;
    
    const animate = () => {
      if (step >= totalBlocks) {
        setIsAnimating(false);
        setShowOutput(true);
        playSound('complete');
        return;
      }
      
      // Find current block to animate
      let blockCount = 0;
      for (let r = 0; r < typeBlocks.length; r++) {
        for (let c = 0; c < typeBlocks[r].length; c++) {
          if (blockCount === step) {
            setTypeBlocks(prev => {
              const newBlocks = [...prev];
              newBlocks[r] = [...newBlocks[r]];
              newBlocks[r][c] = {
                ...newBlocks[r][c],
                targetX: getAlignedPosition(newBlocks[r][c].text, columnWidths[c], alignment),
                isMoving: true
              };
              return newBlocks;
            });
            playSound('slide');
            break;
          }
          blockCount++;
        }
      }
      
      setAnimationStep(step + 1);
      step++;
      animationRef.current = window.setTimeout(animate, speed);
    };
    
    animate();
  }, [typeBlocks, initializeBlocks, alignment, columnWidths, getAlignedPosition, playSound, speed]);

  // Reset
  const reset = useCallback(() => {
    clearTimeout(animationRef.current);
    setIsAnimating(false);
    setAnimationStep(0);
    setShowOutput(false);
    initializeBlocks();
    playSound('click');
  }, [initializeBlocks, playSound]);

  // Generate output text
  const generateOutput = useCallback(() => {
    if (typeBlocks.length === 0) return '';
    
    return typeBlocks.map(row => {
      return row.map((block, colIdx) => {
        const padding = columnWidths[colIdx] - block.text.length;
        const leftPad = getAlignedPosition(block.text, columnWidths[colIdx], alignment);
        const rightPad = padding - leftPad;
        return ' '.repeat(leftPad) + block.text + ' '.repeat(rightPad);
      }).join(' ');
    }).join('\n');
  }, [typeBlocks, columnWidths, alignment, getAlignedPosition]);

  // Initialize on mount and input change
  useEffect(() => {
    initializeBlocks();
  }, [initializeBlocks]);

  // Cleanup
  useEffect(() => {
    return () => clearTimeout(animationRef.current);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement) return;
      if (e.key === ' ') { e.preventDefault(); isAnimating ? reset() : runAnimation(); }
      if (e.key === 'r' || e.key === 'R') reset();
      if (e.key === 'l' || e.key === 'L') setAlignment('left');
      if (e.key === 'c' || e.key === 'C') setAlignment('center');
      if (e.key === 'ArrowRight') setAlignment('right');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isAnimating, runAnimation, reset]);

  const totalBlocks = typeBlocks.flat().length;
  const progress = totalBlocks > 0 ? (animationStep / totalBlocks) * 100 : 0;

  // Color palette for columns (warm printing press colors)
  const columnColors = [
    { bg: 'bg-amber-900/40', border: 'border-amber-600/60', text: 'text-amber-200' },
    { bg: 'bg-orange-900/40', border: 'border-orange-600/60', text: 'text-orange-200' },
    { bg: 'bg-yellow-900/40', border: 'border-yellow-600/60', text: 'text-yellow-200' },
    { bg: 'bg-rose-900/40', border: 'border-rose-600/60', text: 'text-rose-200' },
    { bg: 'bg-red-900/40', border: 'border-red-600/60', text: 'text-red-200' },
    { bg: 'bg-cyan-900/40', border: 'border-cyan-600/60', text: 'text-cyan-200' },
    { bg: 'bg-teal-900/40', border: 'border-teal-600/60', text: 'text-teal-200' },
    { bg: 'bg-emerald-900/40', border: 'border-emerald-600/60', text: 'text-emerald-200' },
  ];

  const getColumnColor = (col: number) => columnColors[col % columnColors.length];


  return (
    <div className="w-full bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 rounded-xl border border-amber-900/40 font-sans overflow-hidden">
      
      {/* Header - Vintage Typography Workshop */}
      <div className="relative bg-gradient-to-r from-amber-950/80 via-stone-900 to-amber-950/80 border-b border-amber-700/30 px-6 py-4 overflow-hidden">
        {/* Decorative wood grain texture */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(180,120,60,0.3) 2px, rgba(180,120,60,0.3) 4px)`
        }} />
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-3 rounded-lg bg-amber-800/30 border-2 border-amber-600/50 shadow-lg shadow-amber-900/50">
                <Type className="text-amber-400" size={28} />
              </div>
              <motion.div
                className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-amber-300"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-amber-300 tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
                TYPOGRAPHY WORKSHOP
              </h2>
              <p className="text-xs text-amber-600/80 tracking-wider">Column Alignment Press • Est. 1842</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border-2 transition-all ${
                soundEnabled 
                  ? 'bg-amber-800/30 border-amber-600/50 text-amber-400' 
                  : 'bg-stone-800 border-stone-700 text-stone-500'
              }`}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6">
        
        {/* Controls Row */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          {/* Presets */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => { setInput(preset.text); playSound('click'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border-2 ${
                  input === preset.text
                    ? 'bg-amber-800/40 border-amber-600/60 text-amber-300'
                    : 'bg-stone-800/50 border-stone-700 text-stone-400 hover:border-amber-700/50 hover:text-amber-400'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>

          {/* Alignment Controls */}
          <div className="flex items-center gap-1 bg-stone-800/50 rounded-lg p-1 border border-stone-700">
            {[
              { value: 'left' as Alignment, icon: AlignLeft, label: 'Left' },
              { value: 'center' as Alignment, icon: AlignCenter, label: 'Center' },
              { value: 'right' as Alignment, icon: AlignRight, label: 'Right' },
            ].map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => { setAlignment(value); playSound('click'); }}
                className={`p-2 rounded transition-all flex items-center gap-1.5 ${
                  alignment === value
                    ? 'bg-amber-700/40 text-amber-300'
                    : 'text-stone-500 hover:text-amber-400'
                }`}
                title={label}
              >
                <Icon size={16} />
                <span className="text-xs hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="relative">
          <div className="absolute top-2 left-3 text-[10px] text-amber-600/60 font-mono uppercase tracking-wider">
            Raw Text Input ($ delimited)
          </div>
          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); reset(); }}
            className="w-full h-32 p-3 pt-7 bg-stone-900/80 border-2 border-amber-900/40 rounded-lg text-amber-200/90 font-mono text-sm leading-relaxed focus:outline-none focus:border-amber-600/50 resize-none"
            spellCheck={false}
            placeholder="Enter text with $ as column delimiter..."
          />
        </div>

        {/* Type Blocks Visualization */}
        <div className="relative bg-stone-900/60 rounded-xl border-2 border-amber-900/30 p-4 min-h-[200px] overflow-x-auto">
          {/* Wooden composing stick background */}
          <div className="absolute inset-0 opacity-5 rounded-xl" style={{
            backgroundImage: `linear-gradient(90deg, rgba(180,120,60,0.5) 1px, transparent 1px),
                             linear-gradient(rgba(180,120,60,0.5) 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }} />
          
          <div className="absolute top-2 left-3 text-[10px] text-amber-600/60 font-mono uppercase tracking-wider flex items-center gap-2">
            <Printer size={12} />
            Composing Stick
          </div>

          <div className="pt-6 space-y-2">
            {typeBlocks.map((row, rowIdx) => (
              <div key={rowIdx} className="flex gap-1 items-center">
                {/* Row number */}
                <div className="w-6 text-[10px] text-amber-700/50 font-mono text-right pr-1">
                  {rowIdx + 1}
                </div>
                
                {/* Type blocks for this row */}
                <div className="flex gap-0.5 relative">
                  {row.map((block, colIdx) => {
                    const color = getColumnColor(colIdx);
                    const charWidth = 10; // pixels per character
                    const blockWidth = columnWidths[colIdx] * charWidth + 8;
                    const offset = block.targetX * charWidth;
                    
                    return (
                      <motion.div
                        key={`${rowIdx}-${colIdx}`}
                        className={`relative h-8 rounded border-2 flex items-center overflow-hidden ${color.bg} ${color.border}`}
                        style={{ width: blockWidth }}
                        initial={false}
                        animate={{
                          boxShadow: block.isMoving 
                            ? '0 0 10px rgba(251, 191, 36, 0.3)' 
                            : '0 2px 4px rgba(0,0,0,0.3)'
                        }}
                      >
                        {/* The text block that slides */}
                        <motion.div
                          className={`absolute whitespace-nowrap font-mono text-sm font-medium px-1 ${color.text}`}
                          initial={{ x: 0 }}
                          animate={{ x: offset }}
                          transition={{ 
                            type: 'spring', 
                            stiffness: 300, 
                            damping: 25,
                            duration: 0.3
                          }}
                          onAnimationComplete={() => {
                            if (block.isMoving) {
                              setTypeBlocks(prev => {
                                const newBlocks = [...prev];
                                newBlocks[rowIdx] = [...newBlocks[rowIdx]];
                                newBlocks[rowIdx][colIdx] = { ...block, isMoving: false };
                                return newBlocks;
                              });
                              playSound('lock');
                            }
                          }}
                        >
                          {block.text}
                        </motion.div>
                        
                        {/* Column width indicator */}
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600/20" />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {typeBlocks.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-stone-500">
              <Type size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No text to compose</p>
            </div>
          )}
        </div>


        {/* Progress Bar */}
        <div className="relative h-3 bg-stone-800 rounded-full overflow-hidden border border-amber-900/30">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-700 via-amber-500 to-amber-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.2 }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-mono text-amber-300/80">
              {animationStep} / {totalBlocks} blocks aligned
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={isAnimating ? reset : runAnimation}
              className={`px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all border-2 ${
                isAnimating
                  ? 'bg-rose-900/30 border-rose-600/50 text-rose-300 hover:bg-rose-900/50'
                  : 'bg-amber-800/30 border-amber-600/50 text-amber-300 hover:bg-amber-800/50'
              }`}
            >
              {isAnimating ? (
                <>
                  <Pause size={18} />
                  Stop
                </>
              ) : (
                <>
                  <Play size={18} />
                  Align Columns
                </>
              )}
            </button>
            
            <button
              onClick={reset}
              className="px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 bg-stone-800/50 border-2 border-stone-700 text-stone-400 hover:border-amber-700/50 hover:text-amber-400 transition-all"
            >
              <RotateCcw size={16} />
              Reset
            </button>
          </div>

          {/* Speed Control */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500">Speed:</span>
            <input
              type="range"
              min="50"
              max="400"
              step="50"
              value={450 - speed}
              onChange={(e) => setSpeed(450 - parseInt(e.target.value))}
              className="w-24 accent-amber-500"
            />
          </div>
        </div>

        {/* Output Display */}
        <AnimatePresence>
          {showOutput && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative"
            >
              <div className="absolute top-2 left-3 text-[10px] text-emerald-500/60 font-mono uppercase tracking-wider flex items-center gap-2">
                <Printer size={12} />
                Printed Output ({alignment} aligned)
              </div>
              <div className="bg-stone-950/80 border-2 border-emerald-800/40 rounded-lg p-4 pt-8">
                <pre className="text-emerald-300 font-mono text-sm whitespace-pre overflow-x-auto">
                  {generateOutput()}
                </pre>
              </div>
              
              {/* Copy button */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateOutput());
                  playSound('print');
                }}
                className="absolute top-2 right-2 px-2 py-1 text-xs bg-emerald-900/30 border border-emerald-700/50 rounded text-emerald-400 hover:bg-emerald-900/50 transition-all"
              >
                Copy
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Column Width Legend */}
        {columnWidths.length > 0 && (
          <div className="bg-stone-900/40 rounded-lg border border-stone-800 p-3">
            <div className="text-[10px] text-stone-500 font-mono uppercase tracking-wider mb-2">
              Column Widths
            </div>
            <div className="flex flex-wrap gap-2">
              {columnWidths.map((width, idx) => {
                const color = getColumnColor(idx);
                return (
                  <div
                    key={idx}
                    className={`px-2 py-1 rounded text-xs font-mono ${color.bg} ${color.border} border ${color.text}`}
                  >
                    Col {idx + 1}: {width} chars
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Rows', value: typeBlocks.length, color: 'text-amber-400' },
            { label: 'Columns', value: columnWidths.length, color: 'text-orange-400' },
            { label: 'Total Blocks', value: totalBlocks, color: 'text-yellow-400' },
            { label: 'Alignment', value: alignment.toUpperCase(), color: 'text-emerald-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-stone-900/50 rounded-lg border border-stone-800 p-3 text-center">
              <div className="text-[10px] text-stone-500 uppercase tracking-wider">{stat.label}</div>
              <div className={`text-lg font-bold font-mono ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-amber-900/30 px-4 py-3 bg-stone-900/50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-stone-600">
            Delimiter: <span className="text-amber-500 font-mono">$</span> • 
            Alignment: <span className="text-amber-400">{alignment}</span>
          </div>
          <div className="flex gap-2 text-[10px] text-stone-600">
            <span className="px-2 py-1 bg-stone-800/50 rounded border border-stone-700/50">
              <kbd className="text-stone-400">Space</kbd> Run
            </span>
            <span className="px-2 py-1 bg-stone-800/50 rounded border border-stone-700/50">
              <kbd className="text-stone-400">L/C/→</kbd> Align
            </span>
            <span className="px-2 py-1 bg-stone-800/50 rounded border border-stone-700/50">
              <kbd className="text-stone-400">R</kbd> Reset
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
