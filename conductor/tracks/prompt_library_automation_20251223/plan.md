# Plan: Prompt Library Automated Discovery

## Phase 1: Foundation & Backend Logic
- [x] Task: Analysis - Review existing Prompt Library Schema and Tech Watch implementation [ea81001]
- [x] Task: Database - Update Schema for Automated Prompts [b14aaf3]
- [x] Task: Backend - Implement Web Search & Extraction Service [cf632a1]
- [x] Task: Backend - Implement AI Extraction & Classification [cf632a1]
- [x] Task: Backend - Create Discovery API Route [cf632a1]
- [x] Task: Conductor - User Manual Verification 'Phase 1: Foundation & Backend Logic' (Protocol in workflow.md) [checkpoint: ec6ae5f]

## Phase 2: Frontend Integration
- [ ] Task: UI - Add Discovery Trigger
    - [ ] Subtask: Update `src/modules/prompt-library/components/filter-bar.tsx` or main page to include a "Discover Prompts" button.
    - [ ] Subtask: Implement the API call to trigger discovery.
    - [ ] Subtask: Add loading state feedback (e.g., toast or spinner).
- [ ] Task: UI - Display Discovered Prompts
    - [ ] Subtask: Update the prompt list query to include (or filter by) discovered prompts.
    - [ ] Subtask: (Optional) Add a visual indicator (badge) for auto-discovered prompts.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Frontend Integration' (Protocol in workflow.md)

## Phase 3: Refinement & Testing
- [ ] Task: Testing - Write Integration Tests
    - [ ] Subtask: Write tests for the discovery service (mocking external APIs).
    - [ ] Subtask: Write tests for the API route.
- [ ] Task: Polish - Improve Extraction Quality
    - [ ] Subtask: Refine the system prompt used for extraction based on initial results.
    - [ ] Subtask: Tune search queries for better relevance.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Refinement & Testing' (Protocol in workflow.md)
