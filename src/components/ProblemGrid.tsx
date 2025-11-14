import { motion, AnimatePresence } from 'motion/react';
import ProblemCard from './ProblemCard';
import EmptyState from './EmptyState';
import type { ProblemMeta } from '../types/problem';

interface ProblemGridProps {
  problems: ProblemMeta[];
  onClearFilters: () => void;
}

export default function ProblemGrid({ problems, onClearFilters }: ProblemGridProps) {
  if (problems.length === 0) {
    return <EmptyState onClearFilters={onClearFilters} />;
  }

  return (
    <motion.div
      layout
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8"
    >
      <AnimatePresence mode="popLayout">
        {problems.map((problem, index) => (
          <motion.div
            key={problem.slug}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              duration: 0.3,
              delay: index * 0.05,
              ease: [0.4, 0, 0.2, 1]
            }}
          >
            <ProblemCard
              title={problem.title}
              slug={problem.slug}
              difficulty={problem.difficulty}
              tags={problem.tags}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
