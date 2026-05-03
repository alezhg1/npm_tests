// src/api/client.js

// Проверяем, запущен ли проект локально (Vite) или на продакшене
const isDev = import.meta.env.DEV;

// В разработке используем прокси Vite (/api), который перенаправляет на localhost:3001
// На продакшене (Vercel) /api будет обрабатываться Serverless Functions
const API_BASE = '/api'; 

console.log('🔗 API Base URL:', API_BASE);

// --- QUIZZES ---
export async function getQuizByCode(code) {
  const res = await fetch(`${API_BASE}/quizzes?code=${code}`);
  if (!res.ok) throw new Error('Failed to fetch quiz');
  return res.json();
}

export async function getQuizById(id) {
  const res = await fetch(`${API_BASE}/quizzes?id=${id}`);
  if (!res.ok) throw new Error('Failed to fetch quiz by ID');
  return res.json();
}

export async function createQuiz(quizData) {
  const res = await fetch(`${API_BASE}/quizzes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(quizData),
  });
  if (!res.ok) throw new Error('Failed to create quiz');
  return res.json();
}

// --- PARTICIPANTS ---
export async function addParticipant(participantData) {
  const res = await fetch(`${API_BASE}/participants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(participantData),
  });
  if (!res.ok) throw new Error('Failed to add participant');
  return res.json();
}

export async function getParticipants(quizId) {
  const res = await fetch(`${API_BASE}/participants?quizId=${quizId}`);
  if (!res.ok) throw new Error('Failed to fetch participants');
  return res.json();
}

// --- QUESTIONS ---
export async function saveQuestion(questionData) {
  const res = await fetch(`${API_BASE}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(questionData),
  });
  if (!res.ok) throw new Error('Failed to save question');
  return res.json();
}

// НОВАЯ ФУНКЦИЯ: Получить вопросы для ученика
export async function getQuestionsForQuiz(quizId) {
  const res = await fetch(`${API_BASE}/questions?quizId=${quizId}`);
  if (!res.ok) throw new Error('Failed to fetch questions');
  return res.json();
}

// --- ANSWERS ---
export async function submitAnswer(answerData) {
  const res = await fetch(`${API_BASE}/answers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(answerData),
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    // Если ошибка 409 (конфликт дубликатов), считаем это успехом (ответ уже есть)
    if (res.status === 409) {
      console.warn('⚠️ Duplicate answer detected, but proceeding.');
      return { warning: 'Duplicate' };
    }
    throw new Error(err.error || 'Failed to submit answer');
  }
  return res.json();
}

export async function getAnswers(quizId) {
  const res = await fetch(`${API_BASE}/answers?quizId=${quizId}`);
  if (!res.ok) throw new Error('Failed to fetch answers');
  return res.json();
}

// --- UPLOAD IMAGE ---
export async function uploadImage(base64Image, fileName, quizId) {
  const res = await fetch(`${API_BASE}/upload-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      base64Image,
      fileName,
      quizId
    }),
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to upload image');
  }
  
  const data = await res.json();
  return data.url;
}

// --- QUIZ INFO ---
export async function getQuizInfo(quizId) {
  const res = await fetch(`${API_BASE}/quiz-info/${quizId}`);
  if (!res.ok) throw new Error('Failed to fetch quiz info');
  return res.json();
}

// --- FULL ANSWER DETAILS ---
export async function getFullAnswerDetails(participantId) {
  const res = await fetch(`${API_BASE}/answers/full/${participantId}`);
  if (!res.ok) throw new Error('Failed to fetch answer details');
  return res.json();
}

// --- CHEAT EVENTS ---
export async function getCheatEvents(participantId) {
  const res = await fetch(`${API_BASE}/cheat-events/${participantId}`);
  if (!res.ok) throw new Error('Failed to fetch cheat events');
  return res.json();
}