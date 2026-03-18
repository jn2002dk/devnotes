export type WorkspaceSection = "overview" | "flows" | "notes" | "docs" | "kanban" | "settings";

export type FlowNodeType = "screen" | "decision" | "note" | "external";

export interface FlowNode {
  id: string;
  label: string;
  type: FlowNodeType;
  x: number;
  y: number;
  noteIds: string[];
  docIds: string[];
  link: string;
  details: string;
}

export interface FlowConnection {
  id: string;
  from: string;
  to: string;
}

export interface NoteItem {
  id: string;
  title: string;
  body: string;
  tags: string[];
  links: {
    flowNodeIds: string[];
    docIds: string[];
    cardIds: string[];
  };
  updatedAt: string;
}

export interface DocItem {
  id: string;
  title: string;
  path: string;
  content: string;
  template: "blank" | "prd" | "feature-spec" | "launch-checklist";
  linkedNoteIds: string[];
  linkedCardIds: string[];
  updatedAt: string;
}

export type KanbanColumnId = "inbox" | "planned" | "in-progress" | "waiting" | "done";

export interface KanbanCard {
  id: string;
  title: string;
  description: string;
  columnId: KanbanColumnId;
  dueDate: string;
  priority: "low" | "medium" | "high";
  labels: string[];
  linkedFlowNodeId: string;
  linkedNoteId: string;
  linkedDocId: string;
}

export interface ProjectSettings {
  tags: string[];
  archived: boolean;
  accentColor: string;
}

export interface ProjectWorkspace {
  id: string;
  name: string;
  summary: string;
  updatedAt: string;
  flow: {
    nodes: FlowNode[];
    connections: FlowConnection[];
  };
  notes: NoteItem[];
  docs: DocItem[];
  kanban: {
    cards: KanbanCard[];
  };
  settings: ProjectSettings;
}

export interface WorkspaceCollection {
  version: 1;
  activeProjectId: string;
  updatedAt: string;
  projects: ProjectWorkspace[];
}