/**
 * Programmatic tweet generator — no LLM calls.
 * Uses template-based generation with seeded randomness for reproducibility.
 * Each persona type has distinct voice/templates that match their writing_style.
 */

import type { Persona } from './personas';
import type { Topic } from './topics';

export interface GeneratedTweet {
  persona_username: string;
  content: string;
  tweet_type: 'original' | 'reply' | 'quote' | 'repost';
  topic: string;
  parent_ref?: string;
  created_at_offset_hours: number;
}

// ─── Seeded Random Number Generator ──────────────────────────────────────────

function seededHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return hash >>> 0;
}

class SeededRandom {
  private state: number;

  constructor(seed: number | string) {
    this.state = typeof seed === 'string' ? seededHash(seed) : seed >>> 0;
    // Warm up the generator
    for (let i = 0; i < 20; i++) this._advance();
  }

  private _advance(): number {
    // xorshift32
    let x = this.state;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return this.state;
  }

  next(): number {
    return this._advance() / 0x100000000;
  }

  pick<T>(arr: readonly T[]): T {
    if (arr.length === 0) throw new Error('Cannot pick from empty array');
    return arr[Math.floor(this.next() * arr.length)];
  }

  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  weighted<T>(items: readonly T[], weights: readonly number[]): T {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = this.next() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }

  bool(probability = 0.5): boolean {
    return this.next() < probability;
  }
}

// ─── Variable Banks ───────────────────────────────────────────────────────────

const V = {
  // Startup metrics
  MRR: ['$800 MRR', '$1.2K MRR', '$5K MRR', '$12K MRR', '$47K MRR', '$100K MRR', '$500K MRR', '$1.2M MRR'],
  ARR: ['$47K ARR', '$120K ARR', '$500K ARR', '$1M ARR', '$5M ARR', '$10M ARR', '$18M ARR', '$50M ARR'],
  REVENUE: ['$47', '$312', '$1,200', '$4,800', '$12,000', '$48,000'],
  GROWTH: ['40%', '60%', '3x', '2x', '10x', '4.7x', '127%', '300%'],
  CHURN_OLD: ['8%', '12%', '6%', '15%', '9%'],
  CHURN_NEW: ['2.1%', '1.4%', '3.5%', '0.8%', '4%'],
  NPS_OLD: ['24', '32', '41', '47', '18'],
  NPS_NEW: ['61', '71', '78', '52', '68', '82'],
  USERS: ['12', '47', '200', '1,200', '10K', '50K', '100K'],
  CUSTOMERS: ['3', '10', '47', '200', '1,000', '5,000'],
  TEAM_SIZE: ['2', '4', '8', '12', '25', '40', '100'],
  N: ['2', '3', '5', '7', '10', '14', '20', '30', '40', '47', '50', '100', '500'],
  DAYS: ['3', '7', '14', '30', '47', '90', '120'],
  MONTHS: ['2', '3', '6', '8', '12', '18', '24', '36'],
  ROUND: ['pre-seed', 'seed', 'Series A', 'Series B', 'Series C'],
  ROUND_SIZE: ['$500K', '$1.5M', '$4M', '$8M', '$12M', '$20M', '$50M', '$100M'],
  VALUATION: ['$4M', '$15M', '$50M', '$100M', '$250M', '$500M', '$1.2B'],
  CAC: ['$120', '$250', '$500', '$1,200', '$3,000', '$8,000'],
  LTV: ['$800', '$2,400', '$6,000', '$18,000', '$48,000'],

  // Market/trading
  TICKER: ['$NVDA', '$AAPL', '$TSLA', '$META', '$GOOGL', '$AMZN', '$MSFT', '$SPY', '$QQQ', '$COIN'],
  CRYPTO: ['$BTC', '$ETH', '$SOL', '$AVAX', '$MATIC', '$ARB', '$LINK'],
  PRICE: ['$120', '$420', '$850', '$1,200', '$2,800', '$42,000', '$3,200', '$180'],
  PRICE_TARGET: ['$100', '$450', '$950', '$1,500', '$3,000', '$50,000', '$200'],
  PCT_MOVE: ['2.3%', '5%', '8%', '12%', '15%', '22%'],
  TIMEFRAME_TRADE: ['24 hours', '48 hours', '1 week', '30 days', '90 days', 'Q1', 'Q4'],
  LEVEL: ['4420', '4500', '44,000', '3,200', '850', '180', '45,000'],
  OPTIONS_EXP: ['0DTE', 'weekly', 'monthly', 'January expiry', 'LEAPS'],
  PE: ['25x', '30x', '40x', '60x', '80x', '120x'],
  INDEX: ['S&P 500', 'Nasdaq', 'Russell 2000', 'Dow', 'FTSE 100'],
  MACRO: ['inflation', 'the Fed', 'yield curve', 'interest rates', 'GDP growth', 'CPI', 'PPI'],
  WHALE_COUNT: ['3', '7', '12', '18', '24'],

  // Tech
  LANGUAGE: ['TypeScript', 'Rust', 'Python', 'Go', 'Zig', 'Elixir', 'Swift', 'Kotlin'],
  FRAMEWORK: ['React', 'Next.js', 'SvelteKit', 'Remix', 'Astro', 'htmx', 'Nuxt', 'SolidJS'],
  TECH_TOOL: ['Cursor', 'VS Code', 'Neovim', 'tmux', 'GitHub Copilot', 'Claude', 'Warp'],
  DB: ['Postgres', 'SQLite', 'Redis', 'Supabase', 'PlanetScale', 'Turso', 'DynamoDB'],
  CLOUD: ['AWS', 'GCP', 'Vercel', 'Cloudflare', 'Railway', 'Fly.io', 'Azure'],
  AI_MODEL: ['GPT-4', 'Claude', 'Gemini', 'Llama 3', 'Mistral', 'Phi-3'],
  TECH_BUG: ['a race condition', 'a memory leak', 'an off-by-one error', 'a CORS issue', 'a timezone bug', 'a null pointer'],
  HOURS_DEBUG: ['2', '3', '4', '6', '8'],
  REPO_STARS: ['1K', '5K', '10K', '25K', '50K', '100K'],

  // Culture/entertainment
  MUSIC_ACT: ['Kendrick', 'Beyoncé', 'Taylor Swift', 'Frank Ocean', 'Radiohead', 'SZA', 'Tyler', 'Mitski', 'Charli xcx', 'Billie Eilish'],
  ALBUM: ['the new album', 'the deluxe edition', 'the sophomore album', 'the debut', 'the collab tape'],
  FILM: ['the new film', 'that A24 movie', 'the sequel', 'the director\'s cut', 'the biopic'],
  SHOW: ['the new season', 'the finale', 'the pilot', 'the reboot', 'the limited series'],
  PLATFORM_STREAM: ['Netflix', 'HBO Max', 'Hulu', 'Apple TV+', 'Prime Video', 'Disney+'],
  SPORTS_LEAGUE: ['NBA', 'NFL', 'La Liga', 'Premier League', 'MLB', 'Formula 1', 'UFC'],
  TEAM: ['the Lakers', 'the Celtics', 'Real Madrid', 'City', 'the Chiefs', 'the Cowboys'],
  ATHLETE: ['LeBron', 'Curry', 'Mahomes', 'Messi', 'Ronaldo', 'Luka', 'Giannis', 'Jokic'],
  STAT: ['offensive efficiency', 'defensive rating', 'PER', 'RAPTOR', 'expected goals', 'WAR'],
  SCORE: ['34', '29', '47', '118-106', '3-2', '4-1'],

  // Politics
  ISSUE: ['healthcare', 'housing', 'climate change', 'immigration', 'education funding', 'gun reform', 'tax policy', 'tech regulation'],
  BILL_NAME: ['the infrastructure bill', 'the climate package', 'the housing reform act', 'the tech accountability act', 'the student loan relief act'],
  POLICY: ['universal healthcare', 'carbon pricing', 'UBI', 'student loan forgiveness', 'rent control', 'minimum wage increase'],
  COMMITTEE: ['the Judiciary Committee', 'the Finance Committee', 'the Armed Services Committee', 'the Commerce Committee'],
  VOTE_COUNT: ['51-49', '228-198', '67-33', '52-47', '60-40'],
  DONATION: ['$1.2M', '$2M', '$500K', '$4M'],

  // General
  ADJ: ['interesting', 'important', 'underrated', 'overrated', 'fascinating', 'broken', 'brilliant', 'honest', 'uncomfortable'],
  CITY: ['SF', 'NYC', 'Austin', 'London', 'Berlin', 'Singapore', 'Lagos', 'Toronto', 'Amsterdam', 'Dubai'],
  YEAR: ['2', '3', '4', '5', '8', '10', '20'],
  PERCENT: ['12%', '25%', '40%', '60%', '73%', '80%', '94%'],
  BOOK: ['Zero to One', 'The Hard Thing About Hard Things', 'Thinking Fast and Slow', 'The Lean Startup', 'Atomic Habits', 'Antifragile'],
  ROLE: ['senior engineer', 'product manager', 'designer', 'growth lead', 'head of sales', 'CTO', 'VP of Engineering'],
};

