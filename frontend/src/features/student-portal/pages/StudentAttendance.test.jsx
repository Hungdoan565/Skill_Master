// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, Simulate } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';

const { mockUseStudentAttendance, mockRefresh } = vi.hoisted(() => ({
  mockUseStudentAttendance: vi.fn(),
  mockRefresh: vi.fn(),
}));

vi.mock('../hooks', () => ({
  useStudentAttendance: () => mockUseStudentAttendance(),
}));

import { StudentAttendance } from './StudentAttendance';

function buildRecords() {
  return Array.from({ length: 12 }).map((_, idx) => ({
    id: `a-${idx + 1}`,
    status: idx < 4 ? 'present' : idx < 8 ? 'late' : 'absent',
    notes: idx % 3 === 0 ? 'Có ghi chú' : null,
    check_in_time: '08:00:00',
    session_date: `2026-03-${String((idx % 10) + 1).padStart(2, '0')}`,
    class_id: 'c1',
    class_name: 'LT25JAVA-1225-01',
    class_code: 'JAVA-01',
    course_title: 'Java - Căn bản',
  }));
}

function findButtonByText(container, text) {
  return Array.from(container.querySelectorAll('button')).find((btn) =>
    (btn.textContent || '').includes(text)
  );
}

describe('StudentAttendance page interactions', () => {
  let container;
  let root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    mockRefresh.mockReset();
    mockUseStudentAttendance.mockReset();
    mockUseStudentAttendance.mockReturnValue({
      records: buildRecords(),
      classSummaries: [
        {
          classId: 'c1',
          className: 'LT25JAVA-1225-01',
          totalSessions: 12,
          attendanceRate: 66.7,
        },
      ],
      statistics: {
        attendanceRate: 66.7,
        totalSessions: 12,
        presentCount: 4,
        absentCount: 4,
        lateCount: 4,
        excusedCount: 0,
      },
      loading: false,
      error: null,
      refresh: mockRefresh,
    });

    if (!window.matchMedia) {
      window.matchMedia = () => ({
        matches: false,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      });
    }

    if (!globalThis.ResizeObserver) {
      globalThis.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      };
    }

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    document.body.innerHTML = '';
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  async function renderPage() {
    await act(async () => {
      root.render(<StudentAttendance />);
    });
  }

  it('renders layered hierarchy sections', async () => {
    await renderPage();
    expect(container.textContent).toContain('Biểu đồ chuyên cần');
    expect(container.textContent).toContain('Lịch sử điểm danh');
    expect(container.textContent).toContain('Theo lớp học');
  });

  it('supports history pagination controls', async () => {
    await renderPage();
    expect(container.textContent).toContain('Hiển thị 1-10 / 12 bản ghi');

    const nextButton = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.querySelector('svg') && !btn.textContent && !btn.disabled
    );
    expect(nextButton).toBeTruthy();

    await act(async () => {
      Simulate.click(nextButton);
    });

    expect(container.textContent).toContain('Hiển thị 11-12 / 12 bản ghi');
  });

  it('shows filtered-empty state and reset flow via status focus', async () => {
    await renderPage();

    const excusedButton = findButtonByText(container, 'Có phép');
    expect(excusedButton).toBeTruthy();

    await act(async () => {
      Simulate.click(excusedButton);
    });

    expect(container.textContent).toContain('Không tìm thấy dữ liệu điểm danh');

    const resetButton = findButtonByText(container, 'Reset bộ lọc');
    expect(resetButton).toBeTruthy();

    await act(async () => {
      Simulate.click(resetButton);
    });

    expect(container.textContent).toContain('Hiển thị 1-10 / 12 bản ghi');
  });
});
