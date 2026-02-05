/**
 * Session Auto-Complete Job
 * Automatically marks sessions as 'completed' when:
 * 1. Session end time has passed
 * 2. Attendance has been recorded (at least one record)
 * 
 * Runs every 15 minutes via pg-boss scheduler
 */
import { supabase } from '../lib/db.js';

/**
 * Process auto-complete sessions job
 * @param {Object} job - pg-boss job object
 * @returns {Object} Result with count of completed sessions
 */
export async function processSessionAutoComplete(job) {
  console.log('🔄 Processing session auto-complete...');
  
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS
  
  try {
    // 1) Find sessions that:
    //    - status is 'scheduled' (not completed, cancelled)
    //    - session_date + end_time is in the past
    //    - has at least one attendance record
    const { data: eligibleSessions, error: fetchError } = await supabase
      .from('sessions')
      .select(`
        id,
        session_date,
        end_time,
        status,
        class_id,
        session_number
      `)
      .eq('status', 'scheduled')
      .or(`session_date.lt.${today},and(session_date.eq.${today},end_time.lt.${currentTime})`);
    
    if (fetchError) {
      console.error('❌ Error fetching eligible sessions:', fetchError.message);
      throw fetchError;
    }
    
    if (!eligibleSessions || eligibleSessions.length === 0) {
      console.log('✅ No sessions to auto-complete');
      return { completedCount: 0, message: 'No eligible sessions' };
    }
    
    console.log(`📋 Found ${eligibleSessions.length} past sessions to check...`);
    
    // 2) For each session, check if it has attendance records
    let completedCount = 0;
    const completedIds = [];
    
    for (const session of eligibleSessions) {
      // Check attendance records
      const { count, error: countError } = await supabase
        .from('session_attendance')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', session.id);
      
      if (countError) {
        console.warn(`⚠️ Error checking attendance for session ${session.id}:`, countError.message);
        continue;
      }
      
      // Only complete if attendance exists
      if (count && count > 0) {
        completedIds.push(session.id);
      }
    }
    
    // 3) Bulk update completed sessions
    if (completedIds.length > 0) {
      const { error: updateError } = await supabase
        .from('sessions')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .in('id', completedIds);
      
      if (updateError) {
        console.error('❌ Error updating sessions:', updateError.message);
        throw updateError;
      }
      
      completedCount = completedIds.length;
      console.log(`✅ Auto-completed ${completedCount} sessions`);
    } else {
      console.log('✅ No sessions with attendance to complete');
    }
    
    return { 
      completedCount,
      checkedCount: eligibleSessions.length,
      completedIds,
      message: `Auto-completed ${completedCount} of ${eligibleSessions.length} past sessions`
    };
  } catch (error) {
    console.error('❌ Session auto-complete job failed:', error.message);
    throw error;
  }
}

/**
 * Manual trigger - mark specific sessions as completed
 * Called from API endpoint
 */
export async function autoCompleteSessionsManual(options = {}) {
  const { dryRun = false, sessionIds = null } = options;
  
  console.log(`🔄 Manual session auto-complete (dryRun: ${dryRun})...`);
  
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().split(' ')[0];
  
  try {
    // Build query
    let query = supabase
      .from('sessions')
      .select(`
        id,
        session_date,
        end_time,
        status,
        class_id,
        session_number,
        classes (
          id,
          name,
          code
        )
      `)
      .eq('status', 'scheduled');
    
    // If specific sessionIds provided, use those
    if (sessionIds && sessionIds.length > 0) {
      query = query.in('id', sessionIds);
    } else {
      // Otherwise find all past sessions
      query = query.or(`session_date.lt.${today},and(session_date.eq.${today},end_time.lt.${currentTime})`);
    }
    
    const { data: eligibleSessions, error: fetchError } = await query;
    
    if (fetchError) throw fetchError;
    
    if (!eligibleSessions || eligibleSessions.length === 0) {
      return { 
        success: true, 
        completedCount: 0, 
        sessions: [],
        message: 'Không có buổi học nào cần hoàn thành' 
      };
    }
    
    // Check attendance for each
    const sessionsWithAttendance = [];
    const sessionsWithoutAttendance = [];
    
    for (const session of eligibleSessions) {
      const { count } = await supabase
        .from('session_attendance')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', session.id);
      
      if (count && count > 0) {
        sessionsWithAttendance.push({
          ...session,
          attendanceCount: count
        });
      } else {
        sessionsWithoutAttendance.push(session);
      }
    }
    
    // Dry run - just return what would be completed
    if (dryRun) {
      return {
        success: true,
        dryRun: true,
        wouldComplete: sessionsWithAttendance.length,
        skipped: sessionsWithoutAttendance.length,
        sessionsToComplete: sessionsWithAttendance.map(s => ({
          id: s.id,
          session_date: s.session_date,
          end_time: s.end_time,
          class_name: s.classes?.name,
          class_code: s.classes?.code,
          session_number: s.session_number,
          attendanceCount: s.attendanceCount
        })),
        sessionsSkipped: sessionsWithoutAttendance.map(s => ({
          id: s.id,
          session_date: s.session_date,
          class_name: s.classes?.name,
          reason: 'Chưa điểm danh'
        })),
        message: `Sẽ hoàn thành ${sessionsWithAttendance.length} buổi, bỏ qua ${sessionsWithoutAttendance.length} buổi`
      };
    }
    
    // Actually update
    if (sessionsWithAttendance.length > 0) {
      const ids = sessionsWithAttendance.map(s => s.id);
      const { error: updateError } = await supabase
        .from('sessions')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .in('id', ids);
      
      if (updateError) throw updateError;
    }
    
    return {
      success: true,
      completedCount: sessionsWithAttendance.length,
      skippedCount: sessionsWithoutAttendance.length,
      completedSessions: sessionsWithAttendance.map(s => ({
        id: s.id,
        session_date: s.session_date,
        class_name: s.classes?.name,
        session_number: s.session_number
      })),
      message: `Đã hoàn thành ${sessionsWithAttendance.length} buổi học`
    };
  } catch (error) {
    console.error('❌ Manual auto-complete failed:', error.message);
    throw error;
  }
}

export default processSessionAutoComplete;
