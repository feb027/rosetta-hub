import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, RotateCcw, TreeDeciduous, Zap, Volume2, VolumeX, GitBranch } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- AST Types ---
type ASTNode = {
  id: number;
  type: 'number' | 'operator';
  value: string | number;
  left?: ASTNode;
  right?: ASTNode;
  result?: number;
  evaluated?: boolean;
  depth?: number;
  x?: number;
  y?: number;
};

// --- Tokenizer ---
type Token = { type: 'number' | 'operator' | 'lparen' | 'rparen'; value: string };

const tokenize = (expr: string): Token[] => {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (/\d/.test(ch) || (ch === '.' && /\d/.test(expr[i + 1]))) {
      let num = '';
      while (i < expr.length && (/\d/.test(expr[i]) || expr[i] === '.')) {
        num += expr[i++];
      }
      tokens.push({ type: 'number', value: num });
    } else if ('+-*/'.includes(ch)) {
      tokens.push({ type: 'operator', value: ch });
      i++;
    } else if (ch === '(') {
      tokens.push({ type: 'lparen', value: '(' });
      i++;
    } else if (ch === ')') {
      tokens.push({ type: 'rparen', value: ')' });
      i++;
    } else {
      i++;
    }
  }
  return tokens;
};

// --- Parser (Recursive Descent) ---
let nodeIdCounter = 0;

class Parser {
  private tokens: Token[];
  private pos: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): ASTNode | null {
    nodeIdCounter = 0;
    if (this.tokens.length === 0) return null;
    return this.parseExpression();
  }

  private parseExpression(): ASTNode {
    return this.parseAddSub();
  }

  private parseAddSub(): ASTNode {
    let left = this.parseMulDiv();
    while (this.pos < this.tokens.length && 
           this.tokens[this.pos].type === 'operator' && 
           '+-'.includes(this.tokens[this.pos].value)) {
      const op = this.tokens[this.pos++].value;
      const right = this.parseMulDiv();
      left = { id: nodeIdCounter++, type: 'operator', value: op, left, right };
    }
    return left;
  }

  private parseMulDiv(): ASTNode {
    let left = this.parsePrimary();
    while (this.pos < this.tokens.length && 
           this.tokens[this.pos].type === 'operator' && 
           '*/'.includes(this.tokens[this.pos].value)) {
      const op = this.tokens[this.pos++].value;
      const right = this.parsePrimary();
      left = { id: nodeIdCounter++, type: 'operator', value: op, left, right };
    }
    return left;
  }

  private parsePrimary(): ASTNode {
    const token = this.tokens[this.pos];
    if (token.type === 'number') {
      this.pos++;
      return { id: nodeIdCounter++, type: 'number', value: parseFloat(token.value) };
    }
    if (token.type === 'lparen') {
      this.pos++;
      const node = this.parseExpression();
      if (this.tokens[this.pos]?.type === 'rparen') this.pos++;
      return node;
    }
    return { id: nodeIdCounter++, type: 'number', value: 0 };
  }
}

// --- Tree Layout ---
const layoutTree = (node: ASTNode | null, depth = 0, left = 0, right = 400): ASTNode | null => {
  if (!node) return null;
  const x = (left + right) / 2;
  const y = depth * 80 + 40;
  node.depth = depth;
  node.x = x;
  node.y = y;
  if (node.left) layoutTree(node.left, depth + 1, left, x);
  if (node.right) layoutTree(node.right, depth + 1, x, right);
  return node;
};

// --- Evaluation Order ---
const getEvalOrder = (node: ASTNode | null, order: ASTNode[] = []): ASTNode[] => {
  if (!node) return order;
  if (node.left) getEvalOrder(node.left, order);
  if (node.right) getEvalOrder(node.right, order);
  order.push(node);
  return order;
};

const evaluate = (node: ASTNode): number => {
  if (node.type === 'number') return node.value as number;
  const left = evaluate(node.left!);
  const right = evaluate(node.right!);
  switch (node.value) {
    case '+': return left + right;
    case '-': return left - right;
    case '*': return left * right;
    case '/': return right !== 0 ? left / right : 0;
    default: return 0;
  }
};


