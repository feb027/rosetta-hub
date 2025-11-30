import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Berlekamp-Massey Algorithm',
  slug: 'berlekamp-massey',
  difficulty: 'hard',
  tags: ['algorithm', 'cryptography', 'math', 'dynamic-programming'],
  description: `The Berlekamp-Massey algorithm finds the shortest linear feedback shift register (LFSR) that generates a given sequence over a finite field. It determines the minimal polynomial of a linearly recurrent sequence.

Given a sequence s₀, s₁, ..., sₙ₋₁, the algorithm computes the connection polynomial C(x) = 1 + c₁x + c₂x² + ... + cₗxᴸ such that the sequence satisfies the recurrence relation.

The algorithm iteratively constructs C(x) by processing each element and updating when a discrepancy is found between predicted and actual values. The degree L is the linear complexity of the sequence.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Berlekamp-Massey_algorithm',
  createdAt: '2025-11-30',
  previewImage: '/previews/berlekamp-massey.png',
};
