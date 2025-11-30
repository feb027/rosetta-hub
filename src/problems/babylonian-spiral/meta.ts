import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Babylonian Spiral',
  slug: 'babylonian-spiral',
  difficulty: 'medium',
  tags: ['math', 'graphics', 'visualization', 'algorithm'],
  description: `The Babylonian spiral is a sequence of points in the plane that continuously minimally increase in vector length and minimally bend in vector direction, while always moving from point to point on strictly integral coordinates.

Starting from origin, each new point is chosen to have the smallest possible distance increase from the previous vector length, while bending clockwise as little as possible. The lengths are determined by sums of two integer squares.

Find and show the first 40 (x, y) coordinates of the Babylonian spiral.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Babylonian_spiral',
  createdAt: '2025-11-30',
  previewImage: '/previews/babylonian-spiral.png',
};
