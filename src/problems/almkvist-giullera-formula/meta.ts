import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
    title: 'Almkvist-Giullera formula for pi',
    slug: 'almkvist-giullera-formula',
    difficulty: 'hard',
    tags: ['math', 'simulation'],
    description: `
    The Almkvist-Giullera formula for calculating 1/π² is based on Calabi-Yau differential equations originally used in string theory.
    
    The formula converges extremely rapidly, allowing for high-precision calculation of π.
    
    Task:
    1. Print the integer portions of the first 10 terms of the series.
    2. Calculate and print π to 70 decimal digits of precision.
  `,
    rosettaCodeUrl: 'https://rosettacode.org/wiki/Almkvist-Giullera_formula_for_pi'
};
