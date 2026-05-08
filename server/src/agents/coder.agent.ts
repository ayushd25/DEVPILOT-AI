import { BaseAgent } from './base.agent.js';
import { CoderResult, CodeChange, PlanStep } from '../types/agent.types.js';
import { CODER_SYSTEM, CODER_USER } from '../core/prompts/coder.prompts.js';

export class CoderAgent extends BaseAgent {
  constructor(llm: any, sessionId: string) {
    super('coder', 'Generates code fixes based on plan and context', llm, sessionId);
  }

  async run(input: {
    step: PlanStep;
    issue: { number: number; title: string; body: string | null };
    codeContext: Array<{ path: string; content: string }>;
    previousError?: string;
    previousAttempts?: string[];
  }): Promise<CoderResult> {
    return this.withTrace('code', async () => {
      this.emitStatus('working', `Generating fix for step ${input.step.id}...`);
      this.emitLog('info', `Working on: ${input.step.description}`);

      const contextBlock = input.codeContext
        .map(c => `--- ${c.path} ---\n${c.content.slice(0, 10000)}`)
        .join('\n\n');

      const response = await this.llm.chat(
        [
          { role: 'system', content: CODER_SYSTEM },
          {
            role: 'user',
            content: CODER_USER(
              input.step,
              input.issue,
              contextBlock,
              input.previousError,
              input.previousAttempts
            ),
          },
        ],
        { temperature: 0.2, jsonMode: true, maxTokens: 8192 }
      );

      const cleaned = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const result = JSON.parse(cleaned) as CoderResult;

      this.emitLog('success', `Generated ${result.changes.length} change(s)`);
      result.changes.forEach(c => {
        this.emitLog('info', `  ${c.action}: ${c.file}`);
      });
      this.emitLog('debug', `Approach: ${result.approach || 'N/A'}`);

      this.emitStatus('done');
      return result;
    });
  }
}