import { renderEnvRef } from "./env";
import type { ComposeFragment, ComposeValue, EnvRef } from "./types";

function isPlainObject(value: ComposeValue): value is Record<string, ComposeValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && !isEnvRef(value);
}

function isEnvRef(value: ComposeValue): value is EnvRef {
  return typeof value === "object" && value !== null && !Array.isArray(value) && "kind" in value && value.kind === "env";
}

export function mergeFragments(fragments: ComposeFragment[]): ComposeFragment {
  const result: ComposeFragment = {};
  for (const fragment of fragments) {
    result.services = mergeRecord(result.services, fragment.services);
    result.networks = mergeRecord(result.networks, fragment.networks);
    result.volumes = mergeRecord(result.volumes, fragment.volumes);
  }
  return result;
}

function mergeRecord(
  base: Record<string, ComposeValue> | undefined,
  next: Record<string, ComposeValue> | undefined
): Record<string, ComposeValue> | undefined {
  if (!base && !next) return undefined;
  const result: Record<string, ComposeValue> = { ...(base ?? {}) };
  for (const [key, value] of Object.entries(next ?? {})) {
    const existing = result[key];
    if (existing !== undefined && isPlainObject(existing) && isPlainObject(value)) {
      result[key] = deepMerge(existing, value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function deepMerge(base: Record<string, ComposeValue>, next: Record<string, ComposeValue>): Record<string, ComposeValue> {
  const result: Record<string, ComposeValue> = { ...base };
  for (const [key, value] of Object.entries(next)) {
    const existing = result[key];
    if (existing !== undefined && isPlainObject(existing) && isPlainObject(value)) {
      result[key] = deepMerge(existing, value);
    } else if (Array.isArray(existing) && Array.isArray(value)) {
      result[key] = [...existing, ...value];
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function renderComposeYaml(fragment: ComposeFragment): string {
  const root: Record<string, ComposeValue> = {};
  if (fragment.services && Object.keys(fragment.services).length > 0) root.services = fragment.services;
  if (fragment.networks && Object.keys(fragment.networks).length > 0) root.networks = fragment.networks;
  if (fragment.volumes && Object.keys(fragment.volumes).length > 0) root.volumes = fragment.volumes;
  return renderYaml(root);
}

export function renderYaml(value: ComposeValue, indent = 0): string {
  if (!isPlainObject(value)) {
    return `${" ".repeat(indent)}${formatScalar(value)}\n`;
  }

  const lines: string[] = [];
  for (const key of Object.keys(value)) {
    const child = value[key];
    if (isPlainObject(child)) {
      lines.push(`${" ".repeat(indent)}${key}:`);
      lines.push(renderYaml(child, indent + 2).trimEnd());
    } else if (Array.isArray(child)) {
      lines.push(`${" ".repeat(indent)}${key}:`);
      for (const item of child) {
        if (isPlainObject(item)) {
          lines.push(`${" ".repeat(indent + 2)}-`);
          lines.push(renderYaml(item, indent + 4).trimEnd());
        } else {
          lines.push(`${" ".repeat(indent + 2)}- ${formatScalar(item)}`);
        }
      }
    } else {
      lines.push(`${" ".repeat(indent)}${key}: ${formatScalar(child)}`);
    }
  }
  return lines.join("\n") + "\n";
}

function formatScalar(value: ComposeValue): string {
  if (isEnvRef(value)) return renderEnvRef(value);
  if (value === null) return "null";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value !== "string") throw new Error("Invalid YAML scalar");
  if (value === "") return '""';
  if (/^\$\{[A-Z][A-Z0-9_]*(?::-.*)?\}$/.test(value)) return value;
  if (/^[a-zA-Z0-9_.:/@-]+$/.test(value)) return value;
  return JSON.stringify(value);
}
