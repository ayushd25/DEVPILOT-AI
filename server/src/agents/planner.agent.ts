import { BaseAgent } from './base.agent.js';
import { ImplementationPlan } from '../types/agent.types.js';
import { PLANNER_SYSTEM, PLANNER_USER } from '../core/prompts/planner.prompts.js';

export class PlannerAgent extends BaseAgent {
  constructor(llm: any, sessionId: string) {
    super('planner', 'Creates implementation plans from GitHub issues', llm, sessionId);
  }

  async run(input: {
    issue: { number: number; title: string; body: string | null; labels: string[] };
    repoContext?: string;
  }): Promise<ImplementationPlan> {
    return this.withTrace('plan', async () => {
      this.emitStatus('working', 'Analyzing issue...');
      this.emitLog('info', `Reading issue #${input.issue.number}: "${input.issue.title}"`);

      const response = await this.llm.chat(
        [
          { role: 'system', content: PLANNER_SYSTEM },
          { role: 'user', content: PLANNER_USER(input.issue, input.repoContext) },
        ],
        { temperature: 0.3, jsonMode: true }
      );

      const cleaned = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const plan = JSON.parse(cleaned) as ImplementationPlan;

      this.emitLog('success', `Plan created: ${plan.steps.length} steps (${plan.estimatedComplexity} complexity)`);
      this.emitLog('info', `Summary: ${plan.summary}`);
      
      plan.steps.forEach(s => {
        this.emitLog('info', `  Step ${s.id}: ${s.description}`);
        if (s.likelyFiles.length > 0) {
          this.emitLog('debug', `    Files: ${s.likelyFiles.join(', ')}`);
        }
      });

      this.emitStatus('done');
      return plan;
    });
  }
}