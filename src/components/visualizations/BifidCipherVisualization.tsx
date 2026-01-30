import { useState, useRef, useCallback, useEffect } from 'react';
import { Lock, Unlock, Eye, RotateCcw, Volume2, VolumeX, Terminal, Shield, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Default Polybius Square (standard A-Z, I/J combined)
const DEFAULT_POLYBIUS = [
  ['A', 'B', 'C', 'D', 'E'],
  ['F', 'G', 'H', 'I', 'J'],
  ['L', 'M', 'N', 'O', 'P'],
  ['Q', 'R', 'S', 'T', 'U'],
  ['V', 'W', 'X', 'Y', 'Z'],
];

// Alternative Polybius Square (keyword-based)
const generateKeywordSquare = (keyword: string): string[][] => {
  const cleanKeyword = keyword.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
  const seen = new Set<string>();
  const alphabet = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'; // No J
  const used = cleanKeyword + alphabet;
  const ordered: string[] = [];
  
  for (const char of used) {
    if (!seen.has(char)) {
      seen.add(char);
      ordered.push(char);
    }
  }
  
  const square: string[][] = [];
  for (let i = 0; i < 5; i++) {
    square.push(ordered.slice(i * 5, i * 5 + 5));
  }
  return square;
};

// Find coordinates of a letter in the square
const findCoordinates = (square: string[][], letter: string): [number, number] | null => {
  const normalizedLetter = letter.toUpperCase() === 'J' ? 'I' : letter.toUpperCase();
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const cell = square[row][col];
      if (cell === normalizedLetter || (cell.includes(normalizedLetter))) {
        return [row + 1, col + 1]; // 1-indexed
      }
    }
  }
  return null;
};

// Get letter from coordinates
const getLetterFromCoords = (square: string[][], row: number, col: number): string => {
  if (row < 1 || row > 5 || col < 1 || col > 5) return '?';
  return square[row - 1][col - 1];
};

// Encrypt using Bifid cipher
const encryptBifid = (message: string, square: string[][]): { encrypted: string; steps: EncryptionStep[] } => {
  const cleanMsg = message.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
  if (!cleanMsg) return { encrypted: '', steps: [] };
  
  const steps: EncryptionStep[] = [];
  
  // Step 1: Get coordinates for each letter
  const coords: Array<{ letter: string; row: number; col: number }> = [];
  for (const letter of cleanMsg) {
    const coord = findCoordinates(square, letter);
    if (coord) {
      coords.push({ letter, row: coord[0], col: coord[1] });
    }
  }
  
  steps.push({
    type: 'coordinates',
    message: cleanMsg,
    coords,
    description: 'Convert each letter to Polybius square coordinates',
  });
  
  // Step 2: Extract rows and columns
  const rows = coords.map(c => c.row);
  const cols = coords.map(c => c.col);
  
  // Step 3: Combine into single sequence
  const combined = [...rows, ...cols];
  
  steps.push({
    type: 'combine',
    rows,
    cols,
    combined,
    description: 'Write rows and columns in a single sequence',
  });
  
  // Step 4: Split into pairs and encrypt
  const encrypted: string[] = [];
  const pairs: Array<{ pair: [number, number]; letter: string }> = [];
  
  for (let i = 0; i < combined.length; i += 2) {
    if (i + 1 < combined.length) {
      const row = combined[i];
      const col = combined[i + 1];
      const letter = getLetterFromCoords(square, row, col);
      pairs.push({ pair: [row, col], letter });
      encrypted.push(letter);
    }
  }
  
  steps.push({
    type: 'encrypt',
    pairs,
    encrypted: encrypted.join(''),
    description: 'Split into pairs and lookup in square',
  });
  
  return { encrypted: encrypted.join(''), steps };
};

