"use client";

import { ChangeEvent } from "react";
import { Download, Upload } from "lucide-react";
import { downloadWorkspace, readWorkspaceFile } from "@/lib/storage";
import { ProjectWorkspace } from "@/types/workspace";

interface SettingsPanelProps {
  workspace: ProjectWorkspace;
  onUpdateProject: (updater: (project: ProjectWorkspace) => ProjectWorkspace) => void;
  onImport: (project: ProjectWorkspace) => void;
}

export const SettingsPanel = ({ workspace, onUpdateProject, onImport }: SettingsPanelProps) => {
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
        <p className="section-title">JSON storage</p>
        <h2 className="mt-2 text-3xl" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.05em" }}>Local-first data control</h2>
        <p className="mt-4 text-sm text-black/65">
          The workspace auto-saves in your browser. Export the full JSON file whenever you want a portable backup or import an existing project workspace.
        </p>

        <div className="mt-6 space-y-3">
          <button type="button" onClick={() => downloadWorkspace(workspace)} className="flex w-full items-center justify-between rounded-[24px] bg-black px-5 py-4 text-white">
            Export workspace JSON
            <Download className="h-4 w-4" />
          </button>

          <label className="flex cursor-pointer items-center justify-between rounded-[24px] border border-black/10 bg-white/85 px-5 py-4">
            Import workspace JSON
            <Upload className="h-4 w-4" />
            <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
          </label>
        </div>
      </aside>
    </div>
  );
};