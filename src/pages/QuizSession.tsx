// src/pages/QuizSession.tsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function QuizSession() {
  const { id } = useParams(); // ID квиза из URL
  const location = useLocation();
  const navigate = useNavigate();
  
  // Данные из state (переданные при входе)
  const { studentName } = location.state || {};

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [participantId, setParticipantId] = useState<string | null>(null);

  // Для отслеживания списывания
  const [cheatCount, setCheatCount] = useState(0);
  const lastVisibleTimeRef = useRef<number>(Date.now());

  // Загрузка вопросов и поиск participant_id при монтировании
  useEffect(() => {
    if (!id || !studentName) return;
    
    const fetchData = async () => {
      // 1. Находим участника
      const {   participantData, error: pError } = await supabase
        .from('quiz_participants')
        .select('id')
        .eq('quiz_id', id)
        .eq('student_name', studentName)
        .order('joined_at', { ascending: false })
        .limit(1)
        .single();

      if (pError || !participantData) {
        console.error("Ошибка поиска участника:", pError);
        navigate('/join');
        return;
      }
      
      setParticipantId(participantData.id);

      // 2. Загружаем вопросы
      const { data, error: qError } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', id)
        .order('order_index', { ascending: true });

      if (qError) console.error(qError);
      else {
        setQuestions(data || []);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, studentName, navigate]);

  // --- АНТИ-СПИСЫВАНИЕ ---
  useEffect(() => {
    if (!participantId) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        lastVisibleTimeRef.current = Date.now();
        setCheatCount(prev => prev + 1);
        
        await supabase.from('cheat_events').insert({
          participant_id: participantId,
          event_type: 'tab_switch',
          detected_at: new Date().toISOString()
        });
      } else {
        const awayDuration = Math.floor((Date.now() - lastVisibleTimeRef.current) / 1000);
        console.log(`Ученик отсутствовал ${awayDuration} сек.`);
      }
    };

    const handleBlur = async () => {
      lastVisibleTimeRef.current = Date.now();
      
      await supabase.from('cheat_events').insert({
        participant_id: participantId,
        event_type: 'window_blur',
        detected_at: new Date().toISOString()
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [participantId]);

  const handleNext = async () => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ || !participantId) return;

    const isCorrect = answer.trim().toLowerCase() === currentQ.correct_answer.trim().toLowerCase();
    
    await supabase.from('answers').insert({
      participant_id: participantId,
      question_id: currentQ.id,
      given_answer: answer,
      is_correct: isCorrect
    });

    if (isCorrect) {
      await supabase
        .from('quiz_participants')
        .update({ score: score + 1 })
        .eq('id', participantId);
      
      setScore(prev => prev + 1);
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setAnswer('');
    } else {
      setIsFinished(true);
    }
  };

  // Экран загрузки
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative">
        <div className="fixed top-6 left-6 z-50 text-white/30 text-xs font-mono tracking-widest pointer-events-none select-none">v0.1.0</div>
        <div className="fixed inset-0 z-0">
          <img src="/main_back.png" alt="Background" className="w-full h-full object-cover opacity-80 contrast-125 brightness-110 saturate-110" />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        <div className="text-xl animate-pulse text-white font-bold z-10">Загрузка теста...</div>
      </div>
    );
  }

  // Если вопросов нет вообще
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative">
        <div className="fixed top-6 left-6 z-50 text-white/30 text-xs font-mono tracking-widest pointer-events-none select-none">v0.1.0</div>
        <div className="fixed inset-0 z-0">
          <img src="/main_back.png" alt="Background" className="w-full h-full object-cover opacity-80 contrast-125 brightness-110 saturate-110" />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        <div className="text-xl text-red-400 z-10">В этом квизе пока нет вопросов.</div>
      </div>
    );
  }

  // Экран результатов
  if (isFinished) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 relative">
        <div className="fixed top-6 left-6 z-50 text-white/30 text-xs font-mono tracking-widest pointer-events-none select-none">v0.1.0</div>
        <div className="fixed inset-0 z-0">
          <img src="/main_back.png" alt="Background" className="w-full h-full object-cover opacity-80 contrast-125 brightness-110 saturate-110" />
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-purple-500/10 rounded-full blur-[180px] pointer-events-none mix-blend-screen"></div>
        </div>
        
        <div className="glass-panel p-8 rounded-3xl max-w-md w-full text-center relative z-10 animate-fade-in-up">
          <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-500/30">
            <span className="text-4xl">🏆</span>
          </div>
          
          <h1 className="text-3xl font-bold mb-2 text-white drop-shadow-lg">Тест завершён!</h1>
          <p className="text-gray-400 mb-6">Отличная работа, {studentName}!</p>
          
          {cheatCount > 0 && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
              <p className="text-red-300 font-semibold flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                Зафиксировано {cheatCount} случаев ухода со страницы
              </p>
            </div>
          )}
          
          <div className="bg-black/50 rounded-xl py-6 px-4 mb-8 border border-white/20">
            <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">Твой результат</p>
            <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              {score} / {questions.length}
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-white text-black font-bold py-4 rounded-lg hover:bg-gray-200 transition-all duration-300 shadow-lg hover:shadow-white/20 btn-press"
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];
  const progressPercent = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative">
      <div className="fixed top-6 left-6 z-50 text-white/30 text-xs font-mono tracking-widest pointer-events-none select-none">v0.1.0</div>
      <div className="fixed inset-0 z-0">
        <img src="/main_back.png" alt="Background" className="w-full h-full object-cover opacity-80 contrast-125 brightness-110 saturate-110" />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-purple-500/10 rounded-full blur-[180px] pointer-events-none mix-blend-screen"></div>
      </div>

      <div className="w-full max-w-3xl relative z-10 animate-fade-in-up">
        
        {/* Прогресс бар сверху */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2 font-medium">
            <span>Вопрос {currentQuestionIndex + 1} из {questions.length}</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full bg-black/50 rounded-full h-3 overflow-hidden border border-white/20">
            <div 
              className="bg-gradient-to-r from-white to-gray-400 h-3 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Карточка вопроса */}
        <div className="glass-panel p-8 rounded-3xl mb-8 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-white via-gray-400 to-transparent"></div>

          <h2 className="text-2xl md:text-3xl font-bold mb-8 leading-tight text-white drop-shadow-lg">
            {currentQ?.question_text || 'Загрузка...'}
          </h2>
          
          {currentQ?.image_url && (
            <div className="mb-8 flex justify-center bg-black/50 rounded-xl p-4 border border-white/20">
              <img 
                src={currentQ.image_url} 
                alt="Задание" 
                className="max-h-80 rounded-lg object-contain shadow-lg"
              />
            </div>
          )}

          <div className="relative">
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Введите ваш ответ..."
              className="w-full bg-black/50 border-2 border-white/20 rounded-xl px-6 py-5 text-xl text-white placeholder-gray-600 focus:outline-none focus:border-white/50 focus:ring-4 focus:ring-white/10 transition-all"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleNext()}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
          </div>
        </div>

        <button
          onClick={handleNext}
          disabled={!answer.trim()}
          className="w-full bg-white text-black font-bold text-lg py-5 rounded-xl shadow-lg hover:shadow-white/20 disabled:bg-gray-700 disabled:text-gray-500 disabled:shadow-none transition-all duration-200 transform active:scale-[0.98] btn-press"
        >
          Ответить
        </button>
      </div>
    </div>
  );
}