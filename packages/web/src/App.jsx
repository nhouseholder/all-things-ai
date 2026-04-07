import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';

// Eagerly load HomePage (landing page — always hit first)
import HomePage from './pages/HomePage.jsx';

// Lazy load all other pages
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const ToolsPage = lazy(() => import('./pages/ToolsPage.jsx'));
const CostPage = lazy(() => import('./pages/CostPage.jsx'));
const ModelsPage = lazy(() => import('./pages/ModelsPage.jsx'));
const ComparePage = lazy(() => import('./pages/ComparePage.jsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));
const CodingToolsPage = lazy(() => import('./pages/CodingToolsPage.jsx'));
const RecommendPage = lazy(() => import('./pages/RecommendPage.jsx'));
const AdvisorChatPage = lazy(() => import('./pages/AdvisorChatPage.jsx'));
const NewsPage = lazy(() => import('./pages/NewsPage.jsx'));
const PlansPage = lazy(() => import('./pages/PlansPage.jsx'));
const PlanBurnPage = lazy(() => import('./pages/PlanBurnPage.jsx'));
const PlanComparePage = lazy(() => import('./pages/PlanComparePage.jsx'));
const ModelDetailPage = lazy(() => import('./pages/ModelDetailPage.jsx'));

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
          <Route path="advisor" element={<ModelsPage />} />
          <Route path="advisor/chat" element={<AdvisorChatPage />} />
          <Route path="compare" element={<ComparePage />} />
          <Route path="benchmarks" element={<Navigate to="/advisor" replace />} />
          <Route path="success-rate" element={<Navigate to="/advisor" replace />} />
          <Route path="coding-tools" element={<CodingToolsPage />} />
          <Route path="coding-tools/recommend" element={<RecommendPage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="plans" element={<PlansPage />} />
          <Route path="plan-burn" element={<PlanBurnPage />} />
          <Route path="plan-compare" element={<PlanComparePage />} />
          <Route path="models/:slug" element={<ModelDetailPage />} />
          <Route path="alerts" element={<Navigate to="/news" replace />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
