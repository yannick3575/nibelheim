## 2024-05-24 - Initial Setup
**Learning:** Initialized Bolt's journal.
**Action:** Record critical performance learnings here.

## 2025-12-31 - Memoization of Frequent Updates
**Learning:** Interactive components like search bars cause frequent re-renders of the parent container. Extracting and memoizing static child components (like stats or filters) prevents them from re-rendering unnecessarily during these high-frequency updates.
**Action:** Identify static or semi-static sections in containers with frequent state updates and extract them into memoized components.
