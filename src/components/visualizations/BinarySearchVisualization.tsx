import { useState } from 'react';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Step {
  array: number[];
  left: number;
  right: number;
  mid: number;
  target: number;
  found: boolean;
  message: string;
}

export default function BinarySearchVisualization() {
  const [array] = useState([1, 3, 5, 7, 9, 11, 13, 15, 17, 19]);
  const [target, setTarget] = useState(7);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);

  const generateSteps = (arr: number[], targetVal: number): Step[] => {
    const newSteps: Step[] = [];
    let left = 0;
    let right = arr.length - 1;

    newSteps.push({
      array: [...arr],
      left,
      right,
      mid: -1,
      target: targetVal,
      found: false,
      message: `Starting binary search for ${targetVal}`,
    });

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);

      newSteps.push({
        array: [...arr],
        left,
        right,
        mid,
        target: targetVal,
        found: false,
        message: `Checking middle element at index ${mid}: ${arr[mid]}`,
      });

      if (arr[mid] === targetVal) {
        newSteps.push({
          array: [...arr],
          left,
          right,
          mid,
          target: targetVal,
          found: true,
          message: `Found ${targetVal} at index ${mid}!`,
        });
        return newSteps;
      }

      if (arr[mid] < targetVal) {
        newSteps.push({
          array: [...arr],
          left: mid + 1,
          right,
          mid,
          target: targetVal,
          found: false,
          message: `${arr[mid]} < ${targetVal}, search right half`,
        });
        left = mid + 1;
      } else {
        newSteps.push({
          array: [...arr],
          left,
          right: mid - 1,
          mid,
          target: targetVal,
          found: false,
          message: `${arr[mid]} > ${targetVal}, search left half`,
        });
        right = mid - 1;
      }
    }

    newSteps.push({
      array: [...arr],
      left,
      right,
      mid: -1,
      target: targetVal,
      found: false,
      message: `${targetVal} not found in array`,
    });

    return newSteps;
  };

  const handleStart = () => {
    const newSteps = generateSteps(array, target);
    setSteps(newSteps);
    setCurrentStep(0);
    setIsPlaying(true);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
    setSteps([]);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsPlaying(false);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="glass rounded-xl p-4 md:p-6 border border-slate-600/50">
        <h3 className="text-lg md:text-xl font-semibold text-slate-100 mb-4">Interactive Controls</h3>
        
        <div className="flex flex-col gap-4">
          <div className="w-full">
            <label className="block text-sm text-slate-300 mb-2">
              Target Value: <span className="text-cyan-400 font-semibold">{target}</span>
            </label>
            <input
              type="range"
              min="1"
              max="19"
              step="2"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              disabled={steps.length > 0}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <div className="flex gap-2 justify-center flex-wrap">
            {steps.length === 0 ? (
              <button
                onClick={handleStart}
                className="flex items-center gap-2 px-6 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg border border-cyan-500/50 transition-all min-h-[44px]"
              >
                <Play size={18} />
                <span className="font-medium">Start</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="p-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Previous step"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg border border-cyan-500/50 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentStep === steps.length - 1}
                  className="p-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Next step"
                >
                  <ChevronRight size={20} />
                </button>
                <button
                  onClick={handleReset}
                  className="p-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-600/50 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Reset"
                >
                  <RotateCcw size={20} />
                </button>
              </>
            )}
          </div>
        </div>

        {currentStepData && (
          <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <p className="text-slate-300 text-sm">
              <span className="text-cyan-400 font-semibold">Step {currentStep + 1}/{steps.length}:</span>{' '}
              {currentStepData.message}
            </p>
          </div>
        )}
      </div>

      {/* Visualization */}
      {currentStepData && (
        <div className="glass rounded-xl p-4 md:p-6 border border-slate-600/50">
          <h3 className="text-lg md:text-xl font-semibold text-slate-100 mb-4 md:mb-6">Array Visualization</h3>
          
          <div className="overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex justify-center items-end gap-1.5 md:gap-2 min-h-[180px] md:min-h-[200px] min-w-max">
              <AnimatePresence mode="wait">
                {currentStepData.array.map((value, index) => {
                  const isLeft = index >= currentStepData.left && index <= currentStepData.right;
                  const isMid = index === currentStepData.mid;
                  const isFound = isMid && currentStepData.found;
                  const isOutOfRange = index < currentStepData.left || index > currentStepData.right;

                  return (
                    <motion.div
                      key={index}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center gap-2"
                    >
                      <motion.div
                        animate={{
                          scale: isMid ? 1.1 : 1,
                          y: isMid ? -10 : 0,
                        }}
                        className={`
                          w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-lg font-semibold text-xs md:text-sm
                          border-2 transition-all duration-300
                          ${isFound ? 'bg-green-500/20 border-green-500 text-green-400' :
                            isMid ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' :
                            isLeft && !isOutOfRange ? 'bg-blue-500/10 border-blue-500/50 text-blue-300' :
                            'bg-slate-700/30 border-slate-600/30 text-slate-500'}
                        `}
                      >
                        {value}
                      </motion.div>
                      <span className="text-xs text-slate-500">{index}</span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-4 md:mt-6 flex flex-wrap justify-center gap-3 md:gap-6 text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-cyan-500/20 border-2 border-cyan-500"></div>
              <span className="text-slate-300">Current Mid</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-blue-500/10 border-2 border-blue-500/50"></div>
              <span className="text-slate-300">Search Range</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-green-500/20 border-2 border-green-500"></div>
              <span className="text-slate-300">Found</span>
            </div>
          </div>
        </div>
      )}

      {/* Code Example */}
      <div className="glass rounded-xl p-4 md:p-6 border border-slate-600/50">
        <h3 className="text-lg md:text-xl font-semibold text-slate-100 mb-4">Code Implementation</h3>
        <pre className="bg-slate-900/50 rounded-lg p-3 md:p-4 overflow-x-auto text-xs md:text-sm">
          <code className="text-slate-300">
{`function binarySearch(arr: number[], target: number): number {
  let left = 0;
  let right = arr.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    
    if (arr[mid] === target) {
      return mid; // Found!
    }
    
    if (arr[mid] < target) {
      left = mid + 1; // Search right half
    } else {
      right = mid - 1; // Search left half
    }
  }
  
  return -1; // Not found
}`}
          </code>
        </pre>
      </div>

      {/* Complexity Analysis */}
      <div className="glass rounded-xl p-4 md:p-6 border border-slate-600/50">
        <h3 className="text-lg md:text-xl font-semibold text-slate-100 mb-4">Complexity Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
            <h4 className="text-cyan-400 font-semibold mb-2">Time Complexity</h4>
            <p className="text-slate-300 text-sm mb-2">
              <span className="text-green-400 font-mono">O(log n)</span>
            </p>
            <p className="text-slate-400 text-sm">
              The array is halved with each iteration, resulting in logarithmic time complexity.
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
            <h4 className="text-cyan-400 font-semibold mb-2">Space Complexity</h4>
            <p className="text-slate-300 text-sm mb-2">
              <span className="text-green-400 font-mono">O(1)</span>
            </p>
            <p className="text-slate-400 text-sm">
              Only a constant amount of extra space is used for variables.
            </p>
          </div>
        </div>
        
        <div className="mt-4 bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <h4 className="text-cyan-400 font-semibold mb-2">Key Points</h4>
          <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
            <li>Requires a sorted array</li>
            <li>Much faster than linear search for large datasets</li>
            <li>Divides search space in half each iteration</li>
            <li>Maximum steps = log₂(n) + 1</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
