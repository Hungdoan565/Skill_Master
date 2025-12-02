/**
 * Schedule Conflict Detection Module
 * 
 * Kiểm tra xung đột lịch học theo 3 lớp (Layers):
 * 1. Time Slot: (Start_A < End_B) AND (End_A > Start_B)
 * 2. Days of Week: Giao của mảng thứ ≠ ∅
 * 3. Date Range: (StartDate_A < EndDate_B) AND (EndDate_A > StartDate_B)
 * 
 * @author Skill Master Team
 */

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Chuyển đổi thời gian "HH:MM" sang phút (để so sánh)
 */
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

/**
 * Chuyển đổi số thứ sang tên tiếng Việt
 * Convention: 2 = Thứ Hai, 3 = Thứ Ba, ..., 8 = Chủ Nhật
 */
function dayNumberToName(dayNum) {
  const days = {
    2: 'Thứ Hai',
    3: 'Thứ Ba',
    4: 'Thứ Tư',
    5: 'Thứ Năm',
    6: 'Thứ Sáu',
    7: 'Thứ Bảy',
    8: 'Chủ Nhật'
  };
  return days[dayNum] || `Ngày ${dayNum}`;
}

/**
 * Loại bỏ các conflict trùng lặp (cùng lớp có thể trùng nhiều slot)
 */
