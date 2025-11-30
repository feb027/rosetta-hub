import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Approximate Equality',
  slug: 'approximate-equality',
  difficulty: 'medium',
  tags: ['math', 'algorithm'],
  description: `Sometimes when testing floating point calculations, the difference between implementations becomes significant. A difference between 32-bit and 64-bit floating point can appear by about the 8th significant digit.

The task is to create a function that returns true if two floating point numbers are approximately equal, accounting for differences in magnitude.

For example, 100000000000000.01 may be approximately equal to 100000000000000.011, even though 100.01 is not approximately equal to 100.011.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Approximate_equality',
  createdAt: '2025-11-30',
  previewImage: '/previews/approximate-equality.png',
};
