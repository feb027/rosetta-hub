import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Atomic Updates',
  slug: 'atomic-updates',
  difficulty: 'medium',
  tags: ['simulation', 'data-structure', 'algorithm'],
  description: `Define a data type consisting of 'buckets', each containing a nonnegative integer value. Support atomic operations to transfer amounts between buckets while preserving the total sum. Demonstrates concurrent-safe operations with equalizing and redistributing tasks.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Atomic_updates',
  createdAt: '2025-11-30',
};
