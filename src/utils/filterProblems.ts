import type { ProblemMeta, Difficulty, Tag } from '../types/problem';

export type TagFilterMode = 'OR' | 'AND';

/**
 * Filters problems based on search term, difficulty, and tags
 * @param problems - Array of all problems
 * @param searchTerm - Search term to filter by title (case-insensitive)
 * @param difficulty - Difficulty level to filter by ('all' for no filter)
 * @param selectedTags - Set of tags to filter by
 * @param tagFilterMode - 'OR' (any tag) or 'AND' (all tags)
 * @returns Filtered array of problems (AND logic - must match all criteria)
 */
export function filterProblems(
  problems: ProblemMeta[],
  searchTerm: string,
  difficulty: Difficulty | 'all',
  selectedTags: Set<Tag>,
  tagFilterMode: TagFilterMode = 'OR'
): ProblemMeta[] {
  return problems.filter((problem) => {
    // Search filter: case-insensitive title match
    const matchesSearch = problem.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase().trim());

    // Difficulty filter: exact match or 'all'
    const matchesDifficulty =
      difficulty === 'all' || problem.difficulty === difficulty;

    // Tag filter: OR or AND logic based on mode
    let matchesTags = true;
    if (selectedTags.size > 0) {
      if (tagFilterMode === 'OR') {
        // OR logic: problem has ANY of the selected tags
        matchesTags = problem.tags.some((tag) => selectedTags.has(tag));
      } else {
        // AND logic: problem has ALL of the selected tags
        matchesTags = Array.from(selectedTags).every((tag) => problem.tags.includes(tag));
      }
    }

    // AND logic: must match all criteria
    return matchesSearch && matchesDifficulty && matchesTags;
  });
}
