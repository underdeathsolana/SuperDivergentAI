const Parser = require('rss-parser');

const parser = new Parser({
  customFields: {
    item: ['media:content', 'media:thumbnail']
  }
});

// RSS feeds for crypto news
const RSS_FEEDS = [
  'https://cointelegraph.com/rss',
  'https://decrypt.co/feed',
  'https://www.coindesk.com/arc/outboundfeeds/rss/',
  'https://bitcoinmagazine.com/.rss/full/',
  'https://cryptonews.com/news/feed/'
];

async function fetchFromFeed(url) {
  try {
    const feed = await parser.parseURL(url);
    return feed.items.slice(0, 10).map(item => ({
      title: item.title,
      link: item.link,
      description: item.contentSnippet || item.description,
      publishDate: item.pubDate,
      source: feed.title
    }));
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    return [];
  }
}

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const allPromises = RSS_FEEDS.map(fetchFromFeed);
    const results = await Promise.all(allPromises);
    
    const allNews = results.flat()
      .filter(item => item.title)
      .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
      .slice(0, 50);

    res.status(200).json({
      success: true,
      news: allNews,
      meta: {
        total: allNews.length,
        lastUpdated: new Date().toISOString(),
        sources: RSS_FEEDS.length
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news',
      message: error.message
    });
  }
};