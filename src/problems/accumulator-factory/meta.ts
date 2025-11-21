import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
    title: 'Accumulator Factory',
    slug: 'accumulator-factory',
    difficulty: 'easy',
    tags: ['closure', 'function', 'simulation'],
    description: `
    Create a function that takes a single (numeric) argument and returns another function that is an accumulator. 
    The returned accumulator function in turn also takes a single numeric argument, and returns the sum of all the numeric values passed in so far to that accumulator (including the initial value passed when the accumulator was created).
  `,
    rosettaCodeUrl: 'https://rosettacode.org/wiki/Accumulator_factory',
};
