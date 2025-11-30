import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Add a Variable to a Class Instance at Runtime',
  slug: 'add-variable-runtime',
  difficulty: 'easy',
  tags: ['data-structure', 'simulation'],
  description: `Demonstrate how to dynamically add variables to an object (a class instance) at runtime.

This is useful when the methods/variables of an instance are based on a data file that isn't available until runtime. Hal Fulton gives an example of creating an OO CSV parser at "An Exercise in Metaprogramming with Ruby". This is referred to as "monkeypatching" by Pythonistas and some others.

In JavaScript/TypeScript, this is straightforward due to the dynamic nature of objects - you can add properties at any time using bracket notation or Object.defineProperty().`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Add_a_variable_to_a_class_instance_at_runtime',
  createdAt: '2025-11-30',
  previewImage: '/previews/add-variable-runtime.png',
};
