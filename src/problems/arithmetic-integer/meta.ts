import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Arithmetic/Integer',
  slug: 'arithmetic-integer',
  difficulty: 'easy',
  tags: ['math', 'algorithm'],
  description: `Get two integers from the user, and then display their:
• sum
• difference  
• product
• integer quotient
• remainder
• exponentiation (if the operator exists)

For quotient, indicate how it rounds (e.g. towards zero, towards negative infinity, etc.).

For remainder, indicate whether its sign matches the sign of the first operand or of the second operand, if they are different.

Bonus: Include an example of the integer 'divmod' operator.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Arithmetic/Integer',
  createdAt: '2025-11-30',
  previewImage: '/previews/arithmetic-integer.png',
};
