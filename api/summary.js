const { initNewsFetcher, getNews } = require('./newsFetcher');

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
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'id required' });
    }
    
    try {
      // Initialize on first request
      if (!isInitialized) {
        initNewsFetcher(() => {}, () => {});
        isInitialized = true;
        // Give it a moment to fetch initial data
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      const item = getNews().find(n => n.id === id);
      
      if (!item) {
        return res.status(404).json({ error: 'not found' });
      }
      
      // naive summary: title + first 160 chars of summary
      const summary = `${item.title} - ${(item.summary || '').slice(0,160)}${item.summary && item.summary.length>160?'…':''}`;
      
      return res.status(200).json({ id, summary });
    } catch (error) {
      console.error('Error generating summary:', error);
      return res.status(500).json({ error: 'Failed to generate summary' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}