import { supabase } from '../lib/db.js';

/**
 * Middleware xác thực - kiểm tra JWT token từ Supabase Auth
 * Sử dụng cho các API cần đăng nhập mới được gọi
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
    console.log('🔐 Verifying token:', token.substring(0, 20) + '...');

    // 2. Verify token với Supabase - hỏi xem token này có hợp lệ không
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error('❌ Auth error:', error);
    }
    if (!user) {
      console.error('❌ No user found');
    }

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.'
      });
    }

    // 3. Lấy thêm profile từ bảng users (role, center_id)
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

    // 4. Gán thông tin user vào request để các handler sau dùng được
    req.user = {
      ...user,
      profile: profile || null,
      roleCode: profile?.roles?.code || null,
      centerId: profile?.center_id || null,
      center_id: profile?.center_id || null // Add snake_case for consistency
    };

    // Log để debug (có thể bỏ sau)
    console.log(`✅ Authenticated: ${user.email} | Role: ${req.user.roleCode} | Center: ${req.user.centerId}`);

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
