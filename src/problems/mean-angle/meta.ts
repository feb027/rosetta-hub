import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Averages/Mean Angle',
  slug: 'mean-angle',
  difficulty: 'medium',
  tags: ['math', 'algorithm', 'visualization'],
  description: `Calculate the mean of angles, accounting for the circular nature of angular measurements. A simple arithmetic mean fails because 350° and 10° should average to 0°, not 180°.

The solution converts angles to unit vectors, averages the vectors, then converts back to an angle using atan2.

Formula: mean = atan2(Σsin(αᵢ)/n, Σcos(αᵢ)/n)`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Averages/Mean_angle',
  createdAt: '2025-11-30',
  previewImage: '/previews/mean-angle.png',
};
