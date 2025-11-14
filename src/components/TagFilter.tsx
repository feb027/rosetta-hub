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
    <div role="group" aria-label="Filter by tags" className="w-full space-y-3">
      {TAG_CATEGORIES.map((category) => {
        const isExpanded = expandedCategories.has(category.name);
        const categoryTags = category.tags.filter(tag => availableTags.includes(tag));
        const selectedCount = categoryTags.filter(tag => selectedTags.has(tag)).length;

        return (
          <div key={category.name} className="border-b border-slate-700/50 last:border-0 pb-3 last:pb-0">
            <button
              onClick={() => toggleCategory(category.name)}
              className="w-full flex items-center justify-between py-2 px-2 hover:bg-slate-700/30 rounded transition-colors group"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{category.icon}</span>
                <span className="text-sm font-medium text-slate-300 group-hover:text-slate-100">
                  {category.name}
                </span>
                {selectedCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-semibold"
                  >
                    {selectedCount}
                  </motion.span>
                )}
              </div>
              {isExpanded ? (
                <ChevronUp size={16} className="text-slate-400" />
              ) : (
                <ChevronDown size={16} className="text-slate-400" />
              )}
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-2 pt-2 px-2">
                    {categoryTags.map((tag) => {
                      const isSelected = selectedTags.has(tag);
                      
                      return (
                        <motion.button
                          key={tag}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.15 }}
                          onClick={() => onToggle(tag)}
                          className={`
                            px-3 py-2 rounded-lg
                            text-xs font-medium
                            border transition-all duration-250
                            min-h-[36px] flex items-center justify-center
                            focus:outline-none focus:ring-2 focus:ring-cyan-400/50
                            ${
                              isSelected
                                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-lg shadow-cyan-500/20'
                                : 'glass text-slate-300 border-slate-600/50 hover:border-slate-500 hover:text-slate-100 hover:scale-105'
                            }
                          `}
                          aria-pressed={isSelected}
                          aria-label={`${isSelected ? 'Remove' : 'Add'} ${tag} filter`}
                        >
                          {tag}
                        </motion.button>
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
