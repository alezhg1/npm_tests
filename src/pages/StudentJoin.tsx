// src/pages/StudentJoin.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function StudentJoin() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !studentName.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      // Проверяем, существует ли квиз с таким кодом
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select('id, title, status')
        .eq('join_code', joinCode)
        .single();

      if (quizError || !quiz) {
        throw new Error('Квиз не найден. Проверьте код.');
      }

      if (quiz.status !== 'waiting') {
        throw new Error('Этот квиз уже начался или завершён.');
      }

      // Добавляем ученика в список участников
      const { error: participantError } = await supabase
        .from('quiz_participants')
        .insert({
          quiz_id: quiz.id,
          student_name: studentName,
          score: 0
        });

      if (participantError) throw participantError;

      // Перенаправляем на страницу прохождения теста
      navigate(`/quiz/${quiz.id}`, { state: { studentName, quizTitle: quiz.title } });

    } catch (err: any) {
      setError(err.message || 'Ошибка при подключении. Попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-2xl max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-center">Вход для ученика</h1>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Код квиза</label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Например: 140268"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition"
              maxLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Ваше имя</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Иван Петров"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition disabled:opacity-50"
          >
            {isLoading ? 'Подключение...' : 'Присоединиться'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-gray-400 hover:text-white text-sm">← Вернуться на главную</a>
        </div>
      </div>
    </div>
  );
}