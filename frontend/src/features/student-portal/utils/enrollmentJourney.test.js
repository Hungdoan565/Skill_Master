import { describe, expect, it } from 'vitest';
import {
  getClassActionState,
  getJourneyStatusMeta,
  resolveJourneyStatus,
  splitJourneyGroups,
} from './enrollmentJourney';

describe('resolveJourneyStatus', () => {
  it('prioritizes enrollment status over request status', () => {
    const status = resolveJourneyStatus({
      enrollmentStatus: 'active',
      requestStatus: 'pending',
    });

    expect(status).toBe('enrolled');
  });

  it('falls back to request status when enrollment is missing', () => {
    const status = resolveJourneyStatus({ requestStatus: 'waitlisted' });
    expect(status).toBe('waitlisted');
  });
});

describe('getJourneyStatusMeta', () => {
  it('returns processing group for pending status', () => {
    const meta = getJourneyStatusMeta('pending');
    expect(meta.label).toBe('Chờ duyệt');
    expect(meta.group).toBe('processing');
  });
});

describe('getClassActionState', () => {
  it('returns enrolled badge for enrolled status', () => {
    const action = getClassActionState({ status: 'enrolled', isFull: false });
    expect(action.type).toBe('badge');
    expect(action.label).toBe('Đã đăng ký');
  });

  it('returns waitlist button when class is full and no existing status', () => {
    const action = getClassActionState({ status: null, isFull: true });
    expect(action.type).toBe('button');
    expect(action.mode).toBe('waitlist');
  });
});

describe('splitJourneyGroups', () => {
  it('splits rows into processing and history groups', () => {
    const grouped = splitJourneyGroups([
      { id: 'j1', requestStatus: 'pending' },
      { id: 'j2', enrollmentStatus: 'completed' },
    ]);

    expect(grouped.processing).toHaveLength(1);
    expect(grouped.history).toHaveLength(1);
    expect(grouped.processing[0].status).toBe('pending');
    expect(grouped.history[0].status).toBe('completed');
  });
});
