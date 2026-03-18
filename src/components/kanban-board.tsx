"use client";

import { useMemo } from "react";
import { DndContext, DragEndEvent, PointerSensor, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Trash2 } from "lucide-react";
import clsx from "clsx";
import { KanbanCard, KanbanColumnId, ProjectWorkspace } from "@/types/workspace";

const columns: Array<{ id: KanbanColumnId; label: string; tone: string }> = [
  { id: "inbox", label: "Inbox", tone: "bg-[#f4eadb]" },
  { id: "planned", label: "Planned", tone: "bg-[#e7edf8]" },
  { id: "in-progress", label: "In Progress", tone: "bg-[#e7f2f0]" },
  { id: "waiting", label: "Waiting", tone: "bg-[#f6e8f0]" },
  { id: "done", label: "Done", tone: "bg-[#e8f1db]" }
];

interface KanbanBoardProps {
  workspace: ProjectWorkspace;
  activeCardId: string;
  onCardSelect: (cardId: string) => void;
  onAddCard: () => void;
  onUpdateCard: (cardId: string, updater: (card: KanbanCard) => KanbanCard) => void;
  onDeleteCard: (cardId: string) => void;
  onMoveCard: (cardId: string, columnId: KanbanColumnId) => void;
  onJumpToFlow: (nodeId: string) => void;
  onJumpToNote: (noteId: string) => void;
  onJumpToDoc: (docId: string) => void;
}

const SortableCard = ({ card, selected, onSelect }: { card: KanbanCard; selected: boolean; onSelect: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: card.id, data: { columnId: card.columnId } });

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={clsx("w-full rounded-[22px] border border-black/10 bg-white p-4 text-left shadow-sm", selected && "ring-2 ring-black/20")}
      onClick={onSelect}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-black/85">{card.title}</p>
          <p className="mt-2 text-sm text-black/60">{card.description || "No description yet."}</p>
        </div>
        <span className="badge">{card.priority}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {card.labels.map((label) => <span key={label} className="badge">{label}</span>)}
      </div>
    </button>
  );
};

const DroppableColumn = ({
  columnId,
  className,
  children
}: {
  columnId: KanbanColumnId;
  className: string;
  children: React.ReactNode;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });

  return (
    <div ref={setNodeRef} className={clsx(className, isOver && "ring-2 ring-black/20")}>
      {children}
    </div>
  );
};

