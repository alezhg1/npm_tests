// server.js
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

// Загружаем переменные окружения из .env.local или .env
dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Увеличиваем лимит для картинок Base64

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log(`✅ Local API Server starting on http://localhost:${PORT}`);

// --- 1. QUIZZES ---
app.all('/api/quizzes', async (req, res) => {
  try {
    if (req.method === 'GET') {
      const { code, id } = req.query;
      let query = supabase.from('quizzes').select('*');
      
      if (code) query = query.eq('join_code', code);
      else if (id) query = query.eq('id', id);
      else return res.status(400).json({ error: 'Provide code or id' });
      
      const { data, error } = await query.single();
      if (error) throw error;
      return res.json(data);
    } 
    else if (req.method === 'POST') {
      const { data, error } = await supabase.from('quizzes').insert([req.body]).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- 2. PARTICIPANTS ---
app.all('/api/participants', async (req, res) => {
  try {
    if (req.method === 'GET') {
      const { quizId } = req.query;
      if (!quizId) return res.status(400).json({ error: 'Missing quizId' });
      
      const { data, error } = await supabase
        .from('quiz_participants')
        .select('*')
        .eq('quiz_id', quizId)
        .order('joined_at', { ascending: true }); // Убедись, что колонка joined_at существует, иначе убери .order()
        
      if (error) throw error;
      return res.json(data);
    } 
    
    else if (req.method === 'POST') {
      const { quiz_id, student_name, score } = req.body;
      
      if (!quiz_id || !student_name) {
        return res.status(400).json({ error: 'Missing quiz_id or student_name' });
      }

      // Формируем объект для вставки. Не передаем id и joined_at, если они автогенерируются в БД
      const participantData = {
        quiz_id: quiz_id,
        student_name: student_name,
        score: score !== undefined ? score : 0
      };

      console.log('💾 Inserting participant:', participantData);

      const { data, error } = await supabase
        .from('quiz_participants')
        .insert([participantData])
        .select()
        .single();
        
      if (error) {
        console.error('❌ Supabase Error:', error);
        return res.status(500).json({ error: error.message, details: error.details });
      }
      
      return res.status(201).json(data);
    }
  } catch (err) {
    console.error('🔥 Server Error in /api/participants:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- 3. QUESTIONS ---
app.all('/api/questions', async (req, res) => {
  try {
    if (req.method === 'POST') {
      const { data, error } = await supabase.from('questions').insert([req.body]).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    } else if (req.method === 'GET') {
       const { quizId } = req.query;
       const { data, error } = await supabase.from('questions').select('*').eq('quiz_id', quizId).order('order_index');
       if (error) throw error;
       return res.json(data);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 4. ANSWERS ---
app.all('/api/answers', async (req, res) => {
  try {
    if (req.method === 'GET') {
      const { quizId } = req.query;
      // Сначала получаем ID участников
      const {  participants } = await supabase.from('quiz_participants').select('id').eq('quiz_id', quizId);
      const ids = participants ? participants.map(p => p.id) : [];
      
      if (!ids.length) return res.json([]);
      
      const { data, error } = await supabase.from('answers').select('*').in('participant_id', ids);
      if (error) throw error;
      return res.json(data);
    } else if (req.method === 'POST') {
      const { data, error } = await supabase.from('answers').insert([req.body]).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 5. UPLOAD IMAGE ---
app.post('/api/upload-image', async (req, res) => {
  try {
    const { base64Image, fileName, quizId } = req.body;
    
    // Удаляем префикс data:image/...
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    const filePath = `${quizId}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('quiz-images')
      .upload(filePath, buffer, { upsert: false });
      
    if (uploadError) throw uploadError;

    const {   data } = supabase.storage.from('quiz-images').getPublicUrl(filePath);
    res.json({ url: data.publicUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});