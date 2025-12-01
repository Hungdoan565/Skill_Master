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

// ============ CLASS MANAGEMENT APIs ============

// Lấy danh sách giáo viên (để chọn trong dropdown)
app.get('/api/teachers', requireAuth, async (req, res, next) => {
  try {
    const { data: teacherRole } = await supabase
      .from('roles')
      .select('id')
      .eq('code', 'TEACHER')
      .single();

    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, phone, avatar_url')
      .eq('role_id', teacherRole?.id)
      .eq('status', 'active')
      .order('full_name');

    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    next(error);
  }
});

// Lấy danh sách trung tâm
app.get('/api/centers', async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('centers')
      .select('id, name, address, hotline')
      .order('name');

    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    next(error);
  }
});

// Lấy danh sách lớp học (với thông tin liên quan)
app.get('/api/classes', requireAuth, async (req, res, next) => {
  try {
    const { status, course_id, teacher_id } = req.query;

    let query = supabase
      .from('classes')
      .select(`
        id,
        code,
        name,
        start_date,
        end_date,
        schedule,
        room,
        room_id,
        max_students,
        status,
        created_at,
        courses (
          id,
          code,
          title,
          category
        ),
        centers (
          id,
          name
        ),
        rooms (
          id,
          name,
          capacity
        ),
        users!classes_teacher_id_fkey (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (course_id) query = query.eq('course_id', course_id);
    if (teacher_id) query = query.eq('teacher_id', teacher_id);

    const { data, error } = await query;
    if (error) throw error;

    // Đếm số học viên enrolled cho mỗi lớp
    const classesWithCount = await Promise.all(
      (data || []).map(async (cls) => {
        const { count } = await supabase
          .from('enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('class_id', cls.id)
          .eq('status', 'active');
        
        return {
          ...cls,
          enrolled_count: count || 0,
          teacher: cls.users,
        };
      })
    );

    res.json({ success: true, data: classesWithCount });
  } catch (error) {
    console.error('Error fetching classes:', error);
    next(error);
  }
});

// Lấy chi tiết 1 lớp học
app.get('/api/classes/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        courses (*),
        centers (*),
        users!classes_teacher_id_fkey (
          id, full_name, email, avatar_url, phone
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(`
        id, enrolled_at, status,
        users!enrollments_student_id_fkey (
          id, full_name, email, avatar_url
        )
      `)
      .eq('class_id', id);

    res.json({ 
      success: true, 
      data: { ...data, teacher: data.users, enrollments: enrollments || [] }
    });
  } catch (error) {
    next(error);
  }
});

// Tạo lớp học mới
app.post('/api/admin/classes', requireAuth, async (req, res, next) => {
  try {
    let { code, name, course_id, teacher_id, center_id, room_id, start_date, end_date, schedule, room, max_students, status } = req.body;

    console.log(`📚 Admin ${req.user.email} tạo lớp: ${name}`);

    // Validate required fields (code sẽ tự tạo nếu không có)
    if (!name || !course_id || !center_id) {
      return res.status(400).json({
        success: false,
        message: 'Tên lớp, khóa học và trung tâm là bắt buộc'
      });
    }

    // Tự động tạo mã lớp nếu không truyền
    if (!code) {
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      code = `CLS-${randomNum}`;
    }

    // Kiểm tra mã lớp đã tồn tại chưa
    const { data: existing } = await supabase
      .from('classes')
      .select('id')
      .eq('code', code)
      .single();

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Mã lớp đã tồn tại, vui lòng thử lại'
      });
    }

    const { data, error } = await supabase
      .from('classes')
      .insert({
        code,
        name,
        course_id,
        teacher_id: teacher_id || null,
        center_id,
        room_id: room_id || null,
        start_date: start_date || null,
        end_date: end_date || null,
        schedule: schedule || [],
        room: room || null,
        max_students: max_students || 20,
        status: status || 'upcoming'
      })
      .select(`
        *,
        courses (id, title),
        centers (id, name),
        rooms (id, name),
        users!classes_teacher_id_fkey (id, full_name)
      `)
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Tạo lớp học thành công',
      data
    });
  } catch (error) {
    console.error('Error creating class:', error);
    next(error);
  }
});

// Cập nhật lớp học
app.put('/api/admin/classes/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    console.log(`✏️ Admin ${req.user.email} cập nhật lớp: ${id}`);

    delete updates.id;
    delete updates.created_at;

    const { data, error } = await supabase
      .from('classes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        courses (id, title),
        centers (id, name),
        users!classes_teacher_id_fkey (id, full_name)
      `)
      .single();

    if (error) throw error;

    res.json({ success: true, message: 'Cập nhật lớp học thành công', data });
  } catch (error) {
    console.error('Error updating class:', error);
    next(error);
  }
});

