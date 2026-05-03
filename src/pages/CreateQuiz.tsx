// src/pages/CreateQuiz.tsx
import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
// Убираем импорт supabase, он нам больше не нужен для логики, только если где-то остался
import { createQuiz, saveQuestion, uploadImage } from '../api/client'; 

type Question = {
  text: string;
  image: File | null;
  correctAnswer: string;
};

export default function CreateQuiz() {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    { text: '', image: null, correctAnswer: '' }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<any>(null);
  
  const imagePreviewRefs = useRef<{[key: number]: string}>({});

  const addQuestion = () => {
    setQuestions([...questions, { text: '', image: null, correctAnswer: '' }]);
    setTimeout(() => {
      const newQuestionIndex = questions.length;
      const element = document.getElementById(`question-${newQuestionIndex}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
    
    if (field === 'image' && value) {
      const reader = new FileReader();
      reader.onloadend = () => {
        imagePreviewRefs.current[index] = reader.result as string;
        setQuestions([...newQuestions]); 
      };
      reader.readAsDataURL(value);
    } else if (field === 'image' && value === null) {
      delete imagePreviewRefs.current[index];
    }
  };

  const handleFileDropOrPaste = (index: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, загрузите только изображения.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Файл слишком большой. Максимальный размер: 5 МБ.');
      return;
    }
    updateQuestion(index, 'image', file);
  };

  const generateJoinCode = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleSaveQuiz = async () => {
    if (!title.trim()) return alert('Введите название квиза!');
    
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim() || !questions[i].correctAnswer.trim()) {
        alert(`Заполните текст вопроса и правильный ответ для вопроса №${i + 1}`);
        return;
      }
    }

    setIsSaving(true);
    console.log('🚀 Start saving quiz via API...');

    try {
      const code = generateJoinCode();
      
      // 1. Создаем квиз через НАШ API
      console.log('1️⃣ Creating Quiz via API...');
      const createdQuiz = await createQuiz({
        title: title,
        join_code: code,
        status: 'waiting',
        teacher_id: null 
      });

      console.log('2️⃣ Quiz Created ID:', createdQuiz.id);
      setQuizData(createdQuiz);

      // 2. Сохраняем вопросы
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        let imageUrl = '';

        // --- ЗАГРУЗКА КАРТИНКИ ЧЕРЕЗ API ---
        if (q.image) {
          console.log(`3️⃣ Uploading image for question ${i + 1} via API...`);
          
          // Конвертируем File в Base64
          const base64String = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(q.image!);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
          });

          // Генерируем уникальное имя файла
          const fileExt = q.image.name.split('.').pop();
          const fileName = `q${i}_${Date.now()}.${fileExt}`;

          try {
            // Вызываем наш API эндпоинт
            imageUrl = await uploadImage(base64String as string, fileName, createdQuiz.id);
            console.log('4️⃣ Image Uploaded via API. URL:', imageUrl);
          } catch (err) {
             console.error('Image Upload Error:', err);
             throw new Error('Не удалось загрузить изображение через сервер. Попробуйте еще раз.');
          }
        }

        // 5. Сохраняем вопрос через НАШ API
        console.log(`5️⃣ Saving question ${i + 1} via API...`);
        await saveQuestion({
          quiz_id: createdQuiz.id,
          question_text: q.text,
          image_url: imageUrl,
          correct_answer: q.correctAnswer,
          order_index: i
        });
        
        console.log('6️⃣ Question Saved');
      }

      console.log('✅ All done!');
      setJoinCode(code);
      
    } catch (error: any) {
      console.error('❌ Final Error:', error);
      alert(`Ошибка: ${error.message}. Проверьте консоль (F12) для деталей.`);
    } finally {
      setIsSaving(false);
      console.log('🏁 Saving process finished.');
    }
  };

  // Экран успешного создания (без изменений)
  if (joinCode && quizData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative">
        <div className="fixed top-6 left-6 z-50 text-white/30 text-xs font-mono tracking-widest pointer-events-none select-none">v0.1.0</div>
        <div className="fixed inset-0 z-0">
          <img src="/create_page.png" alt="Background" className="w-full h-full object-cover opacity-80 contrast-125 brightness-110 saturate-110" />
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-purple-500/10 rounded-full blur-[180px] pointer-events-none mix-blend-screen"></div>
        </div>
        <div className="glass-panel p-8 md:p-12 max-w-md w-full text-center relative z-10 animate-fade-in-up">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h2 className="text-3xl font-bold mb-2 text-white drop-shadow-lg">Квиз создан!</h2>
          <p className="text-gray-400 mb-8">Ученики могут войти по этому коду:</p>
          <div className="bg-black/50 border-2 border-dashed border-white/20 rounded-xl py-6 px-4 mb-8 group hover:border-white/40 transition-colors">
            <span className="text-5xl font-mono font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">{joinCode}</span>
          </div>
          <div className="space-y-3">
            <Link to={`/teacher/monitor/${quizData.id}`} className="block w-full bg-white text-black font-bold py-4 rounded-lg hover:bg-gray-200 transition-all duration-300 shadow-lg hover:shadow-white/20 btn-press">👁️ Следить за квизом (Realtime)</Link>
            <Link to="/" className="block w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-4 rounded-lg transition-all duration-300 btn-press">На главную</Link>
          </div>
        </div>
      </div>
    );
  }

  // Форма создания (Drag & Drop и Paste остаются без изменений)
  return (
    <div className="min-h-screen bg-black relative p-6 pb-32">
      <div className="fixed top-6 left-6 z-50 text-white/30 text-xs font-mono tracking-widest pointer-events-none select-none">v0.1.0</div>
      <div className="fixed inset-0 z-0">
        <img src="/create_page.png" alt="Background" className="w-full h-full object-cover opacity-80 contrast-125 brightness-110 saturate-110" />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-purple-500/10 rounded-full blur-[180px] pointer-events-none mix-blend-screen"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto animate-fade-in-up pb-32">
        <div className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold drop-shadow-lg mb-2">Новый квиз</h1>
            <p className="text-gray-400 text-lg">Создайте интерактивный тест для ваших учеников</p>
          </div>
          <Link to="/" className="text-gray-500 hover:text-white flex items-center gap-2 transition-colors btn-press px-4 py-2 rounded-lg hover:bg-white/5">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Отмена
          </Link>
        </div>

        <div className="glass-panel p-8 rounded-3xl mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            </div>
            <label className="text-xl font-semibold text-white">Основная информация</label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">Название квиза</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: История Древнего Рима"
              className="w-full bg-black/50 border border-white/20 rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg"
            />
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Вопросы ({questions.length})</h2>
            </div>
            <button onClick={addQuestion} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-4 py-2 rounded-lg transition-all duration-200 btn-press">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Добавить вопрос
            </button>
          </div>

          {questions.map((q, index) => (
            <div 
              key={index} 
              id={`question-${index}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileDropOrPaste(index, e.dataTransfer.files[0]);
                }
              }}
              onPaste={(e) => {
                const items = e.clipboardData?.items;
                if (items) {
                  for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf('image') !== -1) {
                      const blob = items[i].getAsFile();
                      if (blob) handleFileDropOrPaste(index, blob);
                      break;
                    }
                  }
                }
              }}
              className="glass-panel p-6 rounded-3xl relative group hover:border-indigo-500/30 transition-all duration-300 animate-fade-in-up border-2 border-dashed border-transparent hover:border-indigo-500/30"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="absolute -top-3 left-6 bg-black/80 backdrop-blur-sm border border-white/20 px-4 py-1.5 rounded-full text-sm font-bold text-gray-300 flex items-center gap-2 shadow-lg">
                <span className="w-6 h-6 bg-indigo-500/20 rounded-full flex items-center justify-center text-xs text-indigo-300">{index + 1}</span>
                Вопрос
              </div>
              
              <div className="mb-6 mt-4">
                <label className="block text-xs font-medium text-gray-500 mb-2 ml-1 uppercase tracking-wide flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                  Текст задания
                </label>
                <textarea
                  value={q.text}
                  onChange={(e) => updateQuestion(index, 'text', e.target.value)}
                  placeholder="Опишите задание..."
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none min-h-[100px]"
                  rows={3}
                />
              </div>

              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-500 mb-2 ml-1 uppercase tracking-wide flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  Изображение (необязательно) — можно перетащить сюда или вставить (Ctrl+V)
                </label>
                
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="relative flex-1 w-full">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => updateQuestion(index, 'image', e.target.files?.[0] || null)}
                      className="w-full text-sm text-gray-400 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer border border-white/10 rounded-lg p-1"
                    />
                  </div>
                  
                  {imagePreviewRefs.current[index] && (
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 group/image">
                      <img 
                        src={imagePreviewRefs.current[index]} 
                        alt="Preview" 
                        className="w-full h-full object-cover rounded-lg border border-white/20 shadow-lg"
                      />
                      <button
                        onClick={() => updateQuestion(index, 'image', null)}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg opacity-0 group-hover/image:opacity-100 transition-opacity btn-press"
                        title="Удалить изображение"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
                
                {q.image && !imagePreviewRefs.current[index] && (
                  <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Файл выбран: {q.image.name}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 ml-1 uppercase tracking-wide flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  Правильный ответ
                </label>
                <input
                  type="text"
                  value={q.correctAnswer}
                  onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                  placeholder="Ответ для проверки"
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-white/10 p-4 z-20">
          <div className="max-w-4xl mx-auto flex gap-4">
            <button onClick={addQuestion} className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 btn-press">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Добавить вопрос
            </button>
            <button onClick={handleSaveQuiz} disabled={isSaving} className="flex-[2] bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 btn-press">
              {isSaving ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Сохранение...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                  Создать квиз
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}