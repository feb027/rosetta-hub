import { useState, useRef, useCallback, useEffect } from 'react';
import { RotateCcw, Volume2, VolumeX, Plus, Trash2, TreeDeciduous, Scale, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- AVL Tree Node ---
interface AVLNode {
  value: number;
  left: AVLNode | null;
  right: AVLNode | null;
  height: number;
  x?: number;
  y?: number;
  id: string;
}

// --- AVL Tree Operations ---
const getHeight = (node: AVLNode | null): number => (node ? node.height : 0);

const getBalance = (node: AVLNode | null): number => {
  if (!node) return 0;
  return getHeight(node.left) - getHeight(node.right);
};

const updateHeight = (node: AVLNode): void => {
  node.height = 1 + Math.max(getHeight(node.left), getHeight(node.right));
};

// Right rotation
const rotateRight = (y: AVLNode): AVLNode => {
  const x = y.left!;
  const T2 = x.right;
  x.right = y;
  y.left = T2;
  updateHeight(y);
  updateHeight(x);
  return x;
};

// Left rotation
const rotateLeft = (x: AVLNode): AVLNode => {
  const y = x.right!;
  const T2 = y.left;
  y.left = x;
  x.right = T2;
  updateHeight(x);
  updateHeight(y);
  return y;
};

// Insert with balancing
const insert = (node: AVLNode | null, value: number, id: string): AVLNode => {
  if (!node) {
    return { value, left: null, right: null, height: 1, id };
  }

  if (value < node.value) {
    node.left = insert(node.left, value, id);
  } else if (value > node.value) {
    node.right = insert(node.right, value, id);
  } else {
    return node; // Duplicate values not allowed
  }

  updateHeight(node);
  const balance = getBalance(node);

  // Left Left Case
  if (balance > 1 && node.left && value < node.left.value) {
    return rotateRight(node);
  }
  // Right Right Case
  if (balance < -1 && node.right && value > node.right.value) {
    return rotateLeft(node);
  }
  // Left Right Case
  if (balance > 1 && node.left && value > node.left.value) {
    node.left = rotateLeft(node.left);
    return rotateRight(node);
  }
  // Right Left Case
  if (balance < -1 && node.right && value < node.right.value) {
    node.right = rotateRight(node.right);
    return rotateLeft(node);
  }

  return node;
};

// Find minimum value node
const minValueNode = (node: AVLNode): AVLNode => {
  let current = node;
  while (current.left) current = current.left;
  return current;
};

// Delete with balancing
const deleteNode = (root: AVLNode | null, value: number): AVLNode | null => {
  if (!root) return null;

  if (value < root.value) {
    root.left = deleteNode(root.left, value);
  } else if (value > root.value) {
    root.right = deleteNode(root.right, value);
  } else {
    if (!root.left || !root.right) {
      root = root.left || root.right;
    } else {
      const temp = minValueNode(root.right);
      root.value = temp.value;
      root.id = temp.id;
      root.right = deleteNode(root.right, temp.value);
    }
  }

  if (!root) return null;

  updateHeight(root);
  const balance = getBalance(root);

  // Left Left
  if (balance > 1 && getBalance(root.left) >= 0) return rotateRight(root);
  // Left Right
  if (balance > 1 && getBalance(root.left) < 0) {
    root.left = rotateLeft(root.left!);
    return rotateRight(root);
  }
  // Right Right
  if (balance < -1 && getBalance(root.right) <= 0) return rotateLeft(root);
  // Right Left
  if (balance < -1 && getBalance(root.right) > 0) {
    root.right = rotateRight(root.right!);
    return rotateLeft(root);
  }

  return root;
};

// Calculate positions for rendering
const calculatePositions = (
  node: AVLNode | null,
  x: number,
  y: number,
  horizontalSpacing: number
): void => {
  if (!node) return;
  node.x = x;
  node.y = y;
  const nextSpacing = horizontalSpacing * 0.55;
  calculatePositions(node.left, x - horizontalSpacing, y + 70, nextSpacing);
  calculatePositions(node.right, x + horizontalSpacing, y + 70, nextSpacing);
};

// Collect all nodes for rendering
const collectNodes = (node: AVLNode | null): AVLNode[] => {
  if (!node) return [];
  return [node, ...collectNodes(node.left), ...collectNodes(node.right)];
};

// Collect edges
const collectEdges = (node: AVLNode | null): { from: AVLNode; to: AVLNode }[] => {
  if (!node) return [];
  const edges: { from: AVLNode; to: AVLNode }[] = [];
  if (node.left) edges.push({ from: node, to: node.left });
  if (node.right) edges.push({ from: node, to: node.right });
  return [...edges, ...collectEdges(node.left), ...collectEdges(node.right)];
};

// Presets
const PRESETS = [
  { name: 'Balanced', values: [50, 25, 75, 10, 30, 60, 90] },
  { name: 'Sequential', values: [1, 2, 3, 4, 5, 6, 7] },
  { name: 'Reverse', values: [7, 6, 5, 4, 3, 2, 1] },
  { name: 'Random', values: [42, 17, 88, 5, 33, 71, 99, 12] },
];

export default function AVLTreeVisualization() {
  const [root, setRoot] = useState<AVLNode | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null);
  const [lastOperation, setLastOperation] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [nodeIdCounter, setNodeIdCounter] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);


  // --- Audio ---
  const playSound = useCallback(
    (type: 'insert' | 'delete' | 'rotate' | 'search' | 'found' | 'notfound' | 'click') => {
      if (!soundEnabled) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;

      if (type === 'insert') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'delete') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'rotate') {
        // Whoosh sound for rotation
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'search') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(500, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'found') {
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
          osc.stop(now + 0.3 + i * 0.08);
        });
      } else if (type === 'notfound') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.setValueAtTime(150, now + 0.1);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.start(now);
        osc.stop(now + 0.03);
      }
    },
    [soundEnabled]
  );

  // Insert value
  const handleInsert = useCallback(() => {
    const value = parseInt(inputValue);
    if (isNaN(value)) return;

    const newId = `node-${nodeIdCounter}`;
    setNodeIdCounter((prev) => prev + 1);

    const oldHeight = root ? getHeight(root) : 0;
    const newRoot = insert(root, value, newId);
    const newHeight = getHeight(newRoot);

    setRoot(newRoot);
    setInputValue('');
    setHighlightedNode(newId);
    setTimeout(() => setHighlightedNode(null), 1000);

    if (newHeight !== oldHeight || (root && getBalance(root) !== getBalance(newRoot))) {
      playSound('rotate');
      setLastOperation(`Inserted ${value} (rebalanced)`);
    } else {
      playSound('insert');
      setLastOperation(`Inserted ${value}`);
    }
  }, [inputValue, root, nodeIdCounter, playSound]);

  // Delete value
  const handleDelete = useCallback(() => {
    const value = parseInt(inputValue);
    if (isNaN(value)) return;

    const newRoot = deleteNode(root, value);
    setRoot(newRoot);
    setInputValue('');
    playSound('delete');
    setLastOperation(`Deleted ${value}`);
  }, [inputValue, root, playSound]);

  // Search value
  const handleSearch = useCallback(() => {
    const value = parseInt(searchValue);
    if (isNaN(value)) return;

    playSound('search');

    const findNode = (node: AVLNode | null): AVLNode | null => {
      if (!node) return null;
      if (value === node.value) return node;
      if (value < node.value) return findNode(node.left);
      return findNode(node.right);
    };

    const found = findNode(root);
    if (found) {
      setHighlightedNode(found.id);
      playSound('found');
      setLastOperation(`Found ${value}!`);
      setTimeout(() => setHighlightedNode(null), 2000);
    } else {
      playSound('notfound');
      setLastOperation(`${value} not found`);
    }
  }, [searchValue, root, playSound]);

  // Apply preset
  const applyPreset = useCallback(
    (preset: (typeof PRESETS)[0]) => {
      let newRoot: AVLNode | null = null;
      let counter = nodeIdCounter;

      preset.values.forEach((value) => {
        newRoot = insert(newRoot, value, `node-${counter}`);
        counter++;
      });

      setNodeIdCounter(counter);
      setRoot(newRoot);
      playSound('click');
      setLastOperation(`Loaded "${preset.name}" preset`);
    },
    [nodeIdCounter, playSound]
  );

  // Reset
  const reset = useCallback(() => {
    setRoot(null);
    setInputValue('');
    setSearchValue('');
    setHighlightedNode(null);
    setLastOperation('Tree cleared');
    playSound('click');
  }, [playSound]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'r' || e.key === 'R') reset();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [reset]);

  // Calculate positions for rendering
  if (root) {
    calculatePositions(root, 400, 50, 150);
  }

  const nodes = collectNodes(root);
  const edges = collectEdges(root);

  // Get balance color
  const getBalanceColor = (balance: number) => {
    if (balance === 0) return 'text-emerald-400';
    if (Math.abs(balance) === 1) return 'text-amber-400';
    return 'text-rose-400';
  };

  // Get node color based on balance
  const getNodeFill = (node: AVLNode, isHighlighted: boolean) => {
    if (isHighlighted) return 'url(#highlightGradient)';
    const balance = Math.abs(getBalance(node));
    if (balance === 0) return 'url(#balancedGradient)';
    if (balance === 1) return 'url(#slightGradient)';
    return 'url(#unbalancedGradient)';
  };


  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-teal-950/10 to-slate-950 rounded-xl border border-teal-900/40 font-sans overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950/30 to-slate-900 border-b border-teal-500/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2 rounded-lg bg-teal-500/20 border border-teal-500/50">
                <TreeDeciduous className="text-teal-400" size={24} />
              </div>
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-teal-300 tracking-wider">BALANCE ARCHITECT</h2>
              <p className="text-xs text-teal-500/70">AVL Tree Visualizer</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled
                  ? 'bg-teal-500/20 border-teal-500/50 text-teal-300'
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
          <span className="text-xs text-slate-500">Presets:</span>
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(preset)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border bg-slate-800/50 border-slate-700 text-slate-400 hover:border-teal-500/30 hover:text-teal-300"
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Insert/Delete */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <div className="text-xs text-slate-500 mb-2">Insert / Delete Node</div>
            <div className="flex gap-2">
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
                placeholder="Value (1-999)"
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-teal-300 font-mono placeholder-slate-600 focus:outline-none focus:border-teal-500"
                min={1}
                max={999}
              />
              <button
                onClick={handleInsert}
                className="px-4 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 rounded-lg hover:bg-emerald-500/30 transition-all"
                title="Insert"
              >
                <Plus size={18} />
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-rose-500/20 text-rose-300 border border-rose-500/50 rounded-lg hover:bg-rose-500/30 transition-all"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <div className="text-xs text-slate-500 mb-2">Search Node</div>
            <div className="flex gap-2">
              <input
                type="number"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search value"
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-cyan-300 font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 rounded-lg hover:bg-cyan-500/30 transition-all"
              >
                <Search size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Last Operation */}
        <AnimatePresence mode="wait">
          {lastOperation && (
            <motion.div
              key={lastOperation}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center text-sm text-teal-400 font-mono"
            >
              {lastOperation}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tree Visualization */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4 overflow-x-auto">
          <div className="min-w-[800px] h-[400px] relative">
            <svg
              ref={svgRef}
              viewBox="0 0 800 400"
              className="w-full h-full"
              style={{ minWidth: '800px' }}
            >
              <defs>
                {/* Gradients */}
                <linearGradient id="balancedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="slightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
                <linearGradient id="unbalancedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>
                <linearGradient id="highlightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#0891b2" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Edges */}
              {edges.map((edge, idx) => (
                <motion.line
                  key={`edge-${idx}`}
                  x1={edge.from.x}
                  y1={edge.from.y}
                  x2={edge.to.x}
                  y2={edge.to.y}
                  stroke="#475569"
                  strokeWidth="2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.3 }}
                />
              ))}

              {/* Nodes */}
              {nodes.map((node) => {
                const isHighlighted = highlightedNode === node.id;
                const balance = getBalance(node);

                return (
                  <g key={node.id}>
                    {/* Node circle */}
                    <motion.circle
                      cx={node.x}
                      cy={node.y}
                      r={24}
                      fill={getNodeFill(node, isHighlighted)}
                      stroke={isHighlighted ? '#06b6d4' : '#334155'}
                      strokeWidth={isHighlighted ? 3 : 2}
                      filter={isHighlighted ? 'url(#glow)' : undefined}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    />
                    {/* Value text */}
                    <motion.text
                      x={node.x}
                      y={node.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="14"
                      fontWeight="bold"
                      fontFamily="monospace"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {node.value}
                    </motion.text>
                    {/* Balance factor badge */}
                    <motion.circle
                      cx={(node.x || 0) + 18}
                      cy={(node.y || 0) - 18}
                      r={10}
                      fill="#1e293b"
                      stroke={Math.abs(balance) === 0 ? '#10b981' : Math.abs(balance) === 1 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    />
                    <motion.text
                      x={(node.x || 0) + 18}
                      y={(node.y || 0) - 18}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={Math.abs(balance) === 0 ? '#10b981' : Math.abs(balance) === 1 ? '#f59e0b' : '#ef4444'}
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {balance > 0 ? `+${balance}` : balance}
                    </motion.text>
                  </g>
                );
              })}

              {/* Empty state */}
              {nodes.length === 0 && (
                <text x="400" y="200" textAnchor="middle" fill="#64748b" fontSize="16">
                  Insert nodes to build your AVL tree
                </text>
              )}
            </svg>
          </div>
        </div>


        {/* Legend & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Balance Legend */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <div className="flex items-center gap-2 mb-3 text-xs text-slate-400">
              <Scale size={14} />
              Balance Factor Legend
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-b from-emerald-500 to-emerald-600" />
                <span className="text-xs text-emerald-400">0 (Perfect)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-b from-amber-500 to-amber-600" />
                <span className="text-xs text-amber-400">±1 (Acceptable)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-b from-rose-500 to-rose-600" />
                <span className="text-xs text-rose-400">±2+ (Needs rotation)</span>
              </div>
            </div>
          </div>

          {/* Tree Stats */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <div className="text-xs text-slate-400 mb-3">Tree Statistics</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-xl font-bold text-teal-400">{nodes.length}</div>
                <div className="text-xs text-slate-500">Nodes</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-cyan-400">{root ? getHeight(root) : 0}</div>
                <div className="text-xs text-slate-500">Height</div>
              </div>
              <div className="text-center">
                <div className={`text-xl font-bold ${root ? getBalanceColor(getBalance(root)) : 'text-slate-500'}`}>
                  {root ? (getBalance(root) > 0 ? `+${getBalance(root)}` : getBalance(root)) : '—'}
                </div>
                <div className="text-xs text-slate-500">Root Balance</div>
              </div>
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={reset}
          className="w-full px-4 py-2 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw size={16} />
          Clear Tree
        </button>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Enter</kbd> Insert/Search
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-teal-400 hover:text-teal-300 transition-colors">
          About AVL Trees
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            An <span className="text-teal-300">AVL tree</span> is a self-balancing binary search tree
            named after inventors <span className="text-amber-300">A</span>delson-<span className="text-amber-300">V</span>elsky
            and <span className="text-amber-300">L</span>andis (1962).
          </p>
          <p>
            <span className="text-emerald-300">Balance Factor</span> = Height(Left) - Height(Right)
          </p>
          <p>
            The balance factor of every node must be <span className="text-cyan-300">-1, 0, or +1</span>.
            When insertion or deletion violates this, rotations restore balance:
          </p>
          <ul className="space-y-1 ml-4 list-disc">
            <li><span className="text-amber-300">Left Rotation</span>: Right-heavy subtree</li>
            <li><span className="text-amber-300">Right Rotation</span>: Left-heavy subtree</li>
            <li><span className="text-amber-300">Left-Right</span>: Left child is right-heavy</li>
            <li><span className="text-amber-300">Right-Left</span>: Right child is left-heavy</li>
          </ul>
          <p className="text-slate-500">
            Time complexity: O(log n) for search, insert, and delete operations.
          </p>
        </div>
      </details>
    </div>
  );
}
