// lib/db.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Thiếu SUPABASE_URL hoặc SUPABASE_KEY');
}

// Đây là client dùng để gọi Database qua API
export const supabase = createClient(supabaseUrl, supabaseKey);

// Service role client - bypasses RLS (for notifications, admin operations)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey)
  : supabase;

// Hàm kiểm tra kết nối
export const getDbStatus = async () => {
  try {
    // Gọi thử 1 query nhẹ
    const { data, error } = await supabase.from('roles').select('count').limit(1).single();
    if (error) throw error;
    return { status: 'ok', database: 'Supabase (via API)' };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
};