import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, RotateCcw, Shuffle, Volume2, VolumeX, TreeDeciduous, Zap, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Red-Black Tree Types (Algebraic Data Types) ---
type Color = 'red' | 'black';

interface RBNode {
  value: number;
  color: Color;
  left: RBNode | null;
  right: RBNode | null;
  id: string; // For animation tracking
}

interface TreeOperation {
  type: 'insert' | 'rotate-left' | 'rotate-right' | 'color-flip' | 'recolor';
  node?: number;
  description: string;
}

// --- Red-Black Tree Logic ---
let nodeIdCounter = 0;
const createNode = (value: number, color: Color = 'red'): RBNode => ({
  value,
  color,
  left: null,
  right: null,
  id: `node-${nodeIdCounter++}`,
});

const isRed = (node: RBNode | null): boolean => node !== null && node.color === 'red';

const rotateLeft = (h: RBNode): RBNode => {
  const x = h.right!;
  h.right = x.left;
  x.left = h;
  x.color = h.color;
  h.color = 'red';
  return x;
};

const rotateRight = (h: RBNode): RBNode => {
  const x = h.left!;
  h.left = x.right;
  x.right = h;
  x.color = h.color;
  h.color = 'red';
  return x;
};

const flipColors = (h: RBNode): void => {
  h.color = h.color === 'red' ? 'black' : 'red';
  if (h.left) h.left.color = h.left.color === 'red' ? 'black' : 'red';
  if (h.right) h.right.color = h.right.color === 'red' ? 'black' : 'red';
};

// Deep clone tree for history
const cloneTree = (node: RBNode | null): RBNode | null => {
  if (!node) return null;
  return {
    ...node,
    left: cloneTree(node.left),
    right: cloneTree(node.right),
  };
};

// Insert with operation tracking
const insertNode = (
  h: RBNode | null,
  value: number,
  operations: TreeOperation[]
): RBNode => {
  if (h === null) {
    operations.push({ type: 'insert', node: value, description: `Insert ${value} as red node` });
    return createNode(value);
  }

  if (value < h.value) {
    h.left = insertNode(h.left, value, operations);
  } else if (value > h.value) {
    h.right = insertNode(h.right, value, operations);
  } else {
    return h; // Duplicate
  }

  // Fix-up: maintain red-black properties
  if (isRed(h.right) && !isRed(h.left)) {
    operations.push({ type: 'rotate-left', node: h.value, description: `Rotate left at ${h.value}` });
    h = rotateLeft(h);
  }
  if (isRed(h.left) && h.left && isRed(h.left.left)) {
    operations.push({ type: 'rotate-right', node: h.value, description: `Rotate right at ${h.value}` });
    h = rotateRight(h);
  }
  if (isRed(h.left) && isRed(h.right)) {
    operations.push({ type: 'color-flip', node: h.value, description: `Flip colors at ${h.value}` });
    flipColors(h);
  }

  return h;
};

// Get tree height
const getHeight = (node: RBNode | null): number => {
  if (!node) return 0;
  return 1 + Math.max(getHeight(node.left), getHeight(node.right));
};

// Count nodes
const countNodes = (node: RBNode | null): number => {
  if (!node) return 0;
  return 1 + countNodes(node.left) + countNodes(node.right);
};

// Count black height (should be same for all paths)
const blackHeight = (node: RBNode | null): number => {
  if (!node) return 1;
  return (node.color === 'black' ? 1 : 0) + blackHeight(node.left);
};

