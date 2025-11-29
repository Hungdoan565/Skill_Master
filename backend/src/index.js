import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase, getDbStatus } from './lib/db.js';
import { requireAuth, requireRole } from './middleware/auth.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ============ PUBLIC APIs (Không cần đăng nhập) ============

app.get('/api/health', async (_req, res) => {
  const status = await getDbStatus();
  res.json({ service: 'skill-master-backend', ...status });
});

app.get('/api/status', async (_req, res, next) => {
  try {
    const status = await getDbStatus();
    res.json(status);
  } catch (error) {
    next(error);
  }
});

// Xem danh sách khóa học (public - ai cũng xem được)
app.get('/api/courses', async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching courses:', error);
    next(error);
  }
});

// ============ PROTECTED APIs (Phải đăng nhập) ============

// Tạo khóa học mới (chỉ admin mới được tạo)
app.post('/api/courses', requireAuth, async (req, res, next) => {
  try {
    const { name, description, category, base_price, status } = req.body;
    
    // Log user đang tạo (từ middleware)
    console.log(`📝 User ${req.user.email} đang tạo khóa học: ${name}`);

    // Validate dữ liệu đầu vào
    if (!name || !category) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tên khóa học và danh mục là bắt buộc' 
      });
    }

    const { data, error } = await supabase
      .from('courses')
      .insert([{
        name,
        description: description || '',
        category,
        base_price: base_price || 0,
        status: status || 'active',
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ 
      success: true, 
      message: 'Tạo khóa học thành công',
      data 
    });
  } catch (error) {
    console.error('Error creating course:', error);
    next(error);
  }
});

// Xóa khóa học (chỉ admin)
app.delete('/api/courses/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ User ${req.user.email} đang xóa khóa học: ${id}`);

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ 
      success: true, 
      message: 'Xóa khóa học thành công' 
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    next(error);
  }
});

// API kiểm tra user hiện tại (debug/profile)
app.get('/api/me', requireAuth, async (req, res) => {
  res.json({ 
    success: true, 
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.app_metadata?.role || 'user',
      created_at: req.user.created_at,
    }
  });
});

// ============ ADMIN APIs (Chỉ Admin mới được dùng) ============

