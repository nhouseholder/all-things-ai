import { NavLink } from 'react-router-dom';
import { Home, LayoutDashboard, Wrench, DollarSign, BarChart3, Settings, Zap, Brain, Scale } from 'lucide-react';

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
  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-blue-400" />
          <h1 className="text-lg font-bold text-white">All Things AI</h1>
        </div>
        <p className="text-xs text-gray-500 mt-1">Your AI Intelligence Hub</p>
        <p className="text-[10px] text-gray-600 mt-0.5">v0.5.0 &middot; Mar 23, 2026</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-500/10 text-blue-400'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <div className="text-xs text-gray-500">
          <p>Monthly spend: <span className="text-green-400 font-medium">$125</span></p>
          <p className="mt-1">Tracking 10 tools, 38+ models</p>
        </div>
      </div>
    </aside>
  );
}
