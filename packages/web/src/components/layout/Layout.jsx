import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      <a href="#main-content" className="skip-to-content">Skip to content</a>
      <Sidebar />
      <main id="main-content" className="flex-1 overflow-y-auto p-4 pt-16 lg:p-6 lg:pt-6" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
