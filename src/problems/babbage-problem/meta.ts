import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Babbage Problem',
  slug: 'babbage-problem',
  difficulty: 'easy',
  tags: ['math', 'search', 'loop'],
  description: `What is the smallest positive integer whose square ends in the digits 269,696?

Charles Babbage, looking ahead to the sorts of problems his Analytical Engine would be able to solve, gave this example in a letter to Lord Bowden in 1837. He thought the answer might be 99,736, whose square is 9,947,269,696, but he couldn't be certain.

The task is to find out if Babbage had the right answer — and to do so in code that Babbage himself would have been able to read and understand.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Babbage_problem',
  createdAt: '2025-11-30',
  previewImage: '/previews/babbage-problem.png',
};
