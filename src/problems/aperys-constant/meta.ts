import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: "Apéry's Constant",
  slug: 'aperys-constant',
  difficulty: 'hard',
  tags: ['math', 'number-theory', 'algorithm', 'optimization'],
  description: `Apéry's constant is the sum of the reciprocals of positive cubes: ζ(3) = 1/1³ + 1/2³ + 1/3³ + ...

This constant was proven irrational by Roger Apéry in 1978. The task demonstrates three different calculation methods:
1. Direct summation of reciprocal cubes (slow convergence)
2. Markov/Apéry representation (~0.63 digits per term)
3. Wedeniwski representation (~5.04 digits per term)

Watch as different series converge at dramatically different rates toward the same transcendental value.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Ap%C3%A9ry%27s_constant',
  createdAt: '2025-11-30',
  previewImage: '/previews/aperys-constant.png',
};
