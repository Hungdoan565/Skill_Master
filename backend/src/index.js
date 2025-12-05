import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase, getDbStatus } from './lib/db.js';
import { requireAuth, requireRole } from './middleware/auth.js';
import { checkScheduleConflict } from './lib/schedule-conflict.js';
import { generateClassSessions, regenerateClassSessions } from './lib/session-generator.js';

dotenv.config();

const app = express();
app.use(cors());
// Tăng limit để cho phép upload ảnh base64 (max 10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ============ HELPER FUNCTIONS FOR PERMISSION ============

/**
 * Lấy center_id hiệu lực dựa trên role của user
 * - SUPER_ADMIN: có thể xem tất cả hoặc filter theo centerId param
 * - CENTER_MANAGER: chỉ được xem center của mình
 * 
 * @returns {Object} { effectiveCenterId, error }
 */
function getEffectiveCenterId(user, requestedCenterId = null) {
  const userRole = user.roleCode;
  const userCenterId = user.centerId;

  // SUPER_ADMIN: không filter hoặc dùng centerId từ query
  if (userRole === 'SUPER_ADMIN') {
    return {
      effectiveCenterId: requestedCenterId || null, // null = tất cả centers
      error: null
    };
  }

  // CENTER_MANAGER hoặc khác: phải có center và chỉ được xem center của mình
  if (!userCenterId) {
    return {
      effectiveCenterId: null,
      error: 'Bạn chưa được gán vào trung tâm nào. Vui lòng liên hệ admin.'
    };
  }

  // Nếu request center khác với center của user
  if (requestedCenterId && requestedCenterId !== userCenterId) {
    return {
      effectiveCenterId: null,
      error: 'Bạn không có quyền xem dữ liệu của trung tâm khác.'
    };
  }

  return {
    effectiveCenterId: userCenterId,
    error: null
  };
}

// ============ UTILITY FUNCTIONS ============

/**
 * Sinh danh sách buổi học từ lịch của lớp và lưu vào bảng sessions
 * @param {string} classId - ID lớp học
 * @param {string} startDate - Ngày bắt đầu (YYYY-MM-DD)
 * @param {string} endDate - Ngày kết thúc (YYYY-MM-DD)
 * @param {Array|string} schedule - Lịch học [{day: 2, start: "18:00", end: "20:00"}, ...]
 * @param {string} teacherId - ID giáo viên
 */
async function generateSessionsForClass(classId, startDate, endDate, schedule, teacherId = null) {
  if (!classId || !startDate || !endDate || !schedule) {
    console.log('⚠️ Không đủ thông tin để sinh sessions');
    return { success: false, count: 0 };
  }

  try {
    // Parse schedule nếu là string
    let scheduleData = schedule;
    if (typeof schedule === 'string') {
      try {
        scheduleData = JSON.parse(schedule);
      } catch (e) {
        console.log('⚠️ Không parse được schedule:', schedule);
        return { success: false, count: 0 };
      }
    }

    if (!Array.isArray(scheduleData) || scheduleData.length === 0) {
      console.log('⚠️ Schedule rỗng hoặc không hợp lệ');
      return { success: false, count: 0 };
    }

    // Xóa sessions cũ của class này
    await supabase.from('sessions').delete().eq('class_id', classId);

    // Map day: 2=T2(Monday), 3=T3(Tuesday), ..., 7=T7(Saturday), 8=CN(Sunday)
    // JS getDay(): 0=Sunday, 1=Monday, ..., 6=Saturday
    const dayMapping = {
      2: 1, // T2 -> Monday (1)
      3: 2, // T3 -> Tuesday (2)
      4: 3, // T4 -> Wednesday (3)
      5: 4, // T5 -> Thursday (4)
      6: 5, // T6 -> Friday (5)
      7: 6, // T7 -> Saturday (6)
      8: 0  // CN -> Sunday (0)
    };

    // Tạo Set các ngày trong tuần có học
    const scheduleDays = new Set();
    const timeByDay = {};
    scheduleData.forEach(s => {
      const jsDay = dayMapping[s.day];
      if (jsDay !== undefined) {
        scheduleDays.add(jsDay);
        timeByDay[jsDay] = { start: s.start || '18:00', end: s.end || '20:00' };
      }
    });

    // Danh sách ngày nghỉ lễ Việt Nam
    const holidays = new Set([
      '2025-01-01', '2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31',
      '2025-02-01', '2025-02-02', '2025-02-03', '2025-04-30', '2025-05-01', '2025-09-02',
      '2026-01-01', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20'
    ]);

    const sessions = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    let sessionNumber = 1;

    // Duyệt từng ngày từ start đến end
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay(); // 0=Sunday, 1=Monday, ...
      const dateStr = d.toISOString().split('T')[0];

      // Kiểm tra ngày này có trong lịch học không và không phải ngày lễ
      if (scheduleDays.has(dayOfWeek) && !holidays.has(dateStr)) {
        const time = timeByDay[dayOfWeek] || { start: '18:00', end: '20:00' };

        // Xác định status
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sessionDate = new Date(d);
        sessionDate.setHours(0, 0, 0, 0);

        let status = 'upcoming';
        if (sessionDate < today) status = 'completed';

        sessions.push({
          class_id: classId,
          teacher_id: teacherId,
          session_number: sessionNumber,
          session_date: dateStr,
          start_time: time.start,
          end_time: time.end,
          status: status
        });
        sessionNumber++;
      }
    }

    // Insert sessions vào DB
    if (sessions.length > 0) {
      const { error } = await supabase.from('sessions').insert(sessions);
      if (error) {
        console.error('❌ Lỗi insert sessions:', error);
        return { success: false, count: 0, error };
      }
    }

    console.log(`✅ Đã sinh ${sessions.length} buổi học cho lớp ${classId}`);
    return { success: true, count: sessions.length };

  } catch (error) {
    console.error('❌ Lỗi generateSessionsForClass:', error);
    return { success: false, count: 0, error };
  }
}

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
// Query params: ?status=active để lọc theo trạng thái
app.get('/api/courses', async (req, res, next) => {
  try {
    const { status } = req.query;

    let query = supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    // Nếu có filter status
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching courses:', error);
    next(error);
  }
});

// ============ PROTECTED APIs (Phải đăng nhập) ============

// Tạo khóa học mới (chỉ admin mới được tạo)
app.post('/api/courses', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const {
      code,
      title,
      description,
      category,
      level,
      total_sessions,
      duration_weeks,
      price,
      cover_image,
      status
    } = req.body;

    // Log user đang tạo (từ middleware)
    console.log(`📝 User ${req.user.email} đang tạo khóa học: ${title}`);

    // Validate dữ liệu đầu vào
    if (!code || !title || !category) {
      return res.status(400).json({
        success: false,
        message: 'Mã khóa học, tên và danh mục là bắt buộc'
      });
    }

    // Check trùng code
    const { data: existing } = await supabase
      .from('courses')
      .select('id')
      .eq('code', code.toUpperCase())
      .single();

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Mã khóa học "${code}" đã tồn tại`
      });
    }

    const { data, error } = await supabase
      .from('courses')
      .insert([{
        code: code.toUpperCase(),
        title,
        description: description || '',
        category,
        level: level || 'Beginner',
        total_sessions: total_sessions || 24,
        duration_weeks: duration_weeks || 12,
        price: price || 0,
        cover_image: cover_image || null,
        status: status || 'active',
        created_by: req.user.id
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

// Cập nhật khóa học (chỉ admin)
app.put('/api/courses/:id', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      code,
      title,
      description,
      category,
      level,
      total_sessions,
      duration_weeks,
      price,
      cover_image,
      status
    } = req.body;

    console.log(`✏️ User ${req.user.email} đang cập nhật khóa học: ${id}`);

    // Validate dữ liệu đầu vào
    if (!code || !title || !category) {
      return res.status(400).json({
        success: false,
        message: 'Mã khóa học, tên và danh mục là bắt buộc'
      });
    }

    // Check trùng code (ngoại trừ chính nó)
    const { data: existing } = await supabase
      .from('courses')
      .select('id')
      .eq('code', code.toUpperCase())
      .neq('id', id)
      .single();

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Mã khóa học "${code}" đã được sử dụng bởi khóa học khác`
      });
    }

    const { data, error } = await supabase
      .from('courses')
      .update({
        code: code.toUpperCase(),
        title,
        description: description || '',
        category,
        level: level || 'Beginner',
        total_sessions: total_sessions || 24,
        duration_weeks: duration_weeks || 12,
        price: price || 0,
        cover_image: cover_image || null,
        status: status || 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Cập nhật khóa học thành công',
      data
    });
  } catch (error) {
    console.error('Error updating course:', error);
    next(error);
  }
});

// Xóa khóa học (chỉ admin)
app.delete('/api/courses/:id', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ User ${req.user.email} đang xóa khóa học: ${id}`);

    // Kiểm tra xem có lớp học nào đang sử dụng khóa học này không
    const { count: classCount, error: countError } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', id);

    if (countError) {
      console.error('Error checking classes:', countError);
    }

    if (classCount && classCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa khóa học này vì đang có ${classCount} lớp học đang sử dụng. Vui lòng xóa hoặc chuyển các lớp học sang khóa học khác trước.`
      });
    }

    // Xóa grade_structures liên quan trước (nếu có)
    const { error: gradeError } = await supabase
      .from('grade_structures')
      .delete()
      .eq('course_id', id);

    if (gradeError) {
      console.error('Error deleting grade structures:', gradeError);
      // Không throw, tiếp tục xóa course
    }

    // Xóa khóa học
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

// ============ GRADE STRUCTURES APIs (Cấu hình cột điểm) ============

// Lấy cấu trúc điểm của một khóa học (bao gồm cả cấu hình tính điểm)
app.get('/api/courses/:courseId/grade-structures', requireAuth, async (req, res, next) => {
  try {
    const { courseId } = req.params;

    // Lấy thông tin cấu hình từ course
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('calculation_type, pass_score, max_total_score')
      .eq('id', courseId)
      .single();

    if (courseError) throw courseError;

    // Lấy danh sách cột điểm
    const { data, error } = await supabase
      .from('grade_structures')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (error) throw error;

    // Tính tổng trọng số
    const totalWeight = data.reduce((sum, col) => sum + parseFloat(col.weight || 0), 0);

    res.json({
      success: true,
      data,
      config: {
        calculationType: courseData?.calculation_type || 'weighted',
        passScore: parseFloat(courseData?.pass_score) || 5.0,
        maxTotalScore: parseFloat(courseData?.max_total_score) || 10.0
      },
      totalWeight: Math.round(totalWeight * 100)
    });
  } catch (error) {
    console.error('Error fetching grade structures:', error);
    next(error);
  }
});

// Lưu toàn bộ cấu trúc điểm + cấu hình của một khóa học
app.put('/api/courses/:courseId/grade-structures', requireAuth, async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { structures, config } = req.body;
    // structures: Array of { name, weight, max_score, order_index }
    // config: { calculationType, passScore, maxTotalScore }

    console.log(`📊 User ${req.user.email} đang cập nhật cấu trúc điểm cho khóa học: ${courseId}`);

    const calculationType = config?.calculationType || 'weighted';

    // Validate tổng trọng số = 100% (chỉ khi dùng weighted)
    if (calculationType === 'weighted' && structures.length > 0) {
      const totalWeight = structures.reduce((sum, s) => sum + parseFloat(s.weight || 0), 0);
      if (Math.abs(totalWeight - 1) > 0.01) {
        return res.status(400).json({
          success: false,
          message: `Tổng trọng số phải bằng 100%. Hiện tại: ${Math.round(totalWeight * 100)}%`
        });
      }
    }

    // Validate không có tên trùng
    const names = structures.map(s => s.name.trim().toLowerCase());
    const uniqueNames = [...new Set(names)];
    if (names.length !== uniqueNames.length) {
      return res.status(400).json({
        success: false,
        message: 'Không được có 2 cột điểm cùng tên'
      });
    }

    // Cập nhật cấu hình vào bảng courses
    const { error: configError } = await supabase
      .from('courses')
      .update({
        calculation_type: config?.calculationType || 'weighted',
        pass_score: parseFloat(config?.passScore) || 5.0,
        max_total_score: parseFloat(config?.maxTotalScore) || 10.0
      })
      .eq('id', courseId);

    if (configError) throw configError;

    // Xóa cấu trúc cũ
    const { error: deleteError } = await supabase
      .from('grade_structures')
      .delete()
      .eq('course_id', courseId);

    if (deleteError) throw deleteError;

    // Thêm cấu trúc mới
    if (structures.length > 0) {
      const newStructures = structures.map((s, index) => ({
        course_id: courseId,
        name: s.name.trim(),
        weight: calculationType === 'sum' ? 0 : (parseFloat(s.weight) || 0),
        max_score: parseFloat(s.max_score) || 10,
        order_index: index + 1,
        description: s.description || null
      }));

      const { error: insertError } = await supabase
        .from('grade_structures')
        .insert(newStructures);

      if (insertError) throw insertError;
    }

    // Lấy lại data mới
    const { data, error } = await supabase
      .from('grade_structures')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      message: 'Cập nhật cấu trúc điểm thành công',
      data,
      config: {
        calculationType: config?.calculationType || 'weighted',
        passScore: parseFloat(config?.passScore) || 5.0,
        maxTotalScore: parseFloat(config?.maxTotalScore) || 10.0
      }
    });
  } catch (error) {
    console.error('Error updating grade structures:', error);
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
    const { role, centerId } = req.query; // Filter theo role: TEACHER, CENTER_MANAGER

    // ====== PERMISSION CHECK ======
    const { effectiveCenterId, error: permError } = getEffectiveCenterId(req.user, centerId);
    if (permError) {
      return res.status(403).json({ success: false, message: permError });
    }

    // Select fields - include hourly_rate và centers
    const selectFields = `
      id,
      email,
      full_name,
      phone,
      avatar_url,
      status,
      hourly_rate,
      center_id,
      created_at,
      roles (id, code, name),
      centers (id, name)
    `;

    let query;

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
          .select(selectFields)
          .eq('role_id', roleData.id)
          .order('created_at', { ascending: false });
      } else {
        return res.json({ success: true, data: [] });
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
        .select(selectFields)
        .neq('role_id', studentRole?.id || '')
        .order('created_at', { ascending: false });
    }

    // ====== CENTER FILTER ======
    if (effectiveCenterId) {
      query = query.eq('center_id', effectiveCenterId);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching staff:', error);
    next(error);
  }
});

// ============ STAFF DETAIL APIs ============