// ─── Template Arrays per Persona Type ────────────────────────────────────────

const FOUNDER_ORIGINALS = [
  'Just crossed {ARR}. {MONTHS} months of {EFFORT}. Thread on what actually moved the needle 🧵',
  'We hit {MRR} this month. {MONTHS} months in. Building in public was the best decision I made.',
  'Churn dropped from {CHURN_OLD} to {CHURN_NEW} after one UX change. Sharing the details:',
  'Raised our {ROUND} ({ROUND_SIZE}). Thank you to everyone who said we were crazy. You were fuel.',
  'Just shipped v{N}.0. Code is messy. Feature works. Shipping over perfecting, every time.',
  'Day {DAYS} of building in public. Revenue: {REVENUE}. Users: {USERS}. Still here.',
  'CAC dropped {GROWTH} in 90 days without cutting marketing spend. Framework in thread:',
  'Unpopular opinion: Most "product-market fit" is just temporary market fit. Real PMF survives a recession.',
  'We almost ran out of runway {MONTHS} months ago. Here\'s what we did instead of panicking:',
  'The best interview question I\'ve found: "What are you working on outside of work?" Energy doesn\'t lie.',
  'NPS went from {NPS_OLD} to {NPS_NEW}. The change wasn\'t the product. It was onboarding.',
  'Nobody talks about the loneliness at the top. The founder bubble is real. Thread:',
  'Year {YEAR} lesson: Hire for {ADJ} judgment, not impressive credentials.',
  'We had {CUSTOMERS} customers and {REVENUE} MRR before I took any VC meetings. Intentionally.',
  'Therapy made me a better CEO. The stigma around founder mental health is killing companies.',
  'If your customers aren\'t complaining, you\'re not listening hard enough.',
  'Every week I do a 30-min "anti-roadmap" session. Delete one thing. Add nothing.',
  'The single most important early-stage metric: time from signup to first value. If it\'s > 5 min, problem.',
  'Bootstrapped to {MRR}. No VC. No hype. Just product and distribution.',
  'Just deployed to mainnet. 0 to {USERS} transactions in 48 hours. The demand is not hype.',
  'Gas fees on L2 are now cheaper than Venmo. The infrastructure argument against crypto is dead.',
  'We fired our {ROLE} and replaced them with a process. 6 months later, revenue is up {GROWTH}.',
  'Closed our {ROUND} ({ROUND_SIZE}) at {VALUATION}. Product hasn\'t changed. Mission hasn\'t.',
  'Enterprise sales cycle debrief: {MONTHS} months to close. {N} stakeholders. Worth every call.',
  'I\'ve reviewed {N}+ pitch decks. The single biggest mistake founders make is the team slide.',
  'The market doesn\'t reward good products. It rewards products that spread. Thread:',
  'Our biggest competitor just raised {ROUND_SIZE}. My reaction: ship faster.',
  'I almost quit last month. Payroll was late. Key engineer resigned. {DAYS} customers churned. I stayed.',
  'SaaS pricing mistake {MONTHS} months ago: {ADJ} pricing page. Here\'s what we fixed:',
  'We went from {CUSTOMERS} to {CUSTOMERS} paying customers in {DAYS} days. No paid ads. Thread:',
  'Hiring tip: Great {ROLE}s don\'t apply to job postings. They apply to missions.',
  'Three things I wish I knew before enterprise sales: 1. Timeline 2. Champion 3. Contracts.',
  'After {YEAR} years building B2B software: the best enterprise products are boring. They just work.',
  'The "we\'re pivoting" email we sent {MONTHS} months ago. What we pivoted to: [thread]',
  'Building in public update — shipped {N} features this week. Revenue: {MRR}. Team is {TEAM_SIZE}.',
  'The 3am incident: production was down for {HOURS_DEBUG} hours. Post-mortem is public.',
  'Cold email that signed our first {COMPANY_TYPE} client. Sharing the actual email: [thread]',
  'If you\'re building for {CITY}, here\'s what the market is actually like vs. what Twitter says:',
  'Our {TEAM_SIZE}-person team ships faster than companies with {N} engineers. Here\'s how:',
  'We grew {GROWTH} month-over-month for {MONTHS} months. Then growth stopped. Thread on why:',
  'Unpopular take: VC money makes most products worse. Funding ≠ validation.',
  'Just hit {USERS} users. {MONTHS} months after launch. No growth hack. Just word of mouth.',
  'The AI won\'t replace founders. It will replace founders who don\'t use AI. The leverage is insane.',
  'We are living through the most important technological transition in human history. Act like it.',
  'I built something this morning that would have taken {N} engineers {MONTHS} months. World changed.',
  'Reading {BOOK} for the {N}th time. The chapter on {ADJ} decisions hits different now.',
  'Our DAO voted to burn {PERCENT} of treasury tokens. First time I\'ve genuinely lost control. Best decision.',
  'Deploying our protocol to mainnet tonight. Been {MONTHS} months of testing. No shortcuts.',
  'Why we went decentralized from day 1: centralized alternatives get captured. It\'s product strategy.',
  'DeFi TVL is recovering. The devs never left. Bear markets are when the real work happens.',
];

