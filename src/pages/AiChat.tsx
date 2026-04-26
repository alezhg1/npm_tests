// src/pages/AiChat.tsx
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';       // <-- ДОБАВИЛИ: парсер для LaTeX
import rehypeKatex from 'rehype-katex';     // <-- Рендерер для LaTeX
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import 'katex/dist/katex.min.css';

const ENCODED_KEY = 'c2stb3ItdjEtYTBlODgwYjJkNTk1MDYyZTE1NWFlNWFjMTRkOTdjNTUxNDc2YzE4MTVjM2FjNmNkYTk1ZjU3YjhjMjY5ZDZiNQ==';
const SYSTEM_PROMPT = `Ты — помощник учителя. Отвечай кратко и по делу. 
ВАЖНО: Если тебе нужно написать математическую формулу, используй синтаксис LaTeX внутри знаков доллара. 
Для строчных формул используй $...$, для блочных (отдельной строкой) используй $$...$$. 
Пример: Площадь круга равна $S = \pi r^2$. Квадратное уравнение: $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$`;

type Message = { role: 'user' | 'assistant'; content: string };

export default function AiChat() {
  const [messages, setMessages] = useState<Message[]>([{ 
    role: 'assistant', 
    content: 'Привет! Чем могу помочь?' 
  }]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages]);

  useEffect(() => { 
    hljs.highlightAll(); 
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setIsLoading(true);

    const userMsg = inputValue;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInputValue('');

    try {
      const apiKey = atob(ENCODED_KEY);
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${apiKey}`, 
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.href,
          "X-Title": "Teacher Assistant"
        },
        body: JSON.stringify({ 
          model: "google/gemini-2.0-flash-001", 
          messages: [
            { role: "system", content: SYSTEM_PROMPT }, 
            ...messages.map(m => ({ role: m.role, content: m.content })), 
            { role: "user", content: userMsg } 
          ] 
        })
      });

      if (!response.ok) throw new Error(`Ошибка API: ${response.status}`);
      
      const data = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.choices[0].message.content }]);
      } else {
        throw new Error("Пустой ответ от нейросети");
      }

    } catch (error: any) {
      console.error("AI Chat Error:", error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `⚠️ **Ошибка:** ${error.message}. Проверьте консоль.` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black relative">
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

      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-gray-500 hover:text-white btn-press">←</Link>
          <span className="font-bold drop-shadow-md">AI Assistant</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-4 max-w-4xl mx-auto w-full z-10 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
            <div className={`max-w-[85%] p-5 rounded-2xl shadow-lg ${
              msg.role === 'user' 
                ? 'bg-white text-black border border-white/20' 
                : 'glass-panel text-gray-200 border border-white/10'
            }`}>
              {msg.role === 'assistant' ? (
                // ✅ ИСПРАВЛЕНИЕ: Добавили remarkMath в remarkPlugins
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkMath]}   // <-- Парсит $...$ и $$...$$
                    rehypePlugins={[rehypeKatex]}  // <-- Рендерит их через KaTeX
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
             <div className="glass-panel px-4 py-3 rounded-2xl flex items-center gap-2 text-gray-400 text-sm">
               <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
               <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
               <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
             </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 border-t border-white/10 bg-black/50 backdrop-blur-md z-10">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Напишите сообщение..."
            className="flex-1 bg-black/50 border border-white/20 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-white/50 transition-colors placeholder-gray-600"
            disabled={isLoading}
            autoFocus
          />
          <button 
            type="submit" 
            disabled={!inputValue.trim() || isLoading} 
            className="bg-white text-black font-bold px-6 py-3 rounded-xl hover:bg-gray-200 transition-all duration-300 shadow-lg hover:shadow-white/20 btn-press disabled:opacity-50 disabled:cursor-not-allowed"
          >
            →
          </button>
        </form>
      </footer>
    </div>
  );
}