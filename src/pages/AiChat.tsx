// src/pages/AiChat.tsx
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

// Твой API ключ из HTML (закодированный в base64)
const ENCODED_KEY = "c2stb3ItdjEtZGJjZDA1Mzg1YzY3ZjllZWY1NjExNGNlM2Y5OGI5YjhiOTZlOGI1MGU2NDQ1OGRlMGFlMjNkMjkxZmYxMDhjMA==";

const SYSTEM_PROMPT = `Ты — интеллектуальный помощник учителя информатики и веб-разработчик.

Твои инструкции:
1. Если пользователь просит код (HTML, CSS, JS), всегда используй блоки кода с указанием языка (например, \`\`\`html).
2. Если код содержит HTML, старайся включать в него и CSS (в теге <style>), и JS (в теге <script>), чтобы он работал как единый файл.
3. Если пользователь присылает картинку с задачей:
   - Распознай текст.
   - Реши задачу подробно.
   - Если просят "похожую", составь аналогичную задачу.
4. Всегда предоставляй решение и ответ четко и структурировано.`;

// Тип сообщения для UI (простой текст)
type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

// Тип сообщения для API (может содержать картинки)
type ApiMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>;
};

// Тип для загруженных изображений
type UploadedImage = {
  data: string; // base64
  name: string;
};

