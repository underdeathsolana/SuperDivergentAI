const path = require('path');
const express = require('express');
const { createServer } = require('http');
const WebSocket = require('ws');
const { initNewsFetcher, getNews, getMeta } = require('./newsFetcher');

const PORT = process.env.PORT || 3000;
const app = express();

// Serve web front-end
app.use(express.static(path.join(__dirname, '..', 'web')));
// Also expose stocks directory for logo usage
app.use('/stocks', express.static(path.join(__dirname, '..', 'stocks')));

app.get('/api/news', (req, res) => {
  res.json({ news: getNews(), meta: getMeta() });
});

// Simple extractive summary endpoint (stub)
app.get('/api/summary', (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: 'id required' });
  const item = getNews().find(n => n.id === id);
  if (!item) return res.status(404).json({ error: 'not found' });
  // naive summary: title + first 160 chars of summary
  const summary = `${item.title} - ${(item.summary || '').slice(0,160)}${item.summary && item.summary.length>160?'…':''}`;
  res.json({ id, summary });
});

const server = createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

function broadcast(type, payload) {
  const msg = JSON.stringify({ type, payload });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

wss.on('connection', (socket) => {
  // Send current cache immediately with meta
  socket.send(JSON.stringify({ type: 'init', payload: { news: getNews(), meta: getMeta() } }));
});

// Initialize periodic news fetcher
initNewsFetcher(
  (newItems) => {
    if (newItems.length) broadcast('news', newItems);
  },
  (meta) => {
    broadcast('meta', meta);
  }
);

server.listen(PORT, () => {
  console.log(`Crypto News Live server running on http://localhost:${PORT}`);
});
