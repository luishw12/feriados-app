const GITHUB_API = 'https://api.github.com';

interface GitHubRef {
  object: { sha: string };
}

interface GitHubContentResponse {
  content: string;
  sha: string;
  encoding: string;
}

interface GitHubPullRequest {
  html_url: string;
  number: number;
}

function githubHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

export async function getDefaultBranchSha(token: string, repo: string): Promise<string> {
  const response = await fetch(`${GITHUB_API}/repos/${repo}/git/ref/heads/main`, {
    headers: githubHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`Falha ao obter branch main (${response.status})`);
  }

  const data = (await response.json()) as GitHubRef;
  return data.object.sha;
}

export async function createBranch(
  token: string,
  repo: string,
  branchName: string,
  fromSha: string,
): Promise<void> {
  const response = await fetch(`${GITHUB_API}/repos/${repo}/git/refs`, {
    method: 'POST',
    headers: githubHeaders(token),
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: fromSha }),
  });

  if (!response.ok) {
    throw new Error(`Falha ao criar branch ${branchName} (${response.status})`);
  }
}

export async function getFileContent(
  token: string,
  repo: string,
  path: string,
  ref?: string,
): Promise<{ content: string; sha: string } | null> {
  const query = ref ? `?ref=${encodeURIComponent(ref)}` : '';
  const response = await fetch(`${GITHUB_API}/repos/${repo}/contents/${path}${query}`, {
    headers: githubHeaders(token),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Falha ao ler ${path} (${response.status})`);
  }

  const data = (await response.json()) as GitHubContentResponse;
  const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
  return { content: decoded, sha: data.sha };
}

export async function putFileContent(
  token: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  branch: string,
  sha?: string,
): Promise<void> {
  const body: Record<string, string> = {
    message,
    content: Buffer.from(content, 'utf-8').toString('base64'),
    branch,
  };

  if (sha) {
    body.sha = sha;
  }

  const response = await fetch(`${GITHUB_API}/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: githubHeaders(token),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Falha ao gravar ${path} (${response.status})`);
  }
}

export async function putBinaryFileContent(
  token: string,
  repo: string,
  path: string,
  base64Content: string,
  message: string,
  branch: string,
  sha?: string,
): Promise<void> {
  const body: Record<string, string> = {
    message,
    content: base64Content,
    branch,
  };

  if (sha) {
    body.sha = sha;
  }

  const response = await fetch(`${GITHUB_API}/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: githubHeaders(token),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Falha ao gravar imagem ${path} (${response.status})`);
  }
}

export async function createPullRequest(
  token: string,
  repo: string,
  title: string,
  body: string,
  head: string,
  base = 'main',
): Promise<GitHubPullRequest> {
  const response = await fetch(`${GITHUB_API}/repos/${repo}/pulls`, {
    method: 'POST',
    headers: githubHeaders(token),
    body: JSON.stringify({ title, body, head, base }),
  });

  if (!response.ok) {
    throw new Error(`Falha ao criar pull request (${response.status})`);
  }

  return (await response.json()) as GitHubPullRequest;
}
