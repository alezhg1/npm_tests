// src/pages/StudentJoin.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getQuizByCode, addParticipant } from '../api/client';

export default function StudentJoin() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e?: React.MouseEvent | React.KeyboardEvent) => {
    // Жесткая блокировка любых стандартных действий браузера
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const cleanCode = joinCode.trim().toUpperCase();
    
    if (!cleanCode || !studentName.trim()) {
      setError('Заполните все поля');
      return;
    }

    setIsLoading(true);
    setError('');
    console.log('🔍 Trying to join with code:', cleanCode);

    try {
      // 1. Ищем квиз через НАШ API
      const quiz = await getQuizByCode(cleanCode);
      
      if (!quiz) {
        throw new Error(`Квиз с кодом '${cleanCode}' не найден.`);
      }

      if (quiz.status === 'finished') {
        throw new Error('Этот квиз уже завершён.');
      }

      console.log('➕ Adding participant via API:', studentName);
      
      // 2. Добавляем участника
      let participant;
      try {
        participant = await addParticipant({ 
          quiz_id: quiz.id, 
          student_name: studentName, 
          score: 0 
        });
      } catch (addErr: any) {
        if (addErr.message && (addErr.message.includes('Duplicate') || addErr.toString().includes('409'))) {
           throw new Error('Вы уже присоединились к этому квизу. Попробуйте другое имя.');
        }
        throw addErr;
      }

      console.log('✅ Participant Created ID:', participant.id);
      
      // Сохраняем participantId в sessionStorage для надежности
      sessionStorage.setItem(`participant_${quiz.id}`, participant.id);
      
      console.log('🧭 Navigating to /quiz/' + quiz.id, { 
        state: { studentName, quizTitle: quiz.title, participantId: participant.id } 
      });

      // Мгновенная навигация без задержки
      const navResult = navigate(`/quiz/${quiz.id}`, { 
        state: { 
          studentName, 
          quizTitle: quiz.title,
          participantId: participant.id
        },
        replace: true
      });
      
      console.log('✅ Navigate called, result:', navResult);
      return; // Явно завершаем функцию

    } catch (err: any) {
      console.error('Final Join Error:', err);
      setError(err.message || 'Ошибка при подключении. Проверьте код и попробуйте снова.');
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleJoin(e);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <div className="fixed top-6 left-6 z-50 text-white/30 text-xs font-mono tracking-widest pointer-events-none select-none">
        v0.1.0
      </div>

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

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center gap-8 max-w-6xl w-full animate-fade-in-up">
        
        <div className="w-full lg:w-[500px] glass-panel p-8 md:p-12 rounded-3xl shadow-2xl border border-white/10 flex-shrink-0">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-lg">Вход для ученика</h1>
            <p className="text-gray-500 text-sm md:text-base">Введите код квиза, чтобы начать</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg animate-pulse">
              {error}
            </div>
          )}

          {/* ВАЖНО: Здесь НЕТ тега <form>. Только div */}
          <div className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Код квиза</label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                placeholder="НАПРИМЕР: A1B2C3"
                className="w-full bg-black/50 border border-white/20 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder-gray-600 text-2xl tracking-widest font-mono text-center"
                maxLength={6}
                autoFocus
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Ваше имя</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Иван Петров"
                className="w-full bg-black/50 border border-white/20 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder-gray-600"
                autoComplete="off"
              />
            </div>

            <button
              type="button" // Тип button, а не submit
              onClick={handleJoin}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 btn-press disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Подключение...' : 'Присоединиться'}
            </button>
          </div>

          <div className="mt-8 text-center">
            <Link to="/" className="text-gray-600 hover:text-white text-xs uppercase tracking-widest transition-colors border-b border-transparent hover:border-white pb-1 btn-press">
              ← Вернуться на главную
            </Link>
          </div>
        </div>

        <div className="hidden lg:block lg:w-[500px] flex-shrink-0">
          <div className="relative group">
            <img 
              src="/join_page.gif" 
              alt="Join Page Animation" 
              className="w-full h-auto rounded-3xl shadow-2xl border border-white/10 object-cover transform group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute -bottom-4 -right-4 w-full h-full bg-indigo-500/10 rounded-3xl -z-10 blur-xl"></div>
          </div>
        </div>

      </div>
    </div>
  );
}