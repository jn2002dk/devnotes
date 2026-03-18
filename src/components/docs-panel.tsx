"use client";

import dynamic from "next/dynamic";
import { Plus, ScrollText, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ProjectWorkspace } from "@/types/workspace";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface DocsPanelProps {
  workspace: ProjectWorkspace;
  activeDocId: string;
  onDocSelect: (docId: string) => void;
  onAddDoc: (template: "blank" | "prd" | "feature-spec" | "launch-checklist") => void;
  onUpdateDoc: (docId: string, updater: (doc: ProjectWorkspace["docs"][number]) => ProjectWorkspace["docs"][number]) => void;
  onDeleteDoc: (docId: string) => void;
}

export const DocsPanel = ({ workspace, activeDocId, onDocSelect, onAddDoc, onUpdateDoc, onDeleteDoc }: DocsPanelProps) => {
  const activeDoc = workspace.docs.find((doc) => doc.id === activeDocId) ?? workspace.docs[0] ?? null;

  if (!activeDoc) {
    return (
      <div className="grid h-full gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="panel-grid rounded-[28px] border border-black/10 bg-[#e9f3f1] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-title">Markdown docs</p>
              <h2 className="mt-2 text-2xl" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.05em" }}>Structured project assets</h2>
            </div>
            <button type="button" onClick={() => onAddDoc("blank")} className="rounded-full bg-black p-3 text-white"><Plus className="h-4 w-4" /></button>
          </div>
        </aside>

        <section className="panel flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <p className="section-title">No docs yet</p>
            <h3 className="mt-3 text-3xl" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.05em" }}>Create the first project doc</h3>
            <p className="mt-4 text-sm text-black/65">Use markdown docs for briefs, specs, and checklists that stay linked to notes and execution work.</p>
            <button type="button" onClick={() => onAddDoc("blank")} className="mt-6 rounded-[24px] bg-black px-5 py-4 text-sm font-semibold text-white">Create doc</button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="grid h-full gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="panel-grid rounded-[28px] border border-black/10 bg-[#e9f3f1] p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-title">Markdown docs</p>
            <h2 className="mt-2 text-2xl" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.05em" }}>Structured project assets</h2>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => onAddDoc("blank")} className="rounded-full bg-black p-3 text-white"><Plus className="h-4 w-4" /></button>
            <button type="button" onClick={() => onDeleteDoc(activeDoc.id)} className="rounded-full border border-black/10 bg-white p-3 text-black/70"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(["prd", "feature-spec", "launch-checklist"] as const).map((template) => (
            <button key={template} type="button" onClick={() => onAddDoc(template)} className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs uppercase tracking-[0.18em]">
              {template.replace(/-/g, " ")}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {workspace.docs.map((doc) => (
            <button key={doc.id} type="button" onClick={() => onDocSelect(doc.id)} className={`w-full rounded-2xl p-4 text-left ${doc.id === activeDoc.id ? "bg-black text-white" : "bg-white/75"}`}>
              <p className="font-semibold">{doc.title}</p>
              <p className={`mt-2 text-sm ${doc.id === activeDoc.id ? "text-white/70" : "text-black/55"}`}>{doc.path}</p>
            </button>
          ))}
        </div>
      </aside>

      <section className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="panel min-h-0 overflow-hidden p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="section-title">Editor</p>
              <h3 className="mt-2 text-2xl" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.05em" }}>{activeDoc.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-black/40" />
              <button type="button" onClick={() => onDeleteDoc(activeDoc.id)} className="rounded-full border border-black/10 bg-[#eef5f3] p-2 text-black/70"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <input className="field" value={activeDoc.title} onChange={(event) => onUpdateDoc(activeDoc.id, (doc) => ({ ...doc, title: event.target.value }))} />
            <input className="field" value={activeDoc.path} onChange={(event) => onUpdateDoc(activeDoc.id, (doc) => ({ ...doc, path: event.target.value }))} />
          </div>
          <div className="h-[620px] overflow-hidden rounded-[24px] border border-black/10">
            <MonacoEditor
              defaultLanguage="markdown"
              value={activeDoc.content}
              theme="vs-light"
              onChange={(value) => onUpdateDoc(activeDoc.id, (doc) => ({ ...doc, content: value ?? "" }))}
              options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: "on" }}
            />
          </div>
        </div>

        <div className="panel min-h-0 overflow-hidden p-4">
          <p className="section-title">Preview</p>
          <article className="prose prose-neutral mt-4 max-w-none overflow-y-auto rounded-[24px] bg-white/60 p-6" style={{ height: "720px" }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeDoc.content}</ReactMarkdown>
          </article>
        </div>
      </section>
    </div>
  );
};