// api/questions.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // POST: Сохранить вопрос
  if (req.method === 'POST') {
    const body = JSON.parse(req.body);
    
    const { data, error } = await supabase
      .from('questions')
      .insert([body])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json(data);
  }

  // GET: Получить вопросы для квиза (если нужно)
  if (req.method === 'GET') {
     const { quizId } = req.query;
     if (!quizId) return res.status(400).json({ error: 'quizId required' });

     const { data, error } = await supabase
       .from('questions')
       .select('*')
       .eq('quiz_id', quizId)
       .order('order_index', { ascending: true });

     if (error) return res.status(500).json({ error: error.message });
     return res.status(200).json(data);
  }

  else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}