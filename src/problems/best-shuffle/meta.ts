import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Best Shuffle',
  slug: 'best-shuffle',
  difficulty: 'medium',
  tags: ['algorithm', 'string', 'visualization'],
  description: `Shuffle the characters of a string such that as many characters as possible are in different positions than their original positions.

The goal is to minimize the "score" - the number of positions where the character value did not change.

A perfect shuffle (score = 0) means every character moved to a different position. This is known as a "derangement" in combinatorics.

Examples:
• "tree" → "eetr" (score: 0) ✓ Perfect shuffle
• "abracadabra" → various permutations with minimal fixed points
• "aaaaa" → cannot achieve score 0 (identical characters)

Test your own strings and see different shuffle algorithms in action!`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Best_shuffle',
  createdAt: '2025-01-30',
  previewImage: '/previews/best-shuffle.png',
};
