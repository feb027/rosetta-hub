import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
    title: 'Abbreviations, automatic',
    slug: 'abbreviations-automatic',
    difficulty: 'easy',
    tags: ['string', 'algorithm', 'processing'],
    description: `
    Given a set of words (e.g., days of the week) and a specified length, generate abbreviations for each word.
    
    If the specified length is insufficient to create a unique abbreviation for a word (i.e., it conflicts with another word's abbreviation), the system should indicate the ambiguity.
  `,
    rosettaCodeUrl: 'https://rosettacode.org/wiki/Abbreviations,_automatic',
    createdAt: '2025-11-19',
};
