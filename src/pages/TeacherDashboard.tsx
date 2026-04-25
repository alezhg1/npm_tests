// src/pages/TeacherDashboard.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function TeacherDashboard() {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const features = [
    {
      id: 'ai-chat',
      name: 'Чат с ИИ',
      description: 'Генерация идей, создание вопросов и планирование уроков с помощью искусственного интеллекта. Поддержка Markdown и предпросмотр кода.',
      link: '/ai-chat',
      icon: 'AI'
    },
    {
      id: 'create-quiz',
      name: 'Создать Квиз',
      description: 'Конструктор интерактивных тестов. Добавляйте вопросы, изображения, устанавливайте правильные ответы и получайте уникальный код для учеников.',
      link: '/create-quiz',
      icon: 'QZ'
    },
    {
      id: 'student-join',
      name: 'Я ученик',
      description: 'Быстрый вход в активную сессию по 6-значному коду. Прохождение теста в реальном времени с мгновенным подсчетом баллов.',
      link: '/join',
      icon: 'ST'
    }
  ];

  return (
    <div className="relative text-white font-sans antialiased selection:bg-white/20">
      
      {/* --- ВЕРСИЯ ПРИЛОЖЕНИЯ --- */}
      <div className="fixed top-6 left-6 z-50 text-white/30 text-xs font-mono tracking-widest pointer-events-none select-none">
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
        
        {/* Декоративные пятна */}
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-purple-500/10 rounded-full blur-[180px] pointer-events-none mix-blend-screen"></div>
      </div>

      {/* --- КОНТЕНТ --- */}
      <div className="relative z-10">
        
        {/* СЕКЦИЯ 1: ИНТРО */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
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
              
              {/* Liquid Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </a>
          </div>
        </section>

        {/* СЕКЦИЯ 2: ВОЗМОЖНОСТИ */}
        <section id="features" className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
          <div className="max-w-6xl w-full">
            <div className="text-center mb-16 animate-fade-in-up">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">Инструменты</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto rounded-full"></div>
            </div>

            {!selectedFeature ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                  <button
                    key={feature.id}
                    onClick={() => setSelectedFeature(feature.id)}
                    className={`group relative glass-panel rounded-3xl p-8 transition-all duration-500 flex flex-col items-center text-center h-full hover:bg-white/10 hover:border-white/40 hover:shadow-[0_8px_32px_0_rgba(255,255,255,0.1)] btn-press animate-fade-in-up`}
                    style={{ animationDelay: `${index * 100}ms` }} // Каскадная анимация появления
                  >
                    {/* Liquid Glass Inner Shine */}
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent opacity-50 pointer-events-none rounded-t-3xl"></div>
                    
                    <div className="relative z-10 w-24 h-24 bg-black/40 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-white/20 shadow-inner ring-1 ring-white/10">
                      <span className="text-2xl font-bold text-gray-300 group-hover:text-white">{feature.icon}</span>
                    </div>
                    
                    <h3 className="relative z-10 text-2xl font-bold text-white mb-3 drop-shadow-md">{feature.name}</h3>
                    <p className="relative z-10 text-sm text-gray-400 group-hover:text-gray-200 transition-colors">
                      Нажмите для подробностей
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="animate-fade-in-up max-w-3xl mx-auto">
                <div className="glass-panel rounded-3xl p-8 md:p-12 relative overflow-hidden">
                  
                  {/* Top Highlight for Liquid Effect */}
                  <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/10 to-transparent opacity-30 pointer-events-none"></div>

                  <button 
                    onClick={() => setSelectedFeature(null)}
                    className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 z-20 btn-press"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>

                  {(() => {
                    const feature = features.find(f => f.id === selectedFeature);
                    if (!feature) return null;
                    return (
                      <div className="text-center relative z-10">
                        <div className="w-28 h-28 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/30 shadow-inner ring-1 ring-white/20">
                          <span className="text-3xl font-bold text-white drop-shadow-md">{feature.icon}</span>
                        </div>
                        
                        <h3 className="text-4xl font-bold text-white mb-6 drop-shadow-lg">{feature.name}</h3>
                        
                        <p className="text-lg text-gray-300 mb-10 leading-relaxed max-w-xl mx-auto">
                          {feature.description}
                        </p>
                        
                        <Link 
                          to={feature.link}
                          className="group relative inline-flex items-center gap-2 px-10 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-white/30 transform hover:-translate-y-1 overflow-hidden btn-press"
                        >
                          <span className="relative z-10">Запустить модуль</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative z-10 group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                          
                          {/* Shine effect on CTA button */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-shine"></div>
                        </Link>
                      </div>
                    );
                  })()}
                </div>
                
                <div className="text-center mt-8">
                  <button 
                    onClick={() => setSelectedFeature(null)}
                    className="text-gray-500 hover:text-white text-sm uppercase tracking-widest transition-colors border-b border-transparent hover:border-white pb-1 btn-press"
                  >
                    Вернуться к списку
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <footer className="py-12 text-center text-gray-600 text-sm bg-gradient-to-t from-black to-transparent">
          <p>© 2026 Teacher's Assistant. All rights reserved.</p>
        </footer>

      </div>
    </div>
  );
}