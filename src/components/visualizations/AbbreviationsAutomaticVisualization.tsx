import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scan, FileText, AlertTriangle, CheckCircle2, RefreshCw, Settings2 } from 'lucide-react';

const PRESETS = {
  days: "Sunday\nMonday\nTuesday\nWednesday\nThursday\nFriday\nSaturday",
  months: "January\nFebruary\nMarch\nApril\nMay\nJune\nJuly\nAugust\nSeptember\nOctober\nNovember\nDecember",
  planets: "Mercury\nVenus\nEarth\nMars\nJupiter\nSaturn\nUranus\nNeptune",
  colors: "Red\nGreen\nBlue\nYellow\nCyan\nMagenta\nBlack\nWhite\nGray\nOrange\nPurple\nPink"
};

export default function AbbreviationsAutomaticVisualization() {
  const [inputText, setInputText] = useState(PRESETS.days);
  const [length, setLength] = useState(3);
  const [activePreset, setActivePreset] = useState('days');

  // Parse words and filter empty lines
  const words = useMemo(() => {
    return inputText.split('\n').filter(w => w.trim().length > 0);
  }, [inputText]);

  // Calculate abbreviations and check for conflicts
  const results = useMemo(() => {
    const abbreviations = words.map(word => {
      const cleanWord = word.trim();
      const abbr = cleanWord.slice(0, length);
      return { word: cleanWord, abbr, originalIndex: -1 }; // index added later
    });

    // Count occurrences of each abbreviation
    const counts = new Map<string, number>();
    abbreviations.forEach(({ abbr }) => {
      counts.set(abbr.toLowerCase(), (counts.get(abbr.toLowerCase()) || 0) + 1);
    });

    return abbreviations.map((item, index) => ({
      ...item,
      originalIndex: index,
      isUnique: (counts.get(item.abbr.toLowerCase()) || 0) === 1,
      isValid: item.abbr.length === length && item.word.length >= length
    }));
  }, [words, length]);

  const uniqueCount = results.filter(r => r.isUnique && r.isValid).length;
  const totalCount = results.length;
  const successRate = totalCount > 0 ? (uniqueCount / totalCount) * 100 : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* Control Panel */}
      <div className="glass p-6 rounded-3xl border border-slate-700/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row gap-8">
          
          {/* Input Section */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <FileText size={18} className="text-emerald-400" />
                Source Data
              </h3>
              <div className="flex gap-2">
                {Object.keys(PRESETS).map(key => (
                  <button
                    key={key}
                    onClick={() => {
                      setInputText(PRESETS[key as keyof typeof PRESETS]);
                      setActivePreset(key);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      activePreset === key 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' 
                        : 'bg-slate-800/50 text-slate-500 border border-slate-700 hover:bg-slate-800 hover:text-slate-300'
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="relative group">
              <textarea
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  setActivePreset('custom');
                }}
                className="w-full h-48 bg-slate-950/50 rounded-xl border border-slate-700/50 p-4 font-mono text-sm text-slate-300 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 resize-none transition-all"
                placeholder="Enter words here, one per line..."
              />
              <div className="absolute bottom-4 right-4 text-xs text-slate-600 font-mono">
                {words.length} items
              </div>
            </div>
          </div>

          {/* Settings & Stats */}
          <div className="lg:w-80 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <Settings2 size={18} className="text-emerald-400" />
                Parameters
              </h3>
              
              <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700/50">
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Abbreviation Length</label>
                  <span className="text-emerald-400 font-mono font-bold">{length}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={length}
                  onChange={(e) => setLength(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between mt-2 text-[10px] text-slate-600 font-mono">
                  <span>1 char</span>
                  <span>10 chars</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <Scan size={18} className="text-emerald-400" />
                Analysis
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold text-white">{uniqueCount}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Unique</span>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex flex-col items-center justify-center text-center">
                  <span className={`text-2xl font-bold ${successRate === 100 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {Math.round(successRate)}%
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Efficiency</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Visualization */}
      <div className="glass p-8 rounded-3xl border border-slate-700/50 min-h-[300px] relative">
        
        {/* Scanner Line Effect */}
        <div 
          className="absolute top-8 bottom-8 w-0.5 bg-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.5)] z-20 transition-all duration-300 pointer-events-none hidden md:block"
          style={{ left: `calc(2rem + ${length}ch + 24px)` }} // Approximate positioning based on monospace font
        >
           <div className="absolute top-0 -translate-x-1/2 -translate-y-1/2 text-emerald-500 text-[10px] font-bold bg-slate-900 px-1 rounded border border-emerald-500/30">
             {length}
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode='popLayout'>
            {results.map((item, i) => (
              <motion.div
                key={`${item.word}-${i}`}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: i * 0.02 }}
                className={`relative group p-3 rounded-xl border transition-all ${
                  item.isUnique && item.isValid
                    ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10' 
                    : 'bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-mono text-lg tracking-wide">
                    <span className={item.isUnique && item.isValid ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {item.abbr}
                    </span>
                    <span className="text-slate-600">
                      {item.word.slice(item.abbr.length)}
                    </span>
                  </div>
                  
                  {item.isUnique && item.isValid ? (
                    <CheckCircle2 size={16} className="text-emerald-500/50" />
                  ) : (
                    <AlertTriangle size={16} className="text-rose-500/50" />
                  )}
                </div>
                
                {/* Tooltip for issues */}
                {!item.isValid && (
                  <div className="absolute -top-2 right-2 bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    Too Short
                  </div>
                )}
                {!item.isUnique && item.isValid && (
                  <div className="absolute -top-2 right-2 bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    Conflict
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {results.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <RefreshCw size={32} className="mx-auto mb-2 opacity-50" />
              <p>Enter some text to begin analysis</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
