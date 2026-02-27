import { z } from 'zod';

// ============================================================
// Certificate Issuance Wizard Schemas
// ============================================================

// Step 1: Type + Student selection
export const stepSelectSchema = z.object({
  certificateTypeId: z.string().uuid('Vui lòng chọn loại chứng chỉ'),
  studentIds: z.array(z.string().uuid()).min(1, 'Vui lòng chọn ít nhất 1 học viên'),
  overrideReasons: z.record(z.string().uuid(), z.string()).optional(),
});

// Step 2: Score input — dynamic based on scoreConfig.type
export const gradeScoreSchema = z.object({
  grade: z.string().min(1, 'Vui lòng chọn xếp loại'),
  notes: z.string().optional(),
});

export const bandScoreSchema = z.object({
  overall: z.number().min(0).max(9).multipleOf(0.5, 'Điểm band phải là bội số 0.5'),
  listening: z.number().min(0).max(9).multipleOf(0.5).optional(),
  reading: z.number().min(0).max(9).multipleOf(0.5).optional(),
  writing: z.number().min(0).max(9).multipleOf(0.5).optional(),
  speaking: z.number().min(0).max(9).multipleOf(0.5).optional(),
  notes: z.string().optional(),
});

export const numericScoreSchema = z.object({
  total: z.number().min(0, 'Điểm không được âm'),
  subScores: z.record(z.string(), z.number()).optional(),
  notes: z.string().optional(),
});

// Step 2 container: map of studentId -> scores
export const stepScoresSchema = z.object({
  scores: z.record(z.string().uuid(), z.union([gradeScoreSchema, bandScoreSchema, numericScoreSchema])),
});

// Step 3: Preview options
export const stepPreviewSchema = z.object({
  showQR: z.boolean().default(true),
  showSerial: z.boolean().default(true),
  sendEmail: z.boolean().default(true),
});

// Combined wizard schema
export const issuanceWizardSchema = z.object({
  ...stepSelectSchema.shape,
  ...stepScoresSchema.shape,
  ...stepPreviewSchema.shape,
});

// ============================================================
// External Certificate Recording Schema
// ============================================================
export const recordExternalSchema = z.object({
  studentId: z.string().uuid('Vui lòng chọn học viên'),
  certificateTypeId: z.string().uuid('Vui lòng chọn loại chứng chỉ'),
  externalId: z.string().min(1, 'Vui lòng nhập mã chứng chỉ'),
  examDate: z.string().min(1, 'Vui lòng chọn ngày thi'),
  scores: z.record(z.string(), z.union([z.number(), z.string()])),
  externalVerifyUrl: z.string().url('URL không hợp lệ').optional().or(z.literal('')),
  fileUrl: z.string().optional(),
  notes: z.string().optional(),
});

// ============================================================
// Approval Schemas
// ============================================================
export const rejectApprovalSchema = z.object({
  rejectionReason: z.string().min(5, 'Lý do từ chối phải có ít nhất 5 ký tự'),
});

// ============================================================
// Filter Schemas
// ============================================================
export const certificateFilterSchema = z.object({
  search: z.string().optional(),
  certificateTypeId: z.string().optional(),
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().default(20),
  sortBy: z.string().default('issued_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
