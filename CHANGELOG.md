# Changelog

All notable changes to this project will be documented in this file.

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




