import { useState, useEffect } from 'react';
import {
  Loader2,
  Save,
  User,
  DollarSign,
  Rss,
  Mail,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../lib/api.js';

const LANGUAGES = ['Python', 'JavaScript', 'TypeScript', 'Go', 'Rust'];

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

function SectionHeader({ icon: Icon, title }) {
  return (
    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
      <Icon className="w-4 h-4" />
      {title}
    </h2>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-500' : 'bg-gray-700'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-4.5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  );
}

export default function SettingsPage() {
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadPrefs() {
      try {
        const res = await api.getPreferences();
        setPrefs(res.preferences ?? res.data ?? res ?? {});
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadPrefs();
  }, []);

  function updateField(key, value) {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    setSaveStatus(null);
  }

  function toggleLanguage(lang) {
    setPrefs((prev) => {
      const current = prev.languages ?? [];
      const next = current.includes(lang) ? current.filter((l) => l !== lang) : [...current, lang];
      return { ...prev, languages: next };
    });
    setSaveStatus(null);
  }

  function toggleSource(sourceId) {
    setPrefs((prev) => {
      const sources = prev.sources ?? {};
      return { ...prev, sources: { ...sources, [sourceId]: !sources[sourceId] } };
    });
    setSaveStatus(null);
  }

  async function handleSave() {
    setSaving(true);
    setSaveStatus(null);
    try {
      await api.updatePreferences(prefs);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400 text-sm">Failed to load preferences: {error}</p>
      </div>
    );
  }

  const languages = prefs?.languages ?? [];
  const budget = prefs?.monthly_budget ?? 100;
  const currentSpend = prefs?.current_spend ?? 0;
  const sources = prefs?.sources ?? {};
  const digestFrequency = prefs?.digest_frequency ?? 'weekly';
  const digestEmail = prefs?.digest_email ?? '';
  const projectTypes = prefs?.project_types ?? '';

  // Default source keys if none exist
  const sourceKeys = Object.keys(sources).length > 0
    ? Object.keys(sources)
    : ['rss_openai', 'rss_anthropic', 'rss_google_ai', 'reddit_machinelearning', 'reddit_localllama', 'hackernews'];

  const sourceLabels = {
    rss_openai: 'OpenAI Blog (RSS)',
    rss_anthropic: 'Anthropic Blog (RSS)',
    rss_google_ai: 'Google AI Blog (RSS)',
    reddit_machinelearning: 'r/MachineLearning',
    reddit_localllama: 'r/LocalLLaMA',
    hackernews: 'Hacker News',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      <div className="max-w-2xl space-y-8">
        {/* Profile */}
        <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <SectionHeader icon={User} title="Profile" />

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-2">Primary Languages</label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((lang) => {
                  const selected = languages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                        selected
                          ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600'
                      }`}
                    >
                      {selected && <span className="mr-1">&#10003;</span>}
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-2" htmlFor="project-types">
                Project Types
              </label>
              <input
                id="project-types"
                type="text"
                value={projectTypes}
                onChange={(e) => updateField('project_types', e.target.value)}
                placeholder="e.g. web apps, data science, mobile"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Budget */}
        <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <SectionHeader icon={DollarSign} title="Budget" />

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-500">Monthly Budget</label>
                <span className="text-sm font-bold text-white">${budget}</span>
              </div>
              <input
                type="range"
                min={0}
                max={500}
                step={5}
                value={budget}
                onChange={(e) => updateField('monthly_budget', Number(e.target.value))}
                className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                <span>$0</span>
                <span>$250</span>
                <span>$500</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50">
              <div className="flex-1">
                <p className="text-xs text-gray-500">Current Spend</p>
                <p className="text-lg font-bold text-white">${Number(currentSpend).toFixed(2)}</p>
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Remaining</p>
                <p className={`text-lg font-bold ${budget - currentSpend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${(budget - currentSpend).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Sources */}
        <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <SectionHeader icon={Rss} title="News Sources" />

          <div className="space-y-3">
            {sourceKeys.map((key) => (
              <Toggle
                key={key}
                checked={sources[key] ?? false}
                onChange={() => toggleSource(key)}
                label={sourceLabels[key] ?? key}
              />
            ))}
          </div>
        </section>

        {/* Email Digest */}
        <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <SectionHeader icon={Mail} title="Email Digest" />

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-2" htmlFor="digest-frequency">
                Frequency
              </label>
              <select
                id="digest-frequency"
                value={digestFrequency}
                onChange={(e) => updateField('digest_frequency', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
              >
                {FREQUENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-2" htmlFor="digest-email">
                Email Address
              </label>
              <input
                id="digest-email"
                type="email"
                value={digestEmail}
                onChange={(e) => updateField('digest_email', e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>

          {saveStatus === 'success' && (
            <span className="flex items-center gap-1.5 text-sm text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              Saved successfully
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1.5 text-sm text-red-400">
              <AlertCircle className="w-4 h-4" />
              Failed to save. Try again.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
