import { useState, useRef, useCallback, useEffect } from 'react';
import { Lock, Unlock, RotateCcw, Volume2, VolumeX, Shuffle, Play, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Constants ---
const ADFGVX = ['A', 'D', 'F', 'G', 'V', 'X'];
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

// --- Helpers ---
const shuffleArray = <T,>(arr: T[]): T[] => {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const generatePolybiusSquare = (): string[][] => {
  const chars = shuffleArray(ALPHABET.split(''));
  const square: string[][] = [];
  for (let i = 0; i < 6; i++) {
    square.push(chars.slice(i * 6, (i + 1) * 6));
  }
  return square;
};

const findInSquare = (square: string[][], char: string): [number, number] | null => {
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      if (square[r][c] === char.toUpperCase()) {
        return [r, c];
      }
    }
  }
  return null;
};

// --- Component ---
export default function ADFGVXCipherVisualization() {
  const [polybiusSquare, setPolybiusSquare] = useState<string[][]>(generatePolybiusSquare);
  const [keyword, setKeyword] = useState('CIPHER');
  const [plaintext, setPlaintext] = useState('ATTACKAT1200AM');
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [step, setStep] = useState(0); // 0: input, 1: substitution, 2: transposition, 3: result
  const [isAnimating, setIsAnimating] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copied, setCopied] = useState(false);
  const [highlightedCell, setHighlightedCell] = useState<[number, number] | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);


  // --- Audio ---
  const playSound = useCallback((type: 'click' | 'encrypt' | 'decrypt' | 'step' | 'complete' | 'shuffle') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
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
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'encrypt' || type === 'step') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'decrypt') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.1);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'complete') {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.1, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25 + i * 0.08);
        osc.start(now + i * 0.08);
        osc.stop(now + 0.3 + i * 0.08);
      });
    } else if (type === 'shuffle') {
      [300, 400, 500, 600].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.03);
        gain.gain.setValueAtTime(0.06, now + i * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1 + i * 0.03);
        osc.start(now + i * 0.03);
        osc.stop(now + 0.15 + i * 0.03);
      });
    }
  }, [soundEnabled]);

  // --- Cipher Operations ---
  const cleanText = (text: string): string => {
    return text.toUpperCase().replace(/[^A-Z0-9]/g, '');
  };

  const substituteChar = (char: string): string => {
    const pos = findInSquare(polybiusSquare, char);
    if (!pos) return '';
    return ADFGVX[pos[0]] + ADFGVX[pos[1]];
  };

  const getSubstitutionResult = (): string => {
    const clean = cleanText(plaintext);
    return clean.split('').map(c => substituteChar(c)).join('');
  };

  const getColumnOrder = (): number[] => {
    const sortedKeyword = keyword.toUpperCase().split('').map((c, i) => ({ char: c, idx: i }));
    sortedKeyword.sort((a, b) => a.char.localeCompare(b.char));
    return sortedKeyword.map(item => item.idx);
  };

  const performTransposition = (substituted: string): string => {
    const keyLen = keyword.length;
    const columns: string[] = Array(keyLen).fill('');
    
    for (let i = 0; i < substituted.length; i++) {
      columns[i % keyLen] += substituted[i];
    }
    
    const order = getColumnOrder();
    return order.map(idx => columns[idx]).join('');
  };

  const encrypt = (): string => {
    const substituted = getSubstitutionResult();
    return performTransposition(substituted);
  };

  const reverseTransposition = (ciphertext: string): string => {
    const keyLen = keyword.length;
    const numRows = Math.ceil(ciphertext.length / keyLen);
    const fullCols = ciphertext.length % keyLen || keyLen;
    const order = getColumnOrder();
    
    // Calculate column lengths
    const colLengths: number[] = [];
    for (let i = 0; i < keyLen; i++) {
      const originalIdx = order.indexOf(i);
      colLengths.push(originalIdx < fullCols ? numRows : numRows - 1);
    }
    
    // Split ciphertext into columns
    const columns: string[] = [];
    let pos = 0;
    for (let i = 0; i < keyLen; i++) {
      columns.push(ciphertext.slice(pos, pos + colLengths[i]));
      pos += colLengths[i];
    }
    
    // Reorder columns back
    const reordered: string[] = Array(keyLen).fill('');
    for (let i = 0; i < keyLen; i++) {
      reordered[order[i]] = columns[i];
    }
    
    // Read row by row
    let result = '';
    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < keyLen; c++) {
        if (r < reordered[c].length) {
          result += reordered[c][r];
        }
      }
    }
    return result;
  };

  const reverseSubstitution = (text: string): string => {
    let result = '';
    for (let i = 0; i < text.length; i += 2) {
      const row = ADFGVX.indexOf(text[i]);
      const col = ADFGVX.indexOf(text[i + 1]);
      if (row >= 0 && col >= 0) {
        result += polybiusSquare[row][col];
      }
    }
    return result;
  };

  const decrypt = (ciphertext: string): string => {
    const afterTransposition = reverseTransposition(ciphertext);
    return reverseSubstitution(afterTransposition);
  };

  // --- Animation ---
  const runAnimation = async () => {
    setIsAnimating(true);
    setStep(0);
    await new Promise(r => setTimeout(r, 500));
    
    playSound('step');
    setStep(1);
    await new Promise(r => setTimeout(r, 1500));
    
    playSound('step');
    setStep(2);
    await new Promise(r => setTimeout(r, 1500));
    
    playSound('complete');
    setStep(3);
    setIsAnimating(false);
  };

  const reset = () => {
    setStep(0);
    setIsAnimating(false);
    setHighlightedCell(null);
  };

  const shuffleSquare = () => {
    setPolybiusSquare(generatePolybiusSquare());
    playSound('shuffle');
    reset();
  };

  const copyResult = () => {
    const result = mode === 'encrypt' ? encrypt() : decrypt(plaintext);
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ' && !isAnimating) {
        e.preventDefault();
        runAnimation();
      }
      if (e.key === 'r' || e.key === 'R') reset();
      if (e.key === 's' || e.key === 'S') shuffleSquare();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isAnimating]);

  const substitutionResult = getSubstitutionResult();
  const finalResult = mode === 'encrypt' ? encrypt() : decrypt(plaintext);


  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-emerald-950/10 to-slate-950 rounded-xl border border-emerald-900/30 font-sans overflow-hidden">
      
      {/* Header - Military Cipher Machine Theme */}
      <div className="bg-slate-900/80 border-b border-emerald-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              {mode === 'encrypt' ? (
                <Lock className="text-emerald-400" size={24} />
              ) : (
                <Unlock className="text-emerald-400" size={24} />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-300 tracking-wide">ADFGVX CIPHER MACHINE</h2>
              <p className="text-xs text-emerald-500/70">WWI German Field Cipher • Polybius + Transposition</p>
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
            {/* Mode Toggle */}
            <div className="flex rounded-lg border border-emerald-800/50 overflow-hidden">
              <button
                onClick={() => { setMode('encrypt'); reset(); playSound('click'); }}
                className={`px-3 py-1.5 text-xs font-bold transition-all ${
                  mode === 'encrypt'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                <Lock size={12} className="inline mr-1" />
                Encrypt
              </button>
              <button
                onClick={() => { setMode('decrypt'); reset(); playSound('click'); }}
                className={`px-3 py-1.5 text-xs font-bold transition-all ${
                  mode === 'decrypt'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                <Unlock size={12} className="inline mr-1" />
                Decrypt
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        
        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">
              {mode === 'encrypt' ? 'Plaintext' : 'Ciphertext'}
            </label>
            <input
              type="text"
              value={plaintext}
              onChange={(e) => { setPlaintext(e.target.value.toUpperCase()); reset(); }}
              placeholder={mode === 'encrypt' ? 'ATTACKAT1200AM' : 'Enter ciphertext...'}
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-mono text-lg placeholder:text-slate-600 focus:border-emerald-500/50 focus:outline-none transition-colors tracking-wider"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Keyword</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value.toUpperCase().replace(/[^A-Z]/g, '')); reset(); }}
              placeholder="CIPHER"
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-mono text-lg placeholder:text-slate-600 focus:border-emerald-500/50 focus:outline-none transition-colors tracking-wider"
            />
          </div>
        </div>

        {/* Polybius Square */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-bold text-slate-300">6×6 Polybius Square</div>
            <button
              onClick={shuffleSquare}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-xs font-bold hover:text-emerald-300 hover:border-emerald-500/30 transition-all flex items-center gap-1"
            >
              <Shuffle size={12} />
              Shuffle
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="mx-auto border-collapse">
              <thead>
                <tr>
                  <th className="w-10 h-10"></th>
                  {ADFGVX.map(col => (
                    <th key={col} className="w-10 h-10 text-center text-emerald-400 font-mono font-bold text-sm">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {polybiusSquare.map((row, r) => (
                  <tr key={r}>
                    <td className="w-10 h-10 text-center text-emerald-400 font-mono font-bold text-sm">
                      {ADFGVX[r]}
                    </td>
                    {row.map((cell, c) => {
                      const isHighlighted = highlightedCell && highlightedCell[0] === r && highlightedCell[1] === c;
                      return (
                        <td key={c} className="p-0">
                          <motion.div
                            animate={isHighlighted ? { scale: 1.2, backgroundColor: 'rgba(16, 185, 129, 0.3)' } : {}}
                            className={`w-10 h-10 flex items-center justify-center border border-slate-700 font-mono font-bold text-sm transition-colors ${
                              isHighlighted ? 'text-emerald-300 bg-emerald-500/20' : 'text-slate-300 bg-slate-800/50 hover:bg-slate-700/50'
                            }`}
                            onMouseEnter={() => setHighlightedCell([r, c])}
                            onMouseLeave={() => setHighlightedCell(null)}
                          >
                            {cell}
                          </motion.div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {highlightedCell && (
            <div className="mt-3 text-center text-xs text-slate-500">
              <span className="text-emerald-400 font-mono">{polybiusSquare[highlightedCell[0]][highlightedCell[1]]}</span>
              {' → '}
              <span className="text-cyan-400 font-mono">{ADFGVX[highlightedCell[0]]}{ADFGVX[highlightedCell[1]]}</span>
            </div>
          )}
        </div>

        {/* Process Visualization */}
        <div className="bg-slate-900/50 rounded-xl border border-emerald-800/30 p-4">
          <div className="text-sm font-bold text-emerald-300 mb-4">
            {mode === 'encrypt' ? 'Encryption' : 'Decryption'} Process
          </div>
          
          {/* Step Indicators */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {['Input', 'Substitution', 'Transposition', 'Result'].map((label, idx) => (
              <div key={label} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step >= idx
                    ? 'bg-emerald-500/30 text-emerald-300 border-2 border-emerald-500'
                    : 'bg-slate-800 text-slate-500 border-2 border-slate-700'
                }`}>
                  {idx + 1}
                </div>
                {idx < 3 && (
                  <div className={`w-8 h-0.5 transition-all ${
                    step > idx ? 'bg-emerald-500' : 'bg-slate-700'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {step >= 1 && mode === 'encrypt' && (
              <motion.div
                key="substitution"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-4"
              >
                <div className="text-xs text-slate-500 mb-2">Step 1: Polybius Substitution</div>
                <div className="flex flex-wrap gap-1 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  {cleanText(plaintext).split('').map((char, idx) => (
                    <div key={idx} className="text-center">
                      <div className="text-sm font-mono text-slate-400">{char}</div>
                      <div className="text-[10px] text-slate-600">↓</div>
                      <div className="text-sm font-mono text-cyan-400">{substituteChar(char)}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Result: <span className="text-cyan-400 font-mono">{substitutionResult}</span>
                </div>
              </motion.div>
            )}

            {step >= 2 && mode === 'encrypt' && (
              <motion.div
                key="transposition"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-4"
              >
                <div className="text-xs text-slate-500 mb-2">Step 2: Columnar Transposition (Key: {keyword})</div>
                <div className="overflow-x-auto">
                  <table className="mx-auto border-collapse text-center">
                    <thead>
                      <tr>
                        {keyword.split('').map((char, idx) => (
                          <th key={idx} className="px-2 py-1 text-amber-400 font-mono text-sm border border-slate-700 bg-slate-800/50">
                            {char}
                            <div className="text-[10px] text-slate-500">({getColumnOrder().indexOf(idx) + 1})</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: Math.ceil(substitutionResult.length / keyword.length) }).map((_, row) => (
                        <tr key={row}>
                          {keyword.split('').map((_, col) => {
                            const charIdx = row * keyword.length + col;
                            return (
                              <td key={col} className="px-2 py-1 font-mono text-sm border border-slate-700 text-cyan-400">
                                {substitutionResult[charIdx] || ''}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Read columns in order: {getColumnOrder().map(i => keyword[i]).join(', ')}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Final Result */}
          {step >= 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-emerald-500/10 rounded-xl border-2 border-emerald-500/50"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-emerald-400 uppercase tracking-wider">
                  {mode === 'encrypt' ? 'Ciphertext' : 'Plaintext'}
                </div>
                <button
                  onClick={copyResult}
                  className="p-1.5 rounded bg-slate-800/50 text-slate-400 hover:text-emerald-300 transition-colors"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <div className="text-xl font-mono font-bold text-emerald-300 tracking-widest break-all">
                {finalResult}
              </div>
            </motion.div>
          )}
        </div>


        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={runAnimation}
            disabled={isAnimating || !plaintext.trim() || !keyword.trim()}
            className="flex-1 py-3 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold flex items-center justify-center gap-2 hover:bg-emerald-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Play size={18} />
            {mode === 'encrypt' ? 'ENCRYPT' : 'DECRYPT'}
          </button>
          <button
            onClick={reset}
            className="px-4 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        {/* Quick Reference */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3">
            <div className="text-xs text-slate-500 mb-2">ADFGVX Letters</div>
            <div className="flex gap-2">
              {ADFGVX.map((letter) => (
                <div
                  key={letter}
                  className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-mono font-bold text-emerald-400"
                >
                  {letter}
                </div>
              ))}
            </div>
            <div className="mt-2 text-[10px] text-slate-600">
              Chosen for distinct Morse code sounds
            </div>
          </div>
          
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3">
            <div className="text-xs text-slate-500 mb-2">Current Settings</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Input Length:</span>
                <span className="text-slate-300 font-mono">{cleanText(plaintext).length} chars</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Key Length:</span>
                <span className="text-slate-300 font-mono">{keyword.length} chars</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Output Length:</span>
                <span className="text-slate-300 font-mono">{mode === 'encrypt' ? cleanText(plaintext).length * 2 : Math.floor(plaintext.length / 2)} chars</span>
              </div>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Space</kbd> Run
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">S</kbd> Shuffle Square
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
          About the ADFGVX Cipher
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            The <span className="text-emerald-300">ADFGVX cipher</span> was used by the German Army 
            during World War I, introduced in March 1918 for critical communications.
          </p>
          <p>
            <span className="text-emerald-300">How it works:</span>
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Create a 6×6 Polybius square with A-Z and 0-9 (36 characters)</li>
            <li>Replace each plaintext character with its row/column coordinates using only A, D, F, G, V, X</li>
            <li>Apply columnar transposition using a keyword to scramble the result</li>
          </ol>
          <p>
            <span className="text-emerald-300">Why ADFGVX?</span> These six letters were chosen because 
            they sound very different in Morse code, reducing transmission errors on the battlefield.
          </p>
          <p>
            <span className="text-amber-400">Historical note:</span> French cryptanalyst Georges Painvin 
            broke the cipher in June 1918, helping the Allies anticipate German offensives.
          </p>
        </div>
      </details>
    </div>
  );
}
