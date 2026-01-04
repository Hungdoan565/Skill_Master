// test-backend-connection.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

console.log('SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
console.log('SUPABASE_KEY:', supabaseKey ? 'SET (hidden)' : 'MISSING');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Thiếu environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('✅ Supabase client created');
console.log('Testing connection...');

const { data, error } = await supabase.from('roles').select('*').limit(1);

if (error) {
  console.error('❌ Connection error:', error.message);
  process.exit(1);
}

console.log('✅ Connection successful!');
console.log('Sample data:', data);
process.exit(0);
