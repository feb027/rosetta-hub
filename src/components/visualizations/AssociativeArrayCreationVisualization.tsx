import { useState, useRef, useCallback, useEffect } from 'react';
import { RotateCcw, Volume2, VolumeX, Plus, Trash2, Search, Key, Lock, Unlock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface KeyValuePair {
  key: string;
  value: string;
  id: number;
  isNew?: boolean;
}

const PRESETS = [
  { name: 'Colors', pairs: [{ key: 'red', value: '#FF0000' }, { key: 'green', value: '#00FF00' }, { key: 'blue', value: '#0000FF' }] },
  { name: 'Fruits', pairs: [{ key: 'apple', value: '🍎' }, { key: 'banana', value: '🍌' }, { key: 'orange', value: '🍊' }] },
  { name: 'Capitals', pairs: [{ key: 'USA', value: 'Washington' }, { key: 'UK', value: 'London' }, { key: 'Japan', value: 'Tokyo' }] },
  { name: 'Empty', pairs: [] },
];

export default function AssociativeArrayCreationVisualization() {
  const [pairs, setPairs] = useState<KeyValuePair[]>([
    { key: 'name', value: 'Alice', id: 0 },
    { key: 'age', value: '30', id: 1 },
    { key: 'city', value: 'NYC', id: 2 },
  ]);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [searchKey, setSearchKey] = useState('');
  const [searchResult, setSearchResult] = useState<{ found: boolean; value?: string } | null>(null);
  const [highlightKey, setHighlightKey] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [idCounter, setIdCounter] = useState(3);
  const [log, setLog] = useState<string[]>(['// Map created']);

  const audioContextRef = useRef<AudioContext | null>(null);


  // --- Audio ---
  const playSound = useCallback((type: 'add' | 'delete' | 'search' | 'found' | 'notfound' | 'click' | 'unlock') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'add') {
      [440, 554, 659].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.08, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25 + i * 0.08);
        osc.start(now + i * 0.08);
        osc.stop(now + 0.3 + i * 0.08);
      });
    } else if (type === 'delete') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'search') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.setValueAtTime(800, now + 0.1);
      osc.frequency.setValueAtTime(600, now + 0.2);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'found' || type === 'unlock') {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.1, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3 + i * 0.08);
        osc.start(now + i * 0.08);
        osc.stop(now + 0.35 + i * 0.08);
      });
    } else if (type === 'notfound') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  }, [soundEnabled]);

  const addLog = (message: string) => {
    setLog(prev => [...prev.slice(-7), message]);
  };


  // --- Operations ---
  const addPair = useCallback(() => {
    if (!newKey.trim()) return;
    
    // Check if key exists (update) or new
    const existingIndex = pairs.findIndex(p => p.key === newKey.trim());
    
    if (existingIndex >= 0) {
      // Update existing
      setPairs(prev => prev.map((p, i) => 
        i === existingIndex ? { ...p, value: newValue, isNew: true } : p
      ));
      addLog(`map["${newKey}"] = "${newValue}" // updated`);
    } else {
      // Add new
      if (pairs.length >= 8) {
        addLog('// Error: Max 8 pairs allowed');
        return;
      }
      setPairs(prev => [...prev, { key: newKey.trim(), value: newValue, id: idCounter, isNew: true }]);
      setIdCounter(prev => prev + 1);
      addLog(`map["${newKey}"] = "${newValue}"`);
    }
    
    setHighlightKey(newKey.trim());
    playSound('add');
    setNewKey('');
    setNewValue('');
    
    setTimeout(() => {
      setHighlightKey(null);
      setPairs(prev => prev.map(p => ({ ...p, isNew: false })));
    }, 1000);
  }, [newKey, newValue, pairs, idCounter, playSound]);

  const deletePair = useCallback((key: string) => {
    setPairs(prev => prev.filter(p => p.key !== key));
    playSound('delete');
    addLog(`delete map["${key}"]`);
    if (searchResult && searchKey === key) {
      setSearchResult(null);
    }
  }, [playSound, searchResult, searchKey]);

  const searchForKey = useCallback(() => {
    if (!searchKey.trim()) return;
    
    setIsSearching(true);
    setSearchResult(null);
    setHighlightKey(null);
    playSound('search');
    
    // Animate through keys
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < pairs.length) {
        setHighlightKey(pairs[idx].key);
        idx++;
      } else {
        clearInterval(interval);
        
        const found = pairs.find(p => p.key === searchKey.trim());
        if (found) {
          setSearchResult({ found: true, value: found.value });
          setHighlightKey(found.key);
          playSound('found');
          addLog(`map["${searchKey}"] → "${found.value}"`);
        } else {
          setSearchResult({ found: false });
          setHighlightKey(null);
          playSound('notfound');
          addLog(`map["${searchKey}"] → undefined`);
        }
        setIsSearching(false);
      }
    }, 200);
  }, [searchKey, pairs, playSound]);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setPairs(preset.pairs.map((p, i) => ({ ...p, id: i })));
    setIdCounter(preset.pairs.length);
    setSearchResult(null);
    setHighlightKey(null);
    playSound('click');
    addLog(`// Loaded "${preset.name}" preset`);
  };

  const reset = () => {
    setPairs([]);
    setIdCounter(0);
    setSearchResult(null);
    setHighlightKey(null);
    setNewKey('');
    setNewValue('');
    setSearchKey('');
    setLog(['// Map cleared']);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'r' || e.key === 'R') reset();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);


  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-indigo-950/10 to-slate-950 rounded-xl border border-indigo-900/40 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-indigo-800/40 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/15 border border-indigo-500/40">
              <Key className="text-indigo-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-indigo-300 tracking-wide">KEY-VALUE VAULT</h2>
              <p className="text-xs text-indigo-500/70">Associative Array Creator</p>
            </div>
          </div>

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

      {/* Main Content */}
      <div className="p-6 space-y-6">
        
        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-slate-500 self-center">Presets:</span>
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(preset)}
              className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-xs text-slate-400 hover:text-indigo-300 hover:border-indigo-500/50 transition-all"
            >
              {preset.name}
            </button>
          ))}
          <button
            onClick={reset}
            className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-xs text-slate-400 hover:text-rose-300 hover:border-rose-500/50 transition-all flex items-center gap-1"
          >
            <RotateCcw size={12} />
            Clear
          </button>
        </div>

        {/* Vault Visualization */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-6 relative overflow-hidden">
          {/* Vault door pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 20px 20px, rgba(99,102,241,0.3) 2px, transparent 2px)`,
              backgroundSize: '40px 40px',
            }} />
          </div>

          {/* Header */}
          <div className="relative flex items-center justify-between mb-4 pb-3 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <Lock size={16} className="text-indigo-400" />
              <span className="text-sm font-mono text-slate-400">
                Map&lt;string, string&gt;
              </span>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              {pairs.length} entries
            </div>
          </div>

          {/* Key-Value Pairs Grid */}
          <div className="relative min-h-[180px]">
            {pairs.length === 0 ? (
              <div className="flex items-center justify-center h-44 text-slate-500">
                <div className="text-center">
                  <Key size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Empty map</p>
                  <p className="text-xs text-slate-600 mt-1">Add key-value pairs below</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AnimatePresence mode="popLayout">
                  {pairs.map((pair) => (
                    <motion.div
                      key={pair.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: 1, 
                        opacity: 1,
                        boxShadow: highlightKey === pair.key 
                          ? '0 0 20px rgba(99,102,241,0.5)' 
                          : '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                      exit={{ scale: 0, opacity: 0, x: 50 }}
                      layout
                      className={`relative group flex rounded-lg border-2 overflow-hidden transition-colors ${
                        highlightKey === pair.key
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : pair.isNew
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-700 bg-slate-800/50'
                      }`}
                    >
                      {/* Key section */}
                      <div className={`flex-shrink-0 w-28 px-3 py-3 border-r flex items-center gap-2 ${
                        highlightKey === pair.key ? 'border-indigo-500/50 bg-indigo-500/20' : 'border-slate-700 bg-slate-800/80'
                      }`}>
                        <Key size={14} className={highlightKey === pair.key ? 'text-indigo-400' : 'text-slate-500'} />
                        <span className={`font-mono text-sm truncate ${
                          highlightKey === pair.key ? 'text-indigo-300' : 'text-cyan-400'
                        }`}>
                          {pair.key}
                        </span>
                      </div>
                      
                      {/* Value section */}
                      <div className="flex-1 px-3 py-3 flex items-center justify-between min-w-0">
                        <span className={`font-mono text-sm truncate ${
                          highlightKey === pair.key ? 'text-indigo-200' : 'text-emerald-400'
                        }`}>
                          {pair.value}
                        </span>
                        
                        {/* Delete button */}
                        <button
                          onClick={() => deletePair(pair.key)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded transition-all ml-2 flex-shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Unlock animation */}
                      <AnimatePresence>
                        {highlightKey === pair.key && searchResult?.found && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -top-2 -right-2 p-1 bg-emerald-500 rounded-full"
                          >
                            <Unlock size={12} className="text-white" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>


        {/* Operations Panel */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Add Pair */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <div className="text-xs text-emerald-400 mb-3 flex items-center gap-2">
              <Plus size={14} />
              Add / Update Entry
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="Key"
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-cyan-300 placeholder-slate-600 font-mono focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addPair()}
                  placeholder="Value"
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-emerald-300 placeholder-slate-600 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                onClick={addPair}
                disabled={!newKey.trim()}
                className="w-full py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 rounded-lg hover:bg-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                SET
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <div className="text-xs text-cyan-400 mb-3 flex items-center gap-2">
              <Search size={14} />
              Lookup by Key
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchKey}
                  onChange={(e) => { setSearchKey(e.target.value); setSearchResult(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && searchForKey()}
                  placeholder="Enter key to search"
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-300 placeholder-slate-600 font-mono focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={searchForKey}
                  disabled={!searchKey.trim() || isSearching}
                  className="px-4 py-2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 rounded-lg hover:bg-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSearching ? (
                    <div className="w-4 h-4 border-2 border-cyan-300 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search size={16} />
                  )}
                  GET
                </button>
              </div>
              
              {/* Search Result */}
              <AnimatePresence>
                {searchResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`p-3 rounded-lg border ${
                      searchResult.found
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-rose-500/10 border-rose-500/30'
                    }`}
                  >
                    {searchResult.found ? (
                      <div className="flex items-center gap-2">
                        <Unlock size={16} className="text-emerald-400" />
                        <span className="text-xs text-emerald-400">Found:</span>
                        <span className="font-mono text-sm text-emerald-300">"{searchResult.value}"</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Lock size={16} className="text-rose-400" />
                        <span className="text-xs text-rose-400">Key not found</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Code Display */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-indigo-400 mb-3">Live Code</div>
          <div className="font-mono text-sm bg-black/30 rounded-lg p-4 overflow-x-auto space-y-1">
            <div>
              <span className="text-cyan-400">const</span>{' '}
              <span className="text-amber-300">map</span>{' '}
              <span className="text-slate-500">=</span>{' '}
              <span className="text-cyan-400">new</span>{' '}
              <span className="text-emerald-400">Map</span>
              <span className="text-slate-300">();</span>
            </div>
            {pairs.length > 0 && (
              <>
                <div className="text-slate-600 mt-2">// Entries:</div>
                {pairs.map((pair) => (
                  <div key={pair.id}>
                    <span className="text-amber-300">map</span>
                    <span className="text-slate-300">.</span>
                    <span className="text-cyan-300">set</span>
                    <span className="text-slate-300">(</span>
                    <span className="text-emerald-400">"{pair.key}"</span>
                    <span className="text-slate-300">, </span>
                    <span className="text-emerald-400">"{pair.value}"</span>
                    <span className="text-slate-300">);</span>
                  </div>
                ))}
              </>
            )}
            <div className="text-slate-600 mt-2">
              <span className="text-slate-500">// </span>
              <span className="text-amber-300">map</span>
              <span className="text-slate-300">.</span>
              <span className="text-cyan-300">size</span>
              <span className="text-slate-500"> = </span>
              <span className="text-amber-300">{pairs.length}</span>
            </div>
          </div>
        </div>


        {/* Operation Log */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="text-xs text-slate-400 mb-3">Operation Log</div>
          <div className="font-mono text-xs bg-black/30 rounded-lg p-3 h-24 overflow-y-auto custom-scrollbar space-y-0.5">
            {log.map((entry, idx) => (
              <div key={idx} className={
                entry.includes('Error') ? 'text-rose-400' :
                entry.includes('→') ? 'text-cyan-400' :
                entry.includes('delete') ? 'text-rose-400' :
                entry.includes('//') ? 'text-slate-500' :
                'text-emerald-400'
              }>
                {entry}
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Size</div>
            <div className="text-2xl font-bold text-indigo-400 font-mono">{pairs.length}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Keys</div>
            <div className="text-2xl font-bold text-cyan-400 font-mono">{pairs.length}</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Capacity</div>
            <div className="text-2xl font-bold text-amber-400 font-mono">8</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Available</div>
            <div className="text-2xl font-bold text-emerald-400 font-mono">{8 - pairs.length}</div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Enter</kbd> Add/Search
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
          About Associative Arrays
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            <span className="text-indigo-300">Associative arrays</span> (also called maps, dictionaries, or hashes) 
            store key-value pairs where each unique key maps to a value.
          </p>
          <p>
            <span className="text-cyan-300">Keys must be unique</span> — setting a value for an existing key 
            updates the value rather than creating a duplicate.
          </p>
          <p>
            <span className="text-emerald-300">O(1) average lookup</span> — hash-based implementations provide 
            constant-time access by key, making them ideal for fast lookups.
          </p>
          <p>
            <span className="text-amber-300">Common uses:</span> caching, counting occurrences, 
            configuration storage, and representing structured data.
          </p>
        </div>
      </details>
    </div>
  );
}