// Lấy chi tiết nhân viên (kèm thống kê lớp dạy, giờ dạy)
app.get('/api/admin/staff/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Lấy thông tin user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        phone,
        avatar_url,
        status,
        hourly_rate,
        center_id,
        created_at,
        updated_at,
        roles (id, code, name),
        centers (id, name, address)
      `)
      .eq('id', id)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhân viên'
      });
    }

    // Kiểm tra có phải staff không (TEACHER hoặc CENTER_MANAGER)
    if (!['TEACHER', 'CENTER_MANAGER', 'SUPER_ADMIN'].includes(user.roles?.code)) {
      return res.status(400).json({
        success: false,
        message: 'User này không phải nhân viên'
      });
    }

    // Lấy thống kê lớp đang dạy (nếu là TEACHER)
    let teachingStats = null;
    if (user.roles?.code === 'TEACHER') {
      // Đếm lớp đang dạy
      const { count: activeClasses } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', id)
        .in('status', ['upcoming', 'ongoing']);

      // Đếm tổng số buổi đã dạy trong tháng này
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data: sessionsThisMonth } = await supabase
        .from('sessions')
        .select('id, duration_hours, teacher_rate')
        .eq('teacher_id', id)
        .eq('status', 'completed')
        .gte('session_date', firstDayOfMonth)
        .lte('session_date', lastDayOfMonth);

      const totalHoursThisMonth = (sessionsThisMonth || []).reduce((sum, s) => sum + (s.duration_hours || 0), 0);
      const totalEarningsThisMonth = (sessionsThisMonth || []).reduce((sum, s) => sum + ((s.duration_hours || 0) * (s.teacher_rate || 0)), 0);

      // Tổng số buổi đã dạy (all time)
      const { count: totalSessions } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', id)
        .eq('status', 'completed');

      teachingStats = {
        activeClasses: activeClasses || 0,
        sessionsThisMonth: sessionsThisMonth?.length || 0,
        totalHoursThisMonth: Math.round(totalHoursThisMonth * 10) / 10,
        totalEarningsThisMonth,
        totalSessionsAllTime: totalSessions || 0
      };
    }

    res.json({
      success: true,
      data: {
        ...user,
        teachingStats
      }
    });
  } catch (error) {
    console.error('Error fetching staff detail:', error);
    next(error);
  }
});

// Cập nhật thông tin nhân viên
app.put('/api/admin/staff/:id', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, phone, status, hourly_rate, center_id, role_code } = req.body;

    console.log(`✏️ Admin ${req.user.email} đang cập nhật nhân viên: ${id}`);

    // Validate
    if (!full_name) {
      return res.status(400).json({
        success: false,
        message: 'Họ tên là bắt buộc'
      });
    }

    // Kiểm tra user tồn tại và là staff
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, roles(code)')
      .eq('id', id)
      .single();

    if (checkError || !existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhân viên'
      });
    }

    if (!['TEACHER', 'CENTER_MANAGER'].includes(existingUser.roles?.code)) {
      return res.status(400).json({
        success: false,
        message: 'User này không phải nhân viên, không thể sửa từ đây'
      });
    }

    // Build update object
    const updateData = {
      full_name,
      phone: phone || null,
      status: status || 'active',
      hourly_rate: hourly_rate || 150000,
      updated_at: new Date().toISOString()
    };

    // Nếu có center_id thì update
    if (center_id !== undefined) {
      updateData.center_id = center_id || null;
    }

    // Nếu đổi role
    if (role_code && role_code !== existingUser.roles?.code) {
      if (!['TEACHER', 'CENTER_MANAGER'].includes(role_code)) {
        return res.status(400).json({
          success: false,
          message: 'Role không hợp lệ cho nhân viên'
        });
      }

      const { data: newRole } = await supabase
        .from('roles')
        .select('id')
        .eq('code', role_code)
        .single();

      if (newRole) {
        updateData.role_id = newRole.id;
      }
    }

    // Update
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select(`
        id, email, full_name, phone, avatar_url, status, hourly_rate, center_id, created_at, updated_at,
        roles (id, code, name),
        centers (id, name)
      `)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Cập nhật nhân viên thành công',
      data
    });
  } catch (error) {
    console.error('Error updating staff:', error);
    next(error);
  }
});

// Xóa/Vô hiệu hóa nhân viên (soft delete - chuyển status thành inactive)
app.delete('/api/admin/staff/:id', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query; // ?permanent=true để xóa vĩnh viễn

    console.log(`🗑️ Admin ${req.user.email} đang xóa nhân viên: ${id}`);

    // Kiểm tra user tồn tại
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email, full_name, roles(code)')
      .eq('id', id)
      .single();

    if (checkError || !existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhân viên'
      });
    }

    if (!['TEACHER', 'CENTER_MANAGER'].includes(existingUser.roles?.code)) {
      return res.status(400).json({
        success: false,
        message: 'User này không phải nhân viên'
      });
    }

    // Kiểm tra xem có đang dạy lớp nào không
    const { count: activeClasses } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .eq('teacher_id', id)
      .in('status', ['upcoming', 'ongoing']);

    if (activeClasses && activeClasses > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa vì nhân viên đang phụ trách ${activeClasses} lớp học. Vui lòng chuyển lớp cho người khác trước.`
      });
    }

    if (permanent === 'true') {
      // Xóa vĩnh viễn - cần xóa cả trong Supabase Auth
      // Lưu ý: Điều này sẽ cascade delete các record liên quan
      const { error: deleteError } = await supabase.auth.admin.deleteUser(id);

      if (deleteError) {
        console.error('Error deleting from auth:', deleteError);
        // Vẫn thử xóa từ public.users
      }

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.json({
        success: true,
        message: `Đã xóa vĩnh viễn nhân viên "${existingUser.full_name}"`
      });
    } else {
      // Soft delete - chỉ đổi status
      const { data, error } = await supabase
        .from('users')
        .update({
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('id, full_name, status')
        .single();

      if (error) throw error;

      res.json({
        success: true,
        message: `Đã vô hiệu hóa nhân viên "${existingUser.full_name}"`,
        data
      });
    }
  } catch (error) {
    console.error('Error deleting staff:', error);
    next(error);
  }
});

// Khôi phục nhân viên đã vô hiệu hóa
app.patch('/api/admin/staff/:id/restore', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('users')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, full_name, status')
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: `Đã khôi phục nhân viên "${data.full_name}"`,
      data
    });
  } catch (error) {
    console.error('Error restoring staff:', error);
    next(error);
  }
});

// ============================================================
// CENTERS MANAGEMENT APIs - Quản lý Trung tâm
// ============================================================

/**
 * GET /api/admin/centers - Lấy danh sách trung tâm (với thống kê)
 */
app.get('/api/admin/centers', requireAuth, async (req, res, next) => {
  try {
    const { status, search, withStats } = req.query;

    console.log(`🏢 Admin ${req.user.email} xem danh sách trung tâm`);

    let query = supabase
      .from('centers')
      .select(`
        id, 
        code,
        name, 
        address, 
        hotline,
        email,
        logo_url,
        description,
        working_hours,
        status,
        manager_id,
        created_at,
        updated_at
      `)
      .order('name');

    // Filter theo status
    if (status) {
      query = query.eq('status', status);
    }

    // Search
    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,address.ilike.%${search}%`);
    }

    const { data: centers, error } = await query;
    if (error) throw error;

    // Nếu yêu cầu thống kê
    if (withStats === 'true') {
      const centersWithStats = await Promise.all(
        (centers || []).map(async (center) => {
          // Đếm số phòng
          const { count: roomCount } = await supabase
            .from('rooms')
            .select('*', { count: 'exact', head: true })
            .eq('center_id', center.id);

          // Đếm số lớp đang hoạt động
          const { count: classCount } = await supabase
            .from('classes')
            .select('*', { count: 'exact', head: true })
            .eq('center_id', center.id)
            .in('status', ['upcoming', 'ongoing']);

          // Đếm số nhân viên
          const { count: staffCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('center_id', center.id)
            .eq('status', 'active');

          // Lấy thông tin manager nếu có
          let manager = null;
          if (center.manager_id) {
            const { data: managerData } = await supabase
              .from('users')
              .select('id, full_name, email, avatar_url')
              .eq('id', center.manager_id)
              .single();
            manager = managerData;
          }

          return {
            ...center,
            manager,
            stats: {
              roomCount: roomCount || 0,
              classCount: classCount || 0,
              staffCount: staffCount || 0
            }
          };
        })
      );

      return res.json({ success: true, data: centersWithStats });
    }

    res.json({ success: true, data: centers || [] });
  } catch (error) {
    console.error('Error fetching centers:', error);
    next(error);
  }
});

/**
 * GET /api/admin/centers/:id - Chi tiết trung tâm
 */
app.get('/api/admin/centers/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log(`🏢 Admin ${req.user.email} xem chi tiết center: ${id}`);

    // Lấy thông tin center
    const { data: center, error } = await supabase
      .from('centers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !center) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy trung tâm'
      });
    }

    // Lấy manager info
    let manager = null;
    if (center.manager_id) {
      const { data: managerData } = await supabase
        .from('users')
        .select('id, full_name, email, phone, avatar_url')
        .eq('id', center.manager_id)
        .single();
      manager = managerData;
    }

    // Thống kê chi tiết
    const [roomsRes, classesRes, staffRes, studentsRes] = await Promise.all([
      supabase.from('rooms').select('*', { count: 'exact', head: true }).eq('center_id', id),
      supabase.from('classes').select('*', { count: 'exact', head: true }).eq('center_id', id),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('center_id', id).eq('status', 'active'),
      // Đếm học viên đang học tại center (qua enrollments)
      supabase
        .from('enrollments')
        .select('student_id, classes!inner(center_id)', { count: 'exact', head: true })
        .eq('classes.center_id', id)
        .eq('status', 'active')
    ]);

    res.json({
      success: true,
      data: {
        ...center,
        manager,
        stats: {
          roomCount: roomsRes.count || 0,
          classCount: classesRes.count || 0,
          staffCount: staffRes.count || 0,
          studentCount: studentsRes.count || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching center detail:', error);
    next(error);
  }
});

/**
 * GET /api/admin/centers/:id/stats - Thống kê chi tiết trung tâm
 */
app.get('/api/admin/centers/:id/stats', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log(`📊 Admin ${req.user.email} xem thống kê center: ${id}`);

    // Kiểm tra center tồn tại
    const { data: center, error: centerError } = await supabase
      .from('centers')
      .select('id, name, code')
      .eq('id', id)
      .single();

    if (centerError || !center) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy trung tâm'
      });
    }

    // Parallel queries cho performance
    const [
      roomsRes,
      classesRes,
      staffByRoleRes,
      revenueRes,
      sessionsRes
    ] = await Promise.all([
      // 1. Thống kê phòng học
      supabase
        .from('rooms')
        .select('status, room_type')
        .eq('center_id', id),

      // 2. Thống kê lớp học theo status
      supabase
        .from('classes')
        .select('status')
        .eq('center_id', id),

      // 3. Nhân sự theo role
      supabase
        .from('users')
        .select('roles(code)')
        .eq('center_id', id)
        .eq('status', 'active'),

      // 4. Doanh thu tháng này
      supabase
        .from('invoices')
        .select('paid_amount, classes!inner(center_id)')
        .eq('classes.center_id', id)
        .eq('status', 'paid')
        .gte('paid_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),

      // 5. Sessions tháng này
      supabase
        .from('sessions')
        .select('status, classes!inner(center_id)')
        .eq('classes.center_id', id)
        .gte('session_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
    ]);

    // Process room stats
    const rooms = roomsRes.data || [];
    const roomStats = {
      total: rooms.length,
      active: rooms.filter(r => r.status === 'active').length,
      maintenance: rooms.filter(r => r.status === 'maintenance').length,
      byType: {
        standard: rooms.filter(r => r.room_type === 'standard').length,
        lab: rooms.filter(r => r.room_type === 'lab').length,
        vip: rooms.filter(r => r.room_type === 'vip').length
      }
    };

    // Process class stats
    const classes = classesRes.data || [];
    const classStats = {
      total: classes.length,
      upcoming: classes.filter(c => c.status === 'upcoming').length,
      ongoing: classes.filter(c => c.status === 'ongoing').length,
      completed: classes.filter(c => c.status === 'completed').length
    };

    // Process staff stats
    const staffList = staffByRoleRes.data || [];
    const staffStats = {
      total: staffList.length,
      teachers: staffList.filter(s => s.roles?.code === 'TEACHER').length,
      managers: staffList.filter(s => s.roles?.code === 'CENTER_MANAGER').length
    };

    // Process revenue
    const invoices = revenueRes.data || [];
    const monthlyRevenue = invoices.reduce((sum, inv) => sum + (parseFloat(inv.paid_amount) || 0), 0);

    // Process sessions
    const sessions = sessionsRes.data || [];
    const sessionStats = {
      total: sessions.length,
      completed: sessions.filter(s => s.status === 'completed').length,
      scheduled: sessions.filter(s => s.status === 'scheduled').length
    };

    res.json({
      success: true,
      data: {
        center,
        rooms: roomStats,
        classes: classStats,
        staff: staffStats,
        sessions: sessionStats,
        revenue: {
          monthly: monthlyRevenue,
          invoiceCount: invoices.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching center stats:', error);
    next(error);
  }
});

/**
 * POST /api/admin/centers - Tạo trung tâm mới (SUPER_ADMIN only)
 */
app.post('/api/admin/centers', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res, next) => {
  try {
    const { code, name, address, hotline, email, logo_url, description, working_hours, manager_id } = req.body;

    console.log(`🏢 SUPER_ADMIN ${req.user.email} tạo trung tâm mới: ${name}`);

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Tên trung tâm là bắt buộc'
      });
    }

    // Auto-generate code nếu không có
    let centerCode = code;
    if (!centerCode) {
      const { count } = await supabase
        .from('centers')
        .select('*', { count: 'exact', head: true });
      centerCode = `CTR${String((count || 0) + 1).padStart(2, '0')}`;
    }

    // Check code uniqueness
    const { data: existingCode } = await supabase
      .from('centers')
      .select('id')
      .eq('code', centerCode)
      .single();

    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: 'Mã trung tâm đã tồn tại'
      });
    }

    // Insert
    const { data, error } = await supabase
      .from('centers')
      .insert({
        code: centerCode,
        name,
        address,
        hotline,
        email,
        logo_url,
        description,
        working_hours: working_hours || null,
        manager_id: manager_id || null,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    // Nếu có manager_id, cập nhật center_id cho manager
    if (manager_id) {
      await supabase
        .from('users')
        .update({ center_id: data.id })
        .eq('id', manager_id);
    }

    res.status(201).json({
      success: true,
      message: 'Tạo trung tâm thành công',
      data
    });
  } catch (error) {
    console.error('Error creating center:', error);
    next(error);
  }
});

/**
 * PUT /api/admin/centers/:id - Cập nhật trung tâm (SUPER_ADMIN only)
 */
app.put('/api/admin/centers/:id', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    console.log(`✏️ SUPER_ADMIN ${req.user.email} cập nhật center: ${id}`);

    // Validate
    const { data: existing, error: checkError } = await supabase
      .from('centers')
      .select('id, code, manager_id')
      .eq('id', id)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy trung tâm'
      });
    }

    // Kiểm tra code uniqueness nếu thay đổi
    if (updates.code && updates.code !== existing.code) {
      const { data: existingCode } = await supabase
        .from('centers')
        .select('id')
        .eq('code', updates.code)
        .neq('id', id)
        .single();

      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: 'Mã trung tâm đã tồn tại'
        });
      }
    }

    // Remove fields không được update
    delete updates.id;
    delete updates.created_at;

    // Update
    const { data, error } = await supabase
      .from('centers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Nếu thay đổi manager
    if (updates.manager_id !== undefined && updates.manager_id !== existing.manager_id) {
      // Remove center_id from old manager
      if (existing.manager_id) {
        await supabase
          .from('users')
          .update({ center_id: null })
          .eq('id', existing.manager_id);
      }
      // Assign center_id to new manager
      if (updates.manager_id) {
        await supabase
          .from('users')
          .update({ center_id: id })
          .eq('id', updates.manager_id);
      }
    }

    res.json({
      success: true,
      message: 'Cập nhật trung tâm thành công',
      data
    });
  } catch (error) {
    console.error('Error updating center:', error);
    next(error);
  }
});

/**
 * DELETE /api/admin/centers/:id - Vô hiệu hóa trung tâm (SUPER_ADMIN only)
 */
app.delete('/api/admin/centers/:id', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;

    console.log(`🗑️ SUPER_ADMIN ${req.user.email} xóa center: ${id}`);

    // Check existence
    const { data: existing, error: checkError } = await supabase
      .from('centers')
      .select('id, name, status')
      .eq('id', id)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy trung tâm'
      });
    }

    // Kiểm tra còn lớp đang hoạt động không
    const { count: activeClasses } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .eq('center_id', id)
      .in('status', ['upcoming', 'ongoing']);

    if (activeClasses > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa. Trung tâm còn ${activeClasses} lớp đang hoạt động.`
      });
    }

    // Soft delete (default) hoặc hard delete
    if (permanent === 'true') {
      // Hard delete - chỉ khi không còn data liên quan
      const { count: roomCount } = await supabase
        .from('rooms')
        .select('*', { count: 'exact', head: true })
        .eq('center_id', id);

      if (roomCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Không thể xóa vĩnh viễn. Trung tâm còn ${roomCount} phòng học.`
        });
      }

      const { error } = await supabase
        .from('centers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.json({
        success: true,
        message: `Đã xóa vĩnh viễn trung tâm "${existing.name}"`
      });
    }

    // Soft delete - chuyển status thành inactive
    const { data, error } = await supabase
      .from('centers')
      .update({ status: 'inactive' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: `Đã vô hiệu hóa trung tâm "${existing.name}"`,
      data
    });
  } catch (error) {
    console.error('Error deleting center:', error);
    next(error);
  }
});

/**
 * PATCH /api/admin/centers/:id/restore - Khôi phục trung tâm
 */
app.patch('/api/admin/centers/:id/restore', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log(`♻️ SUPER_ADMIN ${req.user.email} khôi phục center: ${id}`);

    const { data, error } = await supabase
      .from('centers')
      .update({ status: 'active' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: `Đã khôi phục trung tâm "${data.name}"`,
      data
    });
  } catch (error) {
    console.error('Error restoring center:', error);
    next(error);
  }
});

/**
 * PATCH /api/admin/centers/:id/manager - Gán/đổi quản lý trung tâm
 */
app.patch('/api/admin/centers/:id/manager', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { manager_id } = req.body;

    console.log(`👔 SUPER_ADMIN ${req.user.email} gán manager cho center: ${id}`);

    // Validate manager
    if (manager_id) {
      const { data: manager, error: managerError } = await supabase
        .from('users')
        .select('id, full_name, roles(code)')
        .eq('id', manager_id)
        .single();

      if (managerError || !manager) {
        return res.status(400).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
      }

      if (manager.roles?.code !== 'CENTER_MANAGER') {
        return res.status(400).json({
          success: false,
          message: 'Người được chọn phải có vai trò Quản lý (CENTER_MANAGER)'
        });
      }
    }

    // Lấy old manager để remove
    const { data: center } = await supabase
      .from('centers')
      .select('manager_id')
      .eq('id', id)
      .single();

    // Update center
    const { data, error } = await supabase
      .from('centers')
      .update({ manager_id: manager_id || null })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update users
    if (center?.manager_id && center.manager_id !== manager_id) {
      await supabase.from('users').update({ center_id: null }).eq('id', center.manager_id);
    }
    if (manager_id) {
      await supabase.from('users').update({ center_id: id }).eq('id', manager_id);
    }

    res.json({
      success: true,
      message: manager_id ? 'Đã gán quản lý cho trung tâm' : 'Đã xóa quản lý trung tâm',
      data
    });
  } catch (error) {
    console.error('Error assigning manager:', error);
    next(error);
  }
});

// ============================================================
// END CENTERS MANAGEMENT APIs
// ============================================================

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
    const { search, status, centerId } = req.query;

    // ====== PERMISSION CHECK ======
    const { effectiveCenterId, error: permError } = getEffectiveCenterId(req.user, centerId);
    if (permError) {
      return res.status(403).json({ success: false, message: permError });
    }

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
        center_id,
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

    // ====== CENTER FILTER ======
    // Học viên có thể học ở nhiều center qua enrollments, nên cần filter khác
    // Lấy học viên có enrollment tại center này
    if (effectiveCenterId) {
      // Lấy danh sách student_id đang học tại center này
      const { data: enrolledStudents } = await supabase
        .from('enrollments')
        .select('student_id, classes!inner(center_id)')
        .eq('classes.center_id', effectiveCenterId)
        .eq('status', 'active');

      const studentIds = [...new Set((enrolledStudents || []).map(e => e.student_id))];

      if (studentIds.length > 0) {
        query = query.in('id', studentIds);
      } else {
        // Không có học viên nào tại center này
        return res.json({ success: true, data: [] });
      }
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

// ============ STUDENT DETAIL APIs ============

// Lấy chi tiết học viên (kèm enrollments, invoices, attendance)
app.get('/api/admin/students/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Lấy thông tin user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        phone,
        avatar_url,
        status,
        created_at,
        updated_at,
        roles (id, code, name)
      `)
      .eq('id', id)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy học viên'
      });
    }

    // Kiểm tra có phải STUDENT không
    if (user.roles?.code !== 'STUDENT') {
      return res.status(400).json({
        success: false,
        message: 'User này không phải học viên'
      });
    }

    // Lấy danh sách lớp đang học (enrollments)
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(`
        id,
        status,
        enrolled_at,
        tuition_fee,
        discount_amount,
        paid_amount,
        classes (
          id,
          code,
          name,
          status,
          start_date,
          end_date,
          courses (id, title, category)
        )
      `)
      .eq('student_id', id)
      .order('enrolled_at', { ascending: false });

    // Lấy danh sách hóa đơn
    const { data: invoices } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_code,
        final_amount,
        paid_amount,
        status,
        due_date,
        created_at
      `)
      .eq('student_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Tính thống kê
    const activeEnrollments = (enrollments || []).filter(e => e.status === 'active');
    const completedEnrollments = (enrollments || []).filter(e => e.status === 'completed');

    const totalPaid = (invoices || []).reduce((sum, inv) => sum + (inv.paid_amount || 0), 0);
    const totalDebt = (invoices || [])
      .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
      .reduce((sum, inv) => sum + ((inv.final_amount || 0) - (inv.paid_amount || 0)), 0);

    // Lấy thống kê điểm danh (30 ngày gần nhất)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('id, status, enrollment_id')
      .in('enrollment_id', (enrollments || []).map(e => e.id))
      .gte('session_date', thirtyDaysAgo.toISOString().split('T')[0]);

    const attendanceStats = {
      total: attendanceData?.length || 0,
      present: attendanceData?.filter(a => a.status === 'present').length || 0,
      absent: attendanceData?.filter(a => a.status === 'absent').length || 0,
      late: attendanceData?.filter(a => a.status === 'late').length || 0,
    };

    res.json({
      success: true,
      data: {
        ...user,
        enrollments: enrollments || [],
        invoices: invoices || [],
        stats: {
          activeClasses: activeEnrollments.length,
          completedClasses: completedEnrollments.length,
          totalClasses: (enrollments || []).length,
          totalPaid,
          totalDebt,
          attendance: attendanceStats
        }
      }
    });
  } catch (error) {
    console.error('Error fetching student detail:', error);
    next(error);
  }
});

// Cập nhật thông tin học viên
app.put('/api/admin/students/:id', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, phone, status } = req.body;

    console.log(`✏️ Admin ${req.user.email} đang cập nhật học viên: ${id}`);

    // Validate
    if (!full_name) {
      return res.status(400).json({
        success: false,
        message: 'Họ tên là bắt buộc'
      });
    }

    // Kiểm tra user tồn tại và là student
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, roles(code)')
      .eq('id', id)
      .single();

    if (checkError || !existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy học viên'
      });
    }

    if (existingUser.roles?.code !== 'STUDENT') {
      return res.status(400).json({
        success: false,
        message: 'User này không phải học viên'
      });
    }

    // Update
    const { data, error } = await supabase
      .from('users')
      .update({
        full_name,
        phone: phone || null,
        status: status || 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        id, email, full_name, phone, avatar_url, status, created_at, updated_at,
        roles (id, code, name)
      `)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Cập nhật học viên thành công',
      data
    });
  } catch (error) {
    console.error('Error updating student:', error);
    next(error);
  }
});

