import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Ascending Primes',
  slug: 'ascending-primes',
  difficulty: 'medium',
  tags: ['math', 'number-theory', 'algorithm'],
  description: `Generate and show all primes with strictly ascending decimal digits.

An ascending prime has digits that increase from left to right (e.g., 2, 13, 37, 137, 1279).

There are exactly 511 ascending primes. The smallest is 2 and the largest is 123456789. Finding them efficiently requires clever generation rather than brute-force filtering.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Ascending_primes',
  createdAt: '2025-11-30',
  previewImage: '/previews/ascending-primes.png',
};
