/**
 * Session Generator Module
 * 
 * Tự động sinh các buổi học (sessions) dựa trên:
 * - start_date, end_date: Khoảng thời gian lớp học
 * - schedule: Lịch học theo tuần [{day: 2, start: "18:00", end: "20:00"}]
 * 
 * Convention: day 2=Thứ 2, 3=Thứ 3, ..., 8=Chủ nhật
 * 
 * @author Skill Master Team
 */

/**
 * Chuyển đổi day number (2-8) sang JavaScript getDay() (0-6)
 * day 2 (Thứ 2) = getDay() 1 (Monday)
 * day 8 (Chủ nhật) = getDay() 0 (Sunday)
 */
function dayNumberToJsDay(dayNum) {
  // day: 2=Mon(1), 3=Tue(2), 4=Wed(3), 5=Thu(4), 6=Fri(5), 7=Sat(6), 8=Sun(0)
  if (dayNum === 8) return 0; // Chủ nhật
  return dayNum - 1; // Các ngày khác
}

/**
 * Tính duration_hours từ start_time và end_time
 * @param {string} startTime - "HH:MM"
 * @param {string} endTime - "HH:MM" 
 * @returns {number} - Số giờ (decimal)
 */
function calculateDuration(startTime, endTime) {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  
  return (endMinutes - startMinutes) / 60;
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Lấy tên thứ tiếng Việt
 */
function getDayName(dayNum) {
  const names = {
    2: 'Thứ Hai',
    3: 'Thứ Ba',
    4: 'Thứ Tư',
    5: 'Thứ Năm',
    6: 'Thứ Sáu',
    7: 'Thứ Bảy',
    8: 'Chủ Nhật'
  };
  return names[dayNum] || `Day ${dayNum}`;
}

/**
 * Generate danh sách các buổi học từ thông tin lớp
 * 
 * @param {Object} classData - Thông tin lớp học
 * @param {string} classData.id - Class ID
 * @param {string} classData.start_date - Ngày bắt đầu (YYYY-MM-DD)
 * @param {string} classData.end_date - Ngày kết thúc (YYYY-MM-DD)
 * @param {Array} classData.schedule - Lịch học [{day, start, end}]
 * @param {string} classData.teacher_id - ID giáo viên
 * @param {number} teacherRate - Mức lương/giờ của GV (default 150000)
 * 
 * @returns {Array} - Mảng các session objects sẵn sàng insert
 */
function generateSessionsFromSchedule(classData, teacherRate = 150000) {
  const { id: classId, start_date, end_date, schedule, teacher_id } = classData;
  
  // Validate input
  if (!start_date || !end_date || !schedule || !Array.isArray(schedule) || schedule.length === 0) {
    console.log('⚠️ Không đủ thông tin để sinh sessions');
    return [];
  }

  const sessions = [];
  let sessionNumber = 1;

  // Parse dates
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);
  
  // Validate date range
  if (startDate > endDate) {
    console.log('⚠️ Ngày bắt đầu sau ngày kết thúc');
    return [];
  }

  // Tạo map để tra cứu nhanh: jsDay -> scheduleSlot
  const scheduleMap = new Map();
  for (const slot of schedule) {
    const jsDay = dayNumberToJsDay(slot.day);
    scheduleMap.set(jsDay, slot);
  }

  console.log(`📅 Generating sessions từ ${start_date} đến ${end_date}`);
  console.log(`📆 Các ngày trong tuần: ${schedule.map(s => getDayName(s.day)).join(', ')}`);

  // Loop qua từng ngày trong khoảng
  const currentDate = new Date(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  while (currentDate <= endDate) {
    const jsDay = currentDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    
    // Kiểm tra ngày này có trong schedule không
    if (scheduleMap.has(jsDay)) {
      const slot = scheduleMap.get(jsDay);
      const startTime = slot.start || '18:00';
      const endTime = slot.end || '20:00';
      const durationHours = calculateDuration(startTime, endTime);
      
      // Xác định status dựa vào ngày
      const sessionDate = new Date(currentDate);
      sessionDate.setHours(0, 0, 0, 0);
      
      let status = 'scheduled';
      if (sessionDate < today) {
        status = 'completed'; // Buổi học trong quá khứ
      }

      sessions.push({
        class_id: classId,
        teacher_id: teacher_id,
        session_number: sessionNumber,
        session_date: formatDate(currentDate),
        start_time: startTime,
        end_time: endTime,
        duration_hours: durationHours,
        teacher_rate: teacherRate,
        status: status,
        is_locked: false,
        topic: null,
        notes: null
      });

      sessionNumber++;
    }

    // Sang ngày tiếp theo
    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log(`✅ Đã generate ${sessions.length} buổi học`);
  return sessions;
}

/**
 * Generate và Insert sessions vào database
 * 
 * @param {Object} supabase - Supabase client
 * @param {Object} classData - Thông tin lớp học
 * @param {Object} options - Tùy chọn
 * @param {boolean} options.deleteExisting - Xóa sessions cũ chưa lock (default: true)
 * @param {boolean} options.skipLocked - Bỏ qua sessions đã lock (default: true)
 * 
 * @returns {Object} - { success, count, sessions, error }
 */
async function generateClassSessions(supabase, classData, options = {}) {
  const { deleteExisting = true, skipLocked = true } = options;
  
  try {
    console.log(`\n🔄 Generating sessions cho lớp ${classData.id}...`);

    // 1. Lấy hourly_rate của giáo viên
    let teacherRate = 150000; // Default rate
    if (classData.teacher_id) {
      const { data: teacher } = await supabase
        .from('users')
        .select('hourly_rate')
        .eq('id', classData.teacher_id)
        .single();
      
      if (teacher?.hourly_rate) {
        teacherRate = teacher.hourly_rate;
      }
    }

    // 2. Xóa sessions cũ chưa lock (nếu enabled)
    if (deleteExisting) {
      const { error: deleteError } = await supabase
        .from('sessions')
        .delete()
        .eq('class_id', classData.id)
        .eq('is_locked', false);
      
      if (deleteError) {
        console.error('❌ Lỗi xóa sessions cũ:', deleteError);
      } else {
        console.log('🗑️ Đã xóa sessions cũ chưa lock');
      }
    }

    // 3. Generate danh sách sessions
    const sessions = generateSessionsFromSchedule(classData, teacherRate);
    
    if (sessions.length === 0) {
      return { success: true, count: 0, sessions: [], message: 'Không có sessions để tạo' };
    }

    // 4. Nếu skipLocked, kiểm tra và loại bỏ các ngày đã có session locked
    let sessionsToInsert = sessions;
    if (skipLocked) {
      const { data: lockedSessions } = await supabase
        .from('sessions')
        .select('session_date')
        .eq('class_id', classData.id)
        .eq('is_locked', true);
      
      if (lockedSessions && lockedSessions.length > 0) {
        const lockedDates = new Set(lockedSessions.map(s => s.session_date));
        sessionsToInsert = sessions.filter(s => !lockedDates.has(s.session_date));
        console.log(`⏭️ Bỏ qua ${sessions.length - sessionsToInsert.length} sessions đã lock`);
      }
    }

    // 5. Bulk insert sessions
    if (sessionsToInsert.length > 0) {
      const { data: insertedSessions, error: insertError } = await supabase
        .from('sessions')
        .insert(sessionsToInsert)
        .select();
      
      if (insertError) {
        console.error('❌ Lỗi insert sessions:', insertError);
        return { success: false, count: 0, error: insertError.message };
      }

      console.log(`✅ Đã tạo ${insertedSessions.length} buổi học thành công!`);
      
      return {
        success: true,
        count: insertedSessions.length,
        sessions: insertedSessions,
        summary: {
          total: insertedSessions.length,
          scheduled: insertedSessions.filter(s => s.status === 'scheduled').length,
          completed: insertedSessions.filter(s => s.status === 'completed').length,
          firstSession: insertedSessions[0]?.session_date,
          lastSession: insertedSessions[insertedSessions.length - 1]?.session_date
        }
      };
    }

    return { success: true, count: 0, sessions: [], message: 'Tất cả sessions đã được lock' };

  } catch (error) {
    console.error('❌ generateClassSessions failed:', error);
    return { success: false, count: 0, error: error.message };
  }
}

/**
 * Regenerate sessions cho một lớp (API helper)
 * Dùng khi admin thay đổi schedule của lớp
 */
async function regenerateClassSessions(supabase, classId) {
  try {
    // Lấy thông tin lớp học
    const { data: classData, error } = await supabase
      .from('classes')
      .select('id, start_date, end_date, schedule, teacher_id')
      .eq('id', classId)
      .single();
    
    if (error || !classData) {
      return { success: false, error: 'Không tìm thấy lớp học' };
    }

    return generateClassSessions(supabase, classData);
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ES Module exports
export {
  generateClassSessions,
  regenerateClassSessions,
  generateSessionsFromSchedule,
  calculateDuration,
  dayNumberToJsDay,
  getDayName,
  formatDate
};
