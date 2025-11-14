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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
      <AnimatePresence mode="sync">
        {problems.map((problem) => (
          <motion.div
            key={problem.slug}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              duration: 0.2,
              ease: [0.4, 0, 0.2, 1]
            }}
            className="h-full flex"
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
    </div>
  );
}