const JOURNALIST_ORIGINALS = [
  'BREAKING: {MACRO} data out. {ADJ} implications. Thread:',
  'Sources: {ADJ} company in talks for acquisition at {VALUATION}. Exclusive details:',
  'I\'ve obtained a copy of the leaked memo. Leadership knew. [thread]',
  'The SEC just filed its most significant crypto enforcement action this year. What the complaint says:',
  'Statement from the company: "We don\'t comment on pending litigation." The litigation is {ADJ}. [thread]',
  'Spent {MONTHS} months reporting this. What I found about how tech companies handle your data:',
  'I interviewed {N} ex-employees. The culture isn\'t a side effect of the product. It IS the product.',
  'This "AI safety" lab has {ROUND_SIZE} in funding and {N} papers published in {YEAR} years.',
  'Every media company that got acquired told me the same story. I\'m finally printing it.',
  'BREAKING: Fed signals {ADJ} rate path. Markets are reacting. Full analysis thread:',
  'Per the filing: the company donated {DONATION} to the PAC three weeks before the regulation passed.',
  'Asked a senior official about the contradictions in today\'s statement. "That\'s your interpretation."',
  'The vote was {VOTE_COUNT}. Both senators who crossed party lines were retiring. Draw your own conclusions.',
  'This is the {N}th time {COMMITTEE} has requested this document. It remains unsubmitted.',
  'Just published: what actually happened behind the scenes. {N} sources with direct knowledge.',
  'Quick thread on why "the science is settled" is a bad argument even when you\'re right:',
  'I spent {HOURS_DEBUG} hours reading this study. Here\'s what the data shows and what it can\'t show:',
  'The preprint is fascinating. It hasn\'t been peer-reviewed. I will say that every time.',
  'Reminder: "associated with" ≠ "causes." We\'re still doing this wrong and it matters.',
  'My {MONTHS}-month investigation is out. The headline doesn\'t do it justice. Thread:',
  'The viral "AI can do X" paper is more limited than the headline. Here\'s what it actually shows:',
  'Worked on {AI_MODEL}-adjacent research for {YEAR} years. Honest assessment: amazing and bad simultaneously.',
  'Hot take: this was the best TV season in {YEAR} years. Here\'s my ranking: [thread]',
  'The internet has once again failed to appreciate a perfect album. Respectfully, you\'re all wrong.',
  'Every year I compile my best songs list. Every year people argue. Every year I\'m right.',
  'My newsletter is out. This week: why everyone is wrong about AI and jobs, and {N} data points.',
  'Finishing a piece on the VC market. {N} sources agreed on one thing: 2021 vintage was a disaster.',
  'Free thread for non-subscribers: the media industry\'s business model problem is about attention.',
  'Just published: the definitive account. Spoke with {N} people with direct knowledge.',
  'Wrote {N},000 words about the attention economy. Here are the {N} most important paragraphs:',
  'EXCLUSIVE: I\'ve reviewed the internal communications. Here\'s what they show:',
  'The {ADJ} paper that everyone is citing? I read it. The methodology has issues. Thread:',
  'Tracking {N}+ sources on this. The story is more complicated than it appears. Update thread:',
  'Per documents I\'ve obtained: the decision was made {MONTHS} months before the public announcement.',
  'The press conference ended. No questions taken. The press release had {N} factual inaccuracies.',
  'What {N} ex-employees at {CITY}-based tech company told me on background: [thread]',
  'Correction: my earlier tweet overstated the finding. Updated thread with accurate framing:',
  'BREAKING: New documents show the timeline doesn\'t match what executives said in {YEAR} interviews.',
  'Investigative piece I\'ve been working on since {MONTHS} ago is finally out. Read it.',
  'The hearing revealed something everyone knew but nobody would say on the record. Until today.',
  'Just left the briefing. Off the record was more interesting than on the record. As always.',
  'Filed {N} FOIA requests on this. {N} came back redacted. One came back. It was worth it.',
  'Climate data out this morning. The trend line is {ADJ}. Here\'s the context you need:',
  'The {ISSUE} bill passed {VOTE_COUNT}. What it actually does vs. what both sides are claiming:',
  'I\'ve been covering {ISSUE} for {YEAR} years. This week was different.',
  'Newsletter readers already saw this. Public version: why the {ADJ} story is being undercovered.',
];

