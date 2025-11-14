import { useState, useMemo } from 'react';
import HubFilters from '../components/HubFilters';
import ProblemGrid from '../components/ProblemGrid';
import type { Difficulty, Tag } from '../types/problem';
import { useProblems } from '../hooks/useProblems';

export default function HomePage() {
  // Load problems dynamically
  const problems = useProblems();

  const [searchTerm, setSearchTerm] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('all');
  const [selectedTags, setSelectedTags] = useState<Set<Tag>>(new Set());

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

  // Simple filter logic for testing
  const filteredProblems = useMemo(() => {
    return problems.filter((problem) => {
      const matchesSearch = problem.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDifficulty = difficulty === 'all' || problem.difficulty === difficulty;
      const matchesTags = selectedTags.size === 0 || problem.tags.some((tag) => selectedTags.has(tag));
      return matchesSearch && matchesDifficulty && matchesTags;
    });
  }, [problems, searchTerm, difficulty, selectedTags]);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-cyan-400 mb-8 text-center">
          Rosetta Code Visualization Hub
        </h1>

        {/* Filters */}
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

        {/* Problem Grid */}
        <ProblemGrid problems={filteredProblems} onClearFilters={handleClearFilters} />
      </div>
    </div>
  );
}
