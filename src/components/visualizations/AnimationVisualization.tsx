import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, ArrowRight, ArrowLeft, Zap, Type, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface LEDChar {
  char: string;
  id: number;
  glow: boolean;
}

// --- Component ---
export default function AnimationVisualization() {
  const [text, setText] = useState('Hello World! ');
  const [displayText, setDisplayText] = useState('Hello World! ');
  const [isRunning, setIsRunning] = useState(true);
  const [direction, setDirection] = useState<'right' | 'left'>('right');
  const [speed, setSpeed] = useState(200);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [rotationCount, setRotationCount] = useState(0);
  const [clickCount, setClickCount] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);
  const charIdRef = useRef(0);

  // Initialize audio context
  useEffect(() => {
    if (soundEnabled && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
  }, [soundEnabled]);

  // Play tick sound
  const playTick = useCallback(() => {
    if (!soundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const currentTime = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, currentTime);
    gain.gain.setValueAtTime(0.03, currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.03);
    osc.start(currentTime);
    osc.stop(currentTime + 0.03);
  }, [soundEnabled]);

  // Play direction change sound
  const playDirectionChange = useCallback(() => {
    if (!soundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const currentTime = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, currentTime);
    osc.frequency.exponentialRampToValueAtTime(direction === 'right' ? 400 : 800, currentTime + 0.1);
    gain.gain.setValueAtTime(0.08, currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.15);
    osc.start(currentTime);
    osc.stop(currentTime + 0.15);
  }, [soundEnabled, direction]);

  // Rotate text
  const rotateText = useCallback((currentText: string, dir: 'right' | 'left'): string => {
    if (currentText.length === 0) return currentText;
    if (dir === 'right') {
      // Move last char to front
      return currentText[currentText.length - 1] + currentText.slice(0, -1);
    } else {
      // Move first char to end
      return currentText.slice(1) + currentText[0];
    }
  }, []);

  // Animation loop
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setDisplayText(prev => {
          const newText = rotateText(prev, direction);
          playTick();
          setRotationCount(c => c + 1);
          return newText;
        });
      }, speed);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, speed, direction, rotateText, playTick]);

  // Handle click to reverse direction
  const handleDisplayClick = () => {
    setDirection(prev => prev === 'right' ? 'left' : 'right');
    setClickCount(c => c + 1);
    playDirectionChange();
  };

  // Reset
  const reset = () => {
    setDisplayText(text);
    setRotationCount(0);
    setClickCount(0);
    setDirection('right');
  };

  // Update base text
  const handleTextChange = (newText: string) => {
    setText(newText);
    setDisplayText(newText);
    setRotationCount(0);
  };

  // Generate LED characters with unique IDs
  const getLEDChars = (): LEDChar[] => {
    return displayText.split('').map((char, index) => ({
      char,
      id: charIdRef.current + index,
      glow: char !== ' ',
    }));
  };

  const ledChars = getLEDChars();

  // Preset texts
  const presets = [
    { label: 'Hello World!', value: 'Hello World! ' },
    { label: 'ROSETTA CODE', value: 'ROSETTA CODE ' },
    { label: 'ANIMATION', value: '>>> ANIMATION <<< ' },
    { label: 'MARQUEE', value: '★ MARQUEE ★ ' },
  ];

  return (
    <div className="w-full min-h-[700px] bg-gradient-to-br from-slate-950 via-rose-950/10 to-slate-950 rounded-xl border border-rose-900/30 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-rose-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30">
              <motion.div
                animate={{ rotate: direction === 'right' ? 360 : -360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Zap className="text-rose-400" size={24} />
              </motion.div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-rose-300 tracking-wide">NEON MARQUEE</h2>
              <p className="text-xs text-rose-500/70">Click the display to reverse direction</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Direction:</span>
              <motion.div
                key={direction}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`flex items-center gap-1 px-2 py-1 rounded ${
                  direction === 'right' 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {direction === 'right' ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                <span className="uppercase font-bold">{direction}</span>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        
        {/* LED Display Board */}
        <motion.div
          onClick={handleDisplayClick}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="relative cursor-pointer group"
        >
          {/* Outer frame */}
          <div className="absolute -inset-2 bg-gradient-to-r from-rose-500/20 via-amber-500/20 to-rose-500/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-80 transition-opacity" />
          
          {/* Display board */}
          <div className="relative bg-slate-950 rounded-xl border-4 border-slate-800 p-6 overflow-hidden">
            {/* Scanline effect */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-10"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
              }}
            />
            
            {/* LED grid background */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(244,63,94,0.3) 1px, transparent 1px)',
                backgroundSize: '8px 8px',
              }}
            />

            {/* Characters */}
            <div className="flex justify-center items-center min-h-[100px] overflow-hidden">
              <AnimatePresence mode="popLayout">
                {ledChars.map((led, index) => (
                  <motion.div
                    key={`${led.id}-${index}`}
                    layout
                    initial={{ opacity: 0, y: -20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.8 }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 500, 
                      damping: 30,
                      delay: index * 0.01 
                    }}
                    className="relative"
                  >
                    {/* Glow effect */}
                    {led.glow && (
                      <div 
                        className="absolute inset-0 blur-md"
                        style={{
                          background: `radial-gradient(circle, rgba(244,63,94,0.6) 0%, transparent 70%)`,
                        }}
                      />
                    )}
                    
                    {/* Character */}
                    <span
                      className={`
                        relative inline-block text-4xl md:text-5xl lg:text-6xl font-mono font-bold
                        ${led.char === ' ' ? 'w-6 md:w-8' : ''}
                        ${led.glow 
                          ? 'text-rose-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]' 
                          : 'text-slate-700'
                        }
                      `}
                      style={{
                        textShadow: led.glow 
                          ? '0 0 10px rgba(244,63,94,0.8), 0 0 20px rgba(244,63,94,0.5), 0 0 30px rgba(244,63,94,0.3)' 
                          : 'none',
                        minWidth: led.char === ' ' ? '0.5em' : 'auto',
                      }}
                    >
                      {led.char === ' ' ? '\u00A0' : led.char}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Click hint */}
            <div className="absolute bottom-2 right-2 text-xs text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
              Click to reverse
            </div>
          </div>
        </motion.div>

        {/* Controls Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Playback Controls */}
          <div className="bg-slate-900/50 rounded-xl border border-rose-800/30 p-4">
            <h3 className="text-sm font-bold text-rose-300 mb-4 flex items-center gap-2">
              <Play size={16} />
              PLAYBACK
            </h3>
            
            <div className="flex gap-2">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`
                  flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all
                  ${isRunning
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30'
                  }
                `}
              >
                {isRunning ? <Pause size={18} /> : <Play size={18} />}
                {isRunning ? 'PAUSE' : 'PLAY'}
              </button>
              <button
                onClick={reset}
                className="px-4 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
                title="Reset"
              >
                <RotateCcw size={18} />
              </button>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => { setDirection('left'); playDirectionChange(); }}
                className={`flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1 transition-all ${
                  direction === 'left'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                <ArrowLeft size={14} />
                LEFT
              </button>
              <button
                onClick={() => { setDirection('right'); playDirectionChange(); }}
                className={`flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1 transition-all ${
                  direction === 'right'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                RIGHT
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Speed Control */}
          <div className="bg-slate-900/50 rounded-xl border border-rose-800/30 p-4">
            <h3 className="text-sm font-bold text-rose-300 mb-4 flex items-center gap-2">
              <Gauge size={16} />
              SPEED
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-rose-400">Interval</span>
                <span className="text-rose-200 font-mono">{speed}ms</span>
              </div>
              <input
                type="range"
                min="50"
                max="500"
                step="10"
                value={speed}
                onChange={(e) => setSpeed(parseInt(e.target.value))}
                className="w-full accent-rose-500"
              />
              
              <div className="flex gap-2 mt-2">
                {[50, 100, 200, 400].map(s => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${
                      speed === s
                        ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {s}ms
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-slate-900/50 rounded-xl border border-rose-800/30 p-4">
            <h3 className="text-sm font-bold text-rose-300 mb-4">STATISTICS</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-rose-400 font-mono">{rotationCount}</div>
                <div className="text-xs text-slate-500">Rotations</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-amber-400 font-mono">{clickCount}</div>
                <div className="text-xs text-slate-500">Reversals</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-emerald-400 font-mono">{displayText.length}</div>
                <div className="text-xs text-slate-500">Characters</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-cyan-400 font-mono">
                  {isRunning ? 'ON' : 'OFF'}
                </div>
                <div className="text-xs text-slate-500">Status</div>
              </div>
            </div>
          </div>
        </div>

        {/* Text Input & Presets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Custom Text Input */}
          <div className="bg-slate-900/50 rounded-xl border border-rose-800/30 p-4">
            <h3 className="text-sm font-bold text-rose-300 mb-4 flex items-center gap-2">
              <Type size={16} />
              CUSTOM TEXT
            </h3>
            
            <div className="space-y-3">
              <input
                type="text"
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Enter text to animate..."
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30 font-mono"
              />
              <p className="text-xs text-slate-500">
                Tip: Add a trailing space for smooth rotation
              </p>
            </div>
          </div>

          {/* Presets */}
          <div className="bg-slate-900/50 rounded-xl border border-rose-800/30 p-4">
            <h3 className="text-sm font-bold text-rose-300 mb-4">PRESETS</h3>
            
            <div className="grid grid-cols-2 gap-2">
              {presets.map(preset => (
                <button
                  key={preset.label}
                  onClick={() => handleTextChange(preset.value)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    text === preset.value
                      ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-slate-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sound Toggle */}
        <div className="flex justify-center">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              soundEnabled
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}
          >
            Sound: {soundEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Algorithm Explanation */}
        <details className="bg-slate-900/50 rounded-xl border border-rose-800/30">
          <summary className="px-4 py-3 cursor-pointer text-sm text-rose-400 hover:text-rose-300 transition-colors">
            How does the animation work?
          </summary>
          <div className="px-4 pb-4 text-xs text-rose-500 space-y-3">
            <div className="bg-slate-800/50 rounded-lg p-3 font-mono text-slate-300">
              <div className="text-rose-400 mb-2">// Rotate Right (default)</div>
              <div>"Hello World! " → " Hello World!"</div>
              <div className="text-slate-500 mt-1">// Last char moves to front</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 font-mono text-slate-300">
              <div className="text-amber-400 mb-2">// Rotate Left (on click)</div>
              <div>"Hello World! " → "ello World! H"</div>
              <div className="text-slate-500 mt-1">// First char moves to end</div>
            </div>
            <p>
              The animation creates the illusion of scrolling text by periodically 
              moving characters from one end of the string to the other. Clicking 
              the display reverses the direction, demonstrating responsive user interaction.
            </p>
            <p>
              This is a fundamental animation pattern used in marquee displays, 
              ticker tapes, and scrolling text effects in GUIs and games.
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}
