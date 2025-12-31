import { load } from 'cheerio';
import { GitHubService } from '../github';

export interface ToolResult {
    tool: string;
    content: any;
    source_url?: string | null;
    favicon?: string | null;
    [key: string]: any;
}

const ghService = new GitHubService();

export const tools = {
    google_search: async (args: { query: string }, env: any): Promise<ToolResult> => {
        const apiKey = env.GOOGLE_API_KEY;
        const cx = env.GOOGLE_CSE_ID;
        const query = args.query;

        if (!apiKey || !cx) {
            return { tool: 'google_search', content: 'Error: Google API keys not configured.' };
        }

        try {
            const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=5`;
            const response = await fetch(url);
            const data: any = await response.json();

            if (data.error) {
                throw new Error(data.error.message);
            }

            const results = (data.items || []).map((item: any) => ({
                title: item.title,
                link: item.link,
                snippet: item.snippet,
                displayLink: item.displayLink,
                thumbnail: item.pagemap?.cse_thumbnail?.[0]?.src
            }));

            return {
                tool: 'google_search',
                content: { results, query, total_results: results.length },
                source_url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
                url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
                favicon: "https://www.google.com/s2/favicons?domain=google.com&sz=128"
            };
        } catch (error: any) {
            return { tool: 'google_search', content: `Google search failed: ${error.message}` };
        }
    },

    youtube_search: async (args: { query: string }, env: any): Promise<ToolResult> => {
        const apiKey = env.YOUTUBE_API_KEY;
        const query = args.query;

        if (!apiKey) {
            return { tool: 'youtube_search', content: 'Error: YouTube API key not configured.' };
        }

        try {
            const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(query)}&key=${apiKey}`;
            const response = await fetch(url);
            const data: any = await response.json();

            if (data.error) {
                throw new Error(data.error.message);
            }

            const results = (data.items || []).map((item: any) => ({
                videoId: item.id.videoId,
                url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                title: item.snippet.title,
                description: item.snippet.description,
                channelTitle: item.snippet.channelTitle,
                publishedAt: item.snippet.publishedAt,
                thumbnail: item.snippet.thumbnails?.high?.url
            }));

            return {
                tool: 'youtube_search',
                content: { results, query, total_results: results.length },
                source_url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
                favicon: "https://www.google.com/s2/favicons?domain=youtube.com&sz=128"
            };
        } catch (error: any) {
            return { tool: 'youtube_search', content: `YouTube search failed: ${error.message}` };
        }
    },

    web_scraper: async (args: { url: string }, env: any): Promise<ToolResult> => {
        const url = args.url;
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'SkillMarg-Agent/1.0 (+educational)'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const html = await response.text();
            const $ = load(html);

            // Remove unwanted elements
            $('script, style, noscript, iframe, svg').remove();

            const title = $('title').text().trim();
            const metaDescription = $('meta[name="description"]').attr('content') || '';

            const headings: string[] = [];
            $('h1, h2, h3').each((_, el) => {
                headings.push($(el).text().trim());
            });

            // Get text content
            let text = $('body').text().replace(/\s+/g, ' ').trim();
            if (text.length > 4000) {
                text = text.substring(0, 4000) + '...';
            }

            // Find document links
            const docLinks: string[] = [];
            $('a[href]').each((_, el) => {
                const href = $(el).attr('href');
                if (href && href.match(/\.(pdf|png|jpg|jpeg|webp|gif)$/i)) {
                    if (href.startsWith('http')) {
                        docLinks.push(href);
                    }
                }
            });

            return {
                tool: 'web_scraper',
                content: {
                    url,
                    title,
                    meta_description: metaDescription,
                    headings: headings.slice(0, 10),
                    content: text,
                    document_links: docLinks.slice(0, 5),
                    status: 'success'
                },
                source_url: url,
                url: url,
                favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`
            };

        } catch (error: any) {
            return { tool: 'web_scraper', content: `Scrape failed for ${url}: ${error.message}` };
        }
    },

    list_files: async (args: { path?: string }, env: any): Promise<ToolResult> => {
        // Requires repoUrl in env
        if (!env.repoUrl) return { tool: 'list_files', content: "Error: No repository context provided." };

        const parts = env.repoUrl.split("github.com/")[1].split("/");
        const owner = parts[0];
        const repo = parts[1];

        try {
            // Using GitHub Class directly if possible, or fetch logic
            // Since we imported GitHubService, let's use it
            // Note: fetchRepoTree gets the *whole* tree recursively usually
            const tree = await ghService.fetchRepoTree(env.repoUrl, env.default_branch || 'main');

            // If path provided, filter? fetchRepoTree returns flat list of paths
            let files = tree.map((t: any) => t.path);
            if (args.path) {
                files = files.filter((f: string) => f.startsWith(args.path!));
            }

            // Limit output to avoid context overflow
            return {
                tool: 'list_files',
                content: { files: files.slice(0, 100), total: files.length, note: "Top 100 files shown" }
            };
        } catch (e: any) {
            return { tool: 'list_files', content: `Error listing files: ${e.message}` };
        }
    },

    read_file: async (args: { path: string }, env: any): Promise<ToolResult> => {
        if (!env.repoUrl) return { tool: 'read_file', content: "Error: No repository context provided." };

        const parts = env.repoUrl.split("github.com/")[1].split("/");
        const owner = parts[0];
        const repo = parts[1];

        try {
            const content = await ghService.fetchFileContent(owner, repo, args.path, env.default_branch || 'main');
            if (!content) return { tool: 'read_file', content: `Error: File ${args.path} not found.` };

            // Truncate if too long?
            const truncated = content.length > 8000 ? content.substring(0, 8000) + "... [Truncated]" : content;

            return {
                tool: 'read_file',
                content: truncated
            };
        } catch (e: any) {
            return { tool: 'read_file', content: `Error reading file: ${e.message}` };
        }
    },

    analyze_document: async (args: {
        file_url?: string;
        filename?: string;
        file_type?: string;
    }, env: any): Promise<ToolResult> => {
        try {
            const fileUrl = args.file_url;
            let dataUrl = fileUrl;
            let filename = args.filename || 'document';
            let fileType = args.file_type;

            if (fileUrl && fileUrl.startsWith('data:')) {
                const mimeMatch = fileUrl.match(/^data:([^;]+);/);
                if (mimeMatch) {
                    const mime = mimeMatch[1];
                    if (mime.startsWith('image/')) {
                        fileType = 'image';
                    } else if (mime === 'application/pdf') {
                        fileType = 'pdf';
                    }
                }
            }

            if (!fileType) fileType = 'pdf';

            if (!fileUrl) {
                return { tool: 'analyze_document', content: "Error: No file_url provided." };
            }

            if (fileUrl.startsWith('FILE::') || fileUrl.includes('FILE_REF::')) {
                return { tool: 'analyze_document', content: "Error: File uploads to chat are disabled." };
            }

            const openRouterKey = env.OPENROUTER_API_KEY;
            if (!openRouterKey) {
                return { tool: 'analyze_document', content: "Error: OPENROUTER_API_KEY not configured." };
            }

            // dataUrl initialized at top
            // Using logic from user code
            const toolModel = env.toolModel || "nvidia/nemotron-nano-12b-v2-vl:free";
            let messages: any[] = [];

            if (fileType === 'pdf') {
                messages = [{
                    role: "user",
                    content: [
                        { type: "text", text: "Analyze this PDF document." },
                        {
                            type: "file",
                            file: {
                                type: "pdf",
                                url: dataUrl
                            }
                        }
                    ]
                }];
            } else {
                messages = [{
                    role: "user",
                    content: [
                        { type: "text", text: "Describe this image." },
                        {
                            type: "image_url",
                            image_url: {
                                url: dataUrl
                            }
                        }
                    ]
                }];
            }


            const payload = {
                model: toolModel,
                messages: messages,
                plugins: fileType === 'pdf' ? [{ id: "file-parser", pdf: { engine: "pdf-text" } }] : undefined,
                temperature: 0.2,
                max_tokens: 1000
            };

            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${openRouterKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://synapse.dev", // Updated referrer
                    "X-Title": "Synapse Worker"
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                return { tool: 'analyze_document', content: `AI Error: ${response.status} - ${errText}` };
            }

            const result: any = await response.json();
            const analysis = result.choices?.[0]?.message?.content || "No analysis generated.";

            return {
                tool: 'analyze_document',
                content: analysis,
                filename: filename,
                model_used: toolModel
            };

        } catch (error: any) {
            return { tool: 'analyze_document', content: `Analysis failed: ${error.message}` };
        }
    }
};
