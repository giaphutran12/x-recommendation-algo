export interface Topic {
  id: string;
  name: string;
  keywords: string[];
}

export const topics: Topic[] = [
  {
    id: 'ai',
    name: 'Artificial Intelligence',
    keywords: ['AI', 'machine learning', 'LLM', 'GPT', 'neural network', 'deep learning', 'AGI', 'ChatGPT', 'Claude', 'Gemini', 'inference', 'fine-tuning', 'RAG', 'transformer'],
  },
  {
    id: 'startups',
    name: 'Startups & Entrepreneurship',
    keywords: ['startup', 'founder', 'bootstrapped', 'Series A', 'Series B', 'pitch deck', 'product-market fit', 'SaaS', 'MVP', 'indie hacker', 'revenue', 'churn', 'ARR', 'MRR'],
  },
  {
    id: 'crypto',
    name: 'Crypto & Web3',
    keywords: ['crypto', 'bitcoin', 'ethereum', 'DeFi', 'NFT', 'blockchain', 'Web3', 'altcoin', 'wallet', 'on-chain', 'smart contract', 'staking', 'yield', 'L2'],
  },
  {
    id: 'markets',
    name: 'Financial Markets',
    keywords: ['stocks', 'S&P 500', 'Fed', 'interest rates', 'inflation', 'macro', 'earnings', 'options', 'bull market', 'bear market', 'hedge fund', 'shorting', 'ETF', 'VC'],
  },
  {
    id: 'politics',
    name: 'Politics & Policy',
    keywords: ['Congress', 'Senate', 'legislation', 'White House', 'election', 'regulation', 'policy', 'bipartisan', 'filibuster', 'SCOTUS', 'executive order', 'lobbying', 'PAC'],
  },
  {
    id: 'tech',
    name: 'Technology',
    keywords: ['software', 'open source', 'developer', 'API', 'cloud', 'AWS', 'Kubernetes', 'DevOps', 'TypeScript', 'Rust', 'Python', 'framework', 'pull request', 'debugging'],
  },
  {
    id: 'culture',
    name: 'Culture & Entertainment',
    keywords: ['music', 'film', 'TV', 'streaming', 'pop culture', 'meme', 'viral', 'celebrity', 'awards', 'album', 'box office', 'Netflix', 'Spotify', 'concert'],
  },
  {
    id: 'sports',
    name: 'Sports',
    keywords: ['NBA', 'NFL', 'MLB', 'soccer', 'Premier League', 'playoffs', 'championship', 'trade', 'draft', 'MVP', 'analytics', 'coach', 'transfer window', 'bracket'],
  },
  {
    id: 'gaming',
    name: 'Gaming',
    keywords: ['video games', 'esports', 'Steam', 'PlayStation', 'Xbox', 'Nintendo', 'indie game', 'RPG', 'FPS', 'MMO', 'speedrun', 'patch', 'DLC', 'Twitch'],
  },
  {
    id: 'science',
    name: 'Science & Research',
    keywords: ['research', 'study', 'peer-reviewed', 'NASA', 'physics', 'biology', 'chemistry', 'experiment', 'data', 'hypothesis', 'journal', 'discovery', 'CERN', 'climate science'],
  },
  {
    id: 'climate',
    name: 'Climate & Environment',
    keywords: ['climate change', 'global warming', 'carbon', 'renewable energy', 'solar', 'wind energy', 'emissions', 'sustainability', 'green tech', 'fossil fuels', 'COP', 'net zero', 'ESG'],
  },
  {
    id: 'media',
    name: 'Media & Journalism',
    keywords: ['journalism', 'breaking news', 'reporter', 'press freedom', 'media bias', 'fact-check', 'editorial', 'scoop', 'investigative', 'newsletter', 'Substack', 'NYT', 'broadcast'],
  },
  {
    id: 'health',
    name: 'Health & Wellness',
    keywords: ['healthcare', 'fitness', 'mental health', 'nutrition', 'longevity', 'biohacking', 'supplements', 'workout', 'therapy', 'sleep', 'diet', 'weight loss', 'running', 'gym'],
  },
  {
    id: 'finance',
    name: 'Personal Finance',
    keywords: ['investing', '401k', 'Roth IRA', 'budgeting', 'FIRE', 'index funds', 'real estate', 'passive income', 'frugal', 'net worth', 'debt', 'credit score', 'compound interest'],
  },
  {
    id: 'open_source',
    name: 'Open Source',
    keywords: ['open source', 'GitHub', 'contributors', 'maintainer', 'OSS', 'license', 'fork', 'PR', 'issue tracker', 'community', 'Linux', 'Apache', 'MIT license', 'npm'],
  },
  {
    id: 'web3',
    name: 'Web3 & Decentralization',
    keywords: ['Web3', 'DAO', 'token', 'governance', 'decentralized', 'IPFS', 'Filecoin', 'protocol', 'permissionless', 'trustless', 'self-custody', 'seed phrase', 'multisig'],
  },
  {
    id: 'education',
    name: 'Education & Learning',
    keywords: ['university', 'college', 'online learning', 'Coursera', 'bootcamp', 'curriculum', 'research', 'PhD', 'tuition', 'student loans', 'teaching', 'literacy', 'STEM'],
  },
  {
    id: 'food',
    name: 'Food & Culinary',
    keywords: ['recipe', 'restaurant', 'cooking', 'chef', 'foodie', 'Michelin', 'vegan', 'baking', 'cuisine', 'brunch', 'coffee', 'wine', 'farm-to-table', 'meal prep'],
  },
  {
    id: 'travel',
    name: 'Travel & Adventure',
    keywords: ['travel', 'digital nomad', 'visa', 'flight deals', 'backpacking', 'remote work', 'Airbnb', 'hostel', 'itinerary', 'culture shock', 'passport', 'road trip', 'hidden gems'],
  },
  {
    id: 'vc_investing',
    name: 'Venture Capital & Investing',
    keywords: ['VC', 'venture capital', 'angel investor', 'portfolio', 'exit', 'IPO', 'due diligence', 'term sheet', 'cap table', 'dilution', 'valuation', 'fund', 'LP', 'carry'],
  },
  {
    id: 'design',
    name: 'Design & UX',
    keywords: ['UI', 'UX', 'Figma', 'product design', 'accessibility', 'design system', 'typography', 'color theory', 'wireframe', 'prototype', 'user research', 'A/B test', 'Dribbble'],
  },
  {
    id: 'philosophy',
    name: 'Philosophy & Ideas',
    keywords: ['philosophy', 'ethics', 'epistemology', 'rationalism', 'stoicism', 'consciousness', 'free will', 'Nietzsche', 'logic', 'debate', 'thought experiment', 'book recommendation'],
  },
  {
    id: 'biotech',
    name: 'Biotech & Life Sciences',
    keywords: ['biotech', 'CRISPR', 'gene editing', 'mRNA', 'drug discovery', 'clinical trial', 'FDA', 'longevity', 'genomics', 'protein folding', 'AlphaFold', 'pandemic', 'vaccine'],
  },
  {
    id: 'space',
    name: 'Space & Aerospace',
    keywords: ['SpaceX', 'NASA', 'rocket', 'Mars', 'satellite', 'ISS', 'launch', 'orbit', 'Starship', 'moon', 'asteroid', 'telescope', 'JWST', 'commercial space'],
  },
  {
    id: 'social_commentary',
    name: 'Social Commentary',
    keywords: ['society', 'inequality', 'race', 'gender', 'class', 'privilege', 'social justice', 'civil rights', 'activism', 'protest', 'systemic', 'discourse', 'woke', 'cancel culture'],
  },
];
