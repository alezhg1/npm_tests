// api/quizzes.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Missing Supabase credentials' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // GET: Получить квиз по коду или ID
  if (req.method === 'GET') {
    const { code, id } = req.query;
    
    let query = supabase.from('quizzes').select('*');
    
    if (code) {
      query = query.eq('join_code', code);
    } else if (id) {
      query = query.eq('id', id);
    } else {
      return res.status(400).json({ error: 'Provide code or id' });
    }

    // Если ищем по коду, он должен быть уникальным, поэтому .single()
    // Если по ID, тоже .single()
    const { data, error } = await query.single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    return res.status(200).json(data);
  } 
  
  // POST: Создать новый квиз
  else if (req.method === 'POST') {
    const body = JSON.parse(req.body);
    
    const { data, error } = await supabase
      .from('quizzes')
      .insert([body])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json(data);
  } 
  
  else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}