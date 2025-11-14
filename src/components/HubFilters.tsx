import { useState, memo } from 'react';
import { X, ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';
import SearchInput from './SearchInput';
import DifficultyFilter from './DifficultyFilter';
import TagFilter from './TagFilter';
import type { Difficulty, Tag } from '../types/problem';

export type SortOption = 'title-asc' | 'title-desc' | 'difficulty-asc' | 'difficulty-desc' | 'newest' | 'oldest';

interface HubFiltersProps {
  searchTerm: string;
  selectedDifficulty: Difficulty | 'all';
  selectedTags: Set<Tag>;
  sortBy: SortOption;
  onSearchChange: (value: string) => void;
  onDifficultyChange: (value: Difficulty | 'all') => void;
  onTagToggle: (tag: Tag) => void;
  onSortChange: (value: SortOption) => void;
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

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'title-asc', label: 'Title (A-Z)' },
  { value: 'title-desc', label: 'Title (Z-A)' },
  { value: 'difficulty-asc', label: 'Difficulty (Easy → Hard)' },
  { value: 'difficulty-desc', label: 'Difficulty (Hard → Easy)' },
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
];

function HubFilters({
  searchTerm,
  selectedDifficulty,
  selectedTags,
  sortBy,
  onSearchChange,
  onDifficultyChange,
  onTagToggle,
  onSortChange,
  onClearFilters,
  activeFilterCount,
}: HubFiltersProps) {
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);

  return (
    <div className="glass rounded-xl p-4 md:p-6 border border-slate-600/50">
      {/* Top Row: Search */}
      <div className="mb-4">
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Search problems..."
        />
      </div>

      {/* Second Row: Difficulty + Sort + Clear (fixed layout) */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Difficulty Filter */}
        <div className="flex-shrink-0">
          <DifficultyFilter
            selected={selectedDifficulty}
            onChange={onDifficultyChange}
          />
        </div>

        {/* Sort Dropdown */}
        <div className="flex-shrink-0 relative">
          <div className="flex items-center gap-2">
            <ArrowUpDown size={16} className="text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="glass px-3 py-2 pr-8 rounded-lg text-sm text-slate-300 border border-slate-600/50 hover:border-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all cursor-pointer appearance-none bg-slate-800/50"
              aria-label="Sort problems by"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-slate-800">
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Spacer to push clear button to the right */}
        <div className="flex-1 min-w-0" />

        {/* Clear Filters Button - always reserve space */}
        <div className="flex-shrink-0 w-full sm:w-auto">
          {activeFilterCount > 0 ? (
            <button
              onClick={onClearFilters}
              aria-label={`Clear ${activeFilterCount} active ${activeFilterCount === 1 ? 'filter' : 'filters'}`}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 transition-all duration-250 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              <X size={16} />
              <span className="text-sm font-medium">Clear ({activeFilterCount})</span>
            </button>
          ) : (
            <div className="w-full sm:w-auto h-10 opacity-0 pointer-events-none">
              {/* Invisible placeholder to maintain layout */}
              <button className="px-4 py-2 text-sm whitespace-nowrap">
                Clear (0)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tags - Collapsible */}
      <div className="mt-4 border-t border-slate-600/50 pt-4">
        <button
          onClick={() => setIsTagsExpanded(!isTagsExpanded)}
          className="w-full flex items-center justify-between text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors mb-2 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 rounded px-2 py-1"
          aria-expanded={isTagsExpanded}
        >
          <span>
            Tags {selectedTags.size > 0 && <span className="text-cyan-400">({selectedTags.size} selected)</span>}
          </span>
          {isTagsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        
        {isTagsExpanded && (
          <div className="max-h-32 overflow-y-auto scrollbar-thin">
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
