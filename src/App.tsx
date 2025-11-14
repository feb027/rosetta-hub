import { BrowserRouter } from 'react-router-dom'
import ProblemCard from './components/ProblemCard'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-4xl w-full">
          <h1 className="text-4xl font-bold text-cyan-400 mb-8 text-center">
            ProblemCard Component Test
          </h1>
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
    </BrowserRouter>
  )
}

export default App