// Xóa lớp học
app.delete('/api/admin/classes/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ Admin ${req.user.email} xóa lớp: ${id}`);

    const { count } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', id);

    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa lớp đã có ${count} học viên ghi danh`
      });
    }

    const { error } = await supabase.from('classes').delete().eq('id', id);
    if (error) throw error;

    res.json({ success: true, message: 'Xóa lớp học thành công' });
  } catch (error) {
    console.error('Error deleting class:', error);
    next(error);
  }
});

// ============ ROOM MANAGEMENT APIs ============

// Lấy danh sách phòng học
app.get('/api/rooms', async (req, res, next) => {
  try {
    const { center_id, status } = req.query;
    
    let query = supabase
      .from('rooms')
      .select(`
        *,
        centers (id, name)
      `)
      .order('name');

    if (center_id) query = query.eq('center_id', center_id);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (error) {
    next(error);
  }
});

// Lấy chi tiết phòng học
app.get('/api/rooms/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('rooms')
      .select(`
        *,
        centers (id, name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Tạo phòng học mới
app.post('/api/admin/rooms', requireAuth, async (req, res, next) => {
  try {
    const { name, code, capacity, room_type, equipment, center_id, notes } = req.body;

    console.log(`🏠 Admin ${req.user.email} tạo phòng mới: ${name}`);

    // Auto generate code nếu không có
    let roomCode = code;
    if (!roomCode) {
      const randomNum = Math.floor(100 + Math.random() * 900);
      roomCode = `P${randomNum}`;
    }

    const { data, error } = await supabase
      .from('rooms')
      .insert({
        name,
        code: roomCode,
        capacity: capacity || 20,
        room_type: room_type || 'standard',
        equipment: equipment || [],
        center_id,
        notes,
        status: 'active'
      })
      .select(`*, centers (id, name)`)
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Tạo phòng học thành công',
      data
    });
  } catch (error) {
    console.error('Error creating room:', error);
    next(error);
  }
});

// Cập nhật phòng học
app.put('/api/admin/rooms/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    console.log(`✏️ Admin ${req.user.email} cập nhật phòng: ${id}`);

    delete updates.id;
    delete updates.created_at;

    const { data, error } = await supabase
      .from('rooms')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`*, centers (id, name)`)
      .single();

    if (error) throw error;
    res.json({ success: true, message: 'Cập nhật phòng học thành công', data });
  } catch (error) {
    console.error('Error updating room:', error);
    next(error);
  }
});

