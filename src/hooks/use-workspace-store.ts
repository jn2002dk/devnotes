"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createProjectWorkspace } from "@/data/defaultWorkspace";
import {
  fetchWorkspaceCollection,
  hasCachedWorkspaceCollection,
  loadWorkspaceCollection,
  normalizeWorkspaceCollection,
  saveWorkspaceCollection,
  saveWorkspaceCollectionToServer
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

type SyncStatus = "idle" | "loading" | "saving" | "saved" | "error";

export const useWorkspaceStore = () => {
  const [collection, setCollection] = useState<WorkspaceCollection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("loading");
  const [syncMessage, setSyncMessage] = useState("Loading workspace from MariaDB...");
  const hasHydratedRef = useRef(false);
  const lastPersistedRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRequestIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const hydrateCollection = async () => {
      setIsLoading(true);
      setSyncStatus("loading");
      setSyncMessage("Loading workspace from MariaDB...");

      const hasCache = hasCachedWorkspaceCollection();
      const cachedCollection = loadWorkspaceCollection();

      try {
        const { collection: serverCollection, hasPersisted } = await fetchWorkspaceCollection();

        if (cancelled) {
          return;
        }

        if (!hasPersisted && hasCache) {
          setCollection(cachedCollection);
          saveWorkspaceCollection(cachedCollection);

          try {
            const savedCollection = await saveWorkspaceCollectionToServer(cachedCollection);

            if (cancelled) {
              return;
            }

            const serialized = JSON.stringify(savedCollection);

            lastPersistedRef.current = serialized;
            setCollection(savedCollection);
            saveWorkspaceCollection(savedCollection);
            setSyncStatus("saved");
            setSyncMessage("Migrated your cached workspace into MariaDB.");
          } catch {
            if (cancelled) {
              return;
            }

            lastPersistedRef.current = null;
            setSyncStatus("error");
            setSyncMessage("Using your cached workspace because MariaDB could not be updated.");
          }
        } else {
          const serialized = JSON.stringify(serverCollection);

          lastPersistedRef.current = serialized;
          setCollection(serverCollection);
          saveWorkspaceCollection(serverCollection);
          setSyncStatus(hasPersisted ? "saved" : "idle");
          setSyncMessage(
            hasPersisted
              ? "All changes are stored in MariaDB."
              : "MariaDB is ready. Your first edit will create the initial workspace snapshot."
          );
        }
      } catch {
        if (cancelled) {
          return;
        }

        const serialized = JSON.stringify(cachedCollection);

        lastPersistedRef.current = hasCache ? null : serialized;
        setCollection(cachedCollection);
        saveWorkspaceCollection(cachedCollection);
        setSyncStatus(hasCache ? "error" : "idle");
        setSyncMessage(
          hasCache
            ? "MariaDB is unavailable right now. Using cached browser data until sync succeeds."
            : "MariaDB is unavailable right now. You can keep working and the app will retry on save."
        );
      } finally {
        if (!cancelled) {
          hasHydratedRef.current = true;
          setIsLoading(false);
        }
      }
    };

    void hydrateCollection();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!collection || !hasHydratedRef.current) {
      return;
    }

    const serialized = JSON.stringify(collection);

    saveWorkspaceCollection(collection);

    if (serialized === lastPersistedRef.current) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSyncStatus("saving");
    setSyncMessage("Saving changes to MariaDB...");

    const requestId = saveRequestIdRef.current + 1;

    saveRequestIdRef.current = requestId;
    saveTimeoutRef.current = setTimeout(() => {
      void saveWorkspaceCollectionToServer(collection)
        .then((savedCollection) => {
          if (saveRequestIdRef.current !== requestId) {
            return;
          }

          lastPersistedRef.current = JSON.stringify(savedCollection);
          saveWorkspaceCollection(savedCollection);
          setCollection(savedCollection);
          setSyncStatus("saved");
          setSyncMessage("All changes are stored in MariaDB.");
        })
        .catch(() => {
          if (saveRequestIdRef.current !== requestId) {
            return;
          }

          setSyncStatus("error");
          setSyncMessage("Changes are cached locally, but MariaDB sync failed.");
        });
    }, 700);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
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

  const removeFlowConnection = (connectionId: string) => {
    updateWorkspace((current) => ({
      ...current,
      flow: {
        ...current.flow,
        connections: current.flow.connections.filter((connection) => connection.id !== connectionId)
      }
    }));
  };

  const deleteFlowNode = (nodeId: string) => {
    updateWorkspace((current) => ({
      ...current,
      flow: {
        nodes: current.flow.nodes.filter((node) => node.id !== nodeId),
        connections: current.flow.connections.filter(
          (connection) => connection.from !== nodeId && connection.to !== nodeId
        )
      },
      notes: current.notes.map((note) => ({
        ...note,
        links: {
          ...note.links,
          flowNodeIds: note.links.flowNodeIds.filter((linkedNodeId) => linkedNodeId !== nodeId)
        }
      })),
      kanban: {
        cards: current.kanban.cards.map((card) => ({
          ...card,
          linkedFlowNodeId: card.linkedFlowNodeId === nodeId ? "" : card.linkedFlowNodeId
        }))
      }
    }));
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

  const deleteNote = (noteId: string) => {
    updateWorkspace((current) => ({
      ...current,
      notes: current.notes.filter((note) => note.id !== noteId),
      flow: {
        ...current.flow,
        nodes: current.flow.nodes.map((node) => ({
          ...node,
          noteIds: node.noteIds.filter((linkedNoteId) => linkedNoteId !== noteId)
        }))
      },
      docs: current.docs.map((doc) => ({
        ...doc,
        linkedNoteIds: doc.linkedNoteIds.filter((linkedNoteId) => linkedNoteId !== noteId)
      })),
      kanban: {
        cards: current.kanban.cards.map((card) => ({
          ...card,
          linkedNoteId: card.linkedNoteId === noteId ? "" : card.linkedNoteId
        }))
      }
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

  const deleteDoc = (docId: string) => {
    updateWorkspace((current) => ({
      ...current,
      docs: current.docs.filter((doc) => doc.id !== docId),
      flow: {
        ...current.flow,
        nodes: current.flow.nodes.map((node) => ({
          ...node,
          docIds: node.docIds.filter((linkedDocId) => linkedDocId !== docId)
        }))
      },
      notes: current.notes.map((note) => ({
        ...note,
        links: {
          ...note.links,
          docIds: note.links.docIds.filter((linkedDocId) => linkedDocId !== docId)
        }
      })),
      kanban: {
        cards: current.kanban.cards.map((card) => ({
          ...card,
          linkedDocId: card.linkedDocId === docId ? "" : card.linkedDocId
        }))
      }
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

  const deleteCard = (cardId: string) => {
    updateWorkspace((current) => ({
      ...current,
      notes: current.notes.map((note) => ({
        ...note,
        links: {
          ...note.links,
          cardIds: note.links.cardIds.filter((linkedCardId) => linkedCardId !== cardId)
        }
      })),
      docs: current.docs.map((doc) => ({
        ...doc,
        linkedCardIds: doc.linkedCardIds.filter((linkedCardId) => linkedCardId !== cardId)
      })),
      kanban: {
        cards: current.kanban.cards.filter((card) => card.id !== cardId)
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
    isLoading,
    syncStatus,
    syncMessage,
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
    removeFlowConnection,
    deleteFlowNode,
    addNote,
    updateNote,
    deleteNote,
    addDoc,
    updateDoc,
    deleteDoc,
    addCard,
    updateCard,
    deleteCard,
    moveCard
  };
};