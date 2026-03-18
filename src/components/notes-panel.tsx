"use client";

import { Plus, Trash2 } from "lucide-react";
import { NoteItem, ProjectWorkspace } from "@/types/workspace";

interface NotesPanelProps {
  workspace: ProjectWorkspace;
  activeNoteId: string;
  onNoteSelect: (noteId: string) => void;
  onAddNote: () => void;
  onUpdateNote: (noteId: string, updater: (note: NoteItem) => NoteItem) => void;
  onDeleteNote: (noteId: string) => void;
  onJumpToFlow: (nodeId: string) => void;
  onJumpToDoc: (docId: string) => void;
  onJumpToCard: (cardId: string) => void;
}

export const NotesPanel = ({
  workspace,
  activeNoteId,
  onNoteSelect,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onJumpToFlow,
  onJumpToDoc,
  onJumpToCard
}: NotesPanelProps) => {
  const activeNote = workspace.notes.find((note) => note.id === activeNoteId) ?? workspace.notes[0] ?? null;

  if (!activeNote) {
    return (
      <div className="grid h-full gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="panel-grid rounded-[28px] border border-black/10 bg-[#f7efe4] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-title">Notes</p>
              <h2 className="mt-2 text-2xl" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.05em" }}>Loose ideas and research</h2>
            </div>
            <button type="button" onClick={onAddNote} className="rounded-full bg-black p-3 text-white"><Plus className="h-4 w-4" /></button>
          </div>
        </aside>

        <section className="panel flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <p className="section-title">No notes yet</p>
            <h3 className="mt-3 text-3xl" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.05em" }}>
              Start a fresh note
            </h3>
            <p className="mt-4 text-sm text-black/65">
              Capture ideas, research snippets, or next steps and link them back to flows, docs, and cards.
            </p>
            <button type="button" onClick={onAddNote} className="mt-6 rounded-[24px] bg-black px-5 py-4 text-sm font-semibold text-white">
              Create note
            </button>
          </div>
        </section>
      </div>
    );
  }

  const toggleLink = (kind: "flowNodeIds" | "docIds" | "cardIds", targetId: string) => {
    onUpdateNote(activeNote.id, (note) => {
      const hasId = note.links[kind].includes(targetId);

      return {
        ...note,
        links: {
          ...note.links,
          [kind]: hasId ? note.links[kind].filter((id) => id !== targetId) : [...note.links[kind], targetId]
        }
      };
    });
  };

  return (
    <div className="grid h-full gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="panel-grid rounded-[28px] border border-black/10 bg-[#f7efe4] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="section-title">Notes</p>
            <h2 className="mt-2 text-2xl" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.05em" }}>Loose ideas and research</h2>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onAddNote} className="rounded-full bg-black p-3 text-white"><Plus className="h-4 w-4" /></button>
            <button type="button" onClick={() => onDeleteNote(activeNote.id)} className="rounded-full border border-black/10 bg-white p-3 text-black/70"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {workspace.notes.map((note) => (
            <button key={note.id} type="button" onClick={() => onNoteSelect(note.id)} className={`w-full rounded-2xl p-4 text-left ${activeNote.id === note.id ? "bg-black text-white" : "bg-white/70"}`}>
              <p className="font-semibold">{note.title}</p>
              <p className={`mt-2 line-clamp-2 text-sm ${activeNote.id === note.id ? "text-white/70" : "text-black/60"}`}>{note.body}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {note.tags.map((tag) => <span key={tag} className={`badge ${activeNote.id === note.id ? "border-white/10 bg-white/10" : ""}`}>{tag}</span>)}
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className="panel p-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="section-title">Editor</p>
              <button type="button" onClick={() => onDeleteNote(activeNote.id)} className="rounded-full border border-black/10 bg-[#f8efe3] p-2 text-black/70">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <label>
              <span className="mb-2 block text-sm font-semibold">Title</span>
              <input className="field" value={activeNote.title} onChange={(event) => onUpdateNote(activeNote.id, (note) => ({ ...note, title: event.target.value }))} />
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold">Body</span>
              <textarea className="field min-h-[420px]" value={activeNote.body} onChange={(event) => onUpdateNote(activeNote.id, (note) => ({ ...note, body: event.target.value }))} />
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold">Tags</span>
              <input className="field" value={activeNote.tags.join(", ")} onChange={(event) => onUpdateNote(activeNote.id, (note) => ({ ...note, tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) }))} placeholder="research, ux, next-step" />
            </label>

            <div className="grid gap-4 rounded-[28px] bg-[#f8efe3] p-4">
              <div>
                <p className="mb-2 text-sm font-semibold">Link flow nodes</p>
                <div className="flex flex-wrap gap-2">
                  {workspace.flow.nodes.map((node) => (
                    <button key={node.id} type="button" onClick={() => toggleLink("flowNodeIds", node.id)} className={`rounded-full px-3 py-2 text-sm ${activeNote.links.flowNodeIds.includes(node.id) ? "bg-black text-white" : "bg-white"}`}>
                      {node.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">Link docs</p>
                <div className="flex flex-wrap gap-2">
                  {workspace.docs.map((doc) => (
                    <button key={doc.id} type="button" onClick={() => toggleLink("docIds", doc.id)} className={`rounded-full px-3 py-2 text-sm ${activeNote.links.docIds.includes(doc.id) ? "bg-black text-white" : "bg-white"}`}>
                      {doc.title}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">Link cards</p>
                <div className="flex flex-wrap gap-2">
                  {workspace.kanban.cards.map((card) => (
                    <button key={card.id} type="button" onClick={() => toggleLink("cardIds", card.id)} className={`rounded-full px-3 py-2 text-sm ${activeNote.links.cardIds.includes(card.id) ? "bg-black text-white" : "bg-white"}`}>
                      {card.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-4 rounded-[28px] bg-[#faf4ea] p-4">
            <div>
              <p className="section-title">Backlinks</p>
              <div className="mt-3 space-y-2">
                {activeNote.links.flowNodeIds.map((nodeId) => {
                  const node = workspace.flow.nodes.find((item) => item.id === nodeId);
                  if (!node) return null;
                  return <button key={nodeId} type="button" onClick={() => onJumpToFlow(nodeId)} className="w-full rounded-2xl bg-white p-3 text-left text-sm">Flow: {node.label}</button>;
                })}
                {activeNote.links.docIds.map((docId) => {
                  const doc = workspace.docs.find((item) => item.id === docId);
                  if (!doc) return null;
                  return <button key={docId} type="button" onClick={() => onJumpToDoc(docId)} className="w-full rounded-2xl bg-white p-3 text-left text-sm">Doc: {doc.title}</button>;
                })}
                {activeNote.links.cardIds.map((cardId) => {
                  const card = workspace.kanban.cards.find((item) => item.id === cardId);
                  if (!card) return null;
                  return <button key={cardId} type="button" onClick={() => onJumpToCard(cardId)} className="w-full rounded-2xl bg-white p-3 text-left text-sm">Card: {card.title}</button>;
                })}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
};