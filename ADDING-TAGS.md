# Adding New Tags to Rosetta Hub

Quick guide for adding new problem tags to the system.

## Steps to Add a New Tag

### 1. Define the Tag Type
**File**: `src/types/problem.ts`

Add the new tag to the `Tag` union type:

```typescript
export type Tag =
  | 'algorithm'
  | 'data-structure'
  // ... existing tags
  | 'your-new-tag'; // Add here
```

### 2. Add to Available Tags List
**File**: `src/components/HubFilters.tsx`

Add to the `availableTags` array:

```typescript
const availableTags: Tag[] = [
  'algorithm',
  'data-structure',
  // ... existing tags
  'your-new-tag', // Add here
];
```

### 3. Categorize the Tag
**File**: `src/constants/tagCategories.ts`

Add to an existing category or create a new one:

```typescript
export const TAG_CATEGORIES: TagCategory[] = [
  {
    name: 'Category Name',
    icon: '🎯', // Choose an emoji
    tags: ['your-new-tag'] // Add here
  }
];
```

### 4. Update Documentation
**File**: `.kiro/steering/adding-problems.md`

Add the tag to the "Available Tags" section with its category.

---

## Current Tag Categories

### Concepts (💡)
- `algorithm`, `recursion`, `dynamic-programming`, `greedy`, `optimization`

### Data Structures (📦)
- `data-structure`, `array`, `graph`

### Operations (⚙️)
- `sorting`, `math`, `string`, `simulation`

### Interactive (🎮)
- `game`

---

## Tag Naming Conventions

- Use **kebab-case** (lowercase with hyphens)
- Be **specific** but not too narrow
- Keep it **short** (1-3 words max)
- Use **common terminology** from CS/programming

### Good Examples
✅ `dynamic-programming`
✅ `data-structure`
✅ `game`

### Bad Examples
❌ `DynamicProgramming` (not kebab-case)
❌ `very-specific-algorithm-type` (too narrow)
❌ `stuff` (too vague)

---

## Testing Your New Tag

1. **Type Check**: Run `bun run tsc --noEmit`
2. **Visual Check**: Start dev server and check filters panel
3. **Filter Test**: Select the tag and verify filtering works
4. **Search Test**: Search for problems with the tag

---

## Example: Adding 'game' Tag

```typescript
// 1. src/types/problem.ts
export type Tag = 'algorithm' | 'game';

// 2. src/components/HubFilters.tsx
const availableTags: Tag[] = ['algorithm', 'game'];

// 3. src/constants/tagCategories.ts
{
  name: 'Interactive',
  icon: '🎮',
  tags: ['game']
}

// 4. Use in problem meta
export const meta: ProblemMeta = {
  title: '15-Puzzle',
  tags: ['game', 'algorithm'],
  // ...
};
```

---

## Common Tag Use Cases

| Tag | Use For |
|-----|---------|
| `algorithm` | General algorithmic problems |
| `data-structure` | Problems focusing on data structures |
| `math` | Mathematical computations |
| `string` | String manipulation |
| `array` | Array operations |
| `recursion` | Recursive solutions |
| `sorting` | Sorting algorithms |
| `graph` | Graph algorithms |
| `dynamic-programming` | DP problems |
| `greedy` | Greedy algorithms |
| `simulation` | Simulations |
| `optimization` | Optimization problems |
| `game` | Interactive games/puzzles |

---

## Need Help?

Check existing problems in `src/problems/` to see how tags are used in practice.
