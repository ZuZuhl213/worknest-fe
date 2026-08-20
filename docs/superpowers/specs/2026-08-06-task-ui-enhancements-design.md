# Design Spec: Worknest-FE Feature & UI Enhancements

Date: 2026-08-06
Status: Approved

## Overview
Implement UX/UI improvements for Task Detail Modal, My Tasks View, and Kanban Task Board in `@worknest-fe`.

## 1. Task Detail Modal (`task-detail-modal.tsx`)
- **Layout:** 2-column layout (Left: Title, Description, Subtasks, Attachments, Comments; Right: Metadata attributes like Status, Assignee, Priority, Due Date).
- **Loading State:** Replace spinner with a pulse Skeleton loader matching the 2-column layout.

## 2. My Tasks View (`my-tasks-view.tsx`)
- **Grouping:** Group tasks dynamically by Status, Priority, or Project.
- **Filter:** Quick text search filter across task titles.
- **Quick Action:** Inline quick-complete toggle (check/uncheck) on each task item row.

## 3. Kanban Task Board (`task-board.tsx`)
- **Toolbar:** Add a search & filter bar at the top of the Kanban Board.
- **Quick Creation:** Add a `+ Add Task` button at the bottom of each status column.
