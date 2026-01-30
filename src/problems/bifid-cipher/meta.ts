import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Bifid Cipher',
  slug: 'bifid-cipher',
  difficulty: 'medium',
  tags: ['cryptography', 'algorithm', 'string', 'visualization'],
  description: `The Bifid cipher is a polygraphic substitution cipher invented by Félix Delastelle around 1901. It combines the Polybius square with transposition and fractionation.

**How it works:**
1. Each letter is converted to row/column coordinates using a 5×5 Polybius square
2. Coordinates are written vertically beneath the message
3. All coordinates are read out horizontally in a single row
4. Pairs of coordinates are used to look up encrypted letters

**Example:**
Message: "ATTACKATDAWN"
Polybius Square: Standard A-Z (I/J combined)
Encrypted: "DQBDAXDQPDQH"

The cipher provides diffusion by making each ciphertext character depend on two plaintext characters, making it resistant to frequency analysis.

Test the encryption and decryption with custom messages and Polybius squares!`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Bifid_cipher',
  createdAt: '2025-01-30',
  previewImage: '/previews/bifid-cipher.png',
};
