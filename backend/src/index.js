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
    // Parse dates as local time to avoid timezone issues
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);
    let sessionNumber = 1;

    // Duyệt từng ngày từ start đến end
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay(); // 0=Sunday, 1=Monday, ...
      // Format date as YYYY-MM-DD without timezone conversion
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

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

// ============ SYSTEM SETTINGS APIs ============

/**
 * Lấy tất cả settings (global + center-specific)
 * GET /api/admin/settings
 */
app.get('/api/admin/settings', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { centerId } = req.query;
    const { effectiveCenterId } = getEffectiveCenterId(req.user, centerId);

    // Lấy global settings
    const { data: globalSettings, error: globalError } = await supabase
      .from('system_settings')
      .select('*')
      .is('center_id', null)
      .order('key');

    if (globalError) throw globalError;

    // Lấy center-specific settings nếu có
    let centerSettings = [];
    if (effectiveCenterId) {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('center_id', effectiveCenterId)
        .order('key');

      if (!error) centerSettings = data || [];
    }

    // Merge settings (center override global)
    const settingsMap = {};
    globalSettings?.forEach(s => {
      settingsMap[s.key] = { ...s, scope: 'global' };
    });
    centerSettings?.forEach(s => {
      settingsMap[s.key] = { ...s, scope: 'center' };
    });

    res.json({
      success: true,
      data: {
        settings: Object.values(settingsMap),
        global: globalSettings || [],
        center: centerSettings || []
      }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    next(error);
  }
});

/**
 * Lấy một setting cụ thể theo key
 * GET /api/admin/settings/:key
 */
app.get('/api/admin/settings/:key', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { key } = req.params;
    const { centerId } = req.query;
    const { effectiveCenterId } = getEffectiveCenterId(req.user, centerId);

    // Thử lấy center-specific trước
    if (effectiveCenterId) {
      const { data: centerSetting } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', key)
        .eq('center_id', effectiveCenterId)
        .single();

      if (centerSetting) {
        return res.json({ success: true, data: { ...centerSetting, scope: 'center' } });
      }
    }

    // Fallback về global
    const { data: globalSetting, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', key)
      .is('center_id', null)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!globalSetting) {
      return res.status(404).json({ success: false, message: 'Setting không tồn tại' });
    }

    res.json({ success: true, data: { ...globalSetting, scope: 'global' } });
  } catch (error) {
    console.error('Error fetching setting:', error);
    next(error);
  }
});

/**
 * Cập nhật setting
 * PUT /api/admin/settings/:key
 */
app.put('/api/admin/settings/:key', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value, scope = 'global', centerId } = req.body;

    // Security settings chỉ Super Admin được sửa
    if (key === 'security_config' && req.user.roleCode !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Chỉ Super Admin mới được sửa cấu hình bảo mật' });
    }

    const targetCenterId = scope === 'center' ? (centerId || req.user.centerId) : null;

    // CENTER_MANAGER không được sửa global settings
    if (req.user.roleCode === 'CENTER_MANAGER' && !targetCenterId) {
      return res.status(403).json({ success: false, message: 'Bạn chỉ có thể sửa cấu hình của trung tâm mình' });
    }

    // Upsert setting
    const { data, error } = await supabase
      .from('system_settings')
      .upsert({
        center_id: targetCenterId,
        key,
        value,
        updated_by: req.user.id
      }, {
        onConflict: 'center_id,key'
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`⚙️ Setting "${key}" updated by ${req.user.email}`);
    res.json({ success: true, message: 'Cập nhật thành công', data });
  } catch (error) {
    console.error('Error updating setting:', error);
    next(error);
  }
});

/**
 * Xóa setting của center (reset về global)
 * DELETE /api/admin/settings/:key
 */
app.delete('/api/admin/settings/:key', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { key } = req.params;
    const { centerId } = req.query;

    const targetCenterId = centerId || req.user.centerId;

    // Chỉ cho phép xóa center-specific, không được xóa global
    if (!targetCenterId) {
      return res.status(400).json({ success: false, message: 'Không thể xóa cấu hình global' });
    }

    // CENTER_MANAGER chỉ xóa được setting của center mình
    if (req.user.roleCode === 'CENTER_MANAGER' && targetCenterId !== req.user.centerId) {
      return res.status(403).json({ success: false, message: 'Bạn chỉ có thể xóa cấu hình của trung tâm mình' });
    }

    const { error } = await supabase
      .from('system_settings')
      .delete()
      .eq('key', key)
      .eq('center_id', targetCenterId);

    if (error) throw error;

    console.log(`⚙️ Setting "${key}" reset to global by ${req.user.email}`);
    res.json({ success: true, message: 'Đã reset về cấu hình mặc định' });
  } catch (error) {
    console.error('Error deleting setting:', error);
    next(error);
  }
});

// ============ USER PROFILE APIs ============

/**
 * Lấy profile của user hiện tại
 * GET /api/users/me/profile
 */
app.get('/api/users/me/profile', requireAuth, async (req, res, next) => {
  try {
    const { data: profile, error } = await supabase
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
        roles (id, code, name),
        centers!users_center_id_fkey (id, name, code)
      `)
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    next(error);
  }
});

/**
 * Cập nhật profile của user hiện tại
 * PUT /api/users/me/profile
 */
app.put('/api/users/me/profile', requireAuth, async (req, res, next) => {
  try {
    const { full_name, phone, avatar_url } = req.body;

    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'Không có dữ liệu để cập nhật' });
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.user.id)
      .select(`
        id,
        email,
        full_name,
        phone,
        avatar_url,
        roles (id, code, name),
        centers!users_center_id_fkey (id, name, code)
      `)
      .single();

    if (error) throw error;

    console.log(`👤 Profile updated for ${req.user.email}`);
    res.json({ success: true, message: 'Cập nhật thành công', data });
  } catch (error) {
    console.error('Error updating profile:', error);
    next(error);
  }
});

/**
 * Đổi mật khẩu
 * PUT /api/users/me/password
 */
app.put('/api/users/me/password', requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    // Verify current password bằng cách thử đăng nhập
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: req.user.email,
      password: currentPassword
    });

    if (signInError) {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
    }

    // Đổi mật khẩu
    const { error } = await supabase.auth.admin.updateUserById(req.user.id, {
      password: newPassword
    });

    if (error) throw error;

    console.log(`🔐 Password changed for ${req.user.email}`);
    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('Error changing password:', error);
    next(error);
  }
});

/**
 * Upload avatar
 * POST /api/users/me/avatar
 */
app.post('/api/users/me/avatar', requireAuth, async (req, res, next) => {
  try {
    const { avatar_base64 } = req.body;

    if (!avatar_base64) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp ảnh' });
    }

    // Decode base64 và upload lên Supabase Storage
    const base64Data = avatar_base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const fileName = `avatars/${req.user.id}_${Date.now()}.jpg`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      // Nếu bucket chưa tồn tại, lưu base64 trực tiếp vào DB
      const { data, error } = await supabase
        .from('users')
        .update({ avatar_url: avatar_base64 })
        .eq('id', req.user.id)
        .select('avatar_url')
        .single();

      if (error) throw error;
      return res.json({ success: true, data: { avatar_url: data.avatar_url } });
    }

    // Lấy public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Cập nhật avatar_url trong users
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', req.user.id);

    if (updateError) throw updateError;

    console.log(`📷 Avatar uploaded for ${req.user.email}`);
    res.json({ success: true, data: { avatar_url: publicUrl } });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    next(error);
  }
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

    // Select fields - use explicit FK hint to avoid ambiguity
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
      centers!users_center_id_fkey (id, name)
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
      // Lấy tất cả staff (không phải STUDENT và không phải SUPER_ADMIN vì SA không xuất hiện trong list nhân viên)
      const { data: excludeRoles } = await supabase
        .from('roles')
        .select('id')
        .in('code', ['STUDENT']);

      const excludeRoleIds = excludeRoles?.map(r => r.id) || [];

      console.log('📋 Fetching staff - excluding role_ids:', excludeRoleIds);

      if (excludeRoleIds.length > 0) {
        query = supabase
          .from('users')
          .select(selectFields)
          .not('role_id', 'in', `(${excludeRoleIds.join(',')})`)
          .order('created_at', { ascending: false });
      } else {
        // Fallback nếu không có role STUDENT
        query = supabase
          .from('users')
          .select(selectFields)
          .order('created_at', { ascending: false });
      }
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
        centers!users_center_id_fkey (id, name, address)
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

    // Lấy default hourly_rate từ settings nếu không truyền vào
    let effectiveHourlyRate = hourly_rate;
    if (effectiveHourlyRate === undefined || effectiveHourlyRate === null) {
      const { data: payrollSetting } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'payroll_config')
        .is('center_id', null)
        .single();
      effectiveHourlyRate = payrollSetting?.value?.defaultHourlyRate || 150000;
    }

    // Build update object
    const updateData = {
      full_name,
      phone: phone || null,
      status: status || 'active',
      hourly_rate: effectiveHourlyRate,
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
        centers!users_center_id_fkey (id, name)
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
    const { email, full_name, phone, role_code, hourly_rate, center_id } = req.body;

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

    // Lấy cấu hình từ system_settings
    const { data: payrollSetting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'payroll_config')
      .is('center_id', null)
      .single();

    const payrollConfig = payrollSetting?.value || {};
    const defaultHourlyRate = payrollConfig.defaultHourlyRate || 150000;
    const defaultPassword = payrollConfig.defaultPassword || 'SkillMaster@123';

    console.log(`💰 Using default hourly rate: ${defaultHourlyRate}, password: ${defaultPassword}`);

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

    // Xác định center_id trước để truyền vào metadata
    const effectiveCenterId = center_id || req.user.centerId || null;

    // Tạo user trong Supabase Auth với password từ settings
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true, // Auto confirm email
      user_metadata: {
        full_name,
        phone,
        role_code,  // ✅ Truyền role để trigger tạo profile đúng
        center_id: effectiveCenterId,  // ✅ Truyền center
        hourly_rate: hourly_rate || defaultHourlyRate
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
      // Kiểm tra xem trigger đã tạo profile chưa
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id, role_id')
        .eq('id', userId)
        .single();

      if (existingProfile) {
        // Profile đã được trigger tạo, chỉ cần update nếu cần
        console.log(`✅ Profile đã được trigger tạo với role_id: ${existingProfile.role_id}`);

        // Nếu role không đúng (trigger tạo sai), update lại
        if (existingProfile.role_id !== roleData.id) {
          const { error: updateError } = await supabase
            .from('users')
            .update({
              role_id: roleData.id,
              hourly_rate: hourly_rate || defaultHourlyRate,
            })
            .eq('id', userId);

          if (updateError) console.error('Update role error:', updateError);
        }
      } else {
        // Trigger không chạy, tạo profile thủ công
        console.log(`⚠️ Trigger không tạo profile, tạo thủ công...`);
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email,
            full_name,
            phone: phone || null,
            role_id: roleData.id,
            status: 'active',
            hourly_rate: hourly_rate || defaultHourlyRate,
            center_id: effectiveCenterId,
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
        hourly_rate: hourly_rate || defaultHourlyRate,
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
    const { search, status, centerId, limit = '50', page = '1' } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 50, 100); // Max 100 items
    const offset = (pageNum - 1) * limitNum;

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
      return res.json({ success: true, data: [], pagination: { total: 0, page: pageNum, limit: limitNum } });
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
      `, { count: 'exact' })
      .eq('role_id', studentRole.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

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
        .eq('status', 'active')
        .limit(1000); // Limit enrollments query

      const studentIds = [...new Set((enrolledStudents || []).map(e => e.student_id))];

      if (studentIds.length > 0) {
        query = query.in('id', studentIds);
      } else {
        // Không có học viên nào tại center này
        return res.json({ success: true, data: [], pagination: { total: 0, page: pageNum, limit: limitNum } });
      }
    }

    const { data, error, count } = await query;
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

    res.json({
      success: true,
      data: result,
      pagination: {
        total: count || 0,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil((count || 0) / limitNum)
      }
    });
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

    // Lấy danh sách chứng chỉ (bao gồm certificate_types)
    const { data: certificates } = await supabase
      .from('certificates')
      .select(`
        id,
        certificate_number,
        completion_date,
        issued_at,
        status,
        grade,
        download_url,
        scores,
        external_id,
        file_url,
        expires_at,
        courses (id, title, category),
        certificate_types (
          id, 
          code, 
          name, 
          category,
          issuing_organization,
          is_external,
          is_internal,
          score_config
        )
      `)
      .eq('student_id', id)
      .order('issued_at', { ascending: false });

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
        certificates: certificates || [],
        stats: {
          activeClasses: activeEnrollments.length,
          completedClasses: completedEnrollments.length,
          totalClasses: (enrollments || []).length,
          totalPaid,
          totalDebt,
          attendance: attendanceStats,
          certificatesCount: (certificates || []).length
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
// Supports advanced filters: status, course_id, teacher_id, centerId, date_start, date_end
app.get('/api/classes', requireAuth, async (req, res, next) => {
  try {
    const { status, course_id, teacher_id, centerId, date_start, date_end } = req.query;

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

    // ====== DATE RANGE FILTER ======
    // Filter by start_date range
    if (date_start) {
      query = query.gte('start_date', date_start);
    }
    if (date_end) {
      query = query.lte('start_date', date_end);
    }

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

      // Xóa grades nếu có
      const { error: gradesError } = await supabase
        .from('grades')
        .delete()
        .in('enrollment_id', ids);

      if (gradesError) {
        console.error('Error deleting grades:', gradesError);
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

// Lấy danh sách documents của một lớp
app.get('/api/admin/classes/:classId/documents', requireAuth, async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { type, search, page = 1, limit = 50 } = req.query;

    let query = supabase
      .from('documents')
      .select(`
        *,
        courses (id, code, title),
        uploaded_by_user:users!documents_uploaded_by_fkey (id, full_name, email)
      `, { count: 'exact' })
      .eq('class_id', classId)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      pagination: {
        total: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching class documents:', error);
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

// ========================================
// 🔥 PREVIEW SESSIONS - Check conflicts before creating
// ========================================
app.post('/api/classes/:classId/sessions/preview', requireAuth, async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { schedule, start_date, end_date, skip_holidays = true, exclude_dates = [] } = req.body;

    console.log(`👀 Preview sessions cho lớp: ${classId}`);

    // Validate input
    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn lịch học' });
    }
    if (!start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn ngày bắt đầu và kết thúc' });
    }

    // Get class info
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, name, teacher_id, room_id, center_id')
      .eq('id', classId)
      .single();

    if (classError || !classData) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
    }

    // Vietnamese holidays
    const holidays = new Set([
      '2025-01-01', '2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31',
      '2025-02-01', '2025-02-02', '2025-02-03', '2025-04-30', '2025-05-01', '2025-09-02',
      '2026-01-01', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20'
    ]);

    // Day mapping
    const dayMapping = { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 0 };

    // Build schedule lookup
    const scheduleDays = new Set();
    const timeByDay = {};
    schedule.forEach(s => {
      const jsDay = dayMapping[s.day];
      if (jsDay !== undefined) {
        scheduleDays.add(jsDay);
        timeByDay[jsDay] = { start: s.start || '18:00', end: s.end || '20:00' };
      }
    });

    // Get existing sessions to avoid duplicates
    const { data: allExistingSessions } = await supabase
      .from('sessions')
      .select('session_number, session_date')
      .eq('class_id', classId);

    const existingDates = new Set((allExistingSessions || []).map(s => s.session_date));
    const maxSessionNumber = allExistingSessions?.length > 0
      ? Math.max(...allExistingSessions.map(s => s.session_number || 0))
      : 0;

    const startSessionNumber = maxSessionNumber + 1;

    // Generate sessions
    const sessions = [];
    const skippedDates = [];
    // Parse dates as local time to avoid timezone issues
    const [startYear, startMonth, startDay] = start_date.split('-').map(Number);
    const [endYear, endMonth, endDay] = end_date.split('-').map(Number);
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);
    let sessionNumber = startSessionNumber;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      // Format date as YYYY-MM-DD without timezone conversion
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      if (!scheduleDays.has(dayOfWeek)) continue;
      if (skip_holidays && holidays.has(dateStr)) continue;
      if (exclude_dates.includes(dateStr)) continue;

      // Skip dates that already have sessions
      if (existingDates.has(dateStr)) {
        skippedDates.push(dateStr);
        continue;
      }

      const time = timeByDay[dayOfWeek];
      sessions.push({
        session_number: sessionNumber,
        session_date: dateStr,
        start_time: time.start,
        end_time: time.end,
        status: 'upcoming'
      });
      sessionNumber++;
    }

    // Check conflicts with other classes (room + teacher)
    const conflicts = [];
    if (sessions.length > 0 && (classData.room_id || classData.teacher_id)) {
      const sessionDates = sessions.map(s => s.session_date);

      // Get all existing sessions on those dates for same room/teacher
      let conflictQuery = supabase
        .from('sessions')
        .select(`
          id, session_date, start_time, end_time,
          classes!inner(id, name, room_id, teacher_id)
        `)
        .in('session_date', sessionDates)
        .neq('classes.id', classId);

      const { data: potentialConflicts } = await conflictQuery;

      if (potentialConflicts) {
        for (const session of sessions) {
          for (const existing of potentialConflicts) {
            // Check time overlap
            const newStart = session.start_time;
            const newEnd = session.end_time;
            const existStart = existing.start_time;
            const existEnd = existing.end_time;

            if (existing.session_date !== session.session_date) continue;

            const hasTimeOverlap = !(newEnd <= existStart || newStart >= existEnd);
            if (!hasTimeOverlap) continue;

            // Check room conflict
            if (classData.room_id && existing.classes.room_id === classData.room_id) {
              conflicts.push({
                session_date: session.session_date,
                conflict_type: 'room',
                conflicting_class: existing.classes.name,
                time: `${existStart} - ${existEnd}`
              });
            }

            // Check teacher conflict
            if (classData.teacher_id && existing.classes.teacher_id === classData.teacher_id) {
              conflicts.push({
                session_date: session.session_date,
                conflict_type: 'teacher',
                conflicting_class: existing.classes.name,
                time: `${existStart} - ${existEnd}`
              });
            }
          }
        }
      }
    }

    res.json({
      success: true,
      data: {
        sessions,
        count: sessions.length,
        startSessionNumber,
        conflicts,
        hasConflicts: conflicts.length > 0,
        skippedDates,
        skippedCount: skippedDates.length
      }
    });
  } catch (error) {
    console.error('Error previewing sessions:', error);
    next(error);
  }
});

// ========================================
// 🔥 BULK CREATE SESSIONS FROM SCHEDULE PATTERN
// Creates multiple sessions based on recurring pattern
// ========================================
app.post('/api/classes/:classId/sessions/bulk', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { schedule, start_date, end_date, skip_holidays = true, exclude_dates = [], replace_existing = false } = req.body;

    console.log(`🔥 Admin ${req.user.email} bulk create sessions cho lớp: ${classId}`);

    // Validate input
    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn lịch học' });
    }
    if (!start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn ngày bắt đầu và kết thúc' });
    }

    // Get class info
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, teacher_id, room_id, center_id')
      .eq('id', classId)
      .single();

    if (classError || !classData) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
    }

    // Vietnamese holidays
    const holidays = new Set([
      '2025-01-01', '2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31',
      '2025-02-01', '2025-02-02', '2025-02-03', '2025-04-30', '2025-05-01', '2025-09-02',
      '2026-01-01', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20'
    ]);

    // Day mapping
    const dayMapping = { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 0 };

    // Build schedule lookup
    const scheduleDays = new Set();
    const timeByDay = {};
    schedule.forEach(s => {
      const jsDay = dayMapping[s.day];
      if (jsDay !== undefined) {
        scheduleDays.add(jsDay);
        timeByDay[jsDay] = { start: s.start || '18:00', end: s.end || '20:00' };
      }
    });

    // If replace_existing, delete all sessions first
    if (replace_existing) {
      await supabase.from('sessions').delete().eq('class_id', classId);
    }

    // Get existing sessions to avoid duplicates
    const { data: allExistingSessions } = await supabase
      .from('sessions')
      .select('session_number, session_date')
      .eq('class_id', classId);

    const existingDates = new Set((allExistingSessions || []).map(s => s.session_date));
    const maxSessionNumber = allExistingSessions?.length > 0
      ? Math.max(...allExistingSessions.map(s => s.session_number || 0))
      : 0;

    const startSessionNumber = replace_existing ? 1 : (maxSessionNumber + 1);

    // Generate sessions
    const sessions = [];
    // Parse dates as local time to avoid timezone issues
    const [startYear, startMonth, startDay] = start_date.split('-').map(Number);
    const [endYear, endMonth, endDay] = end_date.split('-').map(Number);
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);
    let sessionNumber = startSessionNumber;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      // Format date as YYYY-MM-DD without timezone conversion
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      if (!scheduleDays.has(dayOfWeek)) continue;
      if (skip_holidays && holidays.has(dateStr)) continue;
      if (exclude_dates.includes(dateStr)) continue;
      // Skip dates that already have sessions
      if (existingDates.has(dateStr)) continue;

      const time = timeByDay[dayOfWeek];
      sessions.push({
        class_id: classId,
        teacher_id: classData.teacher_id,
        room_id: classData.room_id,
        session_number: sessionNumber,
        session_date: dateStr,
        start_time: time.start,
        end_time: time.end,
        status: 'upcoming'
      });
      sessionNumber++;
    }

    // Check if no new sessions to create
    if (sessions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có buổi học mới để tạo. Các ngày đã chọn có thể đã có buổi học hoặc trùng ngày lễ.'
      });
    }

    // Limit to 100 sessions
    if (sessions.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Tối đa 100 buổi học mỗi lần tạo. Vui lòng rút ngắn khoảng thời gian.'
      });
    }

    // Insert sessions in batches
    const batchSize = 50;
    let insertedCount = 0;

    for (let i = 0; i < sessions.length; i += batchSize) {
      const batch = sessions.slice(i, i + batchSize);
      const { error: insertError } = await supabase.from('sessions').insert(batch);

      if (insertError) {
        console.error('Error inserting batch:', insertError);
        return res.status(500).json({
          success: false,
          message: `Lỗi khi tạo buổi học: ${insertError.message}`,
          insertedCount
        });
      }
      insertedCount += batch.length;
    }

    console.log(`✅ Đã tạo ${insertedCount} buổi học cho lớp ${classId}`);

    res.json({
      success: true,
      message: `Đã tạo ${insertedCount} buổi học thành công`,
      data: {
        count: insertedCount,
        startSessionNumber
      }
    });
  } catch (error) {
    console.error('Error bulk creating sessions:', error);
    next(error);
  }
});

