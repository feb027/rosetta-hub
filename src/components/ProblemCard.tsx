import { memo } from 'react';
import { Link } from 'react-router-dom';
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
  Puzzle
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
  'graph': { icon: Network, label: 'Graph', color: 'text-indigo-400' },
  'dynamic-programming': { icon: Sparkles, label: 'Dynamic Programming', color: 'text-violet-400' },
  'greedy': { icon: Target, label: 'Greedy', color: 'text-emerald-400' },
  'simulation': { icon: Activity, label: 'Simulation', color: 'text-teal-400' },
  'optimization': { icon: Target, label: 'Optimization', color: 'text-red-400' },
  'game': { icon: Gamepad2, label: 'Game', color: 'text-fuchsia-400' },
  'puzzle': { icon: Puzzle, label: 'Puzzle', color: 'text-amber-400' },
};

// Get icons for a problem based on its tags
function getIconsForTags(tags: Tag[]): Array<{ icon: LucideIcon; label: string; color: string }> {
  // Prioritize certain tags for display
  const priorityOrder: Tag[] = [
    'game',
    'algorithm',
    'data-structure',
    'graph',
    'dynamic-programming',
    'sorting',
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
  // Format date if available
  const formattedDate = createdAt 
    ? new Date(createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  // Get contextual icons based on tags
  const techIcons = getIconsForTags(tags);

  return (
    <>
      <Link 
        to={`/visualizations/${slug}`} 
        className="block h-full w-full group"
        aria-label={`View ${title} problem - ${DIFFICULTY_LABELS[difficulty]} difficulty`}
        data-tooltip-id={`preview-${slug}`}
        data-tooltip-place="top"
      >
      <motion.div
        initial={{ scale: 1, y: 0 }}
        whileHover={{
          scale: 1.03,
          y: -8,
          transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
        }}
        whileTap={{ scale: 0.98 }}
        className="relative h-full w-full overflow-hidden rounded-xl"
      >
        {/* Difficulty Gradient Border */}
        <div className={`absolute inset-0 bg-gradient-to-br ${DIFFICULTY_GRADIENTS[difficulty]} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl`} />
        
        {/* Main Card with Glassmorphism Layers */}
        <div className="relative h-full flex flex-col">
          {/* Background Preview Image - BOTTOM LAYER */}
          {previewImage && (
            <div className="absolute inset-0 z-0 overflow-hidden">
              <img 
                src={previewImage} 
                alt="" 
                loading="lazy"
                decoding="async"
                className="w-full h-full object-contain object-center rounded-xl opacity-20 group-hover:opacity-40 transition-opacity duration-300 scale-90"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          
          {/* Glass Layer 1 - Base - MIDDLE LAYER */}
          <div className="absolute inset-0 z-[1] glass rounded-xl border border-slate-600/50 group-hover:border-cyan-500/50 transition-all duration-300" />
          
          {/* Glass Layer 2 - Depth on Hover - MIDDLE LAYER */}
          <div className="absolute inset-0 z-[2] bg-gradient-to-br from-slate-800/0 via-slate-800/0 to-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
          
          {/* Content - TOP LAYER */}
          <div className="relative p-6 h-full flex flex-col gap-4 z-[10]">
            {/* Corner Accent Decoration */}
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${DIFFICULTY_GRADIENTS[difficulty]} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity duration-300`} />
            
            {/* Date Badge */}
            {formattedDate && (
              <div className="absolute top-4 right-4 px-2 py-1 rounded-md bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 text-[10px] text-slate-400 font-medium">
                {formattedDate}
              </div>
            )}

            {/* Title */}
            <h2 className="text-xl font-semibold text-slate-100 line-clamp-2 group-hover:text-cyan-300 transition-colors duration-300">
              {title}
            </h2>

            {/* Difficulty Badge */}
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${DIFFICULTY_COLORS[difficulty]} group-hover:scale-105 transition-transform duration-300`}>
                {DIFFICULTY_LABELS[difficulty]}
              </span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-auto">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs rounded-md bg-slate-700/50 text-slate-300 border border-slate-600/50 backdrop-blur-sm group-hover:bg-slate-700/70 group-hover:border-slate-500/50 transition-all duration-300"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="px-2 py-1 text-xs rounded-md bg-slate-700/50 text-slate-400 border border-slate-600/50 backdrop-blur-sm">
                  +{tags.length - 3}
                </span>
              )}
            </div>

            {/* Contextual Icons Row */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-700/50 mt-auto">
              {techIcons.map((tech, index) => (
                <div
                  key={index}
                  className="group/icon relative"
                  title={tech.label}
                >
                  <tech.icon 
                    size={16} 
                    className={`${tech.color} opacity-60 group-hover:opacity-100 transition-opacity duration-300`}
                  />
                </div>
              ))}
              <span className="ml-auto text-[10px] text-slate-500 group-hover:text-slate-400 transition-colors duration-300">
                Interactive
              </span>
            </div>
          </div>

          {/* Hover Glow Effect */}
          <div className={`absolute inset-0 z-[3] bg-gradient-to-br ${DIFFICULTY_GRADIENTS[difficulty]} opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-300 pointer-events-none`} />
        </div>

        {/* Click Feedback Overlay */}
        <div className="absolute inset-0 z-[20] bg-cyan-400/0 group-active:bg-cyan-400/10 transition-colors duration-150 rounded-xl pointer-events-none" />

        {/* Focus Ring */}
        <div className="absolute inset-0 z-[30] rounded-xl ring-2 ring-transparent group-focus-within:ring-cyan-400 transition-all duration-300 pointer-events-none" />
      </motion.div>
    </Link>

    {/* Preview Tooltip - Positioned Above Card */}
    {previewImage && (
      <Tooltip
        id={`preview-${slug}`}
        delayHide={0}
        delayShow={300}
        className="!p-0 !bg-transparent !border-0 !shadow-2xl !opacity-100"
        style={{ zIndex: 9999 }}
      >
        <div className="relative w-96 h-64 rounded-xl overflow-hidden border-2 border-cyan-500/50 shadow-2xl bg-slate-900">
          <img 
            src={previewImage} 
            alt={`Preview of ${title}`}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
            <h3 className="text-white font-semibold text-lg">{title}</h3>
            <p className="text-slate-300 text-sm">{DIFFICULTY_LABELS[difficulty]} • Interactive Visualization</p>
          </div>
        </div>
      </Tooltip>
    )}
  </>
  );
}

export default memo(ProblemCard);
