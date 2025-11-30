import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Attractive Numbers',
  slug: 'attractive-numbers',
  difficulty: 'easy',
  tags: ['math', 'number-theory', 'algorithm'],
  description: `A number is an attractive number if the count of its prime factors (with repetition) is itself prime.

For example, 20 = 2 × 2 × 5 has 3 prime factors, and 3 is prime, so 20 is attractive.

The task is to find all attractive numbers up to 120.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Attractive_numbers',
  createdAt: '2025-11-30',
  previewImage: '/previews/attractive-numbers.png',
};
