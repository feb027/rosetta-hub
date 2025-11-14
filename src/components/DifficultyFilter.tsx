import { memo } from 'react';
import type { Difficulty } from '../types/problem';
import { DIFFICULTY_LABELS } from '../constants/colors';

interface DifficultyFilterProps {
  selected: Difficulty | 'all';
  onChange: (value: Difficulty | 'all') => void;
}

const options: Array<Difficulty | 'all'> = ['all', 'easy', 'medium', 'hard'];

function DifficultyFilter({ selected, onChange }: DifficultyFilterProps) {
  return (
    <fieldset className="w-full" aria-label="Filter by difficulty">
      <legend className="sr-only">Select difficulty level</legend>
      
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected === option;
          const label = option === 'all' ? 'All' : DIFFICULTY_LABELS[option];
          
          return (
            <label
              key={option}
              className={`
                relative cursor-pointer
                px-4 py-2 rounded-lg
                text-sm font-medium
                border transition-all duration-250
                ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 glow-cyan'
                    : 'glass text-slate-300 border-slate-600/50 hover:border-slate-500 hover:text-slate-100'
                }
              `}
            >
              <input
                type="radio"
                name="difficulty"
                value={option}
                checked={isSelected}
                onChange={() => onChange(option)}
                className="sr-only focus:ring-2 focus:ring-cyan-400"
                aria-label={`Filter by ${label} difficulty`}
              />
              {label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export default memo(DifficultyFilter);
