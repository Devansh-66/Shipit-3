# Critic.AI 🧐
**The Brutally Honest Professional Asset Auditor**

![Critic.AI Hero](https://placehold.co/1200x600/000000/00f2ff?text=Critic.AI+Preview)

> **ShipIt 3.0 Entry | Category 7: AI + Real-World Feedback Systems**

Critic.AI goes beyond generic "ChatGPT advice". It uses **Multimodal AI (Gemini 1.5 Flash)** to "see" your Resume or Portfolio, analyzing visual hierarchy, typography, and content impact simultaneously.

It simulates a **Hiring Committee** of three distinct AI Persona Agents to give you balanced, actionable feedback.

## 🚀 Features

*   **🕵️‍♂️ The Hiring Committee Simulation:**
    *   **The Ruthless Recruiter:** Focuses on impact and brevity.
    *   **The Design Snob:** Critiques whitespace, fonts, and layout.
    *   **The ATS Bot:** Checks for keyword parsing and formatting.
*   **📊 Quantitative Scoring:** Get a 0-100 score based on 4 key metrics (Visuals, Content, Impact, Grammar).
*   **💾 Cloudflare D1 Persistence:** Every audit is saved to the edge database for historical tracking.
*   **⚡ Serverless Architecture:** Built on Cloudflare Workers & Pages for instant speed and 0 cost.

## 🛠️ Tech Stack

*   **Frontend:** React, Vite, TailwindCSS (Glassmorphism UI), Framer Motion.
*   **Backend:** Cloudflare Workers, Hono, TypeScript.
*   **Database:** Cloudflare D1 (SQLite at the Edge).
*   **AI:** Google Gemini 1.5 Flash (Multimodal Vision + Text).

## 🏃‍♂️ How to Run Locally

1.  **Clone the repo**
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
    Create a `.dev.vars` file in `/backend`:
    ```env
    GEMINI_API_KEY="your_google_api_key_here"
    ```

4.  **Run Development Servers**
    *   Backend: `cd backend && npm run dev` (Runs on port 8787)
    *   Frontend: `cd frontend && npm run dev` (Runs on port 5173)

## 🚢 Deployment

Automatically deployed via **GitHub Actions** to Cloudflare Pages (Frontend) and Cloudflare Workers (Backend).

---
*Built with ❤️ for ShipIt 3.0*
