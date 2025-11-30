import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Arithmetic Derivative',
  slug: 'arithmetic-derivative',
  difficulty: 'medium',
  tags: ['math', 'number-theory', 'recursion'],
  description: `The arithmetic derivative (Lagarias arithmetic derivative) is a function defined for integers based on prime factorization, by analogy with the product rule for derivatives.

For natural numbers n, the arithmetic derivative D(n) is defined as:
• D(0) = D(1) = 0
• D(p) = 1 for any prime p
• D(mn) = D(m)·n + m·D(n) for any m, n ∈ N (Leibniz rule)

For negative integers: D(-n) = -D(n) for n < 0.

This visualization shows the step-by-step computation of arithmetic derivatives, revealing the beautiful recursive structure based on prime factorization.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Arithmetic_derivative',
  createdAt: '2025-11-30',
  previewImage: '/previews/arithmetic-derivative.png',
};
