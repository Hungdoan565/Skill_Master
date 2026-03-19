/**
 * useParentDashboardAggregator Hook
 * Fetches schedule/attendance/grades/invoices for ALL children in parallel,
 * then builds priority alerts and per-child snapshots for the dashboard.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function fetchJSON(url, token) {
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    return res.ok && data.success ? data.data : null;
  } catch {
    return null;
  }
}

/**
 * For each child, fetch schedule + attendance + grades + invoices in parallel.
 * Returns { childId: { schedule, attendance, grades, invoices } }
 */
async function fetchAllChildrenData(children, token) {
  if (!children?.length || !token) return {};

  const results = {};

  await Promise.all(
    children.map(async (child) => {
      const [scheduleData, attendanceData, gradesData, invoicesData] = await Promise.all([
        fetchJSON(`${API_URL}/api/parent/child/${child.id}/schedule`, token),
        fetchJSON(`${API_URL}/api/parent/child/${child.id}/attendance`, token),
        fetchJSON(`${API_URL}/api/parent/child/${child.id}/grades`, token),
        fetchJSON(`${API_URL}/api/parent/child/${child.id}/invoices`, token),
      ]);

      // Match the exact keys from the backend response (same as individual hooks):
      // Schedule: result.data.events
      const schedule = scheduleData?.events || (Array.isArray(scheduleData) ? scheduleData : []);

      // Attendance: result.data.attendance
      const attendance = attendanceData?.attendance || (Array.isArray(attendanceData) ? attendanceData : []);

      // Grades: result.data.gradesByClass -> flatten like useParentChildGrades does
      const gradesByClass = gradesData?.gradesByClass || [];
      const grades = Array.isArray(gradesByClass)
        ? gradesByClass.flatMap(g =>
            (g.grades || []).map(grade => ({
              ...grade,
              className: g.className,
              classCode: g.classCode,
              courseTitle: g.courseTitle,
            }))
          )
        : (Array.isArray(gradesData) ? gradesData : []);

      // Invoices: result.data.invoices
      const invoices = invoicesData?.invoices || (Array.isArray(invoicesData) ? invoicesData : []);

      results[child.id] = { schedule, attendance, grades, invoices };
    })
  );

  return results;
}

// ─── Alert builders ─────────────────────────────────────────────

