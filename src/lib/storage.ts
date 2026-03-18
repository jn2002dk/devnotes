import { defaultWorkspace, defaultWorkspaceCollection } from "@/data/defaultWorkspace";
import { ProjectWorkspace, WorkspaceCollection } from "@/types/workspace";

const STORAGE_KEY = "devnotes-workspaces";

const isProjectWorkspace = (value: unknown): value is ProjectWorkspace => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ProjectWorkspace>;
  return typeof candidate.id === "string" && typeof candidate.name === "string" && Array.isArray(candidate.notes) && Array.isArray(candidate.docs);
};

const isWorkspaceCollection = (value: unknown): value is WorkspaceCollection => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<WorkspaceCollection>;
  return Array.isArray(candidate.projects) && typeof candidate.activeProjectId === "string";
};

export const normalizeWorkspaceCollection = (collection: WorkspaceCollection): WorkspaceCollection => {
  const projects = collection.projects.length ? collection.projects : [defaultWorkspace];
  const hasActive = projects.some((project) => project.id === collection.activeProjectId);

  return {
    version: 1,
    updatedAt: collection.updatedAt || new Date().toISOString(),
    activeProjectId: hasActive ? collection.activeProjectId : projects[0].id,
    projects
  };
};

export const loadWorkspaceCollection = (): WorkspaceCollection => {
  if (typeof window === "undefined") {
    return defaultWorkspaceCollection;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return defaultWorkspaceCollection;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (isWorkspaceCollection(parsed)) {
      return normalizeWorkspaceCollection(parsed);
    }

    if (isProjectWorkspace(parsed)) {
      return normalizeWorkspaceCollection({
        version: 1,
        activeProjectId: parsed.id,
        updatedAt: parsed.updatedAt,
        projects: [parsed]
      });
    }

    return defaultWorkspaceCollection;
  } catch {
    return defaultWorkspaceCollection;
  }
};

export const saveWorkspaceCollection = (collection: WorkspaceCollection) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(collection, null, 2));
};

export const downloadWorkspace = (workspace: ProjectWorkspace) => {
  const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${workspace.id}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const downloadWorkspaceCollection = (collection: WorkspaceCollection) => {
  const blob = new Blob([JSON.stringify(collection, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "devnotes-projects.json";
  anchor.click();
  URL.revokeObjectURL(url);
};

export const readWorkspaceFile = async (file: File): Promise<ProjectWorkspace | WorkspaceCollection> => {
  const text = await file.text();
  return JSON.parse(text) as ProjectWorkspace | WorkspaceCollection;
};