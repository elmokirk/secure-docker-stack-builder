import { describe, expect, it } from "vitest";
import { envRef, renderEnvExample } from "./env";
import { renderComposeYaml } from "./compose";
import { planPorts } from "./ports";
import { renderStack } from "./renderer";
import { demoProject } from "../projects/demo";

describe("secure stack renderer", () => {
  it("renders compose variables without JS interpolation", () => {
    const yaml = renderComposeYaml({
      services: {
        app: {
          image: envRef("ENV_VAR_EXAMPLE"),
          ports: [envRef("APP_HOST_PORT", "8080", { suffix: ":80" })]
        }
      }
    });

    expect(yaml).toContain("image: ${ENV_VAR_EXAMPLE}");
    expect(yaml).toContain("- ${APP_HOST_PORT:-8080}:80");
  });

  it("documents dollar escaping for compose-interpolated basic auth hashes", () => {
    const env = renderEnvExample([
      {
        key: "DASHBOARD_BASIC_AUTH_USERS",
        description: "Dashboard Basic Auth users.",
        secret: true,
        escapeDollar: true,
        placeholder: "admin:$$2y$$example"
      }
    ]);

    expect(env).toContain("if the raw value contains $, write it as $$");
    expect(env).toContain("DASHBOARD_BASIC_AUTH_USERS=admin:$$2y$$example");
  });

  it("resolves duplicate requested host ports", () => {
    const ports = planPorts([
      { id: "a", label: "A", service: "a", containerPort: 80, defaultHostPort: 3100 },
      { id: "b", label: "B", service: "b", containerPort: 80, defaultHostPort: 3100 }
    ]);

    expect(ports[0].hostPort).toBe(3100);
    expect(ports[1].hostPort).toBe(3101);
    expect(ports[1].resolvedConflict).toBe(true);
  });

  it("renders the standalone demo preset", () => {
    const result = renderStack(demoProject, {
      projectId: "demo",
      targetId: "local",
      moduleIds: ["demo-web", "demo-postgres"]
    });

    expect(result.status).toBe("valid");
    expect(result.composeYaml).toContain("web:");
    expect(result.composeYaml).toContain("postgres:");
    expect(result.envExample).toContain("DEMO_POSTGRES_PASSWORD=change-me");
  });

  it("blocks demo public app ports in production targets", () => {
    const result = renderStack(demoProject, {
      projectId: "demo",
      targetId: "vps",
      moduleIds: ["demo-web", "demo-postgres"]
    });

    expect(result.status).toBe("blocked");
    expect(result.riskReportJson).toContain("public_port_blocked");
  });
});