// ========================================
// 🔥 OLD BULK CREATE (keep for backward compatibility)
// Creates multiple sessions based on preview array
// ========================================
app.post('/api/admin/classes/:classId/sessions/bulk', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { pattern, sessions: previewSessions, preview = false } = req.body;

    console.log(`🔄 Admin ${req.user.email} bulk create sessions cho lớp: ${classId}`);

    // Validate input
    if (!previewSessions || !Array.isArray(previewSessions) || previewSessions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Danh sách buổi học không hợp lệ'
      });
    }

    // Limit to 100 sessions per operation
    if (previewSessions.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Tối đa 100 buổi học mỗi lần tạo'
      });
    }

    // Get class info
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, teacher_id, room_id, center_id')
      .eq('id', classId)
      .single();

    if (classError || !classData) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học'
      });
    }

    // Get current max session number
    const { data: existingSessions } = await supabase
      .from('sessions')
      .select('session_number')
      .eq('class_id', classId)
      .order('session_number', { ascending: false })
      .limit(1);

    const startSessionNumber = existingSessions?.[0]?.session_number + 1 || 1;

    // Prepare sessions for insertion
    const sessionsToInsert = previewSessions.map((session, index) => ({
      class_id: classId,
      teacher_id: classData.teacher_id,
      room_id: classData.room_id,
      session_number: startSessionNumber + index,
      session_date: session.session_date,
      start_time: session.start_time,
      end_time: session.end_time,
      status: 'upcoming'
    }));

    // If preview mode, return what would be created
    if (preview) {
      return res.json({
        success: true,
        preview: true,
        sessions: sessionsToInsert,
        count: sessionsToInsert.length,
        message: `Sẽ tạo ${sessionsToInsert.length} buổi học từ buổi #${startSessionNumber}`
      });
    }

    // Check for date conflicts within this class
    const sessionDates = sessionsToInsert.map(s => s.session_date);
    const { data: conflictingSessions } = await supabase
      .from('sessions')
      .select('session_date, session_number')
      .eq('class_id', classId)
      .in('session_date', sessionDates);

    if (conflictingSessions && conflictingSessions.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Có ${conflictingSessions.length} ngày đã có buổi học. Vui lòng kiểm tra lại.`,
        conflicts: conflictingSessions
      });
    }

    // Insert sessions in batches
    const batchSize = 50;
    let insertedCount = 0;

    for (let i = 0; i < sessionsToInsert.length; i += batchSize) {
      const batch = sessionsToInsert.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('sessions')
        .insert(batch);

      if (insertError) {
        console.error('Error inserting batch:', insertError);
        return res.status(500).json({
          success: false,
          message: `Lỗi khi tạo buổi học: ${insertError.message}`,
          insertedCount
        });
      }
      insertedCount += batch.length;
    }

    console.log(`✅ Đã tạo ${insertedCount} buổi học cho lớp ${classId}`);

    res.json({
      success: true,
      message: `Đã tạo ${insertedCount} buổi học thành công`,
      count: insertedCount,
      startSessionNumber
    });
  } catch (error) {
    console.error('Error bulk creating sessions:', error);
    next(error);
  }
});

// ========================================
// Import nhiều lớp học từ file
// ========================================
app.post('/api/admin/classes/import', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { classes: classesData } = req.body;

    if (!classesData || !Array.isArray(classesData) || classesData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu import không hợp lệ'
      });
    }

    console.log(`📥 Admin ${req.user.email} import ${classesData.length} lớp học`);

    // Fetch lookup data
    const [coursesRes, teachersRes, centersRes, roomsRes] = await Promise.all([
      supabase.from('courses').select('id, code, name'),
      supabase.from('profiles').select('id, email, full_name').eq('role', 'TEACHER'),
      supabase.from('centers').select('id, code, name'),
      supabase.from('rooms').select('id, name, center_id')
    ]);

    const courses = coursesRes.data || [];
    const teachers = teachersRes.data || [];
    const centers = centersRes.data || [];
    const rooms = roomsRes.data || [];

    // Maps for quick lookup
    const courseByCode = new Map(courses.map(c => [c.code?.toLowerCase(), c]));
    const teacherByEmail = new Map(teachers.map(t => [t.email?.toLowerCase(), t]));
    const centerByCode = new Map(centers.map(c => [c.code?.toLowerCase(), c]));

    const results = {
      success: 0,
      failed: 0,
      errors: [],
      created: []
    };

    // Process each class
    for (let i = 0; i < classesData.length; i++) {
      const row = classesData[i];
      const rowNum = i + 1;

      try {
        // Validate and lookup course
        const course = courseByCode.get(row.course_code?.toLowerCase());
        if (!course) {
          results.failed++;
          results.errors.push({
            row: rowNum,
            error: `Không tìm thấy khóa học với mã: ${row.course_code}`
          });
          continue;
        }

        // Lookup teacher (optional)
        let teacher = null;
        if (row.teacher_email) {
          teacher = teacherByEmail.get(row.teacher_email?.toLowerCase());
          if (!teacher) {
            results.failed++;
            results.errors.push({
              row: rowNum,
              error: `Không tìm thấy giáo viên với email: ${row.teacher_email}`
            });
            continue;
          }
        }

        // Lookup center (optional, use first if not specified)
        let center = null;
        if (row.center_code) {
          center = centerByCode.get(row.center_code?.toLowerCase());
          if (!center) {
            results.failed++;
            results.errors.push({
              row: rowNum,
              error: `Không tìm thấy trung tâm với mã: ${row.center_code}`
            });
            continue;
          }
        } else if (centers.length > 0) {
          center = centers[0]; // Default to first center
        }

        // Lookup room (optional)
        let room = null;
        if (row.room_name && center) {
          room = rooms.find(r =>
            r.name?.toLowerCase() === row.room_name?.toLowerCase() &&
            r.center_id === center.id
          );
        }

        // Generate class code if not provided
        let code = row.code;
        if (!code) {
          const randomNum = Math.floor(100000 + Math.random() * 900000);
          code = `CLS-${randomNum}`;
        }

        // Check for duplicate code
        const { data: existing } = await supabase
          .from('classes')
          .select('id')
          .eq('code', code)
          .single();

        if (existing) {
          results.failed++;
          results.errors.push({
            row: rowNum,
            error: `Mã lớp ${code} đã tồn tại`
          });
          continue;
        }

        // Validate status
        const validStatuses = ['upcoming', 'ongoing', 'completed', 'cancelled'];
        const status = validStatuses.includes(row.status?.toLowerCase())
          ? row.status.toLowerCase()
          : 'upcoming';

        // Insert class
        const { data: newClass, error: insertError } = await supabase
          .from('classes')
          .insert({
            code,
            name: row.name,
            course_id: course.id,
            teacher_id: teacher?.id || null,
            center_id: center?.id,
            room_id: room?.id || null,
            start_date: row.start_date || null,
            end_date: row.end_date || null,
            max_students: parseInt(row.max_students) || 20,
            status,
            schedule: []
          })
          .select()
          .single();

        if (insertError) {
          results.failed++;
          results.errors.push({
            row: rowNum,
            error: `Lỗi tạo lớp: ${insertError.message}`
          });
          continue;
        }

        results.success++;
        results.created.push({
          id: newClass.id,
          code: newClass.code,
          name: newClass.name
        });

      } catch (rowError) {
        results.failed++;
        results.errors.push({
          row: rowNum,
          error: rowError.message
        });
      }
    }

    console.log(`✅ Import kết quả: ${results.success} thành công, ${results.failed} thất bại`);

    res.json({
      success: true,
      ...results
    });

  } catch (error) {
    console.error('Error importing classes:', error);
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

// ========================================
// Bulk update nhiều sessions cùng lúc
// ========================================
app.put('/api/admin/sessions/bulk', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { sessionIds, updates } = req.body;

    if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Danh sách buổi học không hợp lệ'
      });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có thay đổi nào được gửi'
      });
    }

    console.log(`📝 Admin ${req.user.email} bulk update ${sessionIds.length} sessions:`, updates);

    // Check for locked sessions
    const { data: sessions, error: fetchError } = await supabase
      .from('sessions')
      .select('id, is_locked')
      .in('id', sessionIds);

    if (fetchError) throw fetchError;

    const lockedSessions = sessions?.filter(s => s.is_locked) || [];
    if (lockedSessions.length > 0) {
      return res.status(400).json({
        success: false,
        message: `${lockedSessions.length} buổi học đã bị khóa sổ, không thể sửa`
      });
    }

    // Sanitize updates - remove protected fields
    const safeUpdates = { ...updates };
    delete safeUpdates.is_locked;
    delete safeUpdates.payroll_id;
    delete safeUpdates.class_id;
    delete safeUpdates.id;

    safeUpdates.updated_at = new Date().toISOString();

    // Perform bulk update
    const { data, error: updateError } = await supabase
      .from('sessions')
      .update(safeUpdates)
      .in('id', sessionIds)
      .select();

    if (updateError) throw updateError;

    console.log(`✅ Đã cập nhật ${data?.length || 0} buổi học`);

    res.json({
      success: true,
      message: `Đã cập nhật ${data?.length || 0} buổi học`,
      updated: data?.length || 0,
      data
    });

  } catch (error) {
    console.error('Error bulk updating sessions:', error);
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

    // Nếu có exclude_class_id, loại bỏ những học viên đã có enrollment trong lớp đó (bất kỳ status)
    if (exclude_class_id && students?.length > 0) {
      const { data: enrolled } = await supabase
        .from('enrollments')
        .select('student_id')
        .eq('class_id', exclude_class_id);

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

      // Xóa grades của enrollment này
      await supabase
        .from('grades')
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

// ========================================
// Student Performance Analytics API
// ========================================

/**
 * GET /api/classes/:id/performance - Lấy performance data cho tất cả học viên trong lớp
 * Bao gồm: attendance rate, average grade, rank, trend, alerts
 */
app.get('/api/classes/:id/performance', requireAuth, async (req, res, next) => {
  try {
    const { id: classId } = req.params;
    console.log(`📊 Fetching performance data for class ${classId}`);

    // 1. Lấy thông tin lớp và course
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select(`
        id, name, code,
        courses (id, title, pass_score)
      `)
      .eq('id', classId)
      .single();

    if (classError || !classData) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
    }

    // 2. Lấy tất cả enrollments trong lớp
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select(`
        id,
        student_id,
        status,
        tuition_fee,
        discount_amount,
        paid_amount,
        enrolled_at,
        users!enrollments_student_id_fkey (
          id, full_name, email, avatar_url
        )
      `)
      .eq('class_id', classId)
      .eq('status', 'active');

    if (enrollmentsError) throw enrollmentsError;

    if (!enrollments || enrollments.length === 0) {
      return res.json({
        success: true,
        data: [],
        summary: { total: 0, avgAttendance: 0, avgGrade: 0 }
      });
    }

    const enrollmentIds = enrollments.map(e => e.id);
    const studentIds = enrollments.map(e => e.student_id);

    // 3. Lấy attendance data
    const { data: attendance } = await supabase
      .from('attendance')
      .select('enrollment_id, status, session_date')
      .in('enrollment_id', enrollmentIds);

    // 4. Lấy sessions để tính tổng số buổi
    const { data: sessions } = await supabase
      .from('sessions')
      .select('id, session_date, status')
      .eq('class_id', classId)
      .in('status', ['completed', 'in_progress']);

    const totalSessions = sessions?.length || 0;

    // 5. Lấy grades data
    const { data: grades } = await supabase
      .from('grades')
      .select(`
        enrollment_id,
        score,
        grade_structures (id, name, weight, max_score)
      `)
      .in('enrollment_id', enrollmentIds);

    // 6. Lấy grade structures của course
    const { data: gradeStructures } = await supabase
      .from('grade_structures')
      .select('id, name, weight, max_score, order_index')
      .eq('course_id', classData.courses?.id)
      .order('order_index');

    // 7. Build performance data cho từng học viên
    const performanceData = enrollments.map(enrollment => {
      const student = enrollment.users;
      const enrollmentId = enrollment.id;

      // Calculate attendance
      const studentAttendance = (attendance || []).filter(a => a.enrollment_id === enrollmentId);
      const presentCount = studentAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
      const absentCount = studentAttendance.filter(a => a.status === 'absent').length;
      const excusedCount = studentAttendance.filter(a => a.status === 'excused').length;
      const attendanceRate = totalSessions > 0
        ? Math.round((presentCount / totalSessions) * 100)
        : 0;

      // Get recent attendance (last 5)
      const recentAttendance = studentAttendance
        .sort((a, b) => new Date(b.session_date) - new Date(a.session_date))
        .slice(0, 5)
        .map(a => ({ date: a.session_date, status: a.status }));

      // Last attendance date
      const lastAttendance = recentAttendance.length > 0
        ? recentAttendance[0].date
        : null;

      // Calculate grades
      const studentGrades = (grades || []).filter(g => g.enrollment_id === enrollmentId);
      let totalWeight = 0;
      let weightedSum = 0;
      const gradeBreakdown = [];

      (gradeStructures || []).forEach(structure => {
        const gradeRecord = studentGrades.find(g => g.grade_structures?.id === structure.id);
        const score = gradeRecord?.score || null;

        gradeBreakdown.push({
          name: structure.name,
          score: score,
          maxScore: structure.max_score,
          weight: structure.weight
        });

        if (score !== null) {
          // Normalize score to 10-point scale
          const normalizedScore = (score / structure.max_score) * 10;
          weightedSum += normalizedScore * structure.weight;
          totalWeight += structure.weight;
        }
      });

      const averageGrade = totalWeight > 0
        ? Math.round((weightedSum / totalWeight) * 100) / 100
        : null;

      // Calculate trend (simplified - compare first half vs second half attendance)
      let trend = 'stable';
      if (studentAttendance.length >= 4) {
        const midPoint = Math.floor(studentAttendance.length / 2);
        const sorted = [...studentAttendance].sort((a, b) =>
          new Date(a.session_date) - new Date(b.session_date)
        );
        const firstHalf = sorted.slice(0, midPoint);
        const secondHalf = sorted.slice(midPoint);

        const firstHalfPresent = firstHalf.filter(a => a.status === 'present' || a.status === 'late').length;
        const secondHalfPresent = secondHalf.filter(a => a.status === 'present' || a.status === 'late').length;

        const firstRate = firstHalf.length > 0 ? firstHalfPresent / firstHalf.length : 0;
        const secondRate = secondHalf.length > 0 ? secondHalfPresent / secondHalf.length : 0;

        if (secondRate > firstRate + 0.1) trend = 'improving';
        else if (secondRate < firstRate - 0.1) trend = 'declining';
      }

      // Payment status
      const tuitionFee = enrollment.tuition_fee || 0;
      const discountAmount = enrollment.discount_amount || 0;
      const paidAmount = enrollment.paid_amount || 0;
      const finalAmount = tuitionFee - discountAmount;
      const remainingAmount = finalAmount - paidAmount;
      const paymentStatus = remainingAmount <= 0 ? 'paid' : 'unpaid';

      // Completed assignments (grades entered)
      const completedAssignments = studentGrades.length;

      return {
        studentId: student?.id,
        enrollmentId: enrollmentId,
        name: student?.full_name || 'N/A',
        email: student?.email || '',
        avatarUrl: student?.avatar_url,

        // Attendance metrics
        attendanceRate,
        presentCount,
        absentCount,
        excusedCount,
        totalSessions,
        lastAttendance,
        recentAttendance,

        // Grade metrics
        averageGrade,
        gradeBreakdown,
        completedAssignments,

        // Trend
        trend,

        // Payment
        tuitionFee,
        paidAmount,
        remainingAmount,
        paymentStatus,

        // Enrollment info
        enrolledAt: enrollment.enrolled_at
      };
    });

    // 8. Calculate ranks based on average grade
    const sorted = [...performanceData]
      .filter(s => s.averageGrade !== null)
      .sort((a, b) => (b.averageGrade || 0) - (a.averageGrade || 0));

    sorted.forEach((student, index) => {
      const found = performanceData.find(s => s.studentId === student.studentId);
      if (found) found.rank = index + 1;
    });

    // Students without grades get rank at the end
    let nextRank = sorted.length + 1;
    performanceData
      .filter(s => s.averageGrade === null)
      .forEach(s => { s.rank = nextRank++; });

    // 9. Calculate summary
    const total = performanceData.length;
    const avgAttendance = total > 0
      ? Math.round(performanceData.reduce((sum, s) => sum + s.attendanceRate, 0) / total)
      : 0;
    const studentsWithGrades = performanceData.filter(s => s.averageGrade !== null);
    const avgGrade = studentsWithGrades.length > 0
      ? Math.round(studentsWithGrades.reduce((sum, s) => sum + s.averageGrade, 0) / studentsWithGrades.length * 10) / 10
      : 0;

    console.log(`✅ Performance data: ${total} students, avg attendance: ${avgAttendance}%, avg grade: ${avgGrade}`);

    res.json({
      success: true,
      data: performanceData,
      summary: {
        total,
        avgAttendance,
        avgGrade,
        totalSessions,
        passScore: classData.courses?.pass_score || 5
      }
    });

  } catch (error) {
    console.error('Error fetching class performance:', error);
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

  // Parse dates as local time to avoid timezone issues
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);
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
    // Format date as YYYY-MM-DD without timezone conversion
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

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

// GET /api/dashboard/revenue-chart - Biểu đồ doanh thu theo tháng (OPTIMIZED - single query)
app.get('/api/dashboard/revenue-chart', requireAuth, async (req, res, next) => {
  try {
    const { centerId } = req.query;

    // Permission check for CENTER_MANAGER
    const { effectiveCenterId } = getEffectiveCenterId(req.user, centerId);

    // Calculate date range for last 12 months
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const startDate = twelveMonthsAgo.toISOString().split('T')[0];

    // OPTIMIZED: Single query instead of 12 separate queries
    let query = supabase
      .from('enrollments')
      .select('paid_amount, created_at, classes!inner(center_id)')
      .gte('created_at', `${startDate}T00:00:00`)
      .not('paid_amount', 'is', null);

    // Filter by center if specified
    if (effectiveCenterId) {
      query = query.eq('classes.center_id', effectiveCenterId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group by month in JavaScript (more efficient than N queries)
    const monthlyRevenue = {};

    // Initialize all 12 months with 0
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenue[key] = {
        month: `T${date.getMonth() + 1}`,
        monthNum: date.getMonth() + 1,
        year: date.getFullYear(),
        revenue: 0,
        enrollmentCount: 0
      };
    }

    // Aggregate data by month
    data?.forEach(enrollment => {
      const date = new Date(enrollment.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (monthlyRevenue[key]) {
        monthlyRevenue[key].revenue += parseFloat(enrollment.paid_amount) || 0;
        monthlyRevenue[key].enrollmentCount += 1;
      }
    });

    // Convert to array and sort by date
    const months = Object.values(monthlyRevenue)
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.monthNum - b.monthNum;
      })
      .map(m => ({
        label: m.month,      // ✅ Add 'label' for chart compatibility
        month: m.month,      // Keep 'month' for backward compatibility
        revenue: m.revenue,
        formatted: formatCurrency(m.revenue)
      }));

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

// GET /api/dashboard/payment-overview - Tổng quan thanh toán & hóa đơn
app.get('/api/dashboard/payment-overview', requireAuth, async (req, res, next) => {
  try {
    const { centerId } = req.query;
    const { effectiveCenterId } = getEffectiveCenterId(req.user, centerId);

    const today = new Date().toISOString().split('T')[0];

    // Query invoices with class center info
    let query = supabase
      .from('invoices')
      .select(`
        id, status, final_amount, paid_amount, due_date, created_at,
        class:classes!inner (center_id)
      `)
      .not('status', 'eq', 'cancelled');

    if (effectiveCenterId) {
      query = query.eq('classes.center_id', effectiveCenterId);
    }

    const { data: invoices, error } = await query;
    if (error) throw error;

    // Calculate statistics
    let totalInvoices = 0;
    let paidInvoices = 0;
    let pendingInvoices = 0;
    let overdueInvoices = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let totalOverdue = 0;

    invoices?.forEach(inv => {
      totalInvoices++;
      const unpaid = (inv.final_amount || 0) - (inv.paid_amount || 0);

      if (inv.status === 'paid') {
        paidInvoices++;
        totalPaid += inv.paid_amount || 0;
      } else if (inv.status === 'pending' || inv.status === 'partial') {
        if (inv.due_date && inv.due_date < today) {
          overdueInvoices++;
          totalOverdue += unpaid;
        } else {
          pendingInvoices++;
          totalPending += unpaid;
        }
      }
    });

    res.json({
      success: true,
      data: {
        counts: {
          total: totalInvoices,
          paid: paidInvoices,
          pending: pendingInvoices,
          overdue: overdueInvoices
        },
        amounts: {
          totalPaid: totalPaid,
          totalPaidFormatted: formatCurrency(totalPaid),
          totalPending: totalPending,
          totalPendingFormatted: formatCurrency(totalPending),
          totalOverdue: totalOverdue,
          totalOverdueFormatted: formatCurrency(totalOverdue)
        },
        overdueAlert: overdueInvoices > 0
      }
    });

  } catch (error) {
    console.error('Error fetching payment overview:', error);
    next(error);
  }
});

// GET /api/dashboard/attendance-overview - Tổng quan điểm danh
app.get('/api/dashboard/attendance-overview', requireAuth, async (req, res, next) => {
  try {
    const { centerId, days = 7 } = req.query;
    const { effectiveCenterId } = getEffectiveCenterId(req.user, centerId);

    // Date range for last N days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Query sessions in date range with attendance
    let sessionsQuery = supabase
      .from('sessions')
      .select(`
        id, session_date, status,
        classes!inner (id, name, center_id),
        attendance (id, status)
      `)
      .gte('session_date', startDate.toISOString().split('T')[0])
      .lte('session_date', endDate.toISOString().split('T')[0])
      .eq('status', 'completed');

    if (effectiveCenterId) {
      sessionsQuery = sessionsQuery.eq('classes.center_id', effectiveCenterId);
    }

    const { data: sessions, error } = await sessionsQuery;
    if (error) throw error;

    // Calculate attendance statistics
    let totalSessions = 0;
    let totalAttendances = 0;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;

    sessions?.forEach(session => {
      totalSessions++;
      session.attendance?.forEach(att => {
        totalAttendances++;
        switch (att.status) {
          case 'present': presentCount++; break;
          case 'absent': absentCount++; break;
          case 'late': lateCount++; break;
          case 'excused': excusedCount++; break;
        }
      });
    });

    const attendanceRate = totalAttendances > 0
      ? Math.round(((presentCount + lateCount) / totalAttendances) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        period: {
          days: parseInt(days),
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        },
        sessions: {
          total: totalSessions,
          completed: sessions?.filter(s => s.status === 'completed').length || 0
        },
        attendance: {
          total: totalAttendances,
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          excused: excusedCount,
          rate: attendanceRate,
          rateLabel: `${attendanceRate}%`
        },
        alert: attendanceRate < 80 && totalAttendances > 0
      }
    });

  } catch (error) {
    console.error('Error fetching attendance overview:', error);
    next(error);
  }
});

// GET /api/dashboard/teacher-performance - Hiệu suất giáo viên
app.get('/api/dashboard/teacher-performance', requireAuth, async (req, res, next) => {
  try {
    const { centerId, limit = 5 } = req.query;
    const { effectiveCenterId } = getEffectiveCenterId(req.user, centerId);

    // Get current month range
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    // Get teacher role
    const { data: teacherRole } = await supabase
      .from('roles')
      .select('id')
      .eq('code', 'TEACHER')
      .single();

    if (!teacherRole) {
      return res.json({ success: true, data: [] });
    }

    // Query teachers
    let teachersQuery = supabase
      .from('users')
      .select('id, full_name, email, avatar_url, center_id')
      .eq('role_id', teacherRole.id)
      .eq('status', 'active');

    if (effectiveCenterId) {
      teachersQuery = teachersQuery.eq('center_id', effectiveCenterId);
    }

    const { data: teachers, error: teachersError } = await teachersQuery;
    if (teachersError) throw teachersError;

    // Get sessions for each teacher this month
    const teacherStats = await Promise.all(
      (teachers || []).map(async (teacher) => {
        // Count completed sessions
        const { count: sessionsCount } = await supabase
          .from('sessions')
          .select('*, classes!inner(teacher_id)', { count: 'exact', head: true })
          .eq('classes.teacher_id', teacher.id)
          .eq('status', 'completed')
          .gte('session_date', firstDayOfMonth)
          .lte('session_date', lastDayOfMonth);

        // Count active classes
        const { count: classesCount } = await supabase
          .from('classes')
          .select('*', { count: 'exact', head: true })
          .eq('teacher_id', teacher.id)
          .in('status', ['ongoing', 'upcoming']);

        return {
          id: teacher.id,
          name: teacher.full_name,
          email: teacher.email,
          avatar_url: teacher.avatar_url,
          sessionsCompleted: sessionsCount || 0,
          activeClasses: classesCount || 0
        };
      })
    );

    // Sort by sessions completed and limit
    const topTeachers = teacherStats
      .sort((a, b) => b.sessionsCompleted - a.sessionsCompleted)
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: topTeachers,
      period: {
        month: now.getMonth() + 1,
        year: now.getFullYear()
      }
    });

  } catch (error) {
    console.error('Error fetching teacher performance:', error);
    next(error);
  }
});

// GET /api/dashboard/today-schedule - Lịch dạy hôm nay
app.get('/api/dashboard/today-schedule', requireAuth, async (req, res, next) => {
  try {
    const { centerId } = req.query;
    const { effectiveCenterId } = getEffectiveCenterId(req.user, centerId);

    const today = new Date().toISOString().split('T')[0];

    let query = supabase
      .from('sessions')
      .select(`
        id, session_date, start_time, end_time, status,
        classes!inner (
          id, code, name, center_id,
          courses (title),
          users!classes_teacher_id_fkey (full_name, avatar_url),
          rooms (name)
        )
      `)
      .eq('session_date', today)
      .order('start_time', { ascending: true });

    if (effectiveCenterId) {
      query = query.eq('classes.center_id', effectiveCenterId);
    }

    const { data: sessions, error } = await query;
    if (error) throw error;

    // Format sessions
    const todaySessions = (sessions || []).map(session => ({
      id: session.id,
      time: `${session.start_time?.slice(0, 5)} - ${session.end_time?.slice(0, 5)}`,
      startTime: session.start_time,
      endTime: session.end_time,
      status: session.status,
      className: session.classes?.name,
      classCode: session.classes?.code,
      courseName: session.classes?.courses?.title,
      teacherName: session.classes?.users?.full_name,
      teacherAvatar: session.classes?.users?.avatar_url,
      roomName: session.classes?.rooms?.name
    }));

    // Count by status
    const scheduled = todaySessions.filter(s => s.status === 'scheduled').length;
    const completed = todaySessions.filter(s => s.status === 'completed').length;
    const cancelled = todaySessions.filter(s => s.status === 'cancelled').length;

    res.json({
      success: true,
      data: {
        sessions: todaySessions,
        summary: {
          total: todaySessions.length,
          scheduled,
          completed,
          cancelled
        },
        date: today
      }
    });

  } catch (error) {
    console.error('Error fetching today schedule:', error);
    next(error);
  }
});

// GET /api/dashboard/all - Unified API cho tất cả dashboard data (reduce API calls)
app.get('/api/dashboard/all', requireAuth, async (req, res, next) => {
  try {
    const { centerId } = req.query;
    const { effectiveCenterId } = getEffectiveCenterId(req.user, centerId);

    console.log(`📊 Dashboard ALL requested by ${req.user.email} | Center: ${effectiveCenterId || 'ALL'}`);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const firstDayOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const firstDayOfLastMonth = `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}-01`;
    const lastDayOfLastMonth = new Date(currentYear, currentMonth - 1, 0).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    // ============ PARALLEL QUERIES ============
    const [
      enrollmentsResult,
      enrollmentsThisMonthResult,
      enrollmentsLastMonthResult,
      classesResult,
      invoicesResult,
      coursesResult,
      recentEnrollmentsResult,
      todaySessionsResult
    ] = await Promise.all([
      // All enrollments for debt calculation
      supabase.from('enrollments').select('tuition_fee, paid_amount, student_id'),

      // This month enrollments count
      supabase.from('enrollments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayOfMonth),

      // Last month enrollments count
      supabase.from('enrollments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayOfLastMonth)
        .lte('created_at', lastDayOfLastMonth),

      // Classes for active count
      supabase.from('classes')
        .select('id, status, center_id')
        .in('status', ['ongoing', 'upcoming']),

      // Invoices for payment overview
      supabase.from('invoices')
        .select('status, final_amount, paid_amount, due_date, class:classes(center_id)')
        .not('status', 'eq', 'cancelled'),

      // Courses count
      supabase.from('courses').select('*', { count: 'exact', head: true }),

      // Recent enrollments
      supabase.from('enrollments')
        .select(`
          id, created_at,
          users!enrollments_student_id_fkey (id, full_name, email, avatar_url),
          classes (id, code, name, courses (id, title))
        `)
        .order('created_at', { ascending: false })
        .limit(5),

      // Today sessions
      supabase.from('sessions')
        .select(`
          id, start_time, end_time, status,
          classes!inner (
            id, code, name, center_id,
            courses (title),
            users!classes_teacher_id_fkey (full_name),
            rooms (name)
          )
        `)
        .eq('session_date', today)
        .order('start_time', { ascending: true })
    ]);

    // ============ PROCESS DATA ============
    // Filter by center if needed
    const filterByCenter = (data, centerField = 'center_id') => {
      if (!effectiveCenterId || !data) return data;
      return data.filter(item => {
        const itemCenterId = typeof centerField === 'function'
          ? centerField(item)
          : (centerField.includes('.')
            ? centerField.split('.').reduce((o, k) => o?.[k], item)
            : item[centerField]);
        return itemCenterId === effectiveCenterId;
      });
    };

    // Enrollments data
    const enrollments = enrollmentsResult.data || [];
    const enrollmentsThisMonth = enrollmentsThisMonthResult.count || 0;
    const enrollmentsLastMonth = enrollmentsLastMonthResult.count || 0;

    // Debt calculation
    const totalDebt = enrollments.reduce((sum, e) => {
      const remaining = (e.tuition_fee || 0) - (e.paid_amount || 0);
      return sum + (remaining > 0 ? remaining : 0);
    }, 0);

    // Unique students
    const totalStudents = new Set(enrollments.map(e => e.student_id).filter(Boolean)).size;

    // Student trend
    const studentsTrend = enrollmentsLastMonth > 0
      ? Math.round(((enrollmentsThisMonth - enrollmentsLastMonth) / enrollmentsLastMonth) * 100)
      : (enrollmentsThisMonth > 0 ? 100 : 0);

    // Active classes (filter by center)
    const classes = filterByCenter(classesResult.data || []);
    const activeClasses = classes.length;

    // Invoice stats (filter by center)
    const invoices = filterByCenter(invoicesResult.data || [], item => item.class?.center_id);
    let paidInvoices = 0, pendingInvoices = 0, overdueInvoices = 0;
    let totalPaid = 0, totalPending = 0, totalOverdue = 0;

    invoices.forEach(inv => {
      const unpaid = (inv.final_amount || 0) - (inv.paid_amount || 0);
      if (inv.status === 'paid') {
        paidInvoices++;
        totalPaid += inv.paid_amount || 0;
      } else if (inv.due_date && inv.due_date < today) {
        overdueInvoices++;
        totalOverdue += unpaid;
      } else {
        pendingInvoices++;
        totalPending += unpaid;
      }
    });

    // Recent students
    const recentStudents = (recentEnrollmentsResult.data || []).map(e => {
      const createdAt = new Date(e.created_at);
      const timeDiff = now.getTime() - createdAt.getTime();
      const minutes = Math.max(0, Math.floor(timeDiff / (1000 * 60)));
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      let timeAgo = 'Vừa xong';
      if (days > 0) timeAgo = `${days} ngày trước`;
      else if (hours > 0) timeAgo = `${hours} giờ trước`;
      else if (minutes > 0) timeAgo = `${minutes} phút trước`;

      return {
        id: e.id,
        name: e.users?.full_name || 'N/A',
        email: e.users?.email,
        avatar_url: e.users?.avatar_url,
        course: e.classes?.courses?.title || e.classes?.name || 'N/A',
        class_code: e.classes?.code,
        time: timeAgo,
        created_at: e.created_at  // ✅ ADD created_at for date display
      };
    });

    // Today schedule (filter by center)
    const todaySessions = filterByCenter(todaySessionsResult.data || [], item => item.classes?.center_id)
      .map(s => ({
        id: s.id,
        time: `${s.start_time?.slice(0, 5)} - ${s.end_time?.slice(0, 5)}`,
        status: s.status,
        className: s.classes?.name,
        classCode: s.classes?.code,
        courseName: s.classes?.courses?.title,
        teacherName: s.classes?.users?.full_name,
        roomName: s.classes?.rooms?.name
      }));

    // ============ RESPONSE ============
    res.json({
      success: true,
      data: {
        stats: {
          revenue: {
            value: totalPaid,
            formatted: formatCurrency(totalPaid),
            description: `Doanh thu tháng ${currentMonth}/${currentYear}`
          },
          newStudents: {
            value: enrollmentsThisMonth,
            trend: studentsTrend,
            trendUp: studentsTrend >= 0,
            description: 'Ghi danh trong tháng'
          },
          activeClasses: {
            value: activeClasses,
            description: 'Lớp đang diễn ra'
          },
          debt: {
            value: totalDebt,
            formatted: formatCurrency(totalDebt),
            description: 'Cần thu hồi'
          },
          summary: {
            totalCourses: coursesResult.count || 0,
            totalStudents
          }
        },
        payments: {
          counts: {
            total: invoices.length,
            paid: paidInvoices,
            pending: pendingInvoices,
            overdue: overdueInvoices
          },
          amounts: {
            totalPaid,
            totalPaidFormatted: formatCurrency(totalPaid),
            totalPending,
            totalPendingFormatted: formatCurrency(totalPending),
            totalOverdue,
            totalOverdueFormatted: formatCurrency(totalOverdue)
          },
          overdueAlert: overdueInvoices > 0
        },
        recentStudents,
        todaySchedule: {
          sessions: todaySessions.slice(0, 5),
          summary: {
            total: todaySessions.length,
            scheduled: todaySessions.filter(s => s.status === 'scheduled').length,
            completed: todaySessions.filter(s => s.status === 'completed').length
          }
        },
        period: {
          month: currentMonth,
          year: currentYear,
          today
        },
        centerId: effectiveCenterId
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard all:', error);
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
// TEACHER DASHBOARD APIs - Dashboard cho giáo viên
// ============================================================

/**
 * GET /api/teacher/dashboard/overview - Tổng quan dashboard giáo viên
 * Returns: stats (today sessions, monthly hours, income, pending attendance)
 */
app.get('/api/teacher/dashboard/overview', requireAuth, async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const firstDayOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

    // 1. Sessions today
    const { data: todaySessions, error: todayError } = await supabase
      .from('sessions')
      .select('id, status')
      .eq('teacher_id', teacherId)
      .eq('session_date', today);

    if (todayError) throw todayError;

    const todayCount = todaySessions?.length || 0;
    const todayCompleted = todaySessions?.filter(s => s.status === 'completed').length || 0;

    // 2. This month stats
    const { data: monthSessions, error: monthError } = await supabase
      .from('sessions')
      .select('id, duration_hours, teacher_rate, status')
      .eq('teacher_id', teacherId)
      .gte('session_date', firstDayOfMonth)
      .lte('session_date', lastDayOfMonth);

    if (monthError) throw monthError;

    const monthTotalSessions = monthSessions?.length || 0;
    const monthCompletedSessions = monthSessions?.filter(s => s.status === 'completed').length || 0;
    const monthTotalHours = monthSessions?.reduce((sum, s) => sum + (parseFloat(s.duration_hours) || 0), 0) || 0;
    const monthCompletedHours = monthSessions?.filter(s => s.status === 'completed')
      .reduce((sum, s) => sum + (parseFloat(s.duration_hours) || 0), 0) || 0;
    const monthEstimatedIncome = monthSessions?.filter(s => s.status === 'completed')
      .reduce((sum, s) => {
        const hours = parseFloat(s.duration_hours) || 0;
        const rate = parseFloat(s.teacher_rate) || 150000;
        return sum + (hours * rate);
      }, 0) || 0;

    // 3. Pending attendance (sessions today/past that are not completed)
    const { data: pendingSessions, error: pendingError } = await supabase
      .from('sessions')
      .select('id')
      .eq('teacher_id', teacherId)
      .lte('session_date', today)
      .in('status', ['scheduled', 'upcoming']);

    if (pendingError) throw pendingError;
    const pendingAttendance = pendingSessions?.length || 0;

    // 4. Active classes count
    const { count: activeClasses, error: classError } = await supabase
      .from('classes')
      .select('id', { count: 'exact', head: true })
      .eq('teacher_id', teacherId)
      .in('status', ['ongoing', 'upcoming']);

    if (classError) throw classError;

    // 5. Current payroll status (this month)
    const { data: currentPayroll } = await supabase
      .from('payroll')
      .select('id, status, net_salary')
      .eq('teacher_id', teacherId)
      .eq('period_month', currentMonth)
      .eq('period_year', currentYear)
      .single();

    res.json({
      success: true,
      data: {
        today: {
          total: todayCount,
          completed: todayCompleted,
          pending: todayCount - todayCompleted
        },
        month: {
          month: currentMonth,
          year: currentYear,
          totalSessions: monthTotalSessions,
          completedSessions: monthCompletedSessions,
          totalHours: Math.round(monthTotalHours * 10) / 10,
          completedHours: Math.round(monthCompletedHours * 10) / 10,
          estimatedIncome: monthEstimatedIncome,
          payrollStatus: currentPayroll?.status || null,
          payrollAmount: currentPayroll?.net_salary || null
        },
        pendingAttendance,
        activeClasses: activeClasses || 0
      }
    });
  } catch (error) {
    console.error('Error fetching teacher dashboard overview:', error);
    next(error);
  }
});

/**
 * GET /api/teacher/dashboard/today-sessions - Lịch dạy hôm nay của giáo viên
 */
app.get('/api/teacher/dashboard/today-sessions', requireAuth, async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const { data: sessions, error } = await supabase
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
        notes,
        room_id,
        classes (
          id,
          code,
          name,
          rooms (id, name),
          courses (id, code, title)
        )
      `)
      .eq('teacher_id', teacherId)
      .eq('session_date', today)
      .order('start_time', { ascending: true });

    if (error) throw error;

    // Get student count for each class
    const classIds = [...new Set(sessions?.map(s => s.classes?.id).filter(Boolean))];
    let studentCounts = {};

    if (classIds.length > 0) {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('class_id')
        .in('class_id', classIds)
        .eq('status', 'active');

      studentCounts = enrollments?.reduce((acc, e) => {
        acc[e.class_id] = (acc[e.class_id] || 0) + 1;
        return acc;
      }, {}) || {};
    }

    // Check attendance status for each session
    const enrichedSessions = await Promise.all((sessions || []).map(async (session) => {
      const { count: attendanceCount } = await supabase
        .from('attendance')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', session.id);

      return {
        ...session,
        studentCount: studentCounts[session.classes?.id] || 0,
        attendanceMarked: (attendanceCount || 0) > 0,
        roomName: session.classes?.rooms?.name || 'Chưa xếp phòng'
      };
    }));

    res.json({
      success: true,
      data: enrichedSessions,
      date: today
    });
  } catch (error) {
    console.error('Error fetching today sessions:', error);
    next(error);
  }
});

