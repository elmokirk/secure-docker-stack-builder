import { mergeFragments, renderComposeYaml } from "./compose";
import { renderEnvExample, validateEnvDefinitions } from "./env";
import { evaluatePolicies } from "./policies";
import { planPorts } from "./ports";
import type {
  BuilderSelection,
  EnvVarDefinition,
  EvaluationIssue,
  EvaluationStatus,
  ProjectPack,
  RenderResult,
  RiskLevel,
  StackModule
} from "./types";

export function renderStack(project: ProjectPack, selection: BuilderSelection): RenderResult {
  const target = project.targets.find((item) => item.id === selection.targetId) ?? project.targets[0];
  const modules = project.modules.filter((module) => selection.moduleIds.includes(module.id));
  const ports = planPorts(modules.flatMap((module) => module.ports ?? []), selection.portOverrides);
  const env = applyPortDefaults(collectEnv(modules), ports);
  const issues: EvaluationIssue[] = [];

  for (const envError of validateEnvDefinitions(env)) {
    issues.push({ severity: "error", code: "invalid_env", message: envError });
  }

  issues.push(...evaluatePolicies(project, target, modules, ports, selection));

  const envDefaults = new Map(env.map((item) => [item.key, item.defaultValue]).filter((entry): entry is [string, string] => Boolean(entry[1])));
  const fragment = rewriteEnvDefaults(mergeFragments(modules.map((module) => module.compose)), envDefaults);
  const composeYaml = renderComposeYaml(fragment);
  const envExample = renderEnvExample(env);
  const qaCommands = renderQaCommands(modules);
  const guideMarkdown = renderGuide(project, target.label, modules);
  const qaMarkdown = renderQaMarkdown(qaCommands);
  const riskLevel = riskLevelFromIssues(issues);
  const status = statusFromIssues(issues);
  const riskReport = {
    riskLevel,
    status,
    project: project.id,
    target: target.id,
    modules: modules.map((module) => module.id),
    blockedReasons: issues.filter((issue) => issue.severity === "error"),
    warnings: issues.filter((issue) => issue.severity === "warning"),
    publicPorts: ports.filter((port) => port.published),
    requiredSecrets: env.filter((item) => item.required && item.secret).map((item) => item.key),
    unsafeCapabilities: modules.flatMap((module) => module.security?.dangerousCapabilities ?? []),
    qaCommands,
    ports,
    envInterpolation: {
      composeVariablesAreRenderedAsNodes: true,
      example: "${ENV_VAR_EXAMPLE}",
      dollarEscaping: "Use $$ in .env values when Compose interpolation would otherwise treat $ specially."
    }
  };

  return {
    composeYaml,
    envExample,
    guideMarkdown,
    qaMarkdown,
    riskReportJson: `${JSON.stringify(riskReport, null, 2)}\n`,
    stackConfigJson: `${JSON.stringify(selection, null, 2)}\n`,
    status,
    riskLevel,
    issues,
    ports
  };
}

function collectEnv(modules: StackModule[]): EnvVarDefinition[] {
  const byKey = new Map<string, EnvVarDefinition>();
  for (const module of modules) {
    for (const item of module.env ?? []) {
      byKey.set(item.key, { ...byKey.get(item.key), ...item });
    }
  }
  return [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key));
}

function applyPortDefaults(env: EnvVarDefinition[], ports: { hostPortEnv?: string; hostPort?: number }[]): EnvVarDefinition[] {
  const portDefaults = new Map<string, string>();
  for (const port of ports) {
    if (port.hostPortEnv && port.hostPort) {
      portDefaults.set(port.hostPortEnv, String(port.hostPort));
    }
  }
  return env.map((item) => {
    const defaultValue = portDefaults.get(item.key);
    return defaultValue ? { ...item, defaultValue } : item;
  });
}

function rewriteEnvDefaults<T>(value: T, defaults: Map<string, string>): T {
  if (Array.isArray(value)) {
    return value.map((item) => rewriteEnvDefaults(item, defaults)) as T;
  }
  if (typeof value === "object" && value !== null) {
    if ("kind" in value && value.kind === "env" && "name" in value && typeof value.name === "string") {
      const defaultValue = defaults.get(value.name);
      return (defaultValue ? { ...value, defaultValue } : value) as T;
    }
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, rewriteEnvDefaults(child, defaults)])) as T;
  }
  return value;
}

function renderGuide(project: ProjectPack, targetLabel: string, modules: StackModule[]): string {
  const lines = [
    `# ${project.label} Setup Guide`,
    "",
    `Target: ${targetLabel}`,
    "",
    "## Modules",
    ...modules.map((module) => `- ${module.label}: ${module.description}`),
    "",
    "## Setup",
    "1. Save the generated compose output as `docker-compose.yaml`.",
    "2. Save the generated env output as `.env` and replace placeholders locally.",
    "3. Run the QA command before starting the stack.",
    "",
    "## Module Notes"
  ];

  for (const module of modules) {
    if (!module.guide?.length) continue;
    lines.push("", `### ${module.label}`, ...module.guide.map((item) => `- ${item}`));
  }

  return `${lines.join("\n")}\n`;
}

function renderQaCommands(modules: StackModule[]): string[] {
  const commands = [
    "docker compose --env-file .env -f docker-compose.yaml config --quiet",
    "docker compose --env-file .env -f docker-compose.yaml up -d"
  ];
  for (const module of modules) {
    commands.push(...(module.qa ?? []));
  }
  return [...new Set(commands)];
}

function renderQaMarkdown(commands: string[]): string {
  return `# QA Checklist

Run these commands after saving the generated files:

${commands.map((command) => `\`\`\`sh\n${command}\n\`\`\``).join("\n\n")}
`;
}

function statusFromIssues(issues: EvaluationIssue[]): EvaluationStatus {
  if (issues.some((issue) => issue.severity === "error")) return "blocked";
  if (issues.some((issue) => issue.severity === "warning")) return "valid_with_warnings";
  return "valid";
}

function riskLevelFromIssues(issues: EvaluationIssue[]): RiskLevel {
  if (issues.some((issue) => issue.severity === "error")) return "blocked";
  if (issues.some((issue) => issue.severity === "warning")) return "medium";
  return "low";
}
