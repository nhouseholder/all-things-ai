import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';

export default function Layout() {
  return (
    <div className="flex h-screen bg-void text-silver">
      <a href="#main-content" className="skip-to-content">Skip to content</a>
      <Sidebar />
      <main id="main-content" className="flex-1 overflow-y-auto p-4 pt-16 lg:p-8 lg:pt-8" tabIndex={-1}>
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
