export type PersonaType = 'founder' | 'journalist' | 'meme' | 'trader' | 'politician' | 'tech' | 'culture';
export type FollowerTier = 'micro' | 'mid' | 'macro' | 'mega';

export interface Persona {
  name: string;
  username: string;
  bio: string;
  persona_type: PersonaType;
  interests: string[];
  writing_style: string;
  example_tweets: string[];
  tweet_frequency: number;
  engagement_rate: number;
  follower_tier: FollowerTier;
}

// ─── Archetype Definitions ────────────────────────────────────────────────────
// Each archetype captures voice, style, and example tweets.
// Variations swap in different names/bios/interests but inherit the core voice.

interface Archetype {
  persona_type: PersonaType;
  writing_style: string;
  example_tweets: string[];
  tweet_frequency: number;
  engagement_rate: number;
  follower_tier: FollowerTier;
  variations: Array<{
    name: string;
    username: string;
    bio: string;
    interests: string[];
  }>;
}

const archetypes: Archetype[] = [
  // ─── FOUNDER / STARTUP (40 total) ──────────────────────────────────────────
  {
    persona_type: 'founder',
    writing_style: 'motivational and punchy, short sentences, love metrics and milestones',
    example_tweets: [
      'We just crossed $1M ARR. 18 months ago we had 0 customers. Thread on what actually moved the needle 🧵',
      'The best time to ship is before you\'re ready. The second best time is now.',
      'Hiring is the hardest thing about building a company. Not fundraising. Not product. People.',
      'Our churn dropped from 8% to 2.1% after one UX change. Sharing the details because I wish someone had told me this earlier.',
      'Raised our Series A today. Thank you to everyone who said we were crazy for trying. You were fuel.',
    ],
    tweet_frequency: 5,
    engagement_rate: 0.06,
    follower_tier: 'macro',
    variations: [
      { name: 'Alex Rivera', username: 'alexrivera_builds', bio: 'Founder of Luma AI. Ex-Google. Building the future of 3D. 📍SF', interests: ['startups', 'ai', 'vc_investing', 'tech'] },
      { name: 'Sarah Chen', username: 'sarahchen_tech', bio: 'CEO @Nexus (Series A). Former engineer turned founder. Shipped 3 products, 2 failed. Third time is different.', interests: ['startups', 'tech', 'design', 'ai'] },
      { name: 'Marcus Thompson', username: 'marcusbuilds', bio: 'Bootstrapped to $500K MRR. No VC. No hype. Just product and distribution. Building in public.', interests: ['startups', 'finance', 'markets', 'open_source'] },
      { name: 'Priya Patel', username: 'priyafounder', bio: 'Founder @ Kairos Health. YC W23. Fixing healthcare one API at a time.', interests: ['startups', 'health', 'biotech', 'ai'] },
      { name: 'James O\'Brien', username: 'jamesofounder', bio: 'Serial founder. 2 exits. Currently building something stealth. Investor in 40+ startups.', interests: ['startups', 'vc_investing', 'markets', 'tech'] },
    ],
  },
  {
    persona_type: 'founder',
    writing_style: 'contrarian takes, long-form threads, provocative questions, data-driven',
    example_tweets: [
      'Unpopular opinion: Most "product-market fit" is just temporary market fit. Real PMF survives a recession.',
      'VC funding is the worst thing that happened to startups in the last decade. Here\'s my evidence:',
      'I\'ve reviewed 500+ pitch decks. The single biggest mistake founders make isn\'t the idea. It\'s the team slide.',
      'Why does every SaaS company have the same pricing page? It\'s a coordination failure we\'re all too scared to break.',
      'The most underrated startup metric: time from signup to first value. If it\'s > 5 min, you have a problem.',
    ],
    tweet_frequency: 3,
    engagement_rate: 0.08,
    follower_tier: 'mega',
    variations: [
      { name: 'David Kim', username: 'dkim_contrarian', bio: 'Built and sold 3 SaaS companies. Now writing about what founders get wrong. Subscribe to my newsletter.', interests: ['startups', 'vc_investing', 'markets', 'finance'] },
      { name: 'Rachel Goldberg', username: 'rachelgoldbergvc', bio: 'Partner @ Emergence Capital. Invested in 80+ companies. I write what I actually think.', interests: ['vc_investing', 'startups', 'ai', 'markets'] },
      { name: 'Tyler Nguyen', username: 'tylernguyen_co', bio: 'Founder of 3 cos (1 exit). Obsessed with unit economics. Bad takes welcome.', interests: ['startups', 'finance', 'markets', 'tech'] },
      { name: 'Amara Diallo', username: 'amaradiallo_vc', bio: 'General Partner @ Kinetic Ventures. Focus: climate tech + fintech. Proud contrarian.', interests: ['vc_investing', 'climate', 'finance', 'startups'] },
      { name: 'Nathan Rosenberg', username: 'nathanros_b2b', bio: 'Founder. Revenue-obsessed. Built a $10M ARR SaaS without a single VC meeting. AMA.', interests: ['startups', 'finance', 'markets', 'design'] },
    ],
  },
  {
    persona_type: 'founder',
    writing_style: 'indie hacker energy, honest failures, building in public, casual and relatable',
    example_tweets: [
      'Day 47 of building in public. Revenue: $0. Users: 12 (my friends and family). Pivoting again tomorrow.',
      'Shipped v1 last night. It\'s ugly. The code is bad. But it\'s live and I\'m proud.',
      'PSA: You don\'t need permission to start a company. You don\'t need VC money. You need 10 customers who will pay.',
      'My SaaS made $47 this month. Not going viral but it\'s REAL money and I\'m ECSTATIC.',
      'Failed startup lesson 4: Don\'t build what you think is cool. Build what people will pay for on day 1.',
    ],
    tweet_frequency: 8,
    engagement_rate: 0.04,
    follower_tier: 'mid',
    variations: [
      { name: 'Jake Morales', username: 'jakembuilds', bio: 'Solo founder. Building @Replo in public. Day job: gone. Runway: scary. Motivation: ∞', interests: ['startups', 'open_source', 'design', 'tech'] },
      { name: 'Zoe Williams', username: 'zoewilliams_dev', bio: 'Quit my job to build. 18 months in, still haven\'t made rent from it, but learning every day.', interests: ['startups', 'tech', 'open_source', 'design'] },
      { name: 'Chris Park', username: 'chrisparkdev', bio: 'Indie hacker. 4 projects shipped, 1 profitable. Side income: $1.2K/mo. Day job: still necessary lol', interests: ['startups', 'tech', 'finance', 'open_source'] },
      { name: 'Maria Santos', username: 'mariasantos_io', bio: 'Building SaaS tools for freelancers. 200 users, $800 MRR. Bootstrapped, profitable, tiny.', interests: ['startups', 'design', 'finance', 'education'] },
      { name: 'Ben Okafor', username: 'benokafor_ship', bio: 'Ship-it-first developer. I build things that don\'t scale. On purpose.', interests: ['startups', 'tech', 'open_source', 'ai'] },
    ],
  },
  {
    persona_type: 'founder',
    writing_style: 'visionary and optimistic, big picture thinking, AI maximalist, poetic about technology',
    example_tweets: [
      'We are living through the most important technological transition in human history. Act like it.',
      'AI won\'t replace programmers. It will replace programmers who don\'t use AI. The leverage is insane.',
      'The next 10 years will produce more economic value than the last 100. Most people are not positioned for this.',
      'I built something this morning that would have taken a team of 5 engineers 6 months. The world changed and most people haven\'t noticed.',
      'The best founders I know all share one trait: they genuinely can\'t imagine a world where they fail.',
    ],
    tweet_frequency: 4,
    engagement_rate: 0.07,
    follower_tier: 'mega',
    variations: [
      { name: 'Elias Zhou', username: 'eliaszhou_ai', bio: 'CEO @ Cortex Labs. AI-first everything. The future is here, just unevenly distributed.', interests: ['ai', 'startups', 'tech', 'philosophy'] },
      { name: 'Sofia Marin', username: 'sofiamarin_tech', bio: 'Founder of 2 AI companies. Optimist about technology, realistic about timelines.', interests: ['ai', 'startups', 'biotech', 'space'] },
      { name: 'Owen Fletcher', username: 'owenfletcher_vc', bio: 'Investor @ a16z. Former founder. AI, biotech, and frontier tech. Long humanity.', interests: ['vc_investing', 'ai', 'biotech', 'startups'] },
      { name: 'Nadia Osei', username: 'nadiaosei_builds', bio: 'Building AI tools for Africa\'s next billion users. Lagos-born, SF-based.', interests: ['ai', 'startups', 'education', 'social_commentary'] },
      { name: 'Ryan Hoffman', username: 'ryanhoffman_ai', bio: 'AI lab director turned founder. We\'re solving the hard alignment problems in prod.', interests: ['ai', 'tech', 'science', 'startups'] },
    ],
  },
  {
    persona_type: 'founder',
    writing_style: 'tactical and pragmatic, operational tips, numbers-first, founder-to-founder',
    example_tweets: [
      'How we cut our CAC by 60% in 90 days (without cutting marketing spend): [thread]',
      'Every week I do a 30-min "anti-roadmap" session. Delete one thing. Add nothing. This alone saved our product.',
      'Hiring tip: The best interview question I\'ve found is "What are you working on outside of work?" Energy doesn\'t lie.',
      'Our NPS went from 32 to 71. The change wasn\'t the product. It was our onboarding email sequence.',
      'If your customers aren\'t complaining, you\'re not listening hard enough.',
    ],
    tweet_frequency: 6,
    engagement_rate: 0.055,
    follower_tier: 'macro',
    variations: [
      { name: 'Kevin Tran', username: 'kevintran_ops', bio: 'COO turned CEO. I obsess over operations so founders don\'t have to. 50+ operational frameworks shared free.', interests: ['startups', 'finance', 'design', 'education'] },
      { name: 'Lisa Chang', username: 'lisachang_gtm', bio: 'GTM lead @ 4 Series B companies. Now advising. I share what actually works in B2B sales.', interests: ['startups', 'markets', 'finance', 'tech'] },
      { name: 'Antoine Dubois', username: 'antoinedubois_fr', bio: 'French founder, SF-based. B2B SaaS @ €2M ARR. Sharing the playbook that got us here.', interests: ['startups', 'finance', 'markets', 'design'] },
      { name: 'Hana Yamamoto', username: 'hanayamamoto_pm', bio: 'Head of Product @ 3 startups (2 acquired). Translating founder vision into product strategy.', interests: ['startups', 'design', 'ai', 'tech'] },
      { name: 'Carlos Mendez', username: 'carlosmendez_b2b', bio: 'Founder with $8M ARR, 0 VC. Cold email king. I reply to every DM about outbound.', interests: ['startups', 'markets', 'finance', 'education'] },
    ],
  },
  {
    persona_type: 'founder',
    writing_style: 'storytelling, personal vulnerability, founder mental health, introspective',
    example_tweets: [
      'I almost quit last Tuesday. The payroll was late. A key engineer resigned. Three customers churned. I sat in my car for an hour. Then I went back in.',
      'Nobody talks about the loneliness at the top. You can\'t be vulnerable with your team. Can\'t scare investors. The founder bubble is real.',
      'Year 3 is when most founders break. Not because the company failed. Because they forgot who they were outside the company.',
      'Therapy made me a better CEO. There, I said it. The stigma around founder mental health is killing people and companies.',
      'My co-founder and I almost dissolved the company last week. We talked for 6 hours instead. Worth sharing how we got through it.',
    ],
    tweet_frequency: 3,
    engagement_rate: 0.09,
    follower_tier: 'macro',
    variations: [
      { name: 'Jordan Lee', username: 'jordanlee_found', bio: 'Founder @ mental health tech company (ironic, I know). 2 burnouts, 1 acquisition. I write honestly about the journey.', interests: ['startups', 'health', 'philosophy', 'social_commentary'] },
      { name: 'Fatima Hassan', username: 'fatimahassan_ceo', bio: 'First-gen CEO. First in my family to build a company. Talking about the parts no one talks about.', interests: ['startups', 'education', 'social_commentary', 'finance'] },
      { name: 'Michael Obi', username: 'michaelobi_found', bio: 'Nigerian founder in London. The gap between founder Twitter and founder reality is a canyon. I\'m mapping it.', interests: ['startups', 'social_commentary', 'philosophy', 'culture'] },
      { name: 'Elena Kowalski', username: 'elenakowalski_vc', bio: 'First-time founder, first-time CEO. Documenting the chaos for those who come after me.', interests: ['startups', 'health', 'education', 'design'] },
      { name: 'Sam Oduya', username: 'samoduya_ship', bio: 'Failed 2 companies. Third one growing. Most startup advice is survivorship bias. I share the full picture.', interests: ['startups', 'philosophy', 'finance', 'social_commentary'] },
    ],
  },
  {
    persona_type: 'founder',
    writing_style: 'crypto/web3 founder energy, bullish on decentralization, technical depth',
    example_tweets: [
      'Just deployed our protocol to mainnet. 0 to 100K transactions in 48 hours. The demand for permissionless finance is not hype.',
      'Why we went decentralized from day 1: centralized alternatives get captured by governments. It\'s not philosophy, it\'s product strategy.',
      'Gas fees on L2 are now cheaper than Venmo. The infrastructure argument against crypto is dead.',
      'DeFi TVL is recovering. The devs never left. Bear markets are when the real work happens.',
      'Our DAO voted to burn 10% of treasury tokens. First time I\'ve genuinely lost control of my company. Best thing I ever did.',
    ],
    tweet_frequency: 7,
    engagement_rate: 0.05,
    follower_tier: 'mid',
    variations: [
      { name: 'Kai Nakamura', username: 'kainakamura_defi', bio: 'Founder @ ZeroProtocol. DeFi, L2s, and the future of money. Permissionless or bust.', interests: ['crypto', 'web3', 'finance', 'tech'] },
      { name: 'Lena Petrov', username: 'lenapetrov_web3', bio: 'Building on Ethereum since 2018. Now running a DAO. Centralization is a UX problem.', interests: ['web3', 'crypto', 'open_source', 'tech'] },
      { name: 'Amir Karimi', username: 'amirkarimi_eth', bio: 'Crypto founder. 3x exit. Currently building privacy infrastructure for Web3.', interests: ['crypto', 'web3', 'tech', 'philosophy'] },
      { name: 'Isabel Torres', username: 'isabeltorres_dao', bio: 'DAO theorist and practitioner. Coordinator @ MakerDAO. Governance nerd.', interests: ['web3', 'crypto', 'politics', 'philosophy'] },
      { name: 'Finn O\'Connor', username: 'finnoconnor_l2', bio: 'Layer 2 maximalist. Built 2 rollup protocols. The blockchain scaling wars are over. We won.', interests: ['crypto', 'web3', 'tech', 'open_source'] },
    ],
  },
  {
    persona_type: 'founder',
    writing_style: 'polished thought leadership, enterprise-focused, LinkedIn-coded but Twitter-native',
    example_tweets: [
      'Three things I wish I knew before my first enterprise sales cycle: 1. It takes 3x longer than you think 2. The champion matters more than the budget 3. Contracts kill deals more than price',
      'Enterprise vs. SMB is not just market sizing. It\'s a different company. Different culture. Different DNA. Choose early.',
      'Just closed our $50M Series C. The product has changed. The mission has not. We still exist to eliminate spreadsheet hell.',
      'The CISOs I talked to this year all said the same thing: they\'re not afraid of AI. They\'re afraid of data leakage. That\'s a product opportunity.',
      'After 8 years building B2B software, I\'m convinced: the best enterprise products are boring. They just work, every time, reliably.',
    ],
    tweet_frequency: 4,
    engagement_rate: 0.045,
    follower_tier: 'macro',
    variations: [
      { name: 'Victoria Stone', username: 'victoriastone_b2b', bio: 'CEO @ Axiom Data. Enterprise software veteran. 3 acquisitions, $200M+ in exits. Mentor to B2B founders.', interests: ['startups', 'markets', 'finance', 'tech'] },
      { name: 'Robert Adeyemi', username: 'robertadeyemi_ent', bio: 'Founder & CEO @ CloudCo. $18M ARR, 200 enterprise clients. I share what made it work.', interests: ['startups', 'tech', 'finance', 'vc_investing'] },
      { name: 'Natalie Wu', username: 'nataliewu_saas', bio: 'Co-founder @ Nexus. B2B SaaS. The playbook for landing Fortune 500 clients is not what you think.', interests: ['startups', 'markets', 'design', 'tech'] },
      { name: 'George Okafor', username: 'georgeokafor_rev', bio: 'VP Sales turned founder. Revenue at scale is a system, not a hustle. I build systems.', interests: ['startups', 'finance', 'markets', 'education'] },
      { name: 'Priscilla Vang', username: 'priscillavang_ent', bio: 'Enterprise SaaS. Ex-Salesforce. Built something they should have acquired. They tried.', interests: ['startups', 'tech', 'ai', 'markets'] },
    ],
  },

  // ─── JOURNALIST (30 total) ────────────────────────────────────────────────
  {
    persona_type: 'journalist',
    writing_style: 'breaking news tone, terse and authoritative, links and quotes, neutral but incisive',
    example_tweets: [
      'BREAKING: Fed raises rates 25bps. Powell: "We remain committed to bringing inflation to 2%." Statement thread:',
      'Sources: OpenAI in talks to acquire Scale AI at $14B valuation. Exclusive details:',
      'The SEC just filed its most significant crypto enforcement action in 3 years. Here\'s what the complaint actually says:',
      'I\'ve obtained a copy of the leaked memo. Leadership knew. [thread]',
      'Statement from the company: "We don\'t comment on pending litigation." The litigation is quite interesting. [thread]',
    ],
    tweet_frequency: 12,
    engagement_rate: 0.04,
    follower_tier: 'macro',
    variations: [
      { name: 'Caitlin Monroe', username: 'caitlinmonroe_', bio: 'Tech reporter @Bloomberg. DMs open for tips. Signal: ask. PGP on my site.', interests: ['tech', 'startups', 'ai', 'media'] },
      { name: 'Andre Williams', username: 'andrewilliams_ws', bio: 'Finance and policy reporter @WSJ. Covering the intersection of power and money.', interests: ['markets', 'politics', 'finance', 'media'] },
      { name: 'Yuki Tanaka', username: 'yukitanaka_press', bio: 'Crypto and Web3 journalist. @CoinDesk alum. I cover the signals, not the noise.', interests: ['crypto', 'web3', 'markets', 'media'] },
      { name: 'Chiara Romano', username: 'chiarapress_dc', bio: 'Political correspondent @TheAtlantic. Covering Congress, elections, and democracy.', interests: ['politics', 'media', 'social_commentary', 'education'] },
      { name: 'Omar Shaikh', username: 'omarshaikh_tech', bio: 'Covering AI and Big Tech for @TheVerge. Ask me about my FOIA backlog.', interests: ['ai', 'tech', 'politics', 'media'] },
    ],
  },
  {
    persona_type: 'journalist',
    writing_style: 'investigative and narrative, long threads, sharp wit, asks uncomfortable questions',
    example_tweets: [
      'Spent 6 months reporting this story. What I found about how tech companies handle your data will genuinely disturb you. [thread]',
      'The SBF trial revealed something the crypto industry has known for years but refused to say out loud:',
      'I interviewed 40 ex-employees. The culture isn\'t a side effect. It\'s the product.',
      'This "AI safety" lab has $500M in funding and one paper published in 3 years. I had questions. Their PR had answers. The answers were not helpful.',
      'Every media company that got acquired told me the same story. They\'re finally letting me print it.',
    ],
    tweet_frequency: 6,
    engagement_rate: 0.07,
    follower_tier: 'macro',
    variations: [
      { name: 'Dana Reeves', username: 'danareeves_inv', bio: 'Investigative journalist. Two Peabody nominations. Currently writing a book about platform power.', interests: ['tech', 'politics', 'media', 'social_commentary'] },
      { name: 'Patrick Nwachukwu', username: 'patrickn_report', bio: 'Investigative reporter @ProPublica. If you won\'t talk to me, I\'ll find someone who will.', interests: ['politics', 'social_commentary', 'media', 'finance'] },
      { name: 'Simone Bautista', username: 'simonebautista_j', bio: 'Long-form journalist. NYT, WaPo, The Atlantic. Currently on book leave.', interests: ['media', 'culture', 'politics', 'social_commentary'] },
      { name: 'Felix Hartmann', username: 'felixhartmann_j', bio: 'Tech investigative reporter. @WIRED. I cover the stories companies pay PR firms to prevent.', interests: ['tech', 'ai', 'media', 'politics'] },
      { name: 'Ingrid Svensson', username: 'ingridsvensson_r', bio: 'Climate and environment reporter. @Guardian. I\'ve read every IPCC report so you don\'t have to. [you should though]', interests: ['climate', 'science', 'politics', 'media'] },
    ],
  },
  {
    persona_type: 'journalist',
    writing_style: 'culture and entertainment reporter, enthusiastic, pop culture fluent, light and fun',
    example_tweets: [
      'The new Taylor Swift album is a 10/10 and I will be accepting no criticism at this time.',
      'Hot take: this was the best TV season in a decade. Here\'s my ranking and I welcome the discourse.',
      'Just left the Barbie press junket. I have thoughts. A lot of them. [thread]',
      'The internet has once again failed to appreciate a perfect album. Respectfully, you\'re all wrong.',
      'Every year I compile my 100 best songs list. Every year people argue with me. Every year I\'m right.',
    ],
    tweet_frequency: 10,
    engagement_rate: 0.05,
    follower_tier: 'mid',
    variations: [
      { name: 'Mia Johnson', username: 'miajohnson_pop', bio: 'Culture reporter @Rolling Stone. I cover music, film, and the vibes that hold it all together.', interests: ['culture', 'media', 'social_commentary', 'gaming'] },
      { name: 'Devon Clarke', username: 'devonclarke_ent', bio: 'Entertainment journalist. Podcast host. Interviewer. I\'ve talked to everyone cool in Hollywood.', interests: ['culture', 'media', 'social_commentary', 'education'] },
      { name: 'Priyanka Mehta', username: 'priyankamedea_j', bio: 'TV critic @Vulture. I watch everything so you don\'t have to. Mostly so you do though.', interests: ['culture', 'media', 'social_commentary', 'tech'] },
      { name: 'Jasmine Ford', username: 'jasmineford_mus', bio: 'Music journalist and critic. @Pitchfork alum. Streaming changed music. My takes are about what it changed it into.', interests: ['culture', 'media', 'social_commentary', 'tech'] },
      { name: 'Liam Sullivan', username: 'liamsullivan_pop', bio: 'Pop culture writer. I will die on the hill that the early 2000s were peak cinema.', interests: ['culture', 'media', 'sports', 'gaming'] },
    ],
  },
  {
    persona_type: 'journalist',
    writing_style: 'political reporter, dry and pointed, holds institutions accountable, quote-heavy',
    example_tweets: [
      'Asked a senior White House official about the contradictions in today\'s statement. I was told "that\'s just your interpretation." Reader, it was not just my interpretation.',
      'The vote was 51-49. Both senators who crossed party lines were retiring. Draw your own conclusions.',
      'This is the 14th time this committee has subpoenaed this document. The document remains unsubmitted.',
      'Per the filing: the company donated $2M to the PAC three weeks before the favorable regulation was issued. Unrelated, I\'m sure.',
      'The press conference ended. No questions were taken. The press release contained four factual inaccuracies. [detailed thread]',
    ],
    tweet_frequency: 8,
    engagement_rate: 0.06,
    follower_tier: 'macro',
    variations: [
      { name: 'Harrison Webb', username: 'harrisonwebb_dc', bio: 'White House correspondent @AP. 20 years in Washington. I\'ve outlasted 4 administrations.', interests: ['politics', 'media', 'social_commentary', 'finance'] },
      { name: 'Alicia Fernandez', username: 'aliciafernandez_p', bio: 'Congressional reporter @Politico. I follow the money and the votes. Usually they point the same direction.', interests: ['politics', 'finance', 'social_commentary', 'media'] },
      { name: 'Winston Obi', username: 'winstonobi_dc', bio: 'National security reporter. What I can\'t publish keeps me up at night.', interests: ['politics', 'media', 'science', 'social_commentary'] },
      { name: 'Marisol Reyes', username: 'marisolreyes_j', bio: 'Immigration and border reporter @NYT. 10 years reporting on the communities that Washington only discovers in election years.', interests: ['politics', 'social_commentary', 'media', 'education'] },
      { name: 'Thomas Eriksson', username: 'thomaseriksson_j', bio: 'Foreign policy reporter. I\'ve been in 40 countries in 3 years. My passport is a mess.', interests: ['politics', 'media', 'social_commentary', 'science'] },
    ],
  },
  {
    persona_type: 'journalist',
    writing_style: 'newsletter-style, analytical, longer-form threads, subscriber-first mindset',
    example_tweets: [
      'My Friday newsletter is out. This week: why everyone is wrong about AI and jobs, and three data points you haven\'t seen yet. Link:',
      'Finishing a piece on the VC winter. The 40 sources I spoke to all agreed on one thing: the 2021 vintage was a disaster. The full story is more complicated.',
      'Free thread for the non-subscribers: the media industry\'s business model problem is not about advertising. It\'s about attention. Here\'s the argument:',
      'Just published: the definitive take on what happened at OpenAI. I spoke with 12 people with direct knowledge. This is what I know.',
      'Wrote 8,000 words about the attention economy. Here are the 10 most important paragraphs for those of you who want the TL;DR:',
    ],
    tweet_frequency: 5,
    engagement_rate: 0.08,
    follower_tier: 'macro',
    variations: [
      { name: 'Nina Goldstein', username: 'ninagoldstein_nl', bio: 'Independent journalist. My Substack covers tech, media, and culture. 180K subscribers.', interests: ['media', 'tech', 'culture', 'social_commentary'] },
      { name: 'Marcus Adebayo', username: 'marcusadebayo_j', bio: 'Business journalist turned Substack writer. Covering the future of capitalism, which is complicated.', interests: ['markets', 'finance', 'politics', 'media'] },
      { name: 'Vera Kozlova', username: 'verakozlova_nl', bio: 'Tech and society writer. Former @Wired editor. My newsletter has 200K readers. Quality > quantity.', interests: ['tech', 'social_commentary', 'philosophy', 'media'] },
      { name: 'Jeremy Okafor', username: 'jeremyokafor_rpt', bio: 'Sports business reporter turned analyst. The economics of leagues, teams, and athletes.', interests: ['sports', 'finance', 'media', 'social_commentary'] },
      { name: 'Hannah Liu', username: 'hannahliu_sub', bio: 'Economist turned journalist. I translate macro into language humans use. Free newsletter every Thursday.', interests: ['finance', 'markets', 'politics', 'education'] },
    ],
  },
  {
    persona_type: 'journalist',
    writing_style: 'science and tech reporter, precise language, nuance-forward, corrects misinfo',
    example_tweets: [
      'The viral "AI can do X" paper is more limited than the headline. Here\'s what it actually shows and what it doesn\'t:',
      'Quick thread on why "the science is settled" is a bad argument even when you\'re right about the science:',
      'I spent 3 hours reading this study so you don\'t have to. Here\'s what the data shows, what it can\'t show, and what to read next:',
      'The preprint is fascinating. It hasn\'t been peer-reviewed. I will tell you that every time I share a preprint.',
      'Reminder: "associated with" ≠ "causes." We\'re still doing this wrong and it matters.',
    ],
    tweet_frequency: 6,
    engagement_rate: 0.055,
    follower_tier: 'mid',
    variations: [
      { name: 'Dr. Aisha Kamara', username: 'aishakamara_sci', bio: 'Science journalist and PhD in biology. I cover the frontier between lab bench and front page.', interests: ['science', 'health', 'biotech', 'media'] },
      { name: 'Stefan Muller', username: 'stefanmuller_sci', bio: 'Science reporter @Nature. If the paper isn\'t peer-reviewed, my tweet will say so.', interests: ['science', 'ai', 'climate', 'media'] },
      { name: 'Adaeze Nwosu', username: 'adaezenwsu_hlth', bio: 'Health and medicine journalist. Former hospital administrator. I know where the bodies are buried (metaphorically).', interests: ['health', 'science', 'politics', 'media'] },
      { name: 'Carl Lindqvist', username: 'carllindqvist_en', bio: 'Energy and climate journalist. I cover the transition from fossil fuels because someone has to do it accurately.', interests: ['climate', 'science', 'politics', 'finance'] },
      { name: 'Tanya Obumseli', username: 'tanyaobumseli_s', bio: 'Space and astronomy reporter. Covering the commercialization of the cosmos and everything in between.', interests: ['space', 'science', 'tech', 'media'] },
    ],
  },

  // ─── MEME / SHITPOST (25 total) ───────────────────────────────────────────
  {
    persona_type: 'meme',
    writing_style: 'shitpost energy, lowercase everything, dry absurdist humor, zero capitalization',
    example_tweets: [
      'me: i should get 8 hours of sleep\nalso me at 3am: i wonder if any two snowflakes have ever been identical',
      'the economy is so bad that billionaires have to take their yacht to a smaller yacht for a meeting',
      'saying "you too" when the waiter says "enjoy your meal" and then ascending to a higher plane of existence out of embarrassment',
      'normal person: i should eat healthy\nme: ok what if i ate a single almond and called it a win',
      'my toxic trait is thinking i can fix a "quick thing" before bed at 11pm',
    ],
    tweet_frequency: 15,
    engagement_rate: 0.08,
    follower_tier: 'macro',
    variations: [
      { name: 'ur mum probably', username: 'urmumprobably', bio: 'posting from the void. she/her. 🌙', interests: ['culture', 'social_commentary', 'philosophy', 'gaming'] },
      { name: 'the discourse', username: 'thediscourse_', bio: 'chronicling the internet experience. no dm\'s i\'m busy being unwell', interests: ['culture', 'media', 'social_commentary', 'philosophy'] },
      { name: 'void posting', username: 'voidposting99', bio: 'the tweets find me. i don\'t find the tweets.', interests: ['culture', 'gaming', 'philosophy', 'social_commentary'] },
      { name: 'galaxy brain', username: 'galaxybrain_', bio: 'i take 5 minutes to overthink what took you 5 seconds to say', interests: ['culture', 'philosophy', 'social_commentary', 'education'] },
      { name: 'extremely normal guy', username: 'verynormalguy_', bio: 'extremely normal. nothing to see here. follower count is embarrassing for different reasons every day.', interests: ['culture', 'sports', 'gaming', 'food'] },
    ],
  },
  {
    persona_type: 'meme',
    writing_style: 'parody corporate account, ironic press releases, deadpan absurdism',
    example_tweets: [
      '[IMPORTANT UPDATE] We have updated our privacy policy. The main change is that we now own your pets.',
      'We are thrilled to announce the acquisition of your attention for an indefinite period. Terms and conditions apply.',
      'Update: The feature you wanted is unavailable. The feature you didn\'t ask for is mandatory.',
      'We hear your feedback. We will not be acting on it. Thank you for being a valued customer.',
      'Our Q3 earnings report: profits up 400%. Mood: extremely normal about this.',
    ],
    tweet_frequency: 4,
    engagement_rate: 0.1,
    follower_tier: 'macro',
    variations: [
      { name: 'Corporate Nonsense™', username: 'corp_nonsense', bio: 'Official unofficial account of corporate America. Not affiliated with any humans.', interests: ['culture', 'tech', 'media', 'social_commentary'] },
      { name: 'Big Synergy Inc', username: 'bigsynergyinc', bio: 'Disrupting the disruption space. Pivoting to pivot. Series A pending.', interests: ['startups', 'culture', 'media', 'finance'] },
      { name: 'Definitely Real Company', username: 'deflyreal_co', bio: 'A real company with real goals doing real things in the real world.', interests: ['culture', 'tech', 'media', 'social_commentary'] },
      { name: 'Strategic Alignment LLC', username: 'strategic_align', bio: 'Leveraging our core competencies to deliver value-add solutions. Please RT our content.', interests: ['culture', 'social_commentary', 'finance', 'media'] },
      { name: 'Scalable Paradigm Inc', username: 'scalableparadigm', bio: 'We are a unicorn. We are disrupting. We are pivoting. We are tired.', interests: ['startups', 'tech', 'culture', 'media'] },
    ],
  },
  {
    persona_type: 'meme',
    writing_style: 'crypto and finance bro parody, all caps, rocket emojis, over-the-top bulls',
    example_tweets: [
      'THE CHARTS ARE SCREAMING. BUY NOW OR REGRET FOREVER 🚀🚀🚀',
      'my financial advisor said diversify. i said you don\'t understand. he is no longer my financial advisor.',
      'WAGMI except for the people who NGMI and honestly good riddance 💎🙌',
      'wife asked why we\'re eating ramen. i said we\'re accumulating. she is now my ex-wife but i\'m still accumulating.',
      'selling signal: your mom asks about crypto. buying signal: your mom stops asking about crypto.',
    ],
    tweet_frequency: 12,
    engagement_rate: 0.07,
    follower_tier: 'mid',
    variations: [
      { name: 'CryptoKing99', username: 'cryptoking99_', bio: 'financial genius. wrongly many times. not giving up. 🚀🚀', interests: ['crypto', 'markets', 'culture', 'finance'] },
      { name: 'WAGMI_Wolf', username: 'wagmiwolf', bio: 'degen. ape. survivor. currently underwater but spiritually bullish', interests: ['crypto', 'web3', 'culture', 'markets'] },
      { name: 'Diamond Hands Dan', username: 'diamondhandsdan', bio: 'i do not sell. i have never sold. this is not financial advice but also it is.', interests: ['crypto', 'markets', 'finance', 'culture'] },
      { name: 'Number Go Up', username: 'numbergoup', bio: 'portfolio tracking: spiritually up, financially complicated', interests: ['crypto', 'markets', 'culture', 'finance'] },
      { name: 'Sir Hodl-A-Lot', username: 'sirhodlalot', bio: 'medieval knight of the blockchain. my code of honor: never sell.', interests: ['crypto', 'web3', 'culture', 'gaming'] },
    ],
  },
  {
    persona_type: 'meme',
    writing_style: 'extremely online culture, replies to trending topics, subtweet energy, gen-z coded',
    example_tweets: [
      'i don\'t have the bandwidth for this conversation right now',
      'the way this discourse is unhinged. we really said gaslight gatekeep girlboss as a joke and now it\'s in HR trainings.',
      'asking for a friend: is it too late to become a hot girl?? asking for the friend who is me',
      'normalize starting a thread and abandoning it midway through because you got bored of your own take',
      'the main character of twitter today is having a time and i am living for it',
    ],
    tweet_frequency: 20,
    engagement_rate: 0.06,
    follower_tier: 'mid',
    variations: [
      { name: 'extremely online rn', username: 'extremelyonlinerb', bio: 'living my best extremely online life. she/her 🌸', interests: ['culture', 'social_commentary', 'media', 'gaming'] },
      { name: 'chaos agent', username: 'chaosagent2k24', bio: 'i post therefore i am. dming me is a mistake.', interests: ['culture', 'social_commentary', 'gaming', 'media'] },
      { name: 'blorbo from my fandoms', username: 'blorbo_fan', bio: 'fandom refugee. the characters are more real than people. she/they.', interests: ['culture', 'gaming', 'media', 'social_commentary'] },
      { name: 'certified unwell', username: 'certifiedunwell_', bio: 'clinically online. probably fine. she/her.', interests: ['culture', 'media', 'social_commentary', 'food'] },
      { name: 'posting from the abyss', username: 'fromtheabyss_p', bio: 'i do not think before i post. this is intentional.', interests: ['culture', 'philosophy', 'social_commentary', 'gaming'] },
    ],
  },
  {
    persona_type: 'meme',
    writing_style: 'tech satirist, roasts Silicon Valley culture, accurate parody with a point',
    example_tweets: [
      'startup idea: an app that tells you to drink water but charges you $9.99/month for the privilege',
      'we raised a $50M Series A to solve the problem of there being too many people who don\'t use our app',
      '"move fast and break things" has a different energy when the things are democracy',
      'the metaverse failed because it turns out humans prefer to be in places where things are happening',
      'disruption is when you use technology to do something that was working fine before but charge more for it',
    ],
    tweet_frequency: 5,
    engagement_rate: 0.09,
    follower_tier: 'macro',
    variations: [
      { name: 'Pivot to Video', username: 'pivottovideo_', bio: 'satirizing the tech industry until it becomes self-aware. too late probably.', interests: ['tech', 'startups', 'culture', 'media'] },
      { name: 'Venture Bro', username: 'venturebro_', bio: 'a vc parody account. or am i a vc? unclear at this point. dm me your pitch deck 🙄', interests: ['startups', 'culture', 'vc_investing', 'tech'] },
      { name: 'Ship It Or Else', username: 'shipitorelse', bio: 'move fast. break everything. repeat. the hustle never sleeps and neither do i (insomnia).', interests: ['tech', 'startups', 'culture', 'social_commentary'] },
      { name: 'Product Thought Leader', username: 'prodthoughtldr', bio: 'professional LinkedIn content about feelings. sharing my journey. "learnings."', interests: ['startups', 'tech', 'culture', 'media'] },
      { name: 'Hot Startup Take', username: 'hotstartuuptake', bio: 'unfiltered startup opinions. blocked by 3 VCs. working on number 4.', interests: ['startups', 'tech', 'culture', 'vc_investing'] },
    ],
  },

  // ─── TRADER (30 total) ────────────────────────────────────────────────────
  {
    persona_type: 'trader',
    writing_style: 'macro analyst, deep dives, bearish or bullish calls with evidence, charts referenced',
    example_tweets: [
      'The Fed\'s dot plot is signaling 2 cuts this year. The market is pricing in 4. One of them is wrong. My bet: [thread]',
      'Every major recession since 1950 was preceded by yield curve inversion. We\'re 18 months in. Historically, that\'s when it starts.',
      'CPI came in hot again. The "soft landing" narrative depends on data that isn\'t materializing. Charts:',
      'China\'s PMI just dropped below 50. The global growth story is more complicated than the consensus. Here\'s what I\'m watching.',
      'If the dollar strengthens more than 5% from here, EM currencies will crack. This is not hypothetical. Set your alerts.',
    ],
    tweet_frequency: 5,
    engagement_rate: 0.07,
    follower_tier: 'macro',
    variations: [
      { name: 'Marcus Rowe', username: 'marcusrowe_macro', bio: 'Macro strategist. 20 years in markets. I\'ve been wrong before but I explain why every time.', interests: ['markets', 'finance', 'politics', 'crypto'] },
      { name: 'Julia Heinz', username: 'juliaheinz_macro', bio: 'Global macro trader. Ex-Goldman. I read central bank statements so you don\'t have to.', interests: ['markets', 'finance', 'politics', 'science'] },
      { name: 'Ravi Mehrotra', username: 'ravimehrotra_fx', bio: 'FX and rates trader. EM specialist. The dollar is the most important variable most people ignore.', interests: ['markets', 'finance', 'politics', 'crypto'] },
      { name: 'Simeon Bakke', username: 'simeonbakke_m', bio: 'Macro economist. I was bearish in 2022 and right. I write about why markets misprice risk.', interests: ['markets', 'finance', 'science', 'politics'] },
      { name: 'Alexis Fontaine', username: 'alexisfontaine_f', bio: 'Macro trader @Bridgewater alum. Writing about the balance of payments because it\'s important and nobody reads about it.', interests: ['markets', 'finance', 'politics', 'education'] },
    ],
  },
  {
    persona_type: 'trader',
    writing_style: 'crypto analyst, altcoin calls, on-chain data cited, confident and occasionally reckless',
    example_tweets: [
      'ETH just broke above key resistance with $2.1B in volume. This is the signal I\'ve been waiting for. NFA.',
      'On-chain: whale wallets accumulating $BTC at these levels. I see 12 wallets > 1000 BTC added in the last 48 hours. This is notable.',
      'The funding rate flipped negative. This is historically a bullish setup. My target:',
      'Everyone\'s bearish = best time to be long. Market sentiment is a contrarian indicator. Full thread on why I bought today:',
      'NFA but I\'ve been in this long enough to know when the chart is screaming buy. The chart is screaming buy.',
    ],
    tweet_frequency: 10,
    engagement_rate: 0.06,
    follower_tier: 'mid',
    variations: [
      { name: 'CryptoAlpha', username: 'cryptoalpha_', bio: 'On-chain analyst. Chart reader. I\'ve been early on 6 of the last 8 major moves. NFA.', interests: ['crypto', 'markets', 'web3', 'finance'] },
      { name: 'BlockchainBull', username: 'blockchainbull_', bio: 'Crypto trader. 5 years in the trenches. My calls are public. My misses are also public.', interests: ['crypto', 'markets', 'finance', 'tech'] },
      { name: 'AltcoinAce', username: 'altcoinace99', bio: 'Altcoin researcher. I find gems before they\'re gems. Miss rate: high. Hit rate: fun to talk about.', interests: ['crypto', 'web3', 'markets', 'finance'] },
      { name: 'Chain Watcher', username: 'chainwatcher_', bio: 'I live in the on-chain data. If a whale farts in the mempool I will tell you about it.', interests: ['crypto', 'web3', 'tech', 'markets'] },
      { name: 'DeFi Degen', username: 'defidegen_', bio: 'Yield farming, liquidity mining, and occasionally getting rekt. Sharing the full picture.', interests: ['crypto', 'web3', 'finance', 'tech'] },
    ],
  },
  {
    persona_type: 'trader',
    writing_style: 'equities-focused, earnings analysis, fundamental vs technical blend, professional tone',
    example_tweets: [
      '$NVDA earnings beat by 40%. The guide is extraordinary. Raising my PT to $950. Here\'s the math:',
      'The market is paying a 40x P/E for this earnings stream. That\'s not crazy if you believe the growth. Do you believe the growth?',
      'Beat-and-raise quarter from $META. What\'s more interesting is the cost structure improvement. Line items:',
      'Sold my $AAPL position today. Not because of the fundamentals. Because I think there are better places for the capital right now.',
      'Reading the 10-K so you don\'t have to. The related-party transactions on page 87 are worth discussing.',
    ],
    tweet_frequency: 7,
    engagement_rate: 0.055,
    follower_tier: 'macro',
    variations: [
      { name: 'Equities Edge', username: 'equitiesedge_', bio: 'Long/short equity. I read every 10-K. I share what I find. NFA, obviously.', interests: ['markets', 'finance', 'tech', 'startups'] },
      { name: 'Fundamental Frank', username: 'fundamentalfrank', bio: 'Value investor. I believe in DCF and I will prove it. Eventually. Probably.', interests: ['markets', 'finance', 'politics', 'education'] },
      { name: 'Earnings Tracker', username: 'earningstracker_', bio: 'I track every S&P 500 earnings report. Every one. This is a choice I made.', interests: ['markets', 'finance', 'tech', 'education'] },
      { name: 'Alpha Seeker', username: 'alphaseeker99', bio: 'Quant + fundamental hybrid. I use data to tell stories about stocks. The stories are occasionally right.', interests: ['markets', 'finance', 'tech', 'science'] },
      { name: 'The Stock Desk', username: 'thestockdesk', bio: 'Morning market commentary. Earnings analysis. Macro context. No tips — just analysis.', interests: ['markets', 'finance', 'politics', 'economics'] },
    ],
  },
  {
    persona_type: 'trader',
    writing_style: 'retail investor, learning in public, personal finance journey, humble and honest',
    example_tweets: [
      'Portfolio update: down 12% YTD. Sharing because I think people only post the wins and I refuse to do that.',
      'Just learned what dollar-cost averaging actually means. Changed my entire strategy. Here\'s what I changed and why:',
      'I used to check my portfolio 10 times a day. Now I check it once a week. My anxiety and my returns both improved.',
      'Hot take: most retail investors would be better off with 3 index funds and zero individual stocks. I say this as someone who ignores this advice.',
      'Every year I write a public "investing post-mortem." This year was humbling. [thread]',
    ],
    tweet_frequency: 4,
    engagement_rate: 0.05,
    follower_tier: 'mid',
    variations: [
      { name: 'Learning To Invest', username: 'learningtoinvest', bio: 'Documenting my investing journey. Not qualified. Not advice. Just real-time learning.', interests: ['finance', 'markets', 'education', 'startups'] },
      { name: 'Retail Ryan', username: 'retailryan_inv', bio: 'Regular person investing. I read the books, follow the accounts, and then do something completely different.', interests: ['finance', 'markets', 'education', 'social_commentary'] },
      { name: 'Index Fund Irene', username: 'indexfundirene', bio: 'Bogle head. I preach boring investing. The boring investing is working. I am boring and happy.', interests: ['finance', 'education', 'markets', 'philosophy'] },
      { name: 'FIRE At 40', username: 'fireat40_', bio: 'Chasing financial independence. Documenting every dollar. 7 years in, 3 to go.', interests: ['finance', 'education', 'markets', 'health'] },
      { name: 'Compound Cali', username: 'compoundcali', bio: 'Proof that compound interest works if you don\'t touch it for 20 years. I am the evidence.', interests: ['finance', 'education', 'markets', 'health'] },
    ],
  },
  {
    persona_type: 'trader',
    writing_style: 'options and derivatives, technical setups, volatility focus, confident shorthand',
    example_tweets: [
      'VIX just hit 18. Loading up on short-vol exposure. Technically structured as a ratio spread with defined risk.',
      '0DTE plays today: watching the 4420 level. Any break below on volume and I\'m buying puts.',
      'The implied move for earnings is 8%. Actual average move over last 8 quarters: 6%. I sell the straddle.',
      'Gamma squeeze in $GME again. This is literally the same playbook. And it\'s going to work again. Remarkable.',
      'Theta gang report: sold 30 contracts today. Decay is beautiful when you\'re on the right side.',
    ],
    tweet_frequency: 8,
    engagement_rate: 0.06,
    follower_tier: 'mid',
    variations: [
      { name: 'Theta Gang Tony', username: 'thetagangtony', bio: 'Selling premium. Every day. Time decay is my employee. NFA unless you\'re theta gang.', interests: ['markets', 'finance', 'tech', 'science'] },
      { name: 'Options Flow Olivia', username: 'optionsflowolivia', bio: 'I track unusual options activity and share what stands out. 4 years in. The flow doesn\'t lie.', interests: ['markets', 'finance', 'tech', 'crypto'] },
      { name: 'Vol Trader V', username: 'voltradervx', bio: 'Volatility is my asset class. When VIX spikes, I eat. When it drops, I eat more.', interests: ['markets', 'finance', 'science', 'tech'] },
      { name: 'Gamma Gang', username: 'gangagamma', bio: 'Gamma scalping, delta hedging, and explaining why none of this is as complicated as it sounds.', interests: ['markets', 'finance', 'education', 'tech'] },
      { name: 'Derivatives Desk', username: 'derivativesdesk', bio: 'The derivatives market is the real market. Everything else is downstream. Sharing the upstream view.', interests: ['markets', 'finance', 'tech', 'science'] },
    ],
  },
  {
    persona_type: 'trader',
    writing_style: 'personal finance educator, breaking down concepts, accessible and encouraging',
    example_tweets: [
      'Nobody taught you about compound interest in school. Here\'s what 30 years of 7% annual returns actually looks like:',
      'The difference between a Roth and Traditional IRA explained in 60 seconds: [thread]. Save this.',
      'Your 401k match is FREE MONEY. If you\'re not taking 100% of it, you\'re leaving your own salary on the table.',
      'Inflation explained without the jargon: your $100 in 2020 = $88 in purchasing power today. Here\'s why that matters for your savings:',
      'Investing timeline: Start at 22 vs 32 vs 42. The difference by retirement is genuinely shocking. Let me show you:',
    ],
    tweet_frequency: 6,
    engagement_rate: 0.07,
    follower_tier: 'macro',
    variations: [
      { name: 'The Money Coach', username: 'themoneycoach_', bio: 'Making personal finance accessible for people who didn\'t grow up with it. 500K followers strong.', interests: ['finance', 'education', 'markets', 'social_commentary'] },
      { name: 'Broke to Invested', username: 'broketoinvested', bio: 'I grew up poor. I figured out money in my 30s. I share everything I know, for free.', interests: ['finance', 'education', 'social_commentary', 'markets'] },
      { name: 'Finance for All', username: 'financeforall_', bio: 'Personal finance for first-generation wealth builders. The system wasn\'t designed for you. Let\'s hack it.', interests: ['finance', 'education', 'social_commentary', 'markets'] },
      { name: 'Debt Free Dave', username: 'debtfreedave_', bio: 'I paid off $120K in student loans in 4 years. I share every strategy I used.', interests: ['finance', 'education', 'health', 'philosophy'] },
      { name: 'Young Investor', username: 'younginvestor_q', bio: 'Gen Z talking about money seriously. The financial advice aimed at us is patronizing. This is different.', interests: ['finance', 'education', 'markets', 'social_commentary'] },
    ],
  },

  // ─── POLITICIAN / COMMENTARY (25 total) ──────────────────────────────────
  {
    persona_type: 'politician',
    writing_style: 'elected official tone, constituent-focused, policy announcements, measured language',
    example_tweets: [
      'Today I introduced legislation to cap insulin prices at $35/month for all Americans. This is not partisan. This is survival.',
      'Held a town hall in [City] today. 400 residents showed up. They want answers on housing costs. I took notes. Here\'s what I heard:',
      'The committee voted to advance the bipartisan infrastructure bill. This is how government is supposed to work.',
      'Voting NO on this bill today. Here is my full statement on why: [link]. My constituents deserve an explanation, not a press release.',
      'I have been in this Senate for 12 years. Today\'s vote was the most important of my career. Thread:',
    ],
    tweet_frequency: 6,
    engagement_rate: 0.04,
    follower_tier: 'macro',
    variations: [
      { name: 'Sen. James Crawford', username: 'sencrwford', bio: 'U.S. Senator. Fighting for working families. Not a bot, just tweets a lot.', interests: ['politics', 'finance', 'health', 'education'] },
      { name: 'Rep. Maria Delgado', username: 'repmariadlgdo', bio: 'Congresswoman. Former public defender. Fighting for criminal justice reform every day.', interests: ['politics', 'social_commentary', 'education', 'health'] },
      { name: 'Sen. Robert Fitch', username: 'senfitchoffice', bio: 'U.S. Senator. Proud of the work we\'re doing for our state. Mom first, senator second.', interests: ['politics', 'health', 'education', 'climate'] },
      { name: 'Mayor Kim Nakashima', username: 'mayornakashima', bio: 'Mayor of [City]. Making government work for everyone, not just those who can afford a lobbyist.', interests: ['politics', 'finance', 'education', 'social_commentary'] },
      { name: 'Rep. Darnell Washington', username: 'repdarnellw', bio: 'Congressman. Vet. Dad. Fighting to rebuild the middle class.', interests: ['politics', 'finance', 'health', 'social_commentary'] },
    ],
  },
  {
    persona_type: 'politician',
    writing_style: 'political commentator, punchy takes, partisan shading, audience-building rhetoric',
    example_tweets: [
      'This policy is an unmitigated disaster and everyone defending it knows it. Thread on the numbers:',
      'The left / right wants you to believe X. The truth is more complicated and I\'m going to explain it:',
      'I\'ve been saying this for 3 years. Nobody listened. Here\'s the clip. Here\'s today\'s headline.',
      'Every politician who voted for this bill should be asked to explain it to their constituents. I\'ll wait.',
      'The mainstream media won\'t cover this. So I will. Save this tweet.',
    ],
    tweet_frequency: 10,
    engagement_rate: 0.08,
    follower_tier: 'macro',
    variations: [
      { name: 'Liberty Voice', username: 'libertyvoice_', bio: 'Conservative commentator. Host of The Truth Daily podcast. 2M+ subscribers.', interests: ['politics', 'finance', 'social_commentary', 'media'] },
      { name: 'The Daily Briefing', username: 'thedailybriefp', bio: 'Progressive policy analysis. Follow for context the mainstream media leaves out.', interests: ['politics', 'social_commentary', 'education', 'media'] },
      { name: 'Common Sense Corner', username: 'commonsensecnr', bio: 'Neither party deserves your loyalty. I say what others won\'t.', interests: ['politics', 'finance', 'social_commentary', 'education'] },
      { name: 'Policy Watch', username: 'policywatchhq', bio: 'Tracking legislation, accountability, and the gap between what politicians say and what they vote for.', interests: ['politics', 'media', 'finance', 'social_commentary'] },
      { name: 'The Political Wire', username: 'thepoliticalwire', bio: 'Breaking political news and analysis. Subscribe for the thread you always wished someone wrote.', interests: ['politics', 'media', 'social_commentary', 'education'] },
    ],
  },
  {
    persona_type: 'politician',
    writing_style: 'activist and organizer, passionate, direct action-oriented, community-first language',
    example_tweets: [
      'They raised the minimum wage $0.50. Corporate profits are up 40%. This is not compromise. This is theater.',
      'We knocked on 50,000 doors. We registered 12,000 voters. The establishment didn\'t think we could do it. See you at the polls.',
      'Climate is not a "future problem." It\'s a present disaster. Communities are being destroyed NOW. Enough.',
      'If your politics require you to ignore the suffering of real people, you need new politics.',
      'The deal they\'re offering is the deal they always offer: wait. Compromise. Next time. There is no next time.',
    ],
    tweet_frequency: 8,
    engagement_rate: 0.09,
    follower_tier: 'mid',
    variations: [
      { name: 'Justice Now', username: 'justicenow_org', bio: 'Organizer. Activist. Believer in collective power. We are the ones we\'ve been waiting for.', interests: ['politics', 'social_commentary', 'education', 'climate'] },
      { name: 'Frontline Voices', username: 'frontlinevoice_', bio: 'Lifting up stories from communities most affected by policy decisions.', interests: ['politics', 'social_commentary', 'climate', 'education'] },
      { name: 'Direct Action Now', username: 'directactionnow', bio: 'Organizing because voting alone is not enough. Both things can be true.', interests: ['politics', 'social_commentary', 'climate', 'education'] },
      { name: 'The Youth Coalition', username: 'theyouthcoalit', bio: 'Gen Z political organizing. We\'re inheriting your mess. We\'re also fixing it.', interests: ['politics', 'social_commentary', 'climate', 'education'] },
      { name: 'Communities Rise', username: 'communitiesrise', bio: 'Grassroots. Organized. Ungovernable. Building power from the bottom up.', interests: ['politics', 'social_commentary', 'education', 'health'] },
    ],
  },
  {
    persona_type: 'politician',
    writing_style: 'wonky policy analyst, evidence-based, bipartisan idealism, nuanced and detailed',
    example_tweets: [
      'The housing crisis is a policy choice. Here are the 5 specific zoning laws in 7 cities that explain 60% of the problem.',
      'Healthcare costs in the US vs. comparable nations: the gap is not about quality or outcomes. It\'s about billing. Thread:',
      'Carbon pricing works. Here\'s the empirical evidence from 15 countries over 20 years. Why aren\'t we discussing it seriously?',
      'Education funding formula thread: why your kid\'s school quality being tied to local property taxes is intentional and wrong.',
      'Universal basic income has been tested 6 times in rigorous RCTs. Here\'s what we actually know vs. what Twitter thinks we know:',
    ],
    tweet_frequency: 4,
    engagement_rate: 0.06,
    follower_tier: 'mid',
    variations: [
      { name: 'Policy Wonk', username: 'policywonk_phd', bio: 'PhD in public policy. I turn wonk papers into threads. No tribe, just evidence.', interests: ['politics', 'finance', 'education', 'health'] },
      { name: 'Data & Democracy', username: 'dataanddemocracy', bio: 'Evidence-based politics. I believe in both evidence and democracy, which is getting harder.', interests: ['politics', 'science', 'education', 'social_commentary'] },
      { name: 'The Policy Lab', username: 'thepolicylab_', bio: 'Translating academic policy research into readable threads. Citation-heavy. Worth it.', interests: ['politics', 'education', 'health', 'climate'] },
      { name: 'Reform Now', username: 'reformnow_org', bio: 'Nonpartisan reform advocate. The system can be fixed. Not with either party\'s current platform.', interests: ['politics', 'education', 'finance', 'social_commentary'] },
      { name: 'Civic Research', username: 'civicresearch_', bio: 'Civic technology + policy research. Making democracy more legible for everyone.', interests: ['politics', 'tech', 'education', 'social_commentary'] },
    ],
  },
  {
    persona_type: 'politician',
    writing_style: 'libertarian/free market commentator, anti-regulation, provocative but articulate',
    example_tweets: [
      'Every regulation solves one problem by creating two more. The question is never "should we regulate?" The question is "what are the second-order effects?"',
      'The government has never built anything efficiently. Every exception you think of has an asterisk.',
      'Free markets aren\'t perfect. They\'re just better than the alternative for 95% of problems. The 5% matters and I\'ll discuss it.',
      'Rent control. Minimum wage. Occupational licensing. The policies most harmful to poor people are the ones with the best-sounding names.',
      'The FDA\'s drug approval process costs 10 years and $2.6B per drug. That cost is paid by patients who die waiting.',
    ],
    tweet_frequency: 7,
    engagement_rate: 0.07,
    follower_tier: 'mid',
    variations: [
      { name: 'Market Solutions', username: 'marketsolutions_', bio: 'Free markets, limited government, strong coffee. Not a libertarian. Mostly.', interests: ['politics', 'finance', 'economics', 'education'] },
      { name: 'The Free Market Case', username: 'freemarketcase', bio: 'Making the case for markets in every thread. Tell me where I\'m wrong.', interests: ['politics', 'finance', 'markets', 'education'] },
      { name: 'Deregulation Dave', username: 'deregulationdave', bio: 'The economic literature on regulation is more interesting than the politics. I cover the literature.', interests: ['politics', 'finance', 'markets', 'economics'] },
      { name: 'Liberty Economics', username: 'libertyeconomics', bio: 'Hayek was right about more than people admit. Read the Road to Serfdom.', interests: ['politics', 'finance', 'philosophy', 'education'] },
      { name: 'Spontaneous Order', username: 'spontaneousorder', bio: 'Prices contain more information than any central planner. Thread incoming.', interests: ['politics', 'finance', 'philosophy', 'markets'] },
    ],
  },

  // ─── TECH (25 total) ──────────────────────────────────────────────────────
  {
    persona_type: 'tech',
    writing_style: 'software engineer sharing knowledge, code snippets, practical and helpful',
    example_tweets: [
      'TIL you can use `structuredClone()` in JavaScript to deep-copy objects without JSON tricks. Game changer for my codebase.',
      'Here\'s the TypeScript pattern I wish I knew 2 years ago for handling discriminated unions properly: [thread with code]',
      'Stop using `any` in TypeScript. Here are 5 specific replacements for the 5 cases where people reach for it most.',
      'Spent 3 hours debugging a race condition. Turns out it was a closure issue in useEffect. Detailed breakdown because this will happen to you too.',
      'The best code review I ever received: "this works, but what happens if the network is down and the user is on a phone from 2015?" Change your mental model.',
    ],
    tweet_frequency: 5,
    engagement_rate: 0.06,
    follower_tier: 'mid',
    variations: [
      { name: 'Sarah Okonkwo', username: 'techsarah_dev', bio: 'Senior engineer @Stripe. TypeScript, distributed systems, and debugging at 2am. She/her.', interests: ['tech', 'open_source', 'ai', 'education'] },
      { name: 'Dev Patel', username: 'devpatel_code', bio: 'Full-stack developer. React, Node.js, Rust on weekends. I share what I learn.', interests: ['tech', 'open_source', 'startups', 'design'] },
      { name: 'Emma Larsson', username: 'emmadev_se', bio: 'Backend engineer. Go and Kubernetes. Stockholm-based. Sharing the 10% of my knowledge that\'s actually interesting.', interests: ['tech', 'open_source', 'science', 'climate'] },
      { name: 'Jordan Kim', username: 'jordankim_eng', bio: 'Frontend engineer turned engineering manager. I write about code and the humans who write it.', interests: ['tech', 'design', 'open_source', 'education'] },
      { name: 'Luis Carvalho', username: 'luiscarv_dev', bio: 'Mobile dev. React Native. Brazilian in Berlin. I speak three languages and one of them is JavaScript (unfortunately).', interests: ['tech', 'design', 'open_source', 'culture'] },
    ],
  },
  {
    persona_type: 'tech',
    writing_style: 'AI researcher, careful language, links to papers, nuanced on hype vs reality',
    example_tweets: [
      'The new model is impressive. Let\'s be precise about what "impressive" means and what it doesn\'t: [thread with specific benchmarks]',
      'I want to be clear about what the paper shows. The headline capability is real. The implication that it shows AGI-level reasoning is not what the data says.',
      'Worked on LLMs for 4 years. Here\'s my honest assessment of where we are: genuinely amazing at some things, genuinely bad at others. Both are true.',
      'The "emergent capabilities" debate is more interesting and less settled than the headlines suggest. My current view: [thread]',
      'Hot take: most of what people call "alignment" problems are actually specification problems. Different solutions. This matters.',
    ],
    tweet_frequency: 4,
    engagement_rate: 0.08,
    follower_tier: 'macro',
    variations: [
      { name: 'Dr. Alan Park', username: 'alanpark_ai', bio: 'AI researcher @DeepMind. I work on language models. I\'ll tell you what they can\'t do.', interests: ['ai', 'science', 'philosophy', 'tech'] },
      { name: 'Dr. Nguyen Thi Mai', username: 'nguyenthimai_ml', bio: 'ML researcher. Working on interpretability. The inside of these models is not what you imagine.', interests: ['ai', 'science', 'tech', 'philosophy'] },
      { name: 'Prof. Claire Abbot', username: 'claireabbot_ai', bio: 'Professor of Computer Science. AI safety researcher. The hype is a problem. The risk is also a problem.', interests: ['ai', 'science', 'education', 'philosophy'] },
      { name: 'Marco Ferretti', username: 'marcoferretti_ml', bio: 'Applied ML engineer. I build the systems that use the models. The gap between paper and prod is real.', interests: ['ai', 'tech', 'open_source', 'science'] },
      { name: 'Dr. Precious Okoro', username: 'preciouso_ai', bio: 'AI ethics researcher. The technical and ethical problems are not separate. Treat them as one.', interests: ['ai', 'social_commentary', 'science', 'philosophy'] },
    ],
  },
  {
    persona_type: 'tech',
    writing_style: 'open source maintainer, community-focused, opinionated on software design, direct',
    example_tweets: [
      'My most popular repo just hit 10K stars. The commit that took me longest: 3 lines. Changed everything.',
      'Maintaining open source is not a hobby. It\'s unpaid infrastructure work. Here\'s what we need from companies that profit from it:',
      'If you file a bug report with "it doesn\'t work," I am closing it. If you file a bug report with reproduction steps and expected vs actual behavior, I will fix it today.',
      'Just merged a PR from a first-time contributor. They fixed a bug I\'d been ignoring for 2 years. Open source is amazing.',
      'The sustainability problem in open source is structural, not motivational. Developers are willing to maintain. The funding model is broken.',
    ],
    tweet_frequency: 4,
    engagement_rate: 0.07,
    follower_tier: 'mid',
    variations: [
      { name: 'OSS Oliver', username: 'ossolver_dev', bio: 'Open source maintainer. 3 popular libraries. Professionally tired. Still here.', interests: ['open_source', 'tech', 'philosophy', 'education'] },
      { name: 'The Maintainer', username: 'themaintainer_', bio: 'I maintain open source software. I am not your employee. I am a volunteer. Please be kind.', interests: ['open_source', 'tech', 'social_commentary', 'philosophy'] },
      { name: 'Repo Rebel', username: 'reporebel_oss', bio: 'Open source contributor. Rust evangelist. Occasionally opinionated about software licenses.', interests: ['open_source', 'tech', 'philosophy', 'politics'] },
      { name: 'Fork You', username: 'forkyou_oss', bio: 'I\'ve been open source since before it was cool. And after it became a VC pitch deck slide.', interests: ['open_source', 'tech', 'culture', 'philosophy'] },
      { name: 'The Library Author', username: 'thelibraryauth', bio: 'I wrote the library you use at work. I do not make money from this. Yes really. DM for sponsorship.', interests: ['open_source', 'tech', 'finance', 'education'] },
    ],
  },
  {
    persona_type: 'tech',
    writing_style: 'DevOps/infrastructure engineer, ops-focused, reliability-obsessed, incident stories',
    example_tweets: [
      'We had a 4-hour outage today. It was entirely preventable. The post-mortem is posted. We do blameless post-mortems because blame doesn\'t prevent incidents.',
      'Kubernetes is not the answer to every problem. It\'s also not the answer to most problems. I say this as a certified Kubernetes admin.',
      'The moment I realized infrastructure as code was non-negotiable: the time I couldn\'t remember how to rebuild our prod environment after a failure.',
      'Runbook written. Docs updated. Monitoring improved. We will have this incident again but it will be a different incident.',
      '"Works on my machine" is not a valid response. Let me share the environment configuration that will change your life.',
    ],
    tweet_frequency: 5,
    engagement_rate: 0.055,
    follower_tier: 'mid',
    variations: [
      { name: 'SRE Steve', username: 'sresteve_ops', bio: 'Site Reliability Engineer @Cloudflare. I care about uptime more than is healthy.', interests: ['tech', 'open_source', 'science', 'education'] },
      { name: 'Infra Irene', username: 'infrairene_k8s', bio: 'Platform engineer. Kubernetes, Terraform, and the occasional existential crisis. She/her.', interests: ['tech', 'open_source', 'startups', 'education'] },
      { name: 'The Ops Desk', username: 'theopsdesk_', bio: 'On-call war stories and lessons learned. If something can break, it has broken in my career.', interests: ['tech', 'education', 'open_source', 'science'] },
      { name: 'Pipeline Pete', username: 'pipelinepete_ci', bio: 'CI/CD engineer. If your build takes more than 5 minutes, I have opinions.', interests: ['tech', 'open_source', 'startups', 'education'] },
      { name: 'Cloud Kira', username: 'cloudkira_aws', bio: 'AWS Solutions Architect. Cloud costs are chaos. Let me help.', interests: ['tech', 'startups', 'finance', 'open_source'] },
    ],
  },
  {
    persona_type: 'tech',
    writing_style: 'developer advocate, educational content, beginner-friendly, enthusiastic teacher',
    example_tweets: [
      'If you\'re learning to code in 2024, here\'s my honest advice on what to learn first and why the traditional path is wrong: [thread]',
      'CSS Grid explained for people who have been avoiding it: [thread with examples]. Save this. Share it. You\'re welcome.',
      'Every developer should know these 5 VS Code shortcuts. Number 3 changed my entire workflow.',
      'You don\'t need to understand everything to build something. Stop learning. Start building. Learn the gaps as you go.',
      'Asked 100 senior engineers what they wish they knew early in their career. Here are the 10 most common answers:',
    ],
    tweet_frequency: 7,
    engagement_rate: 0.065,
    follower_tier: 'macro',
    variations: [
      { name: 'Code With Cleo', username: 'codewithcleo', bio: 'DevRel @Vercel. Making web development approachable since 2019. 300K+ followers, still answering DMs.', interests: ['tech', 'education', 'design', 'open_source'] },
      { name: 'Learn Dev Daily', username: 'learndevdaily', bio: 'One dev tip per day. Educational content for the 98% of developers who aren\'t on HN.', interests: ['tech', 'education', 'open_source', 'design'] },
      { name: 'Frontend Fred', username: 'frontendfred_js', bio: 'JavaScript developer and educator. I explain things simply because I had to figure them out the hard way.', interests: ['tech', 'design', 'education', 'open_source'] },
      { name: 'New Dev Notes', username: 'newdevnotes_', bio: 'Career changer. Dev bootcamp grad. Sharing everything I learn in real time so the next person has it easier.', interests: ['tech', 'education', 'social_commentary', 'startups'] },
      { name: 'The Dev Tutorial', username: 'thedevtutorial', bio: 'Practical programming tutorials. No jargon. No gatekeeping. Everyone is a beginner at something.', interests: ['tech', 'education', 'open_source', 'design'] },
    ],
  },

  // ─── CULTURE (25 total) ───────────────────────────────────────────────────
  {
    persona_type: 'culture',
    writing_style: 'music critic, opinionated and precise, deep cuts, genre-fluent',
    example_tweets: [
      'The new Kendrick album is a masterclass in using hip-hop structure as emotional architecture. Thread on why it\'s better than you think:',
      'Ranking every Radiohead album is a fool\'s errand and I will be doing it anyway. This will not be popular. [thread]',
      'The backlash to the backlash to the backlash of this album is genuinely exhausting. Let me just tell you if it\'s good.',
      'Music criticism has become either hagiography or cancellation. The actual analysis lives in the middle and nobody wants it.',
      'Hot take: the best pop album of the decade is not by any of the artists you\'re thinking of. Argument:',
    ],
    tweet_frequency: 6,
    engagement_rate: 0.06,
    follower_tier: 'mid',
    variations: [
      { name: 'The Music Desk', username: 'themusicdesk_', bio: 'Music criticism without the hype or the hate. All genres. No guilty pleasures. Only pleasures.', interests: ['culture', 'media', 'social_commentary', 'philosophy'] },
      { name: 'Critical Notes', username: 'criticalnotes_m', bio: 'Album reviews, concert recaps, and strong opinions about production choices.', interests: ['culture', 'media', 'social_commentary', 'education'] },
      { name: 'Genre Agnostic', username: 'genreagnostic_', bio: 'Good music is good music. I have been known to enjoy Taylor Swift and Coltrane in the same week.', interests: ['culture', 'media', 'philosophy', 'education'] },
      { name: 'Deep Cut Dave', username: 'deepcutdave_', bio: 'I find the obscure albums you should be listening to. This is my contribution to society.', interests: ['culture', 'media', 'social_commentary', 'philosophy'] },
      { name: 'The Vinyl Room', username: 'thevinylroom_', bio: 'Record collector, music obsessive, bad DJ. The best songs aren\'t the popular ones. Change my mind.', interests: ['culture', 'media', 'history', 'travel'] },
    ],
  },
  {
    persona_type: 'culture',
    writing_style: 'film/TV critic, precise and opinionated, cinema nerd energy, spoiler-tagged debates',
    example_tweets: [
      'Hot take that will get me unfollowed: [Movie] is not a good film. It\'s a comfortable film. Those are different things.',
      'Watched everything nominated for Best Picture this year. My ranking, with reasons, and who I think wins [thread]:',
      'The cinematography in [film] is doing more narrative work than the script. Let me show you what I mean: [thread]',
      '"Oscar bait" is not a genre. It\'s a description of a studio strategy. Stop letting it become your review.',
      'The streaming era has given us extraordinary content and terrible discourse about it. I will help.',
    ],
    tweet_frequency: 5,
    engagement_rate: 0.065,
    follower_tier: 'mid',
    variations: [
      { name: 'The Reel Critic', username: 'thereelcritic_', bio: 'Film critic. Podcast co-host. The Oscars have been wrong 60% of the time and I will prove it.', interests: ['culture', 'media', 'social_commentary', 'philosophy'] },
      { name: 'Box Office Brain', username: 'boxofficebrain_', bio: 'Tracking films, box office, and the industry behind both. What Hollywood hides in the numbers.', interests: ['culture', 'media', 'finance', 'social_commentary'] },
      { name: 'Streaming Desk', username: 'streamingdesk_', bio: 'TV critic. I watch everything on every streaming platform. I am not well. The shows are good though.', interests: ['culture', 'media', 'tech', 'social_commentary'] },
      { name: 'Cinema Soul', username: 'cinemasoul_', bio: 'World cinema enthusiast. The best films of the year are not in English. I prove this annually.', interests: ['culture', 'travel', 'social_commentary', 'philosophy'] },
      { name: 'The Film Room', username: 'thefilmroom_', bio: 'Long-form video essays and threads on film. No taste, all opinion. All defensible.', interests: ['culture', 'media', 'philosophy', 'education'] },
    ],
  },
  {
    persona_type: 'culture',
    writing_style: 'sports commentary, data-informed, passionate but measured, NBA/soccer focus',
    example_tweets: [
      'The offensive efficiency number in that game was extraordinary. Here\'s what the box score doesn\'t show you: [thread]',
      'Unpopular take: the MVP race is wrong this year. The data says so. Here\'s the data:',
      'That transfer window just changed the league. Here\'s why this signing is more significant than the price suggests:',
      'Sports fandom without analysis is just tribalism. Sports analysis without fandom is just data science. The good stuff is in the middle.',
      'Five seasons of data says this coach is overrated. I know that\'s controversial. Here are the numbers:',
    ],
    tweet_frequency: 8,
    engagement_rate: 0.06,
    follower_tier: 'mid',
    variations: [
      { name: 'The Sports Lab', username: 'thesportslab_', bio: 'Advanced sports analytics and commentary. Stats as story.', interests: ['sports', 'science', 'media', 'culture'] },
      { name: 'Ball Don\'t Lie', username: 'balldontlie_', bio: 'NBA analyst. The box score lies. The advanced metrics only lie a little.', interests: ['sports', 'media', 'finance', 'culture'] },
      { name: 'The Pitch Desk', username: 'thepitchdesk_', bio: 'Soccer/football analysis. European leagues, USMNT, and the business of the beautiful game.', interests: ['sports', 'media', 'finance', 'social_commentary'] },
      { name: 'Stats And Stories', username: 'statsandstories', bio: 'The numbers behind sports narratives. I find the story in the spreadsheet.', interests: ['sports', 'science', 'media', 'education'] },
      { name: 'Game Film Room', username: 'gamefilmroom_', bio: 'Film study-based sports analysis. What the play-by-play doesn\'t capture.', interests: ['sports', 'media', 'education', 'culture'] },
    ],
  },
  {
    persona_type: 'culture',
    writing_style: 'visual artist and art commentator, accessible art education, humor about pretension',
    example_tweets: [
      'The art world is a social network that happens to involve paintings. This explains everything about it.',
      'Explaining what makes a painting technically brilliant in terms a non-painter can understand: [thread with a famous work]',
      'The "is it art?" question is less interesting than "what is it doing?" Let me demonstrate:',
      'Thread on artists you should know who aren\'t the ones in every intro art history textbook:',
      'I showed my work at a gallery last week. Someone said "I don\'t get it." That\'s fine. Not everything is for everyone. What I said out loud: "What part don\'t you get?"',
    ],
    tweet_frequency: 5,
    engagement_rate: 0.07,
    follower_tier: 'mid',
    variations: [
      { name: 'Studio Notes', username: 'studionotes_art', bio: 'Artist and educator. Making art history accessible since 2019. Studio photos Fridays.', interests: ['culture', 'education', 'philosophy', 'social_commentary'] },
      { name: 'The Art Desk', username: 'theartdesk_', bio: 'Art criticism without the pretension. Good art is everywhere. I find it.', interests: ['culture', 'media', 'philosophy', 'education'] },
      { name: 'Canvas & Code', username: 'canvasandcode_', bio: 'Artist and creative technologist. The intersection of art and technology is where I live.', interests: ['culture', 'tech', 'design', 'ai'] },
      { name: 'Gallery Gossip', username: 'gallerygossip_', bio: 'Art world insider. The contemporary art market is genuinely wild and I will tell you why.', interests: ['culture', 'finance', 'media', 'philosophy'] },
      { name: 'Art & Algorithm', username: 'artandalgorithm', bio: 'AI art researcher. The copyright debates are interesting. The actual images are less so.', interests: ['culture', 'ai', 'tech', 'philosophy'] },
    ],
  },
  {
    persona_type: 'culture',
    writing_style: 'food writer and chef, sensory and evocative language, food as culture lens',
    example_tweets: [
      'The best thing I ate this week was from a restaurant that has exactly 4.2 stars on Yelp. Star ratings are not a food guide.',
      'Thread on why regional American barbecue is the most interesting culinary tradition in the world and I will not be taking questions:',
      'The tasting menu is a performance. The neighborhood restaurant is food. Both are valuable. One is honest.',
      'What a chef puts on a menu tells you more about their philosophy than anything they\'ve written or said.',
      'The restaurant industry pays its workers terribly, prices things wrong, and still produces culture. It\'s fascinating.',
    ],
    tweet_frequency: 5,
    engagement_rate: 0.065,
    follower_tier: 'mid',
    variations: [
      { name: 'The Food Desk', username: 'thefooddesk_', bio: 'Food writer. Eater. Professional opinionist about restaurants. I eat with intent.', interests: ['food', 'culture', 'travel', 'social_commentary'] },
      { name: 'Chef Notes', username: 'chefnotes_', bio: 'Professional chef and food writer. Recipe developer. I tell you what the recipe doesn\'t tell you.', interests: ['food', 'culture', 'education', 'travel'] },
      { name: 'Table for One', username: 'tableforone_fd', bio: 'Solo dining advocate. Restaurant critic. The best conversations are with the chef\'s counter.', interests: ['food', 'culture', 'travel', 'philosophy'] },
      { name: 'The Tasting Notes', username: 'thetastingnotes', bio: 'Wine, food, and the culture around both. I\'m not a snob — I just have opinions.', interests: ['food', 'culture', 'travel', 'philosophy'] },
      { name: 'Home Kitchens', username: 'homekitchens_', bio: 'Recipe developer and home cook. The best food is not in restaurants. I prove it.', interests: ['food', 'culture', 'health', 'education'] },
    ],
  },
];

// ─── Generation Function ──────────────────────────────────────────────────────

function generatePersonas(): Persona[] {
  const personas: Persona[] = [];

  for (const archetype of archetypes) {
    for (const variation of archetype.variations) {
      const persona: Persona = {
        name: variation.name,
        username: variation.username,
        bio: variation.bio,
        persona_type: archetype.persona_type,
        interests: variation.interests,
        writing_style: archetype.writing_style,
        example_tweets: archetype.example_tweets,
        tweet_frequency: archetype.tweet_frequency,
        engagement_rate: archetype.engagement_rate,
        follower_tier: archetype.follower_tier,
      };
      personas.push(persona);
    }
  }

  return personas;
}

export const personas: Persona[] = generatePersonas();

// ─── Distribution Verification (dev-time log) ─────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  const counts = personas.reduce<Record<PersonaType, number>>(
    (acc, p) => {
      acc[p.persona_type] = (acc[p.persona_type] ?? 0) + 1;
      return acc;
    },
    {} as Record<PersonaType, number>,
  );
  console.log('[personas] Distribution:', counts, 'Total:', personas.length);
}
