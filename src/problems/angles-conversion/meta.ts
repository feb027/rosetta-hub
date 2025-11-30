import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Angles (geometric), normalization and conversion',
  slug: 'angles-conversion',
  difficulty: 'easy',
  tags: ['math', 'algorithm'],
  description: `This task is about the normalization and/or conversion of geometric angles using common scales: degrees, gradians, mils, and radians.

Normalization keeps the same sign but reduces the magnitude to less than a full circle (less than 360°).

The angular scales:
• Degree: 1/360 of a turn (360° per circle)
• Gradian: 1/400 of a turn (400 gradians per circle)  
• Mil: 1/6400 of a turn (6400 mils per circle)
• Radian: 1/2π of a turn (2π radians per circle)`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Angles_(geometric),_normalization_and_conversion',
  createdAt: '2025-11-30',
  previewImage: '/previews/angles-conversion.png',
};
