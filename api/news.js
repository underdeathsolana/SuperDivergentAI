const { initNewsFetcher, getNews, getMeta } = require('./newsFetcher');

// Initialize news fetcher on first load
let isInitialized = false;

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      // Initialize on first request
      if (!isInitialized) {
        initNewsFetcher(() => {}, () => {});
        isInitialized = true;
        // Give it a moment to fetch initial data
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      const newsData = { news: getNews(), meta: getMeta() };
      return res.status(200).json(newsData);
    } catch (error) {
      console.error('Error fetching news:', error);
      return res.status(500).json({ error: 'Failed to fetch news' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}