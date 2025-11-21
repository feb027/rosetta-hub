import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, GitBranch, Zap, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Logic ---

const WORD_SETS = [
  ["the", "that", "a"],
  ["frog", "elephant", "thing"],
  ["walked", "treaded", "grows"],
  ["slowly", "quickly"]
];

type NodeStatus = 'pending' | 'active' | 'success' | 'failed';

interface TreeNode {
  id: string;
  word: string;
  level: number;
  parentId: string | null;
  status: NodeStatus;
  x: number;
  y: number;
  children: string[]; // IDs
}

interface SimulationStep {
  nodes: Record<string, TreeNode>;
  activePath: string[]; // IDs
  message: string;
  isComplete: boolean;
  success: boolean;
}

// Generator for the backtracking process
function* solveAmb(): Generator<SimulationStep> {
  const nodes: Record<string, TreeNode> = {};
  const rootId = 'root';
  
  nodes[rootId] = {
    id: rootId,
    word: 'START',
    level: -1,
    parentId: null,
    status: 'active',
    x: 50, // Percent
    y: 10, // Percent
    children: []
  };

  const path: string[] = [rootId];
  
  yield { nodes: { ...nodes }, activePath: [...path], message: 'Initializing timeline...', isComplete: false, success: false };



  function* backtrack(level: number): Generator<SimulationStep, boolean> {
    if (level === WORD_SETS.length) {
      // Success!
      return true;
    }

    const candidates = WORD_SETS[level];
    const parentId = path[path.length - 1];

    for (let i = 0; i < candidates.length; i++) {
      const word = candidates[i];
      const nodeId = `${level}-${i}-${word}`;
      
      // Create node
      nodes[nodeId] = {
        id: nodeId,
        word: word,
        level: level,
        parentId: parentId,
        status: 'pending',
        x: 0, y: 0, // Placeholder
        children: []
      };
      
      if (nodes[parentId]) {
        nodes[parentId].children.push(nodeId);
      }

      // Visualize: Node appears
      yield { nodes: { ...nodes }, activePath: [...path], message: `Projecting timeline: "${word}"`, isComplete: false, success: false };

      // Check constraint (if not first word)
      let valid = true;
      if (level > 0) {
        const prevWord = nodes[parentId].word;
        if (prevWord.slice(-1).toLowerCase() !== word[0].toLowerCase()) {
          valid = false;
        }
      }

      // Visualize: Checking
      nodes[nodeId].status = 'active';
      path.push(nodeId);
      yield { nodes: { ...nodes }, activePath: [...path], message: `Verifying causality: ${word}`, isComplete: false, success: false };

      if (valid) {
        // Recurse
        if (yield* backtrack(level + 1)) {
          nodes[nodeId].status = 'success';
          yield { nodes: { ...nodes }, activePath: [...path], message: `Timeline stabilized: ${word}`, isComplete: false, success: false };
          return true;
        }
      }

      // Backtrack / Fail
      nodes[nodeId].status = 'failed';
      path.pop();
      yield { nodes: { ...nodes }, activePath: [...path], message: `Timeline collapsed: ${word}`, isComplete: false, success: false };
    }

    return false;
  }

  // Start solving
  // We need to handle the first level specially or just treat "START" as a dummy
  // The problem says "last character of each word ... same as first of successor"
  // This implies the constraint applies between word 0 and 1, 1 and 2, etc.
  // "START" doesn't have a last char constraint with word 0.
  
  // Actually, let's just run the backtrack loop
  // We need to iterate the first set manually to handle the "START" node connection correctly in the loop?
  // Or just modify backtrack to ignore constraint for level 0.
  
  // Let's modify backtrack to handle level 0 constraint check (skip it)
  
  if (yield* backtrack(0)) {
    yield { nodes: { ...nodes }, activePath: [...path], message: 'Coherent timeline established.', isComplete: true, success: true };
  } else {
    yield { nodes: { ...nodes }, activePath: [...path], message: 'All timelines collapsed.', isComplete: true, success: false };
  }
}

// --- Component ---

