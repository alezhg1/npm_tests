// src/pages/CreateQuiz.tsx
import { Link } from 'react-router-dom';

export default function CreateQuiz() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Создание нового квиза</h1>
        <Link to="/" className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition">
          ← Назад
        </Link>
      </div>
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <p className="text-lg text-gray-300">Здесь будет форма для:</p>
        <ul className="list-disc list-inside mt-4 space-y-2 text-gray-400">
          <li>Ввода названия квиза</li>
          <li>Добавления вопросов с фото</li>
          <li>Указания правильных ответов</li>
        </ul>
      </div>
    </div>
  );
}