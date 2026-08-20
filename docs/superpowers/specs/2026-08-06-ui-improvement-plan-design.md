# Design Spec: Worknest-FE UI Refinement & Modernization

Date: 2026-08-06
Status: Approved

## Overview
Refine and modernize the UI of `@worknest-fe` (React 19 + Tailwind v4) by standardizing design tokens, adding collapsible sidebar functionality to the dashboard layout, and polishing the Kanban task board visual hierarchy.

## 1. Design System & CSS Tokens
- **Location:** `src/index.css`
- **Tokens & Variables:**
  - Define unified CSS custom properties for `:root` and `.dark` mode:
    - `--bg`, `--surface`, `--fg`, `--muted`, `--border`, `--accent`.
  - Uppercase UI labels & badges: `letter-spacing: 0.06em`, `text-transform: uppercase`.
  - Headings & display text: `letter-spacing: -0.01em` / `-0.02em`.
  - Limit `--accent` (indigo) overuse to max 2 focal points per screen view.

## 2. Dashboard Layout & Sidebar Collapse
- **Location:** `src/shared/layouts/dashboard-layout.tsx`
- **Sidebar Collapse:**
  - Add `isCollapsed` state (persisted via `localStorage`).
  - Toggle between expanded width (`w-60` / 240px) and compact width (`w-16` / 64px).
  - Icon-only navigation links in collapsed mode with tooltip hints.
- **Top Header & Search:**
  - Responsive search bar with `Ctrl + K` badge.
  - Refined notification dropdown shadow and animation.

## 3. Kanban Task Board Refinement
- **Location:** `src/features/project/task-board.tsx`
- **Card Hierarchy:**
  - Clean card surface with subtle hover elevation (`translate-y-[-1px]`).
  - Standardized priority badges (Urgent, High, Medium, Low) using muted semantic variants.
  - Subtask visual indicator with progress bar.

## 4. Verification & Testing
- Run `npm run build` and `npm run test` in `/home/hoang/java/worknest-fe` to verify zero type or layout regressions.
