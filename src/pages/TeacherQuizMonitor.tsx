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

export default function TeacherQuizMonitor() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [quizTitle, setQuizTitle] = useState('Загрузка...');

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

  // Загрузка ответов
  // ВАЖНО: Мы используем participants из state, а не запрашиваем их снова!
  const fetchAnswers = async () => {
    if (!quizId) return;

    // Если участников пока нет, очищаем ответы и выходим
    if (participants.length === 0) {
      setAnswers([]);
      return;
    }

    console.log('🔄 Fetching answers for', participants.length, 'participants...');

    // Берем ID напрямую из текущего состояния
    const participantIds = participants.map(p => p.id);
    console.log('IDs to fetch:', participantIds);

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

  // Основной эффект при загрузке страницы
  useEffect(() => {
    if (!quizId) return;

    const init = async () => {
      // Получаем название квиза
      const { data: quiz } = await supabase
        .from('quizzes')
        .select('title')
        .eq('id', quizId)
        .single();
      
      if (quiz) setQuizTitle(quiz.title);

      // Первичная загрузка
      await fetchParticipants();
      // После загрузки участников сразу грузим ответы
      await fetchAnswers(); 
    };

    init();

    // --- REALTIME ПОДПИСКИ ---

    // 1. Следим за новыми участниками
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

    // 2. Следим за новыми ответами
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

  // Эффект: Когда обновился список участников (state changed), перезагружаем ответы
  useEffect(() => {
    if (participants.length > 0) {
      console.log('🔄 Participants list updated, reloading answers...');
      fetchAnswers();
    }
  }, [participants]);

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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Время входа</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {participants.map((participant) => {
                  // Фильтруем ответы для этого конкретного участника
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
    </div>
  );
}