import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Algebraic Data Types',
  slug: 'algebraic-data-types',
  difficulty: 'hard',
  tags: ['data-structure', 'algorithm', 'tree'],
  description: `Algebraic data types (ADTs) allow languages to express complex data structures with pattern matching. This visualization demonstrates ADTs through a Red-Black Tree implementation.

A Red-Black Tree is a self-balancing binary search tree where each node has a color (red or black). The tree maintains balance through these properties:
• No red node can have a red child
• Every path from root to leaf has the same number of black nodes

Watch as insertions trigger rotations and color flips to maintain balance, demonstrating how ADTs elegantly represent tree transformations.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Algebraic_data_types',
  createdAt: '2025-11-30',
  previewImage: '/previews/algebraic-data-types.png',
};