// Vô hiệu hóa học viên
app.delete('/api/admin/students/:id', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ Admin ${req.user.email} đang vô hiệu hóa học viên: ${id}`);

    // Kiểm tra user tồn tại
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, full_name, roles(code)')
      .eq('id', id)
      .single();

    if (checkError || !existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy học viên'
      });
    }

    if (existingUser.roles?.code !== 'STUDENT') {
      return res.status(400).json({
        success: false,
        message: 'User này không phải học viên'
      });
    }

    // Kiểm tra còn enrollment active không
    const { count: activeEnrollments } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', id)
      .eq('status', 'active');

    if (activeEnrollments && activeEnrollments > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể vô hiệu hóa vì học viên đang học ${activeEnrollments} lớp. Vui lòng rút khỏi lớp trước.`
      });
    }

    // Soft delete
    const { data, error } = await supabase
      .from('users')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, full_name, status')
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: `Đã vô hiệu hóa học viên "${existingUser.full_name}"`,
      data
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    next(error);
  }
});

// Khôi phục học viên
app.patch('/api/admin/students/:id/restore', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('users')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, full_name, status')
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: `Đã khôi phục học viên "${data.full_name}"`,
      data
    });
  } catch (error) {
    console.error('Error restoring student:', error);
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
    const { status, course_id, teacher_id, centerId } = req.query;

    // ====== PERMISSION CHECK ======
    const { effectiveCenterId, error: permError } = getEffectiveCenterId(req.user, centerId);
    if (permError) {
      return res.status(403).json({ success: false, message: permError });
    }

    let query = supabase
      .from('classes')
      .select(`
        id,
        code,
        name,
        center_id,
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

    // ====== CENTER FILTER ======
    if (effectiveCenterId) {
      query = query.eq('center_id', effectiveCenterId);
    }

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

// ========================================
// 🔥 API KIỂM TRA XUNG ĐỘT LỊCH HỌC (Real-time check từ Frontend)
// ========================================
app.post('/api/classes/check-conflict', requireAuth, async (req, res, next) => {
  try {
    const { teacher_id, room_id, start_date, end_date, schedule, exclude_class_id } = req.body;

    // Validate input
    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
      return res.json({ success: true, hasConflict: false, conflicts: [] });
    }

    if (!start_date || !end_date) {
      return res.json({ success: true, hasConflict: false, conflicts: [] });
    }

    if (!room_id && !teacher_id) {
      return res.json({ success: true, hasConflict: false, conflicts: [] });
    }

    // Check conflict
    const conflictCheck = await checkScheduleConflict(supabase, {
      room_id,
      teacher_id,
      start_date,
      end_date,
      schedule
    }, exclude_class_id);

    // Format messages cho từng conflict
    const conflictsWithMessages = (conflictCheck.conflicts || []).map(c => ({
      ...c,
      message: `${c.conflict_type.includes('room') ? `Phòng ${c.room_name || 'đã chọn'}` : `GV ${c.teacher_name || 'đã chọn'}`} trùng lịch với lớp "${c.class_name}" vào ${c.conflict_day} (${c.conflict_time?.existing})`
    }));

    res.json({
      success: true,
      hasConflict: conflictCheck.hasConflict,
      conflicts: conflictsWithMessages,
      summary: conflictCheck.summary
    });

  } catch (error) {
    console.error('Error checking schedule conflict:', error);
    next(error);
  }
});

// Tạo lớp học mới
app.post('/api/admin/classes', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
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

    // ========================================
    // 🔥 KIỂM TRA XUNG ĐỘT LỊCH HỌC
    // ========================================
    if ((room_id || teacher_id) && start_date && end_date && schedule && schedule.length > 0) {
      const conflictCheck = await checkScheduleConflict(supabase, {
        room_id,
        teacher_id,
        start_date,
        end_date,
        schedule
      });

      if (conflictCheck.hasConflict) {
        console.log(`⚠️ Phát hiện xung đột lịch:`, conflictCheck.conflicts);
        return res.status(409).json({
          success: false,
          message: conflictCheck.summary || 'Phát hiện xung đột lịch học',
          conflicts: conflictCheck.conflicts
        });
      }
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

    // 🔥 Tự động sinh sessions cho lớp mới
    let sessionResult = null;
    if (data && start_date && end_date && schedule && schedule.length > 0) {
      sessionResult = await generateClassSessions(supabase, {
        id: data.id,
        start_date,
        end_date,
        schedule,
        teacher_id: teacher_id || null
      });
      console.log(`📅 Sessions generated: ${sessionResult.count} buổi`);
    }

    res.status(201).json({
      success: true,
      message: 'Tạo lớp học thành công',
      data,
      sessions: sessionResult ? {
        count: sessionResult.count,
        summary: sessionResult.summary
      } : null
    });
  } catch (error) {
    console.error('Error creating class:', error);
    next(error);
  }
});

// Cập nhật lớp học
app.put('/api/admin/classes/:id', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const { regenerate_sessions } = req.query; // ?regenerate_sessions=true

    console.log(`✏️ Admin ${req.user.email} cập nhật lớp: ${id}`);

    delete updates.id;
    delete updates.created_at;

    // ========================================
    // 🔥 KIỂM TRA XUNG ĐỘT LỊCH HỌC KHI UPDATE
    // ========================================
    const { room_id, teacher_id, start_date, end_date, schedule } = updates;

    if ((room_id || teacher_id) && start_date && end_date && schedule && schedule.length > 0) {
      const conflictCheck = await checkScheduleConflict(supabase, {
        room_id,
        teacher_id,
        start_date,
        end_date,
        schedule
      }, id); // Loại trừ chính lớp đang update

      if (conflictCheck.hasConflict) {
        console.log(`⚠️ Phát hiện xung đột lịch khi update:`, conflictCheck.conflicts);
        return res.status(409).json({
          success: false,
          message: conflictCheck.summary || 'Phát hiện xung đột lịch học',
          conflicts: conflictCheck.conflicts
        });
      }
    }

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

    // 🔥 Regenerate sessions nếu được yêu cầu và có đủ thông tin
    let sessionsUpdated = 0;
    if (regenerate_sessions === 'true' && data.start_date && data.end_date && data.schedule) {
      // Dùng generateClassSessions với option deleteExisting = true
      const sessionResult = await generateClassSessions(supabase, {
        id: id,
        start_date: data.start_date,
        end_date: data.end_date,
        schedule: data.schedule,
        teacher_id: data.teacher_id
      }, { deleteExisting: true, skipLocked: true });

      sessionsUpdated = sessionResult.count;
      console.log(`📅 Sessions regenerated: ${sessionsUpdated} buổi`);
    }

    res.json({
      success: true,
      message: 'Cập nhật lớp học thành công',
      data,
      sessionsUpdated
    });
  } catch (error) {
    console.error('Error updating class:', error);
    next(error);
  }
});

// Xóa lớp học
app.delete('/api/admin/classes/:id', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ Admin ${req.user.email} xóa lớp: ${id}`);

    // Kiểm tra số học viên đã ghi danh (chỉ đếm active enrollments)
    const { count, error: countError } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', id)
      .eq('status', 'active');

    if (countError) {
      console.error('Error counting enrollments:', countError);
    }

    if (count && count > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa lớp học vì có ${count} học viên đang ghi danh. Vui lòng hủy ghi danh tất cả học viên trước.`
      });
    }

    // Hủy các hóa đơn chưa thanh toán của lớp này (vì không còn học viên)
    const { error: cancelInvoicesError } = await supabase
      .from('invoices')
      .update({ status: 'cancelled', class_id: null })
      .eq('class_id', id)
      .in('status', ['unpaid', 'partial']);

    if (cancelInvoicesError) {
      console.error('Error cancelling unpaid invoices:', cancelInvoicesError);
    }

    // Hủy liên kết các hóa đơn đã thanh toán (giữ lại lịch sử)
    const { error: unlinkInvoicesError } = await supabase
      .from('invoices')
      .update({ class_id: null })
      .eq('class_id', id);

    if (unlinkInvoicesError) {
      console.error('Error unlinking invoices:', unlinkInvoicesError);
    }

    // Xóa các sessions liên quan trước
    const { error: sessionsError } = await supabase
      .from('sessions')
      .delete()
      .eq('class_id', id);

    if (sessionsError) {
      console.error('Error deleting sessions:', sessionsError);
    }

    // Lấy danh sách TẤT CẢ enrollment IDs của lớp này (vì không còn active)
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('id')
      .eq('class_id', id);

    // Xóa attendance records liên quan đến các enrollments
    if (enrollments && enrollments.length > 0) {
      const ids = enrollments.map(e => e.id);
      const { error: attendanceError } = await supabase
        .from('attendance')
        .delete()
        .in('enrollment_id', ids);

      if (attendanceError) {
        console.error('Error deleting attendance:', attendanceError);
      }

      // Xóa student_grades nếu có
      const { error: gradesError } = await supabase
        .from('student_grades')
        .delete()
        .in('enrollment_id', ids);

      if (gradesError) {
        console.error('Error deleting student_grades:', gradesError);
      }
    }

    // Xóa TẤT CẢ enrollments của lớp (vì đã kiểm tra không còn active)
    const { error: enrollmentsError } = await supabase
      .from('enrollments')
      .delete()
      .eq('class_id', id);

    if (enrollmentsError) {
      console.error('Error deleting inactive enrollments:', enrollmentsError);
    }

    // Xóa lớp học
    const { error } = await supabase.from('classes').delete().eq('id', id);
    if (error) throw error;

    res.json({ success: true, message: 'Xóa lớp học thành công' });
  } catch (error) {
    console.error('Error deleting class:', error);
    next(error);
  }
});

// ============ SESSION MANAGEMENT APIs ============

// ========================================
// 🔥 GLOBAL SESSIONS - Tổng quan lịch dạy toàn trung tâm
// ========================================
app.get('/api/admin/sessions', requireAuth, async (req, res, next) => {
  try {
    const {
      startDate,      // YYYY-MM-DD
      endDate,        // YYYY-MM-DD  
      status,         // scheduled | completed | cancelled
      teacherId,      // UUID
      centerId,       // UUID
      roomId          // UUID
    } = req.query;

    // ====== PERMISSION CHECK ======
    // SUPER_ADMIN: xem tất cả centers
    // CENTER_MANAGER: chỉ xem center của mình
    const userRole = req.user.roleCode;
    const userCenterId = req.user.centerId;

    let effectiveCenterId = centerId; // centerId từ query param

    if (userRole !== 'SUPER_ADMIN') {
      // Không phải SUPER_ADMIN => bắt buộc dùng center của user
      if (!userCenterId) {
        return res.status(403).json({
          success: false,
          message: 'Bạn chưa được gán vào trung tâm nào. Vui lòng liên hệ admin.'
        });
      }

      // Nếu client request centerId khác với center của user => reject
      if (centerId && centerId !== userCenterId) {
        console.warn(`⚠️ User ${req.user.email} (${userRole}) tried to access center ${centerId} but belongs to ${userCenterId}`);
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xem dữ liệu của trung tâm khác.'
        });
      }

      // Force sử dụng center của user
      effectiveCenterId = userCenterId;
    }

    console.log(`📅 Admin ${req.user.email} (${userRole}) xem lịch dạy: ${startDate} - ${endDate} | Center: ${effectiveCenterId || 'ALL'}`);

    let query = supabase
      .from('sessions')
      .select(`
        id,
        session_number,
        session_date,
        start_time,
        end_time,
        duration_hours,
        status,
        topic,
        is_locked,
        teacher_id,
        class_id,
        classes (
          id, 
          name, 
          code,
          room_id,
          center_id,
          rooms (id, name),
          centers (id, name)
        ),
        users!sessions_teacher_id_fkey (id, full_name, email, avatar_url)
      `)
      .order('session_date', { ascending: true })
      .order('start_time', { ascending: true });

    // Filter theo date range (BẮT BUỘC để tránh load quá nhiều)
    if (startDate) {
      query = query.gte('session_date', startDate);
    } else {
      // Default: từ đầu tháng hiện tại
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      query = query.gte('session_date', firstDay.toISOString().split('T')[0]);
    }

    if (endDate) {
      query = query.lte('session_date', endDate);
    } else {
      // Default: đến cuối tháng hiện tại
      const today = new Date();
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      query = query.lte('session_date', lastDay.toISOString().split('T')[0]);
    }

    // Filter theo status
    if (status) {
      if (status.includes(',')) {
        query = query.in('status', status.split(','));
      } else {
        query = query.eq('status', status);
      }
    }

    // Filter theo giáo viên
    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Post-filter theo center và room (vì nested filter không được support trực tiếp)
    let filteredData = data || [];

    // Dùng effectiveCenterId (đã được permission check ở trên)
    if (effectiveCenterId) {
      filteredData = filteredData.filter(s => s.classes?.center_id === effectiveCenterId);
    }

    if (roomId) {
      filteredData = filteredData.filter(s => s.classes?.room_id === roomId);
    }

    // Thống kê nhanh
    const stats = {
      total: filteredData.length,
      scheduled: filteredData.filter(s => s.status === 'scheduled').length,
      completed: filteredData.filter(s => s.status === 'completed').length,
      cancelled: filteredData.filter(s => s.status === 'cancelled').length,
      // Buổi học đã quá giờ mà chưa điểm danh
      overdue: filteredData.filter(s => {
        if (s.status !== 'scheduled') return false;
        const sessionDateTime = new Date(`${s.session_date}T${s.end_time}`);
        return sessionDateTime < new Date();
      }).length
    };

    res.json({
      success: true,
      data: filteredData,
      stats
    });
  } catch (error) {
    console.error('Error fetching global sessions:', error);
    next(error);
  }
});

// Lấy danh sách sessions của một lớp
app.get('/api/admin/classes/:classId/sessions', requireAuth, async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { status, month, year } = req.query;

    let query = supabase
      .from('sessions')
      .select(`
        *,
        classes (id, name, code),
        users!sessions_teacher_id_fkey (id, full_name, email)
      `)
      .eq('class_id', classId)
      .order('session_date', { ascending: true });

    if (status) query = query.eq('status', status);

    // Filter theo tháng/năm (cho payroll)
    if (month && year) {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      query = query.gte('session_date', startDate).lte('session_date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (error) {
    next(error);
  }
});

// Regenerate sessions cho một lớp
app.post('/api/admin/classes/:classId/regenerate-sessions', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { classId } = req.params;

    console.log(`🔄 Admin ${req.user.email} regenerate sessions cho lớp: ${classId}`);

    const result = await regenerateClassSessions(supabase, classId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error || 'Không thể tạo sessions'
      });
    }

    res.json({
      success: true,
      message: `Đã tạo ${result.count} buổi học`,
      count: result.count,
      summary: result.summary
    });
  } catch (error) {
    next(error);
  }
});

// Cập nhật một session (đổi GV, đổi status, etc.)
app.put('/api/admin/sessions/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Kiểm tra session có bị lock không
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('is_locked, class_id')
      .eq('id', id)
      .single();

    if (sessionError) throw sessionError;
    if (!session) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy buổi học' });
    }

    if (session?.is_locked) {
      return res.status(400).json({
        success: false,
        message: 'Buổi học đã được khóa sổ, không thể sửa'
      });
    }

    // Không cho sửa các trường quan trọng
    delete updates.is_locked;
    delete updates.payroll_id;
    delete updates.class_id;

    // Xử lý đặc biệt cho room_id - kiểm tra xem cột có tồn tại không
    const roomIdUpdate = updates.room_id;
    delete updates.room_id; // Xóa khỏi updates chung để xử lý riêng

    // Update các trường thông thường
    const safeUpdates = { ...updates, updated_at: new Date().toISOString() };

    // Chỉ thêm room_id nếu có yêu cầu đổi phòng
    if (roomIdUpdate !== undefined) {
      safeUpdates.room_id = roomIdUpdate;
    }

    const { data, error } = await supabase
      .from('sessions')
      .update(safeUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // Nếu lỗi là do cột room_id không tồn tại
      if (error.code === 'PGRST204' && error.message?.includes('room_id')) {
        return res.status(400).json({
          success: false,
          message: 'Chức năng đổi phòng từng buổi chưa được kích hoạt. Vui lòng chạy migration 13_add_room_to_sessions.sql'
        });
      }
      throw error;
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating session:', error);
    next(error);
  }
});

// Lấy danh sách GV rảnh vào một khung giờ cụ thể
app.get('/api/admin/sessions/:sessionId/available-teachers', requireAuth, async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    // Lấy thông tin session hiện tại
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('session_date, start_time, end_time, teacher_id, classes(center_id)')
      .eq('id', sessionId)
      .single();

    if (sessionError) throw sessionError;
    if (!session) return res.status(404).json({ success: false, message: 'Không tìm thấy buổi học' });

    // Lấy tất cả giáo viên
    const { data: teachers, error: teachersError } = await supabase
      .from('users')
      .select('id, full_name, email, avatar_url')
      .eq('role_id', (await supabase.from('roles').select('id').eq('code', 'TEACHER').single()).data?.id);

    if (teachersError) throw teachersError;

    // Lấy các sessions trùng giờ
    const { data: busySessions } = await supabase
      .from('sessions')
      .select('teacher_id')
      .eq('session_date', session.session_date)
      .neq('id', sessionId)
      .neq('status', 'cancelled')
      .or(`and(start_time.lt.${session.end_time},end_time.gt.${session.start_time})`);

    const busyTeacherIds = new Set((busySessions || []).map(s => s.teacher_id).filter(Boolean));

    // Đánh dấu GV nào đang bận
    const result = (teachers || []).map(t => ({
      ...t,
      isBusy: busyTeacherIds.has(t.id),
      isCurrent: t.id === session.teacher_id
    }));

    res.json({
      success: true,
      data: result,
      sessionInfo: {
        date: session.session_date,
        startTime: session.start_time,
        endTime: session.end_time
      }
    });
  } catch (error) {
    console.error('Error fetching available teachers:', error);
    next(error);
  }
});

// Lấy danh sách phòng trống vào một khung giờ cụ thể
app.get('/api/admin/sessions/:sessionId/available-rooms', requireAuth, async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    // Lấy thông tin session hiện tại (session không có room_id, lấy từ class)
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, session_date, start_time, end_time, class_id, classes(id, center_id, room_id, rooms(id, name))')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      console.error('Session error:', sessionError);
      throw sessionError;
    }
    if (!session) return res.status(404).json({ success: false, message: 'Không tìm thấy buổi học' });

    // Lấy tất cả phòng học (cùng center nếu cần)
    let roomQuery = supabase.from('rooms').select('id, name, code, capacity, center_id, centers(name)');
    if (session.classes?.center_id) {
      roomQuery = roomQuery.eq('center_id', session.classes.center_id);
    }
    const { data: rooms, error: roomsError } = await roomQuery;

    if (roomsError) {
      console.error('Rooms error:', roomsError);
      throw roomsError;
    }

    // Lấy các sessions trùng giờ trong cùng ngày
    const { data: busySessions, error: busyError } = await supabase
      .from('sessions')
      .select('id, class_id')
      .eq('session_date', session.session_date)
      .neq('id', sessionId)
      .neq('status', 'cancelled');

    if (busyError) {
      console.error('Busy sessions error:', busyError);
    }

    // Lấy room của các class có session trùng ngày
    const busyRoomIds = new Set();
    if (busySessions && busySessions.length > 0) {
      const classIds = [...new Set(busySessions.map(s => s.class_id).filter(Boolean))];
      if (classIds.length > 0) {
        const { data: busyClasses } = await supabase
          .from('classes')
          .select('id, room_id')
          .in('id', classIds);

        (busyClasses || []).forEach(c => {
          if (c.room_id) busyRoomIds.add(c.room_id);
        });
      }
    }

    const currentRoomId = session.classes?.room_id;

    // Đánh dấu phòng nào đang bận
    const result = (rooms || []).map(r => ({
      ...r,
      isBusy: busyRoomIds.has(r.id) && r.id !== currentRoomId,
      isCurrent: r.id === currentRoomId
    }));

    res.json({
      success: true,
      data: result,
      sessionInfo: {
        date: session.session_date,
        startTime: session.start_time,
        endTime: session.end_time,
        currentRoom: session.classes?.rooms?.name || null
      }
    });
  } catch (error) {
    console.error('Error fetching available rooms:', error);
    next(error);
  }
});

// ============ ATTENDANCE MANAGEMENT APIs ============

// Lấy danh sách điểm danh của một session
app.get('/api/admin/sessions/:sessionId/attendance', requireAuth, async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        users!attendance_student_id_fkey (id, full_name, email, avatar_url)
      `)
      .eq('session_id', sessionId);

    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (error) {
    next(error);
  }
});