/**
 * GET /api/teacher/dashboard/upcoming-sessions - Buổi học sắp tới (7 ngày)
 */
app.get('/api/teacher/dashboard/upcoming-sessions', requireAuth, async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const todayStr = today.toISOString().split('T')[0];
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const { data: sessions, error } = await supabase
      .from('sessions')
      .select(`
        id,
        session_number,
        session_date,
        start_time,
        end_time,
        duration_hours,
        status,
        classes (
          id,
          code,
          name,
          rooms (id, name),
          courses (id, title)
        )
      `)
      .eq('teacher_id', teacherId)
      .gt('session_date', todayStr)
      .lte('session_date', nextWeekStr)
      .in('status', ['scheduled', 'upcoming'])
      .order('session_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(10);

    if (error) throw error;

    res.json({
      success: true,
      data: sessions || []
    });
  } catch (error) {
    console.error('Error fetching upcoming sessions:', error);
    next(error);
  }
});

/**
 * GET /api/teacher/dashboard/classes-summary - Tổng quan các lớp đang dạy
 */
app.get('/api/teacher/dashboard/classes-summary', requireAuth, async (req, res, next) => {
  try {
    const teacherId = req.user.id;

    const { data: classes, error } = await supabase
      .from('classes')
      .select(`
        id,
        code,
        name,
        start_date,
        end_date,
        schedule,
        status,
        rooms (id, name),
        courses (id, code, title, category),
        centers (id, name)
      `)
      .eq('teacher_id', teacherId)
      .in('status', ['ongoing', 'upcoming'])
      .order('start_date', { ascending: true });

    if (error) throw error;

    // Get stats for each class
    const enrichedClasses = await Promise.all((classes || []).map(async (cls) => {
      // Student count
      const { count: studentCount } = await supabase
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('class_id', cls.id)
        .eq('status', 'active');

      // Session stats
      const { data: sessions } = await supabase
        .from('sessions')
        .select('id, status')
        .eq('class_id', cls.id);

      const totalSessions = sessions?.length || 0;
      const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;
      const progress = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

      return {
        ...cls,
        studentCount: studentCount || 0,
        totalSessions,
        completedSessions,
        progress,
        remainingSessions: totalSessions - completedSessions
      };
    }));

    res.json({
      success: true,
      data: enrichedClasses
    });
  } catch (error) {
    console.error('Error fetching classes summary:', error);
    next(error);
  }
});

