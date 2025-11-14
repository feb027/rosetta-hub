import { X } from 'lucide-react';
import SearchInput from './SearchInput';
import DifficultyFilter from './DifficultyFilter';
import TagFilter from './TagFilter';
import type { Difficulty, Tag } from '../types/problem';

interface HubFiltersProps {
  searchTerm: string;
  selectedDifficulty: Difficulty | 'all';
  selectedTags: Set<Tag>;
  onSearchChange: (value: string) => void;
  onDifficultyChange: (value: Difficulty | 'all') => void;
  onTagToggle: (tag: Tag) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
}

const availableTags: Tag[] = [
  'algorithm',
  'data-structure',
  'math',
  'string',
  'array',
  'recursion',
  'sorting',
  'graph',
  'dynamic-programming',
  'greedy',
];

export default function HubFilters({
  searchTerm,
  selectedDifficulty,
  selectedTags,
  onSearchChange,
  onDifficultyChange,
  onTagToggle,
  onClearFilters,
  activeFilterCount,
}: HubFiltersProps) {
  return (
    <div className="glass rounded-xl p-6 border border-slate-600/50 space-y-6">
      {/* Search Input */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Search
        </label>
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Search problems by title..."
        />
      </div>

      {/* Difficulty Filter */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Difficulty
        </label>
        <DifficultyFilter
          selected={selectedDifficulty}
          onChange={onDifficultyChange}
        />
      </div>

      {/* Tag Filter */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Tags
        </label>
        <TagFilter
          availableTags={availableTags}
          selectedTags={selectedTags}
          onToggle={onTagToggle}
        />
      </div>

      {/* Clear Filters Button */}
      {activeFilterCount > 0 && (
        <div className="pt-2 border-t border-slate-600/50">
          <button
            onClick={onClearFilters}
            aria-label={`Clear ${activeFilterCount} active filters`}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-slate-100 border border-slate-600/50 hover:border-slate-500 transition-all duration-250"
          >
            <X size={16} />
            <span>
              Clear Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
