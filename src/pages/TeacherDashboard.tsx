// src/pages/TeacherDashboard.tsx
import { Link } from 'react-router-dom';

export default function TeacherDashboard() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-4xl font-bold mb-12 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
        Teacher's Assistant
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mb-12">
        {/* Карточка Чат с ИИ */}
        <Link 
          to="/ai-chat"
          className="group relative bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-blue-500 rounded-2xl p-8 transition-all duration-300 shadow-lg hover:shadow-blue-500/20 flex flex-col items-center text-center"
        >
          <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <span className="text-3xl">🤖</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Чат с ИИ</h2>
          <p className="text-gray-400">Помощь в генерации идей и вопросов для уроков</p>
        </Link>

        {/* Карточка Создать Квиз */}
        <Link 
          to="/create-quiz"
          className="group relative bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-green-500 rounded-2xl p-8 transition-all duration-300 shadow-lg hover:shadow-green-500/20 flex flex-col items-center text-center"
        >
          <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <span className="text-3xl">📝</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Создать Квиз</h2>
          <p className="text-gray-400">Создание интерактивных тестов для учеников</p>
        </Link>
      </div>

      {/* Кнопка для учеников */}
      <Link 
        to="/join"
        className="bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-purple-500 rounded-2xl p-6 transition-all duration-300 shadow-lg hover:shadow-purple-500/20 flex flex-col items-center text-center max-w-md w-full"
      >
        <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">🎓</span>
        </div>
        <h2 className="text-xl font-bold mb-1">Я ученик</h2>
        <p className="text-gray-400 text-sm">Войти по коду и пройти тест</p>
      </Link>
    </div>
  );
}