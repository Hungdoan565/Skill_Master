import { supabase } from '../lib/db.js';

// ============================================================
// AUTH CACHE - Tránh gọi Supabase lặp lại cho cùng token
// ============================================================
const AUTH_CACHE = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 phút
const CACHE_MAX_SIZE = 200;

function getCachedAuth(token) {
  const key = token.substring(token.length - 32); // dùng 32 ký tự cuối làm key
  const entry = AUTH_CACHE.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) {
    return entry.userData;
  }
  if (entry) AUTH_CACHE.delete(key); // expired
  return null;
}

function setCachedAuth(token, userData) {
  const key = token.substring(token.length - 32);
  // Evict oldest entries if cache is too large
  if (AUTH_CACHE.size >= CACHE_MAX_SIZE) {
    const firstKey = AUTH_CACHE.keys().next().value;
    AUTH_CACHE.delete(firstKey);
  }
  AUTH_CACHE.set(key, { userData, ts: Date.now() });
}

// Export for logout/token revocation
export function invalidateAuthCache(token) {
  if (token) {
    const key = token.substring(token.length - 32);
    AUTH_CACHE.delete(key);
  }
}

/**
 * Middleware xác thực - kiểm tra JWT token từ Supabase Auth
 * Có cache in-memory để tránh gọi Supabase nhiều lần cho cùng token
 */
export const requireAuth = async (req, res, next) => {
  try {
    // 1. Lấy token từ header "Authorization: Bearer <token>"
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Thiếu token xác thực. Vui lòng đăng nhập.'
      });
    }

    const token = authHeader.split(' ')[1];

    // Validate token format BEFORE sending to Supabase
    if (!token || token === 'null' || token === 'undefined' || token.length < 20) {
      console.error('❌ Invalid token format');
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ. Vui lòng đăng nhập lại.'
      });
    }

    // 2. Check cache trước
    const cached = getCachedAuth(token);
    if (cached) {
      req.user = cached;
      next();
      return;
    }

    // 3. Verify token với Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      if (error) console.error('❌ Auth error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.'
      });
    }

    // 4. Lấy thêm profile từ bảng users (role, center_id)
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        email,
        center_id,
        role_id,
        roles (
          id,
          code,
          name
        )
      `)
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.warn('⚠️ Cannot fetch user profile:', profileError.message);
    }

    // 5. Gán thông tin user vào request
    const userData = {
      ...user,
      profile: profile || null,
      roleCode: profile?.roles?.code || null,
      centerId: profile?.center_id || null,
      center_id: profile?.center_id || null
    };

    req.user = userData;

    // 6. Cache kết quả
    setCachedAuth(token, userData);

    console.log(`✅ Auth: ${user.email} | ${req.user.roleCode}`);

    next();
  } catch (err) {
    console.error('🔥 Auth Middleware Error:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi xác thực'
    });
  }
};

/**
 * Middleware kiểm tra role (dùng sau khi đã qua requireAuth)
 * @param {string[]} allowedRoles - Danh sách role được phép truy cập
 */
export const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Lấy role từ req.user.roleCode đã được set bởi requireAuth
      const userRole = req.user?.roleCode;

      console.log(`🔐 Role check: ${userRole} in [${allowedRoles.join(', ')}]`);

      if (!userRole || !allowedRoles.includes(userRole)) {
        console.warn(`⛔ Access denied: User ${req.user?.email} with role ${userRole} tried to access resource requiring ${allowedRoles.join(' or ')}`);
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền truy cập tài nguyên này'
        });
      }

      next();
    } catch (err) {
      console.error('🔥 Role Middleware Error:', err);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi kiểm tra quyền'
      });
    }
  };
};
