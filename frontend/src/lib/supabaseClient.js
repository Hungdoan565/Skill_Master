import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log để debug
console.log('[Supabase] URL:', supabaseUrl ? 'OK' : 'MISSING');
console.log('[Supabase] Key:', supabaseAnonKey ? 'OK' : 'MISSING');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '⚠️ Thiếu biến môi trường Supabase!\n' +
    'Hãy tạo file .env trong thư mục frontend với nội dung:\n' +
    'VITE_SUPABASE_URL=your_supabase_url\n' +
    'VITE_SUPABASE_ANON_KEY=your_supabase_anon_key'
  );
}

// Tạo client với fallback để tránh crash
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);
