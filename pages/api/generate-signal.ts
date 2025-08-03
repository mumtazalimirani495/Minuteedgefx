import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const endsInFiveOrZero = (price: number): boolean => {
  const p = price.toFixed(5);
  const last = p.charAt(p.length - 1);
  return last === "0" || last === "5";
};

const FOREX_PAIRS = ['CAD/JPY', 'EUR/USD', 'EUR/GBP'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    for (const pair of FOREX_PAIRS) {
      const symbol = pair.replace("/", "");
      const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1min&outputsize=2&apikey=${process.env.TWELVE_API_KEY}`;
      const { data } = await axios.get(url);
      if (!data?.values || data?.status === "error") continue;

      const [curr, prev] = data.values.map((c: any) => ({
        open: parseFloat(c.open),
        high: parseFloat(c.high),
        low: parseFloat(c.low),
        close: parseFloat(c.close),
        timestamp: c.datetime,
      }));

      const isGreen = curr.close > curr.open;
      const isRed = curr.close < curr.open;
      const prevOpen = prev.open;

      const signal: any = {
        pair,
        direction: null,
        confidence: null,
        type: null,
        close_price: curr.close,
        level_used: null,
        timestamp: curr.timestamp,
        candle_data: curr,
      };

      const wickOK = isGreen
        ? curr.low > prevOpen
          ? 100
          : curr.low === prevOpen
          ? 50
          : 0
        : isRed
        ? curr.high < prevOpen
          ? 100
          : curr.high === prevOpen
          ? 50
          : 0
        : 0;

      if ((isGreen && curr.close > prev.close) || (isRed && curr.close < prev.close)) {
        if (endsInFiveOrZero(curr.close) && wickOK > 0) {
          signal.direction = isGreen ? "CALL" : "PUT";
          signal.type = "continuation";
          signal.confidence = wickOK;
          signal.level_used = curr.close;
        }
      } else if (curr.close === prev.close && endsInFiveOrZero(curr.close)) {
        const revOK = isGreen ? curr.low <= prevOpen : curr.high >= prevOpen;
        if (revOK) {
          signal.direction = isGreen ? "CALL" : "PUT";
          signal.type = "reversal";
          signal.confidence = 100;
          signal.level_used = curr.close;
        }
      }

      if (signal.direction) {
        await supabase.from('signals').insert([signal]);
      }
    }

    res.status(200).json({ message: "Signals generated." });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
}
