import { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ArrowUpDown, 
  Binary, 
  Network, 
  Boxes, 
  Calculator, 
  Type, 
  Repeat, 
  Sparkles, 
  Target, 
  Activity,
  Gamepad2,
  Puzzle,
  Search,
  Monitor,
  Sigma,
  Cpu,
  Undo2,
  Grid,
  Palette,
  SigmaSquare,
  Box,
  Code2,
  RefreshCw
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import type { Difficulty, Tag } from '../types/problem';
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS } from '../constants/colors';

interface ProblemCardProps {
  title: string;
  slug: string;
  difficulty: Difficulty;
  tags: Tag[];
  createdAt?: string;
  previewImage?: string;
}

// Difficulty gradient borders
const DIFFICULTY_GRADIENTS = {
  easy: 'from-green-500/50 to-emerald-500/50',
  medium: 'from-yellow-500/50 to-orange-500/50',
  hard: 'from-red-500/50 to-pink-500/50',
};

// Tag to icon mapping
const TAG_ICONS: Record<Tag, { icon: LucideIcon; label: string; color: string }> = {
  'algorithm': { icon: Binary, label: 'Algorithm', color: 'text-cyan-400' },
  'data-structure': { icon: Boxes, label: 'Data Structure', color: 'text-purple-400' },
  'math': { icon: Calculator, label: 'Math', color: 'text-blue-400' },
  'string': { icon: Type, label: 'String', color: 'text-green-400' },
  'array': { icon: Boxes, label: 'Array', color: 'text-orange-400' },
  'recursion': { icon: Repeat, label: 'Recursion', color: 'text-pink-400' },
  'sorting': { icon: ArrowUpDown, label: 'Sorting', color: 'text-yellow-400' },
  'search': { icon: Search, label: 'Search', color: 'text-sky-400' },
  'graph': { icon: Network, label: 'Graph', color: 'text-indigo-400' },
  'dynamic-programming': { icon: Sparkles, label: 'Dynamic Programming', color: 'text-violet-400' },
  'greedy': { icon: Target, label: 'Greedy', color: 'text-emerald-400' },
  'simulation': { icon: Activity, label: 'Simulation', color: 'text-teal-400' },
  'optimization': { icon: Target, label: 'Optimization', color: 'text-red-400' },
  'game': { icon: Gamepad2, label: 'Game', color: 'text-fuchsia-400' },
  'puzzle': { icon: Puzzle, label: 'Puzzle', color: 'text-amber-400' },
  'visualization': { icon: Monitor, label: 'Visualization', color: 'text-cyan-400' },
  'combinatorics': { icon: Sigma, label: 'Combinatorics', color: 'text-blue-400' },
  'loop': { icon: Repeat, label: 'Loop', color: 'text-pink-400' },
  'processing': { icon: Cpu, label: 'Processing', color: 'text-emerald-400' },
  'backtracking': { icon: Undo2, label: 'Backtracking', color: 'text-rose-400' },
  'cellular-automaton': { icon: Grid, label: 'Cellular Automaton', color: 'text-emerald-400' },
  'graphics': { icon: Palette, label: 'Graphics', color: 'text-fuchsia-400' },
  'algebra': { icon: SigmaSquare, label: 'Algebra', color: 'text-indigo-400' },
  'number-theory': { icon: Calculator, label: 'Number Theory', color: 'text-violet-400' },
  'closure': { icon: Box, label: 'Closure', color: 'text-amber-600' },
  'function': { icon: Code2, label: 'Function', color: 'text-blue-500' },
  'generator': { icon: RefreshCw, label: 'Generator', color: 'text-purple-500' },
  'animation': { icon: Activity, label: 'Animation', color: 'text-rose-400' },
  'validation': { icon: Target, label: 'Validation', color: 'text-emerald-400' },
};

function getIconsForTags(tags: Tag[]) {
  // Prioritize certain tags for display
  const priorityOrder: Tag[] = [
    'game',
    'puzzle',
    'algorithm',
    'data-structure',
    'graph',
    'dynamic-programming',
    'sorting',
    'search',
    'recursion',
    'math',
    'simulation',
    'string',
    'array',
    'greedy',
    'optimization',
  ];

  const icons: Array<{ icon: LucideIcon; label: string; color: string }> = [];
  const seenIcons = new Set<LucideIcon>();

  // Add icons based on priority
  for (const tag of priorityOrder) {
    if (tags.includes(tag)) {
      const iconData = TAG_ICONS[tag];
      // Avoid duplicate icons (e.g., array and data-structure both use Boxes)
      if (!seenIcons.has(iconData.icon)) {
        icons.push(iconData);
        seenIcons.add(iconData.icon);
        if (icons.length >= 3) break;
      }
    }
  }

  // If we still need more icons, add remaining tags
  if (icons.length < 3) {
    for (const tag of tags) {
      if (!priorityOrder.includes(tag)) {
        const iconData = TAG_ICONS[tag];
        if (!seenIcons.has(iconData.icon)) {
          icons.push(iconData);
          seenIcons.add(iconData.icon);
          if (icons.length >= 3) break;
        }
      }
    }
  }

  return icons;
}

