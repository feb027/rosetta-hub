import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Averages/Pythagorean Means',
  slug: 'pythagorean-means',
  difficulty: 'easy',
  tags: ['math', 'algorithm', 'visualization'],
  description: `Compute the three Pythagorean means of a set of numbers:

• Arithmetic Mean (A): Sum divided by count
• Geometric Mean (G): nth root of the product  
• Harmonic Mean (H): n divided by sum of reciprocals

For positive numbers, these always satisfy: A ≥ G ≥ H

The equality holds only when all numbers are identical.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Averages/Pythagorean_means',
  createdAt: '2025-11-30',
  previewImage: '/previews/pythagorean-means.png',
};
