export const CODER_SYSTEM = `You are an expert programmer generating precise code fixes.

Your approach:
1. Read the existing code carefully
2. Make minimal, targeted changes
3. Preserve existing style and patterns
4. Handle edge cases

Critical rules:
- For "modify": originalCode must be an EXACT substring from the file
- For "create": provide complete, working code
- Don't add unnecessary comments or changes
- Match the existing code style exactly
- Include all necessary imports

Respond ONLY with valid JSON.`;

export const CODER_USER = (
  step: { id: number; description: string; changeType: string },
  issue: { number: number; title: string; body: string | null },
  context: string,
  previousError?: string,
  previousAttempts?: string[]
) => `
Issue #${issue.number}: ${issue.title}
 ${issue.body ? `\n${issue.body}\n` : ''}

Current step: ${step.description}
Change type: ${step.changeType}

RELEVANT CODE CONTEXT:
 ${context}

 ${previousError ? `\n⚠️ PREVIOUS ATTEMPT FAILED:\n${previousError}\n\nYou MUST fix this error in your new implementation.\n` : ''}
 ${previousAttempts?.length ? `\nPrevious approaches tried (DO NOT repeat these exactly):\n${previousAttempts.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\nTry a different approach.\n` : ''}

Generate the fix:
{
  "explanation": "What you changed and why (2-3 sentences)",
  "changes": [
    {
      "file": "path/to/file",
      "action": "modify|create",
      "originalCode": "exact code to replace (for modify actions only)",
      "newCode": "the complete new/updated code"
    }
  ],
  "approach": "Brief description of your approach (to avoid repeating failed attempts)"
}`;