// src/pages/AiChat.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function AiChat() {
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', content: 'Привет! Я твой помощник. Чем могу помочь сегодня?' }
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Добавляем сообщение пользователя
    const newMsg = { id: Date.now(), role: 'user', content: inputValue };
    setMessages(prev => [...prev, newMsg]);
    setInputValue('');

    // Имитация ответа (заглушка)
    setTimeout(() => {
      const aiResponse = { id: Date.now() + 1, role: 'assistant', content: 'Это тестовый ответ ИИ. В будущем здесь будет реальная интеграция.' };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-gray-400 hover:text-white text-xl">←</Link>
          <h1 className="font-bold text-lg">Teacher's Assistant AI</h1>
        </div>
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'
            }`}>
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
      </main>

      {/* Input Area */}
      <footer className="bg-gray-800 p-4 border-t border-gray-700">
        <form onSubmit={handleSend} className="flex gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Напишите сообщение..."
            className="flex-1 bg-gray-900 border border-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition"
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition">
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}