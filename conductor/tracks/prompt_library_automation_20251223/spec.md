# Specification: Prompt Library Automated Discovery

## 1. Overview
This feature enhances the existing Prompt Library by adding an automated discovery mechanism. Similar to the Tech Watch module, this system will utilize Gemini to search the web for high-quality, relevant AI prompts, automatically import them into the library, and classify them with appropriate tags and categories.

## 2. Goals
- **Automated Discovery:** Periodically or on-demand search the web for new and trending prompts.
- **Intelligent Classification:** Use AI to analyze imported prompts and assign relevant tags (e.g., "coding", "creative writing", "productivity") and categories.
- **Quality Filtering:** Implement mechanisms to ensure only high-quality or relevant prompts are added.
- **Integration:** Seamlessly integrate with the existing Prompt Library UI and Supabase backend.

## 3. User Stories
- As a user, I want to trigger a "Discover Prompts" action so that the system finds new prompts for me.
- As a user, I want discovered prompts to be automatically categorized so that I can easily find them later.
- As a user, I want to review discovered prompts before they are permanently added to my personal collection (optional, but good for quality control).
- As a user, I want the system to filter out low-quality or irrelevant prompts.

## 4. Technical Requirements

### 4.1. Backend / API
- **New API Route:** `POST /api/prompt-library/discover` to trigger the discovery process.
- **Search Integration:** Utilize a search API (e.g., Google Search via Gemini or a dedicated tool) to find prompt repositories, forums, or articles.
- **AI Processing:** Use Google Generative AI to:
    - Extract prompts from raw web content.
    - Evaluate prompt quality.
    - Generate metadata (title, description, tags, category).
- **Database:**
    - Use the existing `prompts` table.
    - Potential need for a `source_url` field to track origin.
    - Potential need for a `status` field (e.g., 'discovered', 'active') if a review workflow is implemented.

### 4.2. Frontend
- **UI Update:** Add a "Discover Prompts" button to the Prompt Library header.
- **Status Indication:** Show a loading state or progress indicator during the discovery process.
- **Notification:** Notify the user when new prompts have been added.

## 5. Data Model Changes
- Check existing `prompts` schema.
- potentially add `origin` (text), `external_id` (text), or `is_reviewed` (boolean).

## 6. Constraints & Assumptions
- The system relies on the quality of search results and the LLM's ability to extract structured data.
- Rate limits of the LLM and Search APIs must be respected.