const MEME_ORIGINALS = [
  'me: i should be productive\nalso me at {N}am: {ADJ} thoughts about whether time is real',
  'the economy is so {ADJ} that {ADJ} billionaires are doing {ADJ} things',
  'saying "you too" when the waiter says "enjoy your meal" and ascending to a higher plane',
  'my toxic trait is thinking i can fix a "quick thing" before bed',
  'bro really said "we\'re pivoting" after burning {ROUND_SIZE} 💀',
  'normalize abandoning your thread midway through because you got bored of your own take',
  'the main character of twitter today is having a time and i am living for it',
  'i don\'t have the bandwidth for this conversation right now',
  '[IMPORTANT UPDATE] We have updated our privacy policy. The main change is we now own your pets.',
  'We are thrilled to announce the acquisition of your attention for an indefinite period.',
  'Update: The feature you wanted is unavailable. The feature you didn\'t ask for is mandatory.',
  'We hear your feedback. We will not be acting on it. Thank you for being a valued customer.',
  'Q{N} earnings: profits up {GROWTH}. Mood: extremely normal about this.',
  'THE CHARTS ARE SCREAMING. BUY NOW OR REGRET FOREVER 🚀🚀🚀',
  'my financial advisor said diversify. i said you don\'t understand. he is no longer my advisor.',
  'WAGMI except for the people who NGMI and honestly good riddance 💎🙌',
  'wife asked why we\'re eating ramen. i said we\'re accumulating. she is now my ex-wife.',
  'startup idea: an app that tells you to drink water but charges ${N}.99/month for it',
  'we raised {ROUND_SIZE} to solve the problem of there being too many people who don\'t use our app',
  '"move fast and break things" has a different energy when the things are democracy',
  'the metaverse failed because humans prefer to be in places where things are happening',
  'disruption is when you use technology to do something that was working fine before but charge more',
  'asking for a friend: is it too late to become a hot girl?? asking for the friend who is me',
  'hot take that will get me unfollowed: [redacted for legal reasons]',
  'the discourse is unhinged. we said gaslight gatekeep girlboss as a joke. it\'s in HR trainings now.',
  'every startup founder: we\'re not a {ADJ} company, we\'re a technology company. [it is a {ADJ} company]',
  'pitch deck slide 3: "there are {N} billion people on earth, if we get just 1%..." [sweating]',
  'literally none of my coping mechanisms are legal in all {N} states but i\'m managing',
  'sorry i can\'t come out tonight i\'m busy catastrophizing about a thing that hasn\'t happened yet',
  'me debugging for {HOURS_DEBUG} hours only to find it was a missing semicolon: 😐',
  '"culture fit" means we only hire people exactly like the founders which is how we got here',
  'this meeting could have been an email. this email could have been a silence.',
  'the audacity, the nerve, the GALL',
  'bestie said "it\'s giving" and didn\'t finish the sentence. the sentence completed itself.',
  'if you\'re not failing {N} times before breakfast you\'re not disrupting hard enough [i made this up]',
  'quarterly update: still tired. pivoting to "resting but make it aesthetic"',
  'my productivity system has {N} apps, {N} frameworks, and zero productivity',
  'web{N} is when you add blockchain to a thing that didn\'t need blockchain but now costs more',
  'the AI made a thing. it\'s interesting. anyway the AI is now unionizing. good morning.',
  'vibes-based business strategy is just regular business strategy with a podcast',
  'every linkedin post: "i failed for {MONTHS} months and then succeeded. here\'s what i learned: persevere."',
  'someone said "let\'s hop on a quick sync" and my soul briefly left my body',
  'i would love to "unpack" the concept of not having a meeting about this',
  'the blockchain stored it on the chain so it\'s permanent which is why the jpeg is gone',
  'log off. drink water. the discourse will still be wrong when you come back.',
];

const TRADER_ORIGINALS = [
  '{TICKER} just broke above key resistance with {ADJ} volume. This is the signal. NFA.',
  'On-chain: {WHALE_COUNT} whale wallets > 1000 {CRYPTO} added in {TIMEFRAME_TRADE}. Notable.',
  'The funding rate flipped negative. Historically a bullish setup. My target: {PRICE_TARGET}.',
  'VIX just hit {N}. Loading short-vol exposure. Structured as ratio spread with defined risk.',
  '{TICKER} earnings beat by {GROWTH}. The guide is extraordinary. Raising PT to {PRICE_TARGET}.',
  'The market is paying {PE} P/E for this earnings stream. Do you believe the growth?',
  'Fed\'s dot plot signals {N} cuts this year. Market pricing {N}. One of them is wrong.',
  'Every major recession since 1950 preceded by yield curve inversion. We\'re {MONTHS} months in.',
  '{INDEX} {ADJ} setup. Watching the {LEVEL} level. Break below on volume = puts.',
  'CPI came in hot. The "soft landing" narrative depends on data not materializing. Charts:',
  'Portfolio update: down {PCT_MOVE} YTD. Sharing because I think people only post the wins.',
  'Just learned what dollar-cost averaging actually means. Changed my entire strategy. Details:',
  'Hot take: most retail investors would be better off with {N} index funds and zero individual stocks.',
  'The difference between Roth and Traditional IRA explained in 60 seconds: [thread]. Save this.',
  'Your 401k match is FREE MONEY. If you\'re not taking 100% of it you\'re leaving salary on the table.',
  'Investing timeline: start at 22 vs 32 vs 42. The difference by retirement is genuinely shocking.',
  '{CRYPTO} breaking above key resistance with {TIMEFRAME_TRADE} confirmation. NFA but watching closely.',
  'Reading the 10-K so you don\'t have to. Related-party transactions on page {N} are worth discussing.',
  'Beat-and-raise quarter from {TICKER}. The cost structure improvement is the real story.',
  '0DTE plays today: watching {LEVEL}. Any break below on volume and buying puts.',
  'The implied move for earnings is {PCT_MOVE}. Actual average last {N} quarters: lower. I sell the straddle.',
  'Theta gang report: sold {N} contracts today. Decay is beautiful when you\'re on the right side.',
  'Inflation explained without jargon: your $100 in 2020 = less purchasing power today. Here\'s why:',
  'Nobody taught you compound interest in school. Here\'s what {YEAR} years of {PCT_MOVE} returns looks like:',
  '{MACRO} is the most important variable most investors ignore. Thread on why it matters now:',
  'China PMI dropped below 50. The global growth story is more complicated than consensus. Charts:',
  'Dollar strengthens {PCT_MOVE} from here, EM currencies will crack. Not hypothetical. Set alerts.',
  'EM specialist take: the {ADJ} dollar cycle is turning. Here\'s my positioning:',
  'Gamma squeeze in {TICKER} again. Same playbook. Going to work again. Remarkable.',
  'The {ADJ} setup in {TICKER}: {N} confluences. Strike price {LEVEL}. {OPTIONS_EXP} expiry.',
  'Balance of payments data out. Most {ADJ} reading I\'ve seen in {YEAR} years. Thread:',
  'I was bearish in 2022 and right. My current positioning: thread.',
  'Crypto winter taught me: the devs who shipped during the bear are now winning.',
  'DeFi TVL crossed {ROUND_SIZE} again. The people who left won\'t be back until ATH.',
  '{CRYPTO} on-chain metrics: {ADJ} correlation to price. My 30-day target:',
  'Altcoin season indicator: when the taxis are talking about {CRYPTO}. We\'re not there yet.',
  'Sold my {TICKER} position today. Fundamentals fine. Better capital allocation elsewhere.',
  'The options market is pricing in {ADJ} volatility pre-earnings. Historical average says otherwise.',
  'I\'ve made {N} trades this week. {N} winners. The losers tell the better story. Thread:',
  'Macro morning: {MACRO} data points to {ADJ} path. Here\'s what I\'m watching at open:',
  'Personal finance thread: the {N} steps I took to go from $0 savings to {ARR} in {YEAR} years.',
  'Real estate vs. index funds debate: both miss the point. Here\'s the actual math:',
  'Interest rate sensitivity analysis on my portfolio. Sharing the spreadsheet methodology:',
  'The FIRE calculator everyone shares is wrong. Here\'s a more accurate version:',
  'This week in {CRYPTO}: {ADJ} news, {ADJ} price action. My interpretation:',
];

