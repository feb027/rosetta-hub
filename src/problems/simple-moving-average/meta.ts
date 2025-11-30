import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Averages/Simple Moving Average',
  slug: 'simple-moving-average',
  difficulty: 'medium',
  tags: ['algorithm', 'math', 'array', 'simulation'],
  description: `Computing the simple moving average of a stream of numbers by only averaging the last P numbers from the stream, where P is known as the period.

Create a stateful function/class/instance that takes a period and returns a routine that takes a number as argument and returns a simple moving average of its arguments so far.

The word "stateful" refers to the need for SMA() to remember certain information between calls:
• The period, P
• An ordered container of at least the last P numbers from each of its individual calls.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Averages/Simple_moving_average',
  createdAt: '2025-11-30',
  previewImage: '/previews/simple-moving-average.png',
};
