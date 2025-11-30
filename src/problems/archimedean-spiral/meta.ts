import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Archimedean Spiral',
  slug: 'archimedean-spiral',
  difficulty: 'easy',
  tags: ['math', 'graphics', 'visualization', 'animation'],
  description: `The Archimedean spiral is a spiral named after the Greek mathematician Archimedes.

It can be described by the polar equation r = a + bθ, where:
- r is the distance from the origin
- θ is the angle from the x-axis
- a is the starting radius (distance from center at θ=0)
- b controls how tightly wound the spiral is

Unlike logarithmic spirals, the distance between successive turnings is constant.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Archimedean_spiral',
  createdAt: '2025-11-30',
  previewImage: '/previews/archimedean-spiral.png',
};
