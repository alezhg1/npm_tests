// api/upload-image.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Разрешаем только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Или SERVICE_ROLE_KEY, если есть проблемы с правами

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Missing Supabase credentials' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = JSON.parse(req.body);
    const { base64Image, fileName, quizId } = body;

    if (!base64Image || !fileName || !quizId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Удаляем префикс data:image/png;base64, если он есть
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    
    // Декодируем Base64 в Buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Формируем путь в Storage
    const filePath = `${quizId}/${fileName}`;

    // Загружаем в Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('quiz-images')
      .upload(filePath, buffer, {
        contentType: 'image/png', // Можно определить динамически, но png/jpeg самые частые
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase Upload Error:', uploadError);
      return res.status(500).json({ error: uploadError.message });
    }

    // Получаем публичный URL
    const {   data } = supabase.storage.from('quiz-images').getPublicUrl(filePath);

    if (!data || !data.publicUrl) {
      return res.status(500).json({ error: 'Failed to get public URL' });
    }

    return res.status(200).json({ url: data.publicUrl });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}