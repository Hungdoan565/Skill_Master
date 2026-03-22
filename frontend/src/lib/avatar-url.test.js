import { describe, expect, it } from 'vitest';

import { normalizeAvatarUrl } from './avatar-url';

describe('normalizeAvatarUrl', () => {
  it('returns null for empty values', () => {
    expect(normalizeAvatarUrl()).toBeNull();
    expect(normalizeAvatarUrl('')).toBeNull();
    expect(normalizeAvatarUrl('   ')).toBeNull();
  });

  it('preserves absolute and special URLs', () => {
    expect(normalizeAvatarUrl('https://cdn.example.com/avatar.png')).toBe('https://cdn.example.com/avatar.png');
    expect(normalizeAvatarUrl('http://cdn.example.com/avatar.png')).toBe('http://cdn.example.com/avatar.png');
    expect(normalizeAvatarUrl('//cdn.example.com/avatar.png')).toBe('//cdn.example.com/avatar.png');
    expect(normalizeAvatarUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
    expect(normalizeAvatarUrl('blob:https://example.com/id')).toBe('blob:https://example.com/id');
    expect(normalizeAvatarUrl('/uploads/avatar.png')).toBe('/uploads/avatar.png');
  });

  it('roots relative avatar paths so nested routes do not break them', () => {
    expect(normalizeAvatarUrl('uploads/avatar.png')).toBe('/uploads/avatar.png');
    expect(normalizeAvatarUrl('./uploads/avatar.png')).toBe('/uploads/avatar.png');
    expect(normalizeAvatarUrl('../uploads/avatar.png')).toBe('/uploads/avatar.png');
    expect(normalizeAvatarUrl('avatars/user.png?v=2')).toBe('/avatars/user.png?v=2');
  });
});