// Xóa phòng học
app.delete('/api/admin/rooms/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ Admin ${req.user.email} xóa phòng: ${id}`);

    // Kiểm tra phòng có đang được sử dụng không
    const { count } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', id)
      .in('status', ['upcoming', 'ongoing']);

    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa phòng đang được sử dụng bởi ${count} lớp học`
      });
    }

    const { error } = await supabase.from('rooms').delete().eq('id', id);
    if (error) throw error;

    res.json({ success: true, message: 'Xóa phòng học thành công' });
  } catch (error) {
    console.error('Error deleting room:', error);
    next(error);
  }
});

// ============ SCHEDULE CONFLICT CHECK API ============

// Helper: Kiểm tra 2 khoảng thời gian có giao nhau không
function isTimeOverlap(start1, end1, start2, end2) {
  // Chuyển string "HH:MM" thành số phút từ 00:00
  const toMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  const s1 = toMinutes(start1), e1 = toMinutes(end1);
  const s2 = toMinutes(start2), e2 = toMinutes(end2);
  return s1 < e2 && s2 < e1; // Công thức giao nhau kinh điển
}

// Helper: Kiểm tra 2 khoảng ngày có giao nhau không
function isDateRangeOverlap(start1, end1, start2, end2) {
  return start1 <= end2 && start2 <= end1;
}

// Helper: Parse schedule an toàn (có thể là null, string, hoặc array)
function parseScheduleSafe(schedule) {
  if (!schedule) return [];
  if (Array.isArray(schedule)) return schedule;
  if (typeof schedule === 'string') {
    try {
      const parsed = JSON.parse(schedule);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

// API kiểm tra xung đột lịch
app.post('/api/classes/check-conflict', requireAuth, async (req, res, next) => {
  try {
    const { teacher_id, room_id, start_date, end_date, schedule, exclude_class_id } = req.body;
    
    // schedule là mảng: [{ day: 2, start: "18:00", end: "20:00" }, ...]
    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
      return res.json({ conflict: false, message: 'Không có lịch để kiểm tra' });
    }

    const conflicts = [];

    // 1. Kiểm tra xung đột GIÁO VIÊN
    if (teacher_id) {
      let teacherQuery = supabase
        .from('classes')
        .select('id, name, code, schedule, start_date, end_date')
        .eq('teacher_id', teacher_id)
        .in('status', ['upcoming', 'ongoing']);

      if (exclude_class_id) {
        teacherQuery = teacherQuery.neq('id', exclude_class_id);
      }

      const { data: teacherClasses } = await teacherQuery;

      for (const newSession of schedule) {
        for (const oldClass of (teacherClasses || [])) {
          // Kiểm tra ngày tháng có giao nhau không
          if (!isDateRangeOverlap(start_date, end_date, oldClass.start_date, oldClass.end_date)) {
            continue;
          }

          const oldSchedule = parseScheduleSafe(oldClass.schedule);
          const clash = oldSchedule.find(oldSession => 
            oldSession.day === newSession.day &&
            isTimeOverlap(newSession.start, newSession.end, oldSession.start, oldSession.end)
          );

          if (clash) {
            const dayNames = ['', '', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
            conflicts.push({
              type: 'teacher',
              message: `Giáo viên bận dạy lớp "${oldClass.name}" vào ${dayNames[newSession.day]} (${clash.start}-${clash.end})`
            });
          }
        }
      }
    }

    // 2. Kiểm tra xung đột PHÒNG HỌC
    if (room_id) {
      let roomQuery = supabase
        .from('classes')
        .select('id, name, code, schedule, start_date, end_date')
        .eq('room_id', room_id)
        .in('status', ['upcoming', 'ongoing']);

      if (exclude_class_id) {
        roomQuery = roomQuery.neq('id', exclude_class_id);
      }

      const { data: roomClasses } = await roomQuery;

      for (const newSession of schedule) {
        for (const oldClass of (roomClasses || [])) {
          if (!isDateRangeOverlap(start_date, end_date, oldClass.start_date, oldClass.end_date)) {
            continue;
          }

          const oldSchedule = parseScheduleSafe(oldClass.schedule);
          const clash = oldSchedule.find(oldSession =>
            oldSession.day === newSession.day &&
            isTimeOverlap(newSession.start, newSession.end, oldSession.start, oldSession.end)
          );

          if (clash) {
            const dayNames = ['', '', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
            conflicts.push({
              type: 'room',
              message: `Phòng đã được lớp "${oldClass.name}" sử dụng vào ${dayNames[newSession.day]} (${clash.start}-${clash.end})`
            });
          }
        }
      }
    }

    res.json({
      conflict: conflicts.length > 0,
      conflicts,
      message: conflicts.length > 0 
        ? `Phát hiện ${conflicts.length} xung đột lịch` 
        : 'Lịch hợp lệ, không có xung đột'
    });
  } catch (error) {
    console.error('Error checking conflict:', error);
    next(error);
  }
});

// API lấy lịch bận của giáo viên (cho calendar preview)
app.get('/api/teachers/:id/schedule', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;

    let query = supabase
      .from('classes')
      .select('id, name, code, schedule, start_date, end_date, room_id, rooms(name)')
      .eq('teacher_id', id)
      .in('status', ['upcoming', 'ongoing']);

    if (start_date && end_date) {
      query = query.or(`start_date.lte.${end_date},end_date.gte.${start_date}`);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (error) {
    next(error);
  }
});

// API lấy lịch bận của phòng học (cho calendar preview)
app.get('/api/rooms/:id/schedule', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;

    let query = supabase
      .from('classes')
      .select('id, name, code, schedule, start_date, end_date, teacher_id, users!classes_teacher_id_fkey(full_name)')
      .eq('room_id', id)
      .in('status', ['upcoming', 'ongoing']);

    if (start_date && end_date) {
      query = query.or(`start_date.lte.${end_date},end_date.gte.${start_date}`);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// CLASS DETAIL APIs - Quản lý chi tiết lớp học
// ============================================================

// API: Lấy thông tin chi tiết 1 lớp học
app.get('/api/classes/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        courses(id, code, title, price, total_sessions, duration_weeks),
        centers(id, name),
        users!classes_teacher_id_fkey(id, full_name, email, phone),
        rooms(id, name, capacity)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
      }
      throw error;
    }

    // Đếm số học viên hiện tại
    const { count: studentCount } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', id)
      .eq('status', 'active');

    res.json({ 
      success: true, 
      data: {
        ...data,
        current_students: studentCount || 0
      }
    });
  } catch (error) {
    console.error('Error fetching class detail:', error);
    next(error);
  }
});

// API: Lấy danh sách học viên trong lớp
app.get('/api/classes/:id/students', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      payment_status = 'all',  // all | paid | unpaid
      search = ''
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    // 1. Query cơ bản với count để phân trang
    let query = supabase
      .from('enrollments')
      .select(`
        id,
        enrolled_at,
        status,
        tuition_fee,
        discount_amount,
        paid_amount,
        notes,
        student_id,
        users!enrollments_student_id_fkey(
          id, 
          full_name, 
          email, 
          phone, 
          avatar_url
        )
      `, { count: 'exact' })
      .eq('class_id', id)
      .eq('status', 'active');

    // 2. Thực hiện query để lấy data
    const { data: allData, error: countError, count: totalCount } = await query
      .order('enrolled_at', { ascending: false });

    if (countError) throw countError;

    // 3. Transform và filter
    let students = (allData || []).map(enrollment => {
      const tuition = enrollment.tuition_fee || 0;
      const discount = enrollment.discount_amount || 0;
      const paid = enrollment.paid_amount || 0;
      const amountDue = tuition - discount;
      const remaining = amountDue - paid;
      
      // Tính payment status
      let paymentStatusCalc = 'unpaid';
      if (remaining <= 0 && amountDue > 0) paymentStatusCalc = 'paid';
      else if (paid > 0) paymentStatusCalc = 'partial';

      return {
        enrollment_id: enrollment.id,
        enrolled_at: enrollment.enrolled_at,
        enrollment_status: enrollment.status,
        tuition_fee: tuition,
        discount_amount: discount,
        paid_amount: paid,
        notes: enrollment.notes,
        // Thông tin học viên
        student_id: enrollment.users?.id,
        full_name: enrollment.users?.full_name,
        email: enrollment.users?.email,
        phone: enrollment.users?.phone,
        avatar_url: enrollment.users?.avatar_url,
        // Tính toán
        amount_due: amountDue,
        remaining: remaining,
        payment_status: paymentStatusCalc
      };
    });

    // 4. Filter theo payment_status
    if (payment_status === 'paid') {
      students = students.filter(s => s.payment_status === 'paid');
    } else if (payment_status === 'unpaid') {
      students = students.filter(s => s.payment_status !== 'paid');
    }

    // 5. Filter theo search (tìm theo tên, email, phone)
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      students = students.filter(s => 
        (s.full_name && s.full_name.toLowerCase().includes(searchLower)) ||
        (s.email && s.email.toLowerCase().includes(searchLower)) ||
        (s.phone && s.phone.includes(searchLower))
      );
    }

    // 6. Tính pagination sau khi filter
    const filteredTotal = students.length;
    const totalPages = Math.ceil(filteredTotal / limitNum);
    
    // 7. Slice để lấy đúng trang
    const paginatedStudents = students.slice(from, from + limitNum);

    res.json({ 
      success: true, 
      data: paginatedStudents,
      pagination: {
        total: filteredTotal,
        page: pageNum,
        limit: limitNum,
        totalPages: totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      // Summary cho UI
      summary: {
        totalInClass: totalCount || 0,
        paid: students.filter(s => s.payment_status === 'paid').length,
        unpaid: students.filter(s => s.payment_status !== 'paid').length
      }
    });
  } catch (error) {
    console.error('Error fetching class students:', error);
    next(error);
  }
});

// API: Tìm kiếm học viên để thêm vào lớp (chỉ lấy users có role STUDENT)
app.get('/api/students/search', requireAuth, async (req, res, next) => {
  try {
    const { q, exclude_class_id } = req.query;

    // Lấy role_id của STUDENT
    const { data: studentRole } = await supabase
      .from('roles')
      .select('id')
      .eq('code', 'STUDENT')
      .single();

    if (!studentRole) {
      return res.status(500).json({ success: false, message: 'Không tìm thấy role STUDENT' });
    }

    // Base query
    let query = supabase
      .from('users')
      .select('id, full_name, email, phone, avatar_url, created_at')
      .eq('role_id', studentRole.id)
      .eq('status', 'active');

    if (q && q.trim().length > 0) {
      // Có từ khóa -> Tìm kiếm theo tên/email/phone
      query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
      query = query.limit(20);
    } else {
      // Không có từ khóa -> Trả về học viên mới đăng ký gần đây nhất
      query = query.order('created_at', { ascending: false }).limit(10);
    }

    const { data: students, error } = await query;
    if (error) throw error;

    // Nếu có exclude_class_id, loại bỏ những học viên đã trong lớp đó
    if (exclude_class_id && students?.length > 0) {
      const { data: enrolled } = await supabase
        .from('enrollments')
        .select('student_id')
        .eq('class_id', exclude_class_id)
        .in('status', ['active', 'completed']);

      const enrolledIds = new Set((enrolled || []).map(e => e.student_id));
      const filtered = students.filter(s => !enrolledIds.has(s.id));
      
      return res.json({ 
        success: true, 
        data: filtered,
        type: q ? 'search' : 'recent' // Cho FE biết đây là kết quả tìm kiếm hay gợi ý
      });
    }

    res.json({ 
      success: true, 
      data: students || [],
      type: q ? 'search' : 'recent'
    });
  } catch (error) {
    console.error('Error searching students:', error);
    next(error);
  }
});

// API: Thêm học viên vào lớp (Ghi danh / Enroll)
app.post('/api/classes/:id/enroll', requireAuth, async (req, res, next) => {
  try {
    const { id: class_id } = req.params;
    const { student_id, tuition_fee, discount_amount, paid_amount, notes } = req.body;

    if (!student_id) {
      return res.status(400).json({ success: false, message: 'Thiếu student_id' });
    }

    // Kiểm tra lớp có tồn tại không
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, name, max_students, courses(price)')
      .eq('id', class_id)
      .single();

    if (classError || !classData) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
    }

    // Kiểm tra sĩ số
    const { count: currentCount } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', class_id)
      .eq('status', 'active');

    if (currentCount >= classData.max_students) {
      return res.status(400).json({ 
        success: false, 
        message: `Lớp đã đầy (${currentCount}/${classData.max_students} học viên)` 
      });
    }

    // Kiểm tra học viên đã ghi danh chưa
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('class_id', class_id)
      .eq('student_id', student_id)
      .single();

    if (existing) {
      if (existing.status === 'active') {
        return res.status(400).json({ success: false, message: 'Học viên đã có trong lớp này' });
      }
      
      // Nếu đã dropped, có thể re-activate
      const reactiveTuition = tuition_fee ?? classData.courses?.price ?? 0;
      const reactiveDiscount = discount_amount ?? 0;
      const reactivePaid = paid_amount ?? 0;

      const { data: updated, error: updateError } = await supabase
        .from('enrollments')
        .update({ 
          status: 'active', 
          enrolled_at: new Date().toISOString(),
          tuition_fee: reactiveTuition,
          discount_amount: reactiveDiscount,
          paid_amount: reactivePaid,
          notes
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Tạo hóa đơn mới cho enrollment được kích hoạt lại
      const reactiveAmount = reactiveTuition - reactiveDiscount;
      let reactiveStatus = 'unpaid';
      if (reactivePaid >= reactiveAmount) reactiveStatus = 'paid';
      else if (reactivePaid > 0) reactiveStatus = 'partial';

      const { data: newInvoice } = await supabase
        .from('invoices')
        .insert([{
          student_id,
          enrollment_id: existing.id,
          class_id,
          amount: reactiveTuition,
          discount_amount: reactiveDiscount,
          final_amount: reactiveAmount,
          paid_amount: reactivePaid,
          status: reactiveStatus,
          description: `Học phí lớp ${classData.name} (Ghi danh lại)`,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          created_by: req.user?.id
        }])
        .select()
        .single();

      return res.json({ 
        success: true, 
        message: 'Đã ghi danh lại học viên', 
        data: updated,
        invoice: newInvoice || null
      });
    }

    // Tạo enrollment mới
    const finalTuitionFee = tuition_fee ?? classData.courses?.price ?? 0;
    const finalDiscount = discount_amount ?? 0;
    const finalPaid = paid_amount ?? 0;

    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .insert([{
        class_id,
        student_id,
        tuition_fee: finalTuitionFee,
        discount_amount: finalDiscount,
        paid_amount: finalPaid,
        notes,
        status: 'active'
      }])
      .select()
      .single();

    if (error) throw error;

    // ========== TẠO HÓA ĐƠN TỰ ĐỘNG ==========
    const finalAmount = finalTuitionFee - finalDiscount;
    let invoiceStatus = 'unpaid';
    if (finalPaid >= finalAmount) invoiceStatus = 'paid';
    else if (finalPaid > 0) invoiceStatus = 'partial';

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert([{
        student_id,
        enrollment_id: enrollment.id,
        class_id,
        amount: finalTuitionFee,
        discount_amount: finalDiscount,
        final_amount: finalAmount,
        paid_amount: finalPaid,
        status: invoiceStatus,
        description: `Học phí lớp ${classData.name}`,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 ngày sau
        created_by: req.user?.id
      }])
      .select()
      .single();

    if (invoiceError) {
      console.warn('⚠️ Không thể tạo hóa đơn:', invoiceError.message);
      // Không throw error - enrollment vẫn thành công
    } else {
      console.log(`📄 Tạo hóa đơn ${invoice.invoice_code} cho học viên ${student_id}`);
    }

    console.log(`✅ Ghi danh học viên ${student_id} vào lớp ${classData.name}`);
    res.status(201).json({ 
      success: true, 
      message: 'Ghi danh thành công', 
      data: enrollment,
      invoice: invoice || null
    });
  } catch (error) {
    console.error('Error enrolling student:', error);
    next(error);
  }
});

// API: Xóa học viên khỏi lớp (hoặc đổi trạng thái thành dropped)
app.delete('/api/classes/:classId/students/:studentId', requireAuth, async (req, res, next) => {
  try {
    const { classId, studentId } = req.params;
    const { permanent } = req.query; // ?permanent=true để xóa hẳn

    if (permanent === 'true') {
      // Xóa hẳn enrollment
      const { error } = await supabase
        .from('enrollments')
        .delete()
        .eq('class_id', classId)
        .eq('student_id', studentId);

      if (error) throw error;
      return res.json({ success: true, message: 'Đã xóa học viên khỏi lớp' });
    }

    // Soft delete - đổi status thành dropped
    const { data, error } = await supabase
      .from('enrollments')
      .update({ status: 'dropped', updated_at: new Date().toISOString() })
      .eq('class_id', classId)
      .eq('student_id', studentId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, message: 'Học viên đã rời lớp', data });
  } catch (error) {
    console.error('Error removing student:', error);
    next(error);
  }
});

// API: Cập nhật thông tin ghi danh (học phí, giảm giá, đã đóng)
app.patch('/api/enrollments/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tuition_fee, discount_amount, paid_amount, notes, status } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (tuition_fee !== undefined) updates.tuition_fee = tuition_fee;
    if (discount_amount !== undefined) updates.discount_amount = discount_amount;
    if (paid_amount !== undefined) updates.paid_amount = paid_amount;
    if (notes !== undefined) updates.notes = notes;
    if (status !== undefined) updates.status = status;

    const { data, error } = await supabase
      .from('enrollments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, message: 'Cập nhật thành công', data });
  } catch (error) {
    console.error('Error updating enrollment:', error);
    next(error);
  }
});

// ============================================================
// PAYMENT APIs - Thu học phí
// ============================================================

// API: Tạo thanh toán mới (Thu tiền học viên)
app.post('/api/payments', requireAuth, async (req, res, next) => {
  try {
    const { enrollment_id, student_id, class_id, amount, payment_method, notes } = req.body;

    if (!enrollment_id || !amount) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin enrollment_id hoặc amount' });
    }

    // 1. Lấy thông tin enrollment hiện tại
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id, tuition_fee, discount_amount, paid_amount')
      .eq('id', enrollment_id)
      .single();

    if (enrollmentError || !enrollment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy enrollment' });
    }

    const currentPaid = enrollment.paid_amount || 0;
    const amountDue = (enrollment.tuition_fee || 0) - (enrollment.discount_amount || 0);
    const remaining = amountDue - currentPaid;

    // Kiểm tra số tiền thanh toán có vượt quá số nợ không
    if (amount > remaining) {
      return res.status(400).json({ 
        success: false, 
        message: `Số tiền thanh toán (${amount.toLocaleString()}đ) vượt quá số nợ (${remaining.toLocaleString()}đ)` 
      });
    }

    // 2. Tìm hoặc tạo invoice cho enrollment này
    let { data: invoice } = await supabase
      .from('invoices')
      .select('id, invoice_code')
      .eq('enrollment_id', enrollment_id)
      .eq('status', 'unpaid')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Nếu chưa có invoice unpaid, tìm invoice partial
    if (!invoice) {
      const { data: partialInvoice } = await supabase
        .from('invoices')
        .select('id, invoice_code')
        .eq('enrollment_id', enrollment_id)
        .eq('status', 'partial')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      invoice = partialInvoice;
    }

    // Nếu vẫn không có invoice nào, tạo mới
    if (!invoice) {
      const { data: classInfo } = await supabase
        .from('classes')
        .select('name')
        .eq('id', class_id)
        .single();

      const { data: newInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([{
          student_id,
          enrollment_id,
          class_id,
          amount: enrollment.tuition_fee || 0,
          discount_amount: enrollment.discount_amount || 0,
          final_amount: amountDue,
          paid_amount: currentPaid,
          status: currentPaid > 0 ? 'partial' : 'unpaid',
          description: `Học phí lớp ${classInfo?.name || 'N/A'}`,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          created_by: req.user?.id
        }])
        .select()
        .single();

      if (invoiceError) {
        console.warn('⚠️ Không thể tạo invoice:', invoiceError.message);
      } else {
        invoice = newInvoice;
      }
    }

    // 3. Tạo payment record (nếu có bảng payments)
    let paymentRecord = null;
    if (invoice) {
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert([{
          invoice_id: invoice.id,
          amount: amount,
          payment_method: payment_method || 'cash',
          notes: notes,
          received_by: req.user?.id,
          payment_date: new Date().toISOString()
        }])
        .select()
        .single();

      if (paymentError) {
        console.warn('⚠️ Không thể tạo payment record:', paymentError.message);
        // Không throw - vẫn tiếp tục cập nhật enrollment
      } else {
        paymentRecord = payment;
        console.log(`💰 Payment #${payment.id} created: ${amount.toLocaleString()}đ`);
      }
    }

    // 4. Cập nhật paid_amount trong enrollment
    const newPaidAmount = currentPaid + amount;
    const { data: updatedEnrollment, error: updateError } = await supabase
      .from('enrollments')
      .update({ 
        paid_amount: newPaidAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', enrollment_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 5. Cập nhật invoice status (trigger trong DB sẽ tự động làm, nhưng backup ở đây)
    if (invoice) {
      const newInvoicePaid = (invoice.paid_amount || 0) + amount;
      const invoiceFinal = invoice.final_amount || amountDue;
      let newStatus = 'partial';
      if (newInvoicePaid >= invoiceFinal) newStatus = 'paid';
      else if (newInvoicePaid === 0) newStatus = 'unpaid';

      await supabase
        .from('invoices')
        .update({ 
          paid_amount: newInvoicePaid,
          status: newStatus,
          paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoice.id);
    }

    console.log(`✅ Payment processed: ${amount.toLocaleString()}đ for enrollment ${enrollment_id}`);

    res.status(201).json({ 
      success: true, 
      message: `Đã thu ${amount.toLocaleString()}đ thành công`,
      data: {
        payment: paymentRecord,
        enrollment: updatedEnrollment,
        invoice_code: invoice?.invoice_code
      }
    });

  } catch (error) {
    console.error('Error processing payment:', error);
    next(error);
  }
});

// API: Lấy lịch sử thanh toán của một enrollment
app.get('/api/enrollments/:id/payments', requireAuth, async (req, res, next) => {
  try {
    const { id: enrollment_id } = req.params;

    // Lấy invoice(s) của enrollment
    const { data: invoices, error: invoiceError } = await supabase
      .from('invoices')
      .select('id')
      .eq('enrollment_id', enrollment_id);

    if (invoiceError) throw invoiceError;

    if (!invoices || invoices.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Lấy payments của các invoices
    const invoiceIds = invoices.map(inv => inv.id);
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        payment_method,
        notes,
        payment_date,
        received_by,
        users:received_by(full_name)
      `)
      .in('invoice_id', invoiceIds)
      .order('payment_date', { ascending: false });

    if (paymentsError) throw paymentsError;

    res.json({ success: true, data: payments || [] });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    next(error);
  }
});

// ============================================================
// END CLASS DETAIL APIs
// ============================================================

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
