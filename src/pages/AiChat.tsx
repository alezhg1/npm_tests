// src/pages/AiChat.tsx
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';       // <-- ДОБАВИЛИ: для поддержки блоков кода с языком
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import 'katex/dist/katex.min.css';

const ENCODED_KEY = 'c2stb3ItdjEtYTBlODgwYjJkNTk1MDYyZTE1NWFlNWFjMTRkOTdjNTUxNDc2YzE4MTVjM2FjNmNkYTk1ZjU3YjhjMjY5ZDZiNQ==';
const SYSTEM_PROMPT = `Ты — помощник учителя. Отвечай кратко и по делу. 
Если пользователь прислал изображение, проанализируй его содержание (например, реши задачу на фото или опиши график).
ВАЖНО: Если тебе нужно написать математическую формулу, используй синтаксис LaTeX внутри знаков доллара. 
Для строчных формул используй $...$, для блочных (отдельной строкой) используй $$...$$.
Если ты генерируешь HTML-код, оборачивай его в блок кода с указанием языка: \`\`\`html ... \`\`\``;

type MessageContent = 
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

type Message = { 
  role: 'user' | 'assistant'; 
  content: string | MessageContent[];
};

// Компонент для рендеринга одного сообщения
const RenderMessage = ({ msg }: { msg: Message }) => {
  if (msg.role === 'assistant') {
    const contentStr = typeof msg.content === 'string' ? msg.content : '';

    return (
      <div className="prose prose-invert prose-sm max-w-none">
        <ReactMarkdown 
          remarkPlugins={[remarkMath, remarkGfm]} 
          rehypePlugins={[rehypeKatex]}
          components={{
            // Кастомный рендерер для блоков кода с языком html
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || '');
              const lang = match ? match[1] : '';

              // Если это блок кода с языком html — рендерим как iframe
              if (!inline && lang === 'html') {
                const htmlCode = String(children).replace(/\n$/, '');
                return (
                  <div className="my-4 rounded-xl overflow-hidden border border-white/20 shadow-lg bg-black/30">
                    <div className="bg-gray-800 px-3 py-2 text-xs text-gray-400 font-mono border-b border-white/10 flex justify-between items-center">
                      <span>HTML Preview</span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(htmlCode)}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        title="Копировать код"
                      >
                        📋 Copy
                      </button>
                    </div>
                    <iframe
                      srcDoc={htmlCode}
                      title="HTML Preview"
                      className="w-full h-64 bg-white"
                      sandbox="allow-scripts allow-same-origin" // Безопасность: только скрипты и same-origin
                      style={{ border: 'none' }}
                    />
                  </div>
                );
              }

              // Для остальных языков — стандартная подсветка синтаксиса
              return (
                <code className={`${className} bg-black/50 px-1 py-0.5 rounded text-sm`} {...props}>
                  {children}
                </code>
              );
            },
            // Кастомный рендерер для обычных текстовых блоков кода (без языка)
            pre({ children }) {
              return <pre className="bg-black/50 p-4 rounded-xl overflow-x-auto my-4">{children}</pre>;
            }
          }}
        >
          {contentStr}
        </ReactMarkdown>
      </div>
    );
  } else {
    // Сообщение пользователя — может содержать текст и картинки
    try {
      const contentArr = JSON.parse(msg.content as string);
      if (Array.isArray(contentArr)) {
        return (
          <div className="flex flex-col gap-2">
            {contentArr.map((item: MessageContent, idx) => {
              if (item.type === 'image_url') {
                return (
                  <img 
                    key={idx} 
                    src={item.image_url.url} 
                    alt="Uploaded" 
                    className="max-w-full h-auto rounded-lg border border-white/20 shadow-md max-h-64 object-contain bg-black/20"
                  />
                );
              }
              if (item.type === 'text') {
                return <p key={idx}>{item.text}</p>;
              }
              return null;
            })}
          </div>
        );
      }
    } catch {
      return <p>{msg.content as string}</p>;
    }
  }
  return null;
};

export default function AiChat() {
  const [messages, setMessages] = useState<Message[]>([{ 
    role: 'assistant', 
    content: 'Привет! Чем могу помочь? Ты можешь прислать мне фото задачи, и я помогу её решить. Например: $E=mc^2$. Или попроси сгенерировать HTML-страницу — я покажу её превью!' 
  }]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages]);

  useEffect(() => { 
    hljs.highlightAll(); 
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputValue.trim() && !selectedFile)) return;
    
    setIsLoading(true);

    let userContent: MessageContent[] = [];
    
    if (selectedFile && filePreview) {
      userContent.push({
        type: 'image_url',
        image_url: { url: filePreview }
      });
    }
    
    if (inputValue.trim()) {
      userContent.push({
        type: 'text',
        text: inputValue
      });
    }

    const displayMessage: Message = {
      role: 'user',
      content: JSON.stringify(userContent)
    };
    
    setMessages(prev => [...prev, displayMessage]);

    setInputValue('');
    clearFile();

    try {
      const apiKey = atob(ENCODED_KEY);
      
      const apiMessages = messages.map(m => {
        if (typeof m.content === 'string') {
           try {
             const parsed = JSON.parse(m.content);
             if (Array.isArray(parsed) && parsed.some((item: any) => item.type === 'image_url')) {
               return { role: m.role, content: parsed };
             }
           } catch {}
           return { role: m.role, content: [{ type: 'text', text: m.content }] };
        }
        return m;
      });

      apiMessages.push({ role: 'user', content: userContent });

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
            { role: "system", content: [{ type: 'text', text: SYSTEM_PROMPT }] }, 
            ...apiMessages
          ] 
        })
      });

      if (!response.ok) throw new Error(`Ошибка API: ${response.status}`);
      
      const data = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.choices[0].message.content 
        }]);
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
      <div className="fixed top-6 left-6 z-50 text-white/30 text-xs font-mono tracking-widest pointer-events-none select-none">
        v0.1.0
      </div>

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
              <RenderMessage msg={msg} />
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
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex flex-col gap-3">
          
          {filePreview && (
            <div className="relative inline-block self-start group">
              <img src={filePreview} alt="Preview" className="h-20 w-auto rounded-lg border border-white/30 shadow-lg bg-black/20" />
              <button 
                type="button"
                onClick={clearFile}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md hover:bg-red-600 transition-colors"
              >
                ×
              </button>
            </div>
          )}

          <div className="flex gap-3 items-end">
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden" 
            />
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-xl border border-white/20 transition-all btn-press mb-1"
              title="Прикрепить изображение"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
            </button>

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Напишите сообщение или прикрепите фото..."
              className="flex-1 bg-black/50 border border-white/20 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-white/50 transition-colors placeholder-gray-600"
              disabled={isLoading}
              autoFocus
            />
            
            <button 
              type="submit" 
              disabled={(!inputValue.trim() && !selectedFile) || isLoading} 
              className="bg-white text-black font-bold px-6 py-3 rounded-xl hover:bg-gray-200 transition-all duration-300 shadow-lg hover:shadow-white/20 btn-press disabled:opacity-50 disabled:cursor-not-allowed mb-1"
            >
              →
            </button>
          </div>
        </form>
      </footer>
    </div>
  );
}