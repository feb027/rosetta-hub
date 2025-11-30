# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2025-11-30

### Added
- **New Problem**: "AVL Tree"
  - Added metadata and `AVLTreeVisualization` component.
  - Implemented "Balance Architect" with tree structure visualization theme.
  - Features interactive SVG tree with animated node insertion and deletion.
  - Balance factor badges on each node with color coding (emerald/amber/rose).
  - Automatic rebalancing with rotation animations and sound effects.
  - Search functionality with node highlighting.
  - Preset examples: Balanced, Sequential, Reverse, Random insertions.
  - Tree statistics panel showing node count, height, and root balance.
  - Legend explaining balance factor colors and acceptable ranges.
  - Sound effects for insert, delete, rotate, search, found, and not-found.
- **New Problem**: "Associative Array/Merging"
  - Added metadata and `AssociativeArrayMergingVisualization` component.
  - Implemented "Data Fusion Lab" with sci-fi laboratory theme.
  - Features side-by-side BASE and UPDATE arrays with interactive editing.
  - Animated step-by-step merge process showing kept, overridden, and new keys.
  - Color-coded results: cyan for base values, amber for overrides, emerald for new keys.
  - Live JavaScript code preview showing spread operator syntax.
  - Add/remove key-value pairs interactively with preset examples.
  - Stats panel showing merge breakdown (kept, overridden, new).
  - Sound effects for merge steps, overrides, new keys, and completion.
- **New Problem**: "Attractive Numbers"
  - Added metadata and `AttractiveNumbersVisualization` component.
  - Implemented "Magnetic Field Lab" with magnetic attraction theme.
  - Features animated scanning of numbers 2-120 with magnetic field visualization.
  - Color-coded by factor count: rose (2), amber (3), emerald (5), cyan (7).
  - Click any number to see prime factorization and attractiveness check.
  - Test any number up to 10,000 with instant result display.
  - Animated concentric field lines and glowing attractive numbers.
  - Speed control slider and instant-reveal option.
  - Sound effects for scanning, discovery, and magnetic attraction.
- **New Problem**: "Autogram Checker"
  - Added metadata and `AutogramCheckerVisualization` component.
  - Implemented "Self-Portrait Studio" with character frequency visualization.
  - Features bar chart showing actual vs claimed letter counts.
  - Animated letter-by-letter verification with progress indicator.
  - Preset example sentences including valid autograms.
  - Color-coded results: emerald for matches, red for mismatches, amber for claimed.
  - Detailed mismatch breakdown showing claimed vs actual counts.
  - Toggle to show all 26 letters or only those with data.
  - Sound effects for checking, matches, mismatches, and completion.
- **New Problem**: "Average Loop Length"
  - Added metadata and `AverageLoopLengthVisualization` component.
  - Implemented "Orbit Tracker" with space/orbital theme.
  - Features dual bar chart comparing simulated vs analytical values.
  - Configurable N range (1-20) and simulation count (1K-100K).
  - Results table showing N, simulated, analytical, and error percentage.
  - Single orbit visualizer showing path until first repetition.
  - Animated path with color-coded loop start and repeated element.
  - Orbital ring decorations and progress tracking.
  - Sound effects for steps, loop detection, and completion.
- **New Problem**: "Averages/Root Mean Square"
  - Added metadata and `RootMeanSquareVisualization` component.
  - Implemented "Power Station Meter" with electrical engineering theme.
  - Features animated analog gauge with needle showing RMS value.
  - Step-by-step breakdown: Square → Sum → Mean → Root with animations.
  - Animated waveform background simulating AC power signals.
  - Preset examples: 1-10, AC Wave, Sine Peak, Equal values, Mixed.
  - Add/remove numbers dynamically with positive/negative support.
  - Color-coded phases: cyan (square), emerald (sum), amber (mean), rose (root).
  - RMS vs Arithmetic Mean comparison bar chart.
  - Stats panel showing count, min, max, and range.
  - Sound effects for squaring, summing, dividing, rooting, and completion.
- **New Problem**: "Averages/Mean Angle"
  - Added metadata and `MeanAngleVisualization` component.
  - Implemented "Wind Rose Compass" with nautical compass theme.
  - Features interactive SVG compass with cardinal directions.
  - Animated vector visualization for each input angle.
  - Shows both correct mean (emerald) and wrong arithmetic mean (red dashed).
  - Add/remove angles dynamically with color-coded vectors.
  - Preset examples including the classic 350°/10° case.
  - Displays vector components (Σcos/n, Σsin/n) and direction name.
  - Sound effects for adding, removing, calculation steps, and completion.
