import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Anonymous Recursion',
  slug: 'anonymous-recursion',
  difficulty: 'medium',
  tags: ['recursion', 'function', 'math'],
  description: `While implementing a recursive function, it often happens that we must resort to a separate helper function to handle the actual recursion.

This is usually the case when directly calling the current function would waste too many resources (stack space, execution time), causing unwanted side-effects, and/or the function doesn't have the right arguments and/or return values.

Some languages allow you to embed recursion directly in-place using a label, a local gosub instruction, or some special keyword. Anonymous recursion can also be accomplished using the Y combinator.

The task is to demonstrate anonymous recursion by writing the recursive version of the Fibonacci function which checks for a negative argument before doing the actual recursion.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Anonymous_recursion',
  createdAt: '2025-11-30',
  previewImage: '/previews/anonymous-recursion.png',
};
