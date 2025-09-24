// API Response Types
// Comprehensive types for all API responses and data structures

// ============================================================================
// Generic API Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: ResponseMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

export interface ResponseMetadata {
  timestamp: string;
  requestId?: string;
  version?: string;
}

// ============================================================================
// Jira API Response Types
// ============================================================================

export interface JiraSprintData {
  sprints: JiraSprint[];
  total: number;
  startAt: number;
  maxResults: number;
}

export interface JiraSprint {
  id: string | number;
  name: string;
  state: "active" | "closed" | "future";
  startDate: string;
  endDate: string;
  originBoardId: number;
  goal?: string;
}

export interface JiraIssueData {
  issues: JiraIssue[];
  total: number;
  startAt: number;
  maxResults: number;
}

export interface JiraIssue {
  id: string;
  key: string;
  fields: JiraIssueFields;
  expand?: string;
}

export interface JiraIssueFields {
  summary: string;
  description?: string;
  status: JiraStatus;
  assignee: JiraUser | null;
  reporter?: JiraUser;
  effort?: number;
  externalRoadmap?: string;
  labels: string[];
  parent?: JiraParent;
  issuetype: JiraIssueType;
  area?: string;
  initiativeId?: string;
  url?: string;
  sprint?: JiraSprint | null;
  teams?: string[];
  areaIds?: string[];
  created?: string;
  updated?: string;
  resolution?: JiraResolution;
  priority?: JiraPriority;
  components?: JiraComponent[];
  fixVersions?: JiraVersion[];
  customfield_10020?: JiraSprint[]; // Sprint field
}

export interface JiraStatus {
  id: string;
  name: string;
  statusCategory: JiraStatusCategory;
}

export interface JiraStatusCategory {
  id: number;
  key: string;
  colorName: string;
  name: string;
}

export interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress?: string;
  avatarUrls?: Record<string, string>;
  active: boolean;
  timeZone?: string;
}

export interface JiraParent {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: JiraStatus;
  };
}

export interface JiraIssueType {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  subtask: boolean;
}

export interface JiraResolution {
  id: string;
  name: string;
  description?: string;
}

export interface JiraPriority {
  id: string;
  name: string;
  iconUrl?: string;
}

export interface JiraComponent {
  id: string;
  name: string;
  description?: string;
}

export interface JiraVersion {
  id: string;
  name: string;
  description?: string;
  released: boolean;
  releaseDate?: string;
}

// ============================================================================
// Validation and Processing Types
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}

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

export interface ProcessingError {
  type: string;
  message: string;
  field?: string;
  value?: unknown;
  stack?: string;
}

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

export interface Stage {
  id: string;
  name: string;
  description?: string;
  category: "internal" | "external";
  order: number;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  areaId?: string;
  areaName?: string;
  members?: TeamMember[];
}

export interface TeamMember {
  accountId: string;
  displayName: string;
  role?: string;
  active: boolean;
}

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
