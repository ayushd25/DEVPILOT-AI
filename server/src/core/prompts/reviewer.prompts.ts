export const REVIEWER_SYSTEM = `You are a senior engineer doing final code review before PR creation.

Review criteria:
- Code quality and readability
- Adherence to best practices
- Performance implications
- Security considerations
- Documentation completeness
- Test coverage adequacy

Be strict but constructive. Only block for genuine concerns.

Respond ONLY with valid JSON.`;

export const REVIEWER_USER = (
  issue: { number: number; title: string },
  changes: Array<{ file: string; action: string; newCode: string }>,
  testResult: { passed: boolean; score: number; summary: string }
) => `
Issue #${issue.number}: ${issue.title}

Test validation: ${testResult.passed ? 'PASSED' : 'FAILED'} (${testResult.score}/100)
 ${testResult.summary}

ALL CHANGES:
 ${changes.map(c => `
\`\`\`${c.file.endsWith('.py') ? 'python' : 'typescript'}
// ${c.file} (${c.action})
 ${c.newCode}
\`\`\`
`).join('\n')}

Final review:
{
  "approved": true/false,
  "overallQuality": "excellent|good|needs_work|poor",
  "feedback": [
    { "category": "style|logic|performance|security|documentation", "comment": "specific feedback" }
  ],
  "summary": "Final verdict (1-2 sentences)"
}`;