- **New Problem**: "Averages/Pythagorean Means"
  - Added metadata and `PythagoreanMeansVisualization` component.
  - Implemented "Triple Scale Balance" with three-column comparison theme.
  - Features animated bar charts for Arithmetic, Geometric, and Harmonic means.
  - Color-coded: cyan (A), emerald (G), rose (H) with gradient fills.
  - Verifies A ≥ G ≥ H inequality with visual confirmation.
  - Add/remove numbers dynamically with preset examples.
  - Shows formulas and computed values for each mean type.
  - Stats panel with count, sum, product, and A-H spread.
  - Sound effects for adding, removing, calculation steps, and completion.
- **New Problem**: "Arithmetic-Geometric Mean"
  - Added metadata and `ArithmeticGeometricMeanVisualization` component.
  - Implemented "Convergence Pendulum" with dual pendulum visualization.
  - Features two animated pendulums (arithmetic and geometric) swinging toward convergence.
  - Includes preset examples (Classic 1/√2, Golden ratio, etc.), step-by-step iteration.
  - Interactive controls with play/pause, step forward, and speed adjustment.
  - Iteration history table with expandable view.
  - Formula cards showing arithmetic and geometric mean equations.
  - Sound effects for steps, convergence celebration, and interactions.
- **New Problem**: "AGM / Calculate Pi"
  - Added metadata and `AGMCalculatePiVisualization` component.
  - Implemented "Pi Observatory" with Gauss-Legendre algorithm visualization.
  - Features animated π digit display with correct digits highlighted in green.
  - Shows all four AGM variables (a, b, t, p) with pulsing animations during computation.
  - Iteration progress bar with digit milestone markers.
  - Expandable iteration history table showing π approximation and digit gains.
  - Formula display showing all Gauss-Legendre equations.
  - Orbiting circles decoration and particle celebration on completion.
  - Sound effects for steps, new digit discovery, and completion.
- **New Problem**: "Array Length"
  - Added metadata and `ArrayLengthVisualization` component.
  - Implemented "Cargo Yard Scanner" with shipping container theme.
  - Features colorful containers representing array elements with index badges.
  - Animated scanner beam that counts containers one by one.
  - Add/remove containers interactively with max 10 elements.
  - Preset arrays (Fruits, Numbers, Empty, Colors, Mixed).
  - Live code representation showing JavaScript array syntax.
  - Stats display showing element count, first/last indices.
  - Sound effects for scanning, adding, removing, and completion.
- **New Problem**: "Ascending Primes"
  - Added metadata and `AscendingPrimesVisualization` component.
  - Implemented "Prime Peaks" with mountain/staircase theme.
  - Features animated staircase visualization where each digit is a step.
  - Discovery animation reveals all 511 ascending primes progressively.
  - Digit distribution bar chart showing progress by digit count.
  - Filter by digit count (1-9 digits) and search/verify any number.
  - Click any prime to see its staircase visualization and rank.
  - Notable primes display (smallest: 2, largest: 123456789).
  - Sound effects for discovery, selection, and completion.
- **New Problem**: "ASCII Art Diagram Converter"
  - Added metadata and `ASCIIArtDiagramVisualization` component.
  - Implemented "Blueprint Decoder" with split-panel technical schematic layout.
  - Left panel: editable ASCII diagram input with grid overlay effect.
  - Right panel: decoded structure with Visual and Binary view modes.
  - Visual mode shows color-coded fields with bit boxes and click-to-select.
  - Binary mode generates C-style struct code from parsed fields.
  - Preset diagrams: DNS Header, TCP Flags, Simple, Custom.
  - Animated parsing reveals fields one by one with bit ruler.
  - Field details panel shows name, size, offset, and value range.
  - Sound effects for parsing steps, completion, and selection.
- **New Problem**: "Arena Storage Pool"
  - Added metadata and `ArenaStoragePoolVisualization` component.
  - Implemented "Memory Arena Factory" with industrial control panel theme.
  - Features multiple arenas with individual allocation and group deallocation.
  - Includes memory block visualization with type-based coloring (int, float, string, object).
  - Auto-allocation mode, keyboard shortcuts, and allocation log.
  - Sound effects for allocation, deallocation, and arena operations.
