import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Autogram Checker',
  slug: 'autogram-checker',
  difficulty: 'medium',
  tags: ['string', 'algorithm', 'puzzle'],
  description: `An autogram is a self-describing sentence that inventories its own characters. It uses cardinal number names ("one", "two", etc.) to count each letter.

For example: "This sentence employs two a's, two c's, two d's, twenty-eight e's..."

The checker verifies if the claimed counts match the actual character frequencies in the sentence.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Autogram_checker',
  createdAt: '2025-11-30',
  previewImage: '/previews/autogram-checker.png',
};
