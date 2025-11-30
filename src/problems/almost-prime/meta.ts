import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Almost Prime',
  slug: 'almost-prime',
  difficulty: 'medium',
  tags: ['math', 'number-theory', 'algorithm'],
  description: `A k-Almost-prime is a natural number n that is the product of k (possibly identical) primes.

1-almost-primes (k=1) are the prime numbers themselves.
2-almost-primes (k=2) are the semiprimes (products of exactly two primes).

The task is to generate k-almost primes and display the first ten members for k values from 1 to 5.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Almost_prime',
  createdAt: '2025-11-30',
  previewImage: '/previews/almost-prime.png',
};
