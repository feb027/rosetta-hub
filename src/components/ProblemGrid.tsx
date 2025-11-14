import { motion, AnimatePresence } from 'motion/react';
import ProblemCard from './ProblemCard';
import EmptyState from './EmptyState';
import SkeletonCard from './SkeletonCard';
import type { ProblemMeta } from '../types/problem';

interface ProblemGridProps {
  problems: ProblemMeta[];
  onClearFilters: () => void;
  isLoading?: boolean;
}

export default function ProblemGrid({ problems, onClearFilters, isLoading = false }: ProblemGridProps) {
  // Show skeleton cards while loading
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
        {Array.from({ length: 8 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  if (problems.length === 0) {
    return <EmptyState onClearFilters={onClearFilters} />;
  }

  return (
    <motion.div
      layout
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8"
    >
      <AnimatePresence mode="popLayout">
        {problems.map((problem) => (
          <motion.div
            key={problem.slug}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
              layout: { duration: 0.3 }
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
    </motion.div>
  );
}
