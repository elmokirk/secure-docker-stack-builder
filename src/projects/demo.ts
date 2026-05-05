import { envRef } from "../core/env";
import type { ProjectPack } from "../core/types";

export const demoProject: ProjectPack = {
  id: "demo",
  label: "Generic Demo Stack",
  description: "Minimal reusable starter example for other Docker projects.",
  defaultTargetId: "local",
  targets: [
    {
      id: "local",
      label: "Local",
      kind: "local",
      description: "Developer machine with published ports.",
      production: false,
      allowPublicPorts: true
    },
    {
      id: "vps",
      label: "Generic VPS",
      kind: "vps",
      description: "Production VPS with reverse proxy owned outside this demo.",
      production: true,
      allowPublicPorts: false
    }
  ],
  presets: [
    {
      id: "web-postgres",
      label: "Web + Postgres",
      description: "Small local demo with an app and database.",
      targetId: "local",
      moduleIds: ["demo-web", "demo-postgres"]
    }
  ],
  modules: [
    {
      id: "demo-web",
      label: "Demo Web App",
      description: "Tiny app service showing how custom modules are declared.",
      category: "app",
      dependsOn: ["demo-postgres"],
      compose: {
        services: {
          web: {
            image: "nginx:1.27-alpine",
            ports: [envRef("DEMO_WEB_HOST_PORT", "8088", { suffix: ":80" })],
            depends_on: ["postgres"],
            networks: ["app-network"]
          }
        },
        networks: {
          "app-network": {}
        }
      },
      env: [
        {
          key: "DEMO_WEB_HOST_PORT",
          description: "Local host port for the demo web service.",
          defaultValue: "8088"
        }
      ],
      ports: [
        {
          id: "demo-web-http",
          label: "Demo web HTTP",
          service: "web",
          containerPort: 80,
          defaultHostPort: 8088,
          hostPortEnv: "DEMO_WEB_HOST_PORT",
          publicIngress: true
        }
      ],
      security: {
        exposesPublicPort: true,
        supportsProduction: true,
        allowedTargets: ["local", "vps"]
      },
      guide: ["Replace `nginx:1.27-alpine` with your real image when adapting this demo."],
      qa: ["docker compose --env-file .env -f docker-compose.yaml ps web"]
    },
    {
      id: "demo-postgres",
      label: "Demo Postgres",
      description: "Internal database example.",
      category: "database",
      compose: {
        services: {
          postgres: {
            image: "postgres:17-alpine",
            environment: {
              POSTGRES_USER: envRef("DEMO_POSTGRES_USER"),
              POSTGRES_PASSWORD: envRef("DEMO_POSTGRES_PASSWORD"),
              POSTGRES_DB: envRef("DEMO_POSTGRES_DB")
            },
            volumes: ["demo-postgres-data:/var/lib/postgresql/data"],
            networks: ["app-network"]
          }
        },
        volumes: {
          "demo-postgres-data": {}
        },
        networks: {
          "app-network": {}
        }
      },
      env: [
        { key: "DEMO_POSTGRES_USER", description: "Database username.", defaultValue: "demo" },
        { key: "DEMO_POSTGRES_DB", description: "Database name.", defaultValue: "demo" },
        {
          key: "DEMO_POSTGRES_PASSWORD",
          description: "Database password.",
          required: true,
          secret: true,
          placeholder: "change-me"
        }
      ],
      security: {
        containsDatabase: true,
        requiresPersistentVolume: true,
        supportsProduction: true,
        allowedTargets: ["local", "vps"]
      },
      guide: ["The database has no public port by default."],
      qa: ["docker compose --env-file .env -f docker-compose.yaml exec postgres pg_isready -U ${DEMO_POSTGRES_USER}"]
    }
  ]
};
