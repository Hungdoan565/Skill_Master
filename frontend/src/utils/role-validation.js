/**
 * ROLE VALIDATION UTILITY
 * 
 * Purpose: Detect and handle role-email mismatches in user profiles
 * 
 * IMPORTANT SECURITY NOTES:
 * - This validation is for DISPLAY and LOGGING purposes ONLY
 * - DO NOT use validated roles for authorization decisions
 * - ProtectedRoute and backend MUST always use database roles
 * - This is a safety net to detect database corruption, not a security layer
 */

/**
 * Email pattern definitions for role detection
 */
const EMAIL_PATTERNS = {
  SUPER_ADMIN: [
    'admin@skillmaster.com',
    'admin@skillmaster.edu.vn',
    /.*admin.*@skillmaster\.(com|edu\.vn)$/i,
  ],
  ADMIN: [
    /.*admin.*/i,
    /@skillmaster\.edu\.vn$/i,
  ],
  TEACHER: [
    /.*teacher.*/i,
    /.*gv.*/i, // giáo viên
  ],
  STUDENT: [
    /.*student.*/i,
    /.*hv.*/i, // học viên
  ],
};

/**
 * Check if email matches a pattern
 */
function matchesPattern(email, patterns) {
  if (!email) return false;
  
  return patterns.some(pattern => {
    if (typeof pattern === 'string') {
      return email.toLowerCase() === pattern.toLowerCase();
    }
    if (pattern instanceof RegExp) {
      return pattern.test(email);
    }
    return false;
  });
}

/**
 * Detect expected role based on email pattern
 */
export function detectExpectedRole(email) {
  if (!email) return null;
  
  // Check SUPER_ADMIN first (most specific)
  if (matchesPattern(email, EMAIL_PATTERNS.SUPER_ADMIN)) {
    return 'SUPER_ADMIN';
  }
  
  // Check general admin patterns
  if (matchesPattern(email, EMAIL_PATTERNS.ADMIN)) {
    return 'SUPER_ADMIN'; // Default admin to SUPER_ADMIN
  }
  
  // Check teacher
  if (matchesPattern(email, EMAIL_PATTERNS.TEACHER)) {
    return 'TEACHER';
  }
  
  // Check student
  if (matchesPattern(email, EMAIL_PATTERNS.STUDENT)) {
    return 'STUDENT';
  }
  
  return null; // No pattern matched
}

/**
 * Validate profile role against email pattern
 * 
 * @param {Object} profile - User profile from database
 * @param {Object} user - Auth user object
 * @returns {Object} Validated profile with potential override
 */
export function validateProfileRole(profile, user) {
  // Return null if inputs are invalid
  if (!profile || !user) return profile;
  
  const email = user.email || '';
  const profileRole = profile?.roles?.code;
  
  // If no profile role, return as is (other fallbacks will handle)
  if (!profileRole) return profile;
  
  // Detect expected role from email
  const expectedRole = detectExpectedRole(email);
  
  // If no pattern matched, trust database
  if (!expectedRole) return profile;
  
  // Check for mismatch
  const isMismatch = profileRole !== expectedRole;
  
  if (isMismatch) {
    console.error(
      '╔════════════════════════════════════════════════════════════╗',
      '\n║ 🚨 ROLE MISMATCH DETECTED - DATABASE CORRUPTION           ║',
      '\n╠════════════════════════════════════════════════════════════╣',
      `\n║ Email:          ${email.padEnd(40)}║`,
      `\n║ Database Role:  ${profileRole.padEnd(40)}║`,
      `\n║ Expected Role:  ${expectedRole.padEnd(40)}║`,
      '\n╠════════════════════════════════════════════════════════════╣',
      '\n║ ACTION REQUIRED:                                           ║',
      '\n║ Run database/scripts/fix_admin_role_comprehensive.sql     ║',
      '\n╚════════════════════════════════════════════════════════════╝'
    );
    
    // Return profile with display override (for UI only)
    return {
      ...profile,
      _validationWarning: true,
      _mismatch: {
        email,
        databaseRole: profileRole,
        expectedRole,
        timestamp: new Date().toISOString(),
      },
      // Override display role (UI ONLY - not for authorization!)
      roles: {
        ...profile.roles,
        code: expectedRole,
        name: getRoleName(expectedRole),
        _override: true,
      },
    };
  }
  
  // No mismatch - return profile as is
  return profile;
}

/**
 * Get human-readable role name
 */
function getRoleName(roleCode) {
  const roleNames = {
    SUPER_ADMIN: 'Super Admin (Validated)',
    CENTER_MANAGER: 'Center Manager (Validated)',
    TEACHER: 'Giáo viên (Validated)',
    STUDENT: 'Học viên (Validated)',
  };
  return roleNames[roleCode] || roleCode;
}

/**
 * Check if profile has validation warning
 */
export function hasValidationWarning(profile) {
  return profile?._validationWarning === true;
}

/**
 * Get validation warning details
 */
export function getValidationWarning(profile) {
  return profile?._mismatch || null;
}

/**
 * Safe role getter - always returns database role for authorization
 * Use this in ProtectedRoute and authorization checks
 */
export function getDatabaseRole(profile) {
  // Always return the actual database role, not the override
  if (profile?._mismatch) {
    return profile._mismatch.databaseRole;
  }
  return profile?.roles?.code || null;
}

/**
 * Display role getter - can use validated role for UI
 * Use this in UI components for display purposes only
 */
export function getDisplayRole(profile) {
  return profile?.roles?.code || null;
}

