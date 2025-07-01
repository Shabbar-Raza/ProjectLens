export interface ProjectFile {
  name: string;
  path: string;
  content: string;
  type: 'file' | 'directory';
  size?: number;
  children?: ProjectFile[];
  ignored?: boolean;
  category?: 'source' | 'config' | 'documentation' | 'build' | 'dependency';
}

export interface ParsedFunction {
  name: string;
  parameters: string[];
  returnType?: string;
  description?: string;
  line: number;
  isExported?: boolean;
  isAsync?: boolean;
}

export interface ParsedClass {
  name: string;
  methods: ParsedFunction[];
  properties: ParsedProperty[];
  description?: string;
  line: number;
  extends?: string;
  implements?: string[];
}

export interface ParsedProperty {
  name: string;
  type?: string;
  isStatic?: boolean;
  visibility?: 'public' | 'private' | 'protected';
}

export interface ParsedInterface {
  name: string;
  properties: ParsedProperty[];
  methods: ParsedFunction[];
  extends?: string[];
}

export interface ParsedImport {
  source: string;
  imports: string[];
  type: 'import' | 'require';
  isDefault?: boolean;
  isNamespace?: boolean;
}

export interface ParsedExport {
  name: string;
  type: 'function' | 'class' | 'variable' | 'default' | 'interface' | 'type';
  isDefault?: boolean;
}

export interface FileAnalysis {
  path: string;
  category: 'component' | 'service' | 'utility' | 'config' | 'type' | 'style' | 'test' | 'other';
  functions: ParsedFunction[];
  classes: ParsedClass[];
  interfaces: ParsedInterface[];
  imports: ParsedImport[];
  exports: ParsedExport[];
  comments: string[];
  framework?: 'react' | 'vue' | 'angular' | 'svelte' | 'node' | 'express' | 'nextjs';
  isEntryPoint?: boolean;
  complexity?: 'low' | 'medium' | 'high';
  content?: string; // Add content field for full code access
}

export interface DependencyInfo {
  name: string;
  version: string;
  category: 'framework' | 'ui' | 'utility' | 'build' | 'testing' | 'styling' | 'api' | 'other';
  description?: string;
}

export interface ProjectAnalysis {
  name: string;
  type: 'react' | 'vue' | 'angular' | 'node' | 'express' | 'nextjs' | 'python' | 'java' | 'other';
  structure: ProjectFile;
  files: FileAnalysis[];
  dependencies: DependencyInfo[];
  devDependencies: DependencyInfo[];
  packageInfo?: {
    name: string;
    version: string;
    description?: string;
    main?: string;
    scripts?: Record<string, string>;
  };
  entryPoints: string[];
  architecture: {
    patterns: string[];
    technologies: string[];
    buildTool?: string;
  };
}

export interface GeneratedDoc {
  content: string;
  aiOptimized: string;
  sections: {
    overview: string;
    architecture: string;
    structure: string;
    dependencies: string;
    components: string;
    dataFlow: string;
    gettingStarted: string;
  };
  metadata: {
    fileCount: number;
    componentCount: number;
    serviceCount: number;
    totalLines: number;
  };
}

export interface FilterOptions {
  includeTests: boolean;
  includeStyles: boolean;
  includeConfig: boolean;
  maxFileSize: number; // in KB
  customIgnore: string[];
}

// New Professional Documentation Types
export interface ProfessionalDocConfig {
  documentTypes: DocumentType[];
  standard: DocumentationStandard;
  outputFormat: OutputFormat;
  branding?: BrandingConfig;
  compliance?: ComplianceRequirement[];
}

export interface DocumentType {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  sections: DocumentSection[];
}

export interface DocumentSection {
  id: string;
  title: string;
  required: boolean;
  template: string;
  order: number;
}

export type DocumentationStandard = 
  | 'enterprise' 
  | 'engineering' 
  | 'opensource' 
  | 'corporate' 
  | 'startup';

export type OutputFormat = 
  | 'html' 
  | 'markdown' 
  | 'pdf' 
  | 'confluence' 
  | 'notion' 
  | 'sharepoint'
  | 'docx';

export interface BrandingConfig {
  companyName?: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  headerTemplate?: string;
  footerTemplate?: string;
}

