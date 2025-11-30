import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Volume2, VolumeX, CheckCircle, XCircle, FileText, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Number to Words ---
const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

// --- Parse claimed counts from sentence ---
const parseClaimedCounts = (sentence: string): Map<string, number> => {
  const counts = new Map<string, number>();
  const lower = sentence.toLowerCase();
  
  // Match patterns like "two a's", "twenty-eight e's", "one z"
  const patterns = [
    /(\w+(?:-\w+)?)\s+([a-z])(?:'s|s)?/gi,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(lower)) !== null) {
      const numWord = match[1].toLowerCase();
      const letter = match[2].toLowerCase();
      
      // Convert word to number
      let num = 0;
      if (numWord.includes('-')) {
        const [tensWord, onesWord] = numWord.split('-');
        const tensIdx = tens.indexOf(tensWord);
        const onesIdx = ones.indexOf(onesWord);
        if (tensIdx > 0 && onesIdx > 0) num = tensIdx * 10 + onesIdx;
      } else {
        const idx = ones.indexOf(numWord);
        if (idx > 0) num = idx;
        const tensIdx = tens.indexOf(numWord);
        if (tensIdx > 0) num = tensIdx * 10;
      }
      
      if (num > 0) counts.set(letter, num);
    }
  }
  
  return counts;
};

// --- Count actual letters ---
const countActualLetters = (sentence: string): Map<string, number> => {
  const counts = new Map<string, number>();
  const lower = sentence.toLowerCase();
  
  for (const char of lower) {
    if (char >= 'a' && char <= 'z') {
      counts.set(char, (counts.get(char) || 0) + 1);
    }
  }
  
  return counts;
};

// --- Check if autogram ---
interface CheckResult {
  isAutogram: boolean;
  claimed: Map<string, number>;
  actual: Map<string, number>;
  matches: string[];
  mismatches: { letter: string; claimed: number; actual: number }[];
}

const checkAutogram = (sentence: string): CheckResult => {
  const claimed = parseClaimedCounts(sentence);
  const actual = countActualLetters(sentence);
  
  const matches: string[] = [];
  const mismatches: { letter: string; claimed: number; actual: number }[] = [];
  
  // Check all claimed letters
  for (const [letter, claimedCount] of claimed) {
    const actualCount = actual.get(letter) || 0;
    if (claimedCount === actualCount) {
      matches.push(letter);
    } else {
      mismatches.push({ letter, claimed: claimedCount, actual: actualCount });
    }
  }
  
  return {
    isAutogram: mismatches.length === 0 && matches.length > 0,
    claimed,
    actual,
    matches,
    mismatches,
  };
};

// --- Preset sentences ---
const PRESETS = [
  {
    name: 'Sentence 1 (Valid)',
    sentence: "This sentence employs two a's, two c's, two d's, twenty-eight e's, five f's, three g's, eight h's, eleven i's, three l's, two m's, thirteen n's, nine o's, two p's, five r's, twenty-five s's, twenty-three t's, six v's, ten w's, two x's, five y's, and one z.",
  },
  {
    name: 'Sentence 2',
    sentence: "This sentence employs two a's, two c's, two d's, twenty eight e's, five f's, three g's, eight h's, eleven i's, three l's, two m's, thirteen n's, nine o's, two p's, five r's, twenty five s's, twenty three t's, six v's, ten w's, two x's, five y's, and one z.",
  },
  {
    name: 'Simple Test',
    sentence: "This has three a's, two h's, two i's, one s, and two t's.",
  },
];

