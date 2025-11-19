# Changelog

All notable changes to this project will be documented in this file.

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

### Changed
- **UI**: Updated `ProblemGrid` to strictly enforce a 3-column layout on large screens for better consistency.
- **UI**: Refined `HomePage` hero section and filter layout.
- **Performance**: Optimized `NineBillionNamesVisualization` with memoization and pagination.

### Fixed
- **Bug**: Resolved `iconData is undefined` error by ensuring all tags have corresponding icons.
- **Bug**: Fixed variable name conflict (`memo` vs `React.memo`) in `NineBillionNamesVisualization`.
- **Bug**: Fixed "Showing X of Y" text on Home Page to correctly reflect paginated range.
