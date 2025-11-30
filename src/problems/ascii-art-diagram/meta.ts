import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'ASCII Art Diagram Converter',
  slug: 'ascii-art-diagram',
  difficulty: 'hard',
  tags: ['string', 'data-structure', 'processing'],
  description: `Parse ASCII art diagrams (like RFC protocol headers) into structured data.

Given a diagram using +, -, |, and field names, extract the bit structure. Each column represents 1 bit, and fields span multiple columns.

This is commonly used for network protocol headers (DNS, TCP, IP) where the visual diagram shows exactly how bits are laid out in memory.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/ASCII_art_diagram_converter',
  createdAt: '2025-11-30',
  previewImage: '/previews/ascii-art-diagram.png',
};
