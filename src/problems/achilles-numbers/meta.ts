import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
    title: 'Achilles numbers',
    slug: 'achilles-numbers',
    difficulty: 'medium',
    tags: ['number-theory', 'math', 'simulation'],
    description: `
    An Achilles number is a number that is powerful but imperfect.
    
    A positive integer n is a powerful number if, for every prime factor p of n, p^2 is also a divisor.
    In other words, every prime factor appears at least squared in the factorization.
    
    Achilles numbers are powerful numbers that are not perfect powers (cannot be represented as m^k where m, k > 1).
    
    A strong Achilles number is an Achilles number whose Euler totient is also an Achilles number.
  `,
    rosettaCodeUrl: 'https://rosettacode.org/wiki/Achilles_numbers'
};