// Điểm danh hàng loạt (Batch attendance)
app.post('/api/admin/sessions/:sessionId/attendance', requireAuth, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { attendances } = req.body; // Array: [{student_id, status, notes}]

    if (!attendances || !Array.isArray(attendances)) {
      return res.status(400).json({
        success: false,
        message: 'Cần truyền mảng attendances'
      });
    }

    console.log(`📋 Admin ${req.user.email} điểm danh ${attendances.length} học viên`);

    // Kiểm tra session có tồn tại không
    const { data: session } = await supabase
      .from('sessions')
      .select('id, is_locked')
      .eq('id', sessionId)
      .single();

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy buổi học'
      });
    }

    if (session.is_locked) {
      return res.status(400).json({
        success: false,
        message: 'Buổi học đã khóa sổ, không thể điểm danh'
      });
    }

    // Upsert từng attendance
    const results = [];
    for (const att of attendances) {
      const { data, error } = await supabase
        .from('attendance')
        .upsert({
          session_id: sessionId,
          student_id: att.student_id,
          status: att.status || 'present',
          check_in_time: att.status === 'present' ? new Date().toISOString() : null,
          notes: att.notes || null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'session_id,student_id'
        })
        .select()
        .single();

      if (!error && data) {
        results.push(data);
      }
    }

    // Cập nhật status của session thành completed nếu đã điểm danh
    await supabase
      .from('sessions')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    res.json({
      success: true,
      message: `Đã điểm danh ${results.length} học viên`,
      data: results
    });
  } catch (error) {
    next(error);
  }
});

// ============ ROOM MANAGEMENT APIs ============

