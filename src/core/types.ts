export type TargetKind = "local" | "hostinger" | "vps" | "private";
export type Severity = "info" | "warning" | "error";
export type EvaluationStatus = "valid" | "valid_with_warnings" | "blocked";
export type RiskLevel = "low" | "medium" | "high" | "blocked";

export type ComposeScalar = string | number | boolean | null | EnvRef;
export type ComposeValue = ComposeScalar | ComposeValue[] | { [key: string]: ComposeValue };

export interface EnvRef {
  kind: "env";
  name: string;
  defaultValue?: string;
  prefix?: string;
  suffix?: string;
}

export interface EnvVarDefinition {
  key: string;
  description: string;
  required?: boolean;
  secret?: boolean;
  defaultValue?: string;
  placeholder?: string;
  escapeDollar?: boolean;
  exampleValue?: string;
}

export interface PortDefinition {
  id: string;
  label: string;
  service: string;
  containerPort: number;
  defaultHostPort?: number;
  hostPortEnv?: string;
  protocol?: "tcp" | "udp";
  publicIngress?: boolean;
  internalOnly?: boolean;
}

export interface SecurityMetadata {
  exposesPublicPort?: boolean;
  requiresAuth?: boolean;
  containsDatabase?: boolean;
  containsLLMGateway?: boolean;
  containsWebhookReceiver?: boolean;
  requiresPersistentVolume?: boolean;
  supportsProduction?: boolean;
  dangerousCapabilities?: string[];
  allowedTargets?: TargetKind[];
  publicIngressGateway?: boolean;
}

export interface ComposeFragment {
  services?: Record<string, ComposeValue>;
  networks?: Record<string, ComposeValue>;
  volumes?: Record<string, ComposeValue>;
}

export interface StackModule {
  id: string;
  label: string;
  description: string;
  category: string;
  compose: ComposeFragment;
  env?: EnvVarDefinition[];
  ports?: PortDefinition[];
  dependsOn?: string[];
  conflictsWith?: string[];
  targets?: TargetKind[];
  security?: SecurityMetadata;
  guide?: string[];
  qa?: string[];
}

export interface StackTarget {
  id: string;
  label: string;
  kind: TargetKind;
  description: string;
  production: boolean;
  allowPublicPorts: boolean;
}

export interface StackPreset {
  id: string;
  label: string;
  description: string;
  targetId: string;
  moduleIds: string[];
}

export interface ProjectPack {
  id: string;
  label: string;
  description: string;
  defaultTargetId: string;
  docsUrl?: string;
  targets: StackTarget[];
  modules: StackModule[];
  presets: StackPreset[];
}

export interface BuilderSelection {
  projectId: string;
  targetId: string;
  moduleIds: string[];
  portOverrides?: Record<string, number>;
  acceptedRisk?: boolean;
}

export interface PlannedPort extends PortDefinition {
  hostPort?: number;
  published: boolean;
  requestedHostPort?: number;
  resolvedConflict?: boolean;
}

export interface EvaluationIssue {
  severity: Severity;
  code: string;
  message: string;
  moduleId?: string;
}

export interface RenderResult {
  composeYaml: string;
  envExample: string;
  guideMarkdown: string;
  qaMarkdown: string;
  riskReportJson: string;
  stackConfigJson: string;
  status: EvaluationStatus;
  riskLevel: RiskLevel;
  issues: EvaluationIssue[];
  ports: PlannedPort[];
}
