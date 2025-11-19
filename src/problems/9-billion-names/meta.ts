import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
    title: '9 Billion Names of God the Integer',
    slug: '9-billion-names',
    difficulty: 'medium',
    tags: ['math', 'dynamic-programming', 'visualization', 'combinatorics'],
    description: `
This task is a variation of the short story "The Nine Billion Names of God" by Arthur C. Clarke. 

In this version, a "name" of an integer $n$ is a way to write $n$ as a sum of positive integers. These are known as **integer partitions**.

For example, the integer 4 has 5 names:
- 4
- 3 + 1
- 2 + 2
- 2 + 1 + 1
- 1 + 1 + 1 + 1

The goal is to calculate the number of partitions $p(n)$ for a given integer $n$, and to visualize the cumulative "names" being generated.
  `,
    rosettaCodeUrl: 'https://rosettacode.org/wiki/9_billion_names_of_God_the_integer',
    createdAt: '2025-11-19',
};
