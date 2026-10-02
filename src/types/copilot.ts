export type InputType =
  | 'feature_request'
  | 'user_story'
  | 'bug_report'
  | 'test_case_request'
  | 'regression_planning'
  | 'release_notes'
  | 'api_specification'
  | 'code_pr_summary'
  | 'general_engineering_note';

export type OutputMode =
  | 'full_analysis'
  | 'acceptance_criteria'
  | 'developer_checklist'
  | 'qa_test_cases'
  | 'bug_report'
  | 'regression_plan'
  | 'api_test_matrix'
  | 'gherkin_scenarios'
  | 'jira_ready'
  | 'pr_review_checklist'
  | 'release_risk'
  | 'qa_test_summary'
  | 'code_review_security'
  | 'daily_work_summary'
  | 'edge_case_analyzer';

export type PlatformType = 'web' | 'mobile' | 'api' | 'desktop' | 'other';

export type EnvironmentType = 'local' | 'dev' | 'qa' | 'staging' | 'production';

export type OutputLanguage = 'en' | 'roman_urdu';

export interface DevQAGenerateRequest {
  rawInput: string;
  inputType: InputType;
  outputMode: OutputMode;
  projectContext?: string;
  platform?: PlatformType;
  techStack?: string;
  targetEnvironment?: EnvironmentType;
  outputLanguage?: OutputLanguage;
}

export interface DevQAGenerateResponse {
  id: string;
  requestId: string;
  timestamp: string;
  outputMode: OutputMode;
  markdownOutput: string;
  meta: {
    modelUsed: string;
    tokensUsed?: number;
    processingTimeMs: number;
    isMock?: boolean;
    warnings?: string[];
  };
}

export interface DevQAErrorResponse {
  error: {
    code: 'INVALID_INPUT' | 'SECRET_DETECTED' | 'RATE_LIMIT_EXCEEDED' | 'PROVIDER_ERROR' | 'TIMEOUT';
    message: string;
    requestId: string;
    details?: Record<string, unknown>;
  };
}
