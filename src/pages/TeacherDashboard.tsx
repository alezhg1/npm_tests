// src/pages/TeacherDashboard.tsx
import { Link } from 'react-router-dom';

export default function TeacherDashboard() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in">
      {/* Логотип/Заголовок */}
      <div className="mb-12 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-4 gradient-text">
          Teacher's Assistant
        </h1>
        <p className="text-gray-400 text-lg max-w-md mx-auto">
          Создавайте интерактивные квизы и получайте помощь от ИИ
        </p>
      </div>
      
      {/* Карточки действий */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl mb-12">
        {/* Карточка Чат с ИИ */}
        <Link 
          to="/ai-chat"
          className="group card p-8 hover:border-indigo-500/50 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-all"></div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/25">
              <span className="text-3xl">🤖</span>
            </div>
            
            <h2 className="text-2xl font-bold mb-3 text-white group-hover:text-indigo-300 transition-colors">
              Чат с ИИ
            </h2>
            
            <p className="text-gray-400 leading-relaxed">
              Получайте помощь в генерации идей, создании вопросов и планировании уроков с помощью искусственного интеллекта
            </p>
            
            <div className="mt-6 flex items-center text-indigo-400 font-semibold group-hover:text-indigo-300 transition-colors">
              Начать чат
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </div>
          </div>
        </Link>

        {/* Карточка Создать Квиз */}
        <Link 
          to="/create-quiz"
          className="group card p-8 hover:border-purple-500/50 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-purple-500/20 transition-all"></div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/25">
              <span className="text-3xl">📝</span>
            </div>
            
            <h2 className="text-2xl font-bold mb-3 text-white group-hover:text-purple-300 transition-colors">
              Создать Квиз
            </h2>
            
            <p className="text-gray-400 leading-relaxed">
              Создавайте интерактивные тесты с вопросами, изображениями и автоматической проверкой ответов для ваших учеников
            </p>
            
            <div className="mt-6 flex items-center text-purple-400 font-semibold group-hover:text-purple-300 transition-colors">
              Создать квиз
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </div>
          </div>
        </Link>
      </div>

      {/* Кнопка для учеников */}
      <Link 
        to="/join"
        className="group card p-6 hover:border-green-500/50 relative overflow-hidden max-w-md w-full animate-slide-up"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-green-500/20 transition-all"></div>
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-green-500/25">
            <span className="text-2xl">🎓</span>
          </div>
          
          <div>
            <h2 className="text-xl font-bold text-white group-hover:text-green-300 transition-colors">
              Я ученик
            </h2>
            <p className="text-gray-400 text-sm">
              Войти по коду и пройти тест
            </p>
          </div>
          
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto text-gray-400 group-hover:text-green-400 group-hover:translate-x-1 transition-all"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </div>
      </Link>
    </div>
  );
}