// Lấy danh sách phòng học
app.get('/api/rooms', requireAuth, async (req, res, next) => {
  try {
    const { center_id, status } = req.query;

    // ====== PERMISSION CHECK ======
    const { effectiveCenterId, error: permError } = getEffectiveCenterId(req.user, center_id);
    if (permError) {
      return res.status(403).json({ success: false, message: permError });
    }

    let query = supabase
      .from('rooms')
      .select(`
        *,
        centers (id, name)
      `)
      .order('name');

    // ====== CENTER FILTER ======
    if (effectiveCenterId) {
      query = query.eq('center_id', effectiveCenterId);
    } else if (center_id) {
      query = query.eq('center_id', center_id);
    }

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
app.post('/api/admin/rooms', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
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
app.put('/api/admin/rooms/:id', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
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
app.delete('/api/admin/rooms/:id', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
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

// Alias cho admin - Lấy danh sách học viên trong lớp (dùng cho điểm danh)
app.get('/api/admin/classes/:classId/students', requireAuth, async (req, res, next) => {
  try {
    const { classId } = req.params;

    // Query đơn giản - chỉ lấy học viên active
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        id,
        student_id,
        users!enrollments_student_id_fkey(
          id, 
          full_name, 
          email, 
          avatar_url
        )
      `)
      .eq('class_id', classId)
      .eq('status', 'active');

    if (error) throw error;

    // Transform data
    const students = (data || []).map(e => ({
      id: e.id,
      student_id: e.student_id || e.users?.id,
      full_name: e.users?.full_name,
      email: e.users?.email,
      avatar_url: e.users?.avatar_url,
      users: e.users // Giữ nguyên để compatible với modal
    }));

    res.json({
      success: true,
      data: students,
      count: students.length
    });
  } catch (error) {
    console.error('Error fetching class students for attendance:', error);
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

    // Lấy enrollment_id trước
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('class_id', classId)
      .eq('student_id', studentId)
      .single();

    if (enrollment) {
      // Xóa attendance records của enrollment này
      await supabase
        .from('attendance')
        .delete()
        .eq('enrollment_id', enrollment.id);

      // Xóa student_grades của enrollment này
      await supabase
        .from('student_grades')
        .delete()
        .eq('enrollment_id', enrollment.id);

      // Lấy danh sách invoice_ids để xóa payments trước
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id')
        .eq('class_id', classId)
        .eq('student_id', studentId);

      if (invoices && invoices.length > 0) {
        const invoiceIds = invoices.map(inv => inv.id);

        // Xóa payments liên quan
        await supabase
          .from('payments')
          .delete()
          .in('invoice_id', invoiceIds);

        // Xóa hẳn tất cả hóa đơn của học viên này trong lớp
        await supabase
          .from('invoices')
          .delete()
          .eq('class_id', classId)
          .eq('student_id', studentId);
      }
    }

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

// ============================================================
// ATTENDANCE APIs - Module Điểm danh
// ============================================================

// Utility: Parse schedule từ nhiều format khác nhau
function parseScheduleData(schedule) {
  if (!schedule) return { days: [], startTime: '18:00', endTime: '20:00' };

  // Format 1: JSON array [{"day":2,"start":"18:00","end":"20:00"},...]
  if (typeof schedule === 'string' && schedule.startsWith('[')) {
    try {
      const parsed = JSON.parse(schedule);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // day: 2=T2, 3=T3, ..., 7=T7, 8=CN (theo format của frontend)
        // Cần convert sang dayOfWeek: 0=CN, 1=T2, 2=T3, ...
        const dayMapping = { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 0 };
        const days = parsed.map(s => dayMapping[s.day]).filter(d => d !== undefined);
        return {
          days,
          startTime: parsed[0]?.start || '18:00',
          endTime: parsed[0]?.end || '20:00'
        };
      }
    } catch (e) {
      console.log('Error parsing JSON schedule:', e);
    }
  }

  // Format 2: Array object (already parsed)
  if (Array.isArray(schedule) && schedule.length > 0) {
    const dayMapping = { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 0 };
    const days = schedule.map(s => dayMapping[s.day]).filter(d => d !== undefined);
    return {
      days,
      startTime: schedule[0]?.start || '18:00',
      endTime: schedule[0]?.end || '20:00'
    };
  }

  // Format 3: String "T2-T4-T6"
  if (typeof schedule === 'string') {
    const dayMap = { 'T2': 1, 'T3': 2, 'T4': 3, 'T5': 4, 'T6': 5, 'T7': 6, 'CN': 0 };
    const days = schedule.split('-').map(d => dayMap[d.trim()]).filter(d => d !== undefined);
    return { days, startTime: '18:00', endTime: '20:00' };
  }

  return { days: [], startTime: '18:00', endTime: '20:00' };
}

// Utility: Sinh danh sách các buổi học từ lịch lớp
function generateSessions(startDate, endDate, schedule) {
  const sessions = [];
  if (!startDate || !endDate || !schedule) return sessions;

  const { days: scheduleDays, startTime, endTime } = parseScheduleData(schedule);
  if (scheduleDays.length === 0) return sessions;

  const start = new Date(startDate);
  const end = new Date(endDate);
  let sessionNumber = 1;

  // Danh sách ngày nghỉ lễ Việt Nam 2025-2026
  const holidays = [
    '2025-01-01', // Tết Dương lịch
    '2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31', '2025-02-01', '2025-02-02', '2025-02-03', // Tết Nguyên đán
    '2025-04-30', // Giải phóng miền Nam
    '2025-05-01', // Quốc tế Lao động
    '2025-09-02', // Quốc khánh
  ];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay(); // 0=CN, 1=T2, 2=T3, ...
    const dateStr = d.toISOString().split('T')[0];

    if (scheduleDays.includes(dayOfWeek) && !holidays.includes(dateStr)) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sessionDate = new Date(d);
      sessionDate.setHours(0, 0, 0, 0);

      let status = 'upcoming';
      if (sessionDate < today) {
        status = 'completed';
      } else if (sessionDate.getTime() === today.getTime()) {
        status = 'today';
      }

      sessions.push({
        session_number: sessionNumber,
        date: dateStr,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        status: status
      });
      sessionNumber++;
    }
  }

  return sessions;
}

// Utility: Tên thứ tiếng Việt
function getDayName(dayOfWeek) {
  const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  return days[dayOfWeek];
}

// API: Lấy danh sách buổi học của một lớp
app.get('/api/classes/:id/sessions', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Lấy thông tin lớp học
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select(`
        id, code, name, schedule, start_date, end_date,
        teacher_id,
        teacher:users!classes_teacher_id_fkey(id, full_name, avatar_url)
      `)
      .eq('id', id)
      .single();

    if (classError) throw classError;
    if (!classData) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
    }

    // Sinh danh sách buổi học
    const sessions = generateSessions(
      classData.start_date,
      classData.end_date,
      classData.schedule
    );

    // Lấy thông tin điểm danh đã có
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .select(`
        session_date,
        status,
        enrollment_id
      `)
      .eq('enrollment_id', supabase.rpc('get_enrollment_ids_by_class', { class_id: id }));

    // Đếm số học viên đã điểm danh cho mỗi buổi
    const sessionDates = sessions.map(s => s.date);

    const { data: attendanceSummary, error: summaryError } = await supabase
      .from('attendance')
      .select(`
        session_date,
        status,
        enrollments!inner(class_id)
      `)
      .eq('enrollments.class_id', id)
      .in('session_date', sessionDates);

    // Tính tổng số học viên trong lớp
    const { count: totalStudents } = await supabase
      .from('enrollments')
      .select('id', { count: 'exact' })
      .eq('class_id', id)
      .eq('status', 'active');

    // Group attendance by date
    const attendanceByDate = {};
    if (attendanceSummary) {
      attendanceSummary.forEach(att => {
        if (!attendanceByDate[att.session_date]) {
          attendanceByDate[att.session_date] = { present: 0, absent: 0, late: 0, total: 0 };
        }
        attendanceByDate[att.session_date].total++;
        if (att.status === 'present') attendanceByDate[att.session_date].present++;
        else if (att.status === 'absent') attendanceByDate[att.session_date].absent++;
        else if (att.status === 'late') attendanceByDate[att.session_date].late++;
      });
    }

    // Enrich sessions with attendance summary
    const enrichedSessions = sessions.map(session => ({
      ...session,
      day_name: getDayName(session.day_of_week),
      teacher: classData.teacher,
      attendance_summary: attendanceByDate[session.date] || null,
      total_students: totalStudents || 0,
      is_marked: !!attendanceByDate[session.date]
    }));

    res.json({
      success: true,
      data: {
        class_info: {
          id: classData.id,
          code: classData.code,
          name: classData.name,
          schedule: classData.schedule,
          teacher: classData.teacher
        },
        sessions: enrichedSessions,
        total_sessions: sessions.length,
        completed_sessions: sessions.filter(s => s.status === 'completed').length
      }
    });

  } catch (error) {
    console.error('Error fetching sessions:', error);
    next(error);
  }
});

// API: Lấy bảng điểm danh của một buổi học cụ thể
app.get('/api/classes/:id/attendance', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Thiếu tham số date' });
    }

    // Lấy danh sách học viên trong lớp
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select(`
        id,
        student_id,
        student:users!enrollments_student_id_fkey(
          id, full_name, email, phone, avatar_url
        )
      `)
      .eq('class_id', id)
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (enrollError) throw enrollError;

    // Lấy điểm danh đã có cho ngày này
    const enrollmentIds = enrollments.map(e => e.id);
    const { data: attendanceRecords, error: attError } = await supabase
      .from('attendance')
      .select('*')
      .eq('session_date', date)
      .in('enrollment_id', enrollmentIds);

    if (attError) throw attError;

    // Map attendance theo enrollment_id
    const attendanceMap = {};
    if (attendanceRecords) {
      attendanceRecords.forEach(att => {
        attendanceMap[att.enrollment_id] = att;
      });
    }

    // Merge data
    const students = enrollments.map(e => ({
      enrollment_id: e.id,
      student_id: e.student_id,
      full_name: e.student?.full_name || 'N/A',
      email: e.student?.email,
      phone: e.student?.phone,
      avatar_url: e.student?.avatar_url,
      attendance: attendanceMap[e.id] || null
    }));

    res.json({
      success: true,
      data: {
        date,
        students,
        total: students.length,
        marked: Object.keys(attendanceMap).length
      }
    });

  } catch (error) {
    console.error('Error fetching attendance:', error);
    next(error);
  }
});

// API: Lưu/Cập nhật điểm danh hàng loạt
app.post('/api/attendance/mark', requireAuth, async (req, res, next) => {
  try {
    const { class_id, date, attendances, session_id } = req.body;
    const markedBy = req.user.id;

    if (!class_id || !date || !attendances || !Array.isArray(attendances)) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin: class_id, date, attendances'
      });
    }

    console.log(`📝 Điểm danh lớp ${class_id} ngày ${date} bởi user ${req.user.email}`);

    // Validate class exists
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, code')
      .eq('id', class_id)
      .single();

    if (classError || !classData) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
    }

    // Tính session_number
    const { data: sessionData } = await supabase
      .from('classes')
      .select('start_date, end_date, schedule')
      .eq('id', class_id)
      .single();

    const sessions = generateSessions(
      sessionData.start_date,
      sessionData.end_date,
      sessionData.schedule
    );
    const sessionInfo = sessions.find(s => s.date === date);
    const sessionNumber = sessionInfo?.session_number || null;

    // Upsert attendance records
    const upsertData = attendances.map(att => ({
      enrollment_id: att.enrollment_id,
      session_date: date,
      session_number: sessionNumber,
      status: att.status || 'present',
      notes: att.notes || null,
      marked_by: markedBy,
      marked_at: new Date().toISOString()
    }));

    const { data: result, error: upsertError } = await supabase
      .from('attendance')
      .upsert(upsertData, {
        onConflict: 'enrollment_id,session_date',
        ignoreDuplicates: false
      })
      .select();

    if (upsertError) throw upsertError;

    // 🔥 Cập nhật session status thành 'completed' nếu có session_id
    if (session_id) {
      const { error: sessionUpdateError } = await supabase
        .from('sessions')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', session_id);

      if (sessionUpdateError) {
        console.warn('Warning updating session status:', sessionUpdateError);
      } else {
        console.log(`✅ Session ${session_id} marked as completed`);
      }
    } else {
      // Fallback: tìm session theo class_id và date
      const { error: sessionUpdateError } = await supabase
        .from('sessions')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('class_id', class_id)
        .eq('session_date', date);

      if (!sessionUpdateError) {
        console.log(`✅ Session for class ${class_id} on ${date} marked as completed`);
      }
    }

    // Tính summary
    const summary = {
      present: attendances.filter(a => a.status === 'present').length,
      absent: attendances.filter(a => a.status === 'absent').length,
      late: attendances.filter(a => a.status === 'late').length,
      total: attendances.length
    };

    console.log(`✅ Điểm danh thành công: ${summary.present} có mặt, ${summary.absent} vắng, ${summary.late} trễ`);

    res.json({
      success: true,
      message: `Đã lưu điểm danh ${summary.total} học viên`,
      data: {
        date,
        session_number: sessionNumber,
        summary,
        records: result
      }
    });

  } catch (error) {
    console.error('Error marking attendance:', error);
    next(error);
  }
});

// ============================================================
// END ATTENDANCE APIs
// ============================================================

// ============================================================
// GRADING SYSTEM APIs
// ============================================================

// GET /api/classes/:id/grades - Lấy bảng điểm tổng hợp cho cả lớp
app.get('/api/classes/:id/grades', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log(`📊 Lấy bảng điểm lớp ${id}`);

    // 1. Lấy thông tin lớp và course_id
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, code, course_id, courses(id, title)')
      .eq('id', id)
      .single();

    if (classError || !classData) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
    }

    // 2. Lấy cấu trúc điểm của khóa học (grade_structures)
    const { data: gradeStructures, error: structureError } = await supabase
      .from('grade_structures')
      .select('*')
      .eq('course_id', classData.course_id)
      .order('order_index', { ascending: true });

    if (structureError) throw structureError;

    // 3. Lấy danh sách học viên của lớp (enrollments)
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        id,
        student_id,
        status,
        users!enrollments_student_id_fkey (
          id, full_name, email, avatar_url
        )
      `)
      .eq('class_id', id)
      .in('status', ['active', 'completed'])
      .order('created_at', { ascending: true });

    if (enrollmentError) throw enrollmentError;

    // 4. Lấy tất cả điểm đã nhập cho lớp này
    const enrollmentIds = enrollments.map(e => e.id);

    let grades = [];
    if (enrollmentIds.length > 0) {
      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select('*')
        .in('enrollment_id', enrollmentIds);

      if (gradesError) throw gradesError;
      grades = gradesData || [];
    }

    // 5. Ghép data thành ma trận để Frontend dễ render
    const gradeMatrix = enrollments.map(enrollment => {
      const studentGrades = {};
      let totalWeightedScore = 0;
      let totalWeight = 0;

      gradeStructures.forEach(structure => {
        const grade = grades.find(
          g => g.enrollment_id === enrollment.id && g.grade_structure_id === structure.id
        );
        studentGrades[structure.id] = {
          score: grade?.score ?? null,
          notes: grade?.notes || null,
          graded_at: grade?.graded_at || null
        };

        // Tính điểm tổng kết có trọng số
        if (grade?.score !== null && grade?.score !== undefined) {
          totalWeightedScore += grade.score * structure.weight;
          totalWeight += structure.weight;
        }
      });

      return {
        enrollment_id: enrollment.id,
        student_id: enrollment.student_id,
        student_name: enrollment.users?.full_name || 'N/A',
        student_email: enrollment.users?.email || '',
        avatar_url: enrollment.users?.avatar_url || null,
        status: enrollment.status,
        grades: studentGrades,
        // Điểm tổng kết (weighted average)
        weighted_average: totalWeight > 0
          ? Math.round((totalWeightedScore / totalWeight) * 100) / 100
          : null
      };
    });

    res.json({
      success: true,
      data: {
        class_id: id,
        class_code: classData.code,
        course_id: classData.course_id,
        course_title: classData.courses?.title || 'N/A',
        grade_structures: gradeStructures,
        students: gradeMatrix,
        summary: {
          total_students: gradeMatrix.length,
          total_columns: gradeStructures.length,
          graded_count: gradeMatrix.filter(s => s.weighted_average !== null).length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching grades:', error);
    next(error);
  }
});

// POST /api/grades/bulk-update - Lưu điểm hàng loạt
app.post('/api/grades/bulk-update', requireAuth, async (req, res, next) => {
  try {
    const { grades } = req.body;
    const gradedBy = req.user.id;

    if (!grades || !Array.isArray(grades) || grades.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin: grades array'
      });
    }

    console.log(`📝 Cập nhật ${grades.length} điểm bởi user ${req.user.email}`);

    // Validate và chuẩn bị data
    const upsertData = grades.map(g => ({
      enrollment_id: g.enrollment_id,
      grade_structure_id: g.grade_structure_id,
      score: g.score !== '' && g.score !== null ? parseFloat(g.score) : null,
      notes: g.notes || null,
      graded_by: gradedBy,
      graded_at: new Date().toISOString()
    }));

    // Upsert (có rồi thì update, chưa có thì insert)
    const { data, error } = await supabase
      .from('grades')
      .upsert(upsertData, {
        onConflict: 'enrollment_id,grade_structure_id',
        ignoreDuplicates: false
      })
      .select();

    if (error) throw error;

    console.log(`✅ Đã lưu ${data?.length || 0} điểm`);

    res.json({
      success: true,
      message: `Đã lưu ${data?.length || 0} điểm`,
      data
    });

  } catch (error) {
    console.error('Error updating grades:', error);
    next(error);
  }
});

// GET /api/courses/:id/grade-structures - Lấy cấu trúc điểm của khóa học
app.get('/api/courses/:id/grade-structures', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('grade_structures')
      .select('*')
      .eq('course_id', id)
      .order('order_index', { ascending: true });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching grade structures:', error);
    next(error);
  }
});

// POST /api/courses/:id/grade-structures - Tạo/Cập nhật cấu trúc điểm cho khóa học
app.post('/api/courses/:id/grade-structures', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { structures } = req.body;

    if (!structures || !Array.isArray(structures)) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin: structures array'
      });
    }

    console.log(`📊 Cập nhật cấu trúc điểm cho khóa ${id}`);

    // Validate tổng weight = 1 (100%)
    const totalWeight = structures.reduce((sum, s) => sum + (parseFloat(s.weight) || 0), 0);
    if (Math.abs(totalWeight - 1) > 0.01) {
      return res.status(400).json({
        success: false,
        message: `Tổng trọng số phải = 100% (hiện tại: ${Math.round(totalWeight * 100)}%)`
      });
    }

    // Xóa cấu trúc cũ
    await supabase.from('grade_structures').delete().eq('course_id', id);

    // Insert cấu trúc mới
    const insertData = structures.map((s, index) => ({
      course_id: id,
      name: s.name,
      weight: parseFloat(s.weight),
      max_score: parseFloat(s.max_score) || 10,
      order_index: index + 1,
      description: s.description || null
    }));

    const { data, error } = await supabase
      .from('grade_structures')
      .insert(insertData)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      message: `Đã lưu ${data.length} cột điểm`,
      data
    });

  } catch (error) {
    console.error('Error updating grade structures:', error);
    next(error);
  }
});

// ============================================================
// END GRADING APIs
// ============================================================

// ============================================================
// DASHBOARD APIs - Command Center
// ============================================================

// GET /api/dashboard/stats - Lấy thống kê tổng quan
app.get('/api/dashboard/stats', requireAuth, async (req, res, next) => {
  try {
    console.log(`📊 Dashboard stats requested by ${req.user.email}`);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const firstDayOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const firstDayOfLastMonth = `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}-01`;
    const lastDayOfLastMonth = new Date(currentYear, currentMonth - 1, 0).toISOString().split('T')[0];

    // 1. Tổng doanh thu = Tổng paid_amount từ enrollments (thực thu)
    // Cách 1: Từ bảng payments (nếu có)
    const { data: paymentsThisMonth } = await supabase
      .from('payments')
      .select('amount')
      .gte('payment_date', firstDayOfMonth)
      .eq('status', 'completed');

    const revenueFromPayments = paymentsThisMonth?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    // Cách 2: Từ bảng enrollments (paid_amount) - TỔNG DOANH THU THỰC TẾ
    const { data: enrollmentsData } = await supabase
      .from('enrollments')
      .select('paid_amount');

    const revenueFromEnrollments = enrollmentsData?.reduce((sum, e) => sum + (e.paid_amount || 0), 0) || 0;

    // Lấy số lớn hơn (hoặc cộng cả 2 nếu payments là chi tiết từng lần đóng)
    const totalRevenueThisMonth = Math.max(revenueFromPayments, revenueFromEnrollments);

    // 2. Doanh thu tháng trước (để tính trend) - dùng payments nếu có
    const { data: paymentsLastMonth } = await supabase
      .from('payments')
      .select('amount')
      .gte('payment_date', firstDayOfLastMonth)
      .lte('payment_date', lastDayOfLastMonth)
      .eq('status', 'completed');

    const totalRevenueLastMonth = paymentsLastMonth?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    // Tính % thay đổi doanh thu
    const revenueTrend = totalRevenueLastMonth > 0
      ? Math.round(((totalRevenueThisMonth - totalRevenueLastMonth) / totalRevenueLastMonth) * 100)
      : (totalRevenueThisMonth > 0 ? 100 : 0);

    // 3. Số học viên mới trong tháng (enrollments mới)
    const { count: newStudentsThisMonth } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstDayOfMonth);

    const { count: newStudentsLastMonth } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstDayOfLastMonth)
      .lte('created_at', lastDayOfLastMonth);

    const studentsTrend = newStudentsLastMonth > 0
      ? Math.round(((newStudentsThisMonth - newStudentsLastMonth) / newStudentsLastMonth) * 100)
      : (newStudentsThisMonth > 0 ? 100 : 0);

    // 4. Số lớp đang hoạt động (ongoing HOẶC upcoming)
    const { count: ongoingClasses } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ongoing');

    const { count: upcomingClasses } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'upcoming');

    const activeClasses = (ongoingClasses || 0) + (upcomingClasses || 0);

    // 5. Công nợ (Tổng tiền còn nợ từ enrollments)
    const { data: debtData } = await supabase
      .from('enrollments')
      .select('tuition_fee, paid_amount')
      .gt('tuition_fee', 0);

    const totalDebt = debtData?.reduce((sum, e) => {
      const remaining = (e.tuition_fee || 0) - (e.paid_amount || 0);
      return sum + (remaining > 0 ? remaining : 0);
    }, 0) || 0;

    // 6. Tổng số khóa học active
    const { count: totalCourses } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true });

    // 7. Tổng số học viên (unique students có enrollment)
    const { data: uniqueStudents } = await supabase
      .from('enrollments')
      .select('student_id')
      .not('student_id', 'is', null);

    const totalStudents = new Set(uniqueStudents?.map(e => e.student_id)).size;

    res.json({
      success: true,
      data: {
        revenue: {
          value: totalRevenueThisMonth,
          formatted: formatCurrency(totalRevenueThisMonth),
          trend: revenueTrend,
          trendUp: revenueTrend >= 0,
          description: `Doanh thu tháng ${currentMonth}/${currentYear}`
        },
        newStudents: {
          value: newStudentsThisMonth || 0,
          trend: studentsTrend,
          trendUp: studentsTrend >= 0,
          description: 'Ghi danh trong tháng'
        },
        activeClasses: {
          value: activeClasses || 0,
          description: 'Lớp đang diễn ra'
        },
        debt: {
          value: totalDebt,
          formatted: formatCurrency(totalDebt),
          description: 'Cần thu hồi'
        },
        summary: {
          totalCourses: totalCourses || 0,
          totalStudents: totalStudents || 0
        },
        period: {
          month: currentMonth,
          year: currentYear
        }
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    next(error);
  }
});

