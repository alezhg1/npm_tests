// src/pages/StudentJoin.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

      if (quiz.status === 'finished') {
        throw new Error('Этот квиз уже завершён.');
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
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md">
        {/* Карточка входа */}
        <div className="bg-[#16213e] border border-[#2d2d44] rounded-2xl shadow-2xl p-8 relative overflow-hidden">
          {/* Декоративный фон */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/25">
                <span className="text-3xl">🎓</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Вход для ученика</h1>
              <p className="text-gray-400">Введите код квиза, чтобы начать</p>
            </div>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 animate-slide-up">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                {error}
              </div>
            )}

            <form onSubmit={handleJoin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">Код квиза</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="НАПРИМЕР: A1B2C3"
                  className="w-full bg-[#0f0f1a] border border-[#2d2d44] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all text-center text-2xl tracking-widest font-mono"
                  maxLength={6}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">Ваше имя</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Иван Петров"
                  className="w-full bg-[#0f0f1a] border border-[#2d2d44] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Подключение...
                  </span>
                ) : (
                  'Присоединиться к квизу'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/" className="text-gray-500 hover:text-white text-sm transition-colors flex items-center justify-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                Вернуться на главную
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}