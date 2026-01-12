import { z } from 'zod';

// Jam.dev URL validation
const jamDevUrlSchema = z
  .string()
  .url('Please enter a valid URL')
  .refine(
    (url) => url.includes('jam.dev'),
    'Evidence URL must be a jam.dev link'
  );

// Test case creation schema
export const createTestSchema = z.object({
  module_platform: z
    .string()
    .min(1, 'Module/Platform is required')
    .max(100, 'Module/Platform must be less than 100 characters'),
  test_case: z
    .string()
    .min(5, 'Test case must be at least 5 characters')
    .max(500, 'Test case must be less than 500 characters'),
  expected_result: z
    .string()
    .min(5, 'Expected result must be at least 5 characters')
    .max(1000, 'Expected result must be less than 1000 characters'),
  assigned_to: z
    .string()
    .min(1, 'Assigned to is required'),
});

export type CreateTestInput = z.infer<typeof createTestSchema>;

// Test result update schema (for QA)
export const updateTestResultSchema = z.object({
  status: z.enum(['pass', 'fail', 'escalated']),
  evidence_url: jamDevUrlSchema.optional().or(z.literal('')),
  notes: z.string().max(2000, 'Notes must be less than 2000 characters').optional(),
});

export type UpdateTestResultInput = z.infer<typeof updateTestResultSchema>;

// Create test from bug schema (for PM)
export const createTestFromBugSchema = z.object({
  assigned_to: z.string().min(1, 'Please select a tester'),
});

export type CreateTestFromBugInput = z.infer<typeof createTestFromBugSchema>;

// Bug report schema
export const reportBugSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  evidence_url: jamDevUrlSchema,
  notes: z.string().max(2000, 'Notes must be less than 2000 characters').optional(),
});

export type ReportBugInput = z.infer<typeof reportBugSchema>;

// Login schema
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
