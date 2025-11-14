import { useState, useMemo } from 'react'
import { BrowserRouter } from 'react-router-dom'
import ProblemCard from './components/ProblemCard'
import HubFilters from './components/HubFilters'
import type { Difficulty, Tag } from './types/problem'
import './App.css'

function App() {
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

  return (
    <BrowserRouter>
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-cyan-400 mb-8 text-center">
            HubFilters Component Test
          </h1>
          
          {/* HubFilters Test */}
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
            <div className="mt-4 p-4 glass rounded-lg">
              <p className="text-slate-300 text-sm">
                <strong>Active Filters ({activeFilterCount}):</strong>
              </p>
              <ul className="text-slate-400 text-sm mt-2 space-y-1">
                {searchTerm && <li>Search: "{searchTerm}"</li>}
                {difficulty !== 'all' && <li>Difficulty: {difficulty}</li>}
                {selectedTags.size > 0 && (
                  <li>Tags: {Array.from(selectedTags).join(', ')}</li>
                )}
                {activeFilterCount === 0 && <li>No filters active</li>}
              </ul>
            </div>
          </div>

          {/* ProblemCard Test */}
          <div>
            <h2 className="text-xl text-slate-300 mb-4">ProblemCard Component</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ProblemCard
                title="Hello, World!"
                slug="hello-world"
                difficulty="easy"
                tags={['string']}
              />
              <ProblemCard
                title="FizzBuzz"
                slug="fizz-buzz"
                difficulty="easy"
                tags={['algorithm', 'math']}
              />
              <ProblemCard
                title="Binary Search Tree Implementation"
                slug="binary-search-tree"
                difficulty="medium"
                tags={['data-structure', 'recursion']}
              />
              <ProblemCard
                title="Dijkstra's Shortest Path"
                slug="dijkstra-shortest-path"
                difficulty="hard"
                tags={['graph', 'algorithm', 'greedy']}
              />
            </div>
          </div>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
