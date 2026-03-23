import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ToolsPage from './pages/ToolsPage.jsx';
import CostPage from './pages/CostPage.jsx';
import AdvisorPage from './pages/AdvisorPage.jsx';
import BenchmarksPage from './pages/BenchmarksPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="tools" element={<ToolsPage />} />
        <Route path="cost" element={<CostPage />} />
        <Route path="advisor" element={<AdvisorPage />} />
        <Route path="benchmarks" element={<BenchmarksPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
