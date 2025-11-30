import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Barnsley Fern',
  slug: 'barnsley-fern',
  difficulty: 'medium',
  tags: ['graphics', 'math', 'simulation', 'recursion'],
  description: `The Barnsley fern is a fractal named after British mathematician Michael Barnsley. It's created using an Iterated Function System (IFS) with four affine transformations, each chosen with different probabilities:

• f1 (1%): Stem - maps to the base
• f2 (85%): Successively smaller leaflets  
• f3 (7%): Largest left-hand leaflet
• f4 (7%): Largest right-hand leaflet

Starting from (0,0), repeatedly applying these transformations creates the beautiful self-similar fern pattern.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Barnsley_fern',
  createdAt: '2025-11-30',
  previewImage: '/previews/barnsley-fern.png',
};
