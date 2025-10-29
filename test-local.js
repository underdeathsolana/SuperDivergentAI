const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Import API functions
const newsAPI = require('./api/news');
const summaryAPI = require('./api/summary');

// Serve static files from web directory
app.use(express.static(path.join(__dirname, 'web')));

// API routes
app.get('/api/news', newsAPI);
app.get('/api/summary', summaryAPI);

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'web', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📰 News API: http://localhost:${PORT}/api/news`);
    console.log(`📊 Summary API: http://localhost:${PORT}/api/summary`);
    console.log(`🌐 Main App: http://localhost:${PORT}`);
});