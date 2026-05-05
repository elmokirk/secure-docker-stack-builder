import type { PlannedPort, PortDefinition } from "./types";

export function planPorts(ports: PortDefinition[], overrides: Record<string, number> = {}): PlannedPort[] {
  const used = new Set<number>();
  return ports.map((port) => {
    const wantsPublished = !port.internalOnly && port.defaultHostPort !== undefined;
    if (!wantsPublished) {
      return { ...port, published: false };
    }

    const requested = overrides[port.id] ?? port.defaultHostPort;
    const resolvedConflict = used.has(requested);
    const hostPort = resolvedConflict ? nextFreePort(requested, used) : requested;
    used.add(hostPort);
    return { ...port, requestedHostPort: requested, hostPort, resolvedConflict, published: true };
  });
}

function nextFreePort(start: number, used: Set<number>): number {
  let candidate = start + 1;
  while (used.has(candidate)) candidate += 1;
  return candidate;
}
