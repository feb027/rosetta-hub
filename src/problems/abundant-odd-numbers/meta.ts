import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
    title: 'Abundant Odd Numbers',
    slug: 'abundant-odd-numbers',
    difficulty: 'medium',
    tags: ['math', 'number-theory', 'visualization'],
    description: `
    An abundant number is a number n for which the sum of divisors σ(n) > 2n, or, equivalently, the sum of proper divisors s(n) > n.
    
    Abundant numbers are common, though even abundant numbers seem to be much more common than odd abundant numbers.
    To make things more interesting, this task is specifically about finding odd abundant numbers.
    
    This visualization uses a generative art approach called "The Abundance Bloom". 
    Each number is a seed. Its divisors are nutrients that cause it to grow petals. 
    If the growth (sum of divisors) exceeds the seed size, it blooms into a permanent flower in your garden.
  `,
    rosettaCodeUrl: 'https://rosettacode.org/wiki/Abundant_odd_numbers'
};