// --- Component ---
export default function AlgebraicDataTypesVisualization() {
  const [tree, setTree] = useState<RBNode | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [operations, setOperations] = useState<TreeOperation[]>([]);
  const [highlightedNode, setHighlightedNode] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showADTCode, setShowADTCode] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);

  // --- Audio ---
  const playSound = useCallback((type: 'insert' | 'rotate' | 'flip' | 'click' | 'error') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'insert') {
      [440, 554, 659].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.08, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15 + i * 0.08);
        osc.start(now + i * 0.08);
        osc.stop(now + 0.2 + i * 0.08);
      });
    } else if (type === 'rotate') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'flip') {
      [523, 392].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.04, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12 + i * 0.1);
        osc.start(now + i * 0.1);
        osc.stop(now + 0.15 + i * 0.1);
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
    } else if (type === 'error') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  }, [soundEnabled]);

  // --- Insert Value ---
  const handleInsert = useCallback(() => {
    const value = parseInt(inputValue);
    if (isNaN(value)) {
      playSound('error');
      return;
    }

    const ops: TreeOperation[] = [];
    let newTree = cloneTree(tree);
    newTree = insertNode(newTree, value, ops);
    if (newTree) newTree.color = 'black'; // Root is always black

    setTree(newTree);
    setOperations(prev => [...ops, ...prev].slice(0, 20));
    setHighlightedNode(value);
    setInputValue('');
    
    // Play sounds for operations
    ops.forEach((op, i) => {
      setTimeout(() => {
        if (op.type === 'insert') playSound('insert');
        else if (op.type.includes('rotate')) playSound('rotate');
        else if (op.type === 'color-flip') playSound('flip');
      }, i * 200);
    });

    setTimeout(() => setHighlightedNode(null), 1500);
  }, [inputValue, tree, playSound]);

  // --- Insert Random ---
  const insertRandom = useCallback(() => {
    const existingValues = new Set<number>();
    const collectValues = (node: RBNode | null) => {
      if (!node) return;
      existingValues.add(node.value);
      collectValues(node.left);
      collectValues(node.right);
    };
    collectValues(tree);

    let value: number;
    do {
      value = Math.floor(Math.random() * 99) + 1;
    } while (existingValues.has(value));

    setInputValue(String(value));
    setTimeout(() => {
      const ops: TreeOperation[] = [];
      let newTree = cloneTree(tree);
      newTree = insertNode(newTree, value, ops);
      if (newTree) newTree.color = 'black';

      setTree(newTree);
      setOperations(prev => [...ops, ...prev].slice(0, 20));
      setHighlightedNode(value);
      setInputValue('');

      ops.forEach((op, i) => {
        setTimeout(() => {
          if (op.type === 'insert') playSound('insert');
          else if (op.type.includes('rotate')) playSound('rotate');
          else if (op.type === 'color-flip') playSound('flip');
        }, i * 200);
      });

      setTimeout(() => setHighlightedNode(null), 1500);
    }, 100);
  }, [tree, playSound]);

  // --- Reset ---
  const reset = () => {
    nodeIdCounter = 0;
    setTree(null);
    setOperations([]);
    setHighlightedNode(null);
    setInputValue('');
    playSound('click');
  };

  // --- Build Sample Tree ---
  const buildSampleTree = () => {
    reset();
    const values = [50, 25, 75, 10, 30, 60, 90, 5, 15];
    let newTree: RBNode | null = null;

    values.forEach((v, i) => {
      setTimeout(() => {
        const ops: TreeOperation[] = [];
        newTree = insertNode(cloneTree(newTree), v, ops);
        if (newTree) newTree.color = 'black';
        setTree(cloneTree(newTree));
        setOperations(prev => [...ops, ...prev].slice(0, 20));
        setHighlightedNode(v);
        playSound('insert');
        setTimeout(() => setHighlightedNode(null), 400);
      }, i * 500);
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) {
        if (e.key === 'Enter') handleInsert();
        return;
      }
      if (e.key === 'r' || e.key === 'R') reset();
      if (e.key === ' ') {
        e.preventDefault();
        insertRandom();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleInsert, insertRandom]);

  // --- Render Tree ---
  const renderTree = (node: RBNode | null, x: number, y: number, spread: number, depth: number = 0): React.ReactNode[] => {
    if (!node) return [];

    const elements: React.ReactNode[] = [];
    const nodeSize = 36;
    const verticalGap = 60;

    // Draw edges first
    if (node.left) {
      const childX = x - spread;
      const childY = y + verticalGap;
      elements.push(
        <motion.line
          key={`edge-${node.id}-left`}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.4 }}
          x1={x}
          y1={y}
          x2={childX}
          y2={childY}
          stroke="#475569"
          strokeWidth={2}
        />
      );
    }
    if (node.right) {
      const childX = x + spread;
      const childY = y + verticalGap;
      elements.push(
        <motion.line
          key={`edge-${node.id}-right`}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.4 }}
          x1={x}
          y1={y}
          x2={childX}
          y2={childY}
          stroke="#475569"
          strokeWidth={2}
        />
      );
    }

    // Draw node
    const isHighlighted = node.value === highlightedNode;
    elements.push(
      <motion.g
        key={node.id}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: isHighlighted ? 1.2 : 1, 
          opacity: 1,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* Glow effect for highlighted */}
        {isHighlighted && (
          <motion.circle
            cx={x}
            cy={y}
            r={nodeSize / 2 + 8}
            fill="none"
            stroke={node.color === 'red' ? '#f87171' : '#60a5fa'}
            strokeWidth={3}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}
        {/* Node circle */}
        <circle
          cx={x}
          cy={y}
          r={nodeSize / 2}
          fill={node.color === 'red' ? '#dc2626' : '#1e293b'}
          stroke={node.color === 'red' ? '#fca5a5' : '#64748b'}
          strokeWidth={2}
          className="cursor-pointer"
          onClick={() => setHighlightedNode(node.value)}
        />
        {/* Value text */}
        <text
          x={x}
          y={y + 5}
          textAnchor="middle"
          fill={node.color === 'red' ? '#fef2f2' : '#e2e8f0'}
          fontSize={14}
          fontWeight="bold"
          fontFamily="monospace"
          className="pointer-events-none"
        >
          {node.value}
        </text>
      </motion.g>
    );

    // Recursively render children
    if (node.left) {
      elements.push(...renderTree(node.left, x - spread, y + verticalGap, spread * 0.55, depth + 1));
    }
    if (node.right) {
      elements.push(...renderTree(node.right, x + spread, y + verticalGap, spread * 0.55, depth + 1));
    }

    return elements;
  };

  const treeHeight = getHeight(tree);
  const nodeCount = countNodes(tree);
  const bHeight = blackHeight(tree);

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-rose-950/5 to-slate-950 rounded-xl border border-rose-900/30 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-rose-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30">
              <TreeDeciduous className="text-rose-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-rose-300 tracking-wide">RED-BLACK TREE FORGE</h2>
              <p className="text-xs text-rose-500/70">Algebraic Data Types Visualization</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowADTCode(!showADTCode)}
              className={`p-2 rounded-lg border transition-all ${
                showADTCode 
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' 
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
              title="Show ADT Code"
            >
              <Info size={16} />
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled 
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' 
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
        
        {/* Controls */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-xs text-rose-400 mb-2 block">Insert Value (1-99)</label>
              <input
                type="number"
                min="1"
                max="99"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
                placeholder="Enter number..."
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-lg text-rose-300 font-mono focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>
            <div className="flex gap-2 sm:items-end">
              <button
                onClick={handleInsert}
                disabled={!inputValue}
                className="flex-1 sm:flex-none px-5 py-3 rounded-lg font-bold flex items-center justify-center gap-2 bg-rose-500/20 text-rose-300 border border-rose-500/50 hover:bg-rose-500/30 transition-all disabled:opacity-50"
              >
                <Plus size={18} />
                Insert
              </button>
              <button
                onClick={insertRandom}
                className="px-3 py-3 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30 transition-all"
                title="Insert Random"
              >
                <Shuffle size={18} />
              </button>
              <button
                onClick={reset}
                className="px-3 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </div>
          
          {/* Quick actions */}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={buildSampleTree}
              className="px-3 py-1.5 text-xs bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-all"
            >
              Build Sample Tree
            </button>
            <span className="text-xs text-slate-500 flex items-center">
              Quick insert:
            </span>
            {[10, 20, 30, 40, 50].map(n => (
              <button
                key={n}
                onClick={() => { setInputValue(String(n)); }}
                className="px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-slate-400 hover:text-rose-300 hover:border-rose-500/50 transition-all"
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* ADT Code Display */}
        <AnimatePresence>
          {showADTCode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-slate-900/70 rounded-xl border border-cyan-800/30 p-4 overflow-hidden"
            >
              <div className="text-xs text-cyan-400 mb-2 flex items-center gap-2">
                <Zap size={12} />
                Algebraic Data Type Definition (Haskell-style)
              </div>
              <pre className="text-xs font-mono text-slate-300 overflow-x-auto">
{`-- Color is a sum type (enum)
data Color = Red | Black

-- RBTree is a recursive algebraic data type
data RBTree a = Empty
              | Node Color (RBTree a) a (RBTree a)

-- Pattern matching for balance
balance :: Color -> RBTree a -> a -> RBTree a -> RBTree a
balance Black (Node Red (Node Red a x b) y c) z d = 
    Node Red (Node Black a x b) y (Node Black c z d)
balance Black (Node Red a x (Node Red b y c)) z d = 
    Node Red (Node Black a x b) y (Node Black c z d)
balance Black a x (Node Red (Node Red b y c) z d) = 
    Node Red (Node Black a x b) y (Node Black c z d)
balance Black a x (Node Red b y (Node Red c z d)) = 
    Node Red (Node Black a x b) y (Node Black c z d)
balance color left value right = Node color left value right`}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tree Visualization */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-rose-400 flex items-center gap-2">
              <TreeDeciduous size={12} />
              Tree Structure
            </div>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-600 border border-red-400"></span>
                <span className="text-slate-400">Red</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-slate-800 border border-slate-500"></span>
                <span className="text-slate-400">Black</span>
              </span>
            </div>
          </div>

          <div className="relative bg-slate-950/50 rounded-lg border border-slate-800 overflow-hidden" style={{ minHeight: '300px' }}>
            {tree ? (
              <svg 
                width="100%" 
                height={Math.max(300, treeHeight * 70 + 60)}
                viewBox={`0 0 600 ${Math.max(300, treeHeight * 70 + 60)}`}
                className="mx-auto"
              >
                {renderTree(tree, 300, 40, 120)}
              </svg>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                <div className="text-center">
                  <TreeDeciduous size={48} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Insert values to build the tree</p>
                  <p className="text-xs text-slate-700 mt-1">Press Space for random insert</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats & Operations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tree Stats */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <div className="text-xs text-slate-500 mb-3">Tree Statistics</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-rose-300">{nodeCount}</div>
                <div className="text-[10px] text-slate-500">Nodes</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-cyan-300">{treeHeight}</div>
                <div className="text-[10px] text-slate-500">Height</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-amber-300">{bHeight}</div>
                <div className="text-[10px] text-slate-500">Black Height</div>
              </div>
            </div>
          </div>

          {/* Recent Operations */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <div className="text-xs text-slate-500 mb-3">Recent Operations</div>
            <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
              {operations.length === 0 ? (
                <div className="text-xs text-slate-600 text-center py-4">No operations yet</div>
              ) : (
                operations.map((op, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`text-xs px-2 py-1 rounded flex items-center gap-2 ${
                      op.type === 'insert' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : op.type.includes('rotate')
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    <span className="font-mono text-[10px] opacity-60">
                      {op.type === 'insert' ? '➕' : op.type.includes('rotate') ? '🔄' : '🎨'}
                    </span>
                    {op.description}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Red-Black Tree Properties */}
        <div className="bg-gradient-to-r from-slate-900/50 to-rose-900/10 rounded-xl border border-rose-800/20 p-4">
          <div className="text-xs text-rose-400 mb-3 flex items-center gap-2">
            <Zap size={12} />
            Red-Black Tree Properties
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-start gap-2 p-2 bg-slate-800/30 rounded-lg">
              <span className="text-emerald-400">✓</span>
              <span className="text-slate-400">Root is always black</span>
            </div>
            <div className="flex items-start gap-2 p-2 bg-slate-800/30 rounded-lg">
              <span className="text-emerald-400">✓</span>
              <span className="text-slate-400">Red nodes have black children</span>
            </div>
            <div className="flex items-start gap-2 p-2 bg-slate-800/30 rounded-lg">
              <span className="text-emerald-400">✓</span>
              <span className="text-slate-400">All paths have same black height</span>
            </div>
            <div className="flex items-start gap-2 p-2 bg-slate-800/30 rounded-lg">
              <span className="text-emerald-400">✓</span>
              <span className="text-slate-400">New nodes inserted as red</span>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Space</kbd> Random Insert
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Enter</kbd> Insert Value
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-rose-400 hover:text-rose-300 transition-colors">
          About Algebraic Data Types & Red-Black Trees
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            <span className="text-rose-300">Algebraic Data Types (ADTs)</span> are composite types formed by 
            combining other types. They include <span className="text-cyan-300">sum types</span> (like enums: 
            Color = Red | Black) and <span className="text-amber-300">product types</span> (like structs with 
            multiple fields).
          </p>
          <p>
            <span className="text-rose-300">Red-Black Trees</span> are self-balancing binary search trees that 
            use node coloring to maintain balance. The tree rebalances through <span className="text-amber-300">rotations</span> 
            and <span className="text-rose-300">color flips</span> after insertions.
          </p>
          <p>
            ADTs with pattern matching make implementing tree operations elegant and type-safe, as each case 
            in the balance function handles a specific tree shape.
          </p>
        </div>
      </details>
    </div>
  );
}
