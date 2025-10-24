const Parser = require('rss-parser');
const parser = new Parser();

// List of RSS feeds for crypto news. Can be extended via environment variable.
const FEEDS = [
  { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
  { name: 'CoinTelegraph', url: 'https://cointelegraph.com/rss' },
  { name: 'Bitcoin.com', url: 'https://news.bitcoin.com/feed/' },
  { name: 'Decrypt', url: 'https://decrypt.co/feed' },
  { name: 'CryptoSlate', url: 'https://cryptoslate.com/feed/' },
  { name: 'Bitcoinist', url: 'https://bitcoinist.com/feed/' },
  { name: 'NewsBTC', url: 'https://www.newsbtc.com/feed/' },
  { name: 'BeInCrypto', url: 'https://beincrypto.com/feed/' },
  { name: 'CryptoPotato', url: 'https://cryptopotato.com/feed/' },
  { name: 'CoinGape', url: 'https://coingape.com/feed/' },
  { name: 'UToday', url: 'https://u.today/rss' },
  { name: 'Blockworks', url: 'https://blockworks.co/feed' },
  { name: 'The Block', url: 'https://www.theblockcrypto.com/rss.xml' },
  { name: 'CryptoBriefing', url: 'https://cryptobriefing.com/feed/' }
];

let cache = []; // store latest articles augmented with sentiment & categories
let guidSet = new Set();

// Keyword sets for lightweight NLP style enrichment
const POSITIVE = ['surge','rally','gain','gains','bullish','adoption','upgrade','institutional','etf approval','breakout','record','all-time high','partnership','integration'];
const NEGATIVE = ['hack','exploit','exploded','drop','crash','plunge','bearish','lawsuit','ban','regulation','regulatory crackdown','fraud','liquidation','liquidations','attack'];

const CATEGORY_KEYWORDS = {
  regulation: ['sec','regulation','regulatory','law','compliance','license','ban'],
  hack: ['hack','exploit','attack','breach','drain'],
  defi: ['defi','dex','liquidity pool','yield','staking','amm'],
  nft: ['nft','nfts','metaverse','collectible','opensea'],
  layer2: ['layer2','optimistic','zk','rollup','arbitrum','optimism','polygon','zkSync','starknet'],
  etf: ['etf','exchange-traded fund'],
  adoption: ['adoption','integration','payment','merchant','onboard'],
  mining: ['mining','hashrate','miner','difficulty'],
  stablecoin: ['stablecoin','usdt','usdc','algorithmic'],
  exchange: ['exchange','listing','delist','cz','coinbase','binance','kraken']
};

function computeSentiment(text) {
  const lower = text.toLowerCase();
  let score = 0;
  POSITIVE.forEach(k=> { if (lower.includes(k)) score += 1; });
  NEGATIVE.forEach(k=> { if (lower.includes(k)) score -= 1; });
  if (score > 0) return 'bullish';
  if (score < 0) return 'bearish';
  return 'neutral';
}

function computeCategories(text) {
  const lower = text.toLowerCase();
  const cats = [];
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
    if (words.some(w => lower.includes(w))) cats.push(cat);
  }
  return cats;
}

function normalizeItem(sourceName, item) {
  const title = item.title || '';
  const summary = item.contentSnippet || '';
  const textCombined = `${title} ${summary}`;
  return {
    id: item.guid || item.id || item.link,
    title,
    link: item.link,
    source: sourceName,
    published: item.isoDate || item.pubDate || null,
    summary,
    sentiment: computeSentiment(textCombined),
    categories: computeCategories(textCombined)
  };
}

async function fetchFeed(feed) {
  try {
    const parsed = await parser.parseURL(feed.url);
    return parsed.items.map(i => normalizeItem(feed.name, i));
  } catch (err) {
    console.error('Failed to fetch feed', feed.name, err.message);
    return [];
  }
}

function computeMeta() {
  // Trending words (simple frequency excluding common stop words)
  const stop = new Set(['the','a','an','and','or','but','is','in','on','at','to','for','of','with','by','from','as','this','that','it','are','was','be','been','has','have','will','can','news','crypto','cryptocurrency']);
  const wordFreq = {};
  const categoryFreq = {};
  const sourceStats = {};
  const now = Date.now();
  cache.forEach(item => {
    sourceStats[item.source] = (sourceStats[item.source] || 0) + 1;
    item.categories.forEach(c => categoryFreq[c] = (categoryFreq[c] || 0) + 1);
    const text = (item.title + ' ' + item.summary).toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    text.forEach(w => { if(!stop.has(w)) wordFreq[w] = (wordFreq[w] || 0) + 1; });
  });
  const trending = Object.entries(wordFreq).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([word,count])=>({word,count}));
  const categories = Object.entries(categoryFreq).sort((a,b)=>b[1]-a[1]).map(([category,count])=>({category,count}));
  // Heatmap hour distribution (0-23)
  const hours = Array(24).fill(0);
  cache.forEach(item => { if (item.published) { const h = new Date(item.published).getHours(); hours[h]++; } });
  return { trending, categories, sourceStats, hours, generatedAt: now };
}

let lastMeta = { trending: [], categories: [], sourceStats: {}, hours: [], generatedAt: Date.now() };

async function pollOnce(onNewItems, onMeta) {
  const all = (await Promise.all(FEEDS.map(fetchFeed))).flat();
  const newOnes = [];
  for (const item of all) {
    if (!guidSet.has(item.id)) {
      guidSet.add(item.id);
      newOnes.push(item);
      cache.push(item);
    }
  }
  if (cache.length > 300) cache = cache.slice(-300); // slightly larger now
  if (newOnes.length && typeof onNewItems === 'function') {
    onNewItems(newOnes);
  }
  // Recompute meta every poll (or if first time)
  lastMeta = computeMeta();
  if (typeof onMeta === 'function') onMeta(lastMeta);
  return { newOnes, meta: lastMeta };
}

function initNewsFetcher(onNewItems, onMeta, intervalMs = 5 * 60 * 1000) {
  pollOnce(onNewItems, onMeta).catch(e => console.error('Initial poll error', e));
  const handle = setInterval(() => {
    pollOnce(onNewItems, onMeta).catch(e => console.error('Poll error', e));
  }, intervalMs);
  return () => clearInterval(handle);
}

function getNews() {
  return cache.slice().sort((a, b) => new Date(b.published || 0) - new Date(a.published || 0));
}

function getMeta() {
  return lastMeta;
}

module.exports = { initNewsFetcher, getNews, getMeta };
