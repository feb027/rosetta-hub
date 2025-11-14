import { useState, useMemo, useEffect, useCallback } from 'react';
import HubFilters, { type SortOption } from '../components/HubFilters';
import ProblemGrid from '../components/ProblemGrid';
import type { Difficulty, Tag, ProblemMeta } from '../types/problem';
import { useProblems } from '../hooks/useProblems';
import { useDebounce } from '../hooks/useDebounce';
import { filterProblems, type TagFilterMode } from '../utils/filterProblems';
import { useURLState } from '../hooks/useURLState';

export default function HomePage() {
  // Load problems dynamically
  const { problems, isLoading } = useProblems();

  // Get filter state from URL
  const { searchTerm: urlSearchTerm, difficulty: urlDifficulty, selectedTags: urlSelectedTags, updateFilters } = useURLState();

  // Local state for immediate UI updates (before debounce)
  const [searchTerm, setSearchTerm] = useState(urlSearchTerm);
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>(urlDifficulty);
  const [selectedTags, setSelectedTags] = useState<Set<Tag>>(urlSelectedTags);
  const [tagFilterMode, setTagFilterMode] = useState<TagFilterMode>('OR');
  const [sortBy, setSortBy] = useState<SortOption>('difficulty-asc');

  // Debounce search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Update URL when filters change (using debounced search)
  useEffect(() => {
    updateFilters(debouncedSearchTerm, difficulty, selectedTags);
  }, [debouncedSearchTerm, difficulty, selectedTags, updateFilters]);

  // Memoize handler functions to prevent unnecessary re-renders
  const handleTagToggle = useCallback((tag: Tag) => {
    setSelectedTags((prevTags) => {
      const newTags = new Set(prevTags);
      if (newTags.has(tag)) {
        newTags.delete(tag);
      } else {
        newTags.add(tag);
      }
      return newTags;
    });
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setDifficulty('all');
    setSelectedTags(new Set());
    setTagFilterMode('OR');
    setSortBy('difficulty-asc');
  }, []);

  // Sort problems based on selected option
  const sortProblems = useCallback((problemsToSort: ProblemMeta[]): ProblemMeta[] => {
    const sorted = [...problemsToSort];
    
    switch (sortBy) {
      case 'title-asc':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'title-desc':
        return sorted.sort((a, b) => b.title.localeCompare(a.title));
      case 'difficulty-asc':
        const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
        return sorted.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
      case 'difficulty-desc':
        const difficultyOrderDesc = { easy: 3, medium: 2, hard: 1 };
        return sorted.sort((a, b) => difficultyOrderDesc[a.difficulty] - difficultyOrderDesc[b.difficulty]);
      case 'newest':
        return sorted.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
      case 'oldest':
        return sorted.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateA - dateB;
        });
      default:
        return sorted;
    }
  }, [sortBy]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (difficulty !== 'all') count++;
    if (selectedTags.size > 0) count += selectedTags.size;
    return count;
  }, [searchTerm, difficulty, selectedTags]);

  // Filter and sort problems
  const filteredProblems = useMemo(() => {
    const filtered = filterProblems(problems, debouncedSearchTerm, difficulty, selectedTags, tagFilterMode);
    return sortProblems(filtered);
  }, [problems, debouncedSearchTerm, difficulty, selectedTags, tagFilterMode, sortProblems]);

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section with Unique Design */}
        <header className="mb-12 text-center">
          <div className="relative inline-block">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-500 mb-4">
              Rosetta Code Hub
            </h1>
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-2xl -z-10" />
          </div>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto">
            Explore classic programming problems transformed into beautiful visualizations
          </p>
        </header>

        {/* Filters Section */}
        <div className="mb-8">
          <HubFilters
            searchTerm={searchTerm}
            selectedDifficulty={difficulty}
            selectedTags={selectedTags}
            tagFilterMode={tagFilterMode}
            sortBy={sortBy}
            problems={problems}
            onSearchChange={setSearchTerm}
            onDifficultyChange={setDifficulty}
            onTagToggle={handleTagToggle}
            onTagFilterModeChange={setTagFilterMode}
            onSortChange={setSortBy}
            onClearFilters={handleClearFilters}
            activeFilterCount={activeFilterCount}
          />
        </div>

        {/* Results Count with Subtle Animation */}
        {problems.length > 0 && (
          <div className="mb-6 text-center" aria-live="polite" aria-atomic="true">
            <p className="text-slate-400 text-sm">
              Showing{' '}
              <span className="text-cyan-400 font-semibold">
                {filteredProblems.length}
              </span>{' '}
              of{' '}
              <span className="text-slate-300 font-semibold">
                {problems.length}
              </span>{' '}
              {problems.length === 1 ? 'problem' : 'problems'}
            </p>
          </div>
        )}

        {/* Problem Grid */}
        <ProblemGrid problems={filteredProblems} onClearFilters={handleClearFilters} isLoading={isLoading} />
      </div>
    </div>
  );
}