function deduplicateConflicts(conflicts) {
  const seen = new Set();
  return conflicts.filter(c => {
    const key = `${c.class_id}-${c.conflict_day}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Tạo message tóm tắt xung đột cho user
 */
function generateConflictSummary(conflicts) {
  const roomConflicts = conflicts.filter(c => c.conflict_type.includes('room'));
  const teacherConflicts = conflicts.filter(c => c.conflict_type.includes('teacher'));

  const messages = [];

  if (roomConflicts.length > 0) {
    const rooms = [...new Set(roomConflicts.map(c => c.room_name))].filter(Boolean).join(', ');
    const classes = [...new Set(roomConflicts.map(c => c.class_name))].join(', ');
    messages.push(`Phòng ${rooms || 'này'} đã có lớp "${classes}" vào khung giờ này`);
  }

  if (teacherConflicts.length > 0) {
    const teachers = [...new Set(teacherConflicts.map(c => c.teacher_name))].filter(Boolean).join(', ');
    const classes = [...new Set(teacherConflicts.map(c => c.class_name))].join(', ');
    messages.push(`Giáo viên ${teachers || 'này'} đã dạy lớp "${classes}" vào khung giờ này`);
  }

  return messages.join('. ');
}

// ========================================
// MAIN CONFLICT DETECTION FUNCTION
// ========================================

/**
 * Kiểm tra xung đột lịch học cho phòng và/hoặc giáo viên
 * 
 * @param {Object} supabase - Supabase client
 * @param {Object} newClass - Thông tin lớp mới/đang update
 * @param {string} newClass.room_id - ID phòng học
 * @param {string} newClass.teacher_id - ID giáo viên
 * @param {string} newClass.start_date - Ngày bắt đầu (YYYY-MM-DD)
 * @param {string} newClass.end_date - Ngày kết thúc (YYYY-MM-DD)
 * @param {Array} newClass.schedule - Lịch học [{day: 2, start: "18:00", end: "20:00"}]
 * @param {string} excludeClassId - ID lớp cần loại trừ (khi update)
 * 
 * @returns {Object} { hasConflict, conflicts, summary }
 */
async function checkScheduleConflict(supabase, newClass, excludeClassId = null) {
  const { room_id, teacher_id, start_date, end_date, schedule } = newClass;

  // Validate input
  if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
    return { hasConflict: false, conflicts: [], message: 'Không có lịch học để kiểm tra' };
  }

  if (!start_date || !end_date) {
    return { hasConflict: false, conflicts: [], message: 'Thiếu ngày bắt đầu/kết thúc' };
  }

  // Không có room và teacher thì không cần check
  if (!room_id && !teacher_id) {
    return { hasConflict: false, conflicts: [], message: 'Không có phòng/giáo viên để kiểm tra' };
  }

  try {
    // ========================================
    // BƯỚC 1: Query các lớp có thể xung đột
    // ========================================
    // Điều kiện: Cùng phòng HOẶC cùng giáo viên, 
    // đang hoạt động (upcoming/ongoing),
    // và có overlap về date range
    
    let query = supabase
      .from('classes')
      .select(`
        id, 
        code, 
        name, 
        room_id,
        teacher_id,
        start_date, 
        end_date, 
        schedule,
        status,
        rooms (name),
        users!classes_teacher_id_fkey (full_name)
      `)
      .in('status', ['upcoming', 'ongoing']); // Chỉ check các lớp đang/sắp hoạt động

    // Loại trừ lớp đang update
    if (excludeClassId) {
      query = query.neq('id', excludeClassId);
    }

    // ========================================
    // LAYER 3: Date Range Overlap
    // (StartDate_A < EndDate_B) AND (EndDate_A > StartDate_B)
    // ========================================
    query = query
      .lt('start_date', end_date)   // existing.start_date < new.end_date
      .gt('end_date', start_date);  // existing.end_date > new.start_date

    // Filter theo room hoặc teacher
    if (room_id && teacher_id) {
      // Check cả 2: phòng HOẶC giáo viên bị trùng
      query = query.or(`room_id.eq.${room_id},teacher_id.eq.${teacher_id}`);
    } else if (room_id) {
      query = query.eq('room_id', room_id);
    } else if (teacher_id) {
      query = query.eq('teacher_id', teacher_id);
    }

    const { data: potentialConflicts, error } = await query;

    if (error) {
      console.error('Error querying schedule conflicts:', error);
      throw error;
    }

    if (!potentialConflicts || potentialConflicts.length === 0) {
      return { hasConflict: false, conflicts: [] };
    }

    // ========================================
    // BƯỚC 2: Kiểm tra chi tiết Layer 1 & 2
    // ========================================
    const conflicts = [];

    for (const existingClass of potentialConflicts) {
      const existingSchedule = existingClass.schedule || [];
      
      if (!Array.isArray(existingSchedule) || existingSchedule.length === 0) {
        continue; // Lớp không có lịch học chi tiết
      }

      // Check từng slot của lớp mới với từng slot của lớp cũ
      for (const newSlot of schedule) {
        for (const existingSlot of existingSchedule) {
          
          // ========================================
          // LAYER 2: Days of Week Overlap
          // Kiểm tra có trùng thứ không
          // ========================================
          if (newSlot.day !== existingSlot.day) {
            continue; // Khác thứ → không xung đột
          }

          // ========================================
          // LAYER 1: Time Slot Overlap
          // (Start_A < End_B) AND (End_A > Start_B)
          // ========================================
          const newStart = timeToMinutes(newSlot.start);
          const newEnd = timeToMinutes(newSlot.end);
          const existStart = timeToMinutes(existingSlot.start);
          const existEnd = timeToMinutes(existingSlot.end);

          const hasTimeOverlap = (newStart < existEnd) && (newEnd > existStart);

          if (hasTimeOverlap) {
            // Xác định loại xung đột (phòng hay giáo viên)
            const conflictType = [];
            if (room_id && existingClass.room_id === room_id) {
              conflictType.push('room');
            }
            if (teacher_id && existingClass.teacher_id === teacher_id) {
              conflictType.push('teacher');
            }

            conflicts.push({
              class_id: existingClass.id,
              class_code: existingClass.code,
              class_name: existingClass.name,
              conflict_type: conflictType,
              room_name: existingClass.rooms?.name,
              teacher_name: existingClass.users?.full_name,
              conflict_day: dayNumberToName(newSlot.day),
              conflict_time: {
                existing: `${existingSlot.start} - ${existingSlot.end}`,
                new: `${newSlot.start} - ${newSlot.end}`
              },
              date_range: {
                existing: `${existingClass.start_date} → ${existingClass.end_date}`,
                new: `${start_date} → ${end_date}`
              }
            });
          }
        }
      }
    }

    // Loại bỏ duplicate (cùng lớp có thể trùng nhiều slot)
    const uniqueConflicts = deduplicateConflicts(conflicts);

    return {
      hasConflict: uniqueConflicts.length > 0,
      conflicts: uniqueConflicts,
      summary: uniqueConflicts.length > 0 
        ? generateConflictSummary(uniqueConflicts)
        : null
    };

  } catch (error) {
    console.error('Schedule conflict check failed:', error);
    return { 
      hasConflict: false, 
      conflicts: [], 
      error: error.message 
    };
  }
}

// ========================================
// SHORTCUT FUNCTIONS
// ========================================

/**
 * Kiểm tra nhanh chỉ cho phòng học
 */
async function checkRoomConflict(supabase, roomId, startDate, endDate, schedule, excludeClassId = null) {
  return checkScheduleConflict(supabase, {
    room_id: roomId,
    start_date: startDate,
    end_date: endDate,
    schedule
  }, excludeClassId);
}

/**
 * Kiểm tra nhanh chỉ cho giáo viên
 */
async function checkTeacherConflict(supabase, teacherId, startDate, endDate, schedule, excludeClassId = null) {
  return checkScheduleConflict(supabase, {
    teacher_id: teacherId,
    start_date: startDate,
    end_date: endDate,
    schedule
  }, excludeClassId);
}

// ES Module exports
export {
  checkScheduleConflict,
  checkRoomConflict,
  checkTeacherConflict,
  timeToMinutes,
  dayNumberToName
};