// Decrypt using Bifid cipher
const decryptBifid = (encrypted: string, square: string[][]): { decrypted: string; steps: EncryptionStep[] } => {
  const cleanEnc = encrypted.toUpperCase().replace(/[^A-Z]/g, '');
  if (!cleanEnc) return { decrypted: '', steps: [] };
  
  const steps: EncryptionStep[] = [];
  
  // Step 1: Get coordinates of encrypted letters
  const encCoords: Array<{ letter: string; row: number; col: number }> = [];
  for (const letter of cleanEnc) {
    const coord = findCoordinates(square, letter);
    if (coord) {
      encCoords.push({ letter, row: coord[0], col: coord[1] });
    }
  }
  
  steps.push({
    type: 'coordinates',
    message: cleanEnc,
    coords: encCoords,
    description: 'Get coordinates of encrypted letters',
  });
  
  // Step 2: Split into rows and cols
  const allCoords = encCoords.flatMap(c => [c.row, c.col]);
  const mid = Math.floor(allCoords.length / 2);
  const rows = allCoords.slice(0, mid);
  const cols = allCoords.slice(mid);
  
  steps.push({
    type: 'split',
    combined: allCoords,
    rows,
    cols,
    description: 'Split sequence into row and column coordinates',
  });
  
  // Step 3: Reconstruct original coordinates and decrypt
  const decrypted: string[] = [];
  const pairs: Array<{ row: number; col: number; letter: string }> = [];
  
  for (let i = 0; i < rows.length; i++) {
    if (i < cols.length) {
      const letter = getLetterFromCoords(square, rows[i], cols[i]);
      pairs.push({ row: rows[i], col: cols[i], letter });
      decrypted.push(letter);
    }
  }
  
  steps.push({
    type: 'decrypt',
    pairs,
    decrypted: decrypted.join(''),
    description: 'Reconstruct original letters',
  });
  
  return { decrypted: decrypted.join(''), steps };
};

interface EncryptionStep {
  type: string;
  description: string;
  message?: string;
  coords?: Array<{ letter: string; row: number; col: number }>;
  rows?: number[];
  cols?: number[];
  combined?: number[];
  pairs?: Array<{ pair?: [number, number]; letter: string; row?: number; col?: number }>;
  encrypted?: string;
  decrypted?: string;
}

const TEST_MESSAGES = [
  { label: 'ATTACK', value: 'ATTACKATDAWN' },
  { label: 'SECRET', value: 'SECRETMESSAGE' },
  { label: 'HELLO', value: 'HELLOWORLD' },
  { label: 'FELIX', value: 'FELIXDELASTELLE' },
  { label: 'SPY', value: 'SPYMISSION' },
];