// Helper: Format currency
function formatCurrency(amount) {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)}B đ`;
  }
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M đ`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K đ`;
  }
  return `${amount.toLocaleString('vi-VN')} đ`;
}

// GET /api/dashboard/revenue-chart - Biểu đồ doanh thu theo tháng
app.get('/api/dashboard/revenue-chart', requireAuth, async (req, res, next) => {
  try {
    const months = [];

    // Query doanh thu 12 tháng gần nhất từ enrollments.paid_amount
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).toISOString().split('T')[0];

      // Query từ enrollments - doanh thu là paid_amount, lọc theo created_at
      const { data } = await supabase
        .from('enrollments')
        .select('paid_amount, created_at')
        .gte('created_at', `${firstDay}T00:00:00`)
        .lte('created_at', `${lastDay}T23:59:59`);

      const total = data?.reduce((sum, e) => sum + (parseFloat(e.paid_amount) || 0), 0) || 0;

      months.unshift({
        month: `T${month}`,
        monthNum: month,
        year,
        revenue: total,
        formatted: formatCurrency(total)
      });
    }

    res.json({
      success: true,
      data: months
    });

  } catch (error) {
    console.error('Error fetching revenue chart:', error);
    next(error);
  }
});

// GET /api/dashboard/recent-students - Học viên ghi danh gần đây
app.get('/api/dashboard/recent-students', requireAuth, async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;

    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        id,
        created_at,
        users!enrollments_student_id_fkey (
          id, full_name, email, avatar_url
        ),
        classes (
          id, code, name,
          courses (id, title)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    // Format data
    const students = data?.map(enrollment => {
      const createdAt = new Date(enrollment.created_at);
      const now = new Date();
      const timeDiff = now.getTime() - createdAt.getTime();

      // Handle negative time diff (future dates or timezone issues)
      let timeAgo;
      if (timeDiff < 0) {
        // Nếu thời gian âm (tương lai), hiển thị "Vừa xong"
        timeAgo = 'Vừa xong';
      } else {
        const minutes = Math.floor(timeDiff / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const months = Math.floor(days / 30);

        if (months > 0) {
          timeAgo = `${months} tháng trước`;
        } else if (days > 0) {
          timeAgo = `${days} ngày trước`;
        } else if (hours > 0) {
          timeAgo = `${hours} giờ trước`;
        } else if (minutes > 0) {
          timeAgo = `${minutes} phút trước`;
        } else {
          timeAgo = 'Vừa xong';
        }
      }

      return {
        id: enrollment.id,
        name: enrollment.users?.full_name || 'N/A',
        email: enrollment.users?.email || '',
        avatar_url: enrollment.users?.avatar_url,
        course: enrollment.classes?.courses?.title || enrollment.classes?.name || 'N/A',
        class_code: enrollment.classes?.code,
        time: timeAgo,
        created_at: enrollment.created_at
      };
    }) || [];

    res.json({
      success: true,
      data: students
    });

  } catch (error) {
    console.error('Error fetching recent students:', error);
    next(error);
  }
});

// GET /api/dashboard/course-distribution - Phân bố học viên theo khóa học
app.get('/api/dashboard/course-distribution', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        classes (
          courses (id, title)
        )
      `)
      .in('status', ['active', 'completed']);

    if (error) throw error;

    // Count by course
    const courseCount = {};
    data?.forEach(e => {
      const courseTitle = e.classes?.courses?.title || 'Khác';
      courseCount[courseTitle] = (courseCount[courseTitle] || 0) + 1;
    });

    // Convert to array for chart
    const distribution = Object.entries(courseCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Top 6 courses

    res.json({
      success: true,
      data: distribution
    });

  } catch (error) {
    console.error('Error fetching course distribution:', error);
    next(error);
  }
});

// ============================================================
// END DASHBOARD APIs
// ============================================================

// ============================================================
// INVOICES APIs - Quản lý hóa đơn
// ============================================================

// GET /api/invoices - Danh sách hóa đơn (với filters, pagination)
app.get('/api/invoices', requireAuth, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      startDate,
      endDate,
      centerId,
      overdue,  // 'true' để lọc HD quá hạn
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    // ====== PERMISSION CHECK ======
    const userRole = req.user.roleCode;
    const userCenterId = req.user.centerId;

    let effectiveCenterId = centerId;

    if (userRole !== 'SUPER_ADMIN') {
      if (!userCenterId) {
        return res.status(403).json({
          success: false,
          message: 'Bạn chưa được gán vào trung tâm nào.'
        });
      }
      if (centerId && centerId !== userCenterId) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xem hóa đơn của trung tâm khác.'
        });
      }
      effectiveCenterId = userCenterId;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Build query - thêm center_id từ class
    let query = supabase
      .from('invoices')
      .select(`
        id,
        invoice_code,
        student_id,
        class_id,
        enrollment_id,
        amount,
        discount_amount,
        final_amount,
        paid_amount,
        status,
        description,
        due_date,
        paid_at,
        created_at,
        student:users!invoices_student_id_fkey (
          id,
          full_name,
          email,
          phone
        ),
        class:classes (
          id,
          code,
          name,
          center_id,
          course:courses (
            id,
            title,
            category
          )
        )
      `, { count: 'exact' });

    // Filter by status
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Filter by date range
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', `${endDate}T23:59:59`);
    }

    // Search by invoice_code hoặc student name
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      query = query.or(`invoice_code.ilike.${searchTerm}`);
    }

    // Sorting
    const validSortFields = ['created_at', 'final_amount', 'paid_amount', 'due_date', 'invoice_code'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const ascending = sortOrder === 'asc';
    query = query.order(sortField, { ascending });

    // ⚠️ IMPORTANT: Khi cần filter theo center_id (nested field),
    // phải load ALL rồi filter/paginate trên JS
    // vì Supabase không support filter trên nested relation
    const needsJSFilter = effectiveCenterId || overdue === 'true' || (search && search.trim());

    if (!needsJSFilter) {
      // Case 1: Không cần JS filter → paginate trên DB (hiệu năng tốt)
      query = query.range(offset, offset + limitNum - 1);
    }
    // Case 2: Cần JS filter → load ALL, paginate sau

    const { data, error, count } = await query;

    if (error) throw error;

    // Post-filter theo center (vì nested filter không support)
    let filteredData = data || [];

    if (effectiveCenterId) {
      filteredData = filteredData.filter(inv =>
        inv.class?.center_id === effectiveCenterId ||
        !inv.class_id // Hóa đơn không gắn class (phí khác) vẫn hiển thị
      );
    }

    // Filter overdue (quá hạn)
    if (overdue === 'true') {
      const today = new Date().toISOString().split('T')[0];
      filteredData = filteredData.filter(inv =>
        inv.due_date &&
        inv.due_date < today &&
        inv.status !== 'paid' &&
        inv.status !== 'cancelled'
      );
    }

    // Search filter (nested fields)
    if (search && search.trim()) {
      const searchLower = search.trim().toLowerCase();
      filteredData = filteredData.filter(inv =>
        inv.invoice_code?.toLowerCase().includes(searchLower) ||
        inv.student?.full_name?.toLowerCase().includes(searchLower) ||
        inv.student?.email?.toLowerCase().includes(searchLower) ||
        inv.student?.phone?.includes(searchLower)
      );
    }

    // JS Pagination (khi đã filter trên JS)
    const totalFiltered = filteredData.length;
    if (needsJSFilter) {
      filteredData = filteredData.slice(offset, offset + limitNum);
    }

    res.json({
      success: true,
      data: filteredData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: needsJSFilter ? totalFiltered : (count || 0),
        totalPages: Math.ceil((needsJSFilter ? totalFiltered : (count || 0)) / limitNum)
      }
    });

  } catch (error) {
    console.error('Error fetching invoices:', error);
    next(error);
  }
});

// GET /api/invoices/statistics - Thống kê hóa đơn
app.get('/api/invoices/statistics', requireAuth, async (req, res, next) => {
  try {
    const { centerId } = req.query;

    // ====== PERMISSION CHECK ======
    const userRole = req.user.roleCode;
    const userCenterId = req.user.centerId;

    let effectiveCenterId = centerId;

    if (userRole !== 'SUPER_ADMIN') {
      if (!userCenterId) {
        return res.status(403).json({
          success: false,
          message: 'Bạn chưa được gán vào trung tâm nào.'
        });
      }
      effectiveCenterId = userCenterId;
    }

    // Lấy invoices với class info để filter theo center
    const { data: rawInvoices, error } = await supabase
      .from('invoices')
      .select(`
        status, 
        final_amount, 
        paid_amount, 
        paid_at, 
        created_at,
        due_date,
        class:classes (center_id)
      `)
      .not('status', 'eq', 'cancelled');

    if (error) throw error;

    // Filter theo center
    let invoices = rawInvoices || [];
    if (effectiveCenterId) {
      invoices = invoices.filter(inv =>
        inv.class?.center_id === effectiveCenterId || !inv.class
      );
    }

    // Lấy ngày đầu tháng và cuối tháng hiện tại
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Tính toán thống kê
    let totalRevenue = 0;
    let monthlyRevenue = 0;
    let totalDebt = 0;
    let countUnpaid = 0;
    let countPartial = 0;
    let countPaid = 0;
    let countOverdue = 0;  // Thêm đếm HD quá hạn

    invoices.forEach(inv => {
      const paidAmount = parseFloat(inv.paid_amount) || 0;
      const finalAmount = parseFloat(inv.final_amount) || 0;
      const debt = finalAmount - paidAmount;

      totalRevenue += paidAmount;

      if (debt > 0) {
        totalDebt += debt;
      }

      if (inv.status === 'unpaid') countUnpaid++;
      else if (inv.status === 'partial') countPartial++;
      else if (inv.status === 'paid') countPaid++;

      // Đếm quá hạn
      if (inv.due_date && inv.due_date < today && inv.status !== 'paid') {
        countOverdue++;
      }

      if (paidAmount > 0) {
        const paidDate = inv.paid_at ? new Date(inv.paid_at) : new Date(inv.created_at);
        if (paidDate >= firstDayOfMonth && paidDate <= lastDayOfMonth) {
          monthlyRevenue += paidAmount;
        }
      }
    });

    res.json({
      success: true,
      data: {
        totalRevenue,
        monthlyRevenue,
        totalDebt,
        counts: {
          unpaid: countUnpaid,
          partial: countPartial,
          paid: countPaid,
          overdue: countOverdue,
          total: invoices.length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching invoice statistics:', error);
    next(error);
  }
});

// GET /api/invoices/:id - Chi tiết hóa đơn
app.get('/api/invoices/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Lấy invoice với thông tin liên quan
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        student:users!invoices_student_id_fkey (
          id,
          full_name,
          email,
          phone,
          avatar_url
        ),
        class:classes (
          id,
          code,
          name,
          course:courses (
            id,
            title,
            category
          )
        )
      `)
      .eq('id', id)
      .single();

    if (invoiceError) throw invoiceError;
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Lấy lịch sử thanh toán
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        payment_method,
        reference_code,
        notes,
        payment_date,
        received_by,
        receiver:users!payments_received_by_fkey (
          full_name
        )
      `)
      .eq('invoice_id', id)
      .order('payment_date', { ascending: false });

    if (paymentsError) {
      console.warn('Error fetching payments:', paymentsError.message);
    }

    res.json({
      success: true,
      data: {
        ...invoice,
        payments: payments || []
      }
    });

  } catch (error) {
    console.error('Error fetching invoice detail:', error);
    next(error);
  }
});

// POST /api/invoices - Tạo hóa đơn thủ công (phí ngoài học phí)
app.post('/api/invoices', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const {
      student_id,
      class_id,         // Optional - nếu liên quan đến lớp
      invoice_type,     // tuition | book | uniform | exam | other
      amount,
      discount_amount = 0,
      description,
      due_date,
      notes
    } = req.body;

    // Validation
    if (!student_id) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn học viên' });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Số tiền phải lớn hơn 0' });
    }
    if (!invoice_type) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn loại hóa đơn' });
    }

    // Kiểm tra học viên tồn tại
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('id', student_id)
      .single();

    if (studentError || !student) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy học viên' });
    }

    const finalAmount = parseFloat(amount) - parseFloat(discount_amount || 0);

    // Tạo description mặc định nếu không có
    const typeLabels = {
      tuition: 'Học phí',
      book: 'Giáo trình/Sách',
      uniform: 'Đồng phục',
      exam: 'Phí thi',
      other: 'Phí khác'
    };
    const defaultDesc = description || `${typeLabels[invoice_type] || 'Phí khác'} - ${student.full_name}`;

    // Insert invoice - thử với invoice_type trước, nếu lỗi thì bỏ qua
    let invoice, error;

    // Thử insert với invoice_type
    const insertData = {
      student_id,
      class_id: class_id || null,
      amount: parseFloat(amount),
      discount_amount: parseFloat(discount_amount || 0),
      final_amount: finalAmount,
      paid_amount: 0,
      status: 'unpaid',
      description: defaultDesc,
      due_date: due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      created_by: req.user?.id
    };

    // Thử insert với invoice_type (nếu column tồn tại)
    const result1 = await supabase
      .from('invoices')
      .insert({ ...insertData, invoice_type: invoice_type || 'other' })
      .select(`
        *,
        student:users!invoices_student_id_fkey (id, full_name, email, phone)
      `)
      .single();

    if (result1.error && result1.error.message?.includes('invoice_type')) {
      // Column không tồn tại, thử insert không có invoice_type
      console.warn('⚠️ invoice_type column not found, inserting without it');
      const result2 = await supabase
        .from('invoices')
        .insert(insertData)
        .select(`
          *,
          student:users!invoices_student_id_fkey (id, full_name, email, phone)
        `)
        .single();

      invoice = result2.data;
      error = result2.error;
    } else {
      invoice = result1.data;
      error = result1.error;
    }

    if (error) throw error;

    console.log(`📄 Tạo hóa đơn ${invoice.invoice_code} - ${invoice_type || 'other'} cho ${student.full_name}`);

    res.status(201).json({
      success: true,
      message: `Đã tạo hóa đơn ${invoice.invoice_code}`,
      data: invoice
    });

  } catch (error) {
    console.error('Error creating invoice:', error);
    next(error);
  }
});

// POST /api/invoices/:id/payments - Thêm thanh toán cho hóa đơn
app.post('/api/invoices/:id/payments', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, payment_method = 'cash', reference_code, notes } = req.body;
    const userId = req.user?.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Số tiền thanh toán phải lớn hơn 0'
      });
    }

    // Kiểm tra invoice tồn tại
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, final_amount, paid_amount, status')
      .eq('id', id)
      .single();

    if (invoiceError || !invoice) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hóa đơn'
      });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Hóa đơn đã thanh toán đủ'
      });
    }

    if (invoice.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Hóa đơn đã bị hủy'
      });
    }

    // Thêm payment (trigger sẽ tự cập nhật invoice)
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        invoice_id: id,
        amount: parseFloat(amount),
        payment_method,
        reference_code,
        notes,
        received_by: userId
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    // Lấy lại invoice đã cập nhật
    const { data: updatedInvoice } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    res.json({
      success: true,
      message: 'Thanh toán thành công',
      data: {
        payment,
        invoice: updatedInvoice
      }
    });

  } catch (error) {
    console.error('Error adding payment:', error);
    next(error);
  }
});

// PUT /api/invoices/:id - Cập nhật hóa đơn
app.put('/api/invoices/:id', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, discount_amount, due_date, description, invoice_type } = req.body;

    // Lấy invoice hiện tại
    const { data: currentInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentInvoice) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn' });
    }

    // Không cho sửa nếu đã paid hoặc cancelled
    if (currentInvoice.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Không thể sửa hóa đơn đã thanh toán đủ' });
    }
    if (currentInvoice.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Không thể sửa hóa đơn đã hủy' });
    }

    const updateData = { updated_at: new Date().toISOString() };

    // Cập nhật số tiền
    let newAmount = currentInvoice.amount;
    let newDiscount = currentInvoice.discount_amount;

    if (amount !== undefined) {
      newAmount = parseFloat(amount);
      updateData.amount = newAmount;
    }
    if (discount_amount !== undefined) {
      newDiscount = parseFloat(discount_amount);
      updateData.discount_amount = newDiscount;
    }

    // Tính lại final_amount
    if (amount !== undefined || discount_amount !== undefined) {
      const newFinal = newAmount - newDiscount;
      updateData.final_amount = newFinal;

      // Cập nhật status nếu cần
      const paidAmount = currentInvoice.paid_amount || 0;
      if (paidAmount >= newFinal) {
        updateData.status = 'paid';
        updateData.paid_at = new Date().toISOString();
      } else if (paidAmount > 0) {
        updateData.status = 'partial';
      } else {
        updateData.status = 'unpaid';
      }
    }

    if (due_date !== undefined) updateData.due_date = due_date;
    if (description !== undefined) updateData.description = description;
    if (invoice_type !== undefined) updateData.invoice_type = invoice_type;

    const { data, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Cập nhật hóa đơn thành công',
      data
    });

  } catch (error) {
    console.error('Error updating invoice:', error);
    next(error);
  }
});

// PUT /api/invoices/:id/cancel - Hủy hóa đơn
app.put('/api/invoices/:id/cancel', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Lấy invoice hiện tại
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !invoice) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn' });
    }

    if (invoice.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Hóa đơn đã được hủy trước đó' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Không thể hủy hóa đơn đã thanh toán đủ. Hãy sử dụng chức năng hoàn tiền.'
      });
    }

    // Nếu đã có thanh toán một phần, cảnh báo
    if (invoice.paid_amount > 0) {
      console.warn(`⚠️ Hủy hóa đơn ${invoice.invoice_code} có ${invoice.paid_amount.toLocaleString()}đ đã thanh toán`);
    }

    const { data, error } = await supabase
      .from('invoices')
      .update({
        status: 'cancelled',
        description: reason
          ? `${invoice.description || ''} [HỦY: ${reason}]`
          : invoice.description,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    console.log(`🚫 Hủy hóa đơn ${invoice.invoice_code} bởi ${req.user.email}`);

    res.json({
      success: true,
      message: `Đã hủy hóa đơn ${invoice.invoice_code}`,
      data
    });

  } catch (error) {
    console.error('Error cancelling invoice:', error);
    next(error);
  }
});

