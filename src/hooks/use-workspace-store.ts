"use client";

import { useEffect, useMemo, useState } from "react";
import { createProjectWorkspace } from "@/data/defaultWorkspace";
import {
  loadWorkspaceCollection,
  normalizeWorkspaceCollection,
  saveWorkspaceCollection
} from "@/lib/storage";
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
  ProjectWorkspace,
  WorkspaceCollection
} from "@/types/workspace";

const withTimestamp = (workspace: ProjectWorkspace): ProjectWorkspace => ({
  ...workspace,
  updatedAt: new Date().toISOString()
});

export const useWorkspaceStore = () => {
  const [collection, setCollection] = useState<WorkspaceCollection | null>(null);

  useEffect(() => {
    setCollection(loadWorkspaceCollection());
  }, []);

  useEffect(() => {
    if (collection) {
      saveWorkspaceCollection(collection);
    }
  }, [collection]);

  const workspace = useMemo(() => {
    if (!collection) {
      return null;
    }

    return (
      collection.projects.find((project) => project.id === collection.activeProjectId) ??
      collection.projects[0] ??
      null
    );
  }, [collection]);

  const updateCollection = (updater: (current: WorkspaceCollection) => WorkspaceCollection) => {
    setCollection((current) =>
      current
        ? normalizeWorkspaceCollection({
            ...updater(current),
            version: 1,
            updatedAt: new Date().toISOString()
          })
        : current
    );
  };

  const updateWorkspace = (updater: (current: ProjectWorkspace) => ProjectWorkspace) => {
    updateCollection((current) => ({
      ...current,
      projects: current.projects.map((project) =>
        project.id === current.activeProjectId ? withTimestamp(updater(project)) : project
      )
    }));
  };

  const setActiveProject = (projectId: string) => {
    updateCollection((current) => ({
      ...current,
      activeProjectId: current.projects.some((project) => project.id === projectId)
        ? projectId
        : current.activeProjectId
    }));
  };

  const createProject = () => {
    updateCollection((current) => {
      const nextProject = createProjectWorkspace({
        name: `Project ${current.projects.length + 1}`,
        summary: "Capture flows, notes, docs, and delivery plans for a new personal software project."
      });

      return {
        ...current,
        activeProjectId: nextProject.id,
        projects: [nextProject, ...current.projects]
      };
    });
  };

  const duplicateProject = (projectId: string) => {
    updateCollection((current) => {
      const source = current.projects.find((project) => project.id === projectId);

      if (!source) {
        return current;
      }

      const duplicate: ProjectWorkspace = {
        ...JSON.parse(JSON.stringify(source)),
        id: `workspace-${slugify(source.name)}-${createId("copy")}`,
        name: `${source.name} Copy`,
        updatedAt: new Date().toISOString(),
        settings: {
          ...source.settings,
          archived: false
        }
      };

      return {
        ...current,
        activeProjectId: duplicate.id,
        projects: [duplicate, ...current.projects]
      };
    });
  };

  const deleteProject = (projectId: string) => {
    updateCollection((current) => {
      if (current.projects.length === 1) {
        return current;
      }

      const projects = current.projects.filter((project) => project.id !== projectId);

      return {
        ...current,
        activeProjectId:
          current.activeProjectId === projectId ? projects[0].id : current.activeProjectId,
        projects
      };
    });
  };

  const importPayload = (payload: ProjectWorkspace | WorkspaceCollection) => {
    if ("projects" in payload) {
      setCollection(normalizeWorkspaceCollection(payload));
      return;
    }

    setCollection((current) => {
      const base = current ?? loadWorkspaceCollection();
      const importedProject: ProjectWorkspace = {
        ...payload,
        id: `workspace-${slugify(payload.name)}-${createId("import")}`,
        updatedAt: new Date().toISOString()
      };

      return normalizeWorkspaceCollection({
        ...base,
        activeProjectId: importedProject.id,
        updatedAt: new Date().toISOString(),
        projects: [importedProject, ...base.projects]
      });
    });
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
    collection,
    projects: collection?.projects ?? [],
    activeProjectId: collection?.activeProjectId ?? "",
    workspace,
    setCollection,
    setActiveProject,
    createProject,
    duplicateProject,
    deleteProject,
    importPayload,
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