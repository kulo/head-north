// API Response Types
// Comprehensive types for all API responses and data structures

// import type { ISODateString, Stage, Team } from "@omega/types";
import type { ApiError, ValidationError, ProcessingError } from "./error-types";

// ============================================================================
// Generic API Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: ResponseMetadata;
}

// ApiError is now imported from error-types.ts

export interface ResponseMetadata {
  timestamp: string;
  requestId?: string;
  version?: string;
}

// ============================================================================
// Validation and Processing Types
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

// ValidationError is now imported from error-types.ts

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}

export interface ProcessingResult<T = unknown> {
  success: boolean;
  data?: T;
  errors: ProcessingError[];
  warnings: ProcessingWarning[];
  metadata?: ProcessingMetadata;
}

// ProcessingError is now imported from error-types.ts

export interface ProcessingWarning {
  type: string;
  message: string;
  field?: string;
  value?: unknown;
}

export interface ProcessingMetadata {
  processedAt: string;
  processingTime: number;
  itemsProcessed: number;
  itemsSkipped: number;
  itemsFailed: number;
}

// ============================================================================
// Router and Route Types
// ============================================================================

export interface Router {
  stack: RouterLayer[];
  [key: string]: unknown;
}

export interface RouterLayer {
  methods: string[];
  path: string;
  name?: string;
  regexp: RegExp;
  [key: string]: unknown;
}

export interface RouteDefinition {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  handler: string | RouteHandler;
  description: string;
}

export interface RouteHandler {
  (context: RouteContext): Promise<void> | void;
}

export interface RouteContext {
  method: string;
  url: string;
  path: string;
  query: Record<string, string>;
  params: Record<string, string>;
  headers: Record<string, string>;
  body?: unknown;
  [key: string]: unknown;
}

// ============================================================================
// Stage and Team Types
// ============================================================================

// Stage interface is now imported from @omega/types

// Re-export Team and Stage from @omega/types for backward compatibility
export type { Team, Stage } from "@omega/types";

// ============================================================================
// Collection and Processing Types
// ============================================================================

export interface CollectionResult<T = unknown> {
  items: T[];
  total: number;
  processed: number;
  skipped: number;
  failed: number;
  errors: CollectionError[];
}

export interface CollectionError {
  item: unknown;
  error: string;
  field?: string;
  index?: number;
}

// ============================================================================
// Parser and Processing Types
// ============================================================================

export interface ParserResult<T = unknown> {
  data: T;
  validations: ValidationResult;
  metadata: ParserMetadata;
}

export interface ParserMetadata {
  parsedAt: string;
  parserVersion: string;
  source: string;
  itemCount: number;
}

export interface LabelTranslation {
  [key: string]: string;
}

export interface ValidationDictionary {
  [category: string]: {
    [key: string]: ValidationRule;
  };
}

export interface ValidationRule {
  required: boolean;
  type: string;
  message: string;
  validator?: (value: unknown) => boolean;
}
