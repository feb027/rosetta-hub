import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Associative Array/Merging',
  slug: 'associative-array-merging',
  difficulty: 'easy',
  tags: ['data-structure', 'array', 'algorithm'],
  description: `Merge two associative arrays (dictionaries/maps) into a new one. The base array provides default values, while the update array overrides any matching keys. The result contains all keys from both arrays, with update values taking precedence.

This is a fundamental operation in many programming scenarios: configuration merging, state updates, object spreading, and data reconciliation.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Associative_array/Merging',
  createdAt: '2025-11-30',
  previewImage: '/previews/associative-array-merging.png',
};
