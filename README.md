# Synapse 🧠
**Intelligent Codebase Visualization & Analysis**

![Synapse Preview](https://github.com/Devansh-66/Shipit-3/blob/main/frontend/src/assets/image.png)

> **ShipIt 3.0 Entry | Category: Dev Tools / AI Agents**

Synapse is an advanced **Agentic AI IDE Companion** that lets you visualize, explore, and talk to your GitHub repositories. It combines a beautiful glassmorphic file explorer with a powerful context-aware AI chat to help developers understand complex codebases instantly.

## 🚀 Features

*   **📂 Interactive Code Visualization:** View any GitHub repository as a navigable file tree instantly.
*   **🤖 Context-Aware AI Chat:** Chat with an AI that knows your repository's structure and file contents.
*   **👁️ Live Preview:** Preview the `homepage` of the repository directly within the app (if available in the repository).
*   **📝 Rich Code Experience:** Full syntax highlighting, markdown rendering, and tabbed code browsing.
*   **🛠️ Agentic Tools:**
    *   **Repo Walker:** The AI can list files and read file contents autonomously.
    *   **Web Search:** Capable of searching Google/YouTube for libraries and documentation.
    *   **Document Analysis:** (Optional) Analyze images and PDFs for context from the repository.
*   **⚡ Serverless Architecture:** Powered by Cloudflare Workers for low-latency performance.

## 🛠️ Tech Stack

*   **Frontend:** React, Vite, TailwindCSS v4, Lucide Icons, Framer Motion.
*   **Backend:** Cloudflare Workers, Hono, TypeScript.
*   **AI Inference:** OpenRouter (NVIDIA Nemotron models).

## 🏃‍♂️ How to Run Locally

1.  **Clone the Repo**
    ```bash
    git clone https://github.com/Devansh-66/Shipit-3.git
    cd Shipit-3
    ```

2.  **Install Dependencies**
    ```bash
    cd backend && npm install
    cd ../frontend && npm install
    ```

3.  **Setup Secrets**
    Create a `.dev.vars` file in `/backend` with your API keys:
    ```env
    OPENROUTER_API_KEY="your_key"
    # Optional:
    GOOGLE_API_KEY="..."
    GOOGLE_CSE_ID="..."
    ```

4.  **Run Development Servers**
    *   **Backend:** `cd backend && npm run dev` (Runs on port 8787)
    *   **Frontend:** `cd frontend && npm run dev` (Runs on port 5173)

## 🚢 Deployment

Deployed to **Cloudflare Pages** (Frontend) and **Cloudflare Workers** (Backend).

---
*Built for ShipIt 3.0*
