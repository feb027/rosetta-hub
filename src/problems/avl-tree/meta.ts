import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'AVL Tree',
  slug: 'avl-tree',
  difficulty: 'hard',
  tags: ['data-structure', 'tree', 'algorithm', 'search'],
  description: `Implement an AVL tree - a self-balancing binary search tree where the heights of two child subtrees differ by at most one. When they differ by more, rebalancing is done via rotations. AVL trees provide O(log n) lookup, insertion, and deletion in both average and worst cases.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/AVL_tree',
  createdAt: '2025-11-30',
  previewImage: '/previews/avl-tree.png',
};
