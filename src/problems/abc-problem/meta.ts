import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
    title: 'ABC problem',
    slug: 'abc-problem',
    difficulty: 'medium',
    tags: ['string', 'recursion', 'backtracking', 'game'],
    description: `
    You are given a collection of 20 ABC blocks. Each block has two letters (one on each side).
    
    Can you make a given word using these blocks? The rule is that once a letter on a block is used, that block cannot be used again.
    The function should be case-insensitive.
  `,
    rosettaCodeUrl: 'https://rosettacode.org/wiki/ABC_problem',
    createdAt: '2025-11-19',
};
