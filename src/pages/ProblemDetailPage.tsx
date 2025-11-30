import { useParams, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowUp, BookOpen, ExternalLink, Code2, Info } from 'lucide-react';
import { useProblems } from '../hooks/useProblems';
import { DIFFICULTY_COLORS } from '../constants/colors';
import BinarySearchVisualization from '../components/visualizations/BinarySearchVisualization';
import HundredDoorsVisualization from '../components/visualizations/HundredDoorsVisualization';
import HundredPrisonersVisualization from '../components/visualizations/HundredPrisonersVisualization';
import FifteenPuzzleVisualization from '../components/visualizations/FifteenPuzzleVisualization';
import FourRingsPuzzleVisualization from '../components/visualizations/FourRingsPuzzleVisualization';
import TwentyOneGameVisualization from '../components/visualizations/TwentyOneGameVisualization';
import TwentyFourGameVisualization from '../components/visualizations/TwentyFourGameVisualization';
import TwentyFourGameSolverVisualization from '../components/visualizations/TwentyFourGameSolverVisualization';
import NineBillionNamesVisualization from '../components/visualizations/NineBillionNamesVisualization';
import NinetyNineBottlesVisualization from '../components/visualizations/NinetyNineBottlesVisualization';
import APlusBVisualization from '../components/visualizations/APlusBVisualization';
import AbbreviationsAutomaticVisualization from '../components/visualizations/AbbreviationsAutomaticVisualization';
import ABCCorrelationVisualization from '../components/visualizations/ABCCorrelationVisualization';
import ABCProblemVisualization from '../components/visualizations/ABCProblemVisualization';
import ABCWordsVisualization from '../components/visualizations/ABCWordsVisualization';
import AbelianSandpileVisualization from '../components/visualizations/AbelianSandpileVisualization';
import AbelianSandpileIdentityVisualization from '../components/visualizations/AbelianSandpileIdentityVisualization';
import AbundantOddNumbersVisualization from '../components/visualizations/AbundantOddNumbersVisualization';
import AccumulatorFactoryVisualization from '../components/visualizations/AccumulatorFactoryVisualization';
import AchillesNumbersVisualization from '../components/visualizations/AchillesNumbersVisualization';
import AliquotSequenceVisualization from '../components/visualizations/AliquotSequenceVisualization';
import AlmkvistGiulleraVisualization from '../components/visualizations/AlmkvistGiulleraVisualization';
import AmbVisualization from '../components/visualizations/AmbVisualization';
import AnadromesVisualization from '../components/visualizations/AnadromesVisualization';
import AnagramGeneratorVisualization from '../components/visualizations/AnagramGeneratorVisualization';
import DerangedAnagramsVisualization from '../components/visualizations/DerangedAnagramsVisualization';
import AnaprimesVisualization from '../components/visualizations/AnaprimesVisualization';
import AngleDifferenceVisualization from '../components/visualizations/AngleDifferenceVisualization';
import AnimatedSpinnersVisualization from '../components/visualizations/AnimatedSpinnersVisualization';
import AntiPrimesVisualization from '../components/visualizations/AntiPrimesVisualization';
import DigitalFilterVisualization from '../components/visualizations/DigitalFilterVisualization';
import ApproximateEqualityVisualization from '../components/visualizations/ApproximateEqualityVisualization';
import AperysConstantVisualization from '../components/visualizations/AperysConstantVisualization';
import ArchimedeanSpiralVisualization from '../components/visualizations/ArchimedeanSpiralVisualization';
import ArenaStoragePoolVisualization from '../components/visualizations/ArenaStoragePoolVisualization';
import ArithmeticDerivativeVisualization from '../components/visualizations/ArithmeticDerivativeVisualization';
import ArithmeticEvaluationVisualization from '../components/visualizations/ArithmeticEvaluationVisualization';
import ArithmeticNumbersVisualization from '../components/visualizations/ArithmeticNumbersVisualization';
import ArithmeticGeometricMeanVisualization from '../components/visualizations/ArithmeticGeometricMeanVisualization';
import AGMCalculatePiVisualization from '../components/visualizations/AGMCalculatePiVisualization';
import ArrayLengthVisualization from '../components/visualizations/ArrayLengthVisualization';
import AscendingPrimesVisualization from '../components/visualizations/AscendingPrimesVisualization';
import ASCIIArtDiagramVisualization from '../components/visualizations/ASCIIArtDiagramVisualization';
import AssociativeArrayMergingVisualization from '../components/visualizations/AssociativeArrayMergingVisualization';
import AttractiveNumbersVisualization from '../components/visualizations/AttractiveNumbersVisualization';
import AutogramCheckerVisualization from '../components/visualizations/AutogramCheckerVisualization';
import AverageLoopLengthVisualization from '../components/visualizations/AverageLoopLengthVisualization';
import MeanAngleVisualization from '../components/visualizations/MeanAngleVisualization';
import PythagoreanMeansVisualization from '../components/visualizations/PythagoreanMeansVisualization';
import RootMeanSquareVisualization from '../components/visualizations/RootMeanSquareVisualization';
import AVLTreeVisualization from '../components/visualizations/AVLTreeVisualization';
import BabbageProblemVisualization from '../components/visualizations/BabbageProblemVisualization';
import BabylonianSpiralVisualization from '../components/visualizations/BabylonianSpiralVisualization';
import BalancedBracketsVisualization from '../components/visualizations/BalancedBracketsVisualization';
import BalancedTernaryVisualization from '../components/visualizations/BalancedTernaryVisualization';
import BarnsleyFernVisualization from '../components/visualizations/BarnsleyFernVisualization';
import Base64EncodeDecodeVisualization from '../components/visualizations/Base64EncodeDecodeVisualization';
import TwentyFortyEightVisualization from '../components/visualizations/TwentyFortyEightVisualization';
import AbstractTypeVisualization from '../components/visualizations/AbstractTypeVisualization';
import AbundantDeficientPerfectVisualization from '../components/visualizations/AbundantDeficientPerfectVisualization';
import AckermannFunctionVisualization from '../components/visualizations/AckermannFunctionVisualization';
import ActiveDirectoryVisualization from '../components/visualizations/ActiveDirectoryVisualization';
import ActiveObjectVisualization from '../components/visualizations/ActiveObjectVisualization';
import AddVariableRuntimeVisualization from '../components/visualizations/AddVariableRuntimeVisualization';
import AdditivePrimesVisualization from '../components/visualizations/AdditivePrimesVisualization';
import AddressOfVariableVisualization from '../components/visualizations/AddressOfVariableVisualization';
import ADFGVXCipherVisualization from '../components/visualizations/ADFGVXCipherVisualization';
import AKSTestForPrimesVisualization from '../components/visualizations/AKSTestForPrimesVisualization';
import AlgebraicDataTypesVisualization from '../components/visualizations/AlgebraicDataTypesVisualization';
import AlignColumnsVisualization from '../components/visualizations/AlignColumnsVisualization';
import AlmostPrimeVisualization from '../components/visualizations/AlmostPrimeVisualization';
import AnglesConversionVisualization from '../components/visualizations/AnglesConversionVisualization';
import AnimatePendulumVisualization from '../components/visualizations/AnimatePendulumVisualization';
import AnimationVisualization from '../components/visualizations/AnimationVisualization';
import AnonymousRecursionVisualization from '../components/visualizations/AnonymousRecursionVisualization';
import AppendRecordVisualization from '../components/visualizations/AppendRecordVisualization';
import ApplyCallbackVisualization from '../components/visualizations/ApplyCallbackVisualization';
import ArbitraryPrecisionVisualization from '../components/visualizations/ArbitraryPrecisionVisualization';
import ArithmeticComplexVisualization from '../components/visualizations/ArithmeticComplexVisualization';
import ArithmeticIntegerVisualization from '../components/visualizations/ArithmeticIntegerVisualization';
import ArithmeticRationalVisualization from '../components/visualizations/ArithmeticRationalVisualization';
import ArrayConcatenationVisualization from '../components/visualizations/ArrayConcatenationVisualization';
import ArraysVisualization from '../components/visualizations/ArraysVisualization';
import AssertionsVisualization from '../components/visualizations/AssertionsVisualization';
import AssociativeArrayCreationVisualization from '../components/visualizations/AssociativeArrayCreationVisualization';
import AssociativeArrayIterationVisualization from '../components/visualizations/AssociativeArrayIterationVisualization';
import AtomicUpdatesVisualization from '../components/visualizations/AtomicUpdatesVisualization';
import ArithmeticMeanVisualization from '../components/visualizations/ArithmeticMeanVisualization';

