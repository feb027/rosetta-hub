import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Arithmetic Evaluation',
  slug: 'arithmetic-evaluation',
  difficulty: 'medium',
  tags: ['algorithm', 'string', 'recursion', 'data-structure'],
  description: `Create a program which parses and evaluates arithmetic expressions by building an Abstract Syntax Tree (AST).

Requirements:
• Parse expressions like "(1+3)*7" into an AST
• Support operators: + - * / with proper precedence
• Support parentheses for grouping
• Evaluate the AST to compute the result

This visualization shows how expressions are tokenized, parsed into a tree structure, and then evaluated bottom-up.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Arithmetic_evaluation',
  createdAt: '2025-11-30',
  previewImage: '/previews/arithmetic-evaluation.png',
};