- **New Problem**: "Arithmetic Derivative"
  - Added metadata and `ArithmeticDerivativeVisualization` component.
  - Implemented "Derivative Laboratory" with chemistry/science lab theme.
  - Features step-by-step computation showing Leibniz rule breakdown.
  - Includes batch computation for range -99 to 100 with color-coded results.
  - Prime detection highlighting, formula reference cards, and preset examples.
  - Sound effects for steps, prime detection, and completion.
- **New Problem**: "Arithmetic Evaluation"
  - Added metadata and `ArithmeticEvaluationVisualization` component.
  - Implemented "Syntax Tree Builder" with interactive AST visualization.
  - Features 3-phase pipeline: Tokenize → Parse → Evaluate with animated transitions.
  - Visual tree with animated nodes, edges, and bottom-up evaluation flow.
  - Color-coded tokens (numbers, operators, parentheses) and tree nodes.
  - Real-time result badges appearing on evaluated nodes.
  - Sound effects for each phase and node evaluation.
- **New Problem**: "Arithmetic Numbers"
  - Added metadata and `ArithmeticNumbersVisualization` component.
  - Implemented "Divisor Balance" with animated balance scale visualization.
  - Scale wobbles and settles based on whether divisor average is integer.
  - Shows all divisors with prime highlighting and hover effects.
  - Discovery mode animates through first 100 arithmetic numbers.
  - Interactive number picker with increment/decrement buttons.
  - Sound effects for testing, success/fail, and discovery.

### Fixed
- **Bug**: Fixed pagination state not persisting when navigating to a problem and back
  - Page number is now stored in URL query parameter (`?page=4`)
  - Navigating to a problem detail page and returning now preserves the current page
- **Bug**: Fixed back button in ProblemDetailPage not preserving pagination state
  - Back button now uses React Router's location state to return to the exact page
  - All back navigation links (top, floating, 404) now preserve URL query parameters
- **Bug**: Fixed Pagination component showing duplicate page numbers
  - Rewrote pagination logic to prevent duplicate keys in React rendering
  - Shows all pages for ≤7 total pages, uses smart ellipsis for larger counts

### Changed
- **UI**: Redesigned Pagination component for scalability (1000+ problems support)
  - Smart pagination with ellipsis for large page counts (shows first, last, and surrounding pages)
  - Added "Jump to page" input when clicking ellipsis
  - Added First/Last page buttons for quick navigation
  - Added page info display showing "Page X of Y"
  - Improved mobile responsiveness with condensed controls
  - Smooth animations on page button interactions

### Added
- **New Problem**: "Apéry's Constant"
  - Added metadata and `AperysConstantVisualization` component.
  - Implemented "Infinite Series Observatory" with cosmic starfield theme.
  - Features three convergence methods racing: Direct Summation, Markov/Apéry, and Fast Convergence.
  - Includes real-time digit matching, convergence rate comparison, and efficiency metrics.
- **New Problem**: "Archimedean Spiral"
  - Added metadata and `ArchimedeanSpiralVisualization` component.
  - Implemented "Spiral Forge" with canvas-based polar coordinate rendering.
  - Features adjustable parameters (a, b, turns), presets, animated drawing, and polar grid overlay.
- **New Problem**: "Anagrams/Deranged Anagrams"
  - Added metadata and `DerangedAnagramsVisualization` component.
  - Implemented "DNA Strand Comparator" visualization with character-by-character position analysis.
  - Features dual-strand display, animated scanning, and derangement detection.
- **New Problem**: "Anaprimes"
  - Added metadata and `AnaprimesVisualization` component.
  - Implemented "Cosmic Prime Constellation Observatory" with interactive starfield.
  - Features constellation clusters representing anagram groups, scan history, and digit range selection.
- **New Problem**: "Angle Difference Between Two Bearings"
  - Added metadata and `AngleDifferenceVisualization` component.
  - Implemented "Maritime Bearing Calculator" with interactive compass rose.
  - Features dual compass needles, animated arc display, preset test cases, and navigation log.
- **New Problem**: "Animated Spinners"
  - Added metadata and `AnimatedSpinnersVisualization` component.
  - Implemented "Hypnotic Vortex" visualization with canvas-based rendering.
  - Features 5 spinners with trails, mouse offset control, speed adjustment, and trail length customization.
- **New Problem**: "Anti-primes"
  - Added metadata and `AntiPrimesVisualization` component.
  - Implemented "Divisor Skyline" visualization with city builder theme.
  - Features building heights based on divisor count, lit windows, and amber/gold color scheme.