function ProblemCard({ title, slug, difficulty, tags, createdAt, previewImage }: ProblemCardProps) {
  const location = useLocation();
  
  // Format date if available
  const formattedDate = createdAt 
    ? new Date(createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  // Get contextual icons based on tags
  const techIcons = getIconsForTags(tags);
  
  // Preserve current URL with search params for back navigation
  const currentUrl = location.pathname + location.search;

  // Mouse move handler for spotlight effect
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const { currentTarget: target } = e;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    target.style.setProperty("--mouse-x", `${x}px`);
    target.style.setProperty("--mouse-y", `${y}px`);
  }

  return (
    <>
      <Link 
        to={`/visualizations/${slug}`} 
        state={{ from: currentUrl }}
        className="block h-full w-full group relative"
        aria-label={`View ${title} problem - ${DIFFICULTY_LABELS[difficulty]} difficulty`}
        data-tooltip-id={`preview-${slug}`}
        data-tooltip-place="top"
      >
      <motion.div
        initial={{ scale: 1, y: 0 }}
        whileHover={{
          scale: 1.02,
          y: -5,
          transition: { duration: 0.3, ease: "easeOut" }
        }}
        whileTap={{ scale: 0.98 }}
        onMouseMove={handleMouseMove}
        className="relative h-full w-full overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors duration-300 group-hover:shadow-2xl group-hover:shadow-cyan-500/10"
      >
        {/* Spotlight Effect */}
        <div 
          className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
          style={{
            background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(34, 211, 238, 0.15), transparent 40%)`
          }}
        />

        {/* Difficulty Gradient Border (Subtle) */}
        <div className={`absolute inset-0 bg-gradient-to-br ${DIFFICULTY_GRADIENTS[difficulty]} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
        
        {/* Main Card Content */}
        <div className="relative h-full flex flex-col z-20">
          {/* Background Preview Image - Subtle */}
          {previewImage && (
            <div className="absolute inset-0 z-0 overflow-hidden">
              <img 
                src={previewImage} 
                alt="" 
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover object-center opacity-[0.08] group-hover:opacity-[0.15] transition-opacity duration-500 scale-105 group-hover:scale-110 transform"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/40" />
            </div>
          )}
          
          {/* Content Container */}
          <div className="relative p-6 h-full flex flex-col gap-4">
            
            {/* Header: Date & Difficulty */}
            <div className="flex justify-between items-start">
               <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${DIFFICULTY_COLORS[difficulty]} bg-opacity-10`}>
                {DIFFICULTY_LABELS[difficulty]}
              </span>
              {formattedDate && (
                <span className="text-[10px] text-slate-500 font-medium font-mono">
                  {formattedDate}
                </span>
              )}
            </div>

            {/* Title */}
            <h2 className="text-lg md:text-xl font-bold text-slate-100 line-clamp-2 group-hover:text-cyan-300 transition-colors duration-300 leading-tight">
              {title}
            </h2>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mt-auto">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-[10px] rounded-md bg-slate-800/80 text-slate-400 border border-slate-700/50 group-hover:border-slate-600 transition-colors"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="px-2 py-1 text-[10px] rounded-md bg-slate-800/50 text-slate-500 border border-slate-700/30">
                  +{tags.length - 3}
                </span>
              )}
            </div>

            {/* Footer: Icons & Label */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-800/50 mt-2">
              <div className="flex -space-x-2">
                {techIcons.map((tech, index) => (
                  <div
                    key={index}
                    className="relative z-10 bg-slate-900 rounded-full p-1 ring-2 ring-slate-900 group-hover:ring-slate-800 transition-all"
                    title={tech.label}
                  >
                    <tech.icon 
                      size={14} 
                      className={`${tech.color}`}
                    />
                  </div>
                ))}
              </div>
              <span className="ml-auto text-[10px] font-medium text-slate-500 group-hover:text-cyan-400 transition-colors flex items-center gap-1">
                Explore <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>

    {/* Preview Tooltip */}
    {previewImage && (
      <Tooltip
        id={`preview-${slug}`}
        delayHide={0}
        delayShow={400}
        className="!p-0 !bg-transparent !border-0 !shadow-2xl !opacity-100 z-50"
        style={{ zIndex: 9999 }}
        offset={20}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative w-80 h-56 rounded-xl overflow-hidden border border-slate-700 shadow-2xl bg-slate-900"
        >
          <img 
            src={previewImage} 
            alt={`Preview of ${title}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-white font-bold text-sm">{title}</h3>
            <p className="text-cyan-400 text-xs font-medium mt-0.5">Interactive Visualization</p>
          </div>
        </motion.div>
      </Tooltip>
    )}
  </>
  );
}

export default memo(ProblemCard);