/**
 * GET /api/teacher/dashboard/attendance-stats - Thống kê điểm danh của GV
 */
app.get('/api/teacher/dashboard/attendance-stats', requireAuth, async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const firstDayOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const today = now.toISOString().split('T')[0];

    // Get all sessions this month that should be completed
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select(`
        id,
        session_date,
        status,
        class_id,
        classes (id, name)
      `)
      .eq('teacher_id', teacherId)
      .gte('session_date', firstDayOfMonth)
      .lte('session_date', today);

    if (sessionsError) throw sessionsError;

    // Get attendance records for these sessions
    const sessionIds = sessions?.map(s => s.id) || [];
    let attendanceBySession = {};

    if (sessionIds.length > 0) {
      const { data: attendances } = await supabase
        .from('attendance')
        .select('session_id, status')
        .in('session_id', sessionIds);

      attendanceBySession = attendances?.reduce((acc, a) => {
        if (!acc[a.session_id]) acc[a.session_id] = [];
        acc[a.session_id].push(a.status);
        return acc;
      }, {}) || {};
    }

    // Calculate stats
    const totalSessions = sessions?.length || 0;
    const markedSessions = sessions?.filter(s => attendanceBySession[s.id]?.length > 0).length || 0;
    const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;
    const unmarkedSessions = sessions?.filter(s =>
      s.status !== 'cancelled' &&
      s.session_date <= today &&
      !attendanceBySession[s.id]?.length
    ).length || 0;

    // Attendance rate calculation
    let totalStudents = 0;
    let presentStudents = 0;
    let lateStudents = 0;
    let absentStudents = 0;

    Object.values(attendanceBySession).forEach(statuses => {
      statuses.forEach(status => {
        totalStudents++;
        if (status === 'present') presentStudents++;
        else if (status === 'late') lateStudents++;
        else if (status === 'absent') absentStudents++;
      });
    });

    const attendanceRate = totalStudents > 0
      ? Math.round(((presentStudents + lateStudents) / totalStudents) * 100)
      : 0;

    // Group by class for breakdown
    const classSummary = {};
    sessions?.forEach(s => {
      const classId = s.class_id;
      const className = s.classes?.name || 'Unknown';
      if (!classSummary[classId]) {
        classSummary[classId] = {
          className,
          totalSessions: 0,
          markedSessions: 0,
          present: 0,
          late: 0,
          absent: 0
        };
      }
      classSummary[classId].totalSessions++;
      if (attendanceBySession[s.id]?.length > 0) {
        classSummary[classId].markedSessions++;
        attendanceBySession[s.id].forEach(status => {
          if (status === 'present') classSummary[classId].present++;
          else if (status === 'late') classSummary[classId].late++;
          else if (status === 'absent') classSummary[classId].absent++;
        });
      }
    });

    res.json({
      success: true,
      data: {
        month: { month: currentMonth, year: currentYear },
        summary: {
          totalSessions,
          completedSessions,
          markedSessions,
          unmarkedSessions,
          attendanceRate
        },
        students: {
          total: totalStudents,
          present: presentStudents,
          late: lateStudents,
          absent: absentStudents
        },
        byClass: Object.values(classSummary)
      }
    });
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    next(error);
  }
});

/**
 * GET /api/teacher/availability - Giáo viên xem lịch rảnh/bận của mình
 */
app.get('/api/teacher/availability', requireAuth, async (req, res, next) => {
  try {
    const teacherId = req.user.id;

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
 * PUT /api/teacher/availability - Giáo viên cập nhật lịch rảnh/bận của mình
 */
app.put('/api/teacher/availability', requireAuth, async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const { slots } = req.body; // Array of { day_of_week, start_time, end_time, type, reason }

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

    // Fetch và return updated data
    const { data: updatedSlots } = await supabase
      .from('teacher_availability')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('day_of_week', { ascending: true });

    res.json({
      success: true,
      message: 'Cập nhật lịch rảnh/bận thành công',
      data: updatedSlots || []
    });
  } catch (error) {
    console.error('Error updating teacher availability:', error);
    next(error);
  }
});

/**
 * GET /api/teacher/classes - Danh sách lớp của giáo viên
 */
app.get('/api/teacher/classes', requireAuth, async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const { status } = req.query;

    let query = supabase
      .from('classes')
      .select(`
        id,
        code,
        name,
        start_date,
        end_date,
        schedule,
        status,
        max_students,
        room_id,
        rooms (id, name, capacity),
        courses (id, code, title, category),
        centers (id, name)
      `)
      .eq('teacher_id', teacherId)
      .order('start_date', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: classes, error } = await query;
    if (error) throw error;

    // Enrich with enrollment count
    const enrichedClasses = await Promise.all((classes || []).map(async (cls) => {
      const { count } = await supabase
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('class_id', cls.id)
        .eq('status', 'active');

      return {
        ...cls,
        studentCount: count || 0
      };
    }));

    res.json({
      success: true,
      data: enrichedClasses
    });
  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    next(error);
  }
});

/**
 * GET /api/teacher/classes/:id - Chi tiết một lớp (với students, sessions)
 */
app.get('/api/teacher/classes/:id', requireAuth, async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const { id } = req.params;

    // Verify teacher owns this class
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select(`
        *,
        rooms (id, name, capacity),
        courses (id, code, title, category, description),
        centers (id, name, address)
      `)
      .eq('id', id)
      .eq('teacher_id', teacherId)
      .single();

    if (classError || !classData) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học hoặc bạn không có quyền' });
    }

    // Get enrolled students
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(`
        id,
        enrolled_at,
        status,
        student:users!enrollments_student_id_fkey (id, full_name, email, phone, avatar_url)
      `)
      .eq('class_id', id)
      .eq('status', 'active');

    // Get sessions
    const { data: sessions } = await supabase
      .from('sessions')
      .select('id, session_number, session_date, start_time, end_time, status, topic')
      .eq('class_id', id)
      .order('session_date', { ascending: true });

    res.json({
      success: true,
      data: {
        ...classData,
        students: enrollments?.map(e => e.student) || [],
        sessions: sessions || [],
        totalStudents: enrollments?.length || 0,
        totalSessions: sessions?.length || 0,
        completedSessions: sessions?.filter(s => s.status === 'completed').length || 0
      }
    });
  } catch (error) {
    console.error('Error fetching teacher class detail:', error);
    next(error);
  }
});

/**
 * GET /api/teacher/classes/:id/students - Danh sách học viên trong lớp
 */
app.get('/api/teacher/classes/:id/students', requireAuth, async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const { id } = req.params;

    // Verify teacher owns this class
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, teacher_id')
      .eq('id', id)
      .single();

    if (classError || !classData || classData.teacher_id !== teacherId) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập lớp này' });
    }

    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select(`
        id,
        enrolled_at,
        status,
        student:users!enrollments_student_id_fkey (
          id,
          full_name,
          email,
          phone,
          avatar_url
        )
      `)
      .eq('class_id', id)
      .eq('status', 'active');

    if (error) throw error;

    res.json({
      success: true,
      data: enrollments?.map(e => ({
        enrollment_id: e.id,
        enrolled_at: e.enrolled_at,
        student_id: e.student?.id,
        ...e.student
      })) || []
    });
  } catch (error) {
    console.error('Error fetching class students:', error);
    next(error);
  }
});

/**
 * GET /api/teacher/sessions/:id/attendance - Lấy điểm danh của một session
 */
app.get('/api/teacher/sessions/:id/attendance', requireAuth, async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const { id: sessionId } = req.params;

    // Verify teacher owns this session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, teacher_id, class_id, session_date')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session || session.teacher_id !== teacherId) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập buổi học này' });
    }

    // Get attendance records
    const { data: attendance, error } = await supabase
      .from('attendance')
      .select(`
        id,
        student_id,
        status,
        check_in_time,
        notes,
        student:users!attendance_student_id_fkey (id, full_name, email, avatar_url)
      `)
      .eq('session_id', sessionId);

    if (error) throw error;

    res.json({
      success: true,
      data: attendance || []
    });
  } catch (error) {
    console.error('Error fetching session attendance:', error);
    next(error);
  }
});

/**
 * POST /api/teacher/sessions/:id/attendance - Giáo viên điểm danh
 */
app.post('/api/teacher/sessions/:id/attendance', requireAuth, async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const { id: sessionId } = req.params;
    const { attendances } = req.body; // Array of { student_id, status, notes }

    // Verify teacher owns this session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, teacher_id, class_id, is_locked')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy buổi học' });
    }

    if (session.teacher_id !== teacherId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền điểm danh buổi học này' });
    }

    if (session.is_locked) {
      return res.status(400).json({ success: false, message: 'Buổi học đã khóa sổ, không thể điểm danh' });
    }

    console.log(`📋 Teacher ${req.user.email} điểm danh ${attendances.length} học viên cho session ${sessionId}`);

    // Upsert attendance records
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

    // Mark session as completed
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
    console.error('Error marking attendance:', error);
    next(error);
  }
});

/**
 * GET /api/teacher/profile - Thông tin profile của giáo viên
 */
app.get('/api/teacher/profile', requireAuth, async (req, res, next) => {
  try {
    const teacherId = req.user.id;

    const { data: profile, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        phone,
        avatar_url,
        hourly_rate,
        status,
        created_at,
        center_id,
        centers (id, name, address, hotline),
        roles (id, code, name)
      `)
      .eq('id', teacherId)
      .single();

    if (error) throw error;

    // Get teaching stats
    const now = new Date();
    const currentYear = now.getFullYear();

    // Total classes taught
    const { count: totalClasses } = await supabase
      .from('classes')
      .select('id', { count: 'exact', head: true })
      .eq('teacher_id', teacherId);

    // Total sessions completed
    const { count: totalSessions } = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('teacher_id', teacherId)
      .eq('status', 'completed');

    // Total hours this year
    const { data: yearSessions } = await supabase
      .from('sessions')
      .select('duration_hours')
      .eq('teacher_id', teacherId)
      .eq('status', 'completed')
      .gte('session_date', `${currentYear}-01-01`);

    const totalHoursThisYear = yearSessions?.reduce((sum, s) => sum + (parseFloat(s.duration_hours) || 0), 0) || 0;

    res.json({
      success: true,
      data: {
        ...profile,
        stats: {
          totalClasses: totalClasses || 0,
          totalSessions: totalSessions || 0,
          totalHoursThisYear: Math.round(totalHoursThisYear * 10) / 10
        }
      }
    });
  } catch (error) {
    console.error('Error fetching teacher profile:', error);
    next(error);
  }
});

/**
 * GET /api/teacher/schedule - Lấy lịch dạy của giáo viên theo khoảng thời gian
 * Query params: start_date, end_date (default: this week)
 */
app.get('/api/teacher/schedule', requireAuth, async (req, res, next) => {
  try {
    const teacherId = req.user.id;

    // Default to this week
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const startDate = req.query.start_date || monday.toISOString().split('T')[0];
    const endDate = req.query.end_date || sunday.toISOString().split('T')[0];

    const { data: sessions, error } = await supabase
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
        notes,
        room_id,
        is_locked,
        classes (
          id,
          code,
          name,
          rooms (id, name, capacity),
          courses (id, code, title),
          centers (id, name)
        )
      `)
      .eq('teacher_id', teacherId)
      .gte('session_date', startDate)
      .lte('session_date', endDate)
      .order('session_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;

    // Group by date for easier rendering
    const groupedByDate = {};
    sessions?.forEach(session => {
      const date = session.session_date;
      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }
      groupedByDate[date].push({
        ...session,
        class_name: session.classes?.name,
        class_code: session.classes?.code,
        course_name: session.classes?.courses?.title,
        room_name: session.classes?.rooms?.name,
        center_name: session.classes?.centers?.name
      });
    });

    // Generate all dates in range
    const allDates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      allDates.push({
        date: dateStr,
        dayOfWeek: current.getDay(),
        sessions: groupedByDate[dateStr] || []
      });
      current.setDate(current.getDate() + 1);
    }

    // Stats
    const totalSessions = sessions?.length || 0;
    const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;
    const totalHours = sessions?.reduce((sum, s) => sum + (parseFloat(s.duration_hours) || 0), 0) || 0;

    res.json({
      success: true,
      data: {
        startDate,
        endDate,
        schedule: allDates,
        stats: {
          totalSessions,
          completedSessions,
          totalHours: Math.round(totalHours * 10) / 10
        }
      }
    });
  } catch (error) {
    console.error('Error fetching teacher schedule:', error);
    next(error);
  }
});

/**
 * GET /api/teacher/schedule/month - Lấy lịch dạy theo tháng (cho calendar view)
 * Query params: month, year
 */
