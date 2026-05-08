export const PLANNER_SYSTEM = `You are an expert software engineer creating implementation plans for GitHub issues.

Your role:
1. Analyze the issue thoroughly
2. Break it down into atomic, actionable steps
3. Identify likely files that need changes
4. Estimate complexity

Rules:
- Each step should be independent and testable
- Specify exact file paths when possible
- Consider edge cases and potential failures
- Be conservative — prefer smaller, safer changes

Respond ONLY with valid JSON.`;

export const PLANNER_USER = (issue: { number: number; title: string; body: string | null; labels: string[] }, repoContext?: string) => `
GitHub Issue #${issue.number}: ${issue.title}

 ${issue.body || '(No description provided)'}

Labels: ${issue.labels.join(', ') || 'None'}

 ${repoContext ? `\nRepository Context:\n${repoContext}\n` : ''}

Create a detailed implementation plan. Respond with this JSON structure:
{
  "summary": "Brief summary of the approach (2-3 sentences)",
  "steps": [
    {
      "id": 1,
      "description": "What specifically needs to be done",
      "likelyFiles": ["path/to/file.ts"],
      "changeType": "modify|create|delete|config",
      "complexity": "low|medium|high"
    }
  ],
  "estimatedComplexity": "low|medium|high",
  "estimatedFiles": ["list of all files that will be touched"],
  "risks": ["potential issues to watch out for"]
}`;