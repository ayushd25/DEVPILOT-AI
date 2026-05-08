import { BaseAgent } from './base.agent.js';
import { ReviewResult, CodeChange, TestResult } from '../types/agent.types.js';
import { REVIEWER_SYSTEM, REVIEWER_USER } from '../core/prompts/reviewer.prompts.js';

export class ReviewerAgent extends BaseAgent {
  constructor(llm: any, sessionId: string) {
    super('reviewer', 'Performs final code quality review', llm, sessionId);
  }

  async run(input: {
    issue: { number: number; title: string };
    changes: CodeChange[];
    testResult: TestResult;
  }): Promise<ReviewResult> {
    return this.withTrace('review', async () => {
      this.emitStatus('working', 'Reviewing code quality...');

      const response = await this.llm.chat(
        [
          { role: 'system', content: REVIEWER_SYSTEM },
          { role: 'user', content: REVIEWER_USER(input.issue, input.changes, input.testResult) },
        ],
        { temperature: 0.2, jsonMode: true }
      );

      const cleaned = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const result = JSON.parse(cleaned) as ReviewResult;

      if (result.approved) {
        this.emitLog('success', `Review approved — ${result.overallQuality} quality`);
      } else {
        this.emitLog('error', `Review rejected — ${result.overallQuality} quality`);
        result.feedback.forEach(f => {
          this.emitLog('warning', `  [${f.category}] ${f.comment}`);
        });
      }

      this.emitStatus(result.approved ? 'done' : 'error');
      return result;
    });
  }
}