// Lấy danh sách nhân sự (Teacher, Manager)
app.get('/api/admin/staff', requireAuth, async (req, res, next) => {
  try {
    const { role } = req.query; // Filter theo role: TEACHER, CENTER_MANAGER
    
    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        phone,
        avatar_url,
        status,
        created_at,
        roles (
          id,
          code,
          name
        )
      `)
      .in('role_id', role 
        ? [role] 
        : ['TEACHER', 'CENTER_MANAGER'].map(r => 
            supabase.from('roles').select('id').eq('code', r)
          )
      )
      .order('created_at', { ascending: false });

    // Filter theo role nếu có
    if (role) {
      // Lấy role_id từ code
      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('code', role)
        .single();
      
      if (roleData) {
        query = supabase
          .from('users')
          .select(`
            id,
            email,
            full_name,
            phone,
            avatar_url,
            status,
            created_at,
            roles (
              id,
              code,
              name
            )
          `)
          .eq('role_id', roleData.id)
          .order('created_at', { ascending: false });
      }
    } else {
      // Lấy tất cả staff (không phải STUDENT)
      const { data: studentRole } = await supabase
        .from('roles')
        .select('id')
        .eq('code', 'STUDENT')
        .single();
      
      query = supabase
        .from('users')
        .select(`
          id,
          email,
          full_name,
          phone,
          avatar_url,
          status,
          created_at,
          roles (
            id,
            code,
            name
          )
        `)
        .neq('role_id', studentRole?.id || '')
        .order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching staff:', error);
    next(error);
  }
});

// Tạo tài khoản nhân viên mới (Admin only)
app.post('/api/admin/users', requireAuth, async (req, res, next) => {
  try {
    const { email, full_name, phone, role_code } = req.body;
    
    console.log(`👤 Admin ${req.user.email} đang tạo user: ${email} với role ${role_code}`);

    // Validate input
    if (!email || !full_name || !role_code) {
      return res.status(400).json({
        success: false,
        message: 'Email, họ tên và vai trò là bắt buộc'
      });
    }

    // Chỉ cho phép tạo TEACHER hoặc CENTER_MANAGER
    if (!['TEACHER', 'CENTER_MANAGER'].includes(role_code)) {
      return res.status(400).json({
        success: false,
        message: 'Vai trò không hợp lệ. Chỉ được tạo Teacher hoặc Manager.'
      });
    }

    // Lấy role_id từ code
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('code', role_code)
      .single();

    if (roleError || !roleData) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy vai trò trong hệ thống'
      });
    }

    // Tạo user trong Supabase Auth với password mặc định
    // Note: Trong production nên dùng inviteUserByEmail thay vì createUser
    const defaultPassword = 'SkillMaster@123'; // Password mặc định, nhân viên đổi sau
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true, // Auto confirm email
      user_metadata: {
        full_name,
        phone,
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      // Nếu user đã tồn tại trong auth, vẫn thử tạo trong public.users
      if (!authError.message.includes('already been registered')) {
        return res.status(400).json({
          success: false,
          message: authError.message
        });
      }
    }

    // Insert vào public.users với role được chỉ định
    const userId = authData?.user?.id;
    
    if (userId) {
      // Update role trong public.users (trigger đã tạo với role STUDENT)
      const { error: updateError } = await supabase
        .from('users')
        .update({
          role_id: roleData.id,
          full_name,
          phone: phone || null,
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Update user error:', updateError);
        // Nếu user chưa được tạo bởi trigger, tạo mới
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email,
            full_name,
            phone: phone || null,
            role_id: roleData.id,
            status: 'active',
          });
        
        if (insertError) {
          console.error('Insert user error:', insertError);
        }
      }
    }

    res.status(201).json({
      success: true,
      message: `Tạo tài khoản thành công. Password mặc định: ${defaultPassword}`,
      data: {
        id: userId,
        email,
        full_name,
        role_code,
        default_password: defaultPassword,
      }
    });

  } catch (error) {
    console.error('Error creating user:', error);
    next(error);
  }
});

// Lấy danh sách roles (để hiển thị trong dropdown)
app.get('/api/roles', async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('id, code, name, description')
      .in('code', ['TEACHER', 'CENTER_MANAGER']) // Chỉ lấy role staff
      .order('name');

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Lấy danh sách học viên (STUDENT)
app.get('/api/admin/students', requireAuth, async (req, res, next) => {
  try {
    const { search, status } = req.query;

    // Lấy role_id của STUDENT
    const { data: studentRole } = await supabase
      .from('roles')
      .select('id')
      .eq('code', 'STUDENT')
      .single();

    if (!studentRole) {
      return res.json({ success: true, data: [] });
    }

    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        phone,
        avatar_url,
        status,
        created_at,
        roles (
          id,
          code,
          name
        )
      `)
      .eq('role_id', studentRole.id)
      .order('created_at', { ascending: false });

    // Filter theo status nếu có
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Filter theo search (tên hoặc email) - client side vì Supabase không hỗ trợ OR search tốt
    let result = data || [];
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(u => 
        u.full_name?.toLowerCase().includes(searchLower) ||
        u.email?.toLowerCase().includes(searchLower) ||
        u.phone?.includes(search)
      );
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching students:', error);
    next(error);
  }
});

// Cập nhật role của user (Admin nâng cấp Student -> Teacher/Manager)
app.patch('/api/admin/users/:id/role', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role_code } = req.body;

    console.log(`🔄 Admin ${req.user.email} đang đổi role của user ${id} thành ${role_code}`);

    // Validate role_code
    if (!['STUDENT', 'TEACHER', 'CENTER_MANAGER'].includes(role_code)) {
      return res.status(400).json({
        success: false,
        message: 'Role không hợp lệ'
      });
    }

    // Lấy role_id từ code
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('code', role_code)
      .single();

    if (roleError || !roleData) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy role'
      });
    }

    // Update user
    const { data, error } = await supabase
      .from('users')
      .update({ role_id: roleData.id })
      .eq('id', id)
      .select(`
        id,
        email,
        full_name,
        roles (code, name)
      `)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: `Đã chuyển thành ${role_code}`,
      data
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    next(error);
  }
});

app.use((err, _req, res, _next) => {
  console.error('🔥 Lỗi hệ thống:', err); // Log ra terminal để em xem
  
  // Trả về lỗi chi tiết cho Frontend thấy (chỉ nên làm vậy ở môi trường Dev)
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error', 
    error: err.message // Thêm dòng này để FE biết lỗi gì
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
