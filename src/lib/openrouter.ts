// src/lib/openrouter.ts

// Замените на ваш реальный ключ от OpenRouter
export const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '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';

export const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export const DEFAULT_MODEL = 'google/gemini-2.0-flash-001'; // Бесплатная модель

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function sendMessageToAI(messages: ChatMessage[]): Promise<string> {
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Teacher Assistant App'
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Ты - умный помощник учителя. Твоя задача - помогать создавать вопросы для квизов, планировать уроки, генерировать идеи для занятий и отвечать на вопросы по методике преподавания. Отвечай кратко, по делу и дружелюбно.'
          },
          ...messages.slice(-10) // Отправляем последние 10 сообщений для контекста
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      throw new Error('Некорректный ответ от API');
    }
  } catch (error) {
    console.error('Ошибка при обращении к OpenRouter:', error);
    return 'Извините, произошла ошибка при обращении к ИИ. Попробуйте позже.';
  }
}