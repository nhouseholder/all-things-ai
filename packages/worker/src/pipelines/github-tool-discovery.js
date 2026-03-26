/**
 * GitHub Tool Discovery Pipeline
 *
 * Auto-discovers new coding tools (MCP servers, Claude Code skills, agents,
 * IDE extensions) from GitHub by searching trending repos with relevant topics.
 * Runs weekly on Mondays alongside benchmark scraping.
 *
 * Discovery strategy:
 *   1. Search GitHub API for repos with topics: mcp-server, claude-code, ai-coding-assistant
 *   2. Filter by recency (updated in last 30 days) and minimum stars (10+)
 *   3. Deduplicate against existing coding_tools by github_url
 *   4. Insert as inactive (is_active = 0) for manual review via admin API
 */

const USER_AGENT = 'AllThingsAI-ToolDiscovery/1.0 (+https://all-things-ai.pages.dev)';
const FETCH_TIMEOUT = 15000;

// GitHub topics to search for new coding tools
const DISCOVERY_TOPICS = [
  'mcp-server',
  'model-context-protocol',
  'claude-code',
  'ai-coding-assistant',
  'ai-code-agent',
  'llm-tool',
  'coding-agent',
  'vscode-ai',
];

// Category mapping from GitHub topics
const TOPIC_CATEGORY_MAP = {
  'mcp-server': 'mcp-server',
  'model-context-protocol': 'mcp-server',
  'claude-code': 'skill',
  'ai-coding-assistant': 'cli-tool',
  'ai-code-agent': 'agent',
  'llm-tool': 'cli-tool',
  'coding-agent': 'agent',
  'vscode-ai': 'ide-extension',
};

export async function discoverGitHubTools(env) {
  // 1. Get existing github_urls to deduplicate
  const { results: existing } = await env.DB.prepare(
    'SELECT github_url FROM coding_tools WHERE github_url IS NOT NULL'
  ).all();
  const knownUrls = new Set(existing.map(e => e.github_url.toLowerCase()));

  let totalDiscovered = 0;
  let totalScanned = 0;

  // 2. Search each topic
  for (const topic of DISCOVERY_TOPICS) {
    try {
      const result = await searchTopic(env, topic, knownUrls);
      totalDiscovered += result.discovered;
      totalScanned += result.scanned;
    } catch (e) {
      console.error(`[GITHUB-DISCOVERY] Topic "${topic}" failed:`, e.message);
    }
  }

  console.log(`[GITHUB-DISCOVERY] Scanned ${totalScanned} repos across ${DISCOVERY_TOPICS.length} topics, discovered ${totalDiscovered} new tools`);
  return { discovered: totalDiscovered, scanned: totalScanned };
}

async function searchTopic(env, topic, knownUrls) {
  // GitHub search API — repos with this topic, updated recently, 10+ stars
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const query = encodeURIComponent(`topic:${topic} pushed:>${thirtyDaysAgo} stars:>10`);
  const url = `https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=30`;

  const resp = await fetchWithTimeout(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!resp.ok) {
    // GitHub rate limit (403) is common without auth — skip gracefully
    if (resp.status === 403) {
      console.log(`[GITHUB-DISCOVERY] Rate limited on topic "${topic}", skipping`);
      return { discovered: 0, scanned: 0 };
    }
    throw new Error(`GitHub API returned ${resp.status}`);
  }

  const data = await resp.json();
  const repos = data.items || [];
  let discovered = 0;

  for (const repo of repos) {
    const githubUrl = repo.html_url;
    if (knownUrls.has(githubUrl.toLowerCase())) continue;

    // Determine category from topics
    const repoTopics = repo.topics || [];
    let category = 'github-repo';
    for (const t of repoTopics) {
      if (TOPIC_CATEGORY_MAP[t]) {
        category = TOPIC_CATEGORY_MAP[t];
        break;
      }
    }

    // Determine platform
    let platform = 'universal';
    const desc = (repo.description || '').toLowerCase();
    const name = repo.name.toLowerCase();
    if (desc.includes('vscode') || desc.includes('vs code') || name.includes('vscode')) platform = 'vscode';
    else if (desc.includes('claude code') || name.includes('claude-code')) platform = 'claude-code';
    else if (desc.includes('cursor') || name.includes('cursor')) platform = 'cursor';
    else if (desc.includes('neovim') || desc.includes('nvim')) platform = 'terminal';

    // Build slug from repo name
    const slug = repo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Check slug uniqueness
    const existingSlug = await env.DB.prepare(
      'SELECT id FROM coding_tools WHERE slug = ?'
    ).bind(slug).first();
    if (existingSlug) {
      knownUrls.add(githubUrl.toLowerCase());
      continue;
    }

    // Determine setup complexity from README indicators
    const complexity = repo.language === 'Python' ? 'medium' : 'easy';

    // Insert as inactive for review
    try {
      await env.DB.prepare(`
        INSERT INTO coding_tools
          (name, slug, category, description, short_description, github_url, url,
           source, platform, stars, last_updated, setup_complexity, is_featured, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'github-discovery', ?, ?, ?, ?, 0, 0)
      `).bind(
        repo.name,
        slug,
        category,
        repo.description || `${repo.name} — discovered from GitHub topic:${topic}`,
        repo.description ? repo.description.slice(0, 120) : null,
        githubUrl,
        repo.homepage || githubUrl,
        platform,
        repo.stargazers_count,
        repo.pushed_at,
        complexity,
      ).run();

      knownUrls.add(githubUrl.toLowerCase());
      discovered++;
      console.log(`[GITHUB-DISCOVERY] New tool: "${repo.name}" (${category}, ${repo.stargazers_count} stars) from topic:${topic}`);

      // Add topic-based tags
      const toolId = (await env.DB.prepare('SELECT id FROM coding_tools WHERE slug = ?').bind(slug).first())?.id;
      if (toolId) {
        for (const t of repoTopics.slice(0, 5)) {
          await env.DB.prepare(
            'INSERT OR IGNORE INTO coding_tool_tags (tool_id, tag) VALUES (?, ?)'
          ).bind(toolId, t).run();
        }
        // Add the language as a tag
        if (repo.language) {
          await env.DB.prepare(
            'INSERT OR IGNORE INTO coding_tool_tags (tool_id, tag) VALUES (?, ?)'
          ).bind(toolId, repo.language.toLowerCase()).run();
        }
      }
    } catch (e) {
      // UNIQUE constraint = already exists, skip
      if (!e.message.includes('UNIQUE')) {
        console.error(`[GITHUB-DISCOVERY] Insert failed for ${repo.name}:`, e.message);
      }
    }
  }

  return { discovered, scanned: repos.length };
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}
