import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
    title: 'Aliquot sequence classifications',
    slug: 'aliquot-sequence-classifications',
    difficulty: 'medium',
    tags: ['number-theory', 'math', 'simulation'],
    description: `
    An aliquot sequence of a positive integer K is defined recursively as the first member being K and subsequent members being the sum of the proper divisors of the previous term.
    
    Classifications for non-termination:
    - Perfect: Period 1 (repeats K).
    - Amicable: Period 2.
    - Sociable: Period > 2.
    - Aspiring: Eventually forms a periodic repetition of period 1 but of a number other than K.
    - Cyclic: Eventually forms a periodic repetition of period >= 2 but of a number other than K.
    - Non-terminating: Not known to be terminating or periodic (for this task, if > 16 terms or > 2^47).
    
    Terminating: Eventually reaches 0.
  `,
    rosettaCodeUrl: 'https://rosettacode.org/wiki/Aliquot_sequence_classifications'
};
