const INTERNAL_ROUTE_PATTERNS = [/^\/admin(\/|$)/, /^\/teacher(\/|$)/];
const STUDENT_ROUTE_PATTERN = /^\/student(\/|$)/;
const PARENT_ROUTE_PATTERN = /^\/parent(\/|$)/;

export function getRoleCode(profile) {
  return profile?.roles?.code || null;
}

export function resolveChatMode({ pathname = '/', roleCode = null, isAuthenticated = false }) {
  if (INTERNAL_ROUTE_PATTERNS.some(pattern => pattern.test(pathname))) {
    return 'internal';
  }

  if (PARENT_ROUTE_PATTERN.test(pathname) || roleCode === 'PARENT') {
    return 'parent-guidance';
  }

  if (STUDENT_ROUTE_PATTERN.test(pathname) || (isAuthenticated && roleCode === 'STUDENT')) {
    return 'student-guidance';
  }

  return 'public-marketing';
}

export function shouldSuppressChatWidget({ pathname = '/', roleCode = null, isAuthenticated = false }) {
  return resolveChatMode({ pathname, roleCode, isAuthenticated }) === 'internal';
}
