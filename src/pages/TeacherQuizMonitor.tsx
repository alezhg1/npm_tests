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

type CheatEvent = {
  id: string;
  participant_id: string;
  event_type: string;
  detected_at: string;
  duration_seconds?: number;
};

export default function TeacherQuizMonitor() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [quizTitle, setQuizTitle] = useState('Загрузка...');
  const [joinCode, setJoinCode] = useState<string>(''); // Добавили состояние для кода
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [fullAnswers, setFullAnswers] = useState<FullAnswerDetail[]>([]);
  const [cheatEvents, setCheatEvents] = useState<CheatEvent[]>([]);
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

  // Загрузка полных деталей ответов И событий списывания для одного участника
  const fetchFullDetails = async (participantId: string) => {
    if (!quizId || !participantId) return;

    setIsLoadingDetails(true);
    console.log(' Fetching full details for participant:', participantId);

    try {
      // 1. Загружаем ответы
      const response = await supabase
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

      const answersData = response.data;
      const ansError = response.error;

      console.log('Raw Answers Response:', { answersData, ansError });

      if (ansError) throw ansError;

      // 2. Загружаем события списывания
      const cheatsResponse = await supabase
        .from('cheat_events')
        .select('*')
        .eq('participant_id', participantId)
        .order('detected_at', { ascending: true });

      const cheatsData = cheatsResponse.data;
      const cheatError = cheatsResponse.error;

      if (cheatError) console.error('Error fetching cheat events:', cheatError);

      // Форматируем ответы
      let formattedAnswers = [];
      if (answersData && answersData.length > 0) {
        formattedAnswers = answersData.map((item: any) => ({
          question_text: item.questions?.question_text || 'Текст вопроса недоступен',
          correct_answer: item.questions?.correct_answer || '-',
          given_answer: item.given_answer,
          is_correct: item.is_correct,
          answered_at: item.answered_at
        }));
      }

      console.log('Formatted Answers:', formattedAnswers);
      console.log('Cheat Events:', cheatsData);

      setFullAnswers(formattedAnswers);
      setCheatEvents(cheatsData || []);

    } catch (err) {
      console.error('Error fetching full details:', err);
      setFullAnswers([]);
      setCheatEvents([]);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Основной эффект при загрузке страницы
  useEffect(() => {
    if (!quizId) return;

        const init = async () => {
      console.log('🔍 Initializing Monitor for Quiz ID:', quizId); // <-- Лог ID из URL

      try {
        // Загружаем название и код квиза одним запросом
        const response = await supabase
          .from('quizzes')
          .select('title, join_code')
          .eq('id', quizId)
          .single();
        
        console.log('📦 Quiz Info Response:', response); // <-- Лог полного ответа от базы

        const quiz = response.data;
        const error = response.error;
        
        if (error) {
          console.error('Error fetching quiz info:', error);
          setQuizTitle('Ошибка');
          setJoinCode('ERR');
        } else if (!quiz) {
           // Сюда мы попадаем, если quiz === null
           console.warn('⚠️ Quiz not found in DB for ID:', quizId);
           setQuizTitle('Квиз не найден');
           setJoinCode('???');
        } else {
          setQuizTitle(quiz.title || 'Без названия');
          setJoinCode(quiz.join_code || '???');
        }

        await fetchParticipants();
        await fetchAnswers(); 
      } catch (err) {
        console.error('Init error:', err);
        setQuizTitle('Сбой');
        setJoinCode('???');
      }
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
    await fetchFullDetails(participant.id);
  };

  // Закрытие модалки
  const closeModal = () => {
    setSelectedParticipant(null);
    setFullAnswers([]);
    setCheatEvents([]);
  };

  return (
    <div className="min-h-screen bg-black p-6 relative">
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

      <div className="relative z-10 max-w-6xl mx-auto animate-fade-in-up">
        <div className="flex justify-between items-center mb-8">
          {/* ИЗМЕНЕНИЕ ЗДЕСЬ: Отображаем Название : Код */}
          <h1 className="text-3xl font-bold drop-shadow-lg flex items-center gap-3">
            <span className="text-white">{quizTitle}</span>
            <span className="text-gray-500 text-xl">:</span>
            <span className="text-[#FFCC00] font-mono text-2xl tracking-widest">{joinCode}</span>
          </h1>
          
          <button 
            onClick={() => navigate('/')}
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-6 py-2.5 rounded-lg transition-all duration-200 btn-press"
          >
            На главную
          </button>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-gray-400 mb-2">Участников</h3>
            <p className="text-4xl font-bold text-white">{participants.length}</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-gray-400 mb-2">Всего ответов</h3>
            <p className="text-4xl font-bold text-white">{answers.length}</p>
          </div>
        </div>

        {/* Таблица участников */}
        <div className="glass-panel rounded-2xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-2xl font-bold text-white">Прогресс учеников (Realtime)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Имя</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Баллы</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Последний ответ</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Действия</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Время входа</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {participants.map((participant) => {
                  const userAnswers = answers.filter(a => a.participant_id === participant.id);
                  const lastAnswer = userAnswers[userAnswers.length - 1];
                  
                  return (
                    <tr key={participant.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-white">{participant.student_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-white/10 text-white border border-white/20">
                          {participant.score}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {lastAnswer ? (
                          <span className={`inline-flex items-center gap-1 ${lastAnswer.is_correct ? 'text-green-400' : 'text-red-400'}`}>
                            {lastAnswer.given_answer} 
                            {lastAnswer.is_correct ? '✓' : '✗'}
                          </span>
                        ) : (
                          <span className="text-gray-500 italic">Проходит тест...</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewDetails(participant)}
                          className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 btn-press"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                          Подробнее
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
            <div className="p-12 text-center text-gray-500">
              <div className="text-6xl mb-4">⏳</div>
              <p className="text-lg">Ожидание учеников...</p>
              <p className="text-sm mt-2">Попросите их ввести код на странице входа.</p>
            </div>
          )}
        </div>
      </div>

      {/* МОДАЛЬНОЕ ОКНО С ДЕТАЛЯМИ */}
      {selectedParticipant && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
          onClick={closeModal}
        >
          <div 
            className="glass-panel rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header модалки */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/50 sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-bold text-white">Ответы ученика</h2>
                <p className="text-gray-400 font-medium mt-1">{selectedParticipant.student_name}</p>
              </div>
              <button 
                onClick={closeModal}
                className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full p-2 transition-colors btn-press"
                title="Закрыть"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            {/* Content модалки (скроллится) */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {isLoadingDetails ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <div className="w-8 h-8 border-4 border-white/20 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <span>Загрузка данных...</span>
                </div>
              ) : (
                <>
                  {/* Раздел с ответами */}
                  {fullAnswers.length > 0 ? (
                    <div className="space-y-6">
                      {fullAnswers.map((ans, idx) => (
                        <div key={idx} className="bg-black/30 p-5 rounded-xl border border-white/10 hover:border-white/30 transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 bg-black/50 px-2 py-1 rounded">Вопрос #{idx + 1}</span>
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
                              <div className="p-4 rounded-lg bg-black/50 border border-white/20 flex items-center gap-2">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/50"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                                 <span className="text-lg font-medium text-gray-200">{ans.correct_answer}</span>
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
                  ) : (
                    <div className="text-center py-12 text-gray-400 bg-black/30 rounded-xl border border-dashed border-white/10">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 opacity-50"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                      <p>Этот ученик ещё не дал ни одного ответа.</p>
                    </div>
                  )}

                  {/* Раздел с подозрительной активностью */}
                  {cheatEvents.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-white/10">
                      <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                        Подозрительная активность ({cheatEvents.length})
                      </h3>
                      
                      <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                        {cheatEvents.map((event, idx) => (
                          <div key={idx} className="bg-red-900/10 border border-red-500/30 rounded-lg p-3 text-sm">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-semibold text-red-300">
                                {event.event_type === 'tab_switch' ? '🔄 Переключение вкладки' : '🖥️ Потеря фокуса'}
                              </span>
                              <span className="text-gray-500 text-xs">
                                {new Date(event.detected_at).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-gray-400 text-xs">
                              Ученик покинул страницу теста. Это может означать использование внешних источников.
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Footer модалки */}
            <div className="p-4 border-t border-white/10 bg-black/50 flex justify-end">
              <button
                onClick={closeModal}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-lg font-bold transition shadow-lg hover:shadow-white/10 btn-press"
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