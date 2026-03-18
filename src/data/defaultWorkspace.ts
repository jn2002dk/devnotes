import { createId, slugify } from "@/lib/utils";
import { ProjectWorkspace, WorkspaceCollection } from "@/types/workspace";

const buildWorkspace = ({
  id,
  name,
  summary,
  accentColor,
  docTitle,
  featureTitle,
  launchTitle,
  kickoffTitle,
  researchTitle,
  nextTitle
}: {
  id: string;
  name: string;
  summary: string;
  accentColor: string;
  docTitle: string;
  featureTitle: string;
  launchTitle: string;
  kickoffTitle: string;
  researchTitle: string;
  nextTitle: string;
}): ProjectWorkspace => {
  const now = new Date().toISOString();
  const prefix = slugify(id);
  const ids = {
    nodeIntake: `${prefix}-node-intake`,
    nodeScope: `${prefix}-node-scope`,
    nodeShip: `${prefix}-node-ship`,
    noteKickoff: `${prefix}-note-kickoff`,
    noteResearch: `${prefix}-note-research`,
    noteNext: `${prefix}-note-next`,
    docPrd: `${prefix}-doc-prd`,
    docFeature: `${prefix}-doc-feature`,
    docLaunch: `${prefix}-doc-launch`,
    cardDashboard: `${prefix}-card-dashboard`,
    cardFlow: `${prefix}-card-flow`,
    cardPwa: `${prefix}-card-pwa`
  };

  return {
    id,
    name,
    summary,
    updatedAt: now,
    flow: {
      nodes: [
        {
          id: ids.nodeIntake,
          label: "Capture Project Intent",
          type: "screen",
          x: 100,
          y: 80,
          noteIds: [ids.noteKickoff],
          docIds: [ids.docPrd],
          link: "https://example.com/project-intent",
          details: "Entry point for defining the project, user value, and rough scope."
        },
        {
          id: ids.nodeScope,
          label: "Scope Decision",
          type: "decision",
          x: 420,
          y: 240,
          noteIds: [ids.noteResearch],
          docIds: [ids.docFeature],
          link: "",
          details: "Choose MVP scope, defer nice-to-haves, and flag unknowns."
        },
        {
          id: ids.nodeShip,
          label: "Ship Plan",
          type: "external",
          x: 760,
          y: 120,
          noteIds: [ids.noteNext],
          docIds: [ids.docLaunch],
          link: "https://example.com/release-plan",
          details: "Move approved work into execution, sequencing launch-critical tasks."
        }
      ],
      connections: [
        {
          id: `${prefix}-connection-1`,
          from: ids.nodeIntake,
          to: ids.nodeScope
        },
        {
          id: `${prefix}-connection-2`,
          from: ids.nodeScope,
          to: ids.nodeShip
        }
      ]
    },
    notes: [
      {
        id: ids.noteKickoff,
        title: kickoffTitle,
        body: "Clarify who this tool is for, what planning artifacts matter, and how quickly ideas must turn into tasks.",
        tags: ["strategy", "ux"],
        links: {
          flowNodeIds: [ids.nodeIntake],
          docIds: [ids.docPrd],
          cardIds: [ids.cardDashboard]
        },
        updatedAt: now
      },
      {
        id: ids.noteResearch,
        title: researchTitle,
        body: "Collect examples of lightweight flow mapping, note linking, and markdown doc systems that stay useful for solo work.",
        tags: ["research"],
        links: {
          flowNodeIds: [ids.nodeScope],
          docIds: [ids.docFeature],
          cardIds: [ids.cardFlow]
        },
        updatedAt: now
      },
      {
        id: ids.noteNext,
        title: nextTitle,
        body: "Define the launch checklist, finish offline storage, and polish card linking behavior.",
        tags: ["execution"],
        links: {
          flowNodeIds: [ids.nodeShip],
          docIds: [ids.docLaunch],
          cardIds: [ids.cardPwa]
        },
        updatedAt: now
      }
    ],
    docs: [
      {
        id: ids.docPrd,
        title: docTitle,
        path: "docs/prd.md",
        template: "prd",
        linkedNoteIds: [ids.noteKickoff],
        linkedCardIds: [ids.cardDashboard],
        updatedAt: now,
        content: "# Product Brief\n\n## Problem\nSolo software planning often ends up spread across disconnected tools.\n\n## Goal\nKeep flows, notes, docs, and execution in one workspace.\n\n## Outcomes\n- Faster idea-to-task loop\n- Better traceability between UX, decisions, and delivery"
      },
      {
        id: ids.docFeature,
        title: featureTitle,
        path: "docs/specs/flow-mapping.md",
        template: "feature-spec",
        linkedNoteIds: [ids.noteResearch],
        linkedCardIds: [ids.cardFlow],
        updatedAt: now,
        content: "# Flow Mapping\n\n## User Need\nA practical canvas for screen flows, decisions, and attached planning context.\n\n## Constraints\n- Lightweight\n- Linkable to notes and docs\n- Good enough for one person"
      },
      {
        id: ids.docLaunch,
        title: launchTitle,
        path: "docs/launch-checklist.md",
        template: "launch-checklist",
        linkedNoteIds: [ids.noteNext],
        linkedCardIds: [ids.cardPwa],
        updatedAt: now,
        content: "# Launch Checklist\n\n- [ ] Verify offline shell\n- [ ] Export workspace JSON\n- [ ] Check drag and drop on mobile\n- [ ] Finalize design details"
      }
    ],
    kanban: {
      cards: [
        {
          id: ids.cardDashboard,
          title: "Shape the dashboard",
          description: "Summarize planning state with linked docs, notes, and active flow coverage.",
          columnId: "planned",
          dueDate: now.slice(0, 10),
          priority: "high",
          labels: ["overview"],
          linkedFlowNodeId: ids.nodeIntake,
          linkedNoteId: ids.noteKickoff,
          linkedDocId: ids.docPrd
        },
        {
          id: ids.cardFlow,
          title: "Refine flow mapping",
          description: "Support notes, connections, and view controls without overbuilding the editor.",
          columnId: "in-progress",
          dueDate: now.slice(0, 10),
          priority: "medium",
          labels: ["flow", "ux"],
          linkedFlowNodeId: ids.nodeScope,
          linkedNoteId: ids.noteResearch,
          linkedDocId: ids.docFeature
        },
        {
          id: ids.cardPwa,
          title: "Finish offline shell",
          description: "Add manifest, service worker, and exported static build support.",
          columnId: "waiting",
          dueDate: now.slice(0, 10),
          priority: "high",
          labels: ["pwa"],
          linkedFlowNodeId: ids.nodeShip,
          linkedNoteId: ids.noteNext,
          linkedDocId: ids.docLaunch
        }
      ]
    },
    settings: {
      tags: ["personal", "local-first", "planning"],
      archived: false,
      accentColor
    }
  };
};

