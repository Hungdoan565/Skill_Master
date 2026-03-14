// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, Simulate } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';

const { mockUseStudentGrades, mockRefresh } = vi.hoisted(() => ({
  mockUseStudentGrades: vi.fn(),
  mockRefresh: vi.fn(),
}));

vi.mock('../hooks', () => ({
  useStudentGrades: () => mockUseStudentGrades(),
}));

import { StudentGrades } from './StudentGrades';

const buildClassSummaries = () => {
  const buildRows = (prefix, classId, className, courseTitle, startScore) =>
    Array.from({ length: 6 }).map((_, index) => ({
      id: `${prefix}-${index + 1}`,
      grade_type: index % 2 === 0 ? 'midterm' : 'final',
      score: startScore + index * 0.2,
      weight: index % 2 === 0 ? 0.4 : 0.6,
      created_at: `2026-03-${String(index + 1).padStart(2, '0')}T10:00:00.000Z`,
      classId,
      className,
      courseTitle,
    }));

  return [
    {
      classId: 'c1',
      className: 'LT25JAVA-1225-01',
      courseTitle: 'Java - Căn bản',
      avgScore: 7.2,
      grades: buildRows('java', 'c1', 'LT25JAVA-1225-01', 'Java - Căn bản', 6.5),
    },
    {
      classId: 'c2',
      className: 'WEB-FULLSTACK-1225-01',
      courseTitle: 'Web Development Fullstack',
      avgScore: 8.1,
      grades: buildRows('web', 'c2', 'WEB-FULLSTACK-1225-01', 'Web Development Fullstack', 7.2),
    },
  ];
};

const defaultPayload = {
  classSummaries: buildClassSummaries(),
  statistics: {
    totalGrades: 12,
    overallAverage: 7.65,
    highestScore: 9.8,
    lowestScore: 5.5,
  },
  loading: false,
  error: null,
  refresh: mockRefresh,
};

function findButtonByText(container, text) {
  return Array.from(container.querySelectorAll('button')).find((button) =>
    (button.textContent || '').includes(text)
  );
}

describe('StudentGrades page interactions', () => {
  let container;
  let root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;

    mockRefresh.mockReset();
    mockUseStudentGrades.mockReset();
    mockUseStudentGrades.mockReturnValue(defaultPayload);

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
      root.render(<StudentGrades />);
    });
  }

  it('renders layered overview with grouped panel and detailed section', async () => {
    await renderPage();

    expect(container.textContent).toContain('Tổng quan theo lớp');
    expect(container.textContent).toContain('Chi tiết điểm');
    expect(container.textContent).toContain('Hiển thị 1-10 / 12 điểm');
  });

  it('supports grouped drill-down expand/collapse interactions', async () => {
    await renderPage();

    expect(container.textContent).not.toContain('Lọc theo lớp này');
    const groupButton = findButtonByText(container, 'LT25JAVA-1225-01');
    expect(groupButton).toBeTruthy();

    await act(async () => {
      groupButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('Lọc theo lớp này');
  });

  it('supports pagination interaction from page 1 to page 2', async () => {
    await renderPage();
    expect(container.textContent).toContain('Hiển thị 1-10 / 12 điểm');

    const nextButton = findButtonByText(container, 'Sau');
    expect(nextButton).toBeTruthy();

    await act(async () => {
      nextButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('Hiển thị 11-12 / 12 điểm');
  });

  it('shows filtered empty-state and reset action recovers results', async () => {
    await renderPage();
    const searchInput = container.querySelector('[data-testid="grades-search-input"]');
    expect(searchInput).toBeTruthy();

    await act(async () => {
      Simulate.change(searchInput, { target: { value: 'khong-ton-tai' } });
    });

    expect(container.textContent).toContain('Không tìm thấy điểm phù hợp');
    const resetButton = findButtonByText(container, 'Reset bộ lọc');
    expect(resetButton).toBeTruthy();

    await act(async () => {
      resetButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('12 kết quả');
  });
});
