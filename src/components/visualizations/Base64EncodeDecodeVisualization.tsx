import { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Volume2, VolumeX, Copy, Check, Binary, FileText, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Base64 character set
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Encode string to Base64
const encodeBase64 = (str: string): string => {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch {
    return btoa(str);
  }
};

// Decode Base64 to string
const decodeBase64 = (str: string): string => {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch {
    try {
      return atob(str);
    } catch {
      return '[Invalid Base64]';
    }
  }
};

// Get binary representation of a character
const charToBinary = (char: string): string => {
  return char.charCodeAt(0).toString(2).padStart(8, '0');
};

// Get 6-bit groups from binary string
const binaryTo6BitGroups = (binary: string): string[] => {
  const groups: string[] = [];
  const padded = binary.padEnd(Math.ceil(binary.length / 6) * 6, '0');
  for (let i = 0; i < padded.length; i += 6) {
    groups.push(padded.slice(i, i + 6));
  }
  return groups;
};

// Convert 6-bit binary to Base64 character
const sixBitToBase64 = (bits: string): string => {
  const index = parseInt(bits, 2);
  return BASE64_CHARS[index];
};

// Presets
const PRESETS = [
  { label: 'Hello', value: 'Hello, World!' },
  { label: 'Rosetta', value: 'Rosetta Code' },
  { label: 'Base64', value: 'Base64 is fun!' },
  { label: 'Unicode', value: '你好世界 🌍' },
  { label: 'Numbers', value: '12345' },
];

export default function Base64EncodeDecodeVisualization() {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [input, setInput] = useState('Hello, World!');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [showBinaryBreakdown, setShowBinaryBreakdown] = useState(true);
  const [copied, setCopied] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);


  // --- Audio ---
  const playSound = useCallback((type: 'encode' | 'decode' | 'step' | 'complete' | 'error' | 'copy') => {
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
      osc.frequency.setValueAtTime(400 + currentStep * 50, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'encode' || type === 'decode') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(type === 'encode' ? 500 : 400, now);
      osc.frequency.exponentialRampToValueAtTime(type === 'encode' ? 800 : 600, now + 0.1);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'complete') {
      [523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.05, now + i * 0.08);
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
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'copy') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  }, [soundEnabled, currentStep]);

  // Process input
  const process = useCallback(() => {
    if (!input.trim()) {
      setError('Please enter some text');
      playSound('error');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setCurrentStep(0);
    playSound(mode);

    const totalSteps = mode === 'encode' ? input.length : Math.ceil(input.length / 4);
    let step = 0;

    intervalRef.current = window.setInterval(() => {
      step++;
      setCurrentStep(step);
      playSound('step');

      if (step >= totalSteps) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        
        const result = mode === 'encode' ? encodeBase64(input) : decodeBase64(input);
        if (result === '[Invalid Base64]') {
          setError('Invalid Base64 string');
          playSound('error');
        } else {
          setOutput(result);
          playSound('complete');
        }
        setIsProcessing(false);
      }
    }, 80);
  }, [input, mode, playSound]);

  // Reset
  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsProcessing(false);
    setCurrentStep(-1);
    setOutput('');
    setError(null);
  }, []);

  // Copy to clipboard
  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    playSound('copy');
    setTimeout(() => setCopied(false), 2000);
  }, [output, playSound]);

  // Swap input/output
  const swapInputOutput = useCallback(() => {
    if (output) {
      setInput(output);
      setOutput('');
      setMode(mode === 'encode' ? 'decode' : 'encode');
      setCurrentStep(-1);
    }
  }, [output, mode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Enter') process();
      if (e.key === 'r' || e.key === 'R') reset();
      if (e.key === 'e' || e.key === 'E') setMode('encode');
      if (e.key === 'd' || e.key === 'D') setMode('decode');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [process, reset]);

  // Get binary breakdown for encoding visualization
  const getBinaryBreakdown = () => {
    if (mode !== 'encode' || !input) return null;
    
    const chars = input.slice(0, Math.min(input.length, 12)).split('');
    const binaryStr = chars.map(c => charToBinary(c)).join('');
    const sixBitGroups = binaryTo6BitGroups(binaryStr);
    
    return { chars, binaryStr, sixBitGroups };
  };

  const breakdown = getBinaryBreakdown();

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-sky-950/10 to-slate-950 rounded-xl border border-sky-900/30 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-sky-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/30">
              <Binary className="text-sky-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-sky-300 tracking-wide">DATA ENCODER</h2>
              <p className="text-xs text-sky-500/70">Base64 Encode & Decode</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled 
                  ? 'bg-sky-500/20 border-sky-500/50 text-sky-300' 
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
        
        {/* Mode Toggle */}
        <div className="flex justify-center">
          <div className="inline-flex bg-slate-900/50 rounded-xl border border-slate-800 p-1">
            <button
              onClick={() => { setMode('encode'); reset(); }}
              className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
                mode === 'encode'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50'
                  : 'text-slate-400 hover:text-sky-300'
              }`}
            >
              <ArrowRight size={16} />
              ENCODE
            </button>
            <button
              onClick={() => { setMode('decode'); reset(); }}
              className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
                mode === 'decode'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              <ArrowLeft size={16} />
              DECODE
            </button>
          </div>
        </div>

        {/* Input/Output Section */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-start">
          
          {/* Input */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-slate-500 flex items-center gap-2">
                <FileText size={14} />
                {mode === 'encode' ? 'Plain Text' : 'Base64 String'}
              </label>
              <span className="text-[10px] text-slate-600">{input.length} chars</span>
            </div>
            <textarea
              value={input}
              onChange={(e) => { setInput(e.target.value); reset(); }}
              placeholder={mode === 'encode' ? 'Enter text to encode...' : 'Enter Base64 to decode...'}
              className="w-full h-32 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-sm text-sky-300 font-mono resize-none focus:outline-none focus:border-sky-500 transition-colors"
            />
            
            {/* Presets */}
            {mode === 'encode' && (
              <div className="flex flex-wrap gap-2 mt-3">
                {PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setInput(preset.value); reset(); }}
                    className="px-2 py-1 text-[10px] rounded border bg-slate-800 border-slate-700 text-slate-400 hover:text-sky-300 hover:border-sky-500/50 transition-all"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Arrow / Process Button */}
          <div className="flex flex-col items-center gap-2 py-4">
            <button
              onClick={process}
              disabled={isProcessing}
              className={`p-4 rounded-xl border-2 transition-all ${
                isProcessing
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse'
                  : mode === 'encode'
                  ? 'bg-sky-500/20 border-sky-500/50 text-sky-300 hover:bg-sky-500/30'
                  : 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
              }`}
            >
              {mode === 'encode' ? <ArrowRight size={24} /> : <ArrowLeft size={24} />}
            </button>
            
            {output && (
              <button
                onClick={swapInputOutput}
                className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-sky-300 hover:border-sky-500/50 transition-all"
                title="Swap & reverse"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>

          {/* Output */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-slate-500 flex items-center gap-2">
                <Binary size={14} />
                {mode === 'encode' ? 'Base64 Output' : 'Decoded Text'}
              </label>
              {output && (
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-slate-800 border border-slate-700 text-slate-400 hover:text-sky-300 hover:border-sky-500/50 transition-all"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>
            <div className={`w-full h-32 px-4 py-3 bg-slate-900 border rounded-lg text-sm font-mono overflow-auto ${
              error ? 'border-red-500/50 text-red-400' : 'border-slate-700 text-emerald-300'
            }`}>
              <AnimatePresence mode="wait">
                {isProcessing ? (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-amber-400"
                  >
                    <span className="animate-pulse">Processing</span>
                    <span className="font-mono">{'.'.repeat((currentStep % 3) + 1)}</span>
                  </motion.div>
                ) : error ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {error}
                  </motion.div>
                ) : output ? (
                  <motion.div
                    key="output"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="break-all"
                  >
                    {output}
                  </motion.div>
                ) : (
                  <span className="text-slate-600">Output will appear here...</span>
                )}
              </AnimatePresence>
            </div>
            
            {output && (
              <div className="mt-2 text-[10px] text-slate-500">
                {mode === 'encode' 
                  ? `${input.length} bytes → ${output.length} chars (${Math.round(output.length / input.length * 100)}% size)`
                  : `${input.length} chars → ${output.length} bytes`
                }
              </div>
            )}
          </div>
        </div>

        {/* Binary Breakdown (Encode mode only) */}
        <AnimatePresence>
          {mode === 'encode' && showBinaryBreakdown && breakdown && input.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-slate-900/30 rounded-xl border border-slate-800 overflow-hidden"
            >
              <button
                onClick={() => setShowBinaryBreakdown(!showBinaryBreakdown)}
                className="w-full px-4 py-3 flex items-center justify-between text-sm text-sky-400 hover:bg-slate-800/50 transition-colors"
              >
                <span>Binary Breakdown (first 12 chars)</span>
                <span className="text-xs text-slate-500">Click to hide</span>
              </button>
              
              <div className="p-4 border-t border-slate-800 overflow-x-auto">
                {/* Characters to Binary */}
                <div className="mb-4">
                  <div className="text-xs text-slate-500 mb-2">Characters → 8-bit Binary</div>
                  <div className="flex flex-wrap gap-2">
                    {breakdown.chars.map((char, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`flex flex-col items-center p-2 rounded-lg border ${
                          currentStep > idx || !isProcessing
                            ? 'bg-sky-500/10 border-sky-500/30'
                            : 'bg-slate-800/50 border-slate-700'
                        }`}
                      >
                        <span className="text-lg font-mono text-sky-300">{char === ' ' ? '␣' : char}</span>
                        <span className="text-[10px] font-mono text-slate-400 mt-1">
                          {charToBinary(char)}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* 6-bit groups to Base64 */}
                <div>
                  <div className="text-xs text-slate-500 mb-2">6-bit Groups → Base64</div>
                  <div className="flex flex-wrap gap-2">
                    {breakdown.sixBitGroups.slice(0, 16).map((group, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + idx * 0.05 }}
                        className="flex flex-col items-center p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30"
                      >
                        <span className="text-[10px] font-mono text-slate-400">{group}</span>
                        <span className="text-lg font-mono text-emerald-300 mt-1">
                          {sixBitToBase64(group)}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          ({parseInt(group, 2)})
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Base64 Character Set Reference */}
        <details className="bg-slate-900/30 rounded-xl border border-slate-800">
          <summary className="px-4 py-3 cursor-pointer text-sm text-sky-400 hover:text-sky-300 transition-colors">
            Base64 Character Set (64 characters)
          </summary>
          <div className="px-4 pb-4 border-t border-slate-800 pt-3">
            <div className="grid grid-cols-8 md:grid-cols-16 gap-1">
              {BASE64_CHARS.split('').map((char, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center p-1 rounded bg-slate-800/50 border border-slate-700/50"
                >
                  <span className="text-xs font-mono text-sky-300">{char}</span>
                  <span className="text-[8px] text-slate-500">{idx}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-[10px] text-slate-500">
              + padding character: <span className="text-amber-400">=</span>
            </div>
          </div>
        </details>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Enter</kbd> Process
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">E</kbd> Encode mode
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">D</kbd> Decode mode
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-sky-400 hover:text-sky-300 transition-colors">
          How does Base64 work?
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            <span className="text-sky-300">Base64</span> encodes binary data using 64 printable ASCII characters,
            making it safe for text-based protocols like email and URLs.
          </p>
          <p>
            <span className="text-amber-300">Encoding process:</span>
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Convert each character to 8-bit binary</li>
            <li>Concatenate all binary strings</li>
            <li>Split into 6-bit groups</li>
            <li>Convert each 6-bit group to a Base64 character (0-63)</li>
            <li>Add <span className="text-amber-400">=</span> padding if needed</li>
          </ol>
          <p className="mt-2">
            <span className="text-emerald-300">Size increase:</span> ~33% larger than original 
            (3 bytes → 4 characters)
          </p>
        </div>
      </details>
    </div>
  );
}