// --- Component ---
export default function ArithmeticEvaluationVisualization() {
  const [expression, setExpression] = useState('(1+3)*7');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [ast, setAst] = useState<ASTNode | null>(null);
  const [evalOrder, setEvalOrder] = useState<ASTNode[]>([]);
  const [currentEvalIndex, setCurrentEvalIndex] = useState(-1);
  const [phase, setPhase] = useState<'idle' | 'tokenizing' | 'parsing' | 'evaluating' | 'done'>('idle');
  const [finalResult, setFinalResult] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number>(0);

  // --- Audio ---
  const playSound = useCallback((type: 'token' | 'parse' | 'eval' | 'complete') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'token') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'parse') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'eval') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440 + currentEvalIndex * 80, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'complete') {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.1, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3 + i * 0.1);
        osc.start(now + i * 0.1);
        osc.stop(now + 0.4 + i * 0.1);
      });
    }
  }, [soundEnabled, currentEvalIndex]);

  // --- Run Pipeline ---
  const runPipeline = useCallback(() => {
    if (!expression.trim()) return;
    
    // Reset
    setPhase('tokenizing');
    setTokens([]);
    setAst(null);
    setEvalOrder([]);
    setCurrentEvalIndex(-1);
    setFinalResult(null);

    // Phase 1: Tokenize
    const newTokens = tokenize(expression);
    let tokenIdx = 0;
    
    const tokenizeStep = () => {
      if (tokenIdx < newTokens.length) {
        setTokens(newTokens.slice(0, tokenIdx + 1));
        playSound('token');
        tokenIdx++;
        animationRef.current = window.setTimeout(tokenizeStep, 150);
      } else {
        // Phase 2: Parse
        setPhase('parsing');
        playSound('parse');
        
        animationRef.current = window.setTimeout(() => {
          const parser = new Parser(newTokens);
          const tree = parser.parse();
          if (tree) {
            layoutTree(tree);
            setAst({ ...tree });
            
            // Phase 3: Evaluate
            animationRef.current = window.setTimeout(() => {
              setPhase('evaluating');
              const order = getEvalOrder(tree);
              setEvalOrder(order);
              
              let evalIdx = 0;
              const evalStep = () => {
                if (evalIdx < order.length) {
                  const node = order[evalIdx];
                  node.result = evaluate(node);
                  node.evaluated = true;
                  setCurrentEvalIndex(evalIdx);
                  setAst({ ...tree });
                  playSound('eval');
                  evalIdx++;
                  animationRef.current = window.setTimeout(evalStep, 500);
                } else {
                  setPhase('done');
                  setFinalResult(order[order.length - 1]?.result ?? null);
                  playSound('complete');
                }
              };
              evalStep();
            }, 600);
          }
        }, 400);
      }
    };
    
    tokenizeStep();
  }, [expression, playSound]);

  const reset = () => {
    clearTimeout(animationRef.current);
    setPhase('idle');
    setTokens([]);
    setAst(null);
    setEvalOrder([]);
    setCurrentEvalIndex(-1);
    setFinalResult(null);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'Enter') runPipeline();
      if (e.key === 'r' || e.key === 'R') reset();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [runPipeline]);

  // Render tree node
  const renderNode = (node: ASTNode) => {
    const isOperator = node.type === 'operator';
    const isEvaluated = node.evaluated;
    const isCurrent = evalOrder[currentEvalIndex]?.id === node.id;
    
    return (
      <g key={node.id}>
        {/* Lines to children */}
        {node.left && (
          <motion.line
            x1={node.x}
            y1={node.y! + 20}
            x2={node.left.x}
            y2={node.left.y! - 20}
            stroke={isEvaluated ? '#10b981' : '#334155'}
            strokeWidth={2}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
        {node.right && (
          <motion.line
            x1={node.x}
            y1={node.y! + 20}
            x2={node.right.x}
            y2={node.right.y! - 20}
            stroke={isEvaluated ? '#10b981' : '#334155'}
            strokeWidth={2}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
        
        {/* Node circle */}
        <motion.circle
          cx={node.x}
          cy={node.y}
          r={isCurrent ? 28 : 24}
          fill={isCurrent ? '#0891b2' : isEvaluated ? '#059669' : isOperator ? '#1e40af' : '#0f766e'}
          stroke={isCurrent ? '#22d3ee' : isEvaluated ? '#34d399' : '#475569'}
          strokeWidth={isCurrent ? 3 : 2}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />
        
        {/* Node value */}
        <text
          x={node.x}
          y={node.y! + 5}
          textAnchor="middle"
          fill="white"
          fontSize={isOperator ? 18 : 14}
          fontWeight="bold"
          fontFamily="monospace"
        >
          {node.value}
        </text>
        
        {/* Result badge */}
        {isEvaluated && node.result !== undefined && (
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <rect
              x={node.x! + 18}
              y={node.y! - 30}
              width={36}
              height={20}
              rx={4}
              fill="#10b981"
            />
            <text
              x={node.x! + 36}
              y={node.y! - 16}
              textAnchor="middle"
              fill="white"
              fontSize={11}
              fontWeight="bold"
              fontFamily="monospace"
            >
              {Number.isInteger(node.result) ? node.result : node.result.toFixed(2)}
            </text>
          </motion.g>
        )}
        
        {/* Render children */}
        {node.left && renderNode(node.left)}
        {node.right && renderNode(node.right)}
      </g>
    );
  };


  const getTokenColor = (type: string) => {
    switch (type) {
      case 'number': return '#10b981';
      case 'operator': return '#3b82f6';
      case 'lparen': case 'rparen': return '#f59e0b';
      default: return '#64748b';
    }
  };

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-blue-950/10 to-slate-950 rounded-xl border border-blue-900/30 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-blue-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <TreeDeciduous className="text-blue-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-blue-300 tracking-wide">SYNTAX TREE BUILDER</h2>
              <p className="text-xs text-blue-500/70">Parse • Build AST • Evaluate</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
              phase === 'idle' ? 'bg-slate-800 border-slate-700 text-slate-400' :
              phase === 'tokenizing' ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' :
              phase === 'parsing' ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' :
              phase === 'evaluating' ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' :
              'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
            }`}>
              {phase.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        
        {/* Input Section */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-xs text-blue-400 mb-2 block flex items-center gap-1">
                <GitBranch size={12} />
                Expression
              </label>
              <input
                type="text"
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                placeholder="e.g., (1+3)*7"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-lg text-blue-300 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                disabled={phase !== 'idle' && phase !== 'done'}
              />
            </div>
            <div className="flex gap-2 sm:items-end">
              <button
                onClick={runPipeline}
                disabled={phase !== 'idle' && phase !== 'done'}
                className={`flex-1 sm:flex-none px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                  phase !== 'idle' && phase !== 'done'
                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-wait'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/50 hover:bg-blue-500/30'
                }`}
              >
                <Play size={18} />
                BUILD
              </button>
              <button
                onClick={reset}
                className="px-3 py-3 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </div>
          
          {/* Presets */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-slate-500">Try:</span>
            {['(1+3)*7', '2+3*4', '(10-2)/(4-2)', '1+2+3+4', '8/4/2'].map(expr => (
              <button
                key={expr}
                onClick={() => setExpression(expr)}
                className="px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-slate-400 hover:text-blue-300 hover:border-blue-500/50 transition-all font-mono"
              >
                {expr}
              </button>
            ))}
          </div>
        </div>

        {/* Tokens Display */}
        {tokens.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/30 rounded-xl border border-slate-800 p-4"
          >
            <div className="text-xs text-amber-400 mb-3 flex items-center gap-2">
              <Zap size={12} />
              Tokens
            </div>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {tokens.map((token, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="px-3 py-2 rounded-lg border font-mono text-sm"
                    style={{
                      backgroundColor: `${getTokenColor(token.type)}15`,
                      borderColor: `${getTokenColor(token.type)}40`,
                      color: getTokenColor(token.type),
                    }}
                  >
                    <span className="text-[10px] opacity-60 mr-1">{token.type}</span>
                    <span className="font-bold">{token.value}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* AST Visualization */}
        {ast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/30 rounded-xl border border-slate-800 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-blue-400 flex items-center gap-2">
                <TreeDeciduous size={12} />
                Abstract Syntax Tree
              </div>
              {finalResult !== null && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/50 rounded-lg"
                >
                  <span className="text-emerald-400 text-sm">Result: </span>
                  <span className="text-emerald-300 text-xl font-bold font-mono">
                    {Number.isInteger(finalResult) ? finalResult : finalResult.toFixed(4)}
                  </span>
                </motion.div>
              )}
            </div>
            
            <div className="bg-slate-950/50 rounded-lg border border-slate-800 overflow-hidden">
              <svg viewBox="0 0 400 280" className="w-full h-64 md:h-80">
                {/* Grid background */}
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                
                {renderNode(ast)}
              </svg>
            </div>
            
            {/* Legend */}
            <div className="mt-3 flex flex-wrap gap-4 text-[10px]">
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-teal-700 border border-teal-600"></span>
                <span className="text-slate-400">Number</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-blue-800 border border-blue-600"></span>
                <span className="text-slate-400">Operator</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-cyan-700 border-2 border-cyan-400"></span>
                <span className="text-slate-400">Evaluating</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-emerald-600 border border-emerald-400"></span>
                <span className="text-slate-400">Evaluated</span>
              </span>
            </div>
          </motion.div>
        )}

        {/* Pipeline Steps */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { step: 1, label: 'Tokenize', desc: 'Break into tokens', phase: 'tokenizing', color: 'amber' },
            { step: 2, label: 'Parse', desc: 'Build AST', phase: 'parsing', color: 'blue' },
            { step: 3, label: 'Evaluate', desc: 'Compute result', phase: 'evaluating', color: 'emerald' },
          ].map(({ step, label, desc, phase: p, color }) => {
            const isActive = phase === p;
            const isDone = ['tokenizing', 'parsing', 'evaluating', 'done'].indexOf(phase) > 
                          ['tokenizing', 'parsing', 'evaluating', 'done'].indexOf(p);
            return (
              <div
                key={step}
                className={`p-3 rounded-lg border transition-all ${
                  isActive 
                    ? `bg-${color}-500/20 border-${color}-500/50` 
                    : isDone 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : 'bg-slate-900/30 border-slate-800'
                }`}
                style={{
                  backgroundColor: isActive ? `var(--${color}-bg, rgba(59,130,246,0.2))` : undefined,
                  borderColor: isActive ? `var(--${color}-border, rgba(59,130,246,0.5))` : undefined,
                }}
              >
                <div className={`text-lg font-bold ${isActive ? 'text-blue-300' : isDone ? 'text-emerald-400' : 'text-slate-600'}`}>
                  {isDone ? '✓' : step}
                </div>
                <div className={`text-xs font-bold ${isActive ? 'text-blue-300' : isDone ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {label}
                </div>
                <div className="text-[10px] text-slate-600">{desc}</div>
              </div>
            );
          })}
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Enter</kbd> Build
          </span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-blue-400 hover:text-blue-300 transition-colors">
          How does expression parsing work?
        </summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            <span className="text-blue-300">Tokenization</span> breaks the input string into meaningful units: 
            numbers, operators (+, -, *, /), and parentheses.
          </p>
          <p>
            <span className="text-blue-300">Parsing</span> uses recursive descent to build an AST that respects 
            operator precedence: * and / bind tighter than + and -.
          </p>
          <p>
            <span className="text-blue-300">Evaluation</span> traverses the tree bottom-up (post-order), 
            computing leaf values first, then combining them at operator nodes.
          </p>
        </div>
      </details>
    </div>
  );
}