export const KanbanBoard = ({
  workspace,
  activeCardId,
  onCardSelect,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onMoveCard,
  onJumpToFlow,
  onJumpToNote,
  onJumpToDoc
}: KanbanBoardProps) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const activeCard = workspace.kanban.cards.find((card) => card.id === activeCardId) ?? workspace.kanban.cards[0] ?? null;

  const cardsByColumn = useMemo(
    () => columns.reduce<Record<KanbanColumnId, KanbanCard[]>>((accumulator, column) => {
      accumulator[column.id] = workspace.kanban.cards.filter((card) => card.columnId === column.id);
      return accumulator;
    }, { inbox: [], planned: [], "in-progress": [], waiting: [], done: [] }),
    [workspace.kanban.cards]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : "";

    if (!overId) {
      return;
    }

    const destinationColumn = columns.find((column) => column.id === overId)
      ? (overId as KanbanColumnId)
      : workspace.kanban.cards.find((card) => card.id === overId)?.columnId;

    if (destinationColumn) {
      onMoveCard(activeId, destinationColumn);
    }
  };

  if (!activeCard) {
    return (
      <div className="grid h-full gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-[28px] border border-black/10 bg-[#fffaf4] p-4 shadow-panel">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="section-title">Kanban</p>
              <h2 className="mt-2 text-2xl" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.05em" }}>Execution board</h2>
            </div>
            <button type="button" onClick={onAddCard} className="rounded-full bg-black p-3 text-white"><Plus className="h-4 w-4" /></button>
          </div>
          <div className="flex min-h-[680px] items-center justify-center text-center text-black/60">
            <div>
              <p className="section-title">No cards yet</p>
              <p className="mt-3 text-sm">Create a card to start turning plans into execution work.</p>
            </div>
          </div>
        </section>

        <aside className="panel flex items-center justify-center p-8">
          <button type="button" onClick={onAddCard} className="rounded-[24px] bg-black px-5 py-4 text-sm font-semibold text-white">Create card</button>
        </aside>
      </div>
    );
  }

  return (
    <div className="grid h-full gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="rounded-[28px] border border-black/10 bg-[#fffaf4] p-4 shadow-panel">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="section-title">Kanban</p>
            <h2 className="mt-2 text-2xl" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.05em" }}>Execution board</h2>
          </div>
          <button type="button" onClick={onAddCard} className="rounded-full bg-black p-3 text-white"><Plus className="h-4 w-4" /></button>
        </div>

        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="grid gap-4 xl:grid-cols-5">
            {columns.map((column) => (
              <DroppableColumn key={column.id} columnId={column.id} className={clsx("min-h-[680px] rounded-[24px] p-3", column.tone)}>
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold text-black/75">{column.label}</p>
                  <span className="badge">{cardsByColumn[column.id].length}</span>
                </div>
                <SortableContext items={cardsByColumn[column.id].map((card) => card.id)} strategy={rectSortingStrategy}>
                  <div className="space-y-3">
                    {cardsByColumn[column.id].map((card) => (
                      <SortableCard key={card.id} card={card} selected={card.id === activeCard.id} onSelect={() => onCardSelect(card.id)} />
                    ))}
                  </div>
                </SortableContext>
              </DroppableColumn>
            ))}
          </div>
        </DndContext>
      </section>

      <aside className="panel p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="section-title">Card details</p>
            <h3 className="mt-2 text-2xl" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.05em" }}>{activeCard.title}</h3>
          </div>
          <button type="button" onClick={() => onDeleteCard(activeCard.id)} className="rounded-full border border-black/10 bg-[#f8efe3] p-2 text-black/70"><Trash2 className="h-4 w-4" /></button>
        </div>
        <div className="mt-4 space-y-4">
          <input className="field" value={activeCard.title} onChange={(event) => onUpdateCard(activeCard.id, (card) => ({ ...card, title: event.target.value }))} />
          <textarea className="field min-h-[140px]" value={activeCard.description} onChange={(event) => onUpdateCard(activeCard.id, (card) => ({ ...card, description: event.target.value }))} />
          <div className="grid gap-3 md:grid-cols-2">
            <input type="date" className="field" value={activeCard.dueDate} onChange={(event) => onUpdateCard(activeCard.id, (card) => ({ ...card, dueDate: event.target.value }))} />
            <select className="field" value={activeCard.priority} onChange={(event) => onUpdateCard(activeCard.id, (card) => ({ ...card, priority: event.target.value as KanbanCard["priority"] }))}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <input className="field" value={activeCard.labels.join(", ")} onChange={(event) => onUpdateCard(activeCard.id, (card) => ({ ...card, labels: event.target.value.split(",").map((label) => label.trim()).filter(Boolean) }))} placeholder="frontend, offline, launch" />

          <div className="grid gap-3 rounded-[24px] bg-[#f4ebde] p-4">
            <select className="field" value={activeCard.linkedFlowNodeId} onChange={(event) => onUpdateCard(activeCard.id, (card) => ({ ...card, linkedFlowNodeId: event.target.value }))}>
              <option value="">Link flow node</option>
              {workspace.flow.nodes.map((node) => (
                <option key={node.id} value={node.id}>{node.label}</option>
              ))}
            </select>
            <select className="field" value={activeCard.linkedNoteId} onChange={(event) => onUpdateCard(activeCard.id, (card) => ({ ...card, linkedNoteId: event.target.value }))}>
              <option value="">Link note</option>
              {workspace.notes.map((note) => (
                <option key={note.id} value={note.id}>{note.title}</option>
              ))}
            </select>
            <select className="field" value={activeCard.linkedDocId} onChange={(event) => onUpdateCard(activeCard.id, (card) => ({ ...card, linkedDocId: event.target.value }))}>
              <option value="">Link doc</option>
              {workspace.docs.map((doc) => (
                <option key={doc.id} value={doc.id}>{doc.title}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3 rounded-[24px] bg-[#f8efe3] p-4">
            <p className="text-sm font-semibold">Linked assets</p>
            {activeCard.linkedFlowNodeId ? (
              <button type="button" onClick={() => onJumpToFlow(activeCard.linkedFlowNodeId)} className="w-full rounded-2xl bg-white p-3 text-left text-sm">
                Flow node
              </button>
            ) : null}
            {activeCard.linkedNoteId ? (
              <button type="button" onClick={() => onJumpToNote(activeCard.linkedNoteId)} className="w-full rounded-2xl bg-white p-3 text-left text-sm">
                Note
              </button>
            ) : null}
            {activeCard.linkedDocId ? (
              <button type="button" onClick={() => onJumpToDoc(activeCard.linkedDocId)} className="w-full rounded-2xl bg-white p-3 text-left text-sm">
                Doc
              </button>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
};