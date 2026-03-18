Build a local-first PWA for personal development projects where each project combines:

User flows for thinking through UX

Notes for loose ideas and research

Markdown files for structured docs

Kanban boards for execution

The key design principle should be: one project = one workspace.

Core modules
1. Project workspace

Each project gets:

overview/dashboard

flow maps

notes

docs

kanban

settings/tags/archive

User flow designer

Keep this lightweight at first:

nodes: screen, decision, note, external step

connections/arrows

zoom/pan

click a node to attach notes, links, and docs

This does not need to be a full Figma clone. Think “practical flow mapping.”

Notes

Use quick notes for:

ideas

meeting notes

research snippets

references

next steps

Support:

rich text or markdown-lite

tags

backlinks to flows/cards/docs

Markdown docs

Treat docs as first-class project assets:

.md files with folders

editor + preview

templates like PRD, feature spec, launch checklist

internal links between files

5. Kanban board

Columns like:

Inbox

Planned

In Progress

Waiting

Done

Cards should be linkable to:

a flow node

a note

a markdown doc

due date / priority / labels

Stack

Next.js App Router

TypeScript

Tailwind

Use JSON files for storage. They will be hosted on a web hotel

PWA manifest + service worker

Monaco Editor for raw markdown files

dnd-kit for kanban drag-and-drop