import { useState, useRef, useEffect } from 'react';
import { setPageTitle } from '../lib/format.js';
import { Link } from 'react-router-dom';
import {
  Send, Loader2, Bot, User, RotateCcw, Sparkles,
  ArrowLeft, Cpu, DollarSign, Zap, ExternalLink,
} from 'lucide-react';
import { api } from '../lib/api.js';

const QUICK_REPLIES = [
  'I build web apps with React and Node.js',
  'I need help debugging complex codebases',
  'I want the cheapest model that still works well',
  'I do a mix of coding, writing, and analysis',
];

// Contextual follow-up suggestions based on conversation stage
const FOLLOW_UP_SETS = [
  // After first assistant message (usually asks "what matters most?")
  [
    'Code quality is #1 priority for me',
    'I want the best bang for my buck',
    'Speed — I need fast responses',
    'I need it all: quality, cost, and speed',
  ],
  // After second assistant message (price range — required ask)
  [
    'Free tier only',
    'Under $20/month',
    '$20-50/month',
    '$50-100/month',
    'Budget is flexible',
  ],
  // After third+ (specific task / team size)
  [
    'Mostly building new features from scratch',
    'Debugging and fixing bugs in large codebases',
    'Solo developer, side projects',
    'Small team, 2-5 devs',
  ],
];

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
        isUser ? 'bg-blue-500/20' : 'bg-purple-500/20'
      }`}>
        {isUser
          ? <User className="w-3.5 h-3.5 text-blue-400" />
          : <Bot className="w-3.5 h-3.5 text-purple-400" />
        }
      </div>
      <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
        isUser
          ? 'bg-blue-500/10 text-blue-100 border border-blue-500/20'
          : 'bg-gray-800/60 text-gray-200 border border-gray-700/50'
      }`}>
        {message.content.split('\n').map((line, i) => (
          <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function RecommendationCard({ rec, rank }) {
  const tierColors = {
    0: { bg: 'border-yellow-500/30 bg-yellow-500/5', badge: 'bg-yellow-500/20 text-yellow-400', label: 'Top Pick' },
    1: { bg: 'border-blue-500/30 bg-blue-500/5', badge: 'bg-blue-500/20 text-blue-400', label: 'Great Value' },
    2: { bg: 'border-green-500/30 bg-green-500/5', badge: 'bg-green-500/20 text-green-400', label: 'Budget Pick' },
  };
  const tier = tierColors[rank] || tierColors[2];

  return (
    <div className={`rounded-xl border ${tier.bg} p-4 space-y-3`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tier.badge}`}>{tier.label}</span>
            <h4 className="text-sm font-semibold text-white">{rec.name}</h4>
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5">{rec.vendor}</p>
        </div>
        {rec.composite_score != null && (
          <div className="text-right">
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-yellow-400" />
              <span className="text-sm font-bold text-white">{Number(rec.composite_score).toFixed(1)}</span>
            </div>
            <span className="text-[10px] text-gray-500">quality</span>
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2">
        {rec.success_rate != null && (
          <div className="text-center">
            <p className="text-sm font-semibold text-green-400">{(rec.success_rate * 100).toFixed(0)}%</p>
            <p className="text-[10px] text-gray-500">Success Rate</p>
          </div>
        )}
        {rec.cost_per_task != null && (
          <div className="text-center">
            <p className="text-sm font-semibold text-blue-400">${rec.cost_per_task.toFixed(3)}</p>
            <p className="text-[10px] text-gray-500">Per Task</p>
          </div>
        )}
        {rec.input_price != null && (
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-300">${rec.input_price}</p>
            <p className="text-[10px] text-gray-500">Input/MTok</p>
          </div>
        )}
      </div>

      {/* Where to use it */}
      {rec.available_on?.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Where to use it</p>
          <div className="space-y-1">
            {rec.available_on.map((a, i) => {
              const priceLabel = a.price != null
                ? `$${a.price}/mo`
                : (a.reference_price_monthly != null ? `~$${a.reference_price_monthly}/mo` : '—');
              const isByok = a.access_level === 'byok';
              return (
                <div key={i} className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-gray-800/40 border border-gray-800">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3 h-3 text-gray-500" />
                    <span className="text-white">{a.tool}</span>
                    {a.plan && <span className="text-gray-500">{a.plan}</span>}
                    {isByok && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">BYOK</span>}
                  </div>
                  <span className={`font-mono ${i === 0 ? 'text-green-400' : 'text-gray-400'}`}>
                    {priceLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center bg-purple-500/20">
        <Bot className="w-3.5 h-3.5 text-purple-400" />
      </div>
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

export default function AdvisorChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input on mount + set page title
  useEffect(() => {
    setPageTitle('AI Advisor');
    inputRef.current?.focus();
  }, []);

  async function sendMessage(content) {
    if (!content.trim() || loading) return;

    const userMsg = { role: 'user', content: content.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const data = await api.chatWithAdvisor(newMessages);
      const assistantMsg = { role: 'assistant', content: data.reply };
      setMessages(prev => [...prev, assistantMsg]);
      if (data.recommendations) {
        setRecommendations(data.recommendations);
      }
    } catch (e) {
      setError('Failed to get response. Please try again.');
      // Remove the user message on error so they can retry
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(input);
  }

  function resetChat() {
    setMessages([]);
    setRecommendations(null);
    setError(null);
    setInput('');
    inputRef.current?.focus();
  }

  const showQuickReplies = messages.length === 0 && !loading;

  // Determine follow-up suggestions based on conversation stage
  const assistantCount = messages.filter(m => m.role === 'assistant').length;
  const lastMsg = messages[messages.length - 1];
  const showFollowUps = !loading && !recommendations && lastMsg?.role === 'assistant' && assistantCount <= 3;
  const followUpSet = FOLLOW_UP_SETS[Math.min(assistantCount - 1, FOLLOW_UP_SETS.length - 1)] || [];

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/advisor" className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              AI Model Advisor
            </h1>
            <p className="text-[10px] text-gray-500">Powered by Workers AI — tell me what you need, I'll find your perfect model</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={resetChat}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Start over
          </button>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
        {/* Welcome state */}
        {messages.length === 0 && !loading && (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <Bot className="w-7 h-7 text-purple-400" />
            </div>
            <h2 className="text-base font-semibold text-white mb-1">Find Your Perfect AI Model</h2>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              Tell me about your projects and how you use AI. I'll recommend the best model
              for your needs at the lowest cost — and tell you exactly where to use it.
            </p>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {/* Typing indicator */}
        {loading && <TypingIndicator />}

        {/* Error */}
        {error && (
          <div className="text-center">
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 inline-block">{error}</p>
          </div>
        )}

        {/* Recommendation cards */}
        {recommendations && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <h3 className="text-sm font-semibold text-white">Your Personalized Recommendations</h3>
            </div>
            {recommendations.map((rec, i) => (
              <RecommendationCard key={rec.slug || i} rec={rec} rank={i} />
            ))}
            <div className="text-center pt-2">
              <Link
                to="/advisor"
                className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                <ExternalLink className="w-3 h-3" /> View full model rankings
              </Link>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick replies — initial */}
      {showQuickReplies && (
        <div className="shrink-0 pt-3 pb-1">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Quick start</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_REPLIES.map((reply, i) => (
              <button
                key={i}
                onClick={() => sendMessage(reply)}
                className="text-xs px-3 py-2 rounded-lg bg-gray-800/60 border border-gray-700/50 text-gray-300 hover:text-white hover:border-gray-600 transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Follow-up suggestions — after each assistant reply */}
      {showFollowUps && followUpSet.length > 0 && (
        <div className="shrink-0 pt-2 pb-1">
          <div className="flex flex-wrap gap-2">
            {followUpSet.map((reply, i) => (
              <button
                key={i}
                onClick={() => sendMessage(reply)}
                className="text-xs px-3 py-2 rounded-lg bg-gray-800/60 border border-gray-700/50 text-gray-300 hover:text-white hover:border-purple-500/40 hover:bg-purple-500/5 transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="shrink-0 flex gap-2 pt-3 border-t border-gray-800 mt-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={recommendations ? 'Ask a follow-up question...' : 'Tell me about your projects...'}
          disabled={loading}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl transition-colors flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
