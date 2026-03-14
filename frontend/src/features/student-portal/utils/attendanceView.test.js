import { describe, expect, it } from 'vitest';
import {
  buildCalendarGridDays,
  buildPeriodRange,
  deriveDayStatus,
  filterByStatus,
  paginateRecords,
  toDateKey,
} from './attendanceView';

describe('attendanceView utilities', () => {
  it('builds stable period ranges for 7d, 30d, and term', () => {
    const ref = new Date('2026-03-14T10:00:00.000Z');

    const d7 = buildPeriodRange('d7', ref);
    const d30 = buildPeriodRange('d30', ref);
    const term = buildPeriodRange('term', ref);

    expect(d7.startKey).toBe('2026-03-08');
    expect(d7.endKey).toBe('2026-03-14');
    expect(d30.startKey).toBe('2026-02-13');
    expect(term.startKey).toBe('2025-11-15');
  });

  it('derives day status with deterministic priority', () => {
    const today = new Date('2026-03-14T00:00:00.000Z');
    const targetDay = new Date('2026-03-12T00:00:00.000Z');

    const records = [
      { session_date: '2026-03-12', status: 'present' },
      { session_date: '2026-03-12', status: 'late' },
      { session_date: '2026-03-12', status: 'absent' },
    ];

    expect(deriveDayStatus(records, targetDay, today)).toBe('absent');
    expect(deriveDayStatus([], targetDay, today)).toBe('none');
    expect(deriveDayStatus(records, new Date('2026-03-20T00:00:00.000Z'), today)).toBe('future');
  });

  it('filters records by status and paginates correctly', () => {
    const records = Array.from({ length: 12 }).map((_, idx) => ({
      id: `r-${idx + 1}`,
      status: idx % 2 === 0 ? 'present' : 'late',
    }));

    const presentOnly = filterByStatus(records, 'present');
    expect(presentOnly).toHaveLength(6);

    const page1 = paginateRecords(records, 1, 10);
    const page2 = paginateRecords(records, 2, 10);

    expect(page1.startItem).toBe(1);
    expect(page1.endItem).toBe(10);
    expect(page2.startItem).toBe(11);
    expect(page2.endItem).toBe(12);
  });

  it('builds calendar grid aligned to full weeks', () => {
    const days = buildCalendarGridDays(new Date('2026-03-08'), new Date('2026-03-14'));
    expect(days.length % 7).toBe(0);
    expect(toDateKey(days[0])).toBe('2026-03-02');
    expect(toDateKey(days[days.length - 1])).toBe('2026-03-15');
  });
});