export default function AutogramCheckerVisualization() {
  const [sentence, setSentence] = useState(PRESETS[0].sentence);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [checkProgress, setCheckProgress] = useState(0);
  const [highlightedLetter, setHighlightedLetter] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showAllLetters, setShowAllLetters] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const checkIntervalRef = useRef<number>(0);


  // --- Audio ---
  const playSound = useCallback((type: 'check' | 'match' | 'mismatch' | 'complete' | 'click') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'check') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300 + checkProgress * 10, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'match') {
      [523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0.05, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1 + i * 0.05);
        osc.start(now + i * 0.05);
        osc.stop(now + 0.15 + i * 0.05);
      });
    } else if (type === 'mismatch') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'complete') {
      const isSuccess = result?.isAutogram;
      const freqs = isSuccess ? [523, 659, 784, 1047] : [400, 300, 200];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = isSuccess ? 'sine' : 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.08, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3 + i * 0.1);
        osc.start(now + i * 0.1);
        osc.stop(now + 0.4 + i * 0.1);
      });
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.start(now);
      osc.stop(now + 0.03);
    }
  }, [soundEnabled, checkProgress, result]);

  // --- Check Logic ---
  const startCheck = useCallback(() => {
    setIsChecking(true);
    setResult(null);
    setCheckProgress(0);
    setHighlightedLetter(null);

    const finalResult = checkAutogram(sentence);
    const allLetters = Array.from(new Set([...finalResult.claimed.keys(), ...finalResult.actual.keys()])).sort();
    
    let idx = 0;
    checkIntervalRef.current = window.setInterval(() => {
      if (idx < allLetters.length) {
        setCheckProgress(idx + 1);
        setHighlightedLetter(allLetters[idx]);
        playSound('check');
        idx++;
      } else {
        clearInterval(checkIntervalRef.current);
        setIsChecking(false);
        setResult(finalResult);
        setHighlightedLetter(null);
        setTimeout(() => playSound('complete'), 100);
      }
    }, 80);
  }, [sentence, playSound]);

  const reset = () => {
    clearInterval(checkIntervalRef.current);
    setIsChecking(false);
    setResult(null);
    setCheckProgress(0);
    setHighlightedLetter(null);
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setSentence(preset.sentence);
    reset();
    playSound('click');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!isChecking) startCheck(); }
      if (e.key === 'r' || e.key === 'R') reset();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [startCheck, isChecking]);

  useEffect(() => {
    return () => clearInterval(checkIntervalRef.current);
  }, []);

  // Get all letters for display
  const allLetters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const actualCounts = result?.actual || countActualLetters(sentence);
  const claimedCounts = result?.claimed || parseClaimedCounts(sentence);


  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-indigo-950/10 to-slate-950 rounded-xl border border-indigo-900/40 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border-b border-indigo-500/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/50">
                <FileText className="text-indigo-400" size={24} />
              </div>
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-400 rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-indigo-300 tracking-wider">SELF-PORTRAIT STUDIO</h2>
              <p className="text-xs text-indigo-500/70">Autogram Verification System</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled 
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' 
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
        
        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-slate-500">Examples:</span>
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(preset)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                sentence === preset.sentence
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-indigo-500/30'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* Sentence Input */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
          <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700/50 flex items-center justify-between">
            <span className="text-xs text-indigo-400 font-mono">SENTENCE INPUT</span>
            <span className="text-xs text-slate-500">{sentence.length} chars</span>
          </div>
          <textarea
            value={sentence}
            onChange={(e) => { setSentence(e.target.value); reset(); }}
            className="w-full h-32 p-4 bg-transparent text-slate-300 text-sm leading-relaxed focus:outline-none resize-none custom-scrollbar"
            placeholder="Enter a sentence to check..."
          />
        </div>

        {/* Check Button */}
        <div className="flex justify-center">
          <button
            onClick={startCheck}
            disabled={isChecking || !sentence.trim()}
            className={`px-8 py-3 rounded-xl font-bold flex items-center gap-3 transition-all ${
              isChecking
                ? 'bg-indigo-500/10 text-indigo-400/50 border border-indigo-500/30 cursor-wait'
                : 'bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 text-indigo-300 border border-indigo-500/50 hover:from-indigo-500/30 hover:to-cyan-500/30'
            }`}
          >
            {isChecking ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <Sparkles size={20} />
                </motion.div>
                ANALYZING...
              </>
            ) : (
              <>
                <Play size={20} />
                VERIFY AUTOGRAM
              </>
            )}
          </button>
        </div>

        {/* Letter Frequency Visualization */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-indigo-400 flex items-center gap-2">
              <Sparkles size={14} />
              Character Portrait
            </span>
            <label className="flex items-center gap-2 text-xs text-slate-500">
              <input
                type="checkbox"
                checked={showAllLetters}
                onChange={(e) => setShowAllLetters(e.target.checked)}
                className="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
              />
              Show all letters
            </label>
          </div>

          {/* Letter bars */}
          <div className="grid grid-cols-13 gap-1">
            {allLetters.map(letter => {
              const actual = actualCounts.get(letter) || 0;
              const claimed = claimedCounts.get(letter) || 0;
              const isHighlighted = letter === highlightedLetter;
              const hasData = actual > 0 || claimed > 0;
              
              if (!showAllLetters && !hasData) return null;
              
              const isMatch = result && claimed > 0 && claimed === actual;
              const isMismatch = result && claimed > 0 && claimed !== actual;
              
              return (
                <motion.div
                  key={letter}
                  className={`relative flex flex-col items-center p-1 rounded transition-all ${
                    isHighlighted ? 'bg-indigo-500/30 ring-2 ring-indigo-400' :
                    isMatch ? 'bg-emerald-500/20' :
                    isMismatch ? 'bg-red-500/20' :
                    hasData ? 'bg-slate-800/50' : 'bg-slate-900/30'
                  }`}
                  animate={isHighlighted ? { scale: 1.1 } : { scale: 1 }}
                >
                  {/* Bar */}
                  <div className="w-full h-16 bg-slate-900/50 rounded relative overflow-hidden flex flex-col-reverse">
                    {/* Actual count bar */}
                    <motion.div
                      className={`w-full ${
                        isMatch ? 'bg-emerald-500/50' :
                        isMismatch ? 'bg-red-500/50' :
                        'bg-indigo-500/50'
                      }`}
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.min(actual * 3, 100)}%` }}
                      transition={{ duration: 0.3 }}
                    />
                    {/* Claimed line */}
                    {claimed > 0 && (
                      <div
                        className="absolute w-full h-0.5 bg-amber-400"
                        style={{ bottom: `${Math.min(claimed * 3, 100)}%` }}
                      />
                    )}
                  </div>
                  
                  {/* Letter */}
                  <div className={`text-xs font-mono font-bold mt-1 ${
                    isMatch ? 'text-emerald-400' :
                    isMismatch ? 'text-red-400' :
                    hasData ? 'text-indigo-300' : 'text-slate-600'
                  }`}>
                    {letter.toUpperCase()}
                  </div>
                  
                  {/* Count */}
                  <div className="text-[9px] text-slate-500 font-mono">
                    {actual > 0 ? actual : '·'}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-indigo-500/50 rounded" /> Actual count
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-amber-400" /> Claimed count
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-emerald-500/50 rounded" /> Match
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-red-500/50 rounded" /> Mismatch
            </span>
          </div>
        </div>


        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`rounded-xl border p-6 ${
                result.isAutogram
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  {result.isAutogram ? (
                    <CheckCircle size={48} className="text-emerald-400" />
                  ) : (
                    <XCircle size={48} className="text-red-400" />
                  )}
                </motion.div>
                <div>
                  <div className={`text-2xl font-bold ${
                    result.isAutogram ? 'text-emerald-300' : 'text-red-300'
                  }`}>
                    {result.isAutogram ? 'VALID AUTOGRAM!' : 'NOT AN AUTOGRAM'}
                  </div>
                  <div className="text-sm text-slate-400">
                    {result.matches.length} matches, {result.mismatches.length} mismatches
                  </div>
                </div>
              </div>

              {/* Mismatches detail */}
              {result.mismatches.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs text-red-400 mb-2">Mismatches:</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {result.mismatches.map(({ letter, claimed, actual }) => (
                      <div
                        key={letter}
                        className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-center"
                      >
                        <div className="text-lg font-bold text-red-300 font-mono">{letter.toUpperCase()}</div>
                        <div className="text-xs text-slate-400">
                          claimed: <span className="text-amber-400">{claimed}</span>
                        </div>
                        <div className="text-xs text-slate-400">
                          actual: <span className="text-red-400">{actual}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matches */}
              {result.matches.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs text-emerald-400 mb-2">Verified matches:</div>
                  <div className="flex flex-wrap gap-1">
                    {result.matches.map(letter => (
                      <motion.span
                        key={letter}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded text-xs font-mono text-emerald-300"
                      >
                        {letter.toUpperCase()}: {result.actual.get(letter)}
                      </motion.span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Unique Letters</div>
            <div className="text-2xl font-bold text-indigo-400">{actualCounts.size}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Claimed Counts</div>
            <div className="text-2xl font-bold text-amber-400">{claimedCounts.size}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Total Letters</div>
            <div className="text-2xl font-bold text-cyan-400">
              {Array.from(actualCounts.values()).reduce((a, b) => a + b, 0)}
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Space</kbd> Verify
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
          What is an Autogram?
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            An <span className="text-indigo-300">autogram</span> is a self-describing sentence that 
            inventories its own characters using cardinal number names.
          </p>
          <p>
            For example: "This sentence has <span className="text-amber-300">five a's</span>" would be 
            valid only if the letter 'a' appears exactly 5 times in the entire sentence.
          </p>
          <p>
            The visualization shows <span className="text-indigo-300">actual counts</span> as bars and 
            <span className="text-amber-300"> claimed counts</span> as horizontal lines. When they match, 
            the bar turns <span className="text-emerald-300">green</span>.
          </p>
        </div>
      </details>
    </div>
  );
}