export default function ProblemDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const { problems, isLoading } = useProblems();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showBackButton, setShowBackButton] = useState(false);
  
  // Preserve the search params from where user came from
  const backUrl = location.state?.from || '/';
  
  // Map of problem slugs to their visualization components
  const visualizations: Record<string, React.ReactNode> = {
    'binary-search': <BinarySearchVisualization />,
    '100-doors': <HundredDoorsVisualization />,
    '100-prisoners': <HundredPrisonersVisualization />,
    '15-puzzle-game': <FifteenPuzzleVisualization/>,
    '4-rings-puzzle': <FourRingsPuzzleVisualization />,
    '21-game': <TwentyOneGameVisualization />,
    '24-game': <TwentyFourGameVisualization />,
    '24-game-solve': <TwentyFourGameSolverVisualization />,
    '9-billion-names': <NineBillionNamesVisualization />,
    '99-bottles': <NinetyNineBottlesVisualization />,
    'a-plus-b': <APlusBVisualization />,
    'abbreviations-automatic': <AbbreviationsAutomaticVisualization />,
    'abc-correlation': <ABCCorrelationVisualization />,
    'abc-problem': <ABCProblemVisualization />,
    'abc-words': <ABCWordsVisualization />,
    'abelian-sandpile': <AbelianSandpileVisualization />,
    'abelian-sandpile-identity': <AbelianSandpileIdentityVisualization />,
    'abundant-odd-numbers': <AbundantOddNumbersVisualization />,
    'accumulator-factory': <AccumulatorFactoryVisualization />,
    'achilles-numbers': <AchillesNumbersVisualization />,
    'aliquot-sequence-classifications': <AliquotSequenceVisualization />,
    'almkvist-giullera-formula': <AlmkvistGiulleraVisualization />,
    'amb': <AmbVisualization />,
    'anadromes': <AnadromesVisualization />,
    'anagram-generator': <AnagramGeneratorVisualization />,
    'deranged-anagrams': <DerangedAnagramsVisualization />,
    'anaprimes': <AnaprimesVisualization />,
    'angle-difference': <AngleDifferenceVisualization />,
    'animated-spinners': <AnimatedSpinnersVisualization />,
    'anti-primes': <AntiPrimesVisualization />,
    'digital-filter': <DigitalFilterVisualization />,
    'approximate-equality': <ApproximateEqualityVisualization />,
    'aperys-constant': <AperysConstantVisualization />,
    'archimedean-spiral': <ArchimedeanSpiralVisualization />,
    'arena-storage-pool': <ArenaStoragePoolVisualization />,
    'arithmetic-derivative': <ArithmeticDerivativeVisualization />,
    'arithmetic-evaluation': <ArithmeticEvaluationVisualization />,
    'arithmetic-numbers': <ArithmeticNumbersVisualization />,
    'arithmetic-geometric-mean': <ArithmeticGeometricMeanVisualization />,
    'agm-calculate-pi': <AGMCalculatePiVisualization />,
    'array-length': <ArrayLengthVisualization />,
    'ascending-primes': <AscendingPrimesVisualization />,
    'ascii-art-diagram': <ASCIIArtDiagramVisualization />,
    'associative-array-merging': <AssociativeArrayMergingVisualization />,
    'attractive-numbers': <AttractiveNumbersVisualization />,
    'autogram-checker': <AutogramCheckerVisualization />,
    'average-loop-length': <AverageLoopLengthVisualization />,
    'mean-angle': <MeanAngleVisualization />,
    'pythagorean-means': <PythagoreanMeansVisualization />,
    'root-mean-square': <RootMeanSquareVisualization />,
    'avl-tree': <AVLTreeVisualization />,
    'babbage-problem': <BabbageProblemVisualization />,
    'babylonian-spiral': <BabylonianSpiralVisualization />,
    'balanced-brackets': <BalancedBracketsVisualization />,
    'balanced-ternary': <BalancedTernaryVisualization />,
    'barnsley-fern': <BarnsleyFernVisualization />,
    'base64-encode-decode': <Base64EncodeDecodeVisualization />,
    '2048-game': <TwentyFortyEightVisualization />,
    'abstract-type': <AbstractTypeVisualization />,
    'abundant-deficient-perfect': <AbundantDeficientPerfectVisualization />,
    'ackermann-function': <AckermannFunctionVisualization />,
    'active-directory': <ActiveDirectoryVisualization />,
    'active-object': <ActiveObjectVisualization />,
    'add-variable-runtime': <AddVariableRuntimeVisualization />,
    'additive-primes': <AdditivePrimesVisualization />,
    'address-of-variable': <AddressOfVariableVisualization />,
    'adfgvx-cipher': <ADFGVXCipherVisualization />,
    'aks-test-for-primes': <AKSTestForPrimesVisualization />,
    'algebraic-data-types': <AlgebraicDataTypesVisualization />,
    'align-columns': <AlignColumnsVisualization />,
    'almost-prime': <AlmostPrimeVisualization />,
    'angles-conversion': <AnglesConversionVisualization />,
    'animate-pendulum': <AnimatePendulumVisualization />,
    'animation': <AnimationVisualization />,
    'anonymous-recursion': <AnonymousRecursionVisualization />,
    'append-record-to-file': <AppendRecordVisualization />,
    'apply-callback-to-array': <ApplyCallbackVisualization />,
    'arbitrary-precision-integers': <ArbitraryPrecisionVisualization />,
    'arithmetic-complex': <ArithmeticComplexVisualization />,
    'arithmetic-integer': <ArithmeticIntegerVisualization />,
    'arithmetic-rational': <ArithmeticRationalVisualization />,
    'array-concatenation': <ArrayConcatenationVisualization />,
    'arrays': <ArraysVisualization />,
    'assertions': <AssertionsVisualization />,
    'associative-array-creation': <AssociativeArrayCreationVisualization />,
    'associative-array-iteration': <AssociativeArrayIterationVisualization />,
    'atomic-updates': <AtomicUpdatesVisualization />,
    'arithmetic-mean': <ArithmeticMeanVisualization />,
  };
  
  // Find the problem by slug
  const problem = problems.find((p) => p.slug === slug);

  // Handle scroll for showing buttons
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      setShowBackButton(scrolled > 200);
      setShowScrollTop(scrolled > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 404 - Problem not found
  if (problems.length > 0 && !problem) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[bottom_1px_center] dark:bg-grid-slate-400/[0.05]" />
        <div className="text-center max-w-md relative z-10">
          <div className="glass rounded-2xl p-12 border border-slate-700/50 shadow-2xl">
            <div className="text-6xl mb-6 animate-bounce">🔍</div>
            <h1 className="text-4xl font-bold text-slate-100 mb-4">
              Problem Not Found
            </h1>
            <p className="text-slate-400 mb-8">
              The problem "{slug}" doesn't exist in our collection.
            </p>
            <Link
              to={backUrl}
              className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-xl transition-all duration-200 border border-cyan-500/20 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/10"
            >
              <ArrowLeft size={18} />
              <span>Return to Hub</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-12 border border-slate-700/50 shadow-xl">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
              </div>
            </div>
            <div className="text-slate-400 text-lg font-medium animate-pulse">Loading problem...</div>
          </div>
        </div>
      </div>
    );
  }

  // TypeScript guard - this should never happen due to the 404 check above
  if (!problem) {
    return null;
  }

  return (
    <div className="min-h-screen pb-20 relative">
      {/* Immersive Background Header */}
      <div className="absolute top-0 left-0 right-0 h-[500px] overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/0 via-slate-900/80 to-slate-950" />
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-cyan-500/5 rounded-full blur-[100px]" />
        <div className="absolute top-[10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10 pt-8 md:pt-12">
        {/* Top Navigation */}
        <div className="mb-8">
          <Link
            to={backUrl}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors group"
          >
            <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 group-hover:border-cyan-500/30 group-hover:bg-cyan-500/10 transition-all">
              <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </div>
            <span className="font-medium">Back to Hub</span>
          </Link>
        </div>

        {/* Floating Back Button - Appears on scroll */}
        <AnimatePresence>
          {showBackButton && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="fixed left-6 md:left-10 top-24 z-40 hidden xl:block"
            >
              <Link
                to={backUrl}
                className="group flex items-center gap-2 px-4 py-2.5 bg-slate-900/80 hover:bg-slate-800/90 backdrop-blur-md border border-slate-700/50 hover:border-cyan-500/50 rounded-xl transition-all shadow-lg hover:shadow-cyan-500/20 text-slate-300 hover:text-cyan-400"
              >
                <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                <span className="text-sm font-medium">Back</span>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scroll to Top Button */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed right-6 md:right-8 bottom-8 z-40"
            >
              <button
                onClick={scrollToTop}
                className="group p-3 bg-slate-900/80 hover:bg-cyan-500/20 backdrop-blur-md border border-slate-700/50 hover:border-cyan-500/50 rounded-xl transition-all shadow-lg hover:shadow-cyan-500/20 text-slate-300 hover:text-cyan-400"
                title="Scroll to top"
              >
                <ArrowUp size={20} className="transition-transform group-hover:-translate-y-1" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 items-start">
          {/* Main Content Column */}
          <div className="space-y-8">
            {/* Problem Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${DIFFICULTY_COLORS[problem.difficulty]} bg-opacity-10`}>
                  {problem.difficulty}
                </span>
                {problem.createdAt && (
                  <span className="text-slate-500 text-sm font-mono">
                    {new Date(problem.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                )}
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400 mb-6 leading-tight">
                {problem.title}
              </h1>

              <div className="flex flex-wrap gap-2">
                {problem.tags.map((tag, index) => (
                  <motion.span
                    key={tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="px-3 py-1.5 bg-slate-800/50 text-slate-300 rounded-lg text-xs font-medium border border-slate-700/50 hover:border-cyan-500/30 hover:bg-slate-800 hover:text-cyan-300 transition-all cursor-default"
                  >
                    #{tag}
                  </motion.span>
                ))}
              </div>
            </motion.div>

            {/* Visualization Container */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative glass rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl">
                {/* Window Controls Decoration */}
                <div className="h-10 bg-slate-900/50 border-b border-slate-700/50 flex items-center px-4 gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                  <div className="ml-auto text-xs text-slate-500 font-mono flex items-center gap-1">
                    <Code2 size={12} />
                    <span>Interactive Mode</span>
                  </div>
                </div>

                {/* Visualization Content */}
                <div className="p-1 bg-slate-950/30">
                  {visualizations[problem.slug] ? (
                    <div className="visualization-container min-h-[400px] flex items-center justify-center">
                      {visualizations[problem.slug]}
                    </div>
                  ) : (
                    <div className="p-12 text-center relative overflow-hidden min-h-[400px] flex flex-col items-center justify-center">
                      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: 'spring' }}
                        className="text-6xl mb-6"
                      >
                        🚧
                      </motion.div>
                      <h2 className="text-2xl font-bold text-slate-100 mb-3">
                        Visualization In Progress
                      </h2>
                      <p className="text-slate-400 max-w-md mx-auto mb-8">
                        Our engineers are currently crafting an interactive experience for this problem. 
                        Please check back later!
                      </p>
                      <div className="flex gap-4 justify-center">
                        <div className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-slate-400">
                          Status: <span className="text-yellow-400">Development</span>
                        </div>
                        <div className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-slate-400">
                          ETA: <span className="text-cyan-400">Coming Soon</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar Column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-6 lg:sticky lg:top-24"
          >
            {/* Description Card */}
            <div className="glass rounded-2xl p-6 border border-slate-700/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex items-center gap-2 mb-4 text-cyan-400">
                <Info size={20} />
                <h3 className="font-bold text-lg">About this Problem</h3>
              </div>
              
              {problem.description ? (
                <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed">
                  <p className="whitespace-pre-line">{problem.description}</p>
                </div>
              ) : (
                <p className="text-slate-500 italic text-sm">No description available.</p>
              )}
            </div>

            {/* Metadata Card */}
            <div className="glass rounded-2xl p-6 border border-slate-700/50">
              <h3 className="font-bold text-slate-200 mb-4 text-sm uppercase tracking-wider">Resources</h3>
              
              <div className="space-y-3">
                {problem.rosettaCodeUrl && (
                  <a
                    href={problem.rosettaCodeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/30 hover:bg-slate-800 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-700/50 text-slate-300 group-hover:text-cyan-300 transition-colors">
                        <BookOpen size={16} />
                      </div>
                      <span className="text-sm font-medium text-slate-300 group-hover:text-slate-100">Rosetta Code</span>
                    </div>
                    <ExternalLink size={14} className="text-slate-500 group-hover:text-cyan-400 transition-colors" />
                  </a>
                )}
                
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                  <div className="flex items-center gap-2 mb-2 text-xs font-medium text-slate-400">
                    <Code2 size={14} />
                    <span>Implementation</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    This visualization is implemented using React and Motion. View the source code on GitHub to learn more.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
