import { useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import ProblemCard from './components/ProblemCard'
import SearchInput from './components/SearchInput'
import './App.css'

function App() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <BrowserRouter>
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-cyan-400 mb-8 text-center">
            Component Test
          </h1>
          
          {/* SearchInput Test */}
          <div className="mb-8">
            <h2 className="text-xl text-slate-300 mb-4">SearchInput Component</h2>
            <SearchInput 
              value={searchTerm}
              onChange={setSearchTerm}
            />
            {searchTerm && (
              <p className="text-slate-400 mt-2 text-sm">
                Search term: "{searchTerm}"
              </p>
            )}
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