const POLITICIAN_ORIGINALS = [
  'Today I introduced legislation to cap {ISSUE} costs. This is not partisan. This is survival.',
  'Held a town hall in {CITY} today. {USERS} residents showed up. Here\'s what I heard:',
  '{COMMITTEE} voted to advance {BILL_NAME} {VOTE_COUNT}. This is how government should work.',
  'Voting NO on this bill today. My full statement on why is in thread. Constituents deserve explanation.',
  'I have been in this Senate for {YEAR} years. Today\'s vote was the most important of my career.',
  'This policy is an unmitigated disaster and everyone defending it knows it. Here are the numbers:',
  'The left / right wants you to believe {ADJ}. The truth is more complicated. Here it is:',
  'I\'ve been saying this for {YEAR} years. Nobody listened. Here\'s the clip. Here\'s today\'s headline.',
  'Every politician who voted for {BILL_NAME} should be asked to explain it to constituents.',
  'The mainstream media won\'t cover this. So I will. Save this tweet.',
  'They raised {ISSUE} support by {PERCENT}. Corporate profits are up {GROWTH}. Not compromise. Theater.',
  'We knocked on {N},000 doors. Registered {N},000 voters. See you at the polls.',
  'Climate is not a "future problem." Communities are being destroyed NOW. Enough.',
  'If your politics require ignoring the suffering of real people, you need new politics.',
  'The housing crisis is a policy choice. {N} specific zoning laws explain {PERCENT} of the problem.',
  'Healthcare costs in US vs comparable nations: the gap is not about quality. It\'s about billing.',
  'Carbon pricing works. Here\'s empirical evidence from {N} countries over {YEAR} years.',
  'Education funding formula thread: why school quality tied to property taxes is intentional and wrong.',
  'Every regulation solves one problem by creating {N} more. Second-order effects matter.',
  'The government has never built anything efficiently. Every exception has an asterisk.',
  'Free markets aren\'t perfect. They\'re better than the alternative for {PERCENT} of problems.',
  '{POLICY} has been tested in {N} rigorous RCTs. Here\'s what we actually know:',
  'The FDA drug approval process costs {YEAR} years and {ROUND_SIZE} per drug. Patients die waiting.',
  'Voted for {BILL_NAME} today. Thread on what it actually does vs. what both sides claim:',
  'Statement: The {N} factual inaccuracies in today\'s press release deserve a response.',
  'I\'ve been in {CITY} all week meeting with constituents. The {ISSUE} crisis is worse than reported.',
  'The bipartisan {BILL_NAME} is moving forward. I wrote the amendment. Here\'s what it does:',
  'Today we confirmed {N} judicial nominees. I voted for {N}. Explanation of each vote:',
  'Per the hearing transcript: the company knew about the {ADJ} practice for {MONTHS} months before.',
  'My constituents asked me {N} questions at last night\'s town hall. Here are my honest answers:',
  'The bill failed {VOTE_COUNT}. I voted yes. Here\'s why the fight isn\'t over:',
  '{PERCENT} of Americans support {POLICY} according to {N} separate polls. Congress lags the public.',
  'I\'m co-sponsoring legislation on {ISSUE} with {N} colleagues across the aisle.',
  'Accountability thread: {MONTHS} months ago I promised to do {N} things. Here\'s my progress:',
  'If you live in {CITY} and are affected by {ISSUE}, here\'s how to reach my office directly:',
  'The committee hearing revealed: {N} years, {ROUND_SIZE} spent, {N} people affected. Change is overdue.',
  'The Founding Fathers couldn\'t have imagined {AI_MODEL}. The law hasn\'t caught up. Here\'s my proposal:',
  'Spontaneous order is a beautiful theory that has never survived contact with monopoly power.',
  'Prices contain information. They also contain the preferences of whoever has the most of them.',
  'The empirical record on {POLICY}: more interesting than ideology from either side. Thread:',
];

const TECH_ORIGINALS = [
  'TIL you can use `{ADJ}` in {LANGUAGE} to avoid {TECH_BUG}. Game changer for my codebase.',
  'Here\'s the {LANGUAGE} pattern I wish I knew {YEAR} years ago: [thread with code]',
  'Stop using `any` in TypeScript. Here are {N} specific replacements for the {N} cases where people reach for it.',
  'Spent {HOURS_DEBUG} hours debugging {TECH_BUG}. Detailed breakdown because this will happen to you:',
  'The best code review I ever received: "what happens if the network is down and the user is on a {YEAR}-year-old phone?"',
  'My most popular repo just hit {REPO_STARS} stars. The commit that took longest: {N} lines.',
  'Maintaining open source is not a hobby. It\'s unpaid infrastructure work. What companies owe:',
  'Just merged a PR from a first-time contributor. They fixed a bug I\'d been ignoring for {YEAR} years.',
  'The new model is impressive. Let\'s be precise about what "impressive" means and doesn\'t mean:',
  'Worked on {AI_MODEL}-level systems for {YEAR} years. Honest assessment: amazing at some, bad at others.',
  'Hot take: most of what people call "alignment" problems are specification problems. Different solutions.',
  'If you\'re learning to code in 2026, here\'s my honest advice on what to learn first:',
  'CSS Grid explained for people who\'ve been avoiding it: [thread with examples]. Save this.',
  'Every developer should know these {N} {TECH_TOOL} shortcuts. Number {N} changed my workflow.',
  'You don\'t need to understand everything to build something. Start building. Learn the gaps.',
  'We had a {HOURS_DEBUG}-hour outage today. Entirely preventable. Post-mortem is public.',
  'Kubernetes is not the answer to every problem. I say this as a certified Kubernetes admin.',
  '"Works on my machine" is not a valid response. Environment config that will change your life:',
  'Runbook written. Docs updated. Monitoring improved. Next incident will be a different incident.',
  'Asked {N} senior engineers what they wish they knew early. The {N} most common answers:',
  '{AI_MODEL} just did something I didn\'t expect. Thread on what it implies for the field:',
  'The gap between AI paper and AI prod is real. I build the systems that use the models.',
  'Open source sustainability problem is structural, not motivational. The funding model is broken.',
  'If you file a bug report with "it doesn\'t work," I\'m closing it. Repro steps or nothing.',
  'Just shipped {FRAMEWORK} integration for our OSS project. Here\'s why we chose it over alternatives:',
  'Infrastructure as code is non-negotiable. I learned this when I couldn\'t rebuild prod after failure.',
  '{LANGUAGE} vs {LANGUAGE}: honest comparison after using both in prod for {YEAR} years.',
  '{CLOUD} cost optimization: how we cut our bill by {GROWTH} without degrading performance.',
  '{DB} vs {DB}: the actual tradeoffs nobody talks about in the benchmarks.',
  'Migrated from monolith to microservices. Here\'s what we learned (and regretted):',
  'Career advice I wish I had as a junior: {ADJ} skills compound. Pick them early.',
  'The {LANGUAGE} community is doing something technically {ADJ} and I want to write about it.',
  'Debugging story: the bug was introduced in {REPO_STARS}-star repo, {MONTHS} months ago.',
  'My {CLOUD} bill before and after optimization: {ROUND_SIZE} → {REVENUE}. Thread on the changes:',
  'Reviewed {N} open source {FRAMEWORK} projects this month. The patterns I keep seeing:',
  'The AI ethics problem is not separate from the technical problem. Thread on why they\'re one:',
  'New {LANGUAGE} feature dropped. Here\'s why it matters more than the hype suggests:',
  'Pair programming with {AI_MODEL} for {DAYS} days: what I learned about human-AI collaboration.',
  'The best engineering blogs I\'ve read this month: [thread]. All are worth your time.',
  '{N} things I changed after reading the {CLOUD} incident post-mortem from last week:',
  'Async/await in {LANGUAGE} explained for people who still use callbacks. 2026 edition.',
  'Design patterns that survive language changes: the {N} I actually use in production.',
  'My PR review checklist after {YEAR} years of code review. Download it. Use it.',
  'The gap between "working" and "production-ready" is where most side projects live forever.',
  'Finally deleted {N},000 lines of dead code. The tests still pass. The anxiety is gone.',
];

