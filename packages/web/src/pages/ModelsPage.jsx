import { useState, lazy, Suspense } from 'react';
import { Brain, BarChart3, Target, Loader2 } from 'lucide-react';

const AdvisorContent = lazy(() => import('./AdvisorPage.jsx'));
const BenchmarksContent = lazy(() => import('./BenchmarksPage.jsx'));
const SuccessRateContent = lazy(() => import('./SuccessRatePage.jsx'));

const TABS = [
  { id: 'advisor', label: 'Advisor', icon: Brain, description: 'Rankings & task analysis' },
  { id: 'benchmarks', label: 'Benchmarks', icon: BarChart3, description: 'Scores & pricing' },
  { id: 'success-rate', label: 'Success Rate', icon: Target, description: 'Real-world performance' },
];

function TabLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
    </div>
  );
}

export default function ModelsPage() {
  const [activeTab, setActiveTab] = useState('advisor');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Models</h1>
        <p className="text-sm text-gray-500">Rankings, benchmarks, and real-world success rates <span className="text-gray-600 text-xs">· Updated daily</span></p>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-800 pb-2 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
        {activeTab === 'advisor' && <AdvisorContent />}
        {activeTab === 'benchmarks' && <BenchmarksContent />}
        {activeTab === 'success-rate' && <SuccessRateContent />}
      </Suspense>
    </div>
  );
}
