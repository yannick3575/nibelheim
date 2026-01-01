## 2024-05-24 - Initial Setup
**Learning:** Initialized Bolt's journal.
**Action:** Record critical performance learnings here.
## 2024-05-24 - List Virtualization & Memoization
**Learning:** Extracting large lists into memoized components (like `PromptList`) significantly isolates them from parent state updates (like search inputs), preventing unnecessary re-renders of the entire list during high-frequency events (typing).
**Action:** When a parent component manages both high-frequency state (e.g., input) and a large list, always extract the list into a `React.memo` component to decouple rendering.
