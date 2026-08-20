# Task Modal, My Tasks & Kanban Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance UX/UI across `task-detail-modal.tsx`, `my-tasks-view.tsx`, and `task-board.tsx` in `@worknest-fe`.

**Architecture:** Refactor `task-detail-modal.tsx` to a 2-column flex/grid with skeleton placeholders, introduce grouping & quick completion in `my-tasks-view.tsx`, and add column search + quick-add triggers in `task-board.tsx`.

**Tech Stack:** React 19, TypeScript 5.6+, Vite 8, Tailwind CSS v4, Lucide React, Vitest.

## Global Constraints
- Target codebase: `/home/hoang/java/worknest-fe`
- All tests must pass via `npm run test`
- Production build must succeed via `npm run build`

---

### Task 1: Refactor Task Detail Modal Layout & Add Skeleton Loader

**Files:**
- Modify: `/home/hoang/java/worknest-fe/src/features/task/task-detail-modal.tsx`

- [ ] **Step 1: Add Skeleton loader state when `isLoading` is true**
- [ ] **Step 2: Reorganize modal content into a responsive 2-column layout (Left: content/comments, Right: attributes)**
- [ ] **Step 3: Run `npm run test && npm run build`**

---

### Task 2: Enhance My Tasks View with Grouping, Search & Quick Action

**Files:**
- Modify: `/home/hoang/java/worknest-fe/src/features/task/my-tasks-view.tsx`

- [ ] **Step 1: Add `groupBy` state (`STATUS`, `PRIORITY`, `PROJECT`) and search query state**
- [ ] **Step 2: Add quick-toggle completion button on task rows (updating status to `DONE` / `TODO`)**
- [ ] **Step 3: Run `npm run test && npm run build`**

---

### Task 3: Add Search/Filter & Quick Task Trigger to Kanban Board

**Files:**
- Modify: `/home/hoang/java/worknest-fe/src/features/project/task-board.tsx`
- Modify: `/home/hoang/java/worknest-fe/src/features/project/project-detail-view.tsx`

- [ ] **Step 1: Add Search input & Priority filter toolbar to `task-board.tsx`**
- [ ] **Step 2: Add `+ Add Task` button at the bottom of each status column in `task-board.tsx`**
- [ ] **Step 3: Run `npm run test && npm run build`**
