import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Anagrams/Deranged Anagrams',
  slug: 'deranged-anagrams',
  difficulty: 'medium',
  tags: ['string', 'algorithm', 'search', 'combinatorics'],
  description: `Two or more words are said to be anagrams if they have the same characters, but in a different order.

By analogy with derangements, we define a deranged anagram as two words with the same characters, but in which the same character does NOT appear in the same position in both words.

The task is to find and display the longest deranged anagram from a word list.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Anagrams/Deranged_anagrams',
  createdAt: '2025-11-30',
  previewImage: '/previews/deranged-anagrams.png',
};
