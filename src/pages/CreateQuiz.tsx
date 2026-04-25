// src/pages/CreateQuiz.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type Question = {
  text: string;
  image: File | null;
  correctAnswer: string;
};

export default function CreateQuiz() {
  // Состояния формы
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    { text: '', image: null, correctAnswer: '' }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<any>(null);

  const addQuestion = () => {
    setQuestions([...questions, { text: '', image: null, correctAnswer: '' }]);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const generateJoinCode = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleSaveQuiz = async () => {
    if (!title.trim()) return alert('Введите название квиза!');
    
    setIsSaving(true);
    console.log('🚀 Start saving quiz...');

    try {
      // 1. Создаем запись о квизе
      const code = generateJoinCode();
      console.log('1️⃣ Generated Code:', code);
      
      const response = await supabase
        .from('quizzes')
        .insert({
          title: title,
          join_code: code,
          status: 'waiting',
          teacher_id: null 
        })
        .select()
        .single();

      const createdQuiz = response.data;
      const quizError = response.error;

      if (quizError) throw quizError;
      if (!createdQuiz || !createdQuiz.id) throw new Error('Квиз создан, но ID не получен.');

      console.log('2️⃣ Quiz Created ID:', createdQuiz.id);
      setQuizData(createdQuiz);

      // 2. Проходим по всем вопросам и сохраняем их
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        let imageUrl = '';

        // Если есть картинка, загружаем её в Storage
        if (q.image) {
          console.log(`3️⃣ Uploading image for question ${i + 1}...`);
          const fileExt = q.image.name.split('.').pop();
          const fileName = `${createdQuiz.id}/${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('quiz-images')
            .upload(fileName, q.image);

          if (uploadError) {
            console.error('Upload Error:', uploadError);
            throw new Error(`Ошибка загрузки фото: ${uploadError.message}`);
          }
          console.log('4️⃣ Image Uploaded');

          // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
          // Получаем публичный URL. В новых версиях supabase-js ответ: { data: { publicUrl: string } }
          const {  data } = supabase.storage.from('quiz-images').getPublicUrl(fileName);
          
          if (!data || !data.publicUrl) {
             console.error('Failed to get public URL. Response:', data);
             throw new Error('Не удалось получить ссылку на изображение. Проверьте, что ведро "quiz-images" публичное в настройках Supabase Storage.');
          }
          
          imageUrl = data.publicUrl;
          console.log('5️⃣ Image URL:', imageUrl);
        }

        // Сохраняем вопрос в базу
        console.log(`6️⃣ Saving question ${i + 1} to DB...`);
        const { error: questionError } = await supabase
          .from('questions')
          .insert({
            quiz_id: createdQuiz.id,
            question_text: q.text,
            image_url: imageUrl,
            correct_answer: q.correctAnswer,
            order_index: i
          });

        if (questionError) {
          console.error('Question Save Error:', questionError);
          throw new Error(`Ошибка сохранения вопроса: ${questionError.message}`);
        }
        console.log('7️⃣ Question Saved');
      }

      console.log('✅ All done!');
      setJoinCode(code);
      
    } catch (error: any) {
      console.error('❌ Final Error:', error);
      alert(`Ошибка: ${error.message}. Проверьте консоль (F12) для деталей.`);
    } finally {
      setIsSaving(false);
      console.log('🏁 Saving process finished.');
    }
  };

  // Экран успешного создания
  if (joinCode && quizData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative">
        {/* Версия */}
        <div className="fixed top-6 left-6 z-50 text-white/30 text-xs font-mono tracking-widest pointer-events-none select-none">
          v0.1.0
        </div>

        {/* Фон */}
        <div className="fixed inset-0 z-0">
          <img 
            src="/main_back.png" 
            alt="Background" 
            className="w-full h-full object-cover opacity-80 contrast-125 brightness-110 saturate-110"
          />
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-purple-500/10 rounded-full blur-[180px] pointer-events-none mix-blend-screen"></div>
        </div>

        <div className="glass-panel p-8 md:p-12 max-w-md w-full text-center relative z-10 animate-fade-in-up">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          
          <h2 className="text-3xl font-bold mb-2 text-white drop-shadow-lg">Квиз создан!</h2>
          <p className="text-gray-400 mb-8">Ученики могут войти по этому коду:</p>
          
          <div className="bg-black/50 border-2 border-dashed border-white/20 rounded-xl py-6 px-4 mb-8 group hover:border-white/40 transition-colors">
            <span className="text-5xl font-mono font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              {joinCode}
            </span>
          </div>
          
          <div className="space-y-3">
            <Link 
              to={`/teacher/monitor/${quizData.id}`} 
              className="block w-full bg-white text-black font-bold py-4 rounded-lg hover:bg-gray-200 transition-all duration-300 shadow-lg hover:shadow-white/20 btn-press"
            >
              👁️ Следить за квизом (Realtime)
            </Link>
            <Link to="/" className="block w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-4 rounded-lg transition-all duration-300 btn-press">
              На главную
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Форма создания
  return (
    <div className="min-h-screen bg-black relative p-6 pb-20">
      {/* Версия */}
      <div className="fixed top-6 left-6 z-50 text-white/30 text-xs font-mono tracking-widest pointer-events-none select-none">
        v0.1.0
      </div>

      {/* Фон */}
      <div className="fixed inset-0 z-0">
        <img 
          src="/main_back.png" 
          alt="Background" 
          className="w-full h-full object-cover opacity-80 contrast-125 brightness-110 saturate-110"
        />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-purple-500/10 rounded-full blur-[180px] pointer-events-none mix-blend-screen"></div>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto animate-fade-in-up">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold drop-shadow-lg">Новый квиз</h1>
            <p className="text-gray-400 text-sm mt-1">Заполните информацию для создания теста</p>
          </div>
          <Link to="/" className="text-gray-500 hover:text-white flex items-center gap-2 transition-colors btn-press">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Отмена
          </Link>
        </div>

        <div className="glass-panel p-8 rounded-3xl mb-8">
          <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">Название квиза</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: История Древнего Рима"
            className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-white/50 transition-all text-lg"
          />
        </div>

        <div className="space-y-6">
          {questions.map((q, index) => (
            <div key={index} className="glass-panel p-6 rounded-3xl relative group hover:border-white/30 transition-colors">
              <div className="absolute -top-3 left-6 bg-black/80 border border-white/20 px-3 py-1 rounded-full text-sm font-bold text-gray-300 flex items-center gap-2">
                <span>Вопрос {index + 1}</span>
              </div>
              
              <div className="mb-5 mt-2">
                <label className="block text-xs font-medium text-gray-500 mb-2 ml-1 uppercase tracking-wide">Текст задания</label>
                <textarea
                  value={q.text}
                  onChange={(e) => updateQuestion(index, 'text', e.target.value)}
                  placeholder="Опишите задание..."
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-white/50 transition-all resize-none"
                  rows={2}
                />
              </div>

              <div className="mb-5">
                <label className="block text-xs font-medium text-gray-500 mb-2 ml-1 uppercase tracking-wide">Фото (необязательно)</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => updateQuestion(index, 'image', e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                  />
                  {q.image && (
                    <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      Файл выбран: {q.image.name}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 ml-1 uppercase tracking-wide">Правильный ответ</label>
                <input
                  type="text"
                  value={q.correctAnswer}
                  onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                  placeholder="Ответ для проверки"
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-white/50 transition-all"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-4 sticky bottom-6 bg-black/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl z-10">
          <button
            onClick={addQuestion}
            className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 btn-press"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Добавить вопрос
          </button>
          <button
            onClick={handleSaveQuiz}
            disabled={isSaving}
            className="flex-[2] bg-white text-black font-bold py-4 rounded-lg shadow-lg hover:shadow-white/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 btn-press"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Сохранение...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                Создать квиз
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}