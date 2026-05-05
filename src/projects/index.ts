import { demoProject } from "./demo";
import type { ProjectPack } from "../core/types";

export const projects: ProjectPack[] = [demoProject];

export function findProject(projectId: string): ProjectPack {
  return projects.find((project) => project.id === projectId) ?? projects[0];
}
