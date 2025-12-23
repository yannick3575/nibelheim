# Plan: Prompt Library Automated Discovery

## Phase 1: Foundation & Backend Logic
- [ ] Task: Analysis - Review existing Prompt Library Schema and Tech Watch implementation
    - [ ] Subtask: Analyze `supabase/migrations` to understand current `prompts` table.
    - [ ] Subtask: Review `src/lib/tech-watch.ts` to understand how the scraping/search is currently implemented for Tech Watch.
- [ ] Task: Database - Update Schema for Automated Prompts
    - [ ] Subtask: Create a migration to add `source_url`, `is_automated`, and `status` (e.g., 'draft', 'published') fields to the `prompts` table.
- [ ] Task: Backend - Implement Web Search & Extraction Service
    - [ ] Subtask: Create `src/lib/prompt-discovery.ts`.
    - [ ] Subtask: Implement function to search for prompt-related content (reusing or adapting patterns from Tech Watch).
    - [ ] Subtask: Implement function to fetch page content.
- [ ] Task: Backend - Implement AI Extraction & Classification
    - [ ] Subtask: Define a Zod schema for the expected Prompt structure (title, content, tags, category).
    - [ ] Subtask: Create a prompt for Gemini to extract and classify prompts from raw text.
    - [ ] Subtask: Implement the extraction function in `src/lib/prompt-discovery.ts`.
- [ ] Task: Backend - Create Discovery API Route
    - [ ] Subtask: Create `src/app/api/prompt-library/discover/route.ts`.
    - [ ] Subtask: Connect the discovery service to the API route.
    - [ ] Subtask: Implement error handling and response formatting.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Foundation & Backend Logic' (Protocol in workflow.md)

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
