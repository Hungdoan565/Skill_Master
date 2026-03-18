import { supabase } from '@/lib/supabaseClient';

export async function getAuthHeaders() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.access_token) {
    throw new Error('Không thể lấy phiên đăng nhập. Vui lòng đăng nhập lại.');
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  };
}

export async function authFetch(url, options = {}) {
  const headers = await getAuthHeaders();
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {})
    }
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || payload?.error || `Request failed: ${response.status}`);
  }

  return payload;
}
