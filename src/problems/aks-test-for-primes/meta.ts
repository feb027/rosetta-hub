import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'AKS Test for Primes',
  slug: 'aks-test-for-primes',
  difficulty: 'hard',
  tags: ['algorithm', 'math', 'number-theory'],
  description: `The AKS algorithm tests whether a number p is prime by checking if all coefficients of the polynomial expansion (x-1)^p - (x^p - 1) are divisible by p.

This visualization demonstrates the polynomial expansion, coefficient extraction, and divisibility testing step by step. Watch as Pascal's triangle coefficients are computed and verified against the primality condition.

Note: This is not the full AKS primality test (which runs in polynomial time), but rather the elementary theorem it's based on, discovered in the late 1600s.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/AKS_test_for_primes',
  createdAt: '2025-11-30',
  previewImage: '/previews/aks-test-for-primes.png',
};
