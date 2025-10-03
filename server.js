const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors({ origin: '*' }));
app.use(express.json());

const BINANCE_API = 'https://api.binance.com';

function createSignature(queryString, apiSecret) {
  return crypto.createHmac('sha256', apiSecret).update(queryString).digest('hex');
}

function buildQuery(params) {
  return Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`).join('&');
}

app.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    message: '🔥 Super Trading Backend v1.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/ping', async (req, res) => {
  try {
    await axios.get(`${BINANCE_API}/api/v3/ping`);
    res.json({ success: true, message: 'Binance Online' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/balance', async (req, res) => {
  try {
    const { apiKey, apiSecret, asset } = req.body;
    const timestamp = Date.now();
    const params = { timestamp, recvWindow: 60000 };
    const queryString = buildQuery(params);
    const signature = createSignature(queryString, apiSecret);

    const response = await axios.get(
      `${BINANCE_API}/api/v3/account?${queryString}&signature=${signature}`,
      { headers: { 'X-MBX-APIKEY': apiKey } }
    );

    const balance = response.data.balances.find(b => b.asset === asset);
    res.json({
      success: true,
      balance: balance ? {
        asset,
        free: parseFloat(balance.free),
        locked: parseFloat(balance.locked),
        total: parseFloat(balance.free) + parseFloat(balance.locked)
      } : { asset, free: 0, locked: 0, total: 0 }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.response?.data?.msg || error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔥 Super Trading Backend online - Porta ${PORT}`);
});
