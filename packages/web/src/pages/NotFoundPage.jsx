import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] bg-void">
      <div className="max-w-md w-full text-center">
        <p className="text-7xl font-mono font-bold text-neon mb-4 glow-neon">404</p>
        <h1 className="text-xl font-display font-bold text-silver mb-2">Page not found</h1>
        <p className="text-sm text-muted mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/"
            className="btn-neon inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-neon focus:ring-offset-2 focus:ring-offset-void"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <Link
            to="/advisor"
            className="btn-ghost inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-neon focus:ring-offset-2 focus:ring-offset-void"
          >
            <Search className="w-4 h-4" />
            Find a Model
          </Link>
        </div>
      </div>
    </div>
  );
}
