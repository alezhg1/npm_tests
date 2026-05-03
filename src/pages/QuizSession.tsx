// src/pages/QuizSession.tsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getQuizById, getQuestionsForQuiz, submitAnswer } from '../api/client';

type Question = {
  id: string;
  question_text: string;
  image_url?: string;
  correct_answer: string;
  order_index: number;
};

export default function QuizSession() {
  const { quizId } = useParams<{ quizId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Данные из state при переходе со страницы входа
  const locationState = location.state || {};
  const studentName = locationState.studentName;
  const participantId = locationState.participantId;
  
  // Если participantId не передан через state, пробуем получить из sessionStorage
  const storedParticipantId = sessionStorage.getItem(`participant_${quizId}`);
  const finalParticipantId = participantId || storedParticipantId;
  
  const [quizTitle, setQuizTitle] = useState('Загрузка...');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);

  // Защита от ухода со страницы
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Загрузка данных квиза
  useEffect(() => {
    if (!quizId || !finalParticipantId) {
      console.warn('⚠️ Missing quizId or participantId, redirecting to /join');
      console.log('quizId:', quizId, 'finalParticipantId:', finalParticipantId, 'locationState:', locationState);
      navigate('/join', { replace: true });
      return;
    }

    console.log('📥 Loading quiz data for ID:', quizId, 'Participant:', finalParticipantId);

    const loadQuizData = async () => {
      try {
        setIsLoading(true);
        
        // 1. Загружаем название квиза
        console.log('🔍 Fetching quiz info...');
        const quizInfo = await getQuizById(quizId);
        console.log('✅ Quiz info loaded:', quizInfo);
        setQuizTitle(quizInfo.title);

        // 2. Загружаем вопросы через НАШ API
        console.log('🔍 Fetching questions...');
        const questionsData = await getQuestionsForQuiz(quizId);
        console.log('✅ Questions loaded:', questionsData.length);
        setQuestions(questionsData);

      } catch (err: any) {
        console.error('❌ Error loading quiz:', err);
        setError('Не удалось загрузить тест. Проверьте соединение или код квиза.');
      } finally {
        setIsLoading(false);
      }
    };

    loadQuizData();
  }, [quizId, finalParticipantId, navigate]);

  const handleOptionSelect = (option: string) => {
    if (isSubmitting) return; // Не даем менять выбор во время отправки
    setSelectedOption(option);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedOption || isSubmitting) return;

    setIsSubmitting(true);
    const currentQuestion = questions[currentQuestionIndex];

    try {
      // Отправляем ответ через НАШ API, используем finalParticipantId
      await submitAnswer({
        participant_id: finalParticipantId,
        question_id: currentQuestion.id,
        selected_answer: selectedOption,
        is_correct: selectedOption.toLowerCase().trim() === currentQuestion.correct_answer.toLowerCase().trim(),
        answered_at: new Date().toISOString()
      });

      // Если ответ правильный, увеличиваем счет (локально для мгновенной реакции)
      if (selectedOption.toLowerCase().trim() === currentQuestion.correct_answer.toLowerCase().trim()) {
        setScore(prev => prev + 1);
      }

      // Переход к следующему вопросу или финиш
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedOption('');
      } else {
        setIsFinished(true);
      }

    } catch (err: any) {
      console.error('Error submitting answer:', err);
      alert('Ошибка при сохранении ответа. Попробуйте еще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-xl animate-pulse">Загрузка теста...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-6 text-center">
        <div>
          <h2 className="text-2xl font-bold text-red-500 mb-4">Ошибка</h2>
          <p>{error}</p>
          <button 
            onClick={() => navigate('/join')}
            className="mt-6 px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200"
          >
            Вернуться к входу
          </button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
         {/* Фон */}
         <div className="fixed inset-0 z-0 opacity-30">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px]"></div>
         </div>

         <div className="relative z-10 glass-panel p-8 md:p-12 max-w-md w-full text-center rounded-3xl border border-white/10 shadow-2xl animate-fade-in-up">
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/30">
               <span className="text-4xl">🏆</span>
            </div>
            
            <h2 className="text-3xl font-bold mb-2 text-white drop-shadow-lg">Тест завершён!</h2>
            <p className="text-gray-400 mb-8">Отличная работа, {studentName || 'Ученик'}!</p>
            
            <div className="bg-black/50 border border-white/20 rounded-xl py-6 px-4 mb-8">
               <span className="block text-sm text-gray-500 uppercase tracking-widest mb-2">Твой результат</span>
               <span className="text-6xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                  {score} / {questions.length}
               </span>
            </div>
            
            <button 
              onClick={() => {
                // Очищаем sessionStorage при выходе из квиза
                if (quizId) {
                  sessionStorage.removeItem(`participant_${quizId}`);
                }
                navigate('/');
              }}
              className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-all duration-300 shadow-lg hover:shadow-white/20 btn-press"
            >
              На главную
            </button>
         </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  // Генерируем варианты ответов (для примера берем правильный и добавляем фейковые, если в БД только один ответ)
  // В реальном проекте варианты должны храниться в отдельной таблице options
  const options = [
    currentQuestion.correct_answer,
    "Вариант А", 
    "Вариант Б", 
    "Вариант В"
  ].sort(() => Math.random() - 0.5); // Перемешиваем

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative">
       {/* Прогресс бар */}
       <div className="fixed top-0 left-0 w-full h-1.5 bg-gray-800 z-50">
          <div 
            className="h-full bg-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
       </div>

       <div className="max-w-2xl w-full glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl animate-fade-in-up">
          <div className="flex justify-between items-center mb-6">
             <span className="text-sm font-mono text-gray-400">Вопрос {currentQuestionIndex + 1} из {questions.length}</span>
             <span className="text-sm font-bold text-indigo-400">{quizTitle}</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold mb-6 leading-tight">{currentQuestion.question_text}</h2>

          {currentQuestion.image_url && (
             <div className="mb-8 rounded-xl overflow-hidden border border-white/20 shadow-lg">
                <img src={currentQuestion.image_url} alt="Question" className="w-full h-auto object-cover max-h-64" />
             </div>
          )}

          <div className="space-y-3 mb-8">
             {options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(opt)}
                  disabled={isSubmitting}
                  className={`w-full p-4 rounded-xl text-left transition-all duration-200 border ${
                     selectedOption === opt 
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30 text-gray-200'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                   <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                         selectedOption === opt ? 'border-white bg-white/20' : 'border-gray-500'
                      }`}>
                         {selectedOption === opt && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                      </div>
                      <span className="font-medium">{opt}</span>
                   </div>
                </button>
             ))}
          </div>

          <button
            onClick={handleSubmitAnswer}
            disabled={!selectedOption || isSubmitting}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 btn-press disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
          >
             {isSubmitting ? (
                <>
                   <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   Сохранение...
                </>
             ) : (
                'Ответить'
             )}
          </button>
       </div>
    </div>
  );
}