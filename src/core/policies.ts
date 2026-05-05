import type { BuilderSelection, EvaluationIssue, PlannedPort, ProjectPack, StackModule, StackTarget } from "./types";

export function evaluatePolicies(
  _project: ProjectPack,
  target: StackTarget,
  modules: StackModule[],
  ports: PlannedPort[],
  selection: BuilderSelection
): EvaluationIssue[] {
  const issues: EvaluationIssue[] = [];
  const selected = new Set(modules.map((module) => module.id));

  for (const module of modules) {
    for (const dependency of module.dependsOn ?? []) {
      if (!selected.has(dependency)) {
        issues.push({
          severity: "error",
          code: "missing_dependency",
          moduleId: module.id,
          message: `${module.label} requires ${dependency}.`
        });
      }
    }

    for (const conflict of module.conflictsWith ?? []) {
      if (selected.has(conflict)) {
        issues.push({
          severity: "error",
          code: "module_conflict",
          moduleId: module.id,
          message: `${module.label} conflicts with ${conflict}.`
        });
      }
    }

    const allowedTargets = module.security?.allowedTargets ?? module.targets;
    if (allowedTargets && !allowedTargets.includes(target.kind)) {
      issues.push({
        severity: "error",
        code: "target_not_allowed",
        moduleId: module.id,
        message: `${module.label} is not allowed for ${target.label}.`
      });
    }

    if (target.production && module.security?.supportsProduction === false) {
      issues.push({
        severity: "error",
        code: "local_only_in_production",
        moduleId: module.id,
        message: `${module.label} is local-only and cannot be exported as production-ready.`
      });
    }

    if (target.production && module.security?.dangerousCapabilities?.length && !selection.acceptedRisk) {
      issues.push({
        severity: "error",
        code: "dangerous_capability",
        moduleId: module.id,
        message: `${module.label} uses dangerous capabilities: ${module.security.dangerousCapabilities.join(", ")}.`
      });
    }
  }

  if (target.production) {
    for (const port of ports) {
      if (port.published && port.internalOnly) {
        issues.push({
          severity: "error",
          code: "internal_port_published",
          message: `${port.label} is internal-only but has a host port.`
        });
      }
      const owner = modules.find((module) => module.ports?.some((candidate) => candidate.id === port.id));
      const allowedIngress = owner?.security?.publicIngressGateway === true;
      if (port.published && !target.allowPublicPorts && !allowedIngress) {
        issues.push({
          severity: "error",
          code: "public_port_blocked",
          message: `${port.label} publishes ${port.hostPort}:${port.containerPort}, which is blocked for ${target.label}.`
        });
      }
    }
  }

  for (const port of ports) {
    if (port.resolvedConflict) {
      issues.push({
        severity: "warning",
        code: "port_conflict_resolved",
        message: `${port.label} requested host port ${port.requestedHostPort}, so the builder selected ${port.hostPort}.`
      });
    }
  }

  const publicDatabases = modules.filter((module) => module.security?.containsDatabase).flatMap((module) => module.ports ?? []);
  for (const port of ports) {
    if (publicDatabases.some((candidate) => candidate.id === port.id) && port.published && target.production) {
      issues.push({ severity: "error", code: "database_public", message: `${port.label} exposes a database publicly.` });
    }
  }

  return issues;
}
