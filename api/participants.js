// api/participants.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Missing Supabase credentials' });
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // GET: Получить всех участников квиза (для мониторинга)
  if (req.method === 'GET') {
    const { quizId } = req.query;

    if (!quizId) {
      return res.status(400).json({ error: 'quizId required' });
    }

    const { data, error } = await supabase
      .from('quiz_participants')
      .select('*')
      .eq('quiz_id', quizId)
      .order('joined_at', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  }

  // POST: Добавить участника (вход ученика)
  else if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      const { quiz_id, student_name, score } = body;

      if (!quiz_id || !student_name) {
        return res.status(400).json({ error: 'Missing quiz_id or student_name' });
      }

      const participantData = {
        quiz_id: quiz_id,
        student_name: student_name,
        score: score !== undefined ? score : 0
      };

      console.log('💾 [API] Inserting participant:', participantData);

      const { data, error } = await supabase
        .from('quiz_participants')
        .insert([participantData])
        .select()
        .single();

      if (error) {
        console.error('❌ [API] Supabase Error:', error);
        
        // Обработка дубликатов
        if (error.code === '23505' || error.message.includes('Duplicate')) {
          return res.status(409).json({ error: 'Participant already exists', details: error.details });
        }
        
        return res.status(500).json({ error: error.message, details: error.details });
      }

      console.log('✅ [API] Participant created:', data.id);
      return res.status(201).json(data);
      
    } catch (err) {
      console.error('🔥 [API] Server Error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
