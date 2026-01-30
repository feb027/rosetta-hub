import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: "Bernoulli's Triangle",
  slug: 'bernoullis-triangle',
  difficulty: 'medium',
  tags: ['math', 'algorithm', 'visualization'],
  description: `Bernoulli's Triangle is an array of partial sums of binomial coefficients. For any non-negative integer n and integer k (0 <= k <= n), the term in row n and column k is the sum of the first k+1 binomial coefficients of order n.

It shares interesting properties with Pascal's Triangle:
- The rows are partial sums of Pascal's triangle rows.
- The rightmost falling diagonal contains powers of two.
- The second rightmost falling diagonal contains Mersenne numbers.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Bernoulli%27s_triangle',
  createdAt: '2025-01-30',
};
