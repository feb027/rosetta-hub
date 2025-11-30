import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Base64 Encode/Decode',
  slug: 'base64-encode-decode',
  difficulty: 'easy',
  tags: ['string', 'algorithm', 'processing'],
  description: `Base64 is a binary-to-text encoding scheme that represents binary data in an ASCII string format. It's commonly used for encoding data in emails, URLs, and data storage.

Encoding: Convert bytes to a string using 64 printable characters (A-Z, a-z, 0-9, +, /) with = for padding.

Decoding: Convert a Base64 string back to the original binary data.

Each Base64 digit represents 6 bits of data, so 3 bytes (24 bits) become 4 Base64 characters.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Base64_encode_data',
  createdAt: '2025-11-30',
  previewImage: '/previews/base64-encode-decode.png',
};
