import { describe, expect, it } from "vitest";
import { findServiceBlocks } from "./serviceBlocks";

describe("service block parser", () => {
  it("detects multiple services under the services section", () => {
    const blocks = findServiceBlocks(`services:
  web:
    image: app
    expose:
      - "3100"
  worker:
    image: postgres:17-alpine
    volumes:
      - data:/var/lib/postgresql/data
volumes:
  data: {}
`);

    expect(blocks).toEqual([
      { name: "web", startLine: 2, endLine: 5, colorIndex: 0 },
      { name: "worker", startLine: 6, endLine: 9, colorIndex: 1 }
    ]);
  });

  it("ignores volumes and networks sections", () => {
    const blocks = findServiceBlocks(`services:
  web:
    image: nginx
networks:
  app-network:
volumes:
  web:
`);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].name).toBe("web");
  });

  it("stays stable for empty or incomplete YAML", () => {
    expect(findServiceBlocks("")).toEqual([]);
    expect(findServiceBlocks("services:\n  web:\n    image")).toEqual([
      { name: "web", startLine: 2, endLine: 3, colorIndex: 0 }
    ]);
  });
});
