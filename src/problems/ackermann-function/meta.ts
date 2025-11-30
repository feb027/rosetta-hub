import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Ackermann Function',
  slug: 'ackermann-function',
  difficulty: 'medium',
  tags: ['recursion', 'math', 'algorithm', 'function'],
  description: `The Ackermann function is a classic example of a recursive function that is not primitive recursive. It grows extremely quickly in value, as does the size of its call tree.

A(m, n) is defined as:
• A(0, n) = n + 1
• A(m, 0) = A(m-1, 1) when m > 0
• A(m, n) = A(m-1, A(m, n-1)) when m > 0 and n > 0

Even small inputs like A(4, 2) produce astronomically large results!`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Ackermann_function',
  createdAt: '2025-11-30',
  previewImage: '/previews/ackermann-function.png',
};
