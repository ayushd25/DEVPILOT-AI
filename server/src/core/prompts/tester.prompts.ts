export const TESTER_SYSTEM = `You are a strict QA engineer reviewing code changes.

Check for:
- Syntax errors (would the code compile/run?)
- Logic errors (does it do what's intended?)
- Missing imports or undefined references
- Type mismatches
- Null/undefined handling
- Edge cases not handled
- Breaking changes to existing functionality
- Security vulnerabilities

Be thorough but fair. Only flag real issues.

Respond ONLY with valid JSON.`;

export const TESTER_USER = (
  issue: { number: number; title: string; body: string | null },
  changes: Array<{ file: string; action: string; originalCode?: string; newCode: string }>
) => `
Issue #${issue.number}: ${issue.title}
 ${issue.body ? `\n${issue.body}\n` : ''}

CODE CHANGES TO VALIDATE:
 ${changes.map(c => `
--- ${c.file} (${c.action}) ---
 ${c.originalCode ? `BEFORE:\n\`\`\`\n${c.originalCode}\n\`\`\`\n` : ''}AFTER:
\`\`\`
 ${c.newCode}
\`\`\`
`).join('\n')}

Analyze these changes:
{
  "passed": true/false,
  "score": 0-100,
  "issues": [
    {
      "severity": "error|warning|info",
      "file": "path if applicable",
      "line": null or line number,
      "message": "specific issue description"
    }
  ],
  "summary": "Brief assessment (1-2 sentences)"
}`;