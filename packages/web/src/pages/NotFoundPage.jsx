import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md w-full text-center">
        <p className="text-7xl font-extrabold text-gray-800 mb-4">404</p>
        <h1 className="text-xl font-bold text-white mb-2">Page not found</h1>
        <p className="text-sm text-gray-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-950"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <Link
            to="/advisor"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-950"
          >
            <Search className="w-4 h-4" />
            Find a Model
          </Link>
        </div>
      </div>
    </div>
  );
}
