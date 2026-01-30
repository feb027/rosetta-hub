import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Bin Given Limits',
  slug: 'bin-given-limits',
  difficulty: 'medium',
  tags: ['algorithm', 'data-structure', 'visualization'],
  description: `Given ascending limits and a stream of numbers, count how many numbers fall into each bin (range).

Bin structure:
- bin[0]: count of numbers < limit[0]
- bin[1]: count of numbers >= limit[0] and < limit[1]
- ...
- bin[n]: count of numbers >= limit[n-1]

Example:
limits = [23, 37, 43, 53, 67, 83]
data = [95,21,94,12,99,4,70,75,83,93,52,80,57,5,53,86,65,17,92,83,71,61,54,58,47,16,8,9,32,84,7,87,46,19,30,37,96,6,98,40,79,97,45,64,60,29,49,36,43,55]

The algorithm efficiently bins large datasets without sorting.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Bin_given_limits',
  createdAt: '2025-01-31',
  previewImage: '/previews/bin-given-limits.png',
};
