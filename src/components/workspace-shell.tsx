"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, FolderKanban, GitBranch, NotebookPen, Plus, Settings2, Sparkles, StickyNote } from "lucide-react";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";
import { formatDate } from "@/lib/utils";
import { WorkspaceSection } from "@/types/workspace";
import { OverviewPanel } from "@/components/overview-panel";
import { FlowMap } from "@/components/flow-map";
import { NotesPanel } from "@/components/notes-panel";
import { DocsPanel } from "@/components/docs-panel";
import { KanbanBoard } from "@/components/kanban-board";
import { SettingsPanel } from "@/components/settings-panel";
import clsx from "clsx";

const sections: Array<{ id: WorkspaceSection; label: string; icon: typeof Sparkles }> = [
  { id: "overview", label: "Overview", icon: Sparkles },
  { id: "flows", label: "Flow maps", icon: GitBranch },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "docs", label: "Docs", icon: NotebookPen },
  { id: "kanban", label: "Kanban", icon: FolderKanban },
  { id: "settings", label: "Settings", icon: Settings2 }
];

export const WorkspaceShell = () => {
  const workspaceStore = useWorkspaceStore();
  const [activeSection, setActiveSection] = useState<WorkspaceSection>("overview");
  const [activeFlowNodeId, setActiveFlowNodeId] = useState<string>("");
  const [activeNoteId, setActiveNoteId] = useState<string>("");
  const [activeDocId, setActiveDocId] = useState<string>("");
  const [activeCardId, setActiveCardId] = useState<string>("");

  const workspace = workspaceStore.workspace;
  const projects = workspaceStore.projects;

  const stats = useMemo(() => {
    if (!workspace) {
      return [];
    }

    return [
      { label: "Projects", value: projects.length.toString() },
      { label: "Flow nodes", value: workspace.flow.nodes.length.toString() },
      { label: "Notes", value: workspace.notes.length.toString() },
      { label: "Docs", value: workspace.docs.length.toString() }
    ];
  }, [projects.length, workspace]);

  useEffect(() => {
    if (!workspace) {
      return;
    }

    if (activeFlowNodeId && !workspace.flow.nodes.some((node) => node.id === activeFlowNodeId)) {
      setActiveFlowNodeId(workspace.flow.nodes[0]?.id ?? "");
    }

    if (activeNoteId && !workspace.notes.some((note) => note.id === activeNoteId)) {
      setActiveNoteId(workspace.notes[0]?.id ?? "");
    }

    if (activeDocId && !workspace.docs.some((doc) => doc.id === activeDocId)) {
      setActiveDocId(workspace.docs[0]?.id ?? "");
    }

    if (activeCardId && !workspace.kanban.cards.some((card) => card.id === activeCardId)) {
      setActiveCardId(workspace.kanban.cards[0]?.id ?? "");
    }
  }, [activeCardId, activeDocId, activeFlowNodeId, activeNoteId, workspace]);

  if (!workspace) {
    return <main className="min-h-screen p-6">Loading...</main>;
  }

  return (
    <main className="min-h-screen px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto grid max-w-[1600px] gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="panel panel-grid overflow-hidden p-5">
          <div className="mb-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="section-title">Workspace</p>
                <h1
                  className="mt-3 text-4xl leading-none"
                  style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.05em" }}
                >
                  {workspace.name}
                </h1>
              </div>
              <button type="button" onClick={workspaceStore.createProject} className="rounded-full bg-black p-3 text-white">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-4 text-sm text-black/70">{workspace.summary}</p>
            <p className="mt-4 text-xs text-black/55">Updated {formatDate(workspace.updatedAt)}</p>
          </div>

          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <p className="section-title">Projects</p>
              <span className="badge">{projects.length}</span>
            </div>
            <div className="space-y-2">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => workspaceStore.setActiveProject(project.id)}
                  className={clsx(
                    "w-full rounded-2xl border px-4 py-3 text-left transition",
                    project.id === workspaceStore.activeProjectId
                      ? "border-black bg-black text-white shadow-card"
                      : "border-black/10 bg-white/70 hover:bg-white"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{project.name}</p>
                      <p className={clsx("mt-1 line-clamp-2 text-xs", project.id === workspaceStore.activeProjectId ? "text-white/65" : "text-black/55")}>
                        {project.summary}
                      </p>
                    </div>
                    {project.settings.archived ? <span className="badge border-white/10 bg-white/10 text-white">Archived</span> : null}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <nav className="space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={clsx(
                    "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition",
                    activeSection === section.id ? "bg-black text-white shadow-card" : "bg-white/70 hover:bg-white"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span>{section.label}</span>
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              );
            })}
          </nav>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-black/10 bg-white/70 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-black/50">{stat.label}</p>
                <p className="mt-2 text-2xl" style={{ fontFamily: "var(--font-heading)" }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </aside>

        <section className="panel min-h-[85vh] overflow-hidden p-3 md:p-4">
          {activeSection === "overview" ? (
            <OverviewPanel workspace={workspace} onJump={setActiveSection} />
          ) : null}

          {activeSection === "flows" ? (
            <FlowMap
              workspace={workspace}
              activeNodeId={activeFlowNodeId}
              onNodeSelect={(nodeId) => {
                setActiveFlowNodeId(nodeId);
                setActiveSection("flows");
              }}
              onAddNode={workspaceStore.addFlowNode}
              onUpdateNode={workspaceStore.updateFlowNode}
              onMoveNode={workspaceStore.moveFlowNode}
              onAddConnection={workspaceStore.addFlowConnection}
              onRemoveConnection={workspaceStore.removeFlowConnection}
              onDeleteNode={workspaceStore.deleteFlowNode}
              onPickNote={(noteId) => {
                setActiveNoteId(noteId);
                setActiveSection("notes");
              }}
              onPickDoc={(docId) => {
                setActiveDocId(docId);
                setActiveSection("docs");
              }}
            />
          ) : null}

          {activeSection === "notes" ? (
            <NotesPanel
              workspace={workspace}
              activeNoteId={activeNoteId}
              onNoteSelect={setActiveNoteId}
              onAddNote={workspaceStore.addNote}
              onUpdateNote={workspaceStore.updateNote}
              onJumpToFlow={(nodeId) => {
                setActiveFlowNodeId(nodeId);
                setActiveSection("flows");
              }}
              onJumpToDoc={(docId) => {
                setActiveDocId(docId);
                setActiveSection("docs");
              }}
              onJumpToCard={(cardId) => {
                setActiveCardId(cardId);
                setActiveSection("kanban");
              }}
            />
          ) : null}

          {activeSection === "docs" ? (
            <DocsPanel
              workspace={workspace}
              activeDocId={activeDocId}
              onDocSelect={setActiveDocId}
              onAddDoc={workspaceStore.addDoc}
              onUpdateDoc={workspaceStore.updateDoc}
            />
          ) : null}

          {activeSection === "kanban" ? (
            <KanbanBoard
              workspace={workspace}
              activeCardId={activeCardId}
              onCardSelect={setActiveCardId}
              onAddCard={workspaceStore.addCard}
              onUpdateCard={workspaceStore.updateCard}
              onMoveCard={workspaceStore.moveCard}
              onJumpToFlow={(nodeId) => {
                setActiveFlowNodeId(nodeId);
                setActiveSection("flows");
              }}
              onJumpToNote={(noteId) => {
                setActiveNoteId(noteId);
                setActiveSection("notes");
              }}
              onJumpToDoc={(docId) => {
                setActiveDocId(docId);
                setActiveSection("docs");
              }}
            />
          ) : null}

          {activeSection === "settings" ? (
            <SettingsPanel
              workspace={workspace}
              projects={projects}
              collection={workspaceStore.collection}
              activeProjectId={workspaceStore.activeProjectId}
              onSelectProject={workspaceStore.setActiveProject}
              onCreateProject={workspaceStore.createProject}
              onDuplicateProject={workspaceStore.duplicateProject}
              onDeleteProject={workspaceStore.deleteProject}
              onUpdateProject={workspaceStore.updateProject}
              onImport={workspaceStore.importPayload}
            />
          ) : null}
        </section>
      </div>
    </main>
  );
};