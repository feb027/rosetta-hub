import { useState, useMemo } from 'react';
import HubFilters from '../components/HubFilters';
import ProblemGrid from '../components/ProblemGrid';
import type { Difficulty, Tag } from '../types/problem';
import { useProblems } from '../hooks/useProblems';
import { useDebounce } from '../hooks/useDebounce';
import { filterProblems } from '../utils/filterProblems';

export default function HomePage() {
  // Load problems dynamically
  const problems = useProblems();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('all');
  const [selectedTags, setSelectedTags] = useState<Set<Tag>>(new Set());

  // Debounce search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const handleTagToggle = (tag: Tag) => {
    const newTags = new Set(selectedTags);
    if (newTags.has(tag)) {
      newTags.delete(tag);
    } else {
      newTags.add(tag);
    }
    setSelectedTags(newTags);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setDifficulty('all');
    setSelectedTags(new Set());
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (difficulty !== 'all') count++;
    if (selectedTags.size > 0) count += selectedTags.size;
    return count;
  }, [searchTerm, difficulty, selectedTags]);

  // Filter problems using the utility function with debounced search
  const filteredProblems = useMemo(() => {
    return filterProblems(problems, debouncedSearchTerm, difficulty, selectedTags);
  }, [problems, debouncedSearchTerm, difficulty, selectedTags]);

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
            onSearchChange={setSearchTerm}
            onDifficultyChange={setDifficulty}
            onTagToggle={handleTagToggle}
            onClearFilters={handleClearFilters}
            activeFilterCount={activeFilterCount}
          />
        </div>

        {/* Results Count with Subtle Animation */}
        {problems.length > 0 && (
          <div className="mb-6 text-center">
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
        <ProblemGrid problems={filteredProblems} onClearFilters={handleClearFilters} />
      </div>
    </div>
  );
}
