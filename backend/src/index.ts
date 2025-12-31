import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { streamSSE } from 'hono/streaming'
import { GitHubService } from './github'
import { tools } from './lib/ai-tools'

type Bindings = {
    OPENROUTER_API_KEY: string
    GOOGLE_API_KEY?: string
    GOOGLE_CSE_ID?: string
    YOUTUBE_API_KEY?: string
    GEMINI_API_KEY?: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/*', cors())

app.get('/', (c) => {
    return c.json({ message: 'Synapse Agentic Backend Online 🧠' })
})

// 1. VISUALIZE: Fetch Repo Tree
app.post('/visualize', async (c) => {
    try {
        const { repoUrl } = await c.req.json();
        if (!repoUrl) return c.json({ error: 'Missing repoUrl' }, 400);

        const gh = new GitHubService();
        const meta: any = await gh.fetchRepoDetails(repoUrl.split("github.com/")[1].split("/")[0], repoUrl.split("github.com/")[1].split("/")[1]);
        const defaultBranch = meta?.default_branch || 'main';
        const tree = await gh.fetchRepoTree(repoUrl, defaultBranch);

        return c.json({ tree, meta });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
})

// 2. CONTENT: Fetch raw file content
app.post('/content', async (c) => {
    try {
        const { repoUrl, filePath, branch } = await c.req.json();
        const parts = repoUrl.split("github.com/")[1].split("/");

        const gh = new GitHubService();
        const content = await gh.fetchFileContent(parts[0], parts[1], filePath, branch || 'main');

        if (!content) return c.json({ error: 'File not found' }, 404);

        return c.json({ content });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
})

// 3. CHAT: Agentic OpenRouter Loop
app.post('/chat', async (c) => {
    const body = await c.req.json();
    let { repoUrl, filePath, history, message } = body;

    // Adapt legacy frontend 'history' format if needed or cleaner user/model list
    // Legacy: { role, parts: [{text}] }
    // New: { role, content }
    let formattedHistory = (history || []).map((h: any) => ({
        role: h.role === 'model' ? 'assistant' : h.role,
        content: h.parts ? h.parts[0].text : h.content
    }));

    // Inject Context
    let systemContent = "You are Synapse, an expert AI software engineer. You have access to tools to read the repository, search the web, and analyze documents. Use them proactively.";

    if (repoUrl) systemContent += `\n\nActive Repository: ${repoUrl}`;

    // Add file context if user has one open (Legacy support)
    if (filePath) {
        systemContent += `\n\nThe user currently has this file open: ${filePath}. If they ask about "this file", refer to it. You can read its content using the read_file tool if needed.`;
    }

    const messages = [
        { role: "system", content: systemContent },
        ...formattedHistory,
        { role: "user", content: message || "Hello" } // Handle empty message
    ];

    return streamSSE(c, async (stream) => {
        // Send a fake session ID to satisfy frontend if it expects it (or just for protocol)
        await stream.writeSSE({ data: `[SESSION_ID]stateless-${Date.now()}` });

        let currentRoundMessages = [...messages];
        let keepLooping = true;
        let loopCount = 0;

        // Tool Specs for OpenRouter
        const toolsSpec = [
            { type: 'function', function: { name: 'google_search', description: 'Search Google for external info', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } } },
            { type: 'function', function: { name: 'youtube_search', description: 'Search YouTube for videos', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } } },
            { type: 'function', function: { name: 'web_scraper', description: 'Scrape content from a URL', parameters: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] } } },
            { type: 'function', function: { name: 'list_files', description: 'List files in the current repository to explore structure. Use path to filter (e.g. "src/components").', parameters: { type: 'object', properties: { path: { type: 'string', description: "Optional folder path to list" } } } } },
            { type: 'function', function: { name: 'read_file', description: 'Read the content of a specific file in the repository.', parameters: { type: 'object', properties: { path: { type: 'string', description: "Full path to the file" } }, required: ['path'] } } },
            { type: 'function', function: { name: 'analyze_document', description: 'Analyze an attached image or PDF. Use "FILE::[filename]" as file_url for uploaded files.', parameters: { type: 'object', properties: { file_url: { type: 'string' }, file_type: { type: 'string' }, filename: { type: 'string' } }, required: ['file_url'] } } }
        ];



        while (keepLooping && loopCount < 25) {
            loopCount++;

            try {
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${c.env.OPENROUTER_API_KEY}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://synapse.dev",
                        "X-Title": "Synapse Backend"
                    },
                    body: JSON.stringify({
                        model: "nvidia/nemotron-3-nano-30b-a3b:free", // User requested model
                        messages: currentRoundMessages,
                        tools: toolsSpec,
                        tool_choice: "auto",
                        stream: true
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    await stream.writeSSE({ data: JSON.stringify({ type: 'error', content: `OpenRouter Error: ${response.status} - ${errorText}` }) });
                    return;
                }

                if (!response.body) break;
                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                let aiContent = "";
                let toolCallsBuffer: any[] = [];
                let buffer = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || "";

                    for (const line of lines) {
                        if (!line.trim() || line.trim() === 'data: [DONE]') continue;
                        if (!line.startsWith('data: ')) continue;

                        try {
                            const data = JSON.parse(line.slice(6));
                            const choice = data.choices?.[0];
                            if (!choice) continue;

                            const delta = choice.delta;

                            if (delta.content) {
                                aiContent += delta.content;
                                await stream.writeSSE({ data: JSON.stringify({ type: 'content', content: delta.content }) });
                            }

                            if (delta.tool_calls) {
                                for (const tc of delta.tool_calls) {
                                    if (tc.index !== undefined) {
                                        if (!toolCallsBuffer[tc.index]) {
                                            toolCallsBuffer[tc.index] = { id: tc.id || '', type: 'function', function: { name: '', arguments: '' } };
                                        }
                                        if (tc.id) toolCallsBuffer[tc.index].id = tc.id;
                                        if (tc.function?.name) toolCallsBuffer[tc.index].function.name += tc.function.name;
                                        if (tc.function?.arguments) toolCallsBuffer[tc.index].function.arguments += tc.function.arguments;
                                    }
                                }
                            }
                        } catch (e) {
                            console.error('Parse error', e);
                        }
                    }
                }

                // Process Round Completion
                const assistantMsg: any = {
                    role: 'assistant',
                    content: aiContent || null
                };

                if (toolCallsBuffer.length > 0) {
                    assistantMsg.tool_calls = toolCallsBuffer.map(tc => ({
                        id: tc.id,
                        type: 'function',
                        function: { name: tc.function.name, arguments: tc.function.arguments }
                    }));
                }

                currentRoundMessages.push(assistantMsg);

                if (toolCallsBuffer.length > 0) {
                    await stream.writeSSE({ data: JSON.stringify({ type: 'tool_calls_complete', calls: assistantMsg.tool_calls }) });

                    for (const tc of toolCallsBuffer) {
                        const fnName = tc.function.name;
                        let args = {};
                        try { args = JSON.parse(tc.function.arguments); } catch (e) { }

                        // Execute Tool
                        let result = { content: "Error: Tool not found" };
                        if ((tools as any)[fnName]) {
                            try {
                                // Inject RepoURL and FILES into env
                                const toolEnv = {
                                    ...c.env,
                                    repoUrl,
                                    default_branch: 'main'
                                };
                                await stream.writeSSE({ data: JSON.stringify({ type: 'tool_start', tool: fnName }) });
                                result = await (tools as any)[fnName](args, toolEnv);
                            } catch (err: any) {
                                result = { content: `Tool Execution Error: ${err.message}` };
                            }
                        }

                        await stream.writeSSE({ data: JSON.stringify({ type: 'tool_result', ...result }) });

                        currentRoundMessages.push({
                            role: 'tool',
                            tool_call_id: tc.id,
                            name: fnName,
                            content: typeof result.content === 'string' ? result.content : JSON.stringify(result.content)
                        });
                    }
                    // Loop continues
                } else {
                    keepLooping = false;
                    await stream.writeSSE({ data: JSON.stringify({ type: 'result', natural_response: aiContent }) });
                }

            } catch (e: any) {
                await stream.writeSSE({ data: JSON.stringify({ type: 'error', content: e.message }) });
                keepLooping = false;
            }
        }
    })
})

export default app
