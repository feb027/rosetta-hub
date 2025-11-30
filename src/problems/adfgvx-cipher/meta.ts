import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'ADFGVX Cipher',
  slug: 'adfgvx-cipher',
  difficulty: 'hard',
  tags: ['cryptography', 'string', 'algorithm'],
  description: `The ADFGVX cipher was a manually applied field cipher used by the German Army during World War I. It was broken in 1918 by the French cryptanalyst Georges Painvin.

The cipher combines a Polybius square substitution with a columnar transposition:

1. Create a 6×6 Polybius square using letters A-Z and digits 0-9
2. Each plaintext character is replaced by its row/column coordinates (using only A, D, F, G, V, X)
3. The result is then scrambled using columnar transposition with a keyword

The letters ADFGVX were chosen because they sound very different in Morse code, reducing transmission errors.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/ADFGVX_cipher',
  createdAt: '2025-11-30',
  previewImage: '/previews/adfgvx-cipher.png',
};
