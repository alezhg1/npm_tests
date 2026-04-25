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
    
    const cleanCode = joinCode.trim().toUpperCase();
    
    if (!cleanCode || !studentName.trim()) return;

    setIsLoading(true);
    setError('');
    console.log('🔍 Trying to join with code:', cleanCode);

    try {
      // 1. Ищем квиз по коду
      const response = await supabase
        .from('quizzes')
        .select('id, title, status, join_code')
        .eq('join_code', cleanCode);

      const quizzes = response.data;
      const quizError = response.error;

      if (quizError) throw quizError;

      if (!quizzes || quizzes.length === 0) {
        throw new Error(`Квиз с кодом '${cleanCode}' не найден.`);
      }

      const quiz = quizzes[0];

      if (quiz.status === 'finished') {
        throw new Error('Этот квиз уже завершён.');
      }

      // 2. Добавляем ученика в список участников
      console.log('➕ Adding participant:', studentName);
      
      const participantResponse = await supabase
        .from('quiz_participants')
        .insert({ 
          quiz_id: quiz.id, 
          student_name: studentName, 
          score: 0 
        })
        .select()
        .single();

      const participant = participantResponse.data;
      const participantError = participantResponse.error;

      if (participantError) {
        throw new Error('Не удалось присоединиться к квизу.');
      }

      console.log('✅ Participant Created ID:', participant.id);

      // 3. Перенаправляем, передавая ID участника!
      navigate(`/quiz/${quiz.id}`, { 
        state: { 
          studentName, 
          quizTitle: quiz.title,
          participantId: participant.id // <-- КЛЮЧЕВОЙ МОМЕНТ
        } 
      });

    } catch (err: any) {
      console.error('Final Join Error:', err);
      setError(err.message || 'Ошибка при подключении.');
    } finally {
      setIsLoading(false);
    }
  };

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

      <div className="w-full max-w-md glass-panel p-8 md:p-12 relative z-10 animate-fade-in-up">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2 drop-shadow-lg">Вход для ученика</h1>
          <p className="text-gray-500 text-sm">Введите код квиза, чтобы начать</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Код квиза</label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="НАПРИМЕР: A1B2C3"
              className="w-full bg-black/50 border border-white/20 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/50 transition-colors placeholder-gray-600 text-2xl tracking-widest font-mono text-center"
              maxLength={6}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Ваше имя</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Иван Петров"
              className="w-full bg-black/50 border border-white/20 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/50 transition-colors placeholder-gray-600"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-black font-bold py-4 rounded-lg hover:bg-gray-200 transition-all duration-300 shadow-lg hover:shadow-white/20 btn-press disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Подключение...' : 'Присоединиться'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link to="/" className="text-gray-600 hover:text-white text-xs uppercase tracking-widest transition-colors border-b border-transparent hover:border-white pb-1 btn-press">
            ← Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
}