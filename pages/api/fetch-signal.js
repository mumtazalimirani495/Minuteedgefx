import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    const response = await fetch(`https://api.twelvedata.com/time_series?symbol=EUR/USD&interval=1min&apikey=${process.env.TWELVE_API_KEY}`);
    const data = await response.json();

    if (!data || !data.values || data.values.length === 0) {
      return res.status(400).json({ error: 'No candle data' });
    }

    const candle = data.values[0];
    const levelUsed = parseFloat(candle.close);

    const { error } = await supabase.from('signals').insert([
      {
        level_used: levelUsed,
        candle_data: candle
      }
    ]);

    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Supabase insert failed' });
    }

    return res.status(200).json({ message: 'Inserted successfully' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Unexpected error' });
  }
}