export default function AmbVisualization() {
  const [step, setStep] = useState<SimulationStep | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [speed] = useState(500);
  const [soundEnabled] = useState(true);
  
  const generatorRef = useRef<Generator<SimulationStep> | null>(null);
  const timerRef = useRef<number>(0); // Changed to number for window.setTimeout
  const audioContextRef = useRef<AudioContext | null>(null);

  // --- Audio ---
  useEffect(() => {
    if (soundEnabled && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, [soundEnabled]);

  const playSound = useCallback((type: 'branch' | 'collapse' | 'success') => {
    if (!soundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'branch') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'collapse') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.linearRampToValueAtTime(50, now + 0.3);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554, now + 0.1);
      osc.frequency.setValueAtTime(659, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  }, [soundEnabled]);

  // --- Simulation ---

  const startSimulation = () => {
    generatorRef.current = solveAmb();
    setIsRunning(true);
    processStep();
  };

  const processStep = () => {
    if (!generatorRef.current) return;
    const next = generatorRef.current.next();
    
    if (!next.done) {
      const currentStep = next.value;
      setStep(currentStep);
      
      // Sound triggers based on state change could go here
      // For now, simple heuristics:
      if (currentStep.message.includes('Projecting')) playSound('branch');
      if (currentStep.message.includes('collapsed')) playSound('collapse');
      if (currentStep.message.includes('stabilized')) playSound('success');

      timerRef.current = window.setTimeout(processStep, speed);
    } else {
      setIsRunning(false);
    }
  };

  const reset = () => {
    clearTimeout(timerRef.current);
    setIsRunning(false);
    setStep(null);
    generatorRef.current = null;
  };

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  // --- Layout Calculation ---
  // We calculate positions dynamically based on the current tree structure in 'step'
  const getTreeLayout = () => {
    if (!step) return { nodes: [], links: [] };

    const nodes = Object.values(step.nodes);
    const links: { x1: number, y1: number, x2: number, y2: number, status: NodeStatus }[] = [];
    
    // Simple level-based layout
    // We need to group by level to assign X coordinates
    const levels: Record<number, TreeNode[]> = {};
    nodes.forEach(n => {
      if (!levels[n.level]) levels[n.level] = [];
      levels[n.level].push(n);
    });

    // Assign X/Y
    const layoutNodes = nodes.map(n => {
      const siblings = levels[n.level];
      const index = siblings.indexOf(n);
      // Center siblings: 
      // Width per node = 100 / (siblings.length + 1)
      const x = ((index + 1) / (siblings.length + 1)) * 100;
      const y = ((n.level + 2) / (WORD_SETS.length + 2)) * 100; // +2 for root and padding
      
      return { ...n, x, y };
    });

    // Create links
    layoutNodes.forEach(n => {
      if (n.parentId) {
        const parent = layoutNodes.find(p => p.id === n.parentId);
        if (parent) {
          links.push({
            x1: parent.x,
            y1: parent.y,
            x2: n.x,
            y2: n.y,
            status: n.status
          });
        }
      }
    });

    return { nodes: layoutNodes, links };
  };

  const { nodes: layoutNodes, links } = getTreeLayout();

  return (
    <div className="relative w-full h-[600px] bg-black overflow-hidden rounded-xl border border-zinc-800 font-mono text-xs">
      
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-20" 
           style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
      />

      {/* Floating HUD */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <div className="bg-zinc-900/80 backdrop-blur border border-zinc-700 p-3 rounded-lg shadow-xl w-64">
          <div className="flex items-center gap-2 mb-2 text-emerald-400">
            <GitBranch size={16} />
            <span className="font-bold uppercase tracking-wider">Temporal Divergence</span>
          </div>
          <div className="text-zinc-400 mb-4 h-10 leading-tight">
            {step ? step.message : "System Ready. Awaiting initialization."}
          </div>
          <div className="flex gap-2">
            <button
              onClick={startSimulation}
              disabled={isRunning || (step?.isComplete ?? false)}
              className="flex-1 bg-emerald-900/50 text-emerald-400 border border-emerald-800 hover:bg-emerald-900 hover:border-emerald-500 py-1.5 rounded transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={12} /> {isRunning ? 'Simulating...' : 'Inject Amb'}
            </button>
            <button
              onClick={reset}
              className="px-3 bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 hover:text-white rounded transition-all"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>
        
        {/* Legend */}
        <div className="bg-zinc-900/80 backdrop-blur border border-zinc-700 p-2 rounded-lg shadow-xl flex gap-4 text-[10px] text-zinc-500">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]"></div> STABLE</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_5px_#f59e0b]"></div> ACTIVE</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-900/50 border border-red-800"></div> COLLAPSED</div>
        </div>
      </div>

      {/* Visualization Canvas */}
      <div className="absolute inset-0 z-10">
        <svg className="w-full h-full">
          {/* Links */}
          <AnimatePresence>
            {links.map((link, i) => (
              <motion.line
                key={`link-${i}`}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: link.status === 'failed' ? 0.2 : 1 }}
                x1={`${link.x1}%`}
                y1={`${link.y1}%`}
                x2={`${link.x2}%`}
                y2={`${link.y2}%`}
                stroke={
                  link.status === 'success' ? '#10b981' :
                  link.status === 'active' ? '#f59e0b' :
                  link.status === 'failed' ? '#7f1d1d' : '#52525b'
                }
                strokeWidth={link.status === 'active' ? 2 : 1}
                strokeDasharray={link.status === 'failed' ? "4 4" : "none"}
              />
            ))}
          </AnimatePresence>

          {/* Nodes (rendered as foreignObjects for HTML content or just circles/text) */}
          {/* Using HTML overlay for nodes might be easier for styling, but let's try SVG groups */}
          {layoutNodes.map((node) => (
            <g key={node.id} transform={`translate(${node.x * 10}, ${node.y * 6})`}> 
              {/* Note: SVG coordinates need conversion from %. 
                  However, mixing % and px in transform is tricky. 
                  Let's use absolute positioning divs instead of SVG for nodes to avoid coordinate headaches.
              */}
            </g>
          ))}
        </svg>
        
        {/* HTML Layer for Nodes (Easier styling/animation) */}
        {layoutNodes.map((node) => (
          <motion.div
            key={node.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: node.status === 'active' ? 1.1 : 1, 
              opacity: node.status === 'failed' ? 0.4 : 1,
              borderColor: 
                node.status === 'success' ? '#10b981' :
                node.status === 'active' ? '#f59e0b' :
                node.status === 'failed' ? '#7f1d1d' : '#52525b',
              backgroundColor:
                node.status === 'success' ? 'rgba(16, 185, 129, 0.2)' :
                node.status === 'active' ? 'rgba(245, 158, 11, 0.2)' :
                node.status === 'failed' ? 'rgba(127, 29, 29, 0.1)' : '#18181b'
            }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 px-3 py-1 rounded-full border backdrop-blur-sm transition-colors duration-300 flex items-center gap-2
              ${node.status === 'success' ? 'shadow-[0_0_15px_rgba(16,185,129,0.4)]' : ''}
              ${node.status === 'active' ? 'shadow-[0_0_15px_rgba(245,158,11,0.4)] z-20' : 'z-10'}
            `}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            {node.status === 'success' && <CheckCircle2 size={10} className="text-emerald-400" />}
            {node.status === 'failed' && <XCircle size={10} className="text-red-800" />}
            {node.status === 'active' && <Zap size={10} className="text-amber-400" />}
            <span className={`
              ${node.status === 'success' ? 'text-emerald-100' : 
                node.status === 'active' ? 'text-amber-100' : 
                node.status === 'failed' ? 'text-red-900 line-through' : 'text-zinc-400'}
            `}>
              {node.word}
            </span>
          </motion.div>
        ))}
      </div>
      
      {/* Success Overlay */}
      <AnimatePresence>
        {step?.success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-emerald-900/20 border border-emerald-500/50 p-8 rounded-2xl backdrop-blur-md text-center shadow-[0_0_50px_rgba(16,185,129,0.2)]">
              <div className="text-emerald-400 text-sm font-bold uppercase tracking-widest mb-2">Timeline Stabilized</div>
              <div className="text-3xl text-white font-bold">
                {step.activePath.map(id => step.nodes[id].word).filter(w => w !== 'START').join(' ')}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