- **New Problem**: "Apply a Digital Filter (Direct Form II Transposed)"
  - Added metadata and `DigitalFilterVisualization` component.
  - Implemented "Signal Processor" with dual oscilloscope display.
  - Features waveform visualization, multiple signal types, filter coefficients display, and sample comparison table.
- **New Problem**: "Approximate Equality"
  - Added metadata and `ApproximateEqualityVisualization` component.
  - Implemented "Precision Balance" with animated scale visualization.
  - Features custom value testing, adjustable epsilon, results table, and rose/pink color scheme.

### Changed
- **UI**: Redesigned Changelog page for scalability (1000+ problems support)
  - Added collapsible release sections with expand/collapse functionality.
  - Added collapsible change items with detail dropdowns.
  - Added search functionality to filter releases and changes.
  - Added filter tabs (All/Added/Changed/Fixed) within each release.
  - Added stats bar showing total releases, problems added, and total changes.
  - Added "Expand All / Collapse All" toggle button.

## [Unreleased] - 2025-11-20

### Added
- **New Problem**: "Abelian Sandpile Model - Identity"
  - Added metadata and `AbelianSandpileIdentityVisualization` component.
  - Implemented "Sandpile Algebra Lab" with interactive 3x3 grids, presets, and step-by-step toppling.
  - Added "Hold-to-Paint" interaction and neon visuals to the original Abelian Sandpile visualization.
- **New Problem**: "Abundant, deficient and perfect number classifications"
  - Added metadata and `AbundantOddNumbersVisualization` component.
  - Added metadata and `AchillesNumbersVisualization` component.
  - Implemented "The Forge of Achilles" visualization with anvil, fire, and shield mechanics.
- **New Problem**: "Aliquot Sequence Classifications"
  - Added metadata and `AliquotSequenceVisualization` component.
  - Implemented "Cosmic Aliquot Explorer" visualization with space theme and sound effects.
- **New Problem**: "Almkvist-Giullera formula for pi"
  - Added metadata and `AlmkvistGiulleraVisualization` component.
  - Implemented "Quantum Pi Loom" visualization with BigInt arithmetic for 70-digit precision.
- **New Problem**: "Amb"
  - Added metadata and `AmbVisualization` component.
  - Implemented "Temporal Divergence" visualization with a dynamic tree layout and glitch sound effects.
- **New Problem**: "Anadromes"
  - Added metadata and `AnadromesVisualization` component.
  - Implemented "Mirror Realm" visualization with split-screen layout and reflection effects.

## [Unreleased] - 2025-11-19

### Added
- **New Problem**: "9 Billion Names of God the Integer"
  - Added metadata and `NineBillionNamesVisualization` component.
  - Implemented Ferrers Diagram visualization with pagination for performance.
  - Added "Calculation Mode" for larger integers.
- **New Problem**: "99 Bottles of Beer"
  - Added metadata and `NinetyNineBottlesVisualization` component.
  - Implemented "Neon Jukebox" visualization with karaoke-style lyrics and interactive bottle wall.
- **New Problem**: "A + B"
  - Added metadata and `APlusBVisualization` component.
  - Implemented "Cyber-Minimalist Data Fusion" visualization with interactive sliders.
- **New Problem**: "Abbreviations, automatic"
  - Added metadata and `AbbreviationsAutomaticVisualization` component.
  - Implemented "Digital Text Distiller" visualization with interactive scanner and conflict detection.
- **Feature**: Pagination for Home Page
  - Implemented client-side pagination (9 items per page).
  - Added glassmorphic pagination controls (Previous, Next, Page Numbers).
  - Added "Showing X-Y of Z" result count display.
- **System**: Tag Categories & Icons
  - Added `loop`, `processing`, `visualization`, and `combinatorics` tags.
  - Mapped new tags to icons (Repeat, Cpu, Monitor, Sigma).
  - Mapped new tags to icons (Repeat, Cpu, Monitor, Sigma).

### Changed
- **UI**: Updated `ProblemGrid` to strictly enforce a 3-column layout on large screens for better consistency.
- **UI**: Refined `HomePage` hero section and filter layout.
- **Performance**: Optimized `NineBillionNamesVisualization` with memoization and pagination.

### Fixed
- **Bug**: Resolved `iconData is undefined` error by ensuring all tags have corresponding icons.
- **Bug**: Fixed variable name conflict (`memo` vs `React.memo`) in `NineBillionNamesVisualization`.
- **Bug**: Fixed "Showing X of Y" text on Home Page to correctly reflect paginated range.




