import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
    title: 'Amb',
    slug: 'amb',
    difficulty: 'medium',
    tags: ['backtracking', 'simulation'],
    description: `
    The Amb operator (short for "ambiguous") expresses nondeterminism. 
    It takes a variable number of expressions and yields a correct one which will satisfy a constraint in some future computation.
    
    Task:
    Implement a form of the Amb operator to choose one word from each of the four sets of character strings to generate a four-word sentence.
    
    Constraint:
    The last character of each word (other than the last) must be the same as the first character of its successor.
    
    Word Sets:
    1. "the", "that", "a"
    2. "frog", "elephant", "thing"
    3. "walked", "treaded", "grows"
    4. "slowly", "quickly"
  `,
    rosettaCodeUrl: 'https://rosettacode.org/wiki/Amb'
};
