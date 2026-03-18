import { ArrowUpRight, FolderOpen, GitBranch, NotebookPen, StickyNote } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { ProjectWorkspace, WorkspaceSection } from "@/types/workspace";

interface OverviewPanelProps {
  workspace: ProjectWorkspace;
  onJump: (section: WorkspaceSection) => void;
}

export const OverviewPanel = ({ workspace, onJump }: OverviewPanelProps) => {
  const latestNote = workspace.notes[0];
  const latestDoc = workspace.docs[0];
  const inFlightCards = workspace.kanban.cards.filter((card) => card.columnId === "in-progress" || card.columnId === "planned");

  return (
    <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
      <section className="rounded-[28px] bg-[#172121] p-6 text-white shadow-card md:p-8">
        <p className="section-title text-white/60">Project cockpit</p>
        <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-4xl leading-none md:text-6xl" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.06em" }}>
              One workspace for product thinking and delivery.
            </h2>
            <p className="mt-5 max-w-xl text-sm text-white/70 md:text-base">
              Keep user flows, notes, markdown docs, and execution cards linked so each planning decision stays traceable.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onJump("kanban")}
            className="inline-flex items-center gap-2 rounded-full bg-[#fb923c] px-5 py-3 text-sm font-semibold text-[#172121]"
          >
            Open execution board
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <button type="button" onClick={() => onJump("flows")} className="rounded-[24px] bg-white/10 p-5 text-left hover:bg-white/15">
            <GitBranch className="h-5 w-5" />
            <p className="mt-5 text-2xl" style={{ fontFamily: "var(--font-heading)" }}>
              {workspace.flow.nodes.length}
            </p>
            <p className="text-sm text-white/70">Flow nodes mapped</p>
          </button>
          <button type="button" onClick={() => onJump("notes")} className="rounded-[24px] bg-white/10 p-5 text-left hover:bg-white/15">
            <StickyNote className="h-5 w-5" />
            <p className="mt-5 text-2xl" style={{ fontFamily: "var(--font-heading)" }}>
              {workspace.notes.length}
            </p>
            <p className="text-sm text-white/70">Quick notes and research</p>
          </button>
          <button type="button" onClick={() => onJump("docs")} className="rounded-[24px] bg-white/10 p-5 text-left hover:bg-white/15">
            <NotebookPen className="h-5 w-5" />
            <p className="mt-5 text-2xl" style={{ fontFamily: "var(--font-heading)" }}>
              {workspace.docs.length}
            </p>
            <p className="text-sm text-white/70">Structured markdown assets</p>
          </button>
        </div>
      </section>

      <section className="grid gap-4">
        <article className="rounded-[28px] border border-black/10 bg-white/75 p-6 shadow-panel">
          <p className="section-title">Active delivery</p>
          <div className="mt-4 space-y-3">
            {inFlightCards.slice(0, 3).map((card) => (
              <button key={card.id} type="button" onClick={() => onJump("kanban")} className="flex w-full items-start justify-between rounded-2xl border border-black/10 bg-white/80 p-4 text-left">
                <div>
                  <p className="font-semibold text-black/85">{card.title}</p>
                  <p className="mt-1 text-sm text-black/60">{card.description}</p>
                </div>
                <span className="badge">{card.columnId}</span>
              </button>
            ))}
          </div>
        </article>

        <article className="rounded-[28px] border border-black/10 bg-white/75 p-6 shadow-panel">
          <p className="section-title">Recent context</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <button type="button" onClick={() => onJump("notes")} className="rounded-2xl bg-[#f7ede1] p-4 text-left">
              <p className="flex items-center gap-2 text-sm font-semibold"><StickyNote className="h-4 w-4" /> {latestNote.title}</p>
              <p className="mt-2 text-sm text-black/65">{latestNote.body}</p>
              <p className="mt-3 text-xs text-black/50">Updated {formatDate(latestNote.updatedAt)}</p>
            </button>
            <button type="button" onClick={() => onJump("docs")} className="rounded-2xl bg-[#e4f1ef] p-4 text-left">
              <p className="flex items-center gap-2 text-sm font-semibold"><FolderOpen className="h-4 w-4" /> {latestDoc.title}</p>
              <p className="mt-2 text-sm text-black/65">{latestDoc.path}</p>
              <p className="mt-3 text-xs text-black/50">Updated {formatDate(latestDoc.updatedAt)}</p>
            </button>
          </div>
        </article>
      </section>
    </div>
  );
};