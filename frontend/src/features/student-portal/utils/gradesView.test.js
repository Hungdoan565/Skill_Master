import { describe, expect, it } from 'vitest';
import {
  filterGrades,
  flattenClassSummaries,
  groupByClass,
  groupByTranscriptPeriod,
  nextSortConfig,
  paginateRecords,
  sortGrades,
  toggleExpandedGroupState,
} from './gradesView';

const classSummaries = [
  {
    classId: 'c1',
    className: 'LT25JAVA-1225-01',
    courseTitle: 'Java Can Ban',
    grades: [
      { id: 'g1', grade_type: 'midterm', score: 7.5, weight: 0.4, created_at: '2025-11-12T10:00:00.000Z' },
      { id: 'g2', grade_type: 'final', score: 8.5, weight: 0.6, created_at: '2025-12-15T10:00:00.000Z' },
    ],
  },
  {
    classId: 'c2',
    className: 'WEB-FULLSTACK-1225-01',
    courseTitle: 'Web Development Fullstack',
    grades: [
      { id: 'g3', grade_type: 'quiz_15', score: 5.5, weight: 0.2, created_at: '2026-02-10T10:00:00.000Z' },
      { id: 'g4', grade_type: 'final', score: 9.2, weight: 0.8, created_at: '2026-04-01T10:00:00.000Z' },
    ],
  },
];

describe('gradesView utilities', () => {
  it('flattens class summaries and preserves class metadata', () => {
    const rows = flattenClassSummaries(classSummaries);
    expect(rows).toHaveLength(4);
    expect(rows[0].className).toBe('LT25JAVA-1225-01');
    expect(rows[2].classId).toBe('c2');
  });

  it('filters by class/course/type fields', () => {
    const rows = flattenClassSummaries(classSummaries).map((row) => ({
      ...row,
      gradeTypeLabel: row.grade_type,
    }));

    const filteredByClass = filterGrades(rows, 'fullstack');
    expect(filteredByClass).toHaveLength(2);

    const filteredByType = filterGrades(rows, 'midterm');
    expect(filteredByType).toHaveLength(1);
    expect(filteredByType[0].id).toBe('g1');
  });

  it('sorts by score and date with deterministic order', () => {
    const rows = flattenClassSummaries(classSummaries).map((row) => ({
      ...row,
      gradeTypeLabel: row.grade_type,
    }));

    const byScoreDesc = sortGrades(rows, { key: 'score', order: 'desc' });
    expect(byScoreDesc[0].id).toBe('g4');

    const byDateAsc = sortGrades(rows, { key: 'date', order: 'asc' });
    expect(byDateAsc[0].id).toBe('g1');
  });

  it('paginates rows and returns visible count metadata', () => {
    const rows = flattenClassSummaries(classSummaries);
    const page1 = paginateRecords(rows, 1, 3);
    expect(page1.pageItems).toHaveLength(3);
    expect(page1.startItem).toBe(1);
    expect(page1.endItem).toBe(3);
    expect(page1.totalPages).toBe(2);

    const page2 = paginateRecords(rows, 2, 3);
    expect(page2.pageItems).toHaveLength(1);
    expect(page2.startItem).toBe(4);
    expect(page2.endItem).toBe(4);
  });

  it('groups by class for collapsed drill-down summaries', () => {
    const rows = flattenClassSummaries(classSummaries);
    const groups = groupByClass(rows);
    expect(groups).toHaveLength(2);

    const javaGroup = groups.find((group) => group.classId === 'c1');
    expect(javaGroup.totalGrades).toBe(2);
    expect(javaGroup.average).toBe(8);
  });

  it('groups rows by transcript period', () => {
    const rows = flattenClassSummaries(classSummaries);
    const groups = groupByTranscriptPeriod(rows);
    const periods = groups.map((group) => group.period);

    expect(periods).toContain('Hoc ky 1 2025-2026');
    expect(periods).toContain('Hoc ky 2 2025-2026');
  });

  it('toggles group expansion state for drill-down interactions', () => {
    const firstToggle = toggleExpandedGroupState({}, 'c1');
    expect(firstToggle.c1).toBe(true);

    const secondToggle = toggleExpandedGroupState(firstToggle, 'c1');
    expect(secondToggle.c1).toBe(false);
  });

  it('computes next sort state to keep sorting interactions deterministic', () => {
    const initial = { key: 'date', order: 'desc' };
    const sameKey = nextSortConfig(initial, 'date');
    expect(sameKey).toEqual({ key: 'date', order: 'asc' });

    const newKey = nextSortConfig(sameKey, 'score');
    expect(newKey).toEqual({ key: 'score', order: 'desc' });
  });
});
