import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ToolsPage from './pages/ToolsPage.jsx';
import CostPage from './pages/CostPage.jsx';
import AdvisorPage from './pages/AdvisorPage.jsx';
import BenchmarksPage from './pages/BenchmarksPage.jsx';
import ComparePage from './pages/ComparePage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
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
  );
}
