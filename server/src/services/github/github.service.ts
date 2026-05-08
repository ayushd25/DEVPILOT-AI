import { Octokit } from '@octokit/rest';

export class GitHubService {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  async getUser() {
    const { data } = await this.octokit.rest.users.getAuthenticated();
    return {
      login: data.login,
      name: data.name,
      avatar: data.avatar_url,
      repos: data.public_repos,
    };
  }

  async getIssues(owner: string, repo: string) {
    const { data } = await this.octokit.rest.issues.listForRepo({
      owner,
      repo,
      state: 'open',
      per_page: 50,
      sort: 'created',
      direction: 'desc',
    });

    return data.map(i => ({
      number: i.number,
      title: i.title,
      body: i.body,
      state: i.state,
      labels: i.labels.map(l => ({ name: l.name, color: l.color })),
      created_at: i.created_at,
      user: i.user?.login,
      comments: i.comments,
    }));
  }

  async getIssue(owner: string, repo: string, number: number) {
    const { data } = await this.octokit.rest.issues.get({ owner, repo, issue_number: number });
    return {
      number: data.number,
      title: data.title,
      body: data.body,
      state: data.state,
      labels: data.labels.map(l => ({ name: l.name, color: l.color })),
      created_at: data.created_at,
      user: data.user?.login,
      comments: data.comments,
    };
  }

  async getRepoTree(owner: string, repo: string, branch = 'main') {
    try {
      const { data } = await this.octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: branch,
        recursive: true,
      });
      return data.tree
        .filter(item => item.type === 'blob')
        .map(item => ({ path: item.path, sha: item.sha, size: item.size }));
    } catch {
      // Try 'master' branch
      const { data } = await this.octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: 'master',
        recursive: true,
      });
      return data.tree
        .filter(item => item.type === 'blob')
        .map(item => ({ path: item.path, sha: item.sha, size: item.size }));
    }
  }

  async getFileContent(owner: string, repo: string, path: string): Promise<string | null> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({ owner, repo, path });
      if (data.type === 'file' && data.encoding === 'base64') {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
      return null;
    } catch {
      return null;
    }
  }

  async getFilesBatch(owner: string, repo: string, paths: string[]): Promise<Array<{ path: string; content: string }>> {
    const results: Array<{ path: string; content: string }> = [];
    
    // Process in parallel with concurrency limit
    const batchSize = 5;
    for (let i = 0; i < paths.length; i += batchSize) {
      const batch = paths.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(async (path) => {
          const content = await this.getFileContent(owner, repo, path);
          if (content) return { path, content };
          return null;
        })
      );
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value) {
          results.push(result.value);
        }
      }
    }
    
    return results;
  }

  private async getMainSha(owner: string, repo: string): Promise<string> {
    try {
      const { data } = await this.octokit.rest.git.getRef({ owner, repo, ref: 'heads/main' });
      return data.object.sha;
    } catch {
      const { data } = await this.octokit.rest.git.getRef({ owner, repo, ref: 'heads/master' });
      return data.object.sha;
    }
  }

  async createBranch(owner: string, repo: string, branchName: string): Promise<void> {
    const sha = await this.getMainSha(owner, repo);
    await this.octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha,
    });
  }

  async commitFile(
    owner: string,
    repo: string,
    branch: string,
    path: string,
    content: string,
    message: string
  ): Promise<void> {
    let sha: string | undefined;
    try {
      const { data } = await this.octokit.rest.repos.getContent({ owner, repo, path, ref: branch });
      if (data.type === 'file') sha = data.sha;
    } catch {
      // File doesn't exist
    }

    await this.octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      branch,
      message,
      content: Buffer.from(content).toString('base64'),
      sha,
    });
  }

  async createPR(
    owner: string,
    repo: string,
    options: { title: string; head: string; base: string; body: string }
  ): Promise<{ number: number; html_url: string }> {
    const { data } = await this.octokit.rest.pulls.create({
      owner,
      repo,
      title: options.title,
      head: options.head,
      base: options.base,
      body: options.body,
    });
    return { number: data.number, html_url: data.html_url };
  }
}