function buildAlerts(children, childrenData) {
  const alerts = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  for (const child of children) {
    const data = childrenData[child.id];
    if (!data) continue;

    // 1. Overdue / due-soon invoices
    for (const inv of data.invoices) {
      if (inv.status === 'paid' || inv.status === 'cancelled') continue;
      const remaining = (inv.final_amount || inv.total_amount || 0) - (inv.paid_amount || 0);
      if (remaining <= 0) continue;

      const dueDate = inv.due_date ? new Date(inv.due_date) : null;
      if (dueDate) {
        dueDate.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          alerts.push({
            id: `overdue-${inv.id}`,
            type: 'overdue_invoice',
            severity: 0, // critical
            childId: child.id,
            childName: child.full_name,
            title: 'Học phí quá hạn',
            description: `${inv.invoice_number || inv.invoice_code || 'Hóa đơn'} — quá hạn ${Math.abs(diffDays)} ngày`,
            amount: remaining,
            href: '/parent/invoices',
            timestamp: dueDate,
          });
        } else if (diffDays <= 7) {
          alerts.push({
            id: `duesoon-${inv.id}`,
            type: 'due_soon_invoice',
            severity: 1, // high
            childId: child.id,
            childName: child.full_name,
            title: 'Sắp đến hạn thanh toán',
            description: `${inv.invoice_number || inv.invoice_code || 'Hóa đơn'} — còn ${diffDays} ngày`,
            amount: remaining,
            href: '/parent/invoices',
            timestamp: dueDate,
          });
        }
      }

      // Pending payment verification
      const pendingPayments = (inv.payments || []).filter(p => p.verification_status === 'pending');
      if (pendingPayments.length > 0) {
        alerts.push({
          id: `pending-pay-${inv.id}`,
          type: 'pending_payment',
          severity: 4, // info
          childId: child.id,
          childName: child.full_name,
          title: 'Minh chứng chờ xác nhận',
          description: `${inv.invoice_number || inv.invoice_code || 'Hóa đơn'} — ${pendingPayments.length} khoản đang chờ`,
          href: '/parent/invoices',
          timestamp: new Date(pendingPayments[0].payment_date || now),
        });
      }
    }

    // 2. Recent absences (last 7 days)
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentAbsences = data.attendance.filter(r => {
      if (r.status !== 'absent' && r.status !== 'absent_unexcused') return false;
      const d = r.session_date || r.date;
      if (!d) return false;
      return new Date(d) >= sevenDaysAgo;
    });

    if (recentAbsences.length > 0) {
      alerts.push({
        id: `absent-${child.id}`,
        type: 'absent_recent',
        severity: 2, // medium
        childId: child.id,
        childName: child.full_name,
        title: 'Vắng học gần đây',
        description: `${child.full_name} vắng ${recentAbsences.length} buổi trong 7 ngày qua`,
        href: `/parent/child/${child.id}`,
        timestamp: new Date(recentAbsences[0].session_date || recentAbsences[0].date || now),
      });
    }

    // 3. New grades (last 7 days)
    const recentGrades = data.grades.filter(g => {
      const d = g.graded_at || g.created_at || g.updated_at;
      if (!d) return false;
      return new Date(d) >= sevenDaysAgo;
    });

    if (recentGrades.length > 0) {
      const latest = recentGrades[0];
      alerts.push({
        id: `grade-${child.id}`,
        type: 'new_grade',
        severity: 3, // low
        childId: child.id,
        childName: child.full_name,
        title: 'Có điểm mới',
        description: `${child.full_name} — ${recentGrades.length} điểm mới trong 7 ngày qua`,
        href: `/parent/child/${child.id}`,
        timestamp: new Date(latest.graded_at || latest.created_at || now),
      });
    }

    // 4. Upcoming session (today or tomorrow)
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 2);
    const upcomingSessions = data.schedule.filter(s => {
      const d = s.session_date || s.date;
      if (!d) return false;
      const sd = new Date(d);
      sd.setHours(0, 0, 0, 0);
      return sd >= now && sd < tomorrow;
    });

    if (upcomingSessions.length > 0) {
      const next = upcomingSessions[0];
      const sessionDate = new Date(next.session_date || next.date);
      const isToday = sessionDate.toDateString() === now.toDateString();
      alerts.push({
        id: `session-${child.id}-${next.id}`,
        type: 'upcoming_session',
        severity: 4, // info
        childId: child.id,
        childName: child.full_name,
        title: isToday ? 'Có buổi học hôm nay' : 'Buổi học ngày mai',
        description: `${next.class_name || next.course_title || 'Lớp học'} — ${next.start_time || ''} ${next.room ? `• Phòng ${next.room}` : ''}`.trim(),
        href: '/parent/schedule',
        timestamp: sessionDate,
      });
    }
  }

  // Sort: severity first, then timestamp desc
  alerts.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity - b.severity;
    return (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0);
  });

  return alerts;
}

function buildChildSnapshots(children, childrenData) {
  return children.map(child => {
    const data = childrenData[child.id] || { schedule: [], attendance: [], grades: [], invoices: [] };
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Next upcoming session
    const futureSessions = data.schedule
      .filter(s => {
        const d = s.session_date || s.date;
        return d && new Date(d) >= now;
      })
      .sort((a, b) => new Date(a.session_date || a.date) - new Date(b.session_date || b.date));
    const nextSession = futureSessions[0] || null;

    // Attendance rate
    const totalRecords = data.attendance.length;
    const presentRecords = data.attendance.filter(r =>
      r.status === 'present' || r.status === 'late'
    ).length;
    const attendanceRate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : null;

    // Unpaid invoices
    const unpaidInvoices = data.invoices.filter(i =>
      i.status !== 'paid' && i.status !== 'cancelled'
    );
    const unpaidAmount = unpaidInvoices.reduce((sum, i) =>
      sum + ((i.final_amount || i.total_amount || 0) - (i.paid_amount || 0)), 0
    );

    // Latest grade
    const sortedGrades = [...data.grades].sort((a, b) =>
      new Date(b.graded_at || b.created_at || 0) - new Date(a.graded_at || a.created_at || 0)
    );
    const latestGrade = sortedGrades[0] || null;

    // Attention items for this child
    const attentionItems = [];
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentAbsences = data.attendance.filter(r => {
      if (r.status !== 'absent' && r.status !== 'absent_unexcused') return false;
      const d = r.session_date || r.date;
      return d && new Date(d) >= sevenDaysAgo;
    });
    if (recentAbsences.length > 0) {
      attentionItems.push({ type: 'absent', count: recentAbsences.length, label: `Vắng ${recentAbsences.length} buổi` });
    }

    const overdueInvoices = unpaidInvoices.filter(inv => {
      if (!inv.due_date) return false;
      const due = new Date(inv.due_date);
      due.setHours(0, 0, 0, 0);
      return due < now;
    });
    if (overdueInvoices.length > 0) {
      attentionItems.push({ type: 'overdue', count: overdueInvoices.length, label: `${overdueInvoices.length} khoản quá hạn` });
    }

    return {
      ...child,
      nextSession,
      attendanceRate,
      attendanceTotal: totalRecords,
      unpaidAmount: Math.max(unpaidAmount, 0),
      unpaidCount: unpaidInvoices.length,
      latestGrade,
      attentionItems,
    };
  });
}