export type ComplianceRequirement = 
  | 'gdpr' 
  | 'hipaa' 
  | 'sox' 
  | 'iso27001' 
  | 'pci-dss';

export interface ProfessionalDoc {
  id: string;
  title: string;
  content: string;
  sections: ProfessionalDocSection[];
  metadata: ProfessionalDocMetadata;
  config: ProfessionalDocConfig;
}

export interface ProfessionalDocSection {
  id: string;
  title: string;
  content: string;
  subsections?: ProfessionalDocSection[];
  diagrams?: DiagramData[];
  codeExamples?: CodeExample[];
}

export interface ProfessionalDocMetadata {
  generatedAt: string;
  version: string;
  author: string;
  reviewers?: string[];
  approvalStatus?: 'draft' | 'review' | 'approved';
  lastUpdated: string;
  tags: string[];
}

export interface DiagramData {
  type: 'architecture' | 'flow' | 'sequence' | 'database' | 'network';
  title: string;
  description: string;
  data: any; // Diagram-specific data structure
}

export interface CodeExample {
  language: string;
  title: string;
  description: string;
  code: string;
  filename?: string;
}

export interface SecurityAnalysis {
  authenticationMethods: string[];
  authorizationPatterns: string[];
  dataEncryption: string[];
  vulnerabilities: SecurityVulnerability[];
  complianceChecks: ComplianceCheck[];
}

export interface SecurityVulnerability {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string;
  recommendation: string;
}

export interface ComplianceCheck {
  requirement: ComplianceRequirement;
  status: 'compliant' | 'non-compliant' | 'partial' | 'unknown';
  details: string;
  recommendations: string[];
}

export interface APIDocumentation {
  endpoints: APIEndpoint[];
  authentication: AuthenticationDoc;
  errorCodes: ErrorCode[];
  examples: APIExample[];
}

export interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  parameters: APIParameter[];
  responses: APIResponse[];
  authentication?: string[];
}

export interface APIParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: any;
}

export interface APIResponse {
  statusCode: number;
  description: string;
  schema?: any;
  example?: any;
}

export interface AuthenticationDoc {
  methods: string[];
  flows: AuthFlow[];
  scopes?: string[];
}

export interface AuthFlow {
  type: string;
  description: string;
  steps: string[];
}

export interface ErrorCode {
  code: string;
  message: string;
  description: string;
  resolution: string;
}

export interface APIExample {
  title: string;
  description: string;
  request: any;
  response: any;
  language: string;
}

// Enhanced Workflow & User Stories Types with Full Code Analysis
export interface WorkflowAnalysisData {
  routes: RouteInfo[];
  userInteractions: UserInteraction[];
  dataOperations: DataOperation[];
  authFlow: AuthenticationFlow;
  businessLogic: BusinessLogic[];
}

export interface RouteInfo {
  method: string;
  path: string;
  type: 'REST API' | 'Next.js API' | 'Express Route' | 'React Route' | 'FastAPI';
  middleware?: string[];
  handler?: string;
  description?: string;
  fullCode?: string; // Complete route implementation
  requestValidation?: string[];
  responseFormat?: string[];
  errorHandling?: string[];
  queryParams?: string[];
  bodyParams?: string[];
  component?: string; // For React routes
  componentCode?: string; // Full component code
  props?: string[];
  hooks?: string[];
  eventHandlers?: string[];
}

export interface UserInteraction {
  file: string;
  components: ComponentInfo[];
  forms: FormInfo[];
  events: EventHandler[];
  navigation: NavigationPattern[];
  fullFileCode?: string; // Complete file content
}

export interface ComponentInfo {
  name: string;
  props: string[];
  jsx: string[];
  hooks: string[];
  eventHandlers: string[];
  fullCode?: string; // Complete component implementation
  stateVariables?: string[];
  effects?: string[];
  apiCalls?: string[];
  conditionalRendering?: string[];
}

export interface FormInfo {
  fields: FormField[];
  submitHandler?: string;
  submitFunction?: string; // Full submit function code
  validation?: string[];
  fullFormCode?: string; // Complete form JSX
  onChangeHandlers?: string[];
  formState?: string[];
}