const CULTURE_ORIGINALS = [
  'The new {MUSIC_ACT} album is a 10/10 and I will be accepting no criticism at this time.',
  'Ranking every {MUSIC_ACT} album is a fool\'s errand and I will be doing it anyway: [thread]',
  'The backlash to the backlash to the backlash of {ALBUM} is genuinely exhausting.',
  'Music criticism has become either hagiography or cancellation. The analysis lives in the middle.',
  'Hot take: the best pop album of the decade is not by any artist you\'re thinking of. Argument:',
  'Hot take that will get me unfollowed: {FILM} is not a good film. It\'s a comfortable film.',
  'Watched everything nominated for Best Picture this year. My ranking with reasons: [thread]',
  'The cinematography in {FILM} is doing more narrative work than the script. Let me show you:',
  '"Oscar bait" is not a genre. It\'s a description of a studio strategy.',
  'The streaming era has given us extraordinary content and terrible discourse about it.',
  'The offensive efficiency number in that game was extraordinary. Box score doesn\'t show you this:',
  'Unpopular take: the MVP race is wrong this year. The data says so. Here\'s the data:',
  'That transfer window just changed the league. Why this signing is more significant than the price:',
  'Sports fandom without analysis is tribalism. Sports analysis without fandom is data science.',
  '{N} seasons of data says this coach is overrated. I know that\'s controversial. The numbers:',
  'The art world is a social network that happens to involve paintings. This explains everything.',
  'Thread on artists you should know who aren\'t in every intro art history textbook:',
  'Showed my work at a gallery last week. "I don\'t get it." Fine. "What part don\'t you get?"',
  'The contemporary art market is genuinely wild and I will tell you why in {N} parts.',
  'AI-generated art controversy: the copyright debates are interesting. The images less so.',
  'The best thing I ate this week was from a restaurant with {N}.{N} stars on Yelp. Ratings lie.',
  'Thread on why regional American barbecue is the most interesting culinary tradition in the world:',
  'The tasting menu is a performance. The neighborhood restaurant is food. Both valuable. One honest.',
  'What a chef puts on a menu tells you more about their philosophy than anything they\'ve said.',
  'The restaurant industry pays terribly, prices things wrong, and still produces culture. Fascinating.',
  '{SPORTS_LEAGUE} is going through the most {ADJ} era I\'ve covered. Thread on what\'s happening:',
  'The analytics revolution in {SPORTS_LEAGUE} is complete. Now the question is what we lost.',
  'Best album of the year is not being discussed enough. {MUSIC_ACT} made something {ADJ}.',
  '{PLATFORM_STREAM} dropped {N} episodes at once. Here\'s my ranking and watch order:',
  'The {SHOW} finale is being incorrectly analyzed. Here\'s what actually happened: [thread]',
  '{ATHLETE} is having the most {ADJ} season in {SPORT} history and nobody is talking about it right.',
  'I watched {N} episodes in one sitting. Not proud. The show earns it.',
  'The music industry has changed {GROWTH} since streaming. Here\'s who won and who lost:',
  '{MUSIC_ACT} concert debrief: the setlist was {ADJ}, the production was {ADJ}, the crowd was {ADJ}.',
  'Critical theory bingo: how to spot when a review is more about the reviewer than the work.',
  'The {YEAR} Grammy nominations reveal everything wrong with how we measure {ADJ} music.',
  'Every sports trade that seemed bad at the time but was actually {ADJ}: [thread]',
  'The film criticism landscape in 2026: everyone has an opinion, fewer people have {ADJ} frameworks.',
  'I\'ve been eating at this restaurant every week for {MONTHS} months. Here\'s what changed:',
  '{ATHLETE} vs {ATHLETE}: the GOAT debate we\'re not having correctly. Statistical case:',
  'The {ADJ} decade in {SPORTS_LEAGUE}: definitive ranking of the top {N} moments.',
  'Pop culture thread: the {N} moments from this year that will still matter in {YEAR} years.',
  'Food and class: what your {ADJ} food preferences reveal about access, not taste.',
  'The obsessive ranking of every {MUSIC_GENRE} album from {YEAR}. I did the work. You\'re welcome.',
  '{FILM} is getting a sequel. Here are {N} things I hope they don\'t undo from the original.',
];

// ─── Reply/Quote Template Variants ───────────────────────────────────────────