// ─── Recent Activity Builder ────────────────────────────────────

function buildRecentActivity(children, childrenData) {
  const items = [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  for (const child of children) {
    const data = childrenData[child.id];
    if (!data) continue;

    // Recent grades
    for (const g of data.grades) {
      const ts = g.graded_at || g.created_at || g.updated_at;
      if (!ts || new Date(ts) < thirtyDaysAgo) continue;
      items.push({
        id: `grade-${g.id || `${child.id}-${ts}`}`,
        type: 'grade',
        childName: child.full_name,
        childId: child.id,
        title: `Điểm mới: ${g.score ?? '—'}/10`,
        subtitle: g.grade_structure_name || g.gradeType || g.className || 'Bài kiểm tra',
        timestamp: new Date(ts),
        href: `/parent/child/${child.id}`,
      });
    }

    // Recent absences
    for (const r of data.attendance) {
      if (r.status !== 'absent' && r.status !== 'absent_unexcused') continue;
      const d = r.session_date || r.date;
      if (!d || new Date(d) < fourteenDaysAgo) continue;
      items.push({
        id: `absent-${r.id || `${child.id}-${d}`}`,
        type: 'absent',
        childName: child.full_name,
        childId: child.id,
        title: 'Vắng buổi học',
        subtitle: r.class_name || r.course_title || 'Lớp học',
        timestamp: new Date(d),
        href: `/parent/child/${child.id}`,
      });
    }

    // Upcoming sessions (today + tomorrow)
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 2);
    for (const s of data.schedule) {
      const d = s.session_date || s.date;
      if (!d) continue;
      const sd = new Date(d);
      sd.setHours(0, 0, 0, 0);
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      if (sd >= todayStart && sd < tomorrow) {
        items.push({
          id: `session-${s.id || `${child.id}-${d}`}`,
          type: 'session',
          childName: child.full_name,
          childId: child.id,
          title: sd.toDateString() === todayStart.toDateString() ? 'Buổi học hôm nay' : 'Buổi học ngày mai',
          subtitle: `${s.class_name || s.course_title || 'Lớp học'}${s.start_time ? ` — ${s.start_time}` : ''}`,
          timestamp: sd,
          href: '/parent/schedule',
        });
      }
    }

    // Invoices: overdue, due-soon, and pending payment verification
    for (const inv of data.invoices) {
      if (inv.status === 'paid' || inv.status === 'cancelled') continue;
      const remaining = (inv.final_amount || inv.total_amount || 0) - (inv.paid_amount || 0);
      if (remaining <= 0) continue;

      const invoiceLabel = inv.invoice_number || inv.invoice_code || 'Hóa đơn';
      const dueDate = inv.due_date ? new Date(inv.due_date) : null;
      const nowDate = new Date();
      nowDate.setHours(0, 0, 0, 0);

      if (dueDate) {
        dueDate.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((dueDate - nowDate) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          // Overdue
          items.push({
            id: `invoice-overdue-${inv.id}`,
            type: 'payment',
            childName: child.full_name,
            childId: child.id,
            title: `Học phí quá hạn ${Math.abs(diffDays)} ngày`,
            subtitle: `${invoiceLabel} — ${new Intl.NumberFormat('vi-VN').format(remaining)} ₫`,
            timestamp: dueDate,
            href: '/parent/invoices',
          });
        } else if (diffDays <= 7) {
          // Due soon
          items.push({
            id: `invoice-duesoon-${inv.id}`,
            type: 'payment',
            childName: child.full_name,
            childId: child.id,
            title: `Sắp đến hạn thanh toán (còn ${diffDays} ngày)`,
            subtitle: `${invoiceLabel} — ${new Intl.NumberFormat('vi-VN').format(remaining)} ₫`,
            timestamp: dueDate,
            href: '/parent/invoices',
          });
        }
      }

      // Pending payment verification
      const pendingPayments = (inv.payments || []).filter(p => p.verification_status === 'pending');
      if (pendingPayments.length > 0) {
        const ts = pendingPayments[0].payment_date || inv.updated_at || now;
        items.push({
          id: `payment-pending-${inv.id}`,
          type: 'payment',
          childName: child.full_name,
          childId: child.id,
          title: 'Chờ xác nhận thanh toán',
          subtitle: invoiceLabel,
          timestamp: new Date(ts),
          href: '/parent/invoices',
        });
      }
    }
  }

  // Sort by timestamp desc, limit to 10
  items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  return items.slice(0, 10);
}

