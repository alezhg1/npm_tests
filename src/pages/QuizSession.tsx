// src/pages/QuizSession.tsx
import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function QuizSession() {
  const { id } = useParams(); // ID квиза из URL
  const location = useLocation();
  const navigate = useNavigate();
  
  // Данные из state (переданные при входе)
  const { studentName } = location.state || {}; // Убрали quizTitle — не используется

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [participantId, setParticipantId] = useState<string | null>(null);

  // Загрузка вопросов и поиск participant_id при монтировании
  useEffect(() => {
    if (!id || !studentName) return;
    
    const fetchData = async () => {
      // 1. Находим участника
      const {  data: participantData, error: pError } = await supabase
        .from('quiz_participants')
        .select('id')
        .eq('quiz_id', id)
        .eq('student_name', studentName)
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

  const handleNext = async () => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ || !participantId) return;

    const isCorrect = answer.trim().toLowerCase() === currentQ.correct_answer.trim().toLowerCase();
    
    // Сохраняем ответ в БД
    await supabase.from('answers').insert({
      participant_id: participantId,
      question_id: currentQ.id,
      given_answer: answer,
      is_correct: isCorrect
    });

    // Обновляем счет участника
    if (isCorrect) {
      await supabase
        .from('quiz_participants')
        .update({ score: score + 1 })
        .eq('id', participantId);
      
      setScore(prev => prev + 1);
    }

    // Переход к следующему вопросу или финиш
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
      <div className="min-h-screen bg-[#0f0f1a] text-white flex items-center justify-center">
        <div className="text-xl animate-pulse text-indigo-400 font-bold">Загрузка теста...</div>
      </div>
    );
  }

  // Если вопросов нет вообще
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] text-white flex items-center justify-center">
        <div className="text-xl text-red-400">В этом квизе пока нет вопросов.</div>
      </div>
    );
  }

  // Экран результатов
  if (isFinished) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] text-white flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-[#16213e] border border-[#2d2d44] p-8 rounded-2xl shadow-2xl max-w-md w-full text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          
          <div className="relative z-10">
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-500/30">
              <span className="text-4xl">🏆</span>
            </div>
            
            <h1 className="text-3xl font-bold mb-2 text-white">Тест завершён!</h1>
            <p className="text-gray-400 mb-6">Отличная работа, {studentName}!</p>
            
            <div className="bg-[#0f0f1a] rounded-xl py-6 px-4 mb-8 border border-[#2d2d44]">
              <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">Твой результат</p>
              <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
                {score} / {questions.length}
              </div>
            </div>
            
            <button 
              onClick={() => navigate('/')}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200"
            >
              На главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];
  const progressPercent = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-3xl">
        
        {/* Прогресс бар сверху */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2 font-medium">
            <span>Вопрос {currentQuestionIndex + 1} из {questions.length}</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full bg-[#1a1a2e] rounded-full h-3 overflow-hidden border border-[#2d2d44]">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Карточка вопроса */}
        <div className="bg-[#16213e] border border-[#2d2d44] p-8 rounded-2xl shadow-2xl mb-8 relative overflow-hidden">
           {/* Декоративный фон */}
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

          <h2 className="text-2xl md:text-3xl font-bold mb-8 leading-tight text-white">
            {currentQ?.question_text || 'Загрузка...'}
          </h2>
          
          {currentQ?.image_url && (
            <div className="mb-8 flex justify-center bg-[#0f0f1a] rounded-xl p-4 border border-[#2d2d44]">
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
              className="w-full bg-[#0f0f1a] border-2 border-[#2d2d44] rounded-xl px-6 py-5 text-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all"
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
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500 text-white font-bold text-lg py-5 rounded-xl shadow-lg shadow-green-500/25 hover:shadow-green-500/40 disabled:shadow-none transition-all duration-200 transform active:scale-[0.98]"
        >
          Ответить
        </button>
      </div>
    </div>
  );
}