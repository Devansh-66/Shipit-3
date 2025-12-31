import { GoogleGenerativeAI } from "@google/generative-ai";

export class AIClient {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    }

    // FEATURE 2: Contextual Oracle
    async explainFile(fileName: string, fileContent: string) {
        // limit content if too huge
        const safeContent = fileContent.slice(0, 10000);

        const prompt = `
            You are a Codebase Expert. Explain this file to a new developer.
            
            FILE NAME: ${fileName}
            
            CODE:
            ${safeContent}
            
            OUTPUT:
            Provide a markdown summary with:
            - **Purpose**: What does this file do?
            - **Key Functions**: Important methods.
            - **Dependencies**: Key libraries or imports it uses.
        `;

        const result = await this.model.generateContent(prompt);
        return result.response.text();
    }

    async chatWithFile(fileName: string, fileContent: string, history: any[], message: string) {
        const safeContent = fileContent.slice(0, 15000); // Slightly larger context for chat

        const chat = this.model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{
                        text: `
                        You are a generic coding assistant. 
                        Context:
                        fileName: ${fileName}
                        content:
                        ${safeContent}
                    `}]
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I have read the file. I am ready to answer questions about it." }]
                },
                ...history
            ]
        });

        const result = await chat.sendMessage(message);
        return result.response.text();
    }

    async chatWithRepo(history: any[], tree: any[], packageJson: string | null, readme: string | null, message: string) {
        // Create context string
        const context = `
            CONTEXT:
            This is a repository-level chat.
            
            FILE STRUCTURE (Partial):
            ${JSON.stringify(tree.slice(0, 100).map(t => t.path))}
            
            PACKAGE.JSON:
            ${packageJson ? packageJson.slice(0, 3000) : "Not found"}

            README:
            ${readme ? readme.slice(0, 5000) : "Not found"}
        `;

        const model = this.genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: `You are a Senior Software Architect helping a user understand this codebase. 
            Use the provided context (File Structure, Package.json, Readme) to answer questions.
            
            IMPORTANT: You CANNOT see the content of arbitrary files in the repository.
            - If the user asks for code from a specific file (e.g. "update SkillCard.js"), explain that you cannot read it yet.
            - Instruct the user to **Select the file in the Explorer** to attach it to the chat context.
            
            Be concise, professional, and use Markdown for formatting.
            - Use **bold** for key terms.
            - Use lists for multiple points.
            - Use code blocks for file names or commands.`
        });

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: context }]
                },
                {
                    role: "model",
                    parts: [{ text: "I have analyzed the repository structure and context. I am ready to answer your questions about the architecture, tech stack, or specific features." }]
                },
                ...history
            ]
        });

        const result = await chat.sendMessage(message);
        return result.response.text();
    }

    // Legacy method for one-off analysis (can be removed if unused, but keeping for safety)
    async analyzeArchitecture(tree: any[], packageJson: string | null, readme: string | null) {
        const prompt = `
            You are a Senior Software Architect. Analyze this repository structure and key files to provide a high-level architectural overview.
            
            FILE STRUCTURE (Partial):
            ${JSON.stringify(tree.slice(0, 50).map(t => t.path))}
            
            PACKAGE.JSON:
            ${packageJson ? packageJson.slice(0, 2000) : "Not found"}

            README:
            ${readme ? readme.slice(0, 2000) : "Not found"}
            
            OUTPUT:
            Provide a comprehensive Markdown report with:
            1. **Tech Stack**: Languages, frameworks, key libraries.
            2. **Architecture Pattern**: MVC, Monorepo, Microservices, etc.
            3. **Key Directories**: What is in 'src', 'components', etc.
            4. **Getting Started**: How to run it (inferred).
            5. **Key Features**: Inferred from structure/deps.
        `;

        const result = await this.model.generateContent(prompt);
        return result.response.text();
    }
}
