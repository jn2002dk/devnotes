"use client";

import { ChangeEvent } from "react";
import { Copy, Download, Plus, Trash2, Upload } from "lucide-react";
import {
  downloadWorkspace,
  downloadWorkspaceCollection,
  readWorkspaceFile
} from "@/lib/storage";
import { ProjectWorkspace, WorkspaceCollection } from "@/types/workspace";

interface SettingsPanelProps {
  workspace: ProjectWorkspace;
  projects: ProjectWorkspace[];
  collection: WorkspaceCollection | null;
  activeProjectId: string;
  syncStatus: "idle" | "loading" | "saving" | "saved" | "error";
  syncMessage: string;
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  onDuplicateProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onUpdateProject: (updater: (project: ProjectWorkspace) => ProjectWorkspace) => void;
  onImport: (payload: ProjectWorkspace | WorkspaceCollection) => void;
}

export const SettingsPanel = ({
  workspace,
  projects,
  collection,
  activeProjectId,
  syncStatus,
  syncMessage,
  onSelectProject,
  onCreateProject,
  onDuplicateProject,
  onDeleteProject,
  onUpdateProject,
  onImport
}: SettingsPanelProps) => {
  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const imported = await readWorkspaceFile(file);
    onImport(imported);
    event.target.value = "";
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="panel p-5">
        <p className="section-title">Workspace settings</p>
        <div className="mt-5 rounded-[28px] bg-[#f6edde] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Project library</p>
              <p className="text-sm text-black/60">Switch, duplicate, archive, or delete from one place.</p>
            </div>
            <button type="button" onClick={onCreateProject} className="rounded-full bg-black p-3 text-white">
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {projects.map((project) => (
              <div key={project.id} className={`rounded-[24px] border p-4 ${project.id === activeProjectId ? "border-black bg-black text-white" : "border-black/10 bg-white/80"}`}>
                <button type="button" onClick={() => onSelectProject(project.id)} className="w-full text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{project.name}</p>
                      <p className={`mt-1 text-sm ${project.id === activeProjectId ? "text-white/65" : "text-black/60"}`}>{project.summary}</p>
                    </div>
                    {project.settings.archived ? <span className="badge">Archived</span> : null}
                  </div>
                </button>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => onDuplicateProject(project.id)} className={`rounded-full px-3 py-2 text-sm ${project.id === activeProjectId ? "bg-white/10" : "bg-[#f3ecdf]"}`}>
                    <Copy className="mr-2 inline h-4 w-4" />
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteProject(project.id)}
                    disabled={projects.length === 1}
                    className={`rounded-full px-3 py-2 text-sm ${projects.length === 1 ? "cursor-not-allowed opacity-50" : project.id === activeProjectId ? "bg-white/10" : "bg-[#f3ecdf]"}`}
                  >
                    <Trash2 className="mr-2 inline h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label>
            <span className="mb-2 block text-sm font-semibold">Project name</span>
            <input className="field" value={workspace.name} onChange={(event) => onUpdateProject((project) => ({ ...project, name: event.target.value }))} />
          </label>
          <label>
            <span className="mb-2 block text-sm font-semibold">Accent color</span>
            <input className="field h-[52px]" type="color" value={workspace.settings.accentColor} onChange={(event) => onUpdateProject((project) => ({ ...project, settings: { ...project.settings, accentColor: event.target.value } }))} />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-semibold">Summary</span>
          <textarea className="field min-h-[140px]" value={workspace.summary} onChange={(event) => onUpdateProject((project) => ({ ...project, summary: event.target.value }))} />
        </label>

        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-semibold">Workspace tags</span>
          <input className="field" value={workspace.settings.tags.join(", ")} onChange={(event) => onUpdateProject((project) => ({ ...project, settings: { ...project.settings, tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) } }))} />
        </label>

        <label className="mt-4 flex items-center gap-3 rounded-2xl border border-black/10 bg-[#f9f2e7] p-4 text-sm">
          <input type="checkbox" checked={workspace.settings.archived} onChange={(event) => onUpdateProject((project) => ({ ...project, settings: { ...project.settings, archived: event.target.checked } }))} />
          Mark this workspace as archived
        </label>
      </section>

      <aside className="panel-grid rounded-[28px] border border-black/10 bg-[#f5ecde] p-5">
        <p className="section-title">Database storage</p>
        <h2 className="mt-2 text-3xl" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.05em" }}>MariaDB-backed persistence</h2>
        <p className="mt-4 text-sm text-black/65">
          Your full project library now saves to MariaDB on the host. JSON import and export stay available for migration, backups, and manual snapshots.
        </p>

        <div className={`mt-4 rounded-[24px] px-4 py-3 text-sm ${syncStatus === "error" ? "bg-[#fff1eb] text-[#9d4328]" : syncStatus === "saved" ? "bg-[#ebf6ef] text-[#2c6b46]" : "bg-white/80 text-black/65"}`}>
          {syncMessage}
        </div>

        <div className="mt-6 space-y-3">
          <button type="button" onClick={() => downloadWorkspace(workspace)} className="flex w-full items-center justify-between rounded-[24px] bg-black px-5 py-4 text-white">
            Export active project JSON
            <Download className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => collection && downloadWorkspaceCollection(collection)}
            className="flex w-full items-center justify-between rounded-[24px] border border-black/10 bg-white/85 px-5 py-4"
          >
            Export full project library
            <Download className="h-4 w-4" />
          </button>

          <label className="flex cursor-pointer items-center justify-between rounded-[24px] border border-black/10 bg-white/85 px-5 py-4">
            Import project or library JSON
            <Upload className="h-4 w-4" />
            <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
          </label>
        </div>
      </aside>
    </div>
  );
};