app.get('/api/teacher/schedule/month', requireAuth, async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const now = new Date();
    const month = parseInt(req.query.month) || (now.getMonth() + 1);
    const year = parseInt(req.query.year) || now.getFullYear();

    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).toISOString().split('T')[0];

    const { data: sessions, error } = await supabase
      .from('sessions')
      .select(`
        id,
        session_number,
        session_date,
        start_time,
        end_time,
        duration_hours,
        status,
        classes (
          id,
          code,
          name,
          courses (id, title)
        )
      `)
      .eq('teacher_id', teacherId)
      .gte('session_date', firstDay)
      .lte('session_date', lastDay)
      .order('session_date')
      .order('start_time');

    if (error) throw error;

    // Group sessions by date
    const sessionsByDate = {};
    sessions?.forEach(session => {
      const date = session.session_date;
      if (!sessionsByDate[date]) {
        sessionsByDate[date] = [];
      }
      sessionsByDate[date].push({
        id: session.id,
        start_time: session.start_time,
        end_time: session.end_time,
        status: session.status,
        class_name: session.classes?.name,
        class_code: session.classes?.code,
        course_title: session.classes?.courses?.title
      });
    });

    res.json({
      success: true,
      data: {
        month,
        year,
        sessionsByDate,
        totalSessions: sessions?.length || 0
      }
    });
  } catch (error) {
    console.error('Error fetching teacher monthly schedule:', error);
    next(error);
  }
});

// ============================================================
// END TEACHER DASHBOARD APIs
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

// ============================================================
// REPORTS APIs - Báo cáo & Thống kê chi tiết
// ============================================================

// GET /api/reports/revenue - Báo cáo doanh thu chi tiết
app.get('/api/reports/revenue', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const {
      startDate,
      endDate,
      centerId,
      courseId,
      groupBy = 'day' // 'day', 'week', 'month'
    } = req.query;

    console.log(`📊 Revenue report requested by ${req.user.email}`);

    // Default: 30 ngày gần nhất
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Query payments trong khoảng thời gian
    let paymentsQuery = supabase
      .from('payments')
      .select(`
        id,
        amount,
        payment_method,
        payment_date,
        invoices!inner (
          id,
          invoice_code,
          student_id,
          class_id,
          users!invoices_student_id_fkey (id, full_name),
          classes (
            id, code, name, center_id,
            courses (id, title, category)
          )
        )
      `)
      .gte('payment_date', start.toISOString())
      .lte('payment_date', end.toISOString())
      .order('payment_date', { ascending: false });

    const { data: payments, error } = await paymentsQuery;
    if (error) throw error;

    // Filter by center and course if provided
    let filteredPayments = payments || [];
    if (centerId) {
      filteredPayments = filteredPayments.filter(p =>
        p.invoices?.classes?.center_id === centerId
      );
    }
    if (courseId) {
      filteredPayments = filteredPayments.filter(p =>
        p.invoices?.classes?.courses?.id === courseId
      );
    }

    // Calculate totals
    const totalRevenue = filteredPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const totalTransactions = filteredPayments.length;

    // Group by date
    const groupedData = {};
    filteredPayments.forEach(p => {
      const date = new Date(p.payment_date);
      let key;

      if (groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = date.toISOString().split('T')[0];
      }

      if (!groupedData[key]) {
        groupedData[key] = { date: key, revenue: 0, count: 0 };
      }
      groupedData[key].revenue += parseFloat(p.amount) || 0;
      groupedData[key].count++;
    });

    const chartData = Object.values(groupedData).sort((a, b) =>
      new Date(a.date) - new Date(b.date)
    );

    // Revenue by payment method
    const byMethod = {};
    filteredPayments.forEach(p => {
      const method = p.payment_method || 'cash';
      if (!byMethod[method]) byMethod[method] = 0;
      byMethod[method] += parseFloat(p.amount) || 0;
    });

    // Revenue by course
    const byCourse = {};
    filteredPayments.forEach(p => {
      const courseName = p.invoices?.classes?.courses?.title || 'Khác';
      if (!byCourse[courseName]) byCourse[courseName] = 0;
      byCourse[courseName] += parseFloat(p.amount) || 0;
    });

    // Top transactions
    const topTransactions = filteredPayments.slice(0, 10).map(p => ({
      id: p.id,
      amount: p.amount,
      paymentDate: p.payment_date,
      method: p.payment_method,
      studentName: p.invoices?.users?.full_name || 'N/A',
      invoiceCode: p.invoices?.invoice_code,
      courseName: p.invoices?.classes?.courses?.title || 'N/A'
    }));

    // Compare with previous period
    const periodDays = Math.ceil((end - start) / (24 * 60 * 60 * 1000));
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const { data: prevPayments } = await supabase
      .from('payments')
      .select('amount')
      .gte('payment_date', prevStart.toISOString())
      .lte('payment_date', prevEnd.toISOString());

    const prevRevenue = prevPayments?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;
    const growthPercent = prevRevenue > 0
      ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100)
      : (totalRevenue > 0 ? 100 : 0);

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalTransactions,
          averageTransaction: totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0,
          growthPercent,
          prevRevenue
        },
        chartData,
        byPaymentMethod: Object.entries(byMethod).map(([name, value]) => ({ name, value })),
        byCourse: Object.entries(byCourse)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value),
        topTransactions,
        period: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
          days: periodDays
        }
      }
    });

  } catch (error) {
    console.error('Error generating revenue report:', error);
    next(error);
  }
});

// GET /api/reports/enrollment - Báo cáo tuyển sinh
app.get('/api/reports/enrollment', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { startDate, endDate, centerId, courseId } = req.query;

    console.log(`📊 Enrollment report requested by ${req.user.email}`);

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Query enrollments
    let query = supabase
      .from('enrollments')
      .select(`
        id,
        status,
        created_at,
        tuition_fee,
        paid_amount,
        users!enrollments_student_id_fkey (id, full_name, email),
        classes!inner (
          id, code, name, center_id,
          courses (id, title, category)
        )
      `)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: false });

    const { data: enrollments, error } = await query;
    if (error) throw error;

    // Filter
    let filtered = enrollments || [];
    if (centerId) {
      filtered = filtered.filter(e => e.classes?.center_id === centerId);
    }
    if (courseId) {
      filtered = filtered.filter(e => e.classes?.courses?.id === courseId);
    }

    // Stats
    const totalEnrollments = filtered.length;
    const activeEnrollments = filtered.filter(e => e.status === 'active').length;
    const droppedEnrollments = filtered.filter(e => e.status === 'dropped').length;

    // Group by date
    const byDate = {};
    filtered.forEach(e => {
      const date = new Date(e.created_at).toISOString().split('T')[0];
      if (!byDate[date]) byDate[date] = { date, count: 0 };
      byDate[date].count++;
    });

    // By course
    const byCourse = {};
    filtered.forEach(e => {
      const course = e.classes?.courses?.title || 'Khác';
      if (!byCourse[course]) byCourse[course] = 0;
      byCourse[course]++;
    });

    // By status
    const byStatus = {};
    filtered.forEach(e => {
      const status = e.status || 'active';
      if (!byStatus[status]) byStatus[status] = 0;
      byStatus[status]++;
    });

    // Compare with previous period
    const periodDays = Math.ceil((end - start) / (24 * 60 * 60 * 1000));
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const { count: prevCount } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', prevStart.toISOString())
      .lte('created_at', prevEnd.toISOString());

    const growthPercent = prevCount > 0
      ? Math.round(((totalEnrollments - prevCount) / prevCount) * 100)
      : (totalEnrollments > 0 ? 100 : 0);

    // Recent enrollments
    const recentEnrollments = filtered.slice(0, 10).map(e => ({
      id: e.id,
      studentName: e.users?.full_name || 'N/A',
      studentEmail: e.users?.email,
      courseName: e.classes?.courses?.title || 'N/A',
      className: e.classes?.name,
      status: e.status,
      createdAt: e.created_at
    }));

    res.json({
      success: true,
      data: {
        summary: {
          totalEnrollments,
          activeEnrollments,
          droppedEnrollments,
          dropRate: totalEnrollments > 0 ? Math.round((droppedEnrollments / totalEnrollments) * 100) : 0,
          growthPercent,
          prevCount: prevCount || 0
        },
        chartData: Object.values(byDate).sort((a, b) => new Date(a.date) - new Date(b.date)),
        byCourse: Object.entries(byCourse)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value),
        byStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
        recentEnrollments,
        period: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        }
      }
    });

  } catch (error) {
    console.error('Error generating enrollment report:', error);
    next(error);
  }
});

// GET /api/reports/attendance - Báo cáo chuyên cần
app.get('/api/reports/attendance', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER']), async (req, res, next) => {
  try {
    const { startDate, endDate, classId, courseId } = req.query;

    console.log(`📊 Attendance report requested by ${req.user.email}`);

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Query attendance records
    let query = supabase
      .from('attendance')
      .select(`
        id,
        status,
        session_date,
        enrollments!inner (
          id,
          student_id,
          users!enrollments_student_id_fkey (id, full_name),
          classes!inner (
            id, code, name,
            courses (id, title)
          )
        )
      `)
      .gte('session_date', start.toISOString().split('T')[0])
      .lte('session_date', end.toISOString().split('T')[0]);

    const { data: attendances, error } = await query;
    if (error) throw error;

    // Filter
    let filtered = attendances || [];
    if (classId) {
      filtered = filtered.filter(a => a.enrollments?.classes?.id === classId);
    }
    if (courseId) {
      filtered = filtered.filter(a => a.enrollments?.classes?.courses?.id === courseId);
    }

    // Stats
    const totalRecords = filtered.length;
    const presentCount = filtered.filter(a => a.status === 'present').length;
    const absentCount = filtered.filter(a => a.status === 'absent').length;
    const lateCount = filtered.filter(a => a.status === 'late').length;
    const excusedCount = filtered.filter(a => a.status === 'excused').length;

    const attendanceRate = totalRecords > 0
      ? Math.round(((presentCount + lateCount) / totalRecords) * 100)
      : 0;

    // By status
    const byStatus = [
      { name: 'Có mặt', value: presentCount, color: '#22c55e' },
      { name: 'Vắng', value: absentCount, color: '#ef4444' },
      { name: 'Trễ', value: lateCount, color: '#f59e0b' },
      { name: 'Có phép', value: excusedCount, color: '#3b82f6' }
    ];

    // By date
    const byDate = {};
    filtered.forEach(a => {
      const date = a.session_date;
      if (!byDate[date]) {
        byDate[date] = { date, present: 0, absent: 0, late: 0, excused: 0, total: 0 };
      }
      byDate[date].total++;
      if (a.status === 'present') byDate[date].present++;
      else if (a.status === 'absent') byDate[date].absent++;
      else if (a.status === 'late') byDate[date].late++;
      else if (a.status === 'excused') byDate[date].excused++;
    });

    // Students with low attendance
    const studentAttendance = {};
    filtered.forEach(a => {
      const studentId = a.enrollments?.student_id;
      const studentName = a.enrollments?.users?.full_name || 'N/A';
      if (!studentAttendance[studentId]) {
        studentAttendance[studentId] = {
          id: studentId,
          name: studentName,
          total: 0,
          present: 0
        };
      }
      studentAttendance[studentId].total++;
      if (a.status === 'present' || a.status === 'late') {
        studentAttendance[studentId].present++;
      }
    });

    const lowAttendanceStudents = Object.values(studentAttendance)
      .map(s => ({
        ...s,
        rate: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0
      }))
      .filter(s => s.rate < 70 && s.total >= 3)
      .sort((a, b) => a.rate - b.rate)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        summary: {
          totalRecords,
          presentCount,
          absentCount,
          lateCount,
          excusedCount,
          attendanceRate
        },
        byStatus,
        chartData: Object.values(byDate).sort((a, b) => new Date(a.date) - new Date(b.date)),
        lowAttendanceStudents,
        period: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        }
      }
    });

  } catch (error) {
    console.error('Error generating attendance report:', error);
    next(error);
  }
});

// GET /api/reports/grades - Báo cáo điểm số
app.get('/api/reports/grades', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER']), async (req, res, next) => {
  try {
    const { classId, courseId, centerId } = req.query;

    console.log(`📊 Grades report requested by ${req.user.email}`);

    // Query grades (đúng table name)
    let query = supabase
      .from('grades')
      .select(`
        id,
        score,
        enrollments!inner (
          id,
          student_id,
          users!enrollments_student_id_fkey (id, full_name),
          classes!inner (
            id, code, name, center_id,
            courses (id, title, pass_score)
          )
        ),
        grade_structures (id, name, weight, max_score)
      `);

    const { data: grades, error } = await query;
    if (error) throw error;

    // Filter
    let filtered = grades || [];
    if (classId) {
      filtered = filtered.filter(g => g.enrollments?.classes?.id === classId);
    }
    if (courseId) {
      filtered = filtered.filter(g => g.enrollments?.classes?.courses?.id === courseId);
    }
    if (centerId) {
      filtered = filtered.filter(g => g.enrollments?.classes?.center_id === centerId);
    }

    // Calculate averages per student
    const studentScores = {};
    filtered.forEach(g => {
      const enrollmentId = g.enrollments?.id;
      const studentId = g.enrollments?.student_id;
      const studentName = g.enrollments?.users?.full_name || 'N/A';
      const courseName = g.enrollments?.classes?.courses?.title || 'N/A';
      const passScore = parseFloat(g.enrollments?.classes?.courses?.pass_score) || 5.0;

      if (!studentScores[enrollmentId]) {
        studentScores[enrollmentId] = {
          enrollmentId,
          studentId,
          studentName,
          courseName,
          passScore,
          totalWeight: 0,
          weightedSum: 0,
          grades: []
        };
      }

      const weight = parseFloat(g.grade_structures?.weight) || 0;
      const maxScore = parseFloat(g.grade_structures?.max_score) || 10;
      const normalizedScore = (parseFloat(g.score) / maxScore) * 10; // Normalize to 10

      studentScores[enrollmentId].grades.push({
        name: g.grade_structures?.name,
        score: g.score,
        maxScore,
        weight
      });

      if (g.score !== null && weight > 0) {
        studentScores[enrollmentId].weightedSum += normalizedScore * weight;
        studentScores[enrollmentId].totalWeight += weight;
      }
    });

    // Calculate final scores
    const studentsWithScores = Object.values(studentScores).map(s => {
      const finalScore = s.totalWeight > 0
        ? (s.weightedSum / s.totalWeight).toFixed(2)
        : null;
      return {
        ...s,
        finalScore: finalScore ? parseFloat(finalScore) : null,
        passed: finalScore ? parseFloat(finalScore) >= s.passScore : null
      };
    });

    // Stats
    const studentsWithFinalScore = studentsWithScores.filter(s => s.finalScore !== null);
    const totalStudents = studentsWithFinalScore.length;
    const passedStudents = studentsWithFinalScore.filter(s => s.passed).length;
    const failedStudents = totalStudents - passedStudents;
    const passRate = totalStudents > 0 ? Math.round((passedStudents / totalStudents) * 100) : 0;

    const allScores = studentsWithFinalScore.map(s => s.finalScore);
    const avgScore = allScores.length > 0
      ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(2)
      : 0;
    const maxScore = allScores.length > 0 ? Math.max(...allScores) : 0;
    const minScore = allScores.length > 0 ? Math.min(...allScores) : 0;

    // Score distribution
    const distribution = [
      { range: '9-10', count: 0 },
      { range: '8-9', count: 0 },
      { range: '7-8', count: 0 },
      { range: '6-7', count: 0 },
      { range: '5-6', count: 0 },
      { range: '<5', count: 0 }
    ];

    allScores.forEach(score => {
      if (score >= 9) distribution[0].count++;
      else if (score >= 8) distribution[1].count++;
      else if (score >= 7) distribution[2].count++;
      else if (score >= 6) distribution[3].count++;
      else if (score >= 5) distribution[4].count++;
      else distribution[5].count++;
    });

    // Top students
    const topStudents = studentsWithFinalScore
      .sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0))
      .slice(0, 10)
      .map(s => ({
        studentName: s.studentName,
        courseName: s.courseName,
        finalScore: s.finalScore,
        passed: s.passed
      }));

    // Students needing attention (low scores)
    const lowScoreStudents = studentsWithFinalScore
      .filter(s => s.finalScore < s.passScore)
      .sort((a, b) => (a.finalScore || 0) - (b.finalScore || 0))
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        summary: {
          totalStudents,
          passedStudents,
          failedStudents,
          passRate,
          avgScore: parseFloat(avgScore),
          maxScore,
          minScore
        },
        distribution,
        topStudents,
        lowScoreStudents,
        passRateChart: [
          { name: 'Đạt', value: passedStudents, color: '#22c55e' },
          { name: 'Không đạt', value: failedStudents, color: '#ef4444' }
        ]
      }
    });

  } catch (error) {
    console.error('Error generating grades report:', error);
    next(error);
  }
});

// GET /api/reports/staff - Báo cáo nhân sự
app.get('/api/reports/staff', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { startDate, endDate, centerId } = req.query;

    console.log(`📊 Staff report requested by ${req.user.email}`);

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getFullYear(), end.getMonth(), 1);

    // Query staff
    let staffQuery = supabase
      .from('users')
      .select(`
        id,
        full_name,
        email,
        phone,
        center_id,
        created_at,
        roles!inner (code, name)
      `)
      .in('roles.code', ['TEACHER', 'CENTER_MANAGER']);

    if (centerId) {
      staffQuery = staffQuery.eq('center_id', centerId);
    }

    const { data: staff, error: staffError } = await staffQuery;
    if (staffError) throw staffError;

    // Get teaching hours
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select(`
        id,
        teacher_id,
        session_date,
        start_time,
        end_time,
        status
      `)
      .gte('session_date', start.toISOString().split('T')[0])
      .lte('session_date', end.toISOString().split('T')[0])
      .eq('status', 'completed');

    if (sessionsError) throw sessionsError;

    // Calculate hours per teacher
    const teacherHours = {};
    sessions?.forEach(s => {
      if (!teacherHours[s.teacher_id]) {
        teacherHours[s.teacher_id] = { sessions: 0, hours: 0 };
      }
      teacherHours[s.teacher_id].sessions++;

      // Calculate hours
      if (s.start_time && s.end_time) {
        const [startH, startM] = s.start_time.split(':').map(Number);
        const [endH, endM] = s.end_time.split(':').map(Number);
        const hours = (endH + endM / 60) - (startH + startM / 60);
        teacherHours[s.teacher_id].hours += hours;
      } else {
        teacherHours[s.teacher_id].hours += 2; // Default 2 hours
      }
    });

    // Get payroll data
    const { data: payroll } = await supabase
      .from('payroll')
      .select('staff_id, total_amount, period_start, period_end')
      .gte('period_start', start.toISOString().split('T')[0])
      .lte('period_end', end.toISOString().split('T')[0]);

    const staffPayroll = {};
    payroll?.forEach(p => {
      if (!staffPayroll[p.staff_id]) staffPayroll[p.staff_id] = 0;
      staffPayroll[p.staff_id] += parseFloat(p.total_amount) || 0;
    });

    // Combine data
    const staffReport = staff?.map(s => ({
      id: s.id,
      name: s.full_name,
      email: s.email,
      role: s.roles?.name,
      sessions: teacherHours[s.id]?.sessions || 0,
      hours: Math.round((teacherHours[s.id]?.hours || 0) * 10) / 10,
      totalPay: staffPayroll[s.id] || 0
    })) || [];

    // Summary
    const totalStaff = staffReport.length;
    const teachers = staffReport.filter(s => s.role === 'Teacher').length;
    const totalSessions = staffReport.reduce((sum, s) => sum + s.sessions, 0);
    const totalHours = staffReport.reduce((sum, s) => sum + s.hours, 0);
    const totalPayroll = staffReport.reduce((sum, s) => sum + s.totalPay, 0);

    // Top teachers by hours
    const topTeachers = [...staffReport]
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        summary: {
          totalStaff,
          teachers,
          totalSessions,
          totalHours: Math.round(totalHours * 10) / 10,
          totalPayroll,
          avgHoursPerTeacher: teachers > 0 ? Math.round((totalHours / teachers) * 10) / 10 : 0
        },
        staffList: staffReport,
        topTeachers,
        period: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        }
      }
    });

  } catch (error) {
    console.error('Error generating staff report:', error);
    next(error);
  }
});

