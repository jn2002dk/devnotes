"use client";

import { useEffect, useState } from "react";
import { loadWorkspace, saveWorkspace } from "@/lib/storage";
import { createId, slugify } from "@/lib/utils";
import { docTemplates } from "@/lib/templates";
import {
  DocItem,
  FlowConnection,
  FlowNode,
  FlowNodeType,
  KanbanCard,
  KanbanColumnId,
  NoteItem,
  ProjectWorkspace
} from "@/types/workspace";

const withTimestamp = (workspace: ProjectWorkspace): ProjectWorkspace => ({
  ...workspace,
  updatedAt: new Date().toISOString()
});

export const useWorkspaceStore = () => {
  const [workspace, setWorkspace] = useState<ProjectWorkspace | null>(null);

  useEffect(() => {
    setWorkspace(loadWorkspace());
  }, []);

  useEffect(() => {
    if (workspace) {
      saveWorkspace(workspace);
    }
  }, [workspace]);

  const updateWorkspace = (updater: (current: ProjectWorkspace) => ProjectWorkspace) => {
    setWorkspace((current) => (current ? withTimestamp(updater(current)) : current));
  };

  const addFlowNode = (type: FlowNodeType) => {
    updateWorkspace((current) => ({
      ...current,
      flow: {
        ...current.flow,
        nodes: [
          ...current.flow.nodes,
          {
            id: createId("node"),
            label: `${type[0].toUpperCase()}${type.slice(1)} node`,
            type,
            x: 180 + current.flow.nodes.length * 28,
            y: 120 + current.flow.nodes.length * 16,
            noteIds: [],
            docIds: [],
            link: "",
            details: ""
          }
        ]
      }
    }));
  };

  const updateFlowNode = (nodeId: string, updater: (node: FlowNode) => FlowNode) => {
    updateWorkspace((current) => ({
      ...current,
      flow: {
        ...current.flow,
        nodes: current.flow.nodes.map((node) => (node.id === nodeId ? updater(node) : node))
      }
    }));
  };

  const moveFlowNode = (nodeId: string, x: number, y: number) => {
    updateFlowNode(nodeId, (node) => ({ ...node, x, y }));
  };

  const addFlowConnection = (from: string, to: string) => {
    if (from === to) {
      return;
    }

    updateWorkspace((current) => {
      const exists = current.flow.connections.some(
        (connection) => connection.from === from && connection.to === to
      );

      if (exists) {
        return current;
      }

      const nextConnection: FlowConnection = {
        id: createId("connection"),
        from,
        to
      };

      return {
        ...current,
        flow: {
          ...current.flow,
          connections: [...current.flow.connections, nextConnection]
        }
      };
    });
  };

  const addNote = () => {
    updateWorkspace((current) => ({
      ...current,
      notes: [
        {
          id: createId("note"),
          title: "Untitled note",
          body: "",
          tags: [],
          links: {
            flowNodeIds: [],
            docIds: [],
            cardIds: []
          },
          updatedAt: new Date().toISOString()
        },
        ...current.notes
      ]
    }));
  };

  const updateNote = (noteId: string, updater: (note: NoteItem) => NoteItem) => {
    updateWorkspace((current) => ({
      ...current,
      notes: current.notes.map((note) =>
        note.id === noteId ? { ...updater(note), updatedAt: new Date().toISOString() } : note
      )
    }));
  };

  const addDoc = (template: DocItem["template"]) => {
    updateWorkspace((current) => {
      const title = template === "blank" ? "Untitled doc" : template.replace(/-/g, " ");
      const id = createId("doc");

      return {
        ...current,
        docs: [
          {
            id,
            title,
            path: `docs/${slugify(title)}.md`,
            content: docTemplates[template],
            template,
            linkedNoteIds: [],
            linkedCardIds: [],
            updatedAt: new Date().toISOString()
          },
          ...current.docs
        ]
      };
    });
  };

  const updateDoc = (docId: string, updater: (doc: DocItem) => DocItem) => {
    updateWorkspace((current) => ({
      ...current,
      docs: current.docs.map((doc) =>
        doc.id === docId ? { ...updater(doc), updatedAt: new Date().toISOString() } : doc
      )
    }));
  };

  const addCard = () => {
    updateWorkspace((current) => ({
      ...current,
      kanban: {
        cards: [
          ...current.kanban.cards,
          {
            id: createId("card"),
            title: "New task",
            description: "",
            columnId: "inbox",
            dueDate: "",
            priority: "medium",
            labels: [],
            linkedFlowNodeId: "",
            linkedNoteId: "",
            linkedDocId: ""
          }
        ]
      }
    }));
  };

  const updateCard = (cardId: string, updater: (card: KanbanCard) => KanbanCard) => {
    updateWorkspace((current) => ({
      ...current,
      kanban: {
        cards: current.kanban.cards.map((card) => (card.id === cardId ? updater(card) : card))
      }
    }));
  };

  const moveCard = (cardId: string, columnId: KanbanColumnId) => {
    updateCard(cardId, (card) => ({ ...card, columnId }));
  };

  const updateProject = (updater: (project: ProjectWorkspace) => ProjectWorkspace) => {
    updateWorkspace(updater);
  };

  return {
    workspace,
    setWorkspace,
    updateProject,
    addFlowNode,
    updateFlowNode,
    moveFlowNode,
    addFlowConnection,
    addNote,
    updateNote,
    addDoc,
    updateDoc,
    addCard,
    updateCard,
    moveCard
  };
};