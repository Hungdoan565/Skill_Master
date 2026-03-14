import { describe, expect, it } from 'vitest';
import {
  formatScheduleRange,
  getCalendarGridRange,
  getEmptyScheduleMessage,
  getScheduleRange,
  getToolbarState,
} from './scheduleState';

const localDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

describe('getScheduleRange', () => {
  it('returns Monday-Sunday boundaries for week view', () => {
    const date = new Date('2026-03-14T10:00:00'); // Saturday
    const { startDate, endDate } = getScheduleRange(date, 'week');

    expect(localDateKey(startDate)).toBe('2026-03-09');
    expect(localDateKey(endDate)).toBe('2026-03-15');
  });

  it('returns strict month boundaries for month query range', () => {
    const date = new Date('2026-03-14T10:00:00');
    const { startDate, endDate } = getScheduleRange(date, 'month');

    expect(localDateKey(startDate)).toBe('2026-03-01');
    expect(localDateKey(endDate)).toBe('2026-03-31');
  });

  it('returns expanded boundaries for month grid rendering', () => {
    const date = new Date('2026-03-14T10:00:00');
    const { startDate, endDate } = getCalendarGridRange(date, 'month');

    expect(localDateKey(startDate)).toBe('2026-02-23');
    expect(localDateKey(endDate)).toBe('2026-04-05');
  });
});

describe('formatScheduleRange', () => {
  it('formats week range text with day-month and full end date', () => {
    const date = new Date('2026-03-14T10:00:00');
    const text = formatScheduleRange(date, 'week');
    expect(text).toMatch(/09[/-]03/);
    expect(text).toMatch(/15[/-]03[/-]2026/);
  });
});

describe('getToolbarState', () => {
  it('disables export when no sessions', () => {
    const state = getToolbarState({ sessions: [], loading: false, notificationSupported: true });
    expect(state.canExport).toBe(false);
    expect(state.exportDisabledReason).toContain('Không có buổi học');
  });

  it('disables notification toggle when unsupported', () => {
    const state = getToolbarState({ sessions: [{}], loading: false, notificationSupported: false });
    expect(state.canToggleNotifications).toBe(false);
    expect(state.notificationDisabledReason).toContain('không hỗ trợ');
  });
});

describe('getEmptyScheduleMessage', () => {
  it('returns class-specific empty message for selected class', () => {
    const message = getEmptyScheduleMessage({ classFilter: 'cls-1', selectedClassName: 'Lớp A' });
    expect(message).toContain('Lớp A');
  });

  it('returns generic empty message for all classes filter', () => {
    const message = getEmptyScheduleMessage({ classFilter: 'all' });
    expect(message).toContain('Không có buổi học');
  });
});
