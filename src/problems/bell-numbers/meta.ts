import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Bell Numbers',
  slug: 'bell-numbers',
  difficulty: 'medium',
  tags: ['math', 'combinatorics', 'algorithm', 'dynamic-programming'],
  description: `Bell or exponential numbers enumerate the number of different ways to partition a set that has exactly n elements. Each element of the sequence Bₙ is the number of partitions of a set of size n where order of the elements and order of the partitions are non-significant.

B₀ = 1 (one way to partition empty set: {})
B₁ = 1 (one way: {a})
B₂ = 2 (two ways: {a}{b}, {a b})
B₃ = 5 (five ways: {a}{b}{c}, {a b}{c}, {a}{b c}, {a c}{b}, {a b c})

A simple way to find Bell numbers is to construct a Bell triangle (Aitken's array), reading off the first column of each row.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Bell_numbers',
  createdAt: '2025-11-30',
  previewImage: '/previews/bell-numbers.png',
};