// POST /api/invoices/:id/refund - Hoàn tiền
app.post('/api/invoices/:id/refund', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { refund_amount, reason, refund_method = 'cash' } = req.body;

    // Lấy invoice hiện tại
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !invoice) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn' });
    }

    if (invoice.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Không thể hoàn tiền hóa đơn đã hủy' });
    }

    if (invoice.status === 'refunded') {
      return res.status(400).json({ success: false, message: 'Hóa đơn đã được hoàn tiền trước đó' });
    }

    const paidAmount = invoice.paid_amount || 0;
    if (paidAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Hóa đơn chưa có thanh toán để hoàn tiền' });
    }

    const refundValue = refund_amount ? parseFloat(refund_amount) : paidAmount;
    if (refundValue > paidAmount) {
      return res.status(400).json({
        success: false,
        message: `Số tiền hoàn không thể lớn hơn đã thanh toán (${paidAmount.toLocaleString()}đ)`
      });
    }

    // Tạo payment record âm để ghi nhận hoàn tiền
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        invoice_id: id,
        amount: -refundValue,  // Số âm = hoàn tiền
        payment_method: refund_method,
        notes: `HOÀN TIỀN: ${reason || 'Theo yêu cầu'}`,
        received_by: req.user?.id
      });

    if (paymentError) {
      console.warn('Error creating refund payment record:', paymentError.message);
    }

    // Cập nhật invoice
    const newPaidAmount = paidAmount - refundValue;
    let newStatus = 'refunded';
    if (newPaidAmount > 0 && newPaidAmount < invoice.final_amount) {
      newStatus = 'partial';
    } else if (newPaidAmount <= 0) {
      newStatus = 'refunded';
    }

    const { data, error } = await supabase
      .from('invoices')
      .update({
        paid_amount: newPaidAmount,
        status: newStatus,
        description: `${invoice.description || ''} [HOÀN TIỀN: ${refundValue.toLocaleString()}đ - ${reason || ''}]`,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    console.log(`💸 Hoàn tiền ${refundValue.toLocaleString()}đ cho ${invoice.invoice_code} bởi ${req.user.email}`);

    res.json({
      success: true,
      message: `Đã hoàn ${refundValue.toLocaleString()}đ cho hóa đơn ${invoice.invoice_code}`,
      data,
      refund: {
        amount: refundValue,
        method: refund_method,
        reason
      }
    });

  } catch (error) {
    console.error('Error refunding invoice:', error);
    next(error);
  }
});

// ============================================================
// END INVOICES APIs
// ============================================================

// ============================================================
// HOLIDAYS APIs - Quản lý ngày lễ/nghỉ
// ============================================================

/**
 * GET /api/admin/holidays - Lấy danh sách ngày lễ
 */
app.get('/api/admin/holidays', requireAuth, async (req, res, next) => {
  try {
    const { year } = req.query;

    let query = supabase
      .from('holidays')
      .select('*')
      .order('date', { ascending: true });

    if (year) {
      query = query
        .gte('date', `${year}-01-01`)
        .lte('date', `${year}-12-31`);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error fetching holidays:', error);
    next(error);
  }
});

/**
 * POST /api/admin/holidays - Thêm ngày lễ mới
 */
app.post('/api/admin/holidays', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { name, date, description, is_recurring } = req.body;

    if (!name || !date) {
      return res.status(400).json({
        success: false,
        message: 'Tên và ngày là bắt buộc'
      });
    }

    const { data, error } = await supabase
      .from('holidays')
      .insert({
        name,
        date,
        description,
        is_recurring: is_recurring || false,
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Thêm ngày lễ thành công',
      data
    });
  } catch (error) {
    console.error('Error creating holiday:', error);
    next(error);
  }
});

/**
 * PUT /api/admin/holidays/:id - Cập nhật ngày lễ
 */
app.put('/api/admin/holidays/:id', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, date, description, is_recurring } = req.body;

    const { data, error } = await supabase
      .from('holidays')
      .update({
        name,
        date,
        description,
        is_recurring,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Cập nhật ngày lễ thành công',
      data
    });
  } catch (error) {
    console.error('Error updating holiday:', error);
    next(error);
  }
});

/**
 * DELETE /api/admin/holidays/:id - Xóa ngày lễ
 */
app.delete('/api/admin/holidays/:id', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('holidays')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Xóa ngày lễ thành công'
    });
  } catch (error) {
    console.error('Error deleting holiday:', error);
    next(error);
  }
});

// ============================================================
// TEACHER AVAILABILITY APIs - Quản lý lịch trống của GV
// ============================================================

/**
 * GET /api/admin/teacher-availability/:teacherId - Lấy lịch trống của GV
 */
app.get('/api/admin/teacher-availability/:teacherId', requireAuth, async (req, res, next) => {
  try {
    const { teacherId } = req.params;

    const { data, error } = await supabase
      .from('teacher_availability')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('day_of_week', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error fetching teacher availability:', error);
    next(error);
  }
});

/**
 * PUT /api/admin/teacher-availability/:teacherId - Cập nhật lịch trống của GV
 */
app.put('/api/admin/teacher-availability/:teacherId', requireAuth, async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    const { slots } = req.body; // Array of { day_of_week, start_time, end_time }

    // Xóa slots cũ
    await supabase
      .from('teacher_availability')
      .delete()
      .eq('teacher_id', teacherId);

    // Thêm slots mới
    if (slots && slots.length > 0) {
      const slotsWithTeacher = slots.map(slot => ({
        ...slot,
        teacher_id: teacherId
      }));

      const { error: insertError } = await supabase
        .from('teacher_availability')
        .insert(slotsWithTeacher);

      if (insertError) throw insertError;
    }

    res.json({
      success: true,
      message: 'Cập nhật lịch trống thành công'
    });
  } catch (error) {
    console.error('Error updating teacher availability:', error);
    next(error);
  }
});

// ============================================================
// MAKEUP SESSIONS APIs - Tạo buổi học bù
// ============================================================

/**
 * POST /api/admin/sessions/makeup - Tạo buổi học bù
 */
app.post('/api/admin/sessions/makeup', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER']), async (req, res, next) => {
  try {
    const {
      class_id,
      original_session_id,
      student_ids,
      date,
      start_time,
      end_time,
      teacher_id,
      room_id,
      notes
    } = req.body;

    if (!class_id || !date || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      });
    }

    // Tạo session bù
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        class_id,
        session_number: 0, // Buổi bù đánh số 0
        session_date: date,
        start_time,
        end_time,
        teacher_id,
        room_id,
        status: 'upcoming',
        is_makeup: true,
        original_session_id,
        notes
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    // Nếu có danh sách học viên cần học bù, lưu vào bảng makeup_students
    if (student_ids && student_ids.length > 0) {
      const makeupRecords = student_ids.map(userId => ({
        session_id: sessionData.id,
        user_id: userId,
        original_session_id
      }));

      const { error: makeupError } = await supabase
        .from('makeup_students')
        .insert(makeupRecords);

      if (makeupError) {
        console.error('Error adding makeup students:', makeupError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Tạo buổi học bù thành công',
      data: sessionData
    });
  } catch (error) {
    console.error('Error creating makeup session:', error);
    next(error);
  }
});

// ============================================================
// SCHEDULE EXCEPTIONS APIs - Quản lý ngoại lệ lịch học
// ============================================================

/**
 * POST /api/admin/sessions/:id/exception - Tạo ngoại lệ cho buổi học
 */
app.post('/api/admin/sessions/:id/exception', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, new_date, new_start_time, new_end_time, reason } = req.body;

    // type: 'skip' | 'reschedule'
    if (type === 'skip') {
      // Hủy buổi học
      const { error } = await supabase
        .from('sessions')
        .update({
          status: 'cancelled',
          notes: `Bỏ qua: ${reason}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    } else if (type === 'reschedule') {
      // Dời lịch học
      const { error } = await supabase
        .from('sessions')
        .update({
          session_date: new_date,
          start_time: new_start_time,
          end_time: new_end_time,
          notes: `Dời lịch: ${reason}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    }

    res.json({
      success: true,
      message: type === 'skip' ? 'Đã bỏ qua buổi học' : 'Đã dời lịch thành công'
    });
  } catch (error) {
    console.error('Error creating schedule exception:', error);
    next(error);
  }
});

// ============================================================
// END NEW SCHEDULE FEATURES
// ============================================================

// ============================================================
// PAYROLL MANAGEMENT APIs - Quản lý bảng lương giáo viên
// ============================================================

/**
 * GET /api/admin/payroll - Lấy danh sách bảng lương
 * Query params:
 * - month (int): Tháng (1-12)
 * - year (int): Năm
 * - status: draft, pending, approved, paid
 * - teacher_id (uuid): Filter theo giáo viên
 */
app.get('/api/admin/payroll', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { month, year, status, teacher_id } = req.query;

    let query = supabase
      .from('payroll')
      .select(`
        *,
        teacher:users!payroll_teacher_id_fkey (id, full_name, email, avatar_url, hourly_rate),
        approver:users!payroll_approved_by_fkey (id, full_name)
      `)
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false });

    if (month) query = query.eq('period_month', parseInt(month));
    if (year) query = query.eq('period_year', parseInt(year));
    if (status) query = query.eq('status', status);
    if (teacher_id) query = query.eq('teacher_id', teacher_id);

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching payroll:', error);
    next(error);
  }
});

/**
 * GET /api/admin/payroll/stats - Thống kê payroll nhanh cho tháng hiện tại
 */
app.get('/api/admin/payroll/stats', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    // Lấy thống kê payroll theo status
    const { data: payrollData, error: payrollError } = await supabase
      .from('payroll')
      .select('status, net_salary')
      .eq('period_month', currentMonth)
      .eq('period_year', currentYear);

    if (payrollError) throw payrollError;

    // Tính toán thống kê
    const stats = {
      total_payrolls: payrollData?.length || 0,
      draft: 0,
      pending: 0,
      approved: 0,
      paid: 0,
      total_amount: 0,
      pending_amount: 0,
      paid_amount: 0
    };

    (payrollData || []).forEach(p => {
      stats[p.status] = (stats[p.status] || 0) + 1;
      stats.total_amount += parseInt(p.net_salary) || 0;
      if (p.status === 'pending' || p.status === 'approved') {
        stats.pending_amount += parseInt(p.net_salary) || 0;
      }
      if (p.status === 'paid') {
        stats.paid_amount += parseInt(p.net_salary) || 0;
      }
    });

    res.json({
      success: true,
      data: {
        ...stats,
        month: currentMonth,
        year: currentYear
      }
    });
  } catch (error) {
    console.error('Error fetching payroll stats:', error);
    next(error);
  }
});

/**
 * GET /api/admin/payroll/teachers - Lấy danh sách GV với thống kê giờ dạy tháng
 */
app.get('/api/admin/payroll/teachers', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    // Lấy role_id của TEACHER từ bảng roles
    const { data: teacherRole } = await supabase
      .from('roles')
      .select('id')
      .eq('code', 'TEACHER')
      .single();

    if (!teacherRole) {
      return res.json({ success: true, data: [] });
    }

    // Lấy tất cả giáo viên
    const { data: teachers, error: teachersError } = await supabase
      .from('users')
      .select('id, full_name, email, avatar_url, hourly_rate, status')
      .eq('role_id', teacherRole.id)
      .eq('status', 'active');

    if (teachersError) throw teachersError;

    if (!teachers || teachers.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // OPTIMIZED: Fetch tất cả sessions và payrolls trong 2 query thay vì N+1
    const teacherIds = teachers.map(t => t.id);
    const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const endDate = currentMonth === 12
      ? `${currentYear + 1}-01-01`
      : `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;

    // Query all sessions for all teachers in one call
    const { data: allSessions } = await supabase
      .from('sessions')
      .select('id, teacher_id, duration_hours, teacher_rate')
      .in('teacher_id', teacherIds)
      .eq('status', 'completed')
      .gte('session_date', startDate)
      .lt('session_date', endDate);

    // Query all payrolls for the period in one call
    const { data: allPayrolls } = await supabase
      .from('payroll')
      .select('id, teacher_id, status, net_salary')
      .in('teacher_id', teacherIds)
      .eq('period_month', currentMonth)
      .eq('period_year', currentYear);

    // Group sessions by teacher_id
    const sessionsByTeacher = (allSessions || []).reduce((acc, session) => {
      if (!acc[session.teacher_id]) acc[session.teacher_id] = [];
      acc[session.teacher_id].push(session);
      return acc;
    }, {});

    // Index payrolls by teacher_id
    const payrollByTeacher = (allPayrolls || []).reduce((acc, payroll) => {
      acc[payroll.teacher_id] = payroll;
      return acc;
    }, {});

    // Map teachers with their stats (no additional queries needed)
    const teacherStats = teachers.map(teacher => {
      const sessions = sessionsByTeacher[teacher.id] || [];
      const existingPayroll = payrollByTeacher[teacher.id] || null;

      const totalSessions = sessions.length;
      const totalHours = sessions.reduce((sum, s) => sum + (parseFloat(s.duration_hours) || 0), 0);
      const baseSalary = sessions.reduce((sum, s) => {
        const hours = parseFloat(s.duration_hours) || 0;
        const rate = parseFloat(s.teacher_rate) || parseFloat(teacher.hourly_rate) || 150000;
        return sum + (hours * rate);
      }, 0);

      return {
        ...teacher,
        month: currentMonth,
        year: currentYear,
        total_sessions: totalSessions,
        total_hours: totalHours,
        base_salary: baseSalary,
        payroll: existingPayroll
      };
    });

    res.json({ success: true, data: teacherStats });
  } catch (error) {
    console.error('Error fetching payroll teachers:', error);
    next(error);
  }
});

/**
 * POST /api/admin/payroll/generate - Tạo bảng lương cho GV
 */
app.post('/api/admin/payroll/generate', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { teacher_id, month, year, bonus = 0, deduction = 0, notes = '' } = req.body;

    if (!teacher_id || !month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin teacher_id, month, year'
      });
    }

    // Kiểm tra đã có payroll chưa
    const { data: existing } = await supabase
      .from('payroll')
      .select('id')
      .eq('teacher_id', teacher_id)
      .eq('period_month', month)
      .eq('period_year', year)
      .single();

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Bảng lương tháng này đã tồn tại'
      });
    }

    // Lấy thông tin sessions đã completed
    const { data: sessions } = await supabase
      .from('sessions')
      .select('id, duration_hours, teacher_rate')
      .eq('teacher_id', teacher_id)
      .eq('status', 'completed')
      .gte('session_date', `${year}-${String(month).padStart(2, '0')}-01`)
      .lt('session_date', month === 12
        ? `${year + 1}-01-01`
        : `${year}-${String(month + 1).padStart(2, '0')}-01`
      );

    // Lấy hourly_rate của GV
    const { data: teacher } = await supabase
      .from('users')
      .select('hourly_rate')
      .eq('id', teacher_id)
      .single();

    const totalSessions = sessions?.length || 0;
    const totalHours = (sessions || []).reduce((sum, s) => sum + (parseFloat(s.duration_hours) || 0), 0);
    const baseSalary = (sessions || []).reduce((sum, s) => {
      const hours = parseFloat(s.duration_hours) || 0;
      const rate = parseFloat(s.teacher_rate) || parseFloat(teacher?.hourly_rate) || 150000;
      return sum + (hours * rate);
    }, 0);

    const netSalary = baseSalary + parseFloat(bonus || 0) - parseFloat(deduction || 0);

    // Tạo bảng lương
    const { data: payroll, error } = await supabase
      .from('payroll')
      .insert({
        teacher_id,
        period_month: month,
        period_year: year,
        total_sessions: totalSessions,
        total_hours: totalHours,
        base_salary: baseSalary,
        bonus: parseFloat(bonus || 0),
        deduction: parseFloat(deduction || 0),
        net_salary: netSalary,
        notes,
        status: 'draft'
      })
      .select(`
        *,
        teacher:users!payroll_teacher_id_fkey (id, full_name, email)
      `)
      .single();

    if (error) throw error;

    // Cập nhật payroll_id cho các sessions
    if (sessions && sessions.length > 0) {
      const sessionIds = sessions.map(s => s.id);
      await supabase
        .from('sessions')
        .update({ payroll_id: payroll.id })
        .in('id', sessionIds);
    }

    res.json({ success: true, data: payroll });
  } catch (error) {
    console.error('Error generating payroll:', error);
    next(error);
  }
});

/**
 * GET /api/admin/payroll/:id - Lấy chi tiết bảng lương
 */
app.get('/api/admin/payroll/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Lấy thông tin payroll
    const { data: payroll, error: payrollError } = await supabase
      .from('payroll')
      .select(`
        *,
        teacher:users!payroll_teacher_id_fkey (id, full_name, email, avatar_url, hourly_rate, phone),
        approver:users!payroll_approved_by_fkey (id, full_name)
      `)
      .eq('id', id)
      .single();

    if (payrollError) throw payrollError;
    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bảng lương' });
    }

    // Lấy danh sách sessions liên quan
    const { data: sessions } = await supabase
      .from('sessions')
      .select(`
        id,
        session_date,
        start_time,
        end_time,
        duration_hours,
        teacher_rate,
        status,
        topic,
        classes (id, name)
      `)
      .eq('teacher_id', payroll.teacher_id)
      .eq('status', 'completed')
      .gte('session_date', `${payroll.period_year}-${String(payroll.period_month).padStart(2, '0')}-01`)
      .lt('session_date', payroll.period_month === 12
        ? `${payroll.period_year + 1}-01-01`
        : `${payroll.period_year}-${String(payroll.period_month + 1).padStart(2, '0')}-01`
      )
      .order('session_date', { ascending: true });

    res.json({
      success: true,
      data: {
        ...payroll,
        sessions: sessions || []
      }
    });
  } catch (error) {
    console.error('Error fetching payroll detail:', error);
    next(error);
  }
});

/**
 * PUT /api/admin/payroll/:id - Cập nhật bảng lương
 */
app.put('/api/admin/payroll/:id', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { bonus, deduction, notes } = req.body;

    // Lấy payroll hiện tại
    const { data: current, error: fetchError } = await supabase
      .from('payroll')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!current) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bảng lương' });
    }

    // Không cho sửa nếu đã approved hoặc paid
    if (['approved', 'paid'].includes(current.status)) {
      return res.status(400).json({
        success: false,
        message: 'Không thể sửa bảng lương đã duyệt hoặc đã thanh toán'
      });
    }

    const newBonus = bonus !== undefined ? parseFloat(bonus) : current.bonus;
    const newDeduction = deduction !== undefined ? parseFloat(deduction) : current.deduction;
    const netSalary = parseFloat(current.base_salary) + newBonus - newDeduction;

    const { data: updated, error: updateError } = await supabase
      .from('payroll')
      .update({
        bonus: newBonus,
        deduction: newDeduction,
        net_salary: netSalary,
        notes: notes !== undefined ? notes : current.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        teacher:users!payroll_teacher_id_fkey (id, full_name, email)
      `)
      .single();

    if (updateError) throw updateError;

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating payroll:', error);
    next(error);
  }
});

