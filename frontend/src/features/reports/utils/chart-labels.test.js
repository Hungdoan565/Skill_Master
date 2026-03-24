import { describe, expect, it } from 'vitest';

import * as reportUtils from './index';

describe('report chart label utilities', () => {
  it('repairs corrupted pass-rate labels and keeps outcomes readable', () => {
    expect(reportUtils.normalizePassRateLabel('Äáº¡t')).toBe('Đạt');
    expect(reportUtils.normalizePassRateLabel('KhÃ´ng Äáº¡t')).toBe('Không đạt');
    expect(reportUtils.normalizePassRateLabel('pass')).toBe('Đạt');
    expect(reportUtils.normalizePassRateLabel('failed')).toBe('Không đạt');
  });

  it('repairs corrupted attendance labels and maps status keys to Vietnamese labels', () => {
    expect(reportUtils.normalizeAttendanceStatusLabel('CÃ³ máº·t')).toBe('Có mặt');
    expect(reportUtils.normalizeAttendanceStatusLabel('Trá»')).toBe('Trễ');
    expect(reportUtils.normalizeAttendanceStatusLabel('excused')).toBe('Có phép');
    expect(reportUtils.normalizeAttendanceStatusLabel('absent')).toBe('Vắng');
  });

  it('normalizes chart entries without mutating the source array', () => {
    const source = [
      { name: 'KhÃ´ng Äáº¡t', value: 2, color: '#ef4444' },
      { name: 'pass', value: 5, color: '#22c55e' },
    ];

    const normalized = reportUtils.normalizeChartData(source, reportUtils.normalizePassRateLabel);

    expect(normalized).toEqual([
      { name: 'Không đạt', value: 2, color: '#ef4444' },
      { name: 'Đạt', value: 5, color: '#22c55e' },
    ]);
    expect(source).toEqual([
      { name: 'KhÃ´ng Äáº¡t', value: 2, color: '#ef4444' },
      { name: 'pass', value: 5, color: '#22c55e' },
    ]);
  });
});
