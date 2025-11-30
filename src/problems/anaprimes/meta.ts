import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Anaprimes',
  slug: 'anaprimes',
  difficulty: 'medium',
  tags: ['math', 'number-theory', 'string', 'algorithm'],
  description: `Anaprimes are prime numbers that are anagrams of each other - they use exactly the same digits with the same frequency but in a different order.

For example, the equivalence class of 149 has four anaprimes: {149, 419, 491, 941}. This is the largest group of 3-digit anaprimes.

The task is to find prime numbers that are anagrams of each other and identify the largest anagram groups for different digit lengths.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Anaprimes',
  createdAt: '2025-11-30',
  previewImage: '/previews/anaprimes.png',
};
