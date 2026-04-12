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

    try {
      // 1. Создаем запись о квизе
      const code = generateJoinCode();
      
      const { data: createdQuiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title: title,
          join_code: code,
          status: 'waiting',
          teacher_id: '00000000-0000-0000-0000-000000000000'
        })
        .select()
        .single();

      if (quizError) throw quizError;
      setQuizData(createdQuiz);

      // 2. Загружаем картинки и создаем вопросы
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        let imageUrl = '';

        if (q.image) {
          const fileExt = q.image.name.split('.').pop();
          const fileName = `${createdQuiz.id}/${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('quiz-images')
            .upload(fileName, q.image);

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage.from('quiz-images').getPublicUrl(fileName);
          imageUrl = urlData.publicUrl;
        }

        const { error: questionError } = await supabase
          .from('questions')
          .insert({
            quiz_id: createdQuiz.id,
            question_text: q.text,
            image_url: imageUrl,
            correct_answer: q.correctAnswer,
            order_index: i
          });

        if (questionError) throw questionError;
      }

      setJoinCode(code);
      
    } catch (error) {
      console.error(error);
      alert('Ошибка при сохранении. Проверьте консоль.');
    } finally {
      setIsSaving(false);
    }
  };

  // Экран успешного создания
  if (joinCode && quizData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 animate-fade-in">
        <div className="bg-[#16213e] border border-[#2d2d44] rounded-2xl shadow-2xl max-w-md w-full text-center p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          
          <div className="relative z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            
            <h2 className="text-3xl font-bold mb-2 text-white">Квиз создан!</h2>
            <p className="text-gray-400 mb-8">Ученики могут войти по этому коду:</p>
            
            <div className="bg-[#0f0f1a] border-2 border-dashed border-[#2d2d44] rounded-xl py-6 px-4 mb-8 group hover:border-indigo-500/50 transition-colors">
              <span className="text-5xl font-mono font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
                {joinCode}
              </span>
            </div>
            
            <div className="space-y-3">
              <Link 
                to={`/teacher/monitor/${quizData.id}`} 
                className="block w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200"
              >
                👁️ Следить за квизом (Realtime)
              </Link>
              <Link to="/" className="block w-full bg-[#1a1a2e] hover:bg-[#252542] border border-[#2d2d44] text-white font-semibold py-4 rounded-xl transition-all duration-200">
                На главную
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Форма создания
  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white p-6 pb-20 animate-fade-in">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-1">Новый квиз</h1>
            <p className="text-gray-400 text-sm">Заполните информацию для создания теста</p>
          </div>
          <Link to="/" className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Отмена
          </Link>
        </div>

        {/* Название квиза */}
        <div className="bg-[#16213e] border border-[#2d2d44] rounded-2xl p-6 mb-8 shadow-lg">
          <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">Название квиза</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: История Древнего Рима"
            className="w-full bg-[#0f0f1a] border border-[#2d2d44] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg"
          />
        </div>

        {/* Список вопросов */}
        <div className="space-y-6">
          {questions.map((q, index) => (
            <div key={index} className="bg-[#16213e] border border-[#2d2d44] rounded-2xl p-6 relative shadow-lg group hover:border-indigo-500/30 transition-colors">
              <div className="absolute -top-3 left-6 bg-[#0f0f1a] border border-[#2d2d44] px-3 py-1 rounded-full text-sm font-bold text-indigo-400 flex items-center gap-2">
                <span>Вопрос {index + 1}</span>
              </div>
              
              {/* Текст вопроса */}
              <div className="mb-5 mt-2">
                <label className="block text-xs font-medium text-gray-500 mb-2 ml-1 uppercase tracking-wide">Текст задания</label>
                <textarea
                  value={q.text}
                  onChange={(e) => updateQuestion(index, 'text', e.target.value)}
                  placeholder="Опишите задание..."
                  className="w-full bg-[#0f0f1a] border border-[#2d2d44] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                  rows={2}
                />
              </div>

              {/* Фото */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-gray-500 mb-2 ml-1 uppercase tracking-wide">Фото (необязательно)</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => updateQuestion(index, 'image', e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                  />
                  {q.image && (
                    <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      Файл выбран: {q.image.name}
                    </div>
                  )}
                </div>
              </div>

              {/* Правильный ответ */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 ml-1 uppercase tracking-wide">Правильный ответ</label>
                <input
                  type="text"
                  value={q.correctAnswer}
                  onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                  placeholder="Ответ для проверки"
                  className="w-full bg-[#0f0f1a] border border-[#2d2d44] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Кнопки действий */}
        <div className="mt-8 flex gap-4 sticky bottom-6 bg-[#0f0f1a]/90 backdrop-blur-md p-4 rounded-2xl border border-[#2d2d44] shadow-2xl z-10">
          <button
            onClick={addQuestion}
            className="flex-1 bg-[#1a1a2e] hover:bg-[#252542] border border-[#2d2d44] text-white font-bold py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Добавить вопрос
          </button>
          <button
            onClick={handleSaveQuiz}
            disabled={isSaving}
            className="flex-[2] bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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