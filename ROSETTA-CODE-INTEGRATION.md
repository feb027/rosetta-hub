# Rosetta Code Integration

This document explains how Rosetta Code links are integrated into the Rosetta Hub project.

## What Changed

### 1. Type System Updated
- Added `rosettaCodeUrl?: string` field to `ProblemMeta` interface in `src/types/problem.ts`
- This allows each problem to link back to its original Rosetta Code page

### 2. Problem Metadata Updated
All problem `meta.ts` files now include the Rosetta Code URL:

```typescript
export const meta: ProblemMeta = {
  title: 'Binary Search',
  slug: 'binary-search',
  difficulty: 'easy',
  tags: ['algorithm', 'array', 'sorting'],
  description: '...',
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Binary_search', // ← NEW
  createdAt: '2025-11-14',
  previewImage: '/previews/binary-search.png',
};
```

### 3. UI Integration
The Rosetta Code link appears in the problem detail page header:
- Located in the metadata footer section
- Styled with cyan accent color matching the theme
- Opens in a new tab with proper security attributes
- Includes an external link icon with hover animation

## For Future Problems

When adding new problems, always include the `rosettaCodeUrl` field:

1. Find the problem on [Rosetta Code](https://rosettacode.org/)
2. Copy the full URL (e.g., `https://rosettacode.org/wiki/Problem_Name`)
3. Add it to your `meta.ts` file

Example:
```typescript
rosettaCodeUrl: 'https://rosettacode.org/wiki/Your_Problem_Name',
```

## Benefits

- **Attribution**: Proper credit to Rosetta Code for the original problems
- **Learning**: Users can explore multiple language implementations
- **Context**: Users can read the full problem description and discussion
- **Community**: Connects users to the broader Rosetta Code community

## Steering Document

A comprehensive guide for adding new problems is available at:
`.kiro/steering/adding-problems.md`

This guide includes:
- Step-by-step instructions for adding problems
- Visualization quality standards
- Animation best practices
- Accessibility requirements
- Testing checklist
