import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Arithmetic/Rational',
  slug: 'arithmetic-rational',
  difficulty: 'medium',
  tags: ['math', 'number-theory', 'data-structure'],
  description: `Create a reasonably complete implementation of rational arithmetic using the idioms of the language.

Define a new type called frac with binary operator "//" of two integers that returns a structure made up of the numerator and the denominator (as per a rational number).

Further define the appropriate rational unary operators abs and '-', with the binary operators for addition '+', subtraction '-', multiplication '×', division '/', integer division '÷', modulo division, the comparison operators, and equality operators.

Finally test the operators: Use the new type frac to find all perfect numbers less than 2^19 by summing the reciprocal of the factors.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Arithmetic/Rational',
  createdAt: '2025-11-30',
  previewImage: '/previews/arithmetic-rational.png',
};
