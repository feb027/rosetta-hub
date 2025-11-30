import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Additive Primes',
  slug: 'additive-primes',
  difficulty: 'easy',
  tags: ['math', 'number-theory', 'algorithm'],
  description: `In mathematics, additive primes are prime numbers for which the sum of their decimal digits is also prime.

For example, 23 is an additive prime because:
• 23 is prime
• 2 + 3 = 5, which is also prime

The task is to find all additive primes less than 500. There are 54 such primes.

This problem combines primality testing with digit manipulation, making it a great exercise in number theory fundamentals.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Additive_primes',
  createdAt: '2025-11-30',
  previewImage: '/previews/additive-primes.png',
};
