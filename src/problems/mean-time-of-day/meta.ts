import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Averages/Mean Time of Day',
  slug: 'mean-time-of-day',
  difficulty: 'medium',
  tags: ['math', 'algorithm'],
  description: `Calculate the mean time of day using circular statistics. Map times to angles (24 hours = 360°) and compute the mean angle to find the average time, handling the midnight wraparound correctly.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Averages/Mean_time_of_day',
  createdAt: '2025-11-30',
};
