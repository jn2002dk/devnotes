"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Grip, Link2, Move, Plus, Trash2, ZoomIn, ZoomOut } from "lucide-react";
import { FlowNode, FlowNodeType, ProjectWorkspace } from "@/types/workspace";

const NODE_WIDTH = 220;
const NODE_HEIGHT = 132;
const CANVAS_WIDTH = 1800;
const CANVAS_HEIGHT = 1200;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

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
  onRemoveConnection: (connectionId: string) => void;
  onDeleteNode: (nodeId: string) => void;
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
  onRemoveConnection,
  onDeleteNode,
  onPickNote,
  onPickDoc
}: FlowMapProps) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanMode, setIsPanMode] = useState(false);
  const [connectionTarget, setConnectionTarget] = useState("");
  const [dragState, setDragState] = useState<{
    nodeId: string;
    pointerId: number;
    startClientX: number;
    startClientY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [panState, setPanState] = useState<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    originOffsetX: number;
    originOffsetY: number;
  } | null>(null);

  const activeNode = workspace.flow.nodes.find((node) => node.id === activeNodeId) ?? workspace.flow.nodes[0] ?? null;

  const outgoingConnections = useMemo(
    () => workspace.flow.connections.filter((connection) => connection.from === activeNode?.id),
    [activeNode?.id, workspace.flow.connections]
  );

  const incomingConnections = useMemo(
    () => workspace.flow.connections.filter((connection) => connection.to === activeNode?.id),
    [activeNode?.id, workspace.flow.connections]
  );

  const adjustScale = (nextScale: number) => {
    const boundedScale = clamp(nextScale, 0.6, 1.6);

    if (!viewportRef.current) {
      setScale(boundedScale);
      return;
    }

    const rect = viewportRef.current.getBoundingClientRect();
    const anchorX = rect.width / 2;
    const anchorY = rect.height / 2;
    const worldX = (anchorX - offset.x) / scale;
    const worldY = (anchorY - offset.y) / scale;

    setOffset({
      x: anchorX - worldX * boundedScale,
      y: anchorY - worldY * boundedScale
    });
    setScale(boundedScale);
  };

  useEffect(() => {
    if (!dragState && !panState) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (dragState && event.pointerId === dragState.pointerId) {
        const nextX = clamp(
          dragState.originX + (event.clientX - dragState.startClientX) / scale,
          0,
          CANVAS_WIDTH - NODE_WIDTH
        );
        const nextY = clamp(
          dragState.originY + (event.clientY - dragState.startClientY) / scale,
          0,
          CANVAS_HEIGHT - NODE_HEIGHT
        );

        onMoveNode(dragState.nodeId, nextX, nextY);
      }

      if (panState && event.pointerId === panState.pointerId) {
        setOffset({
          x: panState.originOffsetX + event.clientX - panState.startClientX,
          y: panState.originOffsetY + event.clientY - panState.startClientY
        });
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (dragState && event.pointerId === dragState.pointerId) {
        setDragState(null);
      }

      if (panState && event.pointerId === panState.pointerId) {
        setPanState(null);
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragState, onMoveNode, panState, scale]);

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
              <button
                key={type}
                type="button"
                onClick={() => onAddNode(type)}
                className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm capitalize"
              >
                <Plus className="mr-2 inline h-4 w-4" />
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="absolute right-4 top-[96px] z-20 flex gap-2">
          <button
            type="button"
            onClick={() => adjustScale(scale - 0.1)}
            className="rounded-full border border-black/10 bg-white p-2"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => adjustScale(scale + 0.1)}
            className="rounded-full border border-black/10 bg-white p-2"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsPanMode((current) => !current)}
            className={clsx("rounded-full border border-black/10 p-2", isPanMode ? "bg-black text-white" : "bg-white")}
          >
            <Move className="h-4 w-4" />
          </button>
        </div>

        <div
          ref={viewportRef}
          className={clsx("relative h-[680px] overflow-hidden bg-grain", isPanMode && "cursor-grab")}
          style={{ backgroundSize: "18px 18px" }}
          onPointerDown={(event) => {
            if (!isPanMode) {
              return;
            }

            if (event.target instanceof Element && event.target.closest("[data-flow-node='true']")) {
              return;
            }

            setPanState({
              pointerId: event.pointerId,
              startClientX: event.clientX,
              startClientY: event.clientY,
              originOffsetX: offset.x,
              originOffsetY: offset.y
            });
          }}
        >
          <div
            className="absolute inset-0 min-h-[1200px] min-w-[1800px]"
            style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: "top left" }}
          >
            <svg className="absolute inset-0 h-full w-full overflow-visible">
              {workspace.flow.connections.map((connection) => {
                const from = workspace.flow.nodes.find((node) => node.id === connection.from);
                const to = workspace.flow.nodes.find((node) => node.id === connection.to);

                if (!from || !to) {
                  return null;
                }

                const startX = from.x + NODE_WIDTH / 2;
                const startY = from.y + NODE_HEIGHT / 2;
                const endX = to.x + NODE_WIDTH / 2;
                const endY = to.y + NODE_HEIGHT / 2;
                const midX = (startX + endX) / 2;
                const controlOffset = Math.abs(endX - startX) / 2;

                return (
                  <g key={connection.id}>
                    <path
                      d={`M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`}
                      fill="none"
                      stroke="rgba(23,33,33,0.4)"
                      strokeWidth="3"
                      strokeDasharray="8 8"
                    />
                    <circle
                      cx={midX}
                      cy={(startY + endY) / 2}
                      r="11"
                      fill="white"
                      stroke="rgba(23,33,33,0.18)"
                      strokeWidth="2"
                      className="cursor-pointer"
                      onClick={() => onRemoveConnection(connection.id)}
                    />
                    <text
                      x={midX}
                      y={(startY + endY) / 2 + 4}
                      textAnchor="middle"
                      fontSize="12"
                      fill="rgba(23,33,33,0.65)"
                      className="pointer-events-none"
                    >
                      ×
                    </text>
                  </g>
                );
              })}
            </svg>

            {workspace.flow.nodes.map((node) => {
              const isActive = activeNode?.id === node.id;

              return (
                <div
                  key={node.id}
                  data-flow-node="true"
                  className={clsx(
                    "absolute w-[220px] rounded-[24px] border-2 p-4 text-left shadow-card transition hover:-translate-y-0.5",
                    nodeColors[node.type],
                    isActive && "ring-2 ring-black/20"
                  )}
                  style={{ left: node.x, top: node.y }}
                  onClick={() => onNodeSelect(node.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-black/45">{node.type}</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Drag ${node.label}`}
                        className="rounded-full bg-white/75 p-2 text-black/65"
                        onPointerDown={(event) => {
                          event.stopPropagation();
                          onNodeSelect(node.id);
                          setDragState({
                            nodeId: node.id,
                            pointerId: event.pointerId,
                            startClientX: event.clientX,
                            startClientY: event.clientY,
                            originX: node.x,
                            originY: node.y
                          });
                        }}
                      >
                        <Grip className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${node.label}`}
                        className="rounded-full bg-white/75 p-2 text-black/65"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeleteNode(node.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-lg font-semibold text-black/80">{node.label}</p>
                  <p className="mt-3 line-clamp-2 text-sm text-black/60">
                    {node.details || "Click to add the planning context for this step."}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-black/45">
                    <span>{node.noteIds.length} notes</span>
                    <span>{node.docIds.length} docs</span>
                    <span>
                      {workspace.flow.connections.filter((connection) => connection.from === node.id).length} exits
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {!workspace.flow.nodes.length ? (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-black/55">
              Add a node to start mapping the project flow.
            </div>
          ) : null}
        </div>
      </section>

      <aside className="panel flex h-full flex-col gap-4 p-4">
        {!activeNode ? (
          <div className="rounded-[24px] bg-[#f8efe3] p-6 text-sm text-black/65">
            Select a node or create a new one to edit flow details.
          </div>
        ) : (
          <>
            <div>
              <p className="section-title">Selected node</p>
              <h3 className="mt-2 text-2xl" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.05em" }}>
                {activeNode.label}
              </h3>
            </div>

            <label>
              <span className="mb-2 block text-sm font-semibold">Label</span>
              <input
                className="field"
                value={activeNode.label}
                onChange={(event) => onUpdateNode(activeNode.id, (node) => ({ ...node, label: event.target.value }))}
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold">Details</span>
              <textarea
                className="field min-h-[110px]"
                value={activeNode.details}
                onChange={(event) => onUpdateNode(activeNode.id, (node) => ({ ...node, details: event.target.value }))}
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold">External link</span>
              <input
                className="field"
                value={activeNode.link}
                onChange={(event) => onUpdateNode(activeNode.id, (node) => ({ ...node, link: event.target.value }))}
                placeholder="https://..."
              />
            </label>

            <div className="rounded-[24px] bg-[#f8efe3] p-4">
              <span className="mb-2 block text-sm font-semibold">Link another node</span>
              <div className="flex gap-2">
                <select className="field" value={connectionTarget} onChange={(event) => setConnectionTarget(event.target.value)}>
                  <option value="">Choose target</option>
                  {workspace.flow.nodes
                    .filter((node) => node.id !== activeNode.id)
                    .map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.label}
                      </option>
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

              <div className="mt-4 space-y-2">
                {outgoingConnections.map((connection) => {
                  const target = workspace.flow.nodes.find((node) => node.id === connection.to);

                  if (!target) {
                    return null;
                  }

                  return (
                    <div key={connection.id} className="flex items-center justify-between rounded-2xl bg-white p-3 text-sm">
                      <span>To {target.label}</span>
                      <button type="button" onClick={() => onRemoveConnection(connection.id)} className="rounded-full bg-[#f4ecdf] p-2 text-black/65">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
                {incomingConnections.map((connection) => {
                  const source = workspace.flow.nodes.find((node) => node.id === connection.from);

                  if (!source) {
                    return null;
                  }

                  return (
                    <div key={connection.id} className="rounded-2xl bg-white p-3 text-sm text-black/60">
                      From {source.label}
                    </div>
                  );
                })}
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
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => onPickNote(note.id)}
                    className="w-full rounded-2xl border border-black/10 bg-white/80 p-3 text-left text-sm hover:bg-white"
                  >
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
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => onPickDoc(doc.id)}
                    className="w-full rounded-2xl border border-black/10 bg-white/80 p-3 text-left text-sm hover:bg-white"
                  >
                    {doc.title}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onDeleteNode(activeNode.id)}
              className="mt-auto rounded-[24px] bg-black px-5 py-4 text-sm font-semibold text-white"
            >
              Delete node
            </button>
          </>
        )}
      </aside>
    </div>
  );
};