export default function BifidCipherVisualization() {
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [input, setInput] = useState('ATTACKATDAWN');
  const [keyword, setKeyword] = useState('');
  const [square, setSquare] = useState(DEFAULT_POLYBIUS);
  const [result, setResult] = useState('');
  const [steps, setSteps] = useState<EncryptionStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showCoords] = useState(true);
  const [history, setHistory] = useState<Array<{ mode: string; input: string; output: string; keyword?: string }>>([]);

  const audioContextRef = useRef<AudioContext | null>(null);

  // Update square when keyword changes
  useEffect(() => {
    if (keyword.trim()) {
      setSquare(generateKeywordSquare(keyword));
    } else {
      setSquare(DEFAULT_POLYBIUS);
    }
  }, [keyword]);

  // Sound effects
  const playSound = useCallback((type: 'key' | 'beep' | 'success' | 'click' | 'tick') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'key') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'beep') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'success') {
      [523, 659, 784].forEach((freq, i) => {
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
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.start(now);
      osc.stop(now + 0.03);
    }
  }, [soundEnabled]);

  const processMessage = async () => {
    if (!input.trim() || isAnimating) return;
    
    setIsAnimating(true);
    setCurrentStep(0);
    playSound('beep');

    let currentSteps: EncryptionStep[] = [];
    
    if (mode === 'encrypt') {
      const result = encryptBifid(input, square);
      setResult(result.encrypted);
      setSteps(result.steps);
      currentSteps = result.steps;
      setHistory(prev => [{ mode: 'encrypt', input, output: result.encrypted, keyword: keyword || 'default' }, ...prev].slice(0, 5));
    } else {
      const result = decryptBifid(input, square);
      setResult(result.decrypted);
      setSteps(result.steps);
      currentSteps = result.steps;
      setHistory(prev => [{ mode: 'decrypt', input, output: result.decrypted, keyword: keyword || 'default' }, ...prev].slice(0, 5));
    }

    // Animate through steps
    for (let i = 0; i < currentSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setCurrentStep(i + 1);
      playSound('tick');
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    playSound('success');
    setIsAnimating(false);
  };

  const reset = () => {
    setResult('');
    setSteps([]);
    setCurrentStep(0);
    playSound('click');
  };

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-blue-950/10 to-slate-950 rounded-xl border border-blue-900/30 font-sans overflow-hidden">
      
      {/* Header - Spy Theme */}
      <div className="bg-slate-900/80 border-b border-blue-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/15 border border-blue-500/40 relative">
              <Shield className="text-blue-400" size={24} />
              <motion.div
                className="absolute -top-1 -right-1"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-2 h-2 bg-red-500 rounded-full" />
              </motion.div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-blue-300 tracking-wide font-mono">BIFID CIPHER</h2>
              <p className="text-xs text-blue-500/70">CLASSIFIED • TOP SECRET • 100TH VISUALIZATION</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-full">
              <span className="text-xs text-red-300 font-mono">MISSION #100</span>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled 
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' 
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
        
        {/* Mode Selection */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => { setMode('encrypt'); playSound('click'); }}
              className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                mode === 'encrypt'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              <Lock size={18} />
              ENCRYPT
            </button>
            <button
              onClick={() => { setMode('decrypt'); playSound('click'); }}
              className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                mode === 'decrypt'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              <Unlock size={18} />
              DECRYPT
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-2 font-mono">
                {mode === 'encrypt' ? 'PLAINTEXT' : 'CIPHERTEXT'}
              </label>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value.toUpperCase())}
                maxLength={20}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-blue-500/50 transition-colors uppercase"
                placeholder={mode === 'encrypt' ? 'Enter message...' : 'Enter encrypted text...'}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-2 font-mono">KEYWORD (Optional)</label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value.toUpperCase())}
                maxLength={15}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-blue-500/50 transition-colors uppercase"
                placeholder="Custom Polybius square..."
              />
            </div>
          </div>

          {/* Test Messages */}
          <div className="mt-4">
            <label className="block text-xs text-slate-400 mb-2 font-mono">QUICK SELECT</label>
            <div className="flex flex-wrap gap-2">
              {TEST_MESSAGES.map((tm) => (
                <button
                  key={tm.label}
                  onClick={() => { setInput(tm.value); playSound('click'); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all font-mono ${
                    input === tm.value
                      ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                      : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-blue-500/30'
                  }`}
                >
                  {tm.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Polybius Square */}
        <div className="bg-slate-900/30 rounded-xl border border-blue-800/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-blue-400 font-mono flex items-center gap-2">
              <Terminal size={14} />
              POLYBIUS SQUARE {keyword ? `(KEYWORD: ${keyword})` : '(STANDARD)'}
            </div>
          </div>

          <div className="flex justify-center">
            <div className="grid grid-cols-6 gap-1">
              {/* Header row */}
              <div className="w-10 h-10" />
              {[1, 2, 3, 4, 5].map(n => (
                <div key={`col-${n}`} className="w-10 h-10 flex items-center justify-center text-xs text-slate-500 font-mono">
                  {n}
                </div>
              ))}
              
              {/* Square rows */}
              {square.map((row, rowIdx) => (
                <div key={`row-${rowIdx}`} className="contents">
                  <div className="w-10 h-10 flex items-center justify-center text-xs text-slate-500 font-mono">
                    {rowIdx + 1}
                  </div>
                  {row.map((cell, colIdx) => (
                    <motion.div
                      key={`cell-${rowIdx}-${colIdx}`}
                      className="w-10 h-10 flex items-center justify-center rounded bg-slate-800 border border-slate-700 text-sm font-mono text-blue-300"
                      whileHover={{ scale: 1.1, borderColor: 'rgba(59, 130, 246, 0.5)' }}
                      transition={{ duration: 0.2 }}
                    >
                      {cell}
                    </motion.div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Process Button */}
        <div className="flex gap-3">
          <button
            onClick={processMessage}
            disabled={isAnimating || !input.trim()}
            className="flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all bg-blue-500/20 text-blue-300 border border-blue-500/50 hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap size={18} />
            {isAnimating ? 'PROCESSING...' : mode === 'encrypt' ? 'ENCRYPT' : 'DECRYPT'}
          </button>
          <button
            onClick={reset}
            className="px-4 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-blue-900/20 rounded-xl border border-blue-500/50 p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-blue-400 font-mono">
                  {mode === 'encrypt' ? 'ENCRYPTED MESSAGE' : 'DECRYPTED MESSAGE'}
                </span>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-2 py-1 bg-blue-500/30 rounded text-xs text-blue-300 font-mono"
                >
                  {mode === 'encrypt' ? 'CLASSIFIED' : 'REVEALED'}
                </motion.div>
              </div>
              <div className="text-2xl font-bold text-blue-300 font-mono tracking-wider">
                {result}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Steps Visualization */}
        <AnimatePresence>
          {steps.length > 0 && showCoords && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-slate-900/30 rounded-xl border border-slate-800 overflow-hidden"
            >
              <div className="p-4 space-y-4">
                {steps.map((step, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: currentStep > idx ? 1 : 0.3, x: 0 }}
                    className={`p-4 rounded-lg border ${currentStep > idx ? 'bg-slate-800/50 border-blue-500/30' : 'bg-slate-800/20 border-slate-700/30'}`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center font-mono">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-slate-300">{step.description}</span>
                    </div>

                    {step.type === 'coordinates' && step.coords && (
                      <div className="font-mono text-sm">
                        <div className="grid grid-cols-5 gap-1 mb-2">
                          {step.coords.map((c, i) => (
                            <div key={i} className="text-center p-1 bg-slate-800 rounded text-blue-300">
                              {c.letter}
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-5 gap-1">
                          {step.coords.map((c, i) => (
                            <div key={i} className="text-center p-1 bg-blue-900/30 rounded text-blue-400 text-xs">
                              {c.row},{c.col}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {step.type === 'combine' && step.combined && (
                      <div className="font-mono text-sm flex flex-wrap gap-1">
                        {step.combined.map((n, i) => (
                          <motion.div
                            key={i}
                            initial={{ scale: 0 }}
                            animate={{ scale: currentStep > idx ? 1 : 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="w-8 h-8 flex items-center justify-center bg-blue-900/30 rounded text-blue-300"
                          >
                            {n}
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {step.type === 'encrypt' && step.pairs && (
                      <div className="font-mono text-sm">
                        <div className="grid grid-cols-6 gap-1 mb-2">
                          {step.pairs.map((p, i) => (
                            <div key={i} className="text-center p-1 bg-blue-900/30 rounded text-blue-400 text-xs">
                              {p.pair?.join(',')}
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-1">
                          {step.pairs.map((p, i) => (
                            <motion.div
                              key={i}
                              initial={{ scale: 0 }}
                              animate={{ scale: currentStep > idx ? 1 : 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="flex-1 text-center p-2 bg-blue-500/20 rounded text-blue-300 font-bold"
                            >
                              {p.letter}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1 font-mono">INPUT LENGTH</div>
            <div className="text-xl font-bold text-blue-400 font-mono">{input.length}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1 font-mono">OUTPUT LENGTH</div>
            <div className="text-xl font-bold text-emerald-400 font-mono">{result.length}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1 font-mono">STEPS</div>
            <div className="text-xl font-bold text-amber-400 font-mono">{currentStep}/{steps.length}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1 font-mono">STATUS</div>
            <div className={`text-xl font-bold font-mono ${isAnimating ? 'text-amber-400' : result ? 'text-emerald-400' : 'text-slate-400'}`}>
              {isAnimating ? 'WORKING' : result ? 'DONE' : 'READY'}
            </div>
          </div>
        </div>

        {/* History */}
        <AnimatePresence>
          {history.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-slate-900/30 rounded-xl border border-slate-800 overflow-hidden"
            >
              <div className="p-4">
                <h3 className="text-sm font-semibold text-blue-300 mb-3 font-mono">MISSION LOG</h3>
                <div className="space-y-2">
                  {history.map((h, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded ${h.mode === 'encrypt' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                          {h.mode.toUpperCase()}
                        </span>
                        <span className="text-slate-400">{h.input}</span>
                        <span className="text-slate-600">→</span>
                        <span className="text-blue-300">{h.output}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <h3 className="text-sm font-semibold text-blue-300 mb-3 font-mono flex items-center gap-2">
            <Eye size={16} />
            ABOUT BIFID CIPHER
          </h3>
          <div className="space-y-2 text-xs text-slate-400">
            <p>
              Invented by <span className="text-blue-300">Félix Delastelle</span> around 1901, the Bifid cipher 
              combines the Polybius square with transposition and fractionation.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><span className="text-blue-300">Polybius Square</span>: 5×5 grid mapping letters to coordinates</li>
              <li><span className="text-blue-300">Fractionation</span>: Each letter split into row/column</li>
              <li><span className="text-blue-300">Transposition</span>: Rows and columns rearranged</li>
              <li><span className="text-blue-300">Diffusion</span>: Each output depends on two inputs</li>
            </ul>
            <p className="mt-2 text-slate-500">
              The cipher is more secure than simple substitution because it breaks letter frequency patterns.
            </p>
          </div>
        </div>

        {/* 100th Celebration Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-xl border border-purple-500/50 p-4 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">🎉</span>
            <span className="text-lg font-bold text-purple-300 font-mono">MILESTONE ACHIEVED</span>
            <span className="text-2xl">🎉</span>
          </div>
          <p className="text-sm text-slate-400">
            This is the <span className="text-purple-300 font-bold">100th visualization</span> in the Rosetta Code Hub collection!
          </p>
        </motion.div>
      </div>
    </div>
  );
}
