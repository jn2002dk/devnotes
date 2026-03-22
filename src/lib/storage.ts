import { defaultWorkspace, defaultWorkspaceCollection } from "@/data/defaultWorkspace";
import { ProjectWorkspace, WorkspaceCollection } from "@/types/workspace";

const STORAGE_KEY = "devnotes-workspaces";
const WORKSPACE_API_PATH = "/api/workspace";

export const isProjectWorkspace = (value: unknown): value is ProjectWorkspace => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ProjectWorkspace>;
  return typeof candidate.id === "string" && typeof candidate.name === "string" && Array.isArray(candidate.notes) && Array.isArray(candidate.docs);
};

export const isWorkspaceCollection = (value: unknown): value is WorkspaceCollection => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<WorkspaceCollection>;
  return Array.isArray(candidate.projects) && typeof candidate.activeProjectId === "string";
};

export const parseWorkspacePayload = (value: unknown): WorkspaceCollection | null => {
  if (isWorkspaceCollection(value)) {
    return normalizeWorkspaceCollection(value);
  }

  if (isProjectWorkspace(value)) {
    return normalizeWorkspaceCollection({
      version: 1,
      activeProjectId: value.id,
      updatedAt: value.updatedAt,
      projects: [value]
    });
  }

  return null;
};

const parseWorkspaceString = (raw: string | null): WorkspaceCollection | null => {
  if (!raw) {
    return null;
  }

  try {
    return parseWorkspacePayload(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
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

  return parseWorkspaceString(window.localStorage.getItem(STORAGE_KEY)) ?? defaultWorkspaceCollection;
};

export const hasCachedWorkspaceCollection = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(STORAGE_KEY) !== null;
};

export const saveWorkspaceCollection = (collection: WorkspaceCollection) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(collection, null, 2));
};

export const fetchWorkspaceCollection = async (): Promise<{
  collection: WorkspaceCollection;
  hasPersisted: boolean;
}> => {
  const response = await fetch(WORKSPACE_API_PATH, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("Unable to load workspace from the database.");
  }

  const payload = (await response.json()) as {
    collection?: unknown;
    hasPersisted?: boolean;
  };
  const collection = parseWorkspacePayload(payload.collection);

  if (!collection) {
    throw new Error("The workspace response could not be parsed.");
  }

  return {
    collection,
    hasPersisted: Boolean(payload.hasPersisted)
  };
};

export const saveWorkspaceCollectionToServer = async (collection: WorkspaceCollection) => {
  const response = await fetch(WORKSPACE_API_PATH, {
    method: "PUT",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({ collection })
  });

  if (!response.ok) {
    throw new Error("Unable to save workspace to the database.");
  }

  const payload = (await response.json()) as { collection?: unknown };
  const savedCollection = parseWorkspacePayload(payload.collection);

  if (!savedCollection) {
    throw new Error("The saved workspace response could not be parsed.");
  }

  return savedCollection;
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