import { useState, useEffect, lazy, Suspense } from 'react';
import { CreditCard, ArrowLeftRight, Flame, Loader2 } from 'lucide-react';
import { setPageTitle } from '../lib/format.js';

const BrowseContent = lazy(() => import('./PlansBrowsePage.jsx'));
const CompareContent = lazy(() => import('./PlanComparePage.jsx'));
const BurnContent = lazy(() => import('./PlanBurnPage.jsx'));

const TABS = [
  { id: 'browse', label: 'Browse', icon: CreditCard, description: 'Compare every AI coding plan' },
  { id: 'compare', label: 'Compare', icon: ArrowLeftRight, description: 'Side-by-side plan wizard' },
  { id: 'burn', label: 'Burn', icon: Flame, description: 'Usage-to-cost forecast' },
];

function TabLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
    </div>
  );
}

export default function PlansPage() {
  useEffect(() => { setPageTitle('Plans'); }, []);

  // Allow deep-link via ?tab=compare|burn
  const initialTab = (() => {
    if (typeof window === 'undefined') return 'browse';
    const t = new URLSearchParams(window.location.search).get('tab');
    return TABS.some(x => x.id === t) ? t : 'browse';
  })();
  const [activeTab, setActiveTab] = useState(initialTab);

  function selectTab(id) {
    setActiveTab(id);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (id === 'browse') url.searchParams.delete('tab');
      else url.searchParams.set('tab', id);
      window.history.replaceState({}, '', url);
    }
  }

  const active = TABS.find(t => t.id === activeTab) || TABS[0];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-blue-400" />
          Plans
        </h1>
        <p className="text-sm text-gray-500">{active.description}</p>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-800 pb-2 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => selectTab(tab.id)}
              className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-t-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gray-900 text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900/30'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <Suspense fallback={<TabLoader />}>
        {activeTab === 'browse' && <BrowseContent />}
        {activeTab === 'compare' && <CompareContent />}
        {activeTab === 'burn' && <BurnContent />}
      </Suspense>
    </div>
  );
}
