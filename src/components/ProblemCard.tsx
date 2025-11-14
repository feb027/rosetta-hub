import { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Code2, Layers, Zap } from 'lucide-react';
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

// Tech stack for visualizations (you can customize per problem later)
const TECH_STACK = [
  { icon: Code2, label: 'React', color: 'text-cyan-400' },
  { icon: Layers, label: 'Motion', color: 'text-purple-400' },
  { icon: Zap, label: 'TypeScript', color: 'text-blue-400' },
];

function ProblemCard({ title, slug, difficulty, tags, createdAt, previewImage }: ProblemCardProps) {
  // Format date if available
  const formattedDate = createdAt 
    ? new Date(createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  return (
    <Link 
      to={`/visualizations/${slug}`} 
      className="block h-full w-full group"
      aria-label={`View ${title} problem - ${DIFFICULTY_LABELS[difficulty]} difficulty`}
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
          {/* Background Preview Image */}
          {previewImage && (
            <div className="absolute inset-0 opacity-15 group-hover:opacity-30 transition-opacity duration-300 z-0">
              <img 
                src={previewImage} 
                alt="" 
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  console.error('Failed to load preview image:', previewImage);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          
          {/* Glass Layer 1 - Base */}
          <div className="absolute inset-0 glass rounded-xl border border-slate-600/50 group-hover:border-cyan-500/50 transition-all duration-300" />
          
          {/* Glass Layer 2 - Depth on Hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800/0 via-slate-800/0 to-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
          
          {/* Content */}
          <div className="relative p-6 h-full flex flex-col gap-4 z-10">
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

            {/* Tech Stack Icons Row */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-700/50 mt-auto">
              {TECH_STACK.map((tech, index) => (
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
                Interactive Visualization
              </span>
            </div>
          </div>

          {/* Hover Glow Effect */}
          <div className={`absolute inset-0 bg-gradient-to-br ${DIFFICULTY_GRADIENTS[difficulty]} opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-300 pointer-events-none`} />
        </div>

        {/* Focus Ring */}
        <div className="absolute inset-0 rounded-xl ring-2 ring-transparent group-focus-within:ring-cyan-400 transition-all duration-300" />
      </motion.div>
    </Link>
  );
}

export default memo(ProblemCard);