/**
 * PATCH /api/admin/payroll/:id/status - Cập nhật trạng thái bảng lương
 */
app.patch('/api/admin/payroll/:id/status', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    const validStatuses = ['draft', 'pending', 'approved', 'paid'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    // Ghi nhận người duyệt khi approved
    if (status === 'approved') {
      updateData.approved_by = userId;
      updateData.approved_at = new Date().toISOString();
    }

    // Lock sessions khi approved
    if (status === 'approved' || status === 'paid') {
      // Lấy payroll để lấy thông tin
      const { data: payroll } = await supabase
        .from('payroll')
        .select('teacher_id, period_month, period_year')
        .eq('id', id)
        .single();

      if (payroll) {
        await supabase
          .from('sessions')
          .update({ is_locked: true })
          .eq('teacher_id', payroll.teacher_id)
          .eq('status', 'completed')
          .gte('session_date', `${payroll.period_year}-${String(payroll.period_month).padStart(2, '0')}-01`)
          .lt('session_date', payroll.period_month === 12
            ? `${payroll.period_year + 1}-01-01`
            : `${payroll.period_year}-${String(payroll.period_month + 1).padStart(2, '0')}-01`
          );
      }
    }

    const { data: updated, error } = await supabase
      .from('payroll')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        teacher:users!payroll_teacher_id_fkey (id, full_name, email),
        approver:users!payroll_approved_by_fkey (id, full_name)
      `)
      .single();

    if (error) throw error;

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating payroll status:', error);
    next(error);
  }
});

/**
 * DELETE /api/admin/payroll/:id - Xóa bảng lương (chỉ draft)
 */
app.delete('/api/admin/payroll/:id', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Kiểm tra status
    const { data: payroll, error: fetchError } = await supabase
      .from('payroll')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bảng lương' });
    }

    if (payroll.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể xóa bảng lương ở trạng thái nháp'
      });
    }

    // Xóa payroll_id trong sessions
    await supabase
      .from('sessions')
      .update({ payroll_id: null })
      .eq('payroll_id', id);

    // Xóa payroll
    const { error: deleteError } = await supabase
      .from('payroll')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    res.json({ success: true, message: 'Đã xóa bảng lương' });
  } catch (error) {
    console.error('Error deleting payroll:', error);
    next(error);
  }
});

/**
 * POST /api/admin/payroll/bulk-generate - Tạo bảng lương hàng loạt cho nhiều GV
 */
app.post('/api/admin/payroll/bulk-generate', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { teacher_ids, month, year, bonus = 0, deduction = 0, notes = '' } = req.body;

    if (!teacher_ids || !Array.isArray(teacher_ids) || teacher_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cần cung cấp danh sách teacher_ids'
      });
    }

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin month, year'
      });
    }

    const results = { success: [], failed: [] };

    for (const teacher_id of teacher_ids) {
      try {
        // Kiểm tra đã có payroll chưa
        const { data: existing } = await supabase
          .from('payroll')
          .select('id')
          .eq('teacher_id', teacher_id)
          .eq('period_month', month)
          .eq('period_year', year)
          .single();

        if (existing) {
          results.failed.push({ teacher_id, reason: 'Đã tồn tại bảng lương' });
          continue;
        }

        // Lấy sessions đã completed
        const { data: sessions } = await supabase
          .from('sessions')
          .select('id, duration_hours, teacher_rate')
          .eq('teacher_id', teacher_id)
          .eq('status', 'completed')
          .gte('session_date', `${year}-${String(month).padStart(2, '0')}-01`)
          .lt('session_date', month === 12
            ? `${year + 1}-01-01`
            : `${year}-${String(month + 1).padStart(2, '0')}-01`
          );

        // Lấy hourly_rate của GV
        const { data: teacher } = await supabase
          .from('users')
          .select('hourly_rate, full_name')
          .eq('id', teacher_id)
          .single();

        const totalSessions = sessions?.length || 0;
        if (totalSessions === 0) {
          results.failed.push({ teacher_id, teacher_name: teacher?.full_name, reason: 'Không có buổi dạy' });
          continue;
        }

        const totalHours = (sessions || []).reduce((sum, s) => sum + (parseFloat(s.duration_hours) || 0), 0);
        const baseSalary = (sessions || []).reduce((sum, s) => {
          const hours = parseFloat(s.duration_hours) || 0;
          const rate = parseFloat(s.teacher_rate) || parseFloat(teacher?.hourly_rate) || 150000;
          return sum + (hours * rate);
        }, 0);

        const netSalary = baseSalary + parseFloat(bonus || 0) - parseFloat(deduction || 0);

        // Tạo bảng lương
        const { data: payroll, error } = await supabase
          .from('payroll')
          .insert({
            teacher_id,
            period_month: month,
            period_year: year,
            total_sessions: totalSessions,
            total_hours: totalHours,
            base_salary: baseSalary,
            bonus: parseFloat(bonus || 0),
            deduction: parseFloat(deduction || 0),
            net_salary: netSalary,
            notes,
            status: 'draft'
          })
          .select()
          .single();

        if (error) {
          results.failed.push({ teacher_id, teacher_name: teacher?.full_name, reason: error.message });
          continue;
        }

        // Cập nhật payroll_id cho các sessions
        if (sessions && sessions.length > 0) {
          const sessionIds = sessions.map(s => s.id);
          await supabase
            .from('sessions')
            .update({ payroll_id: payroll.id })
            .in('id', sessionIds);
        }

        results.success.push({ teacher_id, teacher_name: teacher?.full_name, payroll_id: payroll.id });
      } catch (err) {
        results.failed.push({ teacher_id, reason: err.message });
      }
    }

    res.json({
      success: true,
      message: `Tạo thành công ${results.success.length}/${teacher_ids.length} bảng lương`,
      data: results
    });
  } catch (error) {
    console.error('Error bulk generating payroll:', error);
    next(error);
  }
});

/**
 * GET /api/admin/payroll/export - Export danh sách bảng lương ra Excel/CSV
 */
app.get('/api/admin/payroll/export', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { month, year, format = 'json' } = req.query;

    let query = supabase
      .from('payroll')
      .select(`
        id,
        period_month,
        period_year,
        total_sessions,
        total_hours,
        base_salary,
        bonus,
        deduction,
        net_salary,
        status,
        notes,
        created_at,
        approved_at,
        teacher:users!payroll_teacher_id_fkey (id, full_name, email, phone),
        approver:users!payroll_approved_by_fkey (id, full_name)
      `)
      .order('created_at', { ascending: false });

    if (month) query = query.eq('period_month', parseInt(month));
    if (year) query = query.eq('period_year', parseInt(year));

    const { data: payrolls, error } = await query;
    if (error) throw error;

    // Format dữ liệu cho export
    const exportData = (payrolls || []).map(p => ({
      'Mã bảng lương': p.id,
      'Giáo viên': p.teacher?.full_name || '',
      'Email': p.teacher?.email || '',
      'SĐT': p.teacher?.phone || '',
      'Tháng': p.period_month,
      'Năm': p.period_year,
      'Số buổi': p.total_sessions,
      'Tổng giờ': p.total_hours,
      'Lương cơ bản': p.base_salary,
      'Thưởng': p.bonus || 0,
      'Khấu trừ': p.deduction || 0,
      'Thực nhận': p.net_salary,
      'Trạng thái': p.status === 'draft' ? 'Nháp' : p.status === 'pending' ? 'Chờ duyệt' : p.status === 'approved' ? 'Đã duyệt' : 'Đã thanh toán',
      'Người duyệt': p.approver?.full_name || '',
      'Ngày duyệt': p.approved_at || '',
      'Ghi chú': p.notes || ''
    }));

    if (format === 'csv') {
      // Export CSV
      const headers = Object.keys(exportData[0] || {}).join(',');
      const rows = exportData.map(row =>
        Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
      ).join('\n');
      const csv = headers + '\n' + rows;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=payroll_${month}_${year}.csv`);
      res.send('\ufeff' + csv); // BOM for Excel UTF-8
    } else {
      res.json({ success: true, data: exportData });
    }
  } catch (error) {
    console.error('Error exporting payroll:', error);
    next(error);
  }
});

/**
 * GET /api/teacher/payroll - Giáo viên xem bảng lương của mình
 */
app.get('/api/teacher/payroll', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;

    let query = supabase
      .from('payroll')
      .select(`
        id,
        period_month,
        period_year,
        total_sessions,
        total_hours,
        base_salary,
        bonus,
        deduction,
        net_salary,
        status,
        notes,
        created_at,
        approved_at,
        approver:users!payroll_approved_by_fkey (id, full_name)
      `)
      .eq('teacher_id', userId)
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false });

    if (month) query = query.eq('period_month', parseInt(month));
    if (year) query = query.eq('period_year', parseInt(year));

    const { data: payrolls, error } = await query;
    if (error) throw error;

    res.json({ success: true, data: payrolls || [] });
  } catch (error) {
    console.error('Error fetching teacher payroll:', error);
    next(error);
  }
});

/**
 * GET /api/teacher/payroll/:id - Giáo viên xem chi tiết một bảng lương
 */
app.get('/api/teacher/payroll/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Lấy payroll và verify là của user này
    const { data: payroll, error: payrollError } = await supabase
      .from('payroll')
      .select(`
        *,
        approver:users!payroll_approved_by_fkey (id, full_name)
      `)
      .eq('id', id)
      .eq('teacher_id', userId)
      .single();

    if (payrollError || !payroll) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bảng lương' });
    }

    // Lấy sessions liên quan
    const { data: sessions } = await supabase
      .from('sessions')
      .select(`
        id,
        session_date,
        start_time,
        end_time,
        duration_hours,
        teacher_rate,
        topic,
        classes (id, name)
      `)
      .eq('teacher_id', userId)
      .eq('status', 'completed')
      .gte('session_date', `${payroll.period_year}-${String(payroll.period_month).padStart(2, '0')}-01`)
      .lt('session_date', payroll.period_month === 12
        ? `${payroll.period_year + 1}-01-01`
        : `${payroll.period_year}-${String(payroll.period_month + 1).padStart(2, '0')}-01`
      )
      .order('session_date', { ascending: true });

    res.json({
      success: true,
      data: { ...payroll, sessions: sessions || [] }
    });
  } catch (error) {
    console.error('Error fetching teacher payroll detail:', error);
    next(error);
  }
});

/**
 * GET /api/admin/payroll/:id/audit - Lấy audit trail của một bảng lương
 */
app.get('/api/admin/payroll/:id/audit', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: auditLogs, error } = await supabase
      .from('payroll_audit_log')
      .select(`
        id,
        action,
        old_values,
        new_values,
        changed_at,
        notes,
        changed_by_user:users!payroll_audit_log_changed_by_fkey (id, full_name, email)
      `)
      .eq('payroll_id', id)
      .order('changed_at', { ascending: false });

    if (error) {
      // Bảng audit có thể chưa tồn tại
      console.log('Audit log table may not exist:', error.message);
      return res.json({ success: true, data: [] });
    }

    res.json({ success: true, data: auditLogs || [] });
  } catch (error) {
    console.error('Error fetching payroll audit:', error);
    next(error);
  }
});

// ============================================================
// END PAYROLL APIs
// ============================================================

// ============================================================
// STUDENT TRANSCRIPT API - Bảng điểm tổng hợp của học viên
// ============================================================

/**
 * GET /api/students/:id/transcript - Lấy bảng điểm tất cả các lớp của học viên
 */
app.get('/api/students/:id/transcript', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log(`📜 Lấy transcript cho học viên: ${id}`);

    // 1. Lấy thông tin học viên
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('id, full_name, email, phone, avatar_url, created_at, roles(code)')
      .eq('id', id)
      .single();

    if (studentError || !student) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy học viên' });
    }

    // 2. Lấy tất cả enrollments của học viên
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        id,
        enrolled_at,
        status,
        classes (
          id,
          code,
          name,
          start_date,
          end_date,
          status,
          courses (
            id,
            code,
            title,
            category,
            calculation_type,
            pass_score,
            max_total_score
          )
        )
      `)
      .eq('student_id', id)
      .order('enrolled_at', { ascending: false });

    if (enrollmentError) throw enrollmentError;

    // 3. Lấy điểm cho từng enrollment
    const enrollmentIds = (enrollments || []).map(e => e.id);

    const { data: grades, error: gradesError } = await supabase
      .from('grades')
      .select(`
        id,
        enrollment_id,
        grade_structure_id,
        score,
        notes,
        graded_at,
        grade_structures (
          id,
          name,
          weight,
          max_score,
          order_index
        )
      `)
      .in('enrollment_id', enrollmentIds);

    if (gradesError) throw gradesError;

    // 4. Lấy cấu trúc điểm của các khóa học
    const courseIds = [...new Set((enrollments || []).map(e => e.classes?.courses?.id).filter(Boolean))];

    const { data: gradeStructures } = await supabase
      .from('grade_structures')
      .select('*')
      .in('course_id', courseIds)
      .order('order_index', { ascending: true });

    // 5. Build transcript data
    const transcript = (enrollments || []).map(enrollment => {
      const cls = enrollment.classes;
      const course = cls?.courses;

      // Lấy điểm của enrollment này
      const enrollmentGrades = (grades || []).filter(g => g.enrollment_id === enrollment.id);

      // Lấy cấu trúc điểm của khóa học này
      const courseStructures = (gradeStructures || []).filter(s => s.course_id === course?.id);

      // Build grade map
      const gradeMap = {};
      courseStructures.forEach(structure => {
        const grade = enrollmentGrades.find(g => g.grade_structure_id === structure.id);
        gradeMap[structure.name] = {
          structureId: structure.id,
          score: grade?.score ?? null,
          maxScore: structure.max_score,
          weight: structure.weight,
          gradedAt: grade?.graded_at
        };
      });

      // Calculate weighted average
      let totalWeightedScore = 0;
      let totalWeight = 0;
      Object.values(gradeMap).forEach(g => {
        if (g.score !== null) {
          totalWeightedScore += g.score * g.weight;
          totalWeight += g.weight;
        }
      });
      const weightedAverage = totalWeight > 0
        ? Math.round((totalWeightedScore / totalWeight) * 100) / 100
        : null;

      // Determine pass/fail
      const passScore = course?.pass_score || 5.0;
      const passed = weightedAverage !== null && weightedAverage >= passScore;

      return {
        enrollmentId: enrollment.id,
        enrolledAt: enrollment.enrolled_at,
        enrollmentStatus: enrollment.status,
        class: {
          id: cls?.id,
          code: cls?.code,
          name: cls?.name,
          startDate: cls?.start_date,
          endDate: cls?.end_date,
          status: cls?.status
        },
        course: {
          id: course?.id,
          code: course?.code,
          title: course?.title,
          category: course?.category
        },
        grades: gradeMap,
        gradeColumns: courseStructures.map(s => ({ name: s.name, weight: s.weight, maxScore: s.max_score })),
        summary: {
          weightedAverage,
          passScore,
          passed,
          totalColumns: courseStructures.length,
          gradedColumns: Object.values(gradeMap).filter(g => g.score !== null).length
        }
      };
    });

    // 6. Calculate overall statistics
    const totalClasses = transcript.length;
    const completedClasses = transcript.filter(t => t.enrollmentStatus === 'completed' || t.class.status === 'completed').length;
    const passedClasses = transcript.filter(t => t.summary.passed).length;
    const avgScore = transcript.filter(t => t.summary.weightedAverage !== null)
      .reduce((sum, t) => sum + t.summary.weightedAverage, 0) /
      (transcript.filter(t => t.summary.weightedAverage !== null).length || 1);

    res.json({
      success: true,
      data: {
        student: {
          id: student.id,
          fullName: student.full_name,
          email: student.email,
          phone: student.phone,
          avatarUrl: student.avatar_url,
          joinedAt: student.created_at
        },
        transcript,
        statistics: {
          totalClasses,
          completedClasses,
          activeClasses: totalClasses - completedClasses,
          passedClasses,
          failedClasses: transcript.filter(t => t.summary.weightedAverage !== null && !t.summary.passed).length,
          averageScore: avgScore ? avgScore.toFixed(2) : 'N/A'
        }
      }
    });

  } catch (error) {
    console.error('Error fetching student transcript:', error);
    next(error);
  }
});

// ============================================================
// END TRANSCRIPT API
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

// Test endpoint không cần auth
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Backend is running', time: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
