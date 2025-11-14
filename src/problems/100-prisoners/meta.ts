import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: '100 Prisoners',
  slug: '100-prisoners',
  difficulty: 'medium',
  tags: ['algorithm', 'math', 'simulation', 'optimization'],
  description: `100 prisoners are individually numbered 1 to 100. A room has a cupboard of 100 opaque drawers numbered 1 to 100, that cannot be seen from outside. Cards numbered 1 to 100 are placed randomly, one to a drawer, and the drawers all closed; at the start.

Each prisoner may open and look into 50 drawers in any order. The drawers are closed again afterwards. If, during this search, every prisoner finds their number in one of the drawers, then they will all be pardoned. If just one prisoner does not find their number then all sentences stand.

The question is: What is the prisoners' best strategy?`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/100_prisoners',
  createdAt: '2025-11-14',
  previewImage: '/previews/100-prisoners.png',
};
