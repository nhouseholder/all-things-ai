-- Add community reviews for GPT-5.4 High Thinking and XHigh Thinking
-- These are newer thinking tiers with growing community discussion

INSERT OR IGNORE INTO community_reviews (model_id, source, sentiment_score, coding_satisfaction, common_complaints, common_praises, review_count, sample_quotes) VALUES
-- gpt-5.4-high (sentiment=0.82, satisfaction=87)
(38, 'reddit-chatgpt', 0.82, 87, '["expensive at high thinking","slow for simple tasks"]', '["excellent reasoning","strong multi-step coding","reliable"]', 850, NULL),
(38, 'reddit-claudeai', 0.82, 87, '["expensive at high thinking","slow for simple tasks"]', '["excellent reasoning","strong multi-step coding","reliable"]', 120, NULL),
(38, 'hackernews', 0.82, 87, '["expensive at high thinking","slow for simple tasks"]', '["excellent reasoning","strong multi-step coding","reliable"]', 380, NULL),
(38, 'twitter', 0.82, 87, '["expensive at high thinking","slow for simple tasks"]', '["excellent reasoning","strong multi-step coding","reliable"]', 650, NULL),

-- gpt-5.4-xhigh (sentiment=0.83, satisfaction=88)
(39, 'reddit-chatgpt', 0.83, 88, '["very expensive","overkill for most tasks","slow"]', '["best GPT reasoning","handles hardest problems","near-perfect on complex code"]', 420, NULL),
(39, 'reddit-claudeai', 0.83, 88, '["very expensive","overkill for most tasks","slow"]', '["best GPT reasoning","handles hardest problems","near-perfect on complex code"]', 80, NULL),
(39, 'hackernews', 0.83, 88, '["very expensive","overkill for most tasks","slow"]', '["best GPT reasoning","handles hardest problems","near-perfect on complex code"]', 290, NULL),
(39, 'twitter', 0.83, 88, '["very expensive","overkill for most tasks","slow"]', '["best GPT reasoning","handles hardest problems","near-perfect on complex code"]', 410, NULL);
