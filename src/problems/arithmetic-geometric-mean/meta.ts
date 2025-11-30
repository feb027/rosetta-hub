import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Arithmetic-Geometric Mean',
  slug: 'arithmetic-geometric-mean',
  difficulty: 'medium',
  tags: ['math', 'algorithm', 'number-theory'],
  description: `The arithmetic-geometric mean (AGM) of two numbers a and g is computed by iteratively calculating:
  
• aₙ₊₁ = (aₙ + gₙ) / 2  (arithmetic mean)
• gₙ₊₁ = √(aₙ × gₙ)    (geometric mean)

The sequences converge rapidly to the same limit, which is the AGM. This elegant algorithm was studied by Gauss and has applications in computing elliptic integrals and π.

The classic demonstration is computing agm(1, 1/√2) ≈ 0.8472130848...`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Arithmetic-geometric_mean',
  createdAt: '2025-11-30',
  previewImage: '/previews/arithmetic-geometric-mean.png',
};
