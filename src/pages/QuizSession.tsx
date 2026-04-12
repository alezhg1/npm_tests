// src/pages/QuizSession.tsx
import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function QuizSession() {
  const { id } = useParams(); // ID квиза из URL
  const location = useLocation();
  const navigate = useNavigate();
  
  // Данные из state (переданные при входе)
  const { studentName, quizTitle } = location.state || {};

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
      const { data: participant, error: pError } = await supabase
        .from('quiz_participants')
        .select('id')
        .eq('quiz_id', id)
        .eq('student_name', studentName)
        .single();

      if (pError) {
        console.error("Ошибка поиска участника:", pError);
        // Если участник не найден, возможно, он еще не создан? 
        // Но в StudentJoin мы его создаем. Если ошибка - редирект на вход.
        navigate('/join');
        return;
      }
      
      if (participant) {
        setParticipantId(participant.id);
      }

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
    // Безопасная проверка: если нет текущего вопроса или participantId, выходим
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
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl animate-pulse">Загрузка теста...</div>
      </div>
    );
  }

  // Если вопросов нет вообще
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl text-red-400">В этом квизе пока нет вопросов.</div>
      </div>
    );
  }

  // Экран результатов
  if (isFinished) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-2xl max-w-md w-full text-center">
          <h1 className="text-3xl font-bold mb-4">Тест завершён!</h1>
          <p className="text-xl text-gray-300 mb-6">Твой результат:</p>
          <div className="text-6xl font-bold text-blue-500 mb-8">{score} / {questions.length}</div>
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition"
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Прогресс бар */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Вопрос {currentQuestionIndex + 1} из {questions.length}</span>
            <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Карточка вопроса */}
        <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-xl mb-8">
          <h2 className="text-2xl font-bold mb-6">{currentQ?.question_text || 'Загрузка...'}</h2>
          
          {currentQ?.image_url && (
            <div className="mb-6 flex justify-center">
              <img 
                src={currentQ.image_url} 
                alt="Задание" 
                className="max-h-64 rounded-lg object-contain border border-gray-600"
              />
            </div>
          )}

          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Введите ваш ответ..."
            className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-4 text-lg focus:outline-none focus:border-blue-500 transition"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleNext()}
          />
        </div>

        <button
          onClick={handleNext}
          disabled={!answer.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white py-4 rounded-xl font-bold text-lg transition"
        >
          Ответить
        </button>
      </div>
    </div>
  );
}