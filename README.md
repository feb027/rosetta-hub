# 🎨 Rosetta Code Visualization Hub

A modern, interactive web platform that transforms classic programming problems into beautiful visualizations. Built with React, featuring a unique glassmorphism design and smooth animations.

![Rosetta Code Hub](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?style=for-the-badge&logo=tailwindcss)

## ✨ Features

- **Interactive Visualizations** - Step-by-step walkthroughs of algorithm execution
- **Real-time Search** - Debounced search with instant results
- **Advanced Filtering** - Filter by difficulty, tags, and search terms
- **URL State Management** - Shareable links with preserved filter states
- **Responsive Design** - Optimized for mobile, tablet, and desktop
- **Unique Dark Theme** - Glassmorphism effects with soft cyan accents
- **Smooth Animations** - 60fps animations powered by Motion
- **Accessibility First** - WCAG AA compliant with full keyboard navigation
- **Performance Optimized** - Code splitting, lazy loading, and memoization

## 🚀 Tech Stack

- **Framework**: [React 19](https://react.dev/) with TypeScript
- **Build Tool**: [Vite 7](https://vite.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (CSS-first approach)
- **Routing**: [React Router 7](https://reactrouter.com/)
- **Animations**: [Motion](https://motion.dev/) (by Framer)
- **Runtime**: [Bun](https://bun.sh/) (JavaScript runtime & package manager)
- **Icons**: [Lucide React](https://lucide.dev/)

## 📦 Installation

### Prerequisites

- [Bun](https://bun.sh/) 1.2.8 or higher

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd rosetta-hub
```

2. Install dependencies:
```bash
bun install
```

3. Start the development server:
```bash
bun run dev
```

The app will be available at `http://localhost:5173`

## 🛠️ Development Commands

```bash
# Start development server with HMR
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Type check
bun run tsc --noEmit

# Lint code (if configured)
bun run lint
```

## 📝 Adding New Problems

To add a new problem to the hub:

1. Create a new folder in `src/problems/` with your problem slug:
```bash
mkdir src/problems/your-problem-name
```

2. Create a `meta.ts` file with problem metadata:
```typescript
import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Your Problem Name',
  slug: 'your-problem-name',
  difficulty: 'easy', // 'easy' | 'medium' | 'hard'
  tags: ['algorithm', 'array'], // See available tags in types/problem.ts
  description: 'A clear description of the problem.',
  createdAt: '2025-11-14',
};
```

3. (Optional) Create a visualization component in `src/components/visualizations/`:
```typescript
// YourProblemVisualization.tsx
export default function YourProblemVisualization() {
  // Your interactive visualization
  return <div>...</div>;
}
```

4. (Optional) Register the visualization in `src/pages/ProblemDetailPage.tsx`:
```typescript
const visualizations: Record<string, React.ReactNode> = {
  'your-problem-name': <YourProblemVisualization />,
};
```

The problem will automatically appear in the hub!

## 🎨 Design System

### Color Palette
- **Background**: Deep slate (#0F172A) with gradient overlays
- **Text**: Soft white (#F1F5F9) and muted slate (#94A3B8)
- **Accent**: Soft cyan (#38BDF8) with darker hover (#0EA5E9)
- **Difficulty Colors**:
  - Easy: Green (#22C55E)
  - Medium: Amber (#F59E0B)
  - Hard: Red (#EF4444)

### Responsive Breakpoints
- **Mobile**: < 640px (1 column)
- **Tablet**: 640px - 1023px (2 columns)
- **Desktop**: 1024px - 1279px (3 columns)
- **Large**: 1280px+ (4 columns)

## 🏗️ Project Structure

```
rosetta-hub/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── visualizations/  # Problem visualizations
│   │   ├── ProblemCard.tsx
│   │   ├── ProblemGrid.tsx
│   │   ├── HubFilters.tsx
│   │   └── ...
│   ├── pages/              # Route-level components
│   │   ├── HomePage.tsx
│   │   └── ProblemDetailPage.tsx
│   ├── problems/           # Problem content
│   │   ├── hello-world/
│   │   ├── binary-search/
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Helper functions
│   ├── types/              # TypeScript types
│   ├── constants/          # App constants
│   └── index.css           # Global styles & theme
├── public/                 # Static assets
├── vite.config.ts         # Vite configuration
├── tailwind.config.ts     # Tailwind configuration
└── tsconfig.json          # TypeScript configuration
```

## 🎯 Performance

- **Bundle Size**: < 120KB gzipped (with code splitting)
- **CSS**: < 6KB gzipped
- **Lighthouse Score**: 95+ (Performance, Accessibility, Best Practices)
- **Core Web Vitals**:
  - LCP: < 1.5s
  - FID: < 100ms
  - CLS: < 0.1

## ♿ Accessibility

- WCAG AA compliant
- Full keyboard navigation support
- Screen reader friendly with ARIA labels
- Reduced motion support
- Minimum 44x44px touch targets
- High contrast ratios

## 📄 License

MIT License - feel free to use this project for learning and personal projects.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Add new problem visualizations
- Improve existing visualizations
- Enhance the UI/UX
- Fix bugs or improve performance
- Add documentation

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by classic computer science problems
- Designed for developers learning algorithms

---

Made with ❤️ for the developer community