export interface FormField {
  name: string;
  type: string;
  required: boolean;
  validation?: string[];
}

export interface EventHandler {
  name: string;
  type: string;
  trigger: string;
  action: string;
  fullFunction?: string; // Complete function implementation
  parameters?: string[];
  sideEffects?: string[];
}

export interface NavigationPattern {
  from: string;
  to: string;
  trigger: string;
  method: string;
  context?: string; // Surrounding code context
}

export interface DataOperation {
  type: 'Prisma' | 'Mongoose' | 'SQL' | 'API Call';
  model?: string;
  operation: string;
  parameters?: string;
  description?: string;
  fullQuery?: string; // Complete query/operation code
  functionContext?: string; // Function containing the operation
  dataValidation?: string[];
  errorHandling?: string[];
  businessLogic?: string[];
  requestHeaders?: string[];
  requestBody?: string[];
  responseHandling?: string[];
  joins?: string[]; // For SQL operations
  conditions?: string[]; // For SQL operations
}

export interface AuthenticationFlow {
  methods: string[];
  providers: string[];
  flows: string[];
  middleware: string[];
  implementationCode?: string[]; // Full authentication implementation code
}

export interface BusinessLogic {
  file: string;
  functions: BusinessFunction[];
  validations: ValidationRule[];
  calculations: CalculationRule[];
  workflows: WorkflowRule[];
  fullFileCode?: string; // Complete file content
  exports?: string[];
  imports?: string[];
  constants?: string[];
  types?: string[];
}

export interface BusinessFunction {
  name: string;
  body?: string;
  fullCode?: string; // Complete function implementation
  parameters?: string[];
  returnStatements?: string[];
  sideEffects?: string[];
}

export interface ValidationRule {
  name: string;
  fullCode?: string; // Complete validation implementation
  logic?: string;
  rules?: string[];
}

export interface CalculationRule {
  name: string;
  fullCode?: string; // Complete calculation implementation
  logic?: string;
  operations?: string[];
}

export interface WorkflowRule {
  name: string;
  fullCode?: string; // Complete workflow implementation
  logic?: string;
  steps?: string[];
}

export interface WorkflowGenerationResult {
  projectOverview: ProjectOverview;
  userWorkflows: UserWorkflow[];
  userStories: UserStory[];
  capabilities: ProjectCapability[];
  dataEntities: DataEntity[];
}

export interface ProjectOverview {
  name: string;
  description: string;
  primaryUsers: string[];
  coreCapabilities: string[];
  applicationTypes: string[];
  businessDomain: string;
}

export interface UserWorkflow {
  workflowName: string;
  description: string;
  userTypes: string[];
  estimatedDuration: string;
  steps: WorkflowStep[];
  preconditions: string[];
  postconditions: string[];
  alternativeFlows: string[];
  errorHandling: string[];
}

export interface WorkflowStep {
  stepNumber: number;
  action: string;
  trigger: string;
  systemResponse: string;
  dataInvolved: string;
  userInterface?: string;
  technicalEndpoint?: string;
}

export interface UserStory {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  priority: 'High' | 'Medium' | 'Low';
  estimatedEffort: string;
  complexity: 'High' | 'Medium' | 'Low';
  relatedWorkflow: string;
  technicalImplementation: TechnicalImplementation;
  testScenarios: string[];
}

export interface TechnicalImplementation {
  endpoints: string[];
  components: string[];
  database: string[];
}

export interface ProjectCapability {
  category: string;
  features: CapabilityFeature[];
}

export interface CapabilityFeature {
  name: string;
  description: string;
  technicalEndpoint?: string;
  userBenefit: string;
}

export interface DataEntity {
  entityName: string;
  description: string;
  attributes: string[];
  relationships: string[];
}

export interface WorkflowConfig {
  outputFormat: 'comprehensive' | 'workflows-only' | 'user-stories-only' | 'jira-format' | 'notion-format';
  includeBusinessValue: boolean;
  includeTechnicalDetails: boolean;
  prioritizationMethod: 'automatic' | 'manual' | 'complexity-based';
  exportFormat: 'json' | 'markdown' | 'csv' | 'jira' | 'linear' | 'notion';
}