const REPLY_PATTERNS: Record<string, string[]> = {
  founder: [
    'Disagree. In my experience: {ARR} ARR says otherwise.',
    'This. The pattern holds at scale too.',
    'Had this exact situation {MONTHS} months ago. What worked for us:',
    'Adding to this: the {ADJ} part nobody mentions is the team dynamics.',
    'Thread worth reading. I\'d add: {CUSTOMERS} customers before you raise.',
    'Counterpoint: works at {TEAM_SIZE}-person stage, fails at {TEAM_SIZE}-person stage.',
    'The data on this is {ADJ}. Here\'s what actually happens in practice:',
    'Yes. And also: the exceptions to this rule are the entire story.',
    'This is why I do the "delete one thing" exercise every week.',
    'Strongly agree. Did exactly this at {MRR} MRR and it changed everything.',
  ],
  journalist: [
    'Worth adding: I reported on a similar case {MONTHS} months ago and found the opposite.',
    'Important context missing from this: [thread]',
    'Per documents I\'ve seen: this is more complicated than the headline.',
    'Asking the source about this. Will update when I hear back.',
    'This is accurate. Adding some nuance: {ADJ} is the key variable here.',
    'I\'d caution: the data here has {ADJ} limitations. Noted in my original piece.',
    'Correction incoming. I misread the filing. Updated version:',
    'Thank you. This is the {ADJ} context the original story was missing.',
    'Yes. And I have documents that support this from a different angle.',
    'Reporting this out now. Nothing to share yet but this is getting attention.',
  ],
  meme: [
    'this. this exactly.',
    'the accuracy is physically painful 💀',
    'finally someone said it',
    'me but make it {N}x worse',
    'blocking you for being right about something i do',
    'i\'m in this post and i don\'t like it',
    'the way this is me every single time',
    'the legal team has asked me not to confirm or deny this',
    'touch grass challenge: impossible edition',
    'some of y\'all have never {ADJ} and it shows',
  ],
  trader: [
    'Watching the same setup. My line in the sand: {LEVEL}.',
    'The thesis breaks if {MACRO} comes in hot tomorrow. Hedged accordingly.',
    'Took profits at {PCT_MOVE} on this one. Still have a small position.',
    'NFA but I see it differently. The {INDICATOR} setup is more {ADJ}.',
    'This is exactly why I don\'t hold options over weekends. Lesson cost me {REVENUE}.',
    'Disagree on the macro call. The {MACRO} data doesn\'t support this thesis.',
    'Added to my position on this pullback. {TICKER} to {PRICE_TARGET} remains my target.',
    'The options market is telling a different story than the spot market here.',
    'I was on the wrong side of this trade. Closed it. The data was right, I was wrong.',
    'Same analysis different conclusion. Here\'s where I diverge: {INDICATOR}.',
  ],
  politician: [
    'This is incorrect. Here are the actual vote counts: {VOTE_COUNT}.',
    'I was in that room. This characterization is not accurate. My account:',
    'Voted for this bill. Happy to explain my reasoning to constituents.',
    'My record on {ISSUE} is public. Here\'s the actual voting history:',
    'With respect: the {ADJ} framing misses the policy mechanism entirely.',
    'The constituent perspective on this is being ignored. I\'ve heard from {USERS} of them.',
    'I co-sponsored this legislation. Here\'s why the {ADJ} criticism misunderstands the mechanism.',
    'The data on {POLICY} outcomes in states that tried it: {ADJ}.',
    'Accountability note: I said I would do this {MONTHS} months ago. Update on where things stand:',
    'This is why I support bipartisan work even when it\'s unpopular with my base.',
  ],
  tech: [
    'The root cause is almost always {TECH_BUG}. Good post on the investigation.',
    'I\'ve hit this exact issue in {LANGUAGE}. The fix is in the repo now.',
    'Adding to this thread: the {FRAMEWORK} specific gotcha is also worth noting.',
    'This pattern saved my team {HOURS_DEBUG} hours of debugging last month.',
    'Disagree. The tradeoff is {ADJ} at scale. Here\'s what breaks:',
    'Opened a PR for this in the main repo. Review welcome.',
    'The {LANGUAGE} ecosystem has this solved. Worth looking at before rebuilding.',
    'I wrote about this {MONTHS} months ago. Still relevant. Link in replies.',
    'The benchmark methodology here has a flaw. Not invalidating the conclusion but worth noting.',
    'This is what I tell every junior on my team. Glad to see it written up properly.',
  ],
  culture: [
    'The {MUSIC_ACT} comparison doesn\'t hold up on the production side. Here\'s why:',
    'Watched the same game. The {STAT} tells a different story than the final score.',
    'The critical consensus on {FILM} is missing the point entirely. The direction is the story.',
    'This. And the {YEAR}-year context makes it even more significant.',
    'Partially agree. The {ADJ} part is right. The framing of {MUSIC_GENRE} is off.',
    'The {ATHLETE} take is correct. The GOAT conversation needs better statistical grounding.',
    'Food criticism note: the ingredient quality at that price point is {ADJ}.',
    'Just watched this. The cinematography discussion is underselling what the editor did here.',
    'The analytics angle is right but misses the cultural significance. Both things are true.',
    'This album take is defensible but the production comparison to {MUSIC_ACT} doesn\'t work.',
  ],
};

const QUOTE_PATTERNS: Record<string, string[]> = {
  founder: [
    'This is the real {ROUND} dilemma nobody talks about.',
    'The {ARR} ARR moment is real. Can confirm.',
    'Every founder eventually learns this. Usually the hard way.',
    'The timing on this observation: perfect.',
    'Sharing this with my team. This is the framework we\'ve been looking for.',
  ],
  journalist: [
    'Important context to this story that I\'ve been trying to add.',
    'The documents I have support exactly this interpretation.',
    'This is the question I\'ve been asking for {MONTHS} months.',
    'Adding to the record: my reporting from {MONTHS} months ago showed the same.',
    'This is accurate. The fuller picture is even more {ADJ}.',
  ],
  meme: [
    'this but unironically',
    'the prophecy has been fulfilled',
    'adding this to the curriculum',
    'peak internet. we peaked. it\'s over.',
    'the comments on this post are also a piece of art',
  ],
  trader: [
    'The macro context here is everything. Saving this.',
    'Confirming from my own {INDICATOR} analysis.',
    'The risk/reward on this setup is exactly as described.',
    'My {CRYPTO} thesis in one tweet. Incredible.',
    'The {TICKER} thesis: documented.',
  ],
  politician: [
    'This is the {ISSUE} position I\'ve been advocating for {YEAR} years.',
    'The constituent impact of this policy is exactly as described.',
    'Sharing because this context is missing from most coverage.',
    'The data on {POLICY} is unambiguous. This tweet captures it.',
    'My legislation addresses exactly this problem. Thread on how:',
  ],
  tech: [
    'The {LANGUAGE} solution is elegant. Sharing with the team.',
    'This caught a bug we\'ve been chasing for {DAYS} days.',
    'The {FRAMEWORK} pattern here is the one I\'ve been looking for.',
    'Open source saving companies {ROUND_SIZE} per year. As it should.',
    'This debugging methodology: saving it for the next incident.',
  ],
  culture: [
    'The {SPORTS_LEAGUE} analysis here is correct and I will die on this hill.',
    'This {MUSIC_ACT} take is the correct one. Bookmarking.',
    'The film criticism I\'ve been waiting for someone to write.',
    'Every food writer should read this. The class analysis is {ADJ}.',
    'This is the sports statistics discourse we deserve.',
  ],
};

