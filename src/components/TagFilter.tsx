import { useState, memo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Tag } from '../types/problem';
import { TAG_CATEGORIES } from '../constants/tagCategories';

interface TagFilterProps {
  availableTags: Tag[];
  selectedTags: Set<Tag>;
  onToggle: (tag: Tag) => void;
}

function TagFilter({ availableTags, selectedTags, onToggle }: TagFilterProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(TAG_CATEGORIES.map(cat => cat.name))
  );

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryName)) {
        next.delete(categoryName);
      } else {
        next.add(categoryName);
      }
      return next;
    });
  };

  return (
    <div role="group" aria-label="Filter by tags" className="w-full space-y-2">
      {TAG_CATEGORIES.map((category) => {
        const isExpanded = expandedCategories.has(category.name);
        const categoryTags = category.tags.filter(tag => availableTags.includes(tag));
        const selectedCount = categoryTags.filter(tag => selectedTags.has(tag)).length;

        return (
          <div key={category.name} className="last:pb-0">
            <button
              onClick={() => toggleCategory(category.name)}
              className="w-full flex items-center justify-between py-1.5 px-1 hover:bg-slate-700/30 rounded transition-colors group"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{category.icon}</span>
                <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200">
                  {category.name}
                </span>
                {selectedCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-semibold">
                    {selectedCount}
                  </span>
                )}
              </div>
              {isExpanded ? (
                <ChevronUp size={14} className="text-slate-500" />
              ) : (
                <ChevronDown size={14} className="text-slate-500" />
              )}
            </button>

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ 
                    duration: 0.2,
                    ease: [0.4, 0, 0.2, 1]
                  }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-1.5 pt-2 pl-7">
                    {categoryTags.map((tag) => {
                      const isSelected = selectedTags.has(tag);
                      
                      return (
                        <button
                          key={tag}
                          onClick={() => onToggle(tag)}
                          className={`
                            px-2.5 py-1.5 rounded-md
                            text-xs font-medium
                            transition-all duration-200
                            min-h-[32px] flex items-center justify-center
                            focus:outline-none focus:ring-2 focus:ring-cyan-400/50
                            ${
                              isSelected
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                                : 'bg-slate-700/40 text-slate-300 border border-slate-600/30 hover:border-cyan-500/30 hover:bg-slate-700/60 hover:text-slate-100'
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export default memo(TagFilter);