// GET /api/reports/courses - Báo cáo hiệu suất khóa học
app.get('/api/reports/courses', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { centerId } = req.query;

    console.log(`📊 Courses report requested by ${req.user.email}`);

    // Get all courses with stats
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select(`
        id,
        code,
        title,
        category,
        price,
        total_sessions,
        status,
        classes (
          id,
          status,
          center_id,
          enrollments (id, status, tuition_fee, paid_amount)
        )
      `)
      .eq('status', 'active');

    if (coursesError) throw coursesError;

    // Calculate stats per course
    const courseStats = courses?.map(course => {
      let classes = course.classes || [];

      // Filter by center if needed
      if (centerId) {
        classes = classes.filter(c => c.center_id === centerId);
      }

      const totalClasses = classes.length;
      const ongoingClasses = classes.filter(c => c.status === 'ongoing').length;
      const completedClasses = classes.filter(c => c.status === 'completed').length;

      let totalEnrollments = 0;
      let activeEnrollments = 0;
      let totalRevenue = 0;

      classes.forEach(cls => {
        const enrollments = cls.enrollments || [];
        totalEnrollments += enrollments.length;
        activeEnrollments += enrollments.filter(e => e.status === 'active').length;
        totalRevenue += enrollments.reduce((sum, e) => sum + (parseFloat(e.paid_amount) || 0), 0);
      });

      return {
        id: course.id,
        code: course.code,
        title: course.title,
        category: course.category,
        price: course.price,
        totalClasses,
        ongoingClasses,
        completedClasses,
        totalEnrollments,
        activeEnrollments,
        totalRevenue,
        avgEnrollmentsPerClass: totalClasses > 0 ? Math.round(totalEnrollments / totalClasses) : 0
      };
    }) || [];

    // Summary
    const totalCourses = courseStats.length;
    const totalClassesAll = courseStats.reduce((sum, c) => sum + c.totalClasses, 0);
    const totalEnrollmentsAll = courseStats.reduce((sum, c) => sum + c.totalEnrollments, 0);
    const totalRevenueAll = courseStats.reduce((sum, c) => sum + c.totalRevenue, 0);

    // Top courses by revenue
    const topByRevenue = [...courseStats]
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    // Top courses by enrollments
    const topByEnrollments = [...courseStats]
      .sort((a, b) => b.totalEnrollments - a.totalEnrollments)
      .slice(0, 5);

    // By category
    const byCategory = {};
    courseStats.forEach(c => {
      if (!byCategory[c.category]) {
        byCategory[c.category] = { courses: 0, enrollments: 0, revenue: 0 };
      }
      byCategory[c.category].courses++;
      byCategory[c.category].enrollments += c.totalEnrollments;
      byCategory[c.category].revenue += c.totalRevenue;
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalCourses,
          totalClasses: totalClassesAll,
          totalEnrollments: totalEnrollmentsAll,
          totalRevenue: totalRevenueAll,
          avgRevenuePerCourse: totalCourses > 0 ? Math.round(totalRevenueAll / totalCourses) : 0
        },
        courseStats,
        topByRevenue,
        topByEnrollments,
        byCategory: Object.entries(byCategory).map(([name, data]) => ({
          name,
          ...data
        }))
      }
    });

  } catch (error) {
    console.error('Error generating courses report:', error);
    next(error);
  }
});

// POST /api/reports/saved - Lưu báo cáo
app.post('/api/reports/saved', requireAuth, async (req, res, next) => {
  try {
    const { name, description, reportType, filters, schedule, emailRecipients, isPublic } = req.body;

    const { data, error } = await supabase
      .from('saved_reports')
      .insert([{
        name,
        description,
        report_type: reportType,
        filters: filters || {},
        schedule: schedule || null,
        email_recipients: emailRecipients || [],
        is_public: isPublic || false,
        created_by: req.user.id,
        center_id: req.user.centerId
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Đã lưu báo cáo',
      data
    });

  } catch (error) {
    console.error('Error saving report:', error);
    next(error);
  }
});

// GET /api/reports/saved - Lấy danh sách báo cáo đã lưu
app.get('/api/reports/saved', requireAuth, async (req, res, next) => {
  try {
    // Build query với xử lý null centerId
    let query = supabase
      .from('saved_reports')
      .select('*');

    // Filter: own reports OR public reports in same center
    if (req.user.centerId) {
      query = query.or(`created_by.eq.${req.user.id},and(is_public.eq.true,center_id.eq.${req.user.centerId})`);
    } else {
      // Nếu không có center, chỉ lấy báo cáo của chính mình
      query = query.eq('created_by', req.user.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error fetching saved reports:', error);
    next(error);
  }
});

// DELETE /api/reports/saved/:id - Xóa báo cáo đã lưu
app.delete('/api/reports/saved/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('saved_reports')
      .delete()
      .eq('id', id)
      .eq('created_by', req.user.id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Đã xóa báo cáo'
    });

  } catch (error) {
    console.error('Error deleting saved report:', error);
    next(error);
  }
});

// ============================================================
// END REPORTS APIs
// ============================================================

// ============================================================
// DOCUMENTS APIs - Quản lý tài liệu
// ============================================================

// Lấy danh sách tài liệu
app.get('/api/admin/documents', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER']), async (req, res, next) => {
  try {
    const { centerId, courseId, classId, type, search, page = 1, limit = 20 } = req.query;

    // Permission check
    const { effectiveCenterId, error: permError } = getEffectiveCenterId(req.user, centerId);
    if (permError) {
      return res.status(403).json({ success: false, message: permError });
    }

    let query = supabase
      .from('documents')
      .select(`
        *,
        courses (id, code, title),
        classes (id, code, name),
        centers (id, name),
        uploaded_by_user:users!documents_uploaded_by_fkey (id, full_name, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Filters
    if (effectiveCenterId) {
      query = query.eq('center_id', effectiveCenterId);
    }
    if (courseId) {
      query = query.eq('course_id', courseId);
    }
    if (classId) {
      query = query.eq('class_id', classId);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      pagination: {
        total: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    next(error);
  }
});

// Tạo tài liệu mới
app.post('/api/admin/documents', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER']), async (req, res, next) => {
  try {
    const { title, description, file_url, file_name, file_size, file_type, course_id, class_id, type, is_public } = req.body;

    if (!title || !file_url || !file_name) {
      return res.status(400).json({
        success: false,
        message: 'Tiêu đề, URL file và tên file là bắt buộc'
      });
    }

    // Get center_id from user or from class/course if not available
    let centerIdToUse = req.user.centerId || req.user.center_id;

    // If user doesn't have center_id (SUPER_ADMIN), try to get from class or course
    if (!centerIdToUse) {
      if (class_id) {
        const { data: classData } = await supabase
          .from('classes')
          .select('center_id')
          .eq('id', class_id)
          .single();
        centerIdToUse = classData?.center_id;
      } else if (course_id) {
        const { data: courseData } = await supabase
          .from('courses')
          .select('center_id')
          .eq('id', course_id)
          .single();
        centerIdToUse = courseData?.center_id;
      }
    }

    if (!centerIdToUse) {
      return res.status(400).json({
        success: false,
        message: 'Không xác định được trung tâm cho tài liệu này'
      });
    }

    const { data, error } = await supabase
      .from('documents')
      .insert({
        title,
        description,
        file_url,
        file_name,
        file_size,
        file_type,
        course_id: course_id || null,
        class_id: class_id || null,
        center_id: centerIdToUse,
        type: type || 'material',
        is_public: is_public || false,
        uploaded_by: req.user.id
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
      message: 'Đã tải lên tài liệu thành công'
    });
  } catch (error) {
    console.error('Error creating document:', error);
    next(error);
  }
});

// Cập nhật tài liệu
app.put('/api/admin/documents/:id', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, course_id, class_id, type, is_public } = req.body;

    const { data, error } = await supabase
      .from('documents')
      .update({
        title,
        description,
        course_id: course_id || null,
        class_id: class_id || null,
        type,
        is_public,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data,
      message: 'Đã cập nhật tài liệu'
    });
  } catch (error) {
    console.error('Error updating document:', error);
    next(error);
  }
});

// Track document download
app.post('/api/admin/documents/:id/download', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    let centerId = req.user.center_id;

    // If user doesn't have center_id, get it from the document
    if (!centerId) {
      const { data: doc } = await supabase
        .from('documents')
        .select('center_id')
        .eq('id', id)
        .single();

      centerId = doc?.center_id;
    }

    console.log('Tracking download:', { document_id: id, user_id: userId, center_id: centerId });

    // Get client IP and user agent
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Insert download record
    const { data, error } = await supabase
      .from('document_downloads')
      .insert({
        document_id: id,
        user_id: userId,
        center_id: centerId,
        ip_address: ipAddress,
        user_agent: userAgent
      })
      .select()
      .single();

    if (error) {
      console.error('Download tracking error:', error);
      throw error;
    }

    console.log('Download tracked successfully:', data);

    res.json({
      success: true,
      message: 'Download tracked',
      data
    });
  } catch (error) {
    console.error('Error tracking download:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to track download',
      error: error.details || error.hint || error.message
    });
  }
});

// Get document analytics
app.get('/api/admin/documents/:id/analytics', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER']), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get document info
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*, centers(name)')
      .eq('id', id)
      .single();

    if (docError) throw docError;
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Permission check
    const { effectiveCenterId, error: permError } = getEffectiveCenterId(req.user, document.center_id);
    if (permError) {
      return res.status(403).json({ success: false, message: permError });
    }

    // Get download statistics using the helper function
    const { data: stats, error: statsError } = await supabase.rpc('get_document_download_stats', {
      doc_id: parseInt(id)
    });

    if (statsError) {
      console.error('Stats error:', statsError);
      // Fallback to basic stats
      const { data: downloads, error: dlError } = await supabase
        .from('document_downloads')
        .select('downloaded_at, users(full_name)', { count: 'exact' })
        .eq('document_id', id)
        .order('downloaded_at', { ascending: false })
        .limit(10);

      return res.json({
        success: true,
        data: {
          document,
          total_downloads: document.download_count || 0,
          recent_downloads: downloads || []
        }
      });
    }

    // Get recent downloads with user info
    const { data: recentDownloads, error: dlError } = await supabase
      .from('document_downloads')
      .select('downloaded_at, users(id, full_name, role)')
      .eq('document_id', id)
      .order('downloaded_at', { ascending: false })
      .limit(10);

    if (dlError) throw dlError;

    res.json({
      success: true,
      data: {
        document,
        stats: stats && stats.length > 0 ? stats[0] : {},
        recent_downloads: recentDownloads
      }
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    next(error);
  }
});

// Xóa tài liệu
app.delete('/api/admin/documents/:id', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Đã xóa tài liệu'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    next(error);
  }
});

// ============================================================
// CERTIFICATE TYPES APIs - Quản lý loại chứng chỉ
// ============================================================

// Lấy danh sách loại chứng chỉ với thống kê
app.get('/api/admin/certificate-types', requireAuth, async (req, res, next) => {
  try {
    const { category, is_external, is_internal, include_stats } = req.query;

    let query = supabase
      .from('certificate_types')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }
    if (is_external === 'true') {
      query = query.eq('is_external', true);
    }
    if (is_internal === 'true') {
      query = query.eq('is_internal', true);
    }

    const { data: types, error } = await query;
    if (error) throw error;

    // Nếu cần thống kê, fetch thêm
    let result = types;
    if (include_stats === 'true') {
      const typeIds = types.map(t => t.id);

      // Get certificate counts per type
      const { data: certCounts } = await supabase
        .from('certificates')
        .select('certificate_type_id')
        .in('certificate_type_id', typeIds);

      // Calculate stats
      const statsMap = {};
      (certCounts || []).forEach(c => {
        if (!statsMap[c.certificate_type_id]) {
          statsMap[c.certificate_type_id] = { total: 0 };
        }
        statsMap[c.certificate_type_id].total++;
      });

      result = types.map(type => ({
        ...type,
        stats: statsMap[type.id] || { total: 0 }
      }));
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching certificate types:', error);
    next(error);
  }
});

// Lấy chi tiết loại chứng chỉ với danh sách học viên đạt
app.get('/api/admin/certificate-types/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Fetch certificate type
    const { data: certType, error: typeError } = await supabase
      .from('certificate_types')
      .select('*')
      .eq('id', id)
      .single();

    if (typeError || !certType) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy loại chứng chỉ'
      });
    }

    // Fetch certificates of this type with student info
    const { data: certificates, error: certError, count } = await supabase
      .from('certificates')
      .select(`
        id,
        certificate_number,
        student_id,
        student_name,
        course_name,
        completion_date,
        exam_date,
        scores,
        grade,
        status,
        issued_at,
        file_url,
        external_id,
        students:users!certificates_student_id_fkey (
          id,
          full_name,
          email,
          phone,
          avatar_url
        ),
        courses (id, title),
        classes (id, name, code)
      `, { count: 'exact' })
      .eq('certificate_type_id', id)
      .order('issued_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (certError) throw certError;

    // Calculate statistics
    const { data: allCerts } = await supabase
      .from('certificates')
      .select('status, issued_at, scores')
      .eq('certificate_type_id', id);

    const stats = {
      total: allCerts?.length || 0,
      issued: allCerts?.filter(c => c.status === 'issued').length || 0,
      revoked: allCerts?.filter(c => c.status === 'revoked').length || 0,
      last_30_days: allCerts?.filter(c => {
        const issuedAt = new Date(c.issued_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return issuedAt >= thirtyDaysAgo;
      }).length || 0
    };

    // Calculate score statistics if applicable
    if (certType.score_config?.type === 'band' || certType.score_config?.type === 'numeric') {
      const scores = allCerts
        ?.map(c => c.scores?.overall || c.scores?.total || c.scores?.score)
        .filter(s => s != null);

      if (scores && scores.length > 0) {
        stats.avg_score = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
        stats.max_score = Math.max(...scores);
        stats.min_score = Math.min(...scores);
      }
    }

    res.json({
      success: true,
      data: {
        type: certType,
        certificates,
        stats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          totalPages: Math.ceil((count || 0) / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching certificate type detail:', error);
    next(error);
  }
});

// Tạo loại chứng chỉ mới
app.post('/api/admin/certificate-types', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const {
      code,
      name,
      description,
      provider,
      category = 'other',
      is_external = false,
      is_internal = true,
      score_config = {},
      requirements = {},
      template_preview_url,
      validity_months,
      display_order = 0
    } = req.body;

    if (!code || !name) {
      return res.status(400).json({
        success: false,
        message: 'Mã và tên loại chứng chỉ là bắt buộc'
      });
    }

    const { data, error } = await supabase
      .from('certificate_types')
      .insert({
        code: code.toUpperCase(),
        name,
        description,
        provider,
        category,
        is_external,
        is_internal,
        score_config,
        requirements,
        template_preview_url,
        validity_months,
        display_order,
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({
          success: false,
          message: 'Mã loại chứng chỉ đã tồn tại'
        });
      }
      throw error;
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Đã tạo loại chứng chỉ mới'
    });
  } catch (error) {
    console.error('Error creating certificate type:', error);
    next(error);
  }
});

// Cập nhật loại chứng chỉ
app.put('/api/admin/certificate-types/:id', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updated_at: new Date().toISOString() };
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.created_by;

    const { data, error } = await supabase
      .from('certificate_types')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data,
      message: 'Đã cập nhật loại chứng chỉ'
    });
  } catch (error) {
    console.error('Error updating certificate type:', error);
    next(error);
  }
});

// Xóa (soft delete) loại chứng chỉ
app.delete('/api/admin/certificate-types/:id', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if any certificates use this type
    const { count } = await supabase
      .from('certificates')
      .select('*', { count: 'exact', head: true })
      .eq('certificate_type_id', id);

    if (count > 0) {
      // Soft delete - just deactivate
      const { error } = await supabase
        .from('certificate_types')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      return res.json({
        success: true,
        message: `Đã vô hiệu hóa loại chứng chỉ (có ${count} chứng chỉ đã cấp)`
      });
    }

    // Hard delete if no certificates
    const { error } = await supabase
      .from('certificate_types')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Đã xóa loại chứng chỉ'
    });
  } catch (error) {
    console.error('Error deleting certificate type:', error);
    next(error);
  }
});

// ============================================================
// CERTIFICATES APIs - Quản lý chứng chỉ
// ============================================================

// Lấy danh sách chứng chỉ
app.get('/api/admin/certificates', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { centerId, studentId, courseId, status, search, certificate_type_id, page = 1, limit = 20 } = req.query;

    const { effectiveCenterId, error: permError } = getEffectiveCenterId(req.user, centerId);
    if (permError) {
      return res.status(403).json({ success: false, message: permError });
    }

    let query = supabase
      .from('certificates')
      .select(`
        *,
        student:users!certificates_student_id_fkey (id, full_name, email, phone, avatar_url),
        course:courses (id, code, title),
        class:classes (id, code, name),
        template:certificate_templates (id, name),
        certificate_type:certificate_types (id, code, name, category, provider, is_external, score_config),
        center:centers (id, name),
        issuer:users!certificates_issued_by_fkey (id, full_name)
      `, { count: 'exact' })
      .order('issued_at', { ascending: false });

    if (effectiveCenterId) {
      query = query.eq('center_id', effectiveCenterId);
    }
    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    if (courseId) {
      query = query.eq('course_id', courseId);
    }
    if (certificate_type_id) {
      query = query.eq('certificate_type_id', certificate_type_id);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(`certificate_number.ilike.%${search}%,student_name.ilike.%${search}%,course_name.ilike.%${search}%`);
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      pagination: {
        total: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    next(error);
  }
});

// Lấy danh sách mẫu chứng chỉ
app.get('/api/admin/certificate-templates', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('certificate_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error fetching certificate templates:', error);
    next(error);
  }
});

// Tạo chứng chỉ mới (Issue certificate)
app.post('/api/admin/certificates', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const {
      student_id,
      course_id,
      class_id,
      enrollment_id,
      completion_date,
      grade,
      template_id,
      certificate_type_id,
      scores,
      external_id,
      external_verify_url,
      exam_date,
      file_url,
      expires_at
    } = req.body;

    if (!student_id || !completion_date) {
      return res.status(400).json({
        success: false,
        message: 'Học viên và ngày hoàn thành là bắt buộc'
      });
    }

    // Lấy thông tin student
    const { data: student } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('id', student_id)
      .single();

    if (!student) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy học viên'
      });
    }

    // Lấy thông tin course nếu có
    let courseName = null;
    if (course_id) {
      const { data: course } = await supabase
        .from('courses')
        .select('id, title')
        .eq('id', course_id)
        .single();
      courseName = course?.title;
    }

    // Lấy thông tin certificate type nếu có
    let certTypeCode = null;
    if (certificate_type_id) {
      const { data: certType } = await supabase
        .from('certificate_types')
        .select('code, name')
        .eq('id', certificate_type_id)
        .single();
      certTypeCode = certType?.code;
      if (!courseName) {
        courseName = certType?.name;
      }
    }

    // Generate certificate number
    const { data: certNumber } = await supabase.rpc('generate_certificate_number', { type_code: certTypeCode });

    const { data, error } = await supabase
      .from('certificates')
      .insert({
        certificate_number: certNumber || `CC-${Date.now()}`,
        student_id,
        student_name: student.full_name,
        course_id: course_id || null,
        class_id: class_id || null,
        enrollment_id: enrollment_id || null,
        course_name: courseName || 'Certificate',
        completion_date,
        grade: grade || null,
        template_id: template_id || null,
        certificate_type_id: certificate_type_id || null,
        scores: scores || {},
        external_id: external_id || null,
        external_verify_url: external_verify_url || null,
        exam_date: exam_date || null,
        file_url: file_url || null,
        expires_at: expires_at || null,
        center_id: req.user.centerId,
        status: 'issued',
        issued_by: req.user.id,
        issued_at: new Date().toISOString()
      })
      .select(`
        *,
        student:users!certificates_student_id_fkey (id, full_name, email, avatar_url),
        course:courses (id, title),
        certificate_type:certificate_types (id, code, name, category, provider)
      `)
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
      message: 'Đã cấp chứng chỉ thành công'
    });
  } catch (error) {
    console.error('Error issuing certificate:', error);
    next(error);
  }
});

// Lấy danh sách học viên đủ điều kiện cấp chứng chỉ
app.get('/api/admin/certificates/eligible-students', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { centerId, classId } = req.query;
    const { effectiveCenterId, error: permError } = getEffectiveCenterId(req.user, centerId);
    if (permError) {
      return res.status(403).json({ success: false, message: permError });
    }

    // Lấy các enrollment đã hoàn thành và chưa có chứng chỉ
    let query = supabase
      .from('enrollments')
      .select(`
        id,
        student_id,
        status,
        student:users!enrollments_student_id_fkey (id, full_name, email),
        class:classes (
          id, code, name, status, end_date,
          course:courses (id, code, title),
          center:centers (id, name)
        )
      `)
      .eq('status', 'completed');

    if (classId) {
      query = query.eq('class_id', classId);
    }

    const { data: completedEnrollments, error: enrollError } = await query;

    if (enrollError) throw enrollError;

    // Lấy danh sách student_id đã có chứng chỉ
    const { data: existingCerts } = await supabase
      .from('certificates')
      .select('student_id, course_id, class_id')
      .in('status', ['issued']);

    const existingCertKeys = new Set(
      (existingCerts || []).map(c => `${c.student_id}_${c.class_id}`)
    );

    // Lọc ra những học viên chưa có chứng chỉ và thuộc center
    let eligibleStudents = (completedEnrollments || []).filter(e => {
      const key = `${e.student_id}_${e.class?.id}`;
      const matchCenter = !effectiveCenterId || e.class?.center?.id === effectiveCenterId;
      return !existingCertKeys.has(key) && matchCenter;
    });

    res.json({
      success: true,
      data: eligibleStudents
    });
  } catch (error) {
    console.error('Error fetching eligible students:', error);
    next(error);
  }
});

// Cấp chứng chỉ hàng loạt cho một lớp
app.post('/api/admin/certificates/bulk', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { class_id, student_ids, grade, completion_date } = req.body;

    if (!class_id || !student_ids || !student_ids.length) {
      return res.status(400).json({
        success: false,
        message: 'Lớp học và danh sách học viên là bắt buộc'
      });
    }

    // Lấy thông tin lớp và khóa học
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, name, end_date, course:courses(id, title), center:centers(id)')
      .eq('id', class_id)
      .single();

    if (classError || !classData) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy lớp học'
      });
    }

    // Lấy thông tin học viên
    const { data: students } = await supabase
      .from('users')
      .select('id, full_name')
      .in('id', student_ids);

    const results = { success: [], failed: [] };

    for (const studentId of student_ids) {
      try {
        const student = students?.find(s => s.id === studentId);
        if (!student) {
          results.failed.push({ student_id: studentId, reason: 'Không tìm thấy học viên' });
          continue;
        }

        // Generate certificate number
        const { data: certNumber } = await supabase.rpc('generate_certificate_number');

        const { data, error } = await supabase
          .from('certificates')
          .insert({
            certificate_number: certNumber || `CC-${Date.now()}-${studentId.slice(0, 4)}`,
            student_id: studentId,
            student_name: student.full_name,
            course_id: classData.course.id,
            class_id: class_id,
            course_name: classData.course.title,
            completion_date: completion_date || classData.end_date || new Date().toISOString().split('T')[0],
            grade: grade || 'pass',
            center_id: classData.center?.id || req.user.centerId,
            status: 'issued',
            issued_by: req.user.id,
            issued_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          results.failed.push({ student_id: studentId, reason: error.message });
        } else {
          results.success.push(data);
        }
      } catch (err) {
        results.failed.push({ student_id: studentId, reason: err.message });
      }
    }

    res.status(201).json({
      success: true,
      message: `Đã cấp ${results.success.length}/${student_ids.length} chứng chỉ`,
      data: results
    });
  } catch (error) {
    console.error('Error bulk issuing certificates:', error);
    next(error);
  }
});

// Thu hồi chứng chỉ
app.put('/api/admin/certificates/:id/revoke', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { data, error } = await supabase
      .from('certificates')
      .update({
        status: 'revoked',
        revoked_at: new Date().toISOString(),
        revoked_reason: reason || 'Không có lý do',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data,
      message: 'Đã thu hồi chứng chỉ'
    });
  } catch (error) {
    console.error('Error revoking certificate:', error);
    next(error);
  }
});

// Lấy chi tiết một chứng chỉ
app.get('/api/admin/certificates/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('certificates')
      .select(`
        *,
        student:users!certificates_student_id_fkey (
          id, full_name, email, phone, avatar_url,
          centers (id, name)
        ),
        course:courses (id, code, title, category),
        class:classes (id, code, name, start_date, end_date),
        template:certificate_templates (id, name, template_html, background_image),
        certificate_type:certificate_types (
          id, code, name, category, provider, provider_logo, 
          is_external, is_internal, score_config, template_preview_url
        ),
        center:centers (id, name, address),
        issuer:users!certificates_issued_by_fkey (id, full_name),
        verifier:users!certificates_verified_by_fkey (id, full_name)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chứng chỉ'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching certificate detail:', error);
    next(error);
  }
});

