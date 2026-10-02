import { z } from 'zod';

export const inputTypeSchema = z.enum([
  'feature_request',
  'user_story',
  'bug_report',
  'test_case_request',
  'regression_planning',
  'release_notes',
  'api_specification',
  'code_pr_summary',
  'general_engineering_note',
]);

export const outputModeSchema = z.enum([
  'full_analysis',
  'acceptance_criteria',
  'developer_checklist',
  'qa_test_cases',
  'bug_report',
  'regression_plan',
  'api_test_matrix',
  'gherkin_scenarios',
  'jira_ready',
  'pr_review_checklist',
  'release_risk',
  'qa_test_summary',
  'code_review_security',
  'daily_work_summary',
  'edge_case_analyzer',
]);

export const platformSchema = z.enum(['web', 'mobile', 'api', 'desktop', 'other']).optional();

export const environmentSchema = z.enum(['local', 'dev', 'qa', 'staging', 'production']).optional();

export const outputLanguageSchema = z.enum(['en', 'roman_urdu']).default('en');

export const devQAGenerateRequestSchema = z.object({
  rawInput: z
    .string()
    .min(5, { message: 'Input must be at least 5 characters long.' })
    .max(15000, { message: 'Input cannot exceed 15,000 characters.' }),
  inputType: inputTypeSchema,
  outputMode: outputModeSchema,
  projectContext: z.string().max(2000).optional(),
  platform: platformSchema,
  techStack: z.string().max(500).optional(),
  targetEnvironment: environmentSchema,
  outputLanguage: outputLanguageSchema,
});

export type ValidatedGenerateRequest = z.infer<typeof devQAGenerateRequestSchema>;