export default function AiChat() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Привет! Я твой помощник-учитель. Чем могу помочь сегодня? Могу составить тест, объяснить тему или написать код.' 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // История для API (хранит сырые данные, включая картинки)
  const [apiHistory, setApiHistory] = useState<ApiMessage[]>([
    { role: 'system', content: SYSTEM_PROMPT }
  ]);
  
  const [selectedImages, setSelectedImages] = useState<UploadedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Автопрокрутка вниз
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Подсветка кода после рендера
  useEffect(() => {
    hljs.highlightAll();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() && selectedImages.length === 0) return;

    setIsLoading(true);

    // Формируем контент для API
    let apiContent: any[] = [];

    // Добавляем изображения
    if (selectedImages.length > 0) {
      selectedImages.forEach(img => {
        apiContent.push({
          type: "image_url",
          image_url: { url: img.data }
        });
      });
    }

    // Добавляем текст
    if (inputValue.trim()) {
      apiContent.push({
        type: "text",
        text: inputValue
      });
    }

    // Для отображения в UI мы просто показываем текст и картинки отдельно
    // Но в state messages мы сохраняем упрощенную версию для рендеринга
    let uiContent = inputValue;
    if (selectedImages.length > 0) {
      uiContent += `\n\n*[Прикреплено изображений: ${selectedImages.length}]*`;
    }

    const newUserMsg: Message = { role: 'user', content: uiContent };
    setMessages(prev => [...prev, newUserMsg]);
    
    // Обновляем историю API
    const newApiHistoryItem: ApiMessage = { role: 'user', content: apiContent };
    setApiHistory(prev => [...prev, newApiHistoryItem]);

    // Очищаем поля
    setInputValue('');
    setSelectedImages([]);

    try {
      const apiKey = atob(ENCODED_KEY);
      
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.href,
          "X-Title": "Teacher Assistant React"
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-001",
          messages: [...apiHistory, newApiHistoryItem]
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      const aiResponseText = data.choices[0].message.content;

      // Добавляем ответ ИИ
      const newAiMsg: Message = { role: 'assistant', content: aiResponseText };
      setMessages(prev => [...prev, newAiMsg]);
      setApiHistory(prev => [...prev, { role: 'assistant', content: aiResponseText }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `**Ошибка:** Не удалось связаться с ИИ. Проверь консоль или баланс OpenRouter.` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Обработка выбора файлов
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const base64 = await readFileAsBase64(file);
        // Исправлено: используем 'data' вместо 'base64'
        setSelectedImages(prev => [...prev, { data: base64, name: file.name }]);
      } catch (err) { 
        console.error("Ошибка чтения файла", err); 
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Функция для рендеринга Markdown с поддержкой блоков кода
  // Возвращает объект { __html: string } для dangerouslySetInnerHTML
  const renderMarkdownToHtml = (text: string) => {
    marked.setOptions({
      highlight: function(code: string, lang: string | undefined) {
        const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      },
      langPrefix: 'hljs language-',
    } as any);

    const rawHtml = marked.parse(text) as string;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = rawHtml;

    tempDiv.querySelectorAll('pre').forEach((pre) => {
      const codeBlock = pre.querySelector('code');
      if (!codeBlock) return;

      const langClass = Array.from(codeBlock.classList).find(c => c.startsWith('language-'));
      const langName = langClass ? langClass.replace('language-', '') : 'code';

      const header = document.createElement('div');
      header.className = 'flex justify-between items-center px-3 py-1 bg-gray-800 border-b border-gray-700 text-xs text-gray-400 rounded-t-lg';
      
      const langLabel = document.createElement('span');
      langLabel.innerText = langName.toUpperCase();
      
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'flex gap-2';

      const copyBtn = document.createElement('button');
      copyBtn.className = 'hover:text-white transition-colors flex items-center gap-1';
      copyBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy`;
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(codeBlock.innerText);
        copyBtn.innerHTML = `Copied!`;
        setTimeout(() => copyBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy`, 2000);
      };
      actionsDiv.appendChild(copyBtn);

      if (['html', 'htm', 'css', 'js', 'javascript', 'svg'].includes(langName.toLowerCase())) {
        const previewBtn = document.createElement('button');
        previewBtn.className = 'text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 font-bold';
        previewBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> Preview`;
        
        previewBtn.onclick = () => {
          const existingPreview = pre.nextElementSibling;
          if (existingPreview && existingPreview.classList.contains('code-preview')) {
            existingPreview.remove();
            previewBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> Preview`;
          } else {
            const codeContent = codeBlock.innerText;
            let fullHtml = codeContent;
            
            if (langName.toLowerCase() === 'css') {
              fullHtml = `<html><head><style>${codeContent}</style></head><body style="margin:0;padding:20px;font-family:sans-serif;"><h1>CSS Preview</h1><div class="demo-box">Example Box</div></body></html>`;
            } else if (langName.toLowerCase().includes('js')) {
              fullHtml = `<html><body style="margin:0;padding:20px;font-family:sans-serif;"><script>${codeContent}<\/script></body></html>`;
            } else if (!codeContent.includes('<html') && !codeContent.includes('<body')) {
              fullHtml = `<html><body style="margin:0;padding:20px;font-family:sans-serif;">${codeContent}</body></html>`;
            }

            const previewContainer = document.createElement('div');
            previewContainer.className = 'code-preview mt-2 rounded-lg overflow-hidden border border-gray-700 bg-white animate-fade-in';
            
            const iframe = document.createElement('iframe');
            iframe.className = 'w-full bg-white';
            iframe.sandbox = "allow-scripts allow-same-origin";
            iframe.style.height = '300px';

            previewContainer.appendChild(iframe);
            if (pre.parentNode) pre.parentNode.insertBefore(previewContainer, pre.nextSibling);

            const doc = iframe.contentWindow?.document;
            if (doc) {
              doc.open();
              doc.write(fullHtml);
              doc.close();
              
              iframe.onload = () => {
                try {
                  const height = doc.body.scrollHeight + 20;
                  iframe.style.height = `${height}px`;
                } catch (e) {
                  console.log("CORS restriction on iframe height");
                }
              };
            }
            
            previewBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> Close`;
          }
        };
        actionsDiv.appendChild(previewBtn);
      }

      header.appendChild(langLabel);
      header.appendChild(actionsDiv);
      pre.insertBefore(header, pre.firstChild);
      pre.className = 'bg-[#1e1e1e] rounded-lg overflow-hidden border border-gray-700 my-4';
      codeBlock.className = 'block p-4 overflow-x-auto text-sm font-mono text-gray-300';
    });

    return { __html: tempDiv.innerHTML };
  };

  return (
    <div className="flex flex-col h-screen bg-[#0f0f1a] animate-fade-in">
      {/* Header */}
      <header className="bg-[#16213e] border-b border-[#2d2d44] p-4 flex items-center justify-between shadow-lg z-10">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-gray-400 hover:text-white text-xl transition-colors">←</Link>
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <span className="text-xl">🤖</span>
          </div>
          <div>
            <h1 className="font-bold text-lg text-white">Teacher's Assistant AI</h1>
            <p className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Online (Gemini Flash)
            </p>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
          >
            <div 
              className={`max-w-[90%] md:max-w-[80%] p-5 rounded-2xl shadow-md ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none' 
                  : 'bg-[#16213e] text-gray-200 rounded-bl-none border border-[#2d2d44]'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              ) : (
                // Для сообщений ИИ используем dangerouslySetInnerHTML с нашим рендерером
                <div 
                  className="prose prose-invert max-w-none prose-sm md:prose-base"
                  dangerouslySetInnerHTML={renderMarkdownToHtml(msg.content)}
                />
              )}
            </div>
          </div>
        ))}
        
        {/* Индикатор загрузки */}
        {isLoading && (
          <div className="flex justify-start animate-slide-up">
            <div className="bg-[#16213e] border border-[#2d2d44] p-4 rounded-2xl rounded-bl-none flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="bg-[#16213e] border-t border-[#2d2d44] p-4 shadow-lg z-10">
        <form onSubmit={handleSend} className="flex flex-col gap-3 max-w-4xl mx-auto">
          
          {/* Превью выбранных изображений */}
          {selectedImages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {selectedImages.map((img, idx) => (
                <div key={idx} className="relative flex-shrink-0 w-16 h-16">
                  <img src={img.data} alt={img.name} className="w-full h-full object-cover rounded-lg border border-gray-600" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 items-end">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              multiple
              className="hidden"
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#1a1a2e] hover:bg-[#252542] border border-[#2d2d44] text-gray-400 hover:text-white p-3 rounded-xl transition-all duration-200"
              title="Прикрепить изображение"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            </button>

            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="Напишите сообщение или прикрепите фото... (Shift+Enter для новой строки)"
              className="flex-1 bg-[#0f0f1a] border border-[#2d2d44] text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder-gray-500 resize-none min-h-[50px] max-h-[200px]"
              rows={1}
              disabled={isLoading}
            />
            
            <button 
              type="submit" 
              disabled={(!inputValue.trim() && selectedImages.length === 0) || isLoading}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-800 text-white px-6 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:shadow-none flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
        </form>
      </footer>
    </div>
  );
}