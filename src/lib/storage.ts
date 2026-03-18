import { defaultWorkspace } from "@/data/defaultWorkspace";
import { ProjectWorkspace } from "@/types/workspace";

const STORAGE_KEY = "devnotes-workspace";

export const loadWorkspace = (): ProjectWorkspace => {
  if (typeof window === "undefined") {
    return defaultWorkspace;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return defaultWorkspace;
  }

  try {
    return JSON.parse(raw) as ProjectWorkspace;
  } catch {
    return defaultWorkspace;
  }
};

export const saveWorkspace = (workspace: ProjectWorkspace) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace, null, 2));
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

export const readWorkspaceFile = async (file: File): Promise<ProjectWorkspace> => {
  const text = await file.text();
  return JSON.parse(text) as ProjectWorkspace;
};