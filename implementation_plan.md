# Synapse Architecture & Implementation

## 1. Project Overview
**Synapse** is an AI-powered developer tool designed to bridge the gap between exploring a codebase and understanding it. It allows users to input any public GitHub repository, visualizes the file structure, and provides an intelligent chat interface powered by Large Language Models (LLMs) to answer questions about the code, architecture, and functionality.

## 2. Technical Architecture

### A. Frontend (Client)
*   **Framework:** React 19 + Vite
*   **Languages:** TypeScript, CSS Modules (TailwindCSS v4)
*   **Key Components:**
    *   `FileExplorer`: Recursive tree component to navigate repo structure.
    *   `UnifiedChat`: The core chat interface handling user messages, tools, and markdown rendering.
    *   `CodePanel`: Displays file content with syntax highlighting (PrismJS).
    *   `RepoAnalysis`: (Optional) Dedicated views for architectural breakdown.
*   **State Management:** Local React State (useState/useEffect) for simplicity and speed.

### B. Backend (Serverless Edge)
*   **Runtime:** Cloudflare Workers
*   **Framework:** Hono (Edge-optimized web framework)
*   **AI Service:** OpenRouter API (aggregating models like NVIDIA Nemotron, Llama 3).
*   **Key Endpoints:**
    *   `POST /visualize`: Fetches the GitHub repository tree via GitHub API.
    *   `POST /content`: Fetches raw file content from GitHub.
    *   `POST /chat`: The main agentic loop. Receives message history + repo context, calls OpenRouter, and streams Server-Sent Events (SSE) back to the client.

### C. The Agentic Pipeline (`/chat`)
1.  **Context Injection:** The system prompt is dynamically updated with the active Repository URL and the currently open file path.
2.  **Tool Definitions:** The AI is provided with tools:
    *   `read_file`: To read code from the repo.
    *   `list_files`: To explore directories.
    *   `google_search` / `web_scraper`: For external documentation.
3.  **Execution Loop:** The backend runs a loop (up to 25 turns) where the AI can:
    *   Decide to call a tool.
    *   Backend executes the tool (e.g., fetches file content).
    *   Result is fed back to the AI.
    *   AI generates the final natural language response.
4.  **Streaming:** All updates (tool usage, text chunks) are streamed in real-time to the frontend via SSE.

## 3. Key Design Decisions
*   **Statelessness:** The backend is largely stateless. Repository tree and file contents are fetched on-demand from GitHub, ensuring we always work with the latest code and don't need heavy database syncing.
*   **Tailwind v4:** Using the latest CSS-in-JS evolution for performant, zero-runtime styling.
*   **Glassmorphism:** A "Cyberpunk/Sci-Fi" aesthetic to differentiate from standard boring dev tools.
