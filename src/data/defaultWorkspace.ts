import { ProjectWorkspace } from "@/types/workspace";

const now = new Date().toISOString();

export const defaultWorkspace: ProjectWorkspace = {
  id: "workspace-personal-planner",
  name: "Personal Dev Planner",
  summary: "Map product thinking, notes, docs, and execution in one local-first workspace.",
  updatedAt: now,
  flow: {
    nodes: [
      {
        id: "node-intake",
        label: "Capture Project Intent",
        type: "screen",
        x: 100,
        y: 80,
        noteIds: ["note-kickoff"],
        docIds: ["doc-prd"],
        link: "https://example.com/project-intent",
        details: "Entry point for defining the project, user value, and rough scope."
      },
      {
        id: "node-scope",
        label: "Scope Decision",
        type: "decision",
        x: 420,
        y: 240,
        noteIds: ["note-research"],
        docIds: ["doc-feature"],
        link: "",
        details: "Choose MVP scope, defer nice-to-haves, and flag unknowns."
      },
      {
        id: "node-ship",
        label: "Ship Plan",
        type: "external",
        x: 760,
        y: 120,
        noteIds: ["note-next"],
        docIds: ["doc-launch"],
        link: "https://example.com/release-plan",
        details: "Move approved work into execution, sequencing launch-critical tasks."
      }
    ],
    connections: [
      {
        id: "connection-1",
        from: "node-intake",
        to: "node-scope"
      },
      {
        id: "connection-2",
        from: "node-scope",
        to: "node-ship"
      }
    ]
  },
  notes: [
    {
      id: "note-kickoff",
      title: "Project kickoff",
      body: "Clarify who this tool is for, what planning artifacts matter, and how quickly ideas must turn into tasks.",
      tags: ["strategy", "ux"],
      links: {
        flowNodeIds: ["node-intake"],
        docIds: ["doc-prd"],
        cardIds: ["card-dashboard"]
      },
      updatedAt: now
    },
    {
      id: "note-research",
      title: "Research snippets",
      body: "Collect examples of lightweight flow mapping, note linking, and markdown doc systems that stay useful for solo work.",
      tags: ["research"],
      links: {
        flowNodeIds: ["node-scope"],
        docIds: ["doc-feature"],
        cardIds: ["card-flow"]
      },
      updatedAt: now
    },
    {
      id: "note-next",
      title: "Next steps",
      body: "Define the launch checklist, finish offline storage, and polish card linking behavior.",
      tags: ["execution"],
      links: {
        flowNodeIds: ["node-ship"],
        docIds: ["doc-launch"],
        cardIds: ["card-pwa"]
      },
      updatedAt: now
    }
  ],
  docs: [
    {
      id: "doc-prd",
      title: "Product brief",
      path: "docs/prd.md",
      template: "prd",
      linkedNoteIds: ["note-kickoff"],
      linkedCardIds: ["card-dashboard"],
      updatedAt: now,
      content: "# Product Brief\n\n## Problem\nSolo software planning often ends up spread across disconnected tools.\n\n## Goal\nKeep flows, notes, docs, and execution in one workspace.\n\n## Outcomes\n- Faster idea-to-task loop\n- Better traceability between UX, decisions, and delivery"
    },
    {
      id: "doc-feature",
      title: "Feature spec",
      path: "docs/specs/flow-mapping.md",
      template: "feature-spec",
      linkedNoteIds: ["note-research"],
      linkedCardIds: ["card-flow"],
      updatedAt: now,
      content: "# Flow Mapping\n\n## User Need\nA practical canvas for screen flows, decisions, and attached planning context.\n\n## Constraints\n- Lightweight\n- Linkable to notes and docs\n- Good enough for one person"
    },
    {
      id: "doc-launch",
      title: "Launch checklist",
      path: "docs/launch-checklist.md",
      template: "launch-checklist",
      linkedNoteIds: ["note-next"],
      linkedCardIds: ["card-pwa"],
      updatedAt: now,
      content: "# Launch Checklist\n\n- [ ] Verify offline shell\n- [ ] Export workspace JSON\n- [ ] Check drag and drop on mobile\n- [ ] Finalize design details"
    }
  ],
  kanban: {
    cards: [
      {
        id: "card-dashboard",
        title: "Shape the dashboard",
        description: "Summarize planning state with linked docs, notes, and active flow coverage.",
        columnId: "planned",
        dueDate: now.slice(0, 10),
        priority: "high",
        labels: ["overview"],
        linkedFlowNodeId: "node-intake",
        linkedNoteId: "note-kickoff",
        linkedDocId: "doc-prd"
      },
      {
        id: "card-flow",
        title: "Refine flow mapping",
        description: "Support notes, connections, and view controls without overbuilding the editor.",
        columnId: "in-progress",
        dueDate: now.slice(0, 10),
        priority: "medium",
        labels: ["flow", "ux"],
        linkedFlowNodeId: "node-scope",
        linkedNoteId: "note-research",
        linkedDocId: "doc-feature"
      },
      {
        id: "card-pwa",
        title: "Finish offline shell",
        description: "Add manifest, service worker, and exported static build support.",
        columnId: "waiting",
        dueDate: now.slice(0, 10),
        priority: "high",
        labels: ["pwa"],
        linkedFlowNodeId: "node-ship",
        linkedNoteId: "note-next",
        linkedDocId: "doc-launch"
      }
    ]
  },
  settings: {
    tags: ["personal", "local-first", "planning"],
    archived: false,
    accentColor: "#fb923c"
  }
};