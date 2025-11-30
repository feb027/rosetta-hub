import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Arbitrary-precision Integers (included)',
  slug: 'arbitrary-precision-integers',
  difficulty: 'medium',
  tags: ['math', 'number-theory', 'algorithm'],
  description: `Using the in-built capabilities of your language, calculate the integer value of 5^(4^(3^2)).

Confirm that the first and last twenty digits of the answer are:
62060698786608744707...92256259918212890625

Find and show the number of decimal digits in the answer.

This task demonstrates arbitrary-precision arithmetic - the ability to perform calculations on integers of unlimited size, limited only by available memory.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Arbitrary-precision_integers_(included)',
  createdAt: '2025-11-30',
  previewImage: '/previews/arbitrary-precision-integers.png',
};