// Cập nhật chứng chỉ
app.put('/api/admin/certificates/:id', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      scores,
      grade,
      external_id,
      external_verify_url,
      exam_date,
      file_url,
      expires_at,
      completion_date
    } = req.body;

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (scores !== undefined) updateData.scores = scores;
    if (grade !== undefined) updateData.grade = grade;
    if (external_id !== undefined) updateData.external_id = external_id;
    if (external_verify_url !== undefined) updateData.external_verify_url = external_verify_url;
    if (exam_date !== undefined) updateData.exam_date = exam_date;
    if (file_url !== undefined) updateData.file_url = file_url;
    if (expires_at !== undefined) updateData.expires_at = expires_at;
    if (completion_date !== undefined) updateData.completion_date = completion_date;

    const { data, error } = await supabase
      .from('certificates')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        student:users!certificates_student_id_fkey (id, full_name, email, avatar_url),
        certificate_type:certificate_types (id, code, name)
      `)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data,
      message: 'Đã cập nhật chứng chỉ'
    });
  } catch (error) {
    console.error('Error updating certificate:', error);
    next(error);
  }
});

// ============================================================
// SUPPORT TICKETS APIs - Hệ thống hỗ trợ
// ============================================================

// Lấy danh sách tickets
app.get('/api/admin/support-tickets', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER']), async (req, res, next) => {
  try {
    const { centerId, status, priority, category, assignedTo, search, page = 1, limit = 20 } = req.query;

    const { effectiveCenterId, error: permError } = getEffectiveCenterId(req.user, centerId);
    if (permError) {
      return res.status(403).json({ success: false, message: permError });
    }

    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        creator:users!support_tickets_created_by_fkey (id, full_name, email, phone),
        assignee:users!support_tickets_assigned_to_fkey (id, full_name, email),
        resolver:users!support_tickets_resolved_by_fkey (id, full_name),
        center:centers (id, name),
        class:classes (id, code, name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (effectiveCenterId) {
      query = query.eq('center_id', effectiveCenterId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }
    if (search) {
      query = query.or(`ticket_number.ilike.%${search}%,subject.ilike.%${search}%`);
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      pagination: {
        total: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    next(error);
  }
});

// Lấy chi tiết ticket kèm messages
app.get('/api/admin/support-tickets/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const [ticketResult, messagesResult] = await Promise.all([
      supabase
        .from('support_tickets')
        .select(`
          *,
          creator:users!support_tickets_created_by_fkey (id, full_name, email, phone, avatar_url),
          assignee:users!support_tickets_assigned_to_fkey (id, full_name, email, avatar_url),
          resolver:users!support_tickets_resolved_by_fkey (id, full_name),
          center:centers (id, name),
          class:classes (id, code, name, courses (title))
        `)
        .eq('id', id)
        .single(),
      supabase
        .from('ticket_messages')
        .select(`
          *,
          sender:users!ticket_messages_sender_id_fkey (id, full_name, avatar_url, roles (code))
        `)
        .eq('ticket_id', id)
        .order('created_at', { ascending: true })
    ]);

    if (ticketResult.error || !ticketResult.data) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ticket'
      });
    }

    res.json({
      success: true,
      data: {
        ...ticketResult.data,
        messages: messagesResult.data || []
      }
    });
  } catch (error) {
    console.error('Error fetching ticket detail:', error);
    next(error);
  }
});

// Tạo ticket mới (từ admin hoặc student)
app.post('/api/support-tickets', requireAuth, async (req, res, next) => {
  try {
    const { subject, message, category, priority, class_id } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Tiêu đề và nội dung là bắt buộc'
      });
    }

    // Generate ticket number
    const { data: ticketNumber } = await supabase.rpc('generate_ticket_number');

    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        ticket_number: ticketNumber || `TK-${Date.now()}`,
        subject,
        category: category || 'general',
        priority: priority || 'normal',
        status: 'open',
        created_by: req.user.id,
        center_id: req.user.centerId,
        class_id: class_id || null
      })
      .select()
      .single();

    if (ticketError) throw ticketError;

    // Thêm message đầu tiên
    await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticket.id,
        message,
        sender_id: req.user.id,
        is_internal: false
      });

    res.status(201).json({
      success: true,
      data: ticket,
      message: 'Đã tạo yêu cầu hỗ trợ'
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    next(error);
  }
});

// Cập nhật ticket (gán người xử lý, đổi trạng thái, priority)
app.put('/api/admin/support-tickets/:id', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, priority, assigned_to, resolution_notes } = req.body;

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to || null;

    // Nếu đánh dấu resolved
    if (status === 'resolved' || status === 'closed') {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = req.user.id;
      if (resolution_notes) updateData.resolution_notes = resolution_notes;
    }

    const { data, error } = await supabase
      .from('support_tickets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data,
      message: 'Đã cập nhật ticket'
    });
  } catch (error) {
    console.error('Error updating support ticket:', error);
    next(error);
  }
});

// Gửi reply vào ticket
app.post('/api/support-tickets/:id/messages', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message, is_internal, attachment_url, attachment_name } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung tin nhắn là bắt buộc'
      });
    }

    // Kiểm tra ticket tồn tại
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('id, status')
      .eq('id', id)
      .single();

    if (ticketError || !ticket) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ticket'
      });
    }

    const { data, error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: id,
        message,
        sender_id: req.user.id,
        is_internal: is_internal || false,
        attachment_url: attachment_url || null,
        attachment_name: attachment_name || null
      })
      .select(`
        *,
        sender:users!ticket_messages_sender_id_fkey (id, full_name, avatar_url, roles (code))
      `)
      .single();

    if (error) throw error;

    // Cập nhật status thành in_progress nếu đang open
    if (ticket.status === 'open') {
      await supabase
        .from('support_tickets')
        .update({ status: 'in_progress', updated_at: new Date().toISOString() })
        .eq('id', id);
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Đã gửi tin nhắn'
    });
  } catch (error) {
    console.error('Error sending ticket message:', error);
    next(error);
  }
});

// ============================================================
// ENROLLMENTS APIs - Quản lý ghi danh
// ============================================================

// Lấy danh sách ghi danh
app.get('/api/admin/enrollments', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { centerId, classId, studentId, status, search, page = 1, limit = 20 } = req.query;

    const { effectiveCenterId, error: permError } = getEffectiveCenterId(req.user, centerId);
    if (permError) {
      return res.status(403).json({ success: false, message: permError });
    }

    let query = supabase
      .from('enrollments')
      .select(`
        *,
        student:users!enrollments_student_id_fkey (id, full_name, email, phone),
        class:classes (
          id, code, name, status,
          courses (id, code, title, price),
          centers (id, name)
        )
      `, { count: 'exact' })
      .order('enrolled_at', { ascending: false });

    // Filter by center through class
    if (effectiveCenterId) {
      query = query.eq('classes.center_id', effectiveCenterId);
    }
    if (classId) {
      query = query.eq('class_id', classId);
    }
    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Filter out nulls if center filter applied
    let filteredData = data || [];
    if (effectiveCenterId) {
      filteredData = filteredData.filter(e => e.class?.centers?.id === effectiveCenterId);
    }

    res.json({
      success: true,
      data: filteredData,
      pagination: {
        total: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    next(error);
  }
});

// Tạo enrollment mới (ghi danh học viên vào lớp)
app.post('/api/admin/enrollments', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { student_id, class_id, tuition_fee, discount_amount, paid_amount, notes } = req.body;

    if (!student_id || !class_id) {
      return res.status(400).json({
        success: false,
        message: 'Học viên và lớp học là bắt buộc'
      });
    }

    // Check duplicate
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', student_id)
      .eq('class_id', class_id)
      .single();

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Học viên đã được ghi danh vào lớp này'
      });
    }

    // Check class capacity
    const { data: classData } = await supabase
      .from('classes')
      .select('id, max_students')
      .eq('id', class_id)
      .single();

    if (classData) {
      const { count: currentCount } = await supabase
        .from('enrollments')
        .select('id', { count: 'exact' })
        .eq('class_id', class_id)
        .neq('status', 'dropped');

      if (currentCount >= classData.max_students) {
        return res.status(400).json({
          success: false,
          message: 'Lớp học đã đầy'
        });
      }
    }

    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        student_id,
        class_id,
        tuition_fee: tuition_fee || 0,
        discount_amount: discount_amount || 0,
        paid_amount: paid_amount || 0,
        notes,
        status: 'active',
        enrolled_at: new Date().toISOString()
      })
      .select(`
        *,
        student:users!enrollments_student_id_fkey (id, full_name, email),
        class:classes (id, code, name)
      `)
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
      message: 'Đã ghi danh học viên thành công'
    });
  } catch (error) {
    console.error('Error creating enrollment:', error);
    next(error);
  }
});

// ========================================
// 🔥 BATCH ENROLLMENT - Ghi danh nhiều học viên cùng lúc
// ========================================
app.post('/api/admin/enrollments/batch', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { student_ids, class_id, tuition_fee } = req.body;

    // Validation
    if (!class_id || !student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Học viên và lớp học là bắt buộc'
      });
    }

    // Check class capacity
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, max_students, code, name')
      .eq('id', class_id)
      .single();

    if (classError || !classData) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học'
      });
    }

    const { count: currentCount } = await supabase
      .from('enrollments')
      .select('id', { count: 'exact' })
      .eq('class_id', class_id)
      .neq('status', 'dropped');

    const availableSlots = classData.max_students - currentCount;
    if (student_ids.length > availableSlots) {
      return res.status(400).json({
        success: false,
        message: `Lớp học chỉ còn ${availableSlots} chỗ trống`
      });
    }

    // Check for existing enrollments (check tất cả status để tránh duplicate key constraint)
    const { data: existingEnrollments } = await supabase
      .from('enrollments')
      .select('student_id, status')
      .eq('class_id', class_id)
      .in('student_id', student_ids);

    const existingIds = new Set(existingEnrollments?.map(e => e.student_id) || []);
    const newStudentIds = student_ids.filter(id => !existingIds.has(id));

    console.log('[BatchEnroll] Existing enrollments:', existingEnrollments);
    console.log('[BatchEnroll] New student IDs to enroll:', newStudentIds);

    if (newStudentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tất cả học viên đã được ghi danh vào lớp này (bao gồm cả học viên đã rời lớp)'
      });
    }

    // Batch insert
    const enrollments = newStudentIds.map(student_id => ({
      student_id,
      class_id,
      tuition_fee: tuition_fee || 0,
      discount_amount: 0,
      paid_amount: 0,
      status: 'active',
      enrolled_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('enrollments')
      .insert(enrollments)
      .select();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: {
        enrolled: data.length,
        skipped: student_ids.length - newStudentIds.length,
        total: student_ids.length
      },
      message: `Đã ghi danh ${data.length} học viên thành công`
    });
  } catch (error) {
    console.error('Error batch enrollment:', error);
    next(error);
  }
});

// Cập nhật enrollment
app.put('/api/admin/enrollments/:id', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, tuition_fee, discount_amount, paid_amount, notes } = req.body;

    const { data, error } = await supabase
      .from('enrollments')
      .update({
        status,
        tuition_fee,
        discount_amount,
        paid_amount,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data,
      message: 'Đã cập nhật ghi danh'
    });
  } catch (error) {
    console.error('Error updating enrollment:', error);
    next(error);
  }
});

// Hủy enrollment (soft delete - set status = dropped)
app.delete('/api/admin/enrollments/:id', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('enrollments')
      .update({
        status: 'dropped',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data,
      message: 'Đã hủy ghi danh'
    });
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    next(error);
  }
});

// ============================================================
// NOTIFICATION APIs
// ============================================================

/**
 * POST /api/admin/notifications/send
 * Send notifications to students (email/SMS)
 * Note: This is a placeholder - actual email/SMS integration requires third-party services
 */
app.post('/api/admin/notifications/send', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER']), async (req, res, next) => {
  try {
    const { type, recipients, subject, content, classId } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Danh sách người nhận không hợp lệ'
      });
    }

    if (!content?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung thông báo không được để trống'
      });
    }

    console.log(`📧 Admin ${req.user.email} gửi thông báo ${type} đến ${recipients.length} người`);

    // Fetch recipient details
    const { data: recipientProfiles, error: recipientError } = await supabase
      .from('profiles')
      .select('id, email, phone, full_name')
      .in('id', recipients);

    if (recipientError) throw recipientError;

    // Log notification to database (for tracking)
    const notificationLogs = recipientProfiles.map(profile => ({
      recipient_id: profile.id,
      recipient_email: profile.email,
      recipient_phone: profile.phone,
      notification_type: type,
      subject: subject || null,
      content,
      class_id: classId || null,
      sent_by: req.user.id,
      status: 'sent', // In production, this would be 'pending' until actually sent
      created_at: new Date().toISOString()
    }));

    // Note: In production, you would:
    // 1. Queue emails using a service like SendGrid, AWS SES, etc.
    // 2. Queue SMS using Twilio, Vonage, etc.
    // 3. Update status after actual delivery

    // For now, we'll just simulate success
    // In production, insert notification logs to a notifications table

    console.log(`✅ Đã "gửi" ${notificationLogs.length} thông báo (giả lập)`);

    res.json({
      success: true,
      message: `Đã gửi thông báo đến ${recipientProfiles.length} người`,
      sent: recipientProfiles.length,
      failed: 0,
      recipients: recipientProfiles.map(p => ({
        id: p.id,
        name: p.full_name,
        email: type !== 'sms' ? p.email : undefined,
        phone: type !== 'email' ? p.phone : undefined
      }))
    });

  } catch (error) {
    console.error('Error sending notifications:', error);
    next(error);
  }
});

/**
 * Generate class report
 * Report types: summary, attendance, grades, financial
 */
app.get('/api/admin/classes/:classId/report', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER']), async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { reportType = 'summary', startDate, endDate } = req.query;

    console.log(`📊 Generating ${reportType} report for class ${classId}`);

    // Fetch class details
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select(`
        *,
        course:courses(id, name, description, duration_months, price),
        teacher:profiles!classes_teacher_id_fkey(id, full_name, email),
        center:centers(id, name)
      `)
      .eq('id', classId)
      .single();

    if (classError || !classData) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học'
      });
    }

    // Fetch enrollments with student info
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select(`
        id, enrolled_at, status, paid_amount,
        student:profiles(id, full_name, email, phone)
      `)
      .eq('class_id', classId);

    if (enrollError) throw enrollError;

    // Fetch sessions in date range
    let sessionsQuery = supabase
      .from('sessions')
      .select('*')
      .eq('class_id', classId)
      .order('session_date', { ascending: true });

    if (startDate) {
      sessionsQuery = sessionsQuery.gte('session_date', startDate);
    }
    if (endDate) {
      sessionsQuery = sessionsQuery.lte('session_date', endDate);
    }

    const { data: sessions, error: sessionError } = await sessionsQuery;
    if (sessionError) throw sessionError;

    // Fetch attendance records
    const sessionIds = sessions?.map(s => s.id) || [];
    let attendance = [];
    if (sessionIds.length > 0) {
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .in('session_id', sessionIds);

      if (attendanceError) throw attendanceError;
      attendance = attendanceData || [];
    }

    // Fetch grades if report type includes grades
    let grades = [];
    if (reportType === 'grades' || reportType === 'summary') {
      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select(`
          *,
          grade_column:grade_columns(id, name, weight, type)
        `)
        .eq('class_id', classId);

      if (!gradesError && gradesData) {
        grades = gradesData;
      }
    }

    // Build report based on type
    let reportData = {
      classInfo: {
        id: classData.id,
        name: classData.name,
        className: classData.class_name,
        course: classData.course?.name,
        teacher: classData.teacher?.full_name,
        center: classData.center?.name,
        startDate: classData.start_date,
        endDate: classData.end_date,
        status: classData.status
      },
      generatedAt: new Date().toISOString(),
      reportType,
      dateRange: { startDate, endDate }
    };

    // Summary stats
    const totalStudents = enrollments?.length || 0;
    const activeStudents = enrollments?.filter(e => e.status === 'active')?.length || 0;
    const totalSessions = sessions?.length || 0;
    const completedSessions = sessions?.filter(s => s.status === 'completed')?.length || 0;

    // Attendance summary
    const totalAttendanceRecords = attendance?.length || 0;
    const presentCount = attendance?.filter(a => a.status === 'present')?.length || 0;
    const absentCount = attendance?.filter(a => a.status === 'absent')?.length || 0;
    const attendanceRate = totalAttendanceRecords > 0
      ? Math.round((presentCount / totalAttendanceRecords) * 100)
      : 0;

    // Financial summary
    const totalRevenue = enrollments?.reduce((sum, e) => sum + (e.paid_amount || 0), 0) || 0;
    const expectedRevenue = totalStudents * (classData.course?.price || 0);

    switch (reportType) {
      case 'attendance':
        reportData = {
          ...reportData,
          summary: {
            totalStudents,
            totalSessions,
            completedSessions,
            attendanceRate
          },
          attendanceDetails: sessions?.map(session => {
            const sessionAttendance = attendance?.filter(a => a.session_id === session.id) || [];
            return {
              sessionId: session.id,
              date: session.session_date,
              startTime: session.start_time,
              endTime: session.end_time,
              status: session.status,
              attendanceRecords: sessionAttendance.map(a => ({
                studentId: a.student_id,
                status: a.status,
                notes: a.notes
              })),
              presentCount: sessionAttendance.filter(a => a.status === 'present').length,
              absentCount: sessionAttendance.filter(a => a.status === 'absent').length
            };
          }) || [],
          students: enrollments?.map(e => ({
            id: e.student?.id,
            name: e.student?.full_name,
            email: e.student?.email,
            enrolledAt: e.enrolled_at
          })) || []
        };
        break;

      case 'grades':
        // Calculate student averages
        const studentGrades = {};
        enrollments?.forEach(e => {
          const studentId = e.student?.id;
          if (studentId) {
            const studentGradeRecords = grades?.filter(g => g.student_id === studentId) || [];
            const totalWeight = studentGradeRecords.reduce((sum, g) => sum + (g.grade_column?.weight || 0), 0);
            const weightedSum = studentGradeRecords.reduce((sum, g) => {
              const weight = g.grade_column?.weight || 0;
              return sum + (g.score || 0) * weight;
            }, 0);
            const average = totalWeight > 0 ? weightedSum / totalWeight : 0;

            studentGrades[studentId] = {
              student: {
                id: studentId,
                name: e.student?.full_name,
                email: e.student?.email
              },
              grades: studentGradeRecords.map(g => ({
                columnName: g.grade_column?.name,
                type: g.grade_column?.type,
                weight: g.grade_column?.weight,
                score: g.score
              })),
              average: Math.round(average * 100) / 100
            };
          }
        });

        reportData = {
          ...reportData,
          summary: {
            totalStudents,
            totalGradeColumns: [...new Set(grades?.map(g => g.grade_column_id))].length,
            classAverage: Object.values(studentGrades).length > 0
              ? Math.round(
                Object.values(studentGrades).reduce((sum, s) => sum + s.average, 0)
                / Object.values(studentGrades).length * 100
              ) / 100
              : 0
          },
          studentGrades: Object.values(studentGrades)
        };
        break;

      case 'financial':
        reportData = {
          ...reportData,
          summary: {
            totalStudents,
            totalRevenue,
            expectedRevenue,
            collectionRate: expectedRevenue > 0
              ? Math.round((totalRevenue / expectedRevenue) * 100)
              : 0
          },
          enrollmentDetails: enrollments?.map(e => ({
            student: {
              id: e.student?.id,
              name: e.student?.full_name,
              email: e.student?.email,
              phone: e.student?.phone
            },
            enrolledAt: e.enrolled_at,
            status: e.status,
            paidAmount: e.paid_amount || 0,
            expectedAmount: classData.course?.price || 0,
            paymentStatus: (e.paid_amount || 0) >= (classData.course?.price || 0)
              ? 'paid'
              : e.paid_amount > 0
                ? 'partial'
                : 'unpaid'
          })) || []
        };
        break;

      case 'summary':
      default:
        reportData = {
          ...reportData,
          summary: {
            totalStudents,
            activeStudents,
            totalSessions,
            completedSessions,
            remainingSessions: totalSessions - completedSessions,
            attendanceRate,
            totalRevenue,
            expectedRevenue,
            collectionRate: expectedRevenue > 0
              ? Math.round((totalRevenue / expectedRevenue) * 100)
              : 0,
            classProgress: totalSessions > 0
              ? Math.round((completedSessions / totalSessions) * 100)
              : 0
          },
          students: enrollments?.map(e => ({
            id: e.student?.id,
            name: e.student?.full_name,
            status: e.status,
            paidAmount: e.paid_amount
          })) || [],
          upcomingSessions: sessions
            ?.filter(s => s.status === 'scheduled' || s.status === 'pending')
            ?.slice(0, 5)
            ?.map(s => ({
              id: s.id,
              date: s.session_date,
              startTime: s.start_time,
              endTime: s.end_time
            })) || []
        };
        break;
    }

    console.log(`✅ Generated ${reportType} report for class ${classData.name}`);

    res.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error('Error generating class report:', error);
    next(error);
  }
});

// ============================================================
// NOTIFICATION BULK SEND APIs
// ============================================================

/**
 * GET /api/notifications/students
 * Lấy danh sách học viên theo bộ lọc để gửi thông báo
 * Query params:
 * - course_ids: comma-separated course IDs
 * - class_ids: comma-separated class IDs  
 * - payment_status: 'owing' | 'paid' | 'all'
 */
app.get('/api/notifications/students', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    const { course_ids, class_ids, payment_status = 'all', centerId } = req.query;

    // Permission check
    const { effectiveCenterId, error: permError } = getEffectiveCenterId(req.user, centerId);
    if (permError) {
      return res.status(403).json({ success: false, message: permError });
    }

    // Build base query - using correct column names from schema
    let query = supabase
      .from('enrollments')
      .select(`
        id,
        student_id,
        class_id,
        tuition_fee,
        discount_amount,
        paid_amount,
        status
      `)
      .eq('status', 'active');

    // Filter by courses
    if (course_ids) {
      const courseIdList = course_ids.split(',').filter(id => id);
      if (courseIdList.length > 0) {
        // Get class IDs for these courses
        const { data: classesForCourses, error: classErr } = await supabase
          .from('classes')
          .select('id')
          .in('course_id', courseIdList);

        if (classErr) {
          console.error('Error fetching classes for courses:', classErr);
        }

        if (classesForCourses && classesForCourses.length > 0) {
          query = query.in('class_id', classesForCourses.map(c => c.id));
        } else {
          return res.json({ success: true, data: [] });
        }
      }
    }

    // Filter by classes
    if (class_ids) {
      const classIdList = class_ids.split(',').filter(id => id);
      if (classIdList.length > 0) {
        query = query.in('class_id', classIdList);
      }
    }

    // Filter by center
    if (effectiveCenterId) {
      const { data: centerClasses } = await supabase
        .from('classes')
        .select('id')
        .eq('center_id', effectiveCenterId);

      if (centerClasses && centerClasses.length > 0) {
        query = query.in('class_id', centerClasses.map(c => c.id));
      } else {
        return res.json({ success: true, data: [] });
      }
    }

    const { data: enrollments, error } = await query;
    if (error) {
      console.error('Error fetching enrollments:', error);
      throw error;
    }

    if (!enrollments || enrollments.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Get unique student IDs and class IDs
    const studentIds = [...new Set(enrollments.map(e => e.student_id))];
    const classIds = [...new Set(enrollments.map(e => e.class_id))];

    // Fetch students info
    const { data: students } = await supabase
      .from('users')
      .select('id, full_name, email, phone')
      .in('id', studentIds);

    // Fetch classes info with courses
    const { data: classesData } = await supabase
      .from('classes')
      .select(`
        id,
        name,
        course_id,
        teacher_id,
        room_id,
        center_id
      `)
      .in('id', classIds);

    // Get course IDs and fetch courses
    const courseIdsFromClasses = [...new Set((classesData || []).map(c => c.course_id).filter(Boolean))];
    const { data: coursesData } = await supabase
      .from('courses')
      .select('id, title, price')
      .in('id', courseIdsFromClasses);

    // Get teacher IDs and fetch teachers
    const teacherIds = [...new Set((classesData || []).map(c => c.teacher_id).filter(Boolean))];
    const { data: teachersData } = await supabase
      .from('users')
      .select('id, full_name')
      .in('id', teacherIds.length > 0 ? teacherIds : ['00000000-0000-0000-0000-000000000000']);

    // Get center IDs and fetch centers
    const centerIds = [...new Set((classesData || []).map(c => c.center_id).filter(Boolean))];
    const { data: centersData } = await supabase
      .from('centers')
      .select('id, name')
      .in('id', centerIds.length > 0 ? centerIds : ['00000000-0000-0000-0000-000000000000']);

    // Create lookup maps
    const studentsMap = Object.fromEntries((students || []).map(s => [s.id, s]));
    const classesMap = Object.fromEntries((classesData || []).map(c => [c.id, c]));
    const coursesMap = Object.fromEntries((coursesData || []).map(c => [c.id, c]));
    const teachersMap = Object.fromEntries((teachersData || []).map(t => [t.id, t]));
    const centersMap = Object.fromEntries((centersData || []).map(c => [c.id, c]));

    // Calculate payment info for each enrollment using enrollments table data directly
    const studentsWithPayment = enrollments.map((enrollment) => {
      const classInfo = classesMap[enrollment.class_id] || {};
      const courseInfo = coursesMap[classInfo.course_id] || {};
      const teacherInfo = teachersMap[classInfo.teacher_id] || {};
      const centerInfo = centersMap[classInfo.center_id] || {};
      const studentInfo = studentsMap[enrollment.student_id] || {};

      // Use tuition_fee from enrollment, fallback to course price
      const totalFee = enrollment.tuition_fee || courseInfo.price || 0;
      const discountAmount = enrollment.discount_amount || 0;
      const paidAmount = enrollment.paid_amount || 0;
      const remainingAmount = totalFee - discountAmount - paidAmount;

      return {
        id: enrollment.student_id,
        enrollment_id: enrollment.id,
        full_name: studentInfo.full_name,
        email: studentInfo.email,
        phone: studentInfo.phone,
        class_id: enrollment.class_id,
        class_name: classInfo.name,
        course_id: classInfo.course_id,
        course_name: courseInfo.title,
        teacher_name: teacherInfo.full_name,
        center_name: centerInfo.name,
        total_fee: totalFee,
        discount_amount: discountAmount,
        paid_amount: paidAmount,
        remaining_amount: remainingAmount
      };
    });

    // Filter by payment status
    let filteredStudents = studentsWithPayment;
    if (payment_status === 'owing') {
      filteredStudents = studentsWithPayment.filter(s => s.remaining_amount > 0);
    } else if (payment_status === 'paid') {
      filteredStudents = studentsWithPayment.filter(s => s.remaining_amount <= 0);
    }

    // Remove duplicates (same student in multiple classes)
    const uniqueStudents = [];
    const seenIds = new Set();
    for (const student of filteredStudents) {
      const key = `${student.id}-${student.class_id}`;
      if (!seenIds.has(key)) {
        seenIds.add(key);
        uniqueStudents.push(student);
      }
    }

    res.json({ success: true, data: uniqueStudents });
  } catch (error) {
    console.error('Error fetching notification students:', error);
    next(error);
  }
});

/**
 * POST /api/notifications/send-bulk
 * Gửi thông báo hàng loạt đến danh sách học viên (theo enrollment_id)
 */
app.post('/api/notifications/send-bulk', requireAuth, requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), async (req, res, next) => {
  try {
    // student_ids is actually enrollment_ids from frontend
    const { student_ids: enrollment_ids, template_id, template_fields, notification_type } = req.body;

    if (!enrollment_ids || enrollment_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn ít nhất một học viên' });
    }

    if (!template_id) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn mẫu thông báo' });
    }

    // Get enrollments by IDs
    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select(`
        id,
        student_id,
        class_id,
        tuition_fee,
        discount_amount,
        paid_amount
      `)
      .in('id', enrollment_ids);

    if (error) throw error;

    if (!enrollments || enrollments.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy học viên' });
    }

    // Get related data separately
    const studentIds = [...new Set(enrollments.map(e => e.student_id))];
    const classIds = [...new Set(enrollments.map(e => e.class_id))];

    const { data: students } = await supabase
      .from('users')
      .select('id, full_name, email, phone')
      .in('id', studentIds);

    const { data: classesData } = await supabase
      .from('classes')
      .select('id, name, course_id, teacher_id, room_id, center_id')
      .in('id', classIds);

    const courseIds = [...new Set((classesData || []).map(c => c.course_id).filter(Boolean))];
    const teacherIds = [...new Set((classesData || []).map(c => c.teacher_id).filter(Boolean))];
    const centerIds = [...new Set((classesData || []).map(c => c.center_id).filter(Boolean))];

    const { data: coursesData } = await supabase
      .from('courses')
      .select('id, title, price')
      .in('id', courseIds.length > 0 ? courseIds : ['00000000-0000-0000-0000-000000000000']);

    const { data: teachersData } = await supabase
      .from('users')
      .select('id, full_name')
      .in('id', teacherIds.length > 0 ? teacherIds : ['00000000-0000-0000-0000-000000000000']);

    const { data: centersData } = await supabase
      .from('centers')
      .select('id, name')
      .in('id', centerIds.length > 0 ? centerIds : ['00000000-0000-0000-0000-000000000000']);

    // Create lookup maps
    const studentsMap = Object.fromEntries((students || []).map(s => [s.id, s]));
    const classesMap = Object.fromEntries((classesData || []).map(c => [c.id, c]));
    const coursesMap = Object.fromEntries((coursesData || []).map(c => [c.id, c]));
    const teachersMap = Object.fromEntries((teachersData || []).map(t => [t.id, t]));
    const centersMap = Object.fromEntries((centersData || []).map(c => [c.id, c]));

    let sent = 0;
    let failed = 0;

    // Process each enrollment
    for (const enrollment of enrollments) {
      try {
        const classInfo = classesMap[enrollment.class_id] || {};
        const courseInfo = coursesMap[classInfo.course_id] || {};
        const teacherInfo = teachersMap[classInfo.teacher_id] || {};
        const centerInfo = centersMap[classInfo.center_id] || {};
        const studentInfo = studentsMap[enrollment.student_id] || {};

        const totalFee = enrollment.tuition_fee || courseInfo.price || 0;
        const discountAmount = enrollment.discount_amount || 0;
        const paidAmount = enrollment.paid_amount || 0;
        const remainingAmount = totalFee - discountAmount - paidAmount;

        // Prepare student data for template
        const studentData = {
          studentName: studentInfo.full_name,
          email: studentInfo.email,
          phone: studentInfo.phone,
          className: classInfo.name,
          courseName: courseInfo.title,
          teacherName: teacherInfo.full_name,
          centerName: centerInfo.name,
          totalFee: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalFee),
          paidAmount: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(paidAmount),
          remainingAmount: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(remainingAmount),
          ...template_fields
        };

        // Log notification (in production, would send email/SMS)
        console.log(`📧 Sending notification to: ${studentData.email}`);
        console.log(`   Template: ${template_id}`);
        console.log(`   Type: ${notification_type}`);

        // Try to save notification record (table may not exist)
        try {
          await supabase
            .from('notifications')
            .insert({
              user_id: enrollment.student_id,
              title: `Thông báo - ${template_id}`,
              message: JSON.stringify(studentData),
              type: notification_type,
              is_read: false,
              created_at: new Date().toISOString()
            });
        } catch (notifErr) {
          console.log('Notification table insert skipped:', notifErr.message);
        }

        sent++;
      } catch (err) {
        console.error(`Failed to send to enrollment ${enrollment.id}:`, err);
        failed++;
      }
    }

    res.json({
      success: true,
      message: `Đã gửi ${sent} thông báo thành công${failed > 0 ? `, ${failed} thất bại` : ''}`,
      sent,
      failed
    });
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    next(error);
  }
});

// ============================================================
// END NOTIFICATION BULK SEND APIs  
// ============================================================

// ============================================================
// END NEW MODULE APIs
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
