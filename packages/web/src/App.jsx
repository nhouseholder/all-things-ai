import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';

// Eagerly load HomePage (landing page — always hit first)
import HomePage from './pages/HomePage.jsx';

// Lazy load all other pages
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const ToolsPage = lazy(() => import('./pages/ToolsPage.jsx'));
const CostPage = lazy(() => import('./pages/CostPage.jsx'));
const AdvisorPage = lazy(() => import('./pages/AdvisorPage.jsx'));
const BenchmarksPage = lazy(() => import('./pages/BenchmarksPage.jsx'));
const ComparePage = lazy(() => import('./pages/ComparePage.jsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-pulse text-gray-400">Loading...</div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="tools" element={<ToolsPage />} />
          <Route path="cost" element={<CostPage />} />
          <Route path="advisor" element={<AdvisorPage />} />
          <Route path="compare" element={<ComparePage />} />
          <Route path="benchmarks" element={<BenchmarksPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
