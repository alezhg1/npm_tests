// src/pages/CreateQuiz.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// Типы для наших данных
type Question = {
  text: string;
  image: File | null;
  correctAnswer: string;
};

export default function CreateQuiz() {
  
  // Состояния формы
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    { text: '', image: null, correctAnswer: '' } // Первый вопрос по умолчанию
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [joinCode, setJoinCode] = useState<string | null>(null);

  // Добавление нового поля вопроса
  const addQuestion = () => {
    setQuestions([...questions, { text: '', image: null, correctAnswer: '' }]);
  };

  // Обновление данных конкретного вопроса
  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  // Генерация случайного кода из 6 цифр
  const generateJoinCode = () => Math.floor(100000 + Math.random() * 900000).toString();

  // Сохранение квиза в Supabase
  const handleSaveQuiz = async () => {
    if (!title.trim()) return alert('Введите название квиза!');
    setIsSaving(true);

    try {
      // 1. Создаем запись о квизе
      const code = generateJoinCode();
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title: title,
          join_code: code,
          status: 'waiting',
          teacher_id: '00000000-0000-0000-0000-000000000000' // ВРЕМЕННО: Заглушка ID учителя. Позже возьмем из auth
        })
        .select()
        .single();

      if (quizError) throw quizError;

      // 2. Загружаем картинки и создаем вопросы
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        let imageUrl = '';

        // Если есть картинка, загружаем её в Storage
        if (q.image) {
          const fileExt = q.image.name.split('.').pop();
          const fileName = `${quizData.id}/${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('quiz-images')
            .upload(fileName, q.image);

          if (uploadError) throw uploadError;

          // Получаем публичный URL
          const { data: urlData } = supabase.storage.from('quiz-images').getPublicUrl(fileName);
          imageUrl = urlData.publicUrl;
        }

        // Сохраняем вопрос в БД
        const { error: questionError } = await supabase
          .from('questions')
          .insert({
            quiz_id: quizData.id,
            question_text: q.text,
            image_url: imageUrl,
            correct_answer: q.correctAnswer,
            order_index: i
          });

        if (questionError) throw questionError;
      }

      setJoinCode(code);
      alert(`Квиз успешно создан! Код для входа: ${code}`);
      
    } catch (error) {
      console.error(error);
      alert('Ошибка при сохранении. Проверьте консоль.');
    } finally {
      setIsSaving(false);
    }
  };

  // Если квиз уже создан, показываем код
  if (joinCode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="bg-gray-800 p-8 rounded-2xl border border-green-500/50 shadow-2xl max-w-md w-full text-center">
          <h2 className="text-3xl font-bold mb-4 text-green-400">Квиз готов!</h2>
          <p className="text-gray-300 mb-6">Ученики могут войти по этому коду:</p>
          <div className="text-6xl font-mono font-bold tracking-widest bg-gray-900 py-4 rounded-xl mb-8 border border-gray-700">
            {joinCode}
          </div>
          <Link to="/" className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition">
            На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 pb-20">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Новый квиз</h1>
          <Link to="/" className="text-gray-400 hover:text-white">← Отмена</Link>
        </div>

        {/* Название квиза */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-400 mb-2">Название квиза</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: История Древнего Рима"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Список вопросов */}
        <div className="space-y-6">
          {questions.map((q, index) => (
            <div key={index} className="bg-gray-800 p-6 rounded-xl border border-gray-700 relative">
              <span className="absolute -top-3 left-4 bg-gray-900 px-2 text-sm text-gray-400">Вопрос {index + 1}</span>
              
              {/* Текст вопроса */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Текст задания</label>
                <textarea
                  value={q.text}
                  onChange={(e) => updateQuestion(index, 'text', e.target.value)}
                  placeholder="Опишите задание..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  rows={2}
                />
              </div>

              {/* Фото */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Фото (необязательно)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => updateQuestion(index, 'image', e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
              </div>

              {/* Правильный ответ */}
              <div>
                <label className="block text-xs font-medium text-green-500 mb-1">Правильный ответ</label>
                <input
                  type="text"
                  value={q.correctAnswer}
                  onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                  placeholder="Ответ для проверки"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Кнопки действий */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={addQuestion}
            className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white py-3 rounded-xl font-bold transition"
          >
            + Добавить вопрос
          </button>
          <button
            onClick={handleSaveQuiz}
            disabled={isSaving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition disabled:opacity-50"
          >
            {isSaving ? 'Сохранение...' : 'Создать квиз'}
          </button>
        </div>
      </div>
    </div>
  );
}