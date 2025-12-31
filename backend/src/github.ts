
import { Buffer } from 'node:buffer';

export class GitHubService {
    async fetchRepoTree(repoUrl: string, branch: string = 'main') {
        // repoUrl format: https://github.com/owner/repo
        const parts = repoUrl.split("github.com/")[1].split("/");
        const owner = parts[0];
        const repo = parts[1];

        // Use GitHub API (Unauthenticated for public repos)
        // Rate limit is 60/hr. For production, we should add a token.
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;

        const response = await fetch(apiUrl, {
            headers: {
                "User-Agent": "Synapse-Explorer"
            }
        });

        if (!response.ok) {
            throw new Error(`GitHub API Error: ${response.statusText}`);
        }

        const data = await response.json();

        // Transform into a cleaner list format
        // We only want blob (files) and tree (folders)
        // @ts-ignore
        return data.tree.map(item => ({
            path: item.path,
            type: item.type === "tree" ? "folder" : "file",
            url: item.url // API url to fetch content
        }));
    }

    async fetchFileContent(owner: string, repo: string, path: string, branch: string = 'main') {
        // Use raw.githubusercontent.com for content
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
        const response = await fetch(rawUrl);
        if (!response.ok) return null;

        // Check for binary content (images) based on extension
        const isImage = /\.(png|jpg|jpeg|gif|svg|ico|webp)$/i.test(path);

        if (isImage) {
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            return `data:image/${path.split('.').pop()};base64,${buffer.toString('base64')}`;
        }

        return await response.text();
    }

    async fetchRepoDetails(owner: string, repo: string) {
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
        const response = await fetch(apiUrl, {
            headers: { "User-Agent": "Synapse-Explorer" }
        });
        if (!response.ok) return null;
        return await response.json();
    }
}
