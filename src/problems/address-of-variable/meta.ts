import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Address of a Variable',
  slug: 'address-of-variable',
  difficulty: 'easy',
  tags: ['data-structure', 'simulation'],
  description: `Demonstrate how to get the address of a variable and how to set the address of a variable (pointers).

In low-level languages like C, you can get a variable's memory address using the & operator and create pointers that store addresses. Dereferencing a pointer (*ptr) accesses the value at that address.

While JavaScript doesn't expose raw memory addresses, this visualization simulates the concept to help understand how pointers and memory addressing work in systems programming.

Key concepts:
• Memory addresses are locations where data is stored
• Pointers are variables that hold memory addresses
• Dereferencing accesses the value at a pointed address
• Multiple pointers can reference the same address`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Address_of_a_variable',
  createdAt: '2025-11-30',
  previewImage: '/previews/address-of-variable.png',
};
