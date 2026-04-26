// src/pages/TeacherDashboard.tsx
import { useRef } from 'react';
import { Link } from 'react-router-dom';

export default function TeacherDashboard() {
  // Создаем рефы для каждой секции
  const aiChatRef = useRef<HTMLDivElement>(null);
  const createQuizRef = useRef<HTMLDivElement>(null);
  const studentJoinRef = useRef<HTMLDivElement>(null);

  // Функция для плавной прокрутки к элементу
  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const features = [
    {
      id: 'ai-chat',
      name: 'Чат с ИИ',
      description: 'Генерация идей, создание вопросов и планирование уроков с помощью искусственного интеллекта.',
      link: '/ai-chat',
      icon: 'AI',
      ref: aiChatRef,
      image: '/ai.gif' // Путь к изображению
    },
    {
      id: 'create-quiz',
      name: 'Создать Квиз',
      description: 'Конструктор интерактивных тестов с вопросами, изображениями и автоматической проверкой.',
      link: '/create-quiz',
      icon: 'QZ',
      ref: createQuizRef,
      image: '/quiz.png' // Путь к изображению
    },
    {
      id: 'student-join',
      name: 'Я ученик',
      description: 'Быстрый вход в активную сессию по 6-значному коду. Прохождение теста в реальном времени.',
      link: '/join',
      icon: 'ST',
      ref: studentJoinRef,
      image: '/student.png' // Путь к изображению
    }
  ];

  return (
    <div className="relative text-white font-sans antialiased selection:bg-white/20 min-h-screen flex flex-col">
      
      {/* --- ВЕРХНЕЕ МЕНЮ --- */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-shadow">
              <span className="text-white font-bold text-sm">TA</span>
            </div>
            <span className="font-bold text-lg tracking-tight hidden sm:block">Teacher's Assistant</span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link 
              to="/create-quiz" 
              className="text-gray-300 hover:text-white font-medium px-4 py-2 rounded-lg hover:bg-white/10 transition-all btn-press text-sm sm:text-base"
            >
              Создать квиз
            </Link>
            <Link 
              to="/join" 
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-4 py-2 rounded-lg transition-all duration-200 btn-press text-sm sm:text-base"
            >
              Войти как ученик
            </Link>
          </nav>
        </div>
      </header>

      {/* --- ВЕРСИЯ ПРИЛОЖЕНИЯ --- */}
      <div className="fixed top-20 left-6 z-40 text-white/30 text-xs font-mono tracking-widest pointer-events-none select-none">
        v0.1.0
      </div>

      {/* --- СТАТИЧНЫЙ ФОН --- */}
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

      {/* --- КОНТЕНТ --- */}
      <div className="relative z-10 flex-1 pt-24">
        
        {/* СЕКЦИЯ 1: ИНТРО */}
        <section className="min-h-[calc(100vh-6rem)] flex flex-col items-center justify-center px-6 py-20">
          <div className="max-w-4xl text-center animate-fade-in-up">
            <div className="inline-block mb-8 px-6 py-2 border border-white/30 rounded-full bg-white/10 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              <span className="text-xs uppercase tracking-[0.2em] text-gray-200 font-semibold">Education Platform</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold mb-8 tracking-tight leading-tight drop-shadow-2xl">
              Teacher's <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-500">Assistant</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed font-light drop-shadow-md">
              Создавайте квизы и получайте помощь от ИИ в минималистичном интерфейсе.
            </p>
            
            <a 
              href="#features" 
              className="group relative inline-flex items-center gap-3 px-10 py-5 bg-white/10 hover:bg-white/20 border border-white/30 rounded-full text-white font-bold text-lg transition-all duration-500 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:shadow-[0_8px_32px_0_rgba(255,255,255,0.1)] overflow-hidden btn-press"
            >
              <span className="relative z-10">Исследовать возможности</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative z-10 group-hover:translate-y-1 transition-transform"><polyline points="6 9 12 15 18 9"></polyline></svg>
              
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </a>
          </div>
        </section>

        {/* СЕКЦИЯ 2: ВОЗМОЖНОСТИ (Карточки) */}
        <section id="features" className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 animate-fade-in-up">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">Инструменты</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <button
                  key={feature.id}
                  onClick={() => scrollToSection(feature.ref)}
                  className={`group relative glass-panel rounded-3xl p-8 transition-all duration-500 flex flex-col items-center text-center h-full hover:bg-white/10 hover:border-white/40 hover:shadow-[0_8px_32px_0_rgba(255,255,255,0.1)] btn-press animate-fade-in-up`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent opacity-50 pointer-events-none rounded-t-3xl"></div>
                  
                  <div className="relative z-10 w-24 h-24 bg-black/40 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-white/20 shadow-inner ring-1 ring-white/10">
                    <span className="text-2xl font-bold text-gray-300 group-hover:text-white">{feature.icon}</span>
                  </div>
                  
                  <h3 className="relative z-10 text-2xl font-bold text-white mb-3 drop-shadow-md">{feature.name}</h3>
                  <p className="relative z-10 text-sm text-gray-400 group-hover:text-gray-200 transition-colors">
                    Нажмите, чтобы узнать больше
                  </p>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* --- ДЕТАЛЬНЫЕ СЕКЦИИ --- */}
        
        {/* СЕКЦИЯ 3: ЧАТ С ИИ */}
        <section ref={aiChatRef} className="min-h-screen py-20 px-6 flex items-center">
          <div className="max-w-6xl mx-auto w-full glass-panel rounded-3xl p-8 md:p-12 relative overflow-hidden animate-fade-in-up">
             <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/10 to-transparent opacity-30 pointer-events-none"></div>
             
             <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                {/* Текст слева */}
                <div className="flex-1 text-left">
                  
                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">Чат с ИИ</h3>
                  <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                    Ваш персональный ассистент для создания образовательного контента. Генерируйте вопросы, объясняйте сложные темы и получайте идеи для уроков за секунды. Поддержка Markdown и предпросмотр кода.
                  </p>
                  <Link 
                    to="/ai-chat"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-all duration-300 shadow-lg hover:shadow-white/30 transform hover:-translate-y-1 btn-press"
                  >
                    Открыть чат
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </Link>
                </div>
                
                {/* Изображение справа */}
                <div className="flex-1 w-full">
                   <div className="aspect-video bg-black/50 rounded-xl border border-white/10 overflow-hidden shadow-2xl relative group">
                      <img 
                        src={features[0].image} 
                        alt="AI Chat Interface" 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                   </div>
                </div>
             </div>
          </div>
        </section>

        {/* СЕКЦИЯ 4: СОЗДАТЬ КВИЗ */}
        <section ref={createQuizRef} className="min-h-screen py-20 px-6 flex items-center">
          <div className="max-w-6xl mx-auto w-full glass-panel rounded-3xl p-8 md:p-12 relative overflow-hidden animate-fade-in-up">
             <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/10 to-transparent opacity-30 pointer-events-none"></div>
             
             <div className="relative z-10 flex flex-col md:flex-row-reverse items-center gap-12">
                {/* Текст справа (для разнообразия) */}
                <div className="flex-1 text-left md:text-right">
                  
                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">Создать Квиз</h3>
                  <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                    Мощный конструктор тестов. Добавляйте текст, изображения, устанавливайте правильные ответы и получайте уникальный код для быстрого подключения учеников. Полная статистика и защита от списывания.
                  </p>
                  <Link 
                    to="/create-quiz"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-all duration-300 shadow-lg hover:shadow-white/30 transform hover:-translate-y-1 btn-press"
                  >
                    Начать создание
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </Link>
                </div>
                
                {/* Изображение слева */}
                <div className="flex-1 w-full">
                   <div className="aspect-video bg-black/50 rounded-xl border border-white/10 overflow-hidden shadow-2xl relative group">
                      <img 
                        src={features[1].image} 
                        alt="Quiz Creator Interface" 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                         <span className="text-white font-medium">Редактор вопросов</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </section>

        {/* СЕКЦИЯ 5: Я УЧЕНИК */}
        <section ref={studentJoinRef} className="min-h-screen py-20 px-6 flex items-center">
          <div className="max-w-6xl mx-auto w-full glass-panel rounded-3xl p-8 md:p-12 relative overflow-hidden animate-fade-in-up">
             <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/10 to-transparent opacity-30 pointer-events-none"></div>
             
             <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                {/* Текст слева */}
                <div className="flex-1 text-left">
                  
                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">Я ученик</h3>
                  <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                    Простой и быстрый вход в тест. Введите 6-значный код, который дал учитель, и начните проходить задания. Результаты видны сразу, а система анти-списывания обеспечивает честность.
                  </p>
                  <Link 
                    to="/join"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-all duration-300 shadow-lg hover:shadow-white/30 transform hover:-translate-y-1 btn-press"
                  >
                    Войти по коду
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </Link>
                </div>
                
                {/* Изображение справа */}
                <div className="flex-1 w-full">
                   <div className="aspect-video bg-black/50 rounded-xl border border-white/10 overflow-hidden shadow-2xl relative group">
                      <img 
                        src={features[2].image} 
                        alt="Student Join Interface" 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                         <span className="text-white font-medium">Экран входа ученика</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </section>

        <footer className="py-12 text-center text-gray-600 text-sm bg-gradient-to-t from-black to-transparent">
          <p>© 2026 Teacher's Assistant. All rights reserved.</p>
        </footer>

      </div>
    </div>
  );
}