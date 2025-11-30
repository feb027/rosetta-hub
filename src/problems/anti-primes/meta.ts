import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Anti-primes',
  slug: 'anti-primes',
  difficulty: 'easy',
  tags: ['math', 'number-theory', 'algorithm'],
  description: `Anti-primes (or highly composite numbers, sequence A002182 in the OEIS) are the natural numbers with more factors than any smaller number.

For example, 12 is an anti-prime because it has 6 divisors (1, 2, 3, 4, 6, 12), which is more than any number less than 12.

The task is to generate and display the first twenty anti-primes.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Anti-primes',
  createdAt: '2025-11-30',
  previewImage: '/previews/anti-primes.png',
};
