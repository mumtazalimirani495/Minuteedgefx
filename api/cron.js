
import axios from 'axios';

export default async function handler(req, res) {
  try {
    // Fetch latest candle from Twelve Data
    const response = await axios.get('https://api.twelvedata.com/time_series', {
      params: {
        symbol: 'EUR/USD',     // Replace with your symbol if different
        interval: '1min',
        outputsize: 1,
        apikey: process.env.TWELVE_API_KEY
      }
    });

    const candle = response.data.values?.[0];
    if (!candle) {
      return res.status(500).json({ error: 'No candle data found' });
    }

    const close = parseFloat(candle.close);

    // Your custom signal logic
    const level_used = 1.0920;  // Replace with your actual strategy level
    const isSignal = close >= level_used;

    // If signal condition is met, save to Supabase
    if (isSignal) {
      await axios.post(`${process.env.SUPABASE_URL}/rest/v1/signals`, {
        level_used,
        candle_data: candle
      }, {
        headers: {
          apikey: process.env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        }
      });
    }

    return res.status(200).json({ success: true, isSignal });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
