// Error Handling Types
// Comprehensive error types for better error handling and debugging

// ============================================================================
// Base Error Types
// ============================================================================

export interface BaseError {
  code: string;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  stack?: string;
}

export interface ValidationError extends BaseError {
  code: "VALIDATION_ERROR";
  field?: string;
  value?: unknown;
  expected?: string;
}

export interface ApiError extends BaseError {
  code: "API_ERROR";
  statusCode?: number;
  endpoint?: string;
  method?: string;
}

export interface JiraError extends BaseError {
  code:
    | "JIRA_ERROR"
    | "JIRA_AUTHENTICATION_ERROR"
    | "JIRA_RATE_LIMIT_ERROR"
    | "JIRA_NOT_FOUND_ERROR"
    | "JIRA_PERMISSION_ERROR";
  jiraErrorCode?: string;
  jiraErrorMessage?: string;
  jiraEndpoint?: string;
}

export interface ConfigurationError extends BaseError {
  code: "CONFIGURATION_ERROR";
  configKey?: string;
  configValue?: unknown;
}

export interface ProcessingError extends BaseError {
  code: "PROCESSING_ERROR";
  itemId?: string;
  itemType?: string;
  processingStep?: string;
}

// ============================================================================
// Error Result Types
// ============================================================================

export interface ErrorResult<T = unknown> {
  success: false;
  error: BaseError;
  data?: T;
  metadata?: ErrorMetadata;
}

export interface SuccessResult<T = unknown> {
  success: true;
  data: T;
  metadata?: SuccessMetadata;
}

export type Result<T = unknown> = SuccessResult<T> | ErrorResult<T>;

export interface ErrorMetadata {
  requestId?: string;
  userId?: string;
  timestamp: string;
  duration?: number;
  retryCount?: number;
  lastRetryAt?: string;
}

export interface SuccessMetadata {
  requestId?: string;
  userId?: string;
  timestamp: string;
  duration?: number;
  itemCount?: number;
  processedCount?: number;
  skippedCount?: number;
}

// ============================================================================
// Error Handler Types
// ============================================================================

export interface ErrorHandler<T = unknown> {
  (error: unknown, context?: Record<string, unknown>): ErrorResult<T>;
}

export interface ErrorHandlerMap {
  [errorType: string]: ErrorHandler;
}

export interface ErrorContext {
  operation: string;
  userId?: string;
  requestId?: string;
  timestamp: string;
  additionalData?: Record<string, unknown>;
}

// ============================================================================
// Jira-Specific Error Types
// ============================================================================

export interface JiraAuthenticationError extends JiraError {
  code: "JIRA_AUTHENTICATION_ERROR";
  jiraErrorCode: "AUTHENTICATION_FAILED";
}

export interface JiraRateLimitError extends JiraError {
  code: "JIRA_RATE_LIMIT_ERROR";
  jiraErrorCode: "RATE_LIMIT_EXCEEDED";
  retryAfter?: number;
}

export interface JiraNotFoundError extends JiraError {
  code: "JIRA_NOT_FOUND_ERROR";
  jiraErrorCode: "NOT_FOUND";
  resourceType?: string;
  resourceId?: string;
}

export interface JiraPermissionError extends JiraError {
  code: "JIRA_PERMISSION_ERROR";
  jiraErrorCode: "PERMISSION_DENIED";
  requiredPermission?: string;
}

// ============================================================================
// Validation Error Types
// ============================================================================

export interface FieldValidationError extends ValidationError {
  field: string;
  value: unknown;
  rule: string;
  message: string;
}

export interface SchemaValidationError extends ValidationError {
  schema: string;
  violations: FieldValidationError[];
}

export interface BusinessRuleValidationError extends ValidationError {
  rule: string;
  businessContext: Record<string, unknown>;
}

// ============================================================================
// Processing Error Types
// ============================================================================

export interface DataProcessingError extends ProcessingError {
  dataSource: string;
  dataType: string;
  processingStage: "EXTRACTION" | "TRANSFORMATION" | "LOADING" | "VALIDATION";
}

export interface ParserError extends ProcessingError {
  parserType: string;
  inputData?: unknown;
  expectedFormat?: string;
}

export interface TransformationError extends ProcessingError {
  transformationType: string;
  inputValue?: unknown;
  outputValue?: unknown;
}

// ============================================================================
// Error Recovery Types
// ============================================================================

export interface ErrorRecoveryStrategy {
  type: "RETRY" | "FALLBACK" | "SKIP" | "FAIL";
  maxRetries?: number;
  retryDelay?: number;
  fallbackData?: unknown;
  skipCondition?: (error: BaseError) => boolean;
}

export interface ErrorRecoveryResult<T = unknown> {
  success: boolean;
  data?: T;
  recoveryStrategy: ErrorRecoveryStrategy;
  attempts: number;
  finalError?: BaseError;
}

// ============================================================================
// Error Reporting Types
// ============================================================================

export interface ErrorReport {
  error: BaseError;
  context: ErrorContext;
  recovery?: ErrorRecoveryResult;
  metadata: ErrorMetadata;
}

export interface ErrorSummary {
  totalErrors: number;
  errorTypes: Record<string, number>;
  mostCommonError: string;
  errorRate: number;
  timeRange: {
    start: string;
    end: string;
  };
}

// ============================================================================
// Error Factory Types
// ============================================================================

export interface ErrorFactory {
  createValidationError(
    field: string,
    value: unknown,
    message: string,
  ): ValidationError;
  createApiError(
    message: string,
    statusCode?: number,
    endpoint?: string,
  ): ApiError;
  createJiraError(
    message: string,
    jiraErrorCode?: string,
    jiraEndpoint?: string,
  ): JiraError;
  createConfigurationError(
    configKey: string,
    configValue: unknown,
    message: string,
  ): ConfigurationError;
  createProcessingError(
    message: string,
    itemId?: string,
    itemType?: string,
  ): ProcessingError;
}

// ============================================================================
// Error Handler Configuration
// ============================================================================

export interface ErrorHandlerConfig {
  enableRetry: boolean;
  maxRetries: number;
  retryDelay: number;
  enableFallback: boolean;
  enableLogging: boolean;
  enableMetrics: boolean;
  errorThreshold: number;
}

export interface ErrorHandlerOptions {
  context?: ErrorContext;
  recovery?: ErrorRecoveryStrategy;
  config?: ErrorHandlerConfig;
}
