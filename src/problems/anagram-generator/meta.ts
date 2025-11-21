import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
    title: 'Anagram generator',
    slug: 'anagram-generator',
    difficulty: 'medium',
    tags: ['string', 'generator'],
    description: `
    Write a program that, when given a word or phrase as a seed, generates anagrams of that word or phrase.
    
    Task:
    Generate anagrams of some words/phrases of your choice.
    
    Examples:
    - "Clint Eastwood" -> "Old West Action"
    - "Astronomer" -> "Moon starer"
  `,
    rosettaCodeUrl: 'https://rosettacode.org/wiki/Anagram_generator'
};
