"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Link2, Move, Plus, ZoomIn, ZoomOut } from "lucide-react";
import { FlowNode, FlowNodeType, ProjectWorkspace } from "@/types/workspace";

const nodeColors: Record<FlowNodeType, string> = {
  screen: "bg-[#fff1dd] border-[#fb923c]",
  decision: "bg-[#ece8ff] border-[#7c3a66]",
  note: "bg-[#edf8f7] border-[#1f6f78]",
  external: "bg-[#eef3dd] border-[#6f7d38]"
};

interface FlowMapProps {
  workspace: ProjectWorkspace;
  activeNodeId: string;
  onNodeSelect: (nodeId: string) => void;
  onAddNode: (type: FlowNodeType) => void;
  onUpdateNode: (nodeId: string, updater: (node: FlowNode) => FlowNode) => void;
  onMoveNode: (nodeId: string, x: number, y: number) => void;
  onAddConnection: (from: string, to: string) => void;
  onPickNote: (noteId: string) => void;
  onPickDoc: (docId: string) => void;
}

export const FlowMap = ({
  workspace,
  activeNodeId,
  onNodeSelect,
  onAddNode,
  onUpdateNode,
  onMoveNode,
  onAddConnection,
  onPickNote,
  onPickDoc
}: FlowMapProps) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string>("");
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [connectionTarget, setConnectionTarget] = useState("");

  const activeNode = workspace.flow.nodes.find((node) => node.id === activeNodeId) ?? workspace.flow.nodes[0];

  const connectedNodes = useMemo(
    () => workspace.flow.nodes.reduce<Record<string, string[]>>((accumulator, node) => {
      accumulator[node.id] = workspace.flow.connections
        .filter((connection) => connection.from === node.id)
        .map((connection) => connection.to);
      return accumulator;
    }, {}),
    [workspace.flow.connections, workspace.flow.nodes]
  );

  return (
    <div className="grid h-full gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="relative overflow-hidden rounded-[28px] border border-black/10 bg-[#fffaf3] shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 p-4">
          <div>
            <p className="section-title">Flow designer</p>
            <h2 className="mt-2 text-2xl" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.05em" }}>
              Practical user-flow mapping
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["screen", "decision", "note", "external"] as FlowNodeType[]).map((type) => (
              <button key={type} type="button" onClick={() => onAddNode(type)} className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm capitalize">
                <Plus className="mr-2 inline h-4 w-4" />
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="absolute right-4 top-[96px] z-20 flex gap-2">
          <button type="button" onClick={() => setScale((current) => Math.max(0.6, current - 0.1))} className="rounded-full border border-black/10 bg-white p-2"><ZoomOut className="h-4 w-4" /></button>
          <button type="button" onClick={() => setScale((current) => Math.min(1.6, current + 0.1))} className="rounded-full border border-black/10 bg-white p-2"><ZoomIn className="h-4 w-4" /></button>
          <button type="button" onMouseDown={() => setIsPanning(true)} onMouseUp={() => setIsPanning(false)} className="rounded-full border border-black/10 bg-white p-2"><Move className="h-4 w-4" /></button>
        </div>

        <div
          className={clsx("relative h-[680px] overflow-hidden bg-grain", isPanning && "cursor-grab")}
          style={{ backgroundSize: "18px 18px" }}
          onMouseMove={(event) => {
            if (draggingNodeId) {
              const nextX = (event.nativeEvent.offsetX - offset.x) / scale - dragOffset.x;
              const nextY = (event.nativeEvent.offsetY - offset.y) / scale - dragOffset.y;
              onMoveNode(draggingNodeId, nextX, nextY);
            }

            if (isPanning) {
              setOffset((current) => ({ x: current.x + event.movementX, y: current.y + event.movementY }));
            }
          }}
          onMouseUp={() => {
            setDraggingNodeId("");
            setIsPanning(false);
          }}
          onMouseLeave={() => {
            setDraggingNodeId("");
            setIsPanning(false);
          }}
        >
          <div
            className="absolute inset-0"
            style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: "top left" }}
          >
            <svg className="absolute inset-0 h-full w-full overflow-visible">
              {workspace.flow.connections.map((connection) => {
                const from = workspace.flow.nodes.find((node) => node.id === connection.from);
                const to = workspace.flow.nodes.find((node) => node.id === connection.to);

                if (!from || !to) {
                  return null;
                }

                const startX = from.x + 110;
                const startY = from.y + 40;
                const endX = to.x + 110;
                const endY = to.y + 40;
                const midX = (startX + endX) / 2;

                return (
                  <path
                    key={connection.id}
                    d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
                    fill="none"
                    stroke="rgba(23,33,33,0.4)"
                    strokeWidth="3"
                    strokeDasharray="8 8"
                  />
                );
              })}
            </svg>

            {workspace.flow.nodes.map((node) => (
              <button
                key={node.id}
                type="button"
                className={clsx(
                  "absolute w-[220px] rounded-[24px] border-2 p-4 text-left shadow-card transition hover:-translate-y-0.5",
                  nodeColors[node.type],
                  activeNode.id === node.id && "ring-2 ring-black/20"
                )}
                style={{ left: node.x, top: node.y }}
                onMouseDown={(event) => {
                  setDraggingNodeId(node.id);
                  setDragOffset({ x: event.nativeEvent.offsetX / scale, y: event.nativeEvent.offsetY / scale });
                }}
                onClick={() => onNodeSelect(node.id)}
              >
                <p className="text-xs uppercase tracking-[0.2em] text-black/45">{node.type}</p>
                <p className="mt-2 text-lg font-semibold text-black/80">{node.label}</p>
                <p className="mt-3 line-clamp-2 text-sm text-black/60">{node.details || "Click to add the planning context for this step."}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-black/45">
                  <span>{node.noteIds.length} notes</span>
                  <span>{node.docIds.length} docs</span>
                  <span>{connectedNodes[node.id]?.length ?? 0} exits</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <aside className="panel flex h-full flex-col gap-4 p-4">
        <div>
          <p className="section-title">Selected node</p>
          <h3 className="mt-2 text-2xl" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.05em" }}>
            {activeNode.label}
          </h3>
        </div>

        <label>
          <span className="mb-2 block text-sm font-semibold">Label</span>
          <input className="field" value={activeNode.label} onChange={(event) => onUpdateNode(activeNode.id, (node) => ({ ...node, label: event.target.value }))} />
        </label>

        <label>
          <span className="mb-2 block text-sm font-semibold">Details</span>
          <textarea className="field min-h-[110px]" value={activeNode.details} onChange={(event) => onUpdateNode(activeNode.id, (node) => ({ ...node, details: event.target.value }))} />
        </label>

        <label>
          <span className="mb-2 block text-sm font-semibold">External link</span>
          <input className="field" value={activeNode.link} onChange={(event) => onUpdateNode(activeNode.id, (node) => ({ ...node, link: event.target.value }))} placeholder="https://..." />
        </label>

        <div>
          <span className="mb-2 block text-sm font-semibold">Link another node</span>
          <div className="flex gap-2">
            <select className="field" value={connectionTarget} onChange={(event) => setConnectionTarget(event.target.value)}>
              <option value="">Choose target</option>
              {workspace.flow.nodes.filter((node) => node.id !== activeNode.id).map((node) => (
                <option key={node.id} value={node.id}>{node.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                if (connectionTarget) {
                  onAddConnection(activeNode.id, connectionTarget);
                  setConnectionTarget("");
                }
              }}
              className="rounded-2xl bg-black px-4 text-white"
            >
              <Link2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div>
          <span className="mb-2 block text-sm font-semibold">Attached notes</span>
          <div className="mb-3 flex flex-wrap gap-2">
            {workspace.notes.map((note) => {
              const linked = activeNode.noteIds.includes(note.id);

              return (
                <button
                  key={note.id}
                  type="button"
                  onClick={() =>
                    onUpdateNode(activeNode.id, (node) => ({
                      ...node,
                      noteIds: linked ? node.noteIds.filter((id) => id !== note.id) : [...node.noteIds, note.id]
                    }))
                  }
                  className={clsx("rounded-full px-3 py-2 text-sm", linked ? "bg-black text-white" : "bg-white")}
                >
                  {note.title}
                </button>
              );
            })}
          </div>
          <div className="space-y-2">
            {workspace.notes.filter((note) => activeNode.noteIds.includes(note.id)).map((note) => (
              <button key={note.id} type="button" onClick={() => onPickNote(note.id)} className="w-full rounded-2xl border border-black/10 bg-white/80 p-3 text-left text-sm hover:bg-white">
                {note.title}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-2 block text-sm font-semibold">Attached docs</span>
          <div className="mb-3 flex flex-wrap gap-2">
            {workspace.docs.map((doc) => {
              const linked = activeNode.docIds.includes(doc.id);

              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() =>
                    onUpdateNode(activeNode.id, (node) => ({
                      ...node,
                      docIds: linked ? node.docIds.filter((id) => id !== doc.id) : [...node.docIds, doc.id]
                    }))
                  }
                  className={clsx("rounded-full px-3 py-2 text-sm", linked ? "bg-black text-white" : "bg-white")}
                >
                  {doc.title}
                </button>
              );
            })}
          </div>
          <div className="space-y-2">
            {workspace.docs.filter((doc) => activeNode.docIds.includes(doc.id)).map((doc) => (
              <button key={doc.id} type="button" onClick={() => onPickDoc(doc.id)} className="w-full rounded-2xl border border-black/10 bg-white/80 p-3 text-left text-sm hover:bg-white">
                {doc.title}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};