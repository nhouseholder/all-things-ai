// Hardcoded user profile — will be configurable via Settings page later
export const USER_PROFILE = {
  name: 'Nick',
  primary_languages: ['python', 'javascript'],
  project_types: ['prediction-algorithm', 'cloudflare-workers', 'sports-betting', 'saas'],
  projects: [
    { name: 'UFC Prediction Algorithm', stack: ['python', 'ml', 'web-scraping'] },
    { name: 'MyStrainAI', stack: ['cloudflare-workers', 'javascript', 'd1'] },
    { name: 'Sports Betting SaaS', stack: ['python', 'javascript', 'cloudflare'] },
  ],
  current_tools: ['claude-code', 'windsurf'],
  monthly_budget: 150, // max willingness to spend
  current_spend: 125,  // $100 Claude Code + $25 Windsurf
  key_needs: ['nuance-understanding', 'debugging', 'deep-thinking', 'cost-efficiency'],
  preferred_categories: ['coding', 'debugging', 'reasoning', 'nuance'],
};
