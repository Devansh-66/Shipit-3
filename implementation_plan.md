# Implementation Plan: "Critic.AI" - The Professional Asset Auditor
**Category:** 7. AI + Real-World Feedback Systems

## 1. Project Vision
**Critic.AI** is an intelligent feedback engine designed to critique professional assets like Resumes, Portfolio Websites, and Pitch Decks. Unlike generic "chatbots", this tool uses **multimodal AI (Vision + Text)** to "see" the documents as a human would, analyzing layout, aesthetics, and content simultaneously to provide actionable, "real-world" feedback.

## 2. Technology Stack
Designed for **Cloudflare Free Tier** optimization and maximum performance.

*   **Frontend:**
    *   **Framework:** React (Vite) + TypeScript
    *   **Styling:** Modern Vanilla CSS (CSS Variables for theming, Glassmorphism aesthetics)
    *   **State:** React Hooks
    *   **Deployment:** Cloudflare Pages
*   **Backend:**
    *   **Runtime:** Cloudflare Workers (Serverless)
    *   **Framework:** Hono (Lightweight, perfect for Workers)
    *   **Database:** **Cloudflare D1** (SQLite) - For storing audit history and tracking progress.
        *   **Strategy:** We will use `wrangler dev --remote` to connect directly to the live Cloudflare D1 instance during development. No local SQLite files.
    *   **Deployment:** Cloudflare Workers
*   **AI Engine:**
    *   **Provider:** **Google Gemini Pro 1.5** (via Google AI Studio)
    *   **Reasoning:** Chosen over OpenRouter/DeepSeek because Gemini has **native multimodal capabilities** (can process PDFs and Images directly), which is crucial for analyzing the *layout* of resumes and portfolios, not just the text.

## 3. Core Features & "Deep" Capabilities (Category 7 Level)

### A. The "Hiring Committee" Simulation (Multi-Agent System)
Instead of a single "AI Opinion", the system will simulate a debate between three distinct personas:
1.  **The ATS Gatekeeper:** Ruthless, keyword-focused, parsing logic.
2.  **The Hiring Manager:** Focuses on impact, "STAR" method, and results.
3.  **The Design Snob:** Critiques typography, whitespace, and visual hierarchy.
*   **Deep Feature:** The user sees a "Summary Debate" where these agents agree or disagree on specific points.

### B. "Role Matcher" (Context-Aware Intelligence)
*   **Input:** User uploads Resume + *A Job Description (JD)*.
*   **Analysis:** The AI performs a gap analysis. "Your resume is a 60% match for this specific Google L4 role."
*   **Output:** Specific "Missing Keywords" and "Weak Evidence" highlighting.

### C. The "Auto-Fixer" (Generative Action)
*   Don't just say "make bullet points better."
*   **Deep Feature:** The AI offers **Rewritten Versions** of specific bullet points.
*   **Deep Feature:** For Portfolios, it generates specific **CSS Snippets** to fix contrast or spacing issues that the user can copy-paste.

### D. Audit History & Progress Tracking (D1 Powered)
*   Users can save their reports.
*   **Deep Feature:** "Version Comparison". The AI looks at Version 1 vs Version 2 of your resume and graphs the improvement in score. "You fixed the passive voice, score went up by 15%."

## 4. Why is this "Tough"? (The Category 7 Fit)
This project moves beyond simple "text generation" into **Analysis & Synthesis**.
*   **Subjectivity:** Grading design is subjective. We need to prompt-engineer the AI to act as specific personas (e.g., "Senior Apple Designer" or "Faang Recruiter") to give consistent feedback.
*   **Multimodal Complexity:** Handling File Uploads -> Buffer conversion -> Prompting with Media -> Streaming text back is a complex pipeline.
*   **Safety & Privacy:** handling user documents securely in memory without persisting them (stateless processing).
*   **Data Persistence:** Using D1 to track state changes over time (Version 1 vs Version 2) adds significant backend complexity over a stateless wrapper.

## 5. Development Roadmap

### Phase 1: Infrastructure & Direct D1 Connection
*   [ ] Initialize Monorepo (Frontend + Backend)
*   [ ] Setup Cloudflare Worker with Hono.
*   [ ] **D1 Setup:** Provision D1 database on Cloudflare Dashboard.
*   [ ] **D1 Connection:** Configure `wrangler.toml` for `--remote` access.
*   [ ] Create SQL Schema for `Audits` and `Versions`.

### Phase 2: The "Hiring Committee" Engine
*   [ ] Implement Gemini Multimodal Pipeline (PDF/Image -> Text).
*   [ ] Create prompt chains for the 3 distinct personas.
*   [ ] Build the "Debate Summarizer" logic.

### Phase 3: "Role Matcher" & "Auto-Fixer"
*   [ ] Add Job Description input field.
*   [ ] Implement "Gap Analysis" logic.
*   [ ] Build "Rewrite Suggestion" UI.

### Phase 4: Frontend Polish
*   [ ] Build "Dashboard" view for past audits (fetching from D1).
*   [ ] Implement streaming UI for real-time feedback.

## 6. Prompt Engineering Strategy (The "Secret Sauce")
We will use a **Chain-of-Thought** approach in our system prompt:
1.  **Identify:** Extract key sections (Experience, Skills, Header).
2.  **Evaluate:** Score each section against best practices (STAR method, Typography).
3.  **Synthesize:** Generate a "Sandwich" feedback (Compliment -> Critique -> Actionable Fix).