export const createProjectWorkspace = ({
  name,
  summary,
  accentColor = "#fb923c"
}: {
  name: string;
  summary: string;
  accentColor?: string;
}) =>
  buildWorkspace({
    id: `workspace-${slugify(name)}-${createId("project")}`,
    name,
    summary,
    accentColor,
    docTitle: "Product brief",
    featureTitle: "Feature spec",
    launchTitle: "Launch checklist",
    kickoffTitle: "Project kickoff",
    researchTitle: "Research snippets",
    nextTitle: "Next steps"
  });

export const defaultWorkspace: ProjectWorkspace = buildWorkspace({
  id: "workspace-personal-planner",
  name: "Personal Dev Planner",
  summary: "Map product thinking, notes, docs, and execution in one local-first workspace.",
  accentColor: "#fb923c",
  docTitle: "Product brief",
  featureTitle: "Feature spec",
  launchTitle: "Launch checklist",
  kickoffTitle: "Project kickoff",
  researchTitle: "Research snippets",
  nextTitle: "Next steps"
});

export const defaultWorkspaceCollection: WorkspaceCollection = {
  version: 1,
  activeProjectId: defaultWorkspace.id,
  updatedAt: new Date().toISOString(),
  projects: [
    defaultWorkspace,
    buildWorkspace({
      id: "workspace-habit-tracker",
      name: "Habit Tracker MVP",
      summary: "Design a small personal product around motivation loops, streaks, and frictionless check-ins.",
      accentColor: "#1f6f78",
      docTitle: "Habit tracker brief",
      featureTitle: "Check-in flow spec",
      launchTitle: "MVP release checklist",
      kickoffTitle: "Concept notes",
      researchTitle: "Retention ideas",
      nextTitle: "Release follow-ups"
    })
  ]
};