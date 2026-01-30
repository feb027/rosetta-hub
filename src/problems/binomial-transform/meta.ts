import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Binomial Transform',
  slug: 'binomial-transform',
  difficulty: 'hard',
  tags: ['math', 'algorithm', 'visualization'],
  description: `The binomial transform is a sequence transformation based on convolution with binomial coefficients.

Forward: b_n = Σ(k=0 to n) C(n,k) × a_k
Inverse: a_n = Σ(k=0 to n) (-1)^(n-k) × C(n,k) × b_k

Test sequences:
- Catalan numbers: 1, 1, 2, 5, 14, 42, 132, 429, 1430, 4862...
- Prime flip flop: 0, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0...
- Fibonacci: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34...

Visualize Pascal's triangle and the transformation process.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Binomial_transform',
  createdAt: '2025-01-31',
  previewImage: '/previews/binomial-transform.png',
};
