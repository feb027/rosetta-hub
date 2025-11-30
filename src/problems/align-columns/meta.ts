import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Align Columns',
  slug: 'align-columns',
  difficulty: 'medium',
  tags: ['string', 'processing', 'algorithm'],
  description: `Given a text file of many lines, where fields within a line are delineated by a single 'dollar' character, write a program that aligns each column of fields by ensuring that words in each column are separated by at least one space.

Further, allow for each word in a column to be either left justified, right justified, or center justified within its column.

The task demonstrates text processing and column alignment algorithms commonly used in formatting tabular data.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Align_columns',
  createdAt: '2025-11-30',
  previewImage: '/previews/align-columns.png',
};
