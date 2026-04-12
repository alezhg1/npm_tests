// src/pages/TeacherQuizMonitor.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type Participant = {
  id: string;
  student_name: string;
  score: number;
  joined_at: string;
};

type Answer = {
  id: string;
  participant_id: string;
  question_id: string;
  given_answer: string;
  is_correct: boolean;
  answered_at: string;
};

type FullAnswerDetail = {
  question_text: string;
  correct_answer: string;
  given_answer: string;
  is_correct: boolean;
  answered_at: string;
};

export default function TeacherQuizMonitor() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [quizTitle, setQuizTitle] = useState('Загрузка...');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [fullAnswers, setFullAnswers] = useState<FullAnswerDetail[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Загрузка участников
  const fetchParticipants = async () => {
    if (!quizId) return;
    console.log('🔄 Fetching participants...');
    const { data, error } = await supabase
      .from('quiz_participants')
      .select('*')
      .eq('quiz_id', quizId)
      .order('joined_at', { ascending: true });
    
    if (error) console.error('Error fetching participants:', error);
    else {
      console.log('✅ Participants loaded:', data?.length || 0);
      setParticipants(data || []);
    }
  };

  // Загрузка последних ответов для отображения в таблице
  const fetchAnswers = async () => {
    if (!quizId) return;

    if (participants.length === 0) {
      setAnswers([]);
      return;
    }

    console.log('🔄 Fetching answers for', participants.length, 'participants...');
    const participantIds = participants.map(p => p.id);

    const { data, error } = await supabase
      .from('answers')
      .select('*')
      .in('participant_id', participantIds);

    if (error) {
      console.error('❌ Error fetching answers:', error);
      return;
    }

    console.log('✅ Answers loaded:', data?.length || 0);
    setAnswers(data || []);
  };

  // Загрузка полных деталей ответов для одного участника
  // Загрузка полных деталей ответов для одного участника
  // Загрузка полных деталей ответов для одного участника
  const fetchFullAnswers = async (participantId: string) => {
    if (!quizId || !participantId) return;

    setIsLoadingDetails(true);
    console.log(' Fetching full answers for participant:', participantId);

    try {
      // Получаем все ответы этого участника вместе с данными вопросов
      const {  data, error: ansError } = await supabase
        .from('answers')
        .select(`
          *,
          questions (
            question_text,
            correct_answer
          )
        `)
        .eq('participant_id', participantId)
        .order('answered_at', { ascending: true });

      console.log('Raw response data:', data);

      if (ansError) throw ansError;

      // Проверка: если данных нет или массив пуст
      if (!data || data.length === 0) {
        console.warn('No answers found for this participant in DB.');
        setFullAnswers([]);
        return;
      }

      // Формируем удобный формат для отображения
      // Теперь мы работаем напрямую с массивом data
      const formatted = data.map((item: any) => ({
        question_text: item.questions?.question_text || 'Текст вопроса недоступен',
        correct_answer: item.questions?.correct_answer || '-',
        given_answer: item.given_answer,
        is_correct: item.is_correct,
        answered_at: item.answered_at
      }));

      console.log('Formatted answers:', formatted);
      setFullAnswers(formatted);
    } catch (err) {
      console.error('Error fetching full answers:', err);
      setFullAnswers([]);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Основной эффект при загрузке страницы
  useEffect(() => {
    if (!quizId) return;

    const init = async () => {
      const { data: quiz } = await supabase
        .from('quizzes')
        .select('title')
        .eq('id', quizId)
        .single();
      
      if (quiz) setQuizTitle(quiz.title);

      await fetchParticipants();
      await fetchAnswers(); 
    };

    init();

    // --- REALTIME ПОДПИСКИ ---
    const participantsChannel = supabase
      .channel('quiz-participants-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quiz_participants', filter: `quiz_id=eq.${quizId}` },
        () => {
          console.log('📢 Participant change detected!');
          fetchParticipants();
        }
      )
      .subscribe();

    const answersChannel = supabase
      .channel('quiz-answers-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'answers' },
        () => {
          console.log('📢 Answer change detected!');
          fetchAnswers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(answersChannel);
    };
  }, [quizId]);

  // Эффект: Когда обновился список участников, перезагружаем ответы
  useEffect(() => {
    if (participants.length > 0) {
      console.log('🔄 Participants list updated, reloading answers...');
      fetchAnswers();
    }
  }, [participants]);

  // Обработчик открытия модалки
  const handleViewDetails = async (participant: Participant) => {
    setSelectedParticipant(participant);
    await fetchFullAnswers(participant.id);
  };

  // Закрытие модалки
  const closeModal = () => {
    setSelectedParticipant(null);
    setFullAnswers([]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">{quizTitle}</h1>
          <button 
            onClick={() => navigate('/')}
            className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-xl font-bold transition"
          >
            На главную
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-lg font-semibold text-gray-400 mb-2">Участников</h3>
            <p className="text-4xl font-bold">{participants.length}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-lg font-semibold text-gray-400 mb-2">Всего ответов</h3>
            <p className="text-4xl font-bold">{answers.length}</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold">Прогресс учеников (Realtime)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-750">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Имя</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Баллы</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Последний ответ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Действия</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Время входа</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {participants.map((participant) => {
                  const userAnswers = answers.filter(a => a.participant_id === participant.id);
                  const lastAnswer = userAnswers[userAnswers.length - 1];
                  
                  return (
                    <tr key={participant.id} className="hover:bg-gray-750 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{participant.student_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-200">
                          {participant.score}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {lastAnswer ? (
                          <span className={lastAnswer.is_correct ? 'text-green-400' : 'text-red-400'}>
                            {lastAnswer.given_answer} ({lastAnswer.is_correct ? '✓' : '✗'})
                          </span>
                        ) : (
                          <span className="text-gray-500">Проходит тест...</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewDetails(participant)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition"
                        >
                          👁️ Подробнее
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(participant.joined_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {participants.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              Ожидание учеников...
            </div>
          )}
        </div>
      </div>

    {/* МОДАЛЬНОЕ ОКНО С ДЕТАЛЯМИ (OVERLAY) */}
      {selectedParticipant && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
          onClick={closeModal} // Закрытие при клике на затемненный фон
        >
          <div 
            className="bg-gray-800 rounded-2xl border border-gray-600 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()} // Предотвращаем закрытие при клике внутри окна
          >
            {/* Header модалки */}
            <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800 sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-bold text-white">Ответы ученика</h2>
                <p className="text-blue-400 font-medium mt-1">{selectedParticipant.student_name}</p>
              </div>
              <button 
                onClick={closeModal}
                className="text-gray-400 hover:text-white hover:bg-gray-700 rounded-full p-2 transition-colors"
                title="Закрыть"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            {/* Content модалки (скроллится) */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {isLoadingDetails ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <span>Загрузка ответов...</span>
                </div>
              ) : fullAnswers.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-gray-750/50 rounded-xl border border-dashed border-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 opacity-50"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  <p>Этот ученик ещё не дал ни одного ответа.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {fullAnswers.map((ans, idx) => (
                    <div key={idx} className="bg-gray-750/50 p-5 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-800 px-2 py-1 rounded">Вопрос #{idx + 1}</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${ans.is_correct ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                          {ans.is_correct ? 'Верно' : 'Ошибка'}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-100 mb-4 leading-snug">{ans.question_text}</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Ответ ученика */}
                        <div className="relative group">
                          <span className="text-xs text-gray-400 block mb-1.5 ml-1">Ответ ученика:</span>
                          <div className={`p-4 rounded-lg border-2 transition-all ${
                            ans.is_correct 
                              ? 'bg-green-900/10 border-green-500/50 shadow-[0_0_15px_-3px_rgba(34,197,94,0.1)]' 
                              : 'bg-red-900/10 border-red-500/50 shadow-[0_0_15px_-3px_rgba(239,68,68,0.1)]'
                          }`}>
                            <div className="flex items-center gap-2">
                              <span className={`text-xl ${ans.is_correct ? 'text-green-400' : 'text-red-400'}`}>
                                {ans.is_correct ? '✓' : '✗'}
                              </span>
                              <span className={`text-lg font-medium ${ans.is_correct ? 'text-green-100' : 'text-red-100'}`}>
                                {ans.given_answer || <span className="italic opacity-50">Нет ответа</span>}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Правильный ответ */}
                        <div className="relative">
                          <span className="text-xs text-gray-400 block mb-1.5 ml-1">Правильный ответ:</span>
                          <div className="p-4 rounded-lg bg-gray-800 border border-gray-600 flex items-center gap-2">
                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                             <span className="text-lg font-medium text-blue-100">{ans.correct_answer}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-right">
                         <span className="text-xs text-gray-500 flex items-center justify-end gap-1">
                           <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                           {new Date(ans.answered_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                         </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer модалки */}
            <div className="p-4 border-t border-gray-700 bg-gray-800 flex justify-end">
              <button
                onClick={closeModal}
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2.5 rounded-xl font-bold transition shadow-lg hover:shadow-gray-700/20"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}