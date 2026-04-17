import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, LayoutDashboard, Wrench, DollarSign, Settings, Zap, Brain, Scale, Menu, X, Puzzle, Bot, Newspaper, CreditCard, Building2 } from 'lucide-react';
import { useUnreadAlertCount } from '../../lib/hooks.js';

const links = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/advisor', icon: Brain, label: 'Models' },
  { to: '/vendors', icon: Building2, label: 'Vendors' },
  { to: '/advisor/chat', icon: Bot, label: 'AI Advisor' },
  { to: '/compare', icon: Scale, label: 'Compare' },
  { to: '/tools', icon: Wrench, label: 'Tools' },
  { to: '/coding-tools', icon: Puzzle, label: 'Plugins' },
  { to: '/plans', icon: CreditCard, label: 'Plans' },
  { to: '/cost', icon: DollarSign, label: 'Optimize' },
  { to: '/news', icon: Newspaper, label: 'News', hasBadge: true },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { data: alertData } = useUnreadAlertCount();
  const unreadCount = alertData?.count || 0;

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-400" />
            <h1 className="text-lg font-bold text-white">All Things AI</h1>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">Your AI Intelligence Hub</p>
  <p className="text-[10px] text-gray-500 mt-0.5">v0.16.0 &middot; Apr 16, 2026</p>
      </div>
      <nav className="flex-1 p-3 space-y-1" aria-label="Main navigation">
        {links.map(({ to, icon: Icon, label, hasBadge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${
                isActive
                  ? 'bg-blue-500/10 text-blue-400'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`
            }
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
            {label}
            {hasBadge && unreadCount > 0 && (
              <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white min-w-[18px] text-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <div className="text-xs text-gray-400">
          <p>Monthly spend: <span className="text-green-400 font-medium">$125</span></p>
          <p className="mt-1">Tracking 10 tools, 38+ models</p>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg"
        aria-label="Open menu"
        aria-expanded={mobileOpen}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-gray-900 border-r border-gray-800 flex-col flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-gray-900 border-r border-gray-800 flex flex-col transform transition-transform duration-200 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={mobileOpen ? {} : { visibility: 'hidden' }}
        aria-label="Mobile navigation"
      >
        {sidebarContent}
      </aside>
    </>
  );
}
