import { GoogleGenerativeAI } from "@google/generative-ai";

export class AIClient {
    private genAI: GoogleGenerativeAI;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async analyzeResume(fileBuffer: ArrayBuffer, mimeType: string) {
        const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const prompt = `
      You are an expert Technical Recruiter and Senior Designer. 
      Analyze this resume carefully.
      
      Provide a structured JSON response with the following keys:
      - score: A number from 0-100.
      - summary: A brief summary of the candidate's profile.
      - strengths: An array of strings listing top strengths.
      - weaknesses: An array of strings listing areas to improve.
      - section_scores: Object with 0-10 scores for "Visuals", "Content", "Impact", "Grammar".
      - actionable_feedback: An array of specific, constructive advice strings.
      - role_fit: "Junior", "Mid-Level", "Senior", or "Staff".
      
      BE CRITICAL. Do not sugarcoat visuals or weak bullet points.
    `;

        const parts = [
            { text: prompt },
            {
                inlineData: {
                    mimeType: mimeType,
                    data: Buffer.from(fileBuffer).toString("base64"),
                },
            },
        ];

        const result = await model.generateContent({
            contents: [{ role: "user", parts }],
            generationConfig: { responseMimeType: "application/json" }
        });

        const response = result.response;
        return JSON.parse(response.text());
    }
}
