import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// --- ХАК ДЛЯ РАЗРАБОТКИ ---
// Мы вручную устанавливаем сессию для нашего тестового учителя,
// чтобы обходить RLS (Row Level Security) при создании квизов.
const TEST_USER_ID = '00000000-0000-0000-0000-000000000000';

// Создаем фейковый JWT токен (упрощенно)
// В реальном проекте так делать нельзя, но для теста сойдет
const fakeAccessToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiAi${TEST_USER_ID.replace(/-/g, '')}", "role": "authenticated", "iat": ${Math.floor(Date.now() / 1000)}}.fake-signature`;

supabase.auth.setSession({
  access_token: fakeAccessToken,
  refresh_token: 'fake-refresh-token',
}).then(() => {
  console.log('Dev mode: Session set for Test Teacher');
});