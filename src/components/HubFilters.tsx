import { useState, memo } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
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

function HubFilters({
  searchTerm,
  selectedDifficulty,
  selectedTags,
  onSearchChange,
  onDifficultyChange,
  onTagToggle,
  onClearFilters,
  activeFilterCount,
}: HubFiltersProps) {
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);

  return (
    <div className="glass rounded-xl p-4 md:p-6 border border-slate-600/50">
      {/* Compact Layout: Search + Difficulty + Clear in one row on desktop */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-start">
        {/* Search - takes more space */}
        <div className="flex-1 min-w-0">
          <SearchInput
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Search problems..."
          />
        </div>

        {/* Difficulty - compact */}
        <div className="lg:w-auto">
          <DifficultyFilter
            selected={selectedDifficulty}
            onChange={onDifficultyChange}
          />
        </div>

        {/* Clear Filters Button - compact */}
        {activeFilterCount > 0 && (
          <button
            onClick={onClearFilters}
            aria-label={`Clear ${activeFilterCount} active ${activeFilterCount === 1 ? 'filter' : 'filters'}`}
            className="lg:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-slate-100 border border-slate-600/50 hover:border-slate-500 transition-all duration-250 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <X size={16} />
            <span className="text-sm">Clear ({activeFilterCount})</span>
          </button>
        )}
      </div>

      {/* Tags - Collapsible with max height */}
      <div className="mt-4 border-t border-slate-600/50 pt-4">
        <button
          onClick={() => setIsTagsExpanded(!isTagsExpanded)}
          className="w-full flex items-center justify-between text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors mb-2"
        >
          <span>
            Tags {selectedTags.size > 0 && `(${selectedTags.size} selected)`}
          </span>
          {isTagsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        
        {isTagsExpanded && (
          <div className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800/50">
            <TagFilter
              availableTags={availableTags}
              selectedTags={selectedTags}
              onToggle={onTagToggle}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(HubFilters);
