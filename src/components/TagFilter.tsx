import { memo } from 'react';
import type { Tag } from '../types/problem';

interface TagFilterProps {
  availableTags: Tag[];
  selectedTags: Set<Tag>;
  onToggle: (tag: Tag) => void;
}

function TagFilter({ availableTags, selectedTags, onToggle }: TagFilterProps) {
  return (
    <div role="group" aria-label="Filter by tags" className="w-full">
      <div className="flex flex-wrap gap-2">
        {availableTags.map((tag) => {
          const isSelected = selectedTags.has(tag);
          
          return (
            <button
              key={tag}
              onClick={() => onToggle(tag)}
              className={`
                px-4 py-2 rounded-lg
                text-sm font-medium
                border transition-all duration-250
                focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900
                ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 glow-cyan'
                    : 'glass text-slate-300 border-slate-600/50 hover:border-slate-500 hover:text-slate-100'
                }
              `}
              aria-pressed={isSelected}
              aria-label={`${isSelected ? 'Remove' : 'Add'} ${tag} filter`}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default memo(TagFilter);
