import { useState } from 'react';
import {
  Wand2, Loader2, ArrowLeft, ExternalLink, Github, Star,
  CheckCircle2, Sparkles, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';

const LANGUAGES = ['JavaScript', 'TypeScript', 'Python', 'Go', 'Rust', 'Java', 'C++', 'Ruby', 'PHP', 'Swift'];
const FRAMEWORKS = ['React', 'Next.js', 'Express', 'Django', 'Flask', 'Vue', 'Svelte', 'Tailwind', 'Supabase', 'Postgres', 'Firebase', 'Prisma'];
const USE_CASES = ['Debugging', 'Testing', 'Deployment', 'Code Review', 'Refactoring', 'Scaffolding', 'Research', 'Documentation', 'Automation', 'Data Analysis', 'UI Design', 'Database'];
const PLATFORMS = [
  { value: 'claude-code', label: 'Claude Code' },
  { value: 'cursor', label: 'Cursor' },
  { value: 'windsurf', label: 'Windsurf' },
  { value: 'vscode', label: 'VS Code' },
  { value: 'terminal', label: 'Terminal / CLI' },
  { value: '', label: 'Any Platform' },
];

function ChipSelect({ items, selected, onToggle, color = 'blue' }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(item => {
        const isSelected = selected.includes(item.toLowerCase());
        return (
          <button
            key={item}
            type="button"
            onClick={() => onToggle(item.toLowerCase())}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
              isSelected
                ? `bg-${color}-500/20 border-${color}-500/30 text-${color}-400`
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600'
            }`}
          >
            {isSelected && <span className="mr-1">&#10003;</span>}
            {item}
          </button>
        );
      })}
    </div>
  );
}

function ResultCard({ rec, rank }) {
  const [expanded, setExpanded] = useState(false);
  const tool = rec.tool;

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 stagger-item card-hover">
      <div className="flex items-start gap-3">
        {/* Rank badge */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold ${
          rank <= 3 ? 'bg-yellow-500/20 text-yellow-400' : rank <= 7 ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-800 text-gray-500'
        }`}>
          {rank}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-white">{tool.name}</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
              {tool.category}
            </span>
            {tool.platform && tool.platform !== 'universal' && (
              <span className="text-[10px] text-gray-500">{tool.platform}</span>
            )}
          </div>

          <p className="text-xs text-gray-400 leading-relaxed mb-2">
            {tool.short_description || tool.description?.slice(0, 120)}
          </p>

          {/* Match reasons */}
          {rec.match_reasons?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {rec.match_reasons.map((reason, i) => (
                <span key={i} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  {reason}
                </span>
              ))}
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3">
            {tool.stars && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Star className="w-3 h-3" /> {tool.stars >= 1000 ? `${(tool.stars / 1000).toFixed(1)}k` : tool.stars}
              </span>
            )}
            <span className="text-[10px] text-gray-500">Score: {rec.score}</span>
            <span className={`text-[10px] ${tool.pricing === 'free' || tool.pricing === 'open-source' ? 'text-green-400' : 'text-blue-400'}`}>
              {tool.pricing}
            </span>
          </div>

          {/* Expand */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-2 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Less' : 'Setup & details'}
          </button>

          {expanded && (
            <div className="mt-3 pt-3 border-t border-gray-800 space-y-2">
              {tool.setup_instructions && (
                <div>
                  <span className="text-[10px] font-semibold text-gray-500 uppercase">Setup: </span>
                  <span className="text-xs text-gray-400">{tool.setup_instructions}</span>
                </div>
              )}
              {tool.requires?.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase">Requires: </span>
                  {tool.requires.map(r => (
                    <span key={r} className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">{r}</span>
                  ))}
                </div>
              )}
              <div className="flex gap-3">
                {tool.url && (
                  <a href={tool.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                    <ExternalLink className="w-3 h-3" /> Visit
                  </a>
                )}
                {tool.github_url && (
                  <a href={tool.github_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-300">
                    <Github className="w-3 h-3" /> GitHub
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RecommendPage() {
  const [description, setDescription] = useState('');
  const [languages, setLanguages] = useState([]);
  const [frameworks, setFrameworks] = useState([]);
  const [useCases, setUseCases] = useState([]);
  const [platform, setPlatform] = useState('claude-code');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  function toggleItem(list, setList, item) {
    setList(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.getToolRecommendations({
        description,
        languages,
        frameworks,
        platform,
        use_cases: useCases,
      });
      setResults(res);
    } catch (err) {
      console.error('Recommendation failed:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/coding-tools" className="p-2 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-blue-400" />
            Find My Tools
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Describe your project and get personalized tool recommendations
          </p>
        </div>
      </div>

      <div className="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Describe your project
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="I'm building a Next.js SaaS app with Supabase auth and need help with debugging, deployment, and automated testing..."
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          {/* Languages */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Languages you use
            </label>
            <ChipSelect
              items={LANGUAGES}
              selected={languages}
              onToggle={item => toggleItem(languages, setLanguages, item)}
            />
          </div>

          {/* Frameworks */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Frameworks & tools
            </label>
            <ChipSelect
              items={FRAMEWORKS}
              selected={frameworks}
              onToggle={item => toggleItem(frameworks, setFrameworks, item)}
              color="cyan"
            />
          </div>

          {/* Use cases */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              What do you need help with?
            </label>
            <ChipSelect
              items={USE_CASES}
              selected={useCases}
              onToggle={item => toggleItem(useCases, setUseCases, item)}
              color="green"
            />
          </div>

          {/* Platform */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Your coding environment
            </label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPlatform(p.value)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                    platform === p.value
                      ? 'bg-purple-500/20 border-purple-500/30 text-purple-400'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || (!description && languages.length === 0 && useCases.length === 0)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {loading ? 'Finding tools...' : 'Get Recommendations'}
          </button>
        </form>

        {/* Results */}
        {results && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              Recommended Tools ({results.recommendations?.length || 0} matches)
            </h2>

            {results.recommendations?.length === 0 ? (
              <div className="text-center py-8 rounded-xl border border-gray-800 border-dashed">
                <p className="text-sm text-gray-500">No matching tools found. Try broadening your criteria.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.recommendations.map((rec, i) => (
                  <ResultCard key={rec.tool.slug} rec={rec} rank={i + 1} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
