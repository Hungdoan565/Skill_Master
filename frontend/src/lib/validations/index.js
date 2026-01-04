/**
 * Validations Library - Index
 * 
 * Central export for all validation schemas
 * Usage: import { studentSchema, fields } from '@/lib/validations';
 */

export {
  // Common utilities
  errorMessages,
  fields,
  
  // Student schemas
  studentSchema,
  createStudentSchema,
  updateStudentSchema,
  
  // Staff schemas
  staffSchema,
  createStaffSchema,
  updateStaffSchema,
  
  // Course schemas
  courseSchema,
  
  // Class schemas
  classSchema,
  
  // Enrollment schemas
  enrollmentSchema,
  trialEnrollmentSchema,
  convertTrialSchema,
  
  // Waiting List schemas
  waitingListSchema,
  completeWaitingListSchema,
  notifyWaitingListSchema,
  
  // Invoice schemas
  invoiceSchema,
  
  // Center schemas
  centerSchema,
  
  // Room schemas
  roomSchema,
  
  // Auth schemas
  loginSchema,
  registerSchema,
  changePasswordSchema,
  
  // Contact schemas
  contactSchema,
} from './schemas';