// ─── Topic Mapping ────────────────────────────────────────────────────────────

// Map persona interests to valid topic ids
const INTEREST_TO_TOPIC: Record<string, string> = {
  'ai': 'ai',
  'startups': 'startups',
  'crypto': 'crypto',
  'markets': 'markets',
  'politics': 'politics',
  'tech': 'tech',
  'culture': 'culture',
  'sports': 'sports',
  'gaming': 'gaming',
  'science': 'science',
  'climate': 'climate',
  'media': 'media',
  'health': 'health',
  'finance': 'finance',
  'open_source': 'open_source',
  'web3': 'web3',
  'education': 'education',
  'food': 'food',
  'travel': 'travel',
  'vc_investing': 'vc_investing',
  'design': 'design',
  'philosophy': 'philosophy',
  'biotech': 'biotech',
  'space': 'space',
  'social_commentary': 'social_commentary',
  'economics': 'finance',  // map economics → finance
  'history': 'social_commentary',  // map history → social_commentary
};

function getTopicForPersona(persona: Persona, rng: SeededRandom): string {
  const interests = persona.interests.filter((i) => INTEREST_TO_TOPIC[i]);
  if (interests.length === 0) return 'culture';
  // Weight toward first interests
  const weights = interests.map((_, i) => Math.max(1, interests.length - i) * 10);
  const interest = rng.weighted(interests, weights);
  return INTEREST_TO_TOPIC[interest] ?? 'culture';
}

// ─── Template Filling ─────────────────────────────────────────────────────────

function fillTemplate(template: string, rng: SeededRandom): string {
  let result = template;
  const varRegex = /\{(\w+)\}/g;
  let match: RegExpExecArray | null;

  while ((match = varRegex.exec(template)) !== null) {
    const key = match[1] as keyof typeof V;
    if (V[key]) {
      const replacement = rng.pick(V[key]);
      result = result.replace(match[0], replacement);
    }
  }

  // Ensure under 280 chars
  if (result.length > 280) {
    result = result.slice(0, 277) + '...';
  }

  return result;
}

// ─── Tweet Generation per Persona ─────────────────────────────────────────────

const PERSONA_TYPE_TEMPLATES: Record<string, string[]> = {
  founder: FOUNDER_ORIGINALS,
  journalist: JOURNALIST_ORIGINALS,
  meme: MEME_ORIGINALS,
  trader: TRADER_ORIGINALS,
  politician: POLITICIAN_ORIGINALS,
  tech: TECH_ORIGINALS,
  culture: CULTURE_ORIGINALS,
};

function generatePersonaTweets(
  persona: Persona,
  allUsernames: string[],
  tweetCount: number,
  rng: SeededRandom,
): GeneratedTweet[] {
  const tweets: GeneratedTweet[] = [];
  const templates = PERSONA_TYPE_TEMPLATES[persona.persona_type] ?? CULTURE_ORIGINALS;
  const replyTemplates = REPLY_PATTERNS[persona.persona_type] ?? REPLY_PATTERNS['founder'];
  const quoteTemplates = QUOTE_PATTERNS[persona.persona_type] ?? QUOTE_PATTERNS['founder'];

  // Filter usernames to same persona type for more realistic interactions
  const sameTypeUsernames = allUsernames.filter((u) => u !== persona.username);

  for (let i = 0; i < tweetCount; i++) {
    const typeRoll = rng.next();
    let tweet_type: 'original' | 'reply' | 'quote' | 'repost';
    let content: string;
    let parent_ref: string | undefined;

    if (typeRoll < 0.70) {
      // Original tweet (70%)
      tweet_type = 'original';
      const tmpl = templates[i % templates.length];
      content = fillTemplate(tmpl, rng);
    } else if (typeRoll < 0.85) {
      // Reply (15%)
      tweet_type = 'reply';
      const tmpl = rng.pick(replyTemplates);
      content = fillTemplate(tmpl, rng);
      parent_ref = rng.pick(sameTypeUsernames);
    } else if (typeRoll < 0.95) {
      // Quote (10%)
      tweet_type = 'quote';
      const tmpl = rng.pick(quoteTemplates);
      content = fillTemplate(tmpl, rng);
      parent_ref = rng.pick(sameTypeUsernames);
    } else {
      // Repost (5%) — short reaction or reshare
      tweet_type = 'repost';
      const repostReactions = [
        'This.',
        'Important.',
        'Read this.',
        'Exactly right.',
        'Saving this.',
        'Worth reading.',
        'Yes.',
        'The correct take.',
        'Must read.',
        'Bookmarked.',
      ];
      content = rng.pick(repostReactions);
      parent_ref = rng.pick(sameTypeUsernames);
    }

    // Select topic based on persona interests
    const topic = getTopicForPersona(persona, rng);

    // Distribute over past 168 hours (7 days) with realistic timing
    // More activity during waking hours (weighted toward 0-16 hours ago)
    const hourRoll = rng.next();
    let created_at_offset_hours: number;
    if (hourRoll < 0.4) {
      // 40% of tweets in last 24 hours
      created_at_offset_hours = rng.next() * 24;
    } else if (hourRoll < 0.65) {
      // 25% in last 48-72 hours
      created_at_offset_hours = 24 + rng.next() * 48;
    } else {
      // 35% spread over rest of the week
      created_at_offset_hours = 72 + rng.next() * 96;
    }

    // Round to 1 decimal
    created_at_offset_hours = Math.round(created_at_offset_hours * 10) / 10;

    tweets.push({
      persona_username: persona.username,
      content,
      tweet_type,
      topic,
      ...(parent_ref ? { parent_ref } : {}),
      created_at_offset_hours,
    });
  }

  return tweets;
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Programmatically generates tweets for all given personas.
 * No LLM calls — uses template-based generation with seeded randomness.
 *
 * @param personas - Array of personas to generate tweets for
 * @param _topics  - Available topics (used for topic assignment)
 * @param tweetsPerPersona - Number of tweets to generate per persona (default 250)
 * @returns Array of GeneratedTweet objects
 */
export function generateTweetsForPersonas(
  personas: Persona[],
  _topics: Topic[],
  tweetsPerPersona = 250,
): GeneratedTweet[] {
  const allTweets: GeneratedTweet[] = [];
  const allUsernames = personas.map((p) => p.username);

  for (const persona of personas) {
    // Seed each persona's RNG deterministically from their username
    const rng = new SeededRandom(`${persona.username}_seed_v1`);
    const tweets = generatePersonaTweets(persona, allUsernames, tweetsPerPersona, rng);
    allTweets.push(...tweets);
  }

  return allTweets;
}
