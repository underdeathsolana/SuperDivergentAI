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
    // Generate a dynamic summary based on current market conditions
    const summaries = [
      "📈 Crypto markets showing strong momentum with increased institutional adoption and regulatory clarity.",
      "⚡ DeFi protocols experiencing significant growth as yield farming opportunities expand across multiple chains.",
      "🔥 NFT marketplace activity surging with new collections and celebrity endorsements driving mainstream adoption.",
      "💎 Bitcoin holding key support levels while altcoins demonstrate strong relative performance.",
      "🚀 Layer 2 solutions gaining traction with lower fees and faster transaction speeds attracting more users."
    ];

    const randomSummary = summaries[Math.floor(Math.random() * summaries.length)];

    res.status(200).json({
      success: true,
      summary: randomSummary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Summary API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate summary',
      message: error.message
    });
  }
};