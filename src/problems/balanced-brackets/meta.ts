import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Balanced Brackets',
  slug: 'balanced-brackets',
  difficulty: 'easy',
  tags: ['string', 'algorithm', 'validation'],
  description: `Generate a string with N opening brackets [ and N closing brackets ], in some arbitrary order. Then determine whether the generated string is balanced — that is, whether it consists entirely of pairs of opening/closing brackets (in that order), none of which mis-nest.

Examples:
• (empty) → OK
• [] → OK
• [][] → OK
• [[]][] → OK
• ][ → NOT OK
• ][][ → NOT OK
• []][][[] → NOT OK`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Balanced_brackets',
  createdAt: '2025-11-30',
  previewImage: '/previews/balanced-brackets.png',
};
