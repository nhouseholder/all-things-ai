import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, LayoutDashboard, Wrench, DollarSign, BarChart3, Settings, Brain, Scale, Menu, X, Terminal } from 'lucide-react';

const links = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/advisor', icon: Brain, label: 'Advisor' },
  { to: '/compare', icon: Scale, label: 'Compare' },
  { to: '/benchmarks', icon: BarChart3, label: 'Benchmarks' },
  { to: '/tools', icon: Wrench, label: 'Tools' },
  { to: '/cost', icon: DollarSign, label: 'Cost' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

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
      <div className="p-5 border-b border-edge">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-neon/10 border border-neon/30 flex items-center justify-center">
              <Terminal className="w-4 h-4 text-neon" />
            </div>
            <div>
              <h1 className="text-sm font-mono font-bold text-silver tracking-tight">All Things AI</h1>
              <p className="text-[11px] font-mono text-neon/60">v0.7.0</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-md text-muted hover:text-silver hover:bg-elevated transition-colors focus:outline-none focus:ring-2 focus:ring-neon"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5" aria-label="Main navigation">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-neon focus:ring-inset ${
                isActive
                  ? 'bg-neon/10 text-neon border-l-2 border-neon'
                  : 'text-muted hover:text-silver hover:bg-elevated'
              }`
            }
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-edge">
        <div className="font-mono text-[11px]">
          <div className="flex items-center gap-1.5 text-dim">
            <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse" />
            <span>System online</span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-surface border border-edge text-muted hover:text-neon hover:border-neon/30 transition-all focus:outline-none focus:ring-2 focus:ring-neon shadow-lg shadow-black/50"
        aria-label="Open menu"
        aria-expanded={mobileOpen}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 bg-surface border-r border-edge flex-col flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-void/80 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-surface border-r border-edge flex flex-col transform transition-transform duration-200 ease-out ${
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
