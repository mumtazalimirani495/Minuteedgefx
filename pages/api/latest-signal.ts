import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { data, error } = await supabase
      .from('signals')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1);

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      res.status(200).json(data[0]);
    } else {
      res.status(404).json({ message: 'No signals found.' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
