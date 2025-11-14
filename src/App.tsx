import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-cyan-400 mb-6">
          Rosetta Code Visualization Hub
        </h1>
        <div className="glass p-8 rounded-xl max-w-md">
          <button 
            onClick={() => setCount((count) => count + 1)}
            className="bg-cyan-500 hover:bg-cyan-600 hover:glow-cyan text-slate-900 font-semibold px-6 py-3 rounded-lg transition-all duration-250"
          >
            count is {count}
          </button>
          <p className="text-slate-300 mt-6">
            Testing glassmorphism and custom theme
          </p>
          <div className="mt-4 flex gap-2 justify-center">
            <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">Easy</span>
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm">Medium</span>
            <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm">Hard</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
