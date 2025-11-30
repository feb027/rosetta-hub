import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Arithmetic Numbers',
  slug: 'arithmetic-numbers',
  difficulty: 'easy',
  tags: ['math', 'number-theory', 'algorithm'],
  description: `A positive integer n is an arithmetic number if the average of its positive divisors is also an integer.

For example, 30 is arithmetic because its 7 divisors are [1, 2, 3, 5, 6, 10, 15, 30], their sum is 72, and 72/8 = 9 is an integer.

All odd primes are arithmetic (divisors 1 and p, sum is even, average is integer). However, 2 is NOT arithmetic because (1+2)/2 = 1.5.

This visualization lets you explore arithmetic numbers, see their divisors, and understand why some numbers qualify while others don't.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Arithmetic_numbers',
  createdAt: '2025-11-30',
  previewImage: '/previews/arithmetic-numbers.png',
};