// ─── Today Focus Builder ────────────────────────────────────────

function buildTodayFocus(children, childrenData) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setDate(todayEnd.getDate() + 1);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  let sessionsToday = 0;
  let unpaidUrgent = 0;
  let unpaidUrgentAmount = 0;
  let recentAbsences = 0;
  let newGrades = 0;

  for (const child of children) {
    const data = childrenData[child.id];
    if (!data) continue;

    // Sessions today
    sessionsToday += data.schedule.filter(s => {
      const d = s.session_date || s.date;
      if (!d) return false;
      const sd = new Date(d);
      sd.setHours(0, 0, 0, 0);
      return sd >= now && sd < todayEnd;
    }).length;

    // Urgent unpaid (overdue + due within 7 days)
    for (const inv of data.invoices) {
      if (inv.status === 'paid' || inv.status === 'cancelled') continue;
      const remaining = (inv.final_amount || inv.total_amount || 0) - (inv.paid_amount || 0);
      if (remaining <= 0) continue;
      if (inv.due_date) {
        const due = new Date(inv.due_date);
        due.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) {
          unpaidUrgent++;
          unpaidUrgentAmount += remaining;
        }
      }
    }

    // Recent absences (7 days)
    recentAbsences += data.attendance.filter(r => {
      if (r.status !== 'absent' && r.status !== 'absent_unexcused') return false;
      const d = r.session_date || r.date;
      return d && new Date(d) >= sevenDaysAgo;
    }).length;

    // New grades (7 days)
    newGrades += data.grades.filter(g => {
      const ts = g.graded_at || g.created_at || g.updated_at;
      return ts && new Date(ts) >= sevenDaysAgo;
    }).length;
  }

  return { sessionsToday, unpaidUrgent, unpaidUrgentAmount, recentAbsences, newGrades };
}

// ─── Hook ───────────────────────────────────────────────────────

export function useParentDashboardAggregator(children) {
  const { session } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [todayFocus, setTodayFocus] = useState({ sessionsToday: 0, unpaidUrgent: 0, unpaidUrgentAmount: 0, recentAbsences: 0, newGrades: 0 });
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  const aggregate = useCallback(async () => {
    if (!session?.access_token || !children?.length) {
      setAlerts([]);
      setSnapshots([]);
      setRecentActivity([]);
      setTodayFocus({ sessionsToday: 0, unpaidUrgent: 0, unpaidUrgentAmount: 0, recentAbsences: 0, newGrades: 0 });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const childrenData = await fetchAllChildrenData(children, session.access_token);
      setAlerts(buildAlerts(children, childrenData));
      setSnapshots(buildChildSnapshots(children, childrenData));
      setRecentActivity(buildRecentActivity(children, childrenData));
      setTodayFocus(buildTodayFocus(children, childrenData));
    } catch {
      setAlerts([]);
      setSnapshots([]);
      setRecentActivity([]);
      setTodayFocus({ sessionsToday: 0, unpaidUrgent: 0, unpaidUrgentAmount: 0, recentAbsences: 0, newGrades: 0 });
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, children]);

  useEffect(() => {
    // Only fetch once when children are loaded
    if (children?.length > 0 && !fetchedRef.current) {
      fetchedRef.current = true;
      aggregate();
    }
  }, [children, aggregate]);

  return { alerts, snapshots, recentActivity, todayFocus, loading, refresh: aggregate };
}

