# Worknest-FE UI Refinement & Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine and modernize `@worknest-fe` UI by standardizing design tokens in `index.css`, adding a collapsible sidebar in `dashboard-layout.tsx`, and polishing the Kanban cards in `task-board.tsx`.

**Architecture:** Utilize CSS custom properties for unified dark/light surface contrast, React state with `localStorage` for sidebar collapse state, and simplified badge variants for high readability in Kanban cards.

**Tech Stack:** React 19, TypeScript 5.6+, Vite 8, Tailwind CSS v4, Lucide React, Vitest.

## Global Constraints
- Target codebase: `/home/hoang/java/worknest-fe`
- All tests must pass via `npm run test`
- Production build must succeed via `npm run build`

---

### Task 1: Standardize CSS Custom Properties & Design Tokens

**Files:**
- Modify: `/home/hoang/java/worknest-fe/src/index.css`

- [ ] **Step 1: Update `src/index.css` with unified CSS Variables tokens**

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-primary: #4f46e5;
  --color-primary-hover: #4338ca;
  --color-accent: #6366f1;
  --color-neutral-bg: #fafafa;
  --color-sidebar-bg: #f4f4f5;
  --color-border-custom: #e4e4e7;
  
  /* Statuses */
  --color-todo: #71717a;
  --color-in-progress: #4f46e5;
  --color-review: #a855f7;
  --color-done: #22c55e;
  
  /* Priorities */
  --color-priority-low: #71717a;
  --color-priority-medium: #d97706;
  --color-priority-high: #ea580c;
  --color-priority-urgent: #dc2626;
}

@layer base {
  :root {
    --bg: #fafafa;
    --surface: #ffffff;
    --fg: #18181b;
    --muted: #71717a;
    --border: #e4e4e7;
    --accent: #4f46e5;
  }

  .dark {
    --bg: #0b0f19;
    --surface: #0f172a;
    --fg: #f3f4f6;
    --muted: #9ca3af;
    --border: #1e293b;
    --accent: #6366f1;
  }

  body {
    background-color: var(--bg);
    color: var(--fg);
    font-family: Inter, system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  .uppercase-label {
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
}
```

- [ ] **Step 2: Run build & tests**
Run: `npm run build && npm run test` in `/home/hoang/java/worknest-fe`
Expected: PASS

---

### Task 2: Implement Collapsible Sidebar in Dashboard Layout

**Files:**
- Modify: `/home/hoang/java/worknest-fe/src/shared/layouts/dashboard-layout.tsx`

- [ ] **Step 1: Add `isCollapsed` state and toggle button to Sidebar**

In `DashboardLayout`:
```tsx
const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
  return localStorage.getItem('sidebar_collapsed') === 'true';
});

const toggleSidebar = () => {
  setIsCollapsed(prev => {
    const next = !prev;
    localStorage.setItem('sidebar_collapsed', String(next));
    return next;
  });
};
```

Adjust Sidebar container width dynamically: `isCollapsed ? 'md:w-16' : 'md:w-60'`.

- [ ] **Step 2: Run tests & verify build**
Run: `npm run test` in `/home/hoang/java/worknest-fe`
Expected: PASS

---

### Task 3: Polish Kanban Card Visual Hierarchy in Task Board

**Files:**
- Modify: `/home/hoang/java/worknest-fe/src/features/project/task-board.tsx`

- [ ] **Step 1: Enhance Task Board Card styling**

Apply clean borders, subtle hover elevation (`hover:-translate-y-0.5 hover:shadow-sm transition-transform duration-150`), and progress indicators for subtasks.

- [ ] **Step 2: Run tests & verify build**
Run: `npm run test && npm run build` in `/home/hoang/java/worknest-fe`
Expected: PASS
