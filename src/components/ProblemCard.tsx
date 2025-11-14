import { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import type { Difficulty, Tag } from '../types/problem';
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS } from '../constants/colors';

interface ProblemCardProps {
  title: string;
  slug: string;
  difficulty: Difficulty;
  tags: Tag[];
}

function ProblemCard({ title, slug, difficulty, tags }: ProblemCardProps) {
  return (
    <Link 
      to={`/visualizations/${slug}`} 
      className="block h-full w-full"
      aria-label={`View ${title} problem - ${DIFFICULTY_LABELS[difficulty]} difficulty`}
    >
      <motion.div
        initial={{ scale: 1 }}
        whileHover={{
          scale: 1.02,
          boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)',
          transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] }
        }}
        whileTap={{ scale: 0.98 }}
        className="glass rounded-xl p-6 h-full w-full flex flex-col gap-4 border border-transparent hover:border-cyan-500/50 transition-colors duration-250 focus-within:ring-2 focus-within:ring-cyan-400 focus-within:outline-none"
      >
        {/* Title */}
        <h3 className="text-xl font-semibold text-slate-100 line-clamp-2">
          {title}
        </h3>

        {/* Difficulty Badge */}
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${DIFFICULTY_COLORS[difficulty]}`}>
            {DIFFICULTY_LABELS[difficulty]}
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-auto">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs rounded-md bg-slate-700/50 text-slate-300 border border-slate-600/50 backdrop-blur-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </motion.div>
    </Link>
  );
}

export default memo(ProblemCard);
