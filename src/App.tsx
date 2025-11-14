import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoadingSpinner from './components/LoadingSpinner';
import './App.css';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const ProblemDetailPage = lazy(() => import('./pages/ProblemDetailPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/visualizations/:slug" element={<ProblemDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
