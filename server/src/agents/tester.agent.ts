import { BaseAgent } from './base.agent.js';
import { TestResult, CodeChange } from '../types/agent.types.js';
import { TESTER_SYSTEM, TESTER_USER } from '../core/prompts/tester.prompts.js';
import { DockerExecutor } from '../services/sandbox/docker.executor.js';

export class TesterAgent extends BaseAgent {
  private sandbox: DockerExecutor;

  constructor(llm: any, sessionId: string, sandbox: DockerExecutor) {
    super('tester', 'Validates code changes and runs tests', llm, sessionId);
    this.sandbox = sandbox;
  }

  async run(input: {
    changes: CodeChange[];
    issue: { number: number; title: string; body: string | null };
    runSandbox?: boolean;
  }): Promise<TestResult> {
    return this.withTrace('test', async () => {
      this.emitStatus('working', 'Validating changes...');
      this.emitLog('info', `Analyzing ${input.changes.length} file change(s)...`);

      // 1. AI-based static analysis
      const response = await this.llm.chat(
        [
          { role: 'system', content: TESTER_SYSTEM },
          { role: 'user', content: TESTER_USER(input.issue, input.changes) },
        ],
        { temperature: 0.1, jsonMode: true }
      );

      const cleaned = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const result = JSON.parse(cleaned) as TestResult;

      // 2. Optional sandbox execution
      if (input.runSandbox) {
        this.emitLog('info', 'Running sandbox validation...');
        for (const change of input.changes) {
          const lang = change.file.endsWith('.py') ? 'python' : 'typescript';
          const sandboxResult = await this.sandbox.execute(change.newCode, lang);
          
          if (sandboxResult.exitCode !== 0) {
            result.issues.push({
              severity: 'error',
              file: change.file,
              message: `Sandbox execution failed: ${sandboxResult.stderr}`,
            });
            result.passed = false;
          }
          
          if (sandboxResult.stdout) {
            result.executionOutput = (result.executionOutput || '') + sandboxResult.stdout + '\n';
          }
        }
      }

      // Log results
      if (result.passed) {
        this.emitLog('success', `Validation passed (score: ${result.score}/100)`);
      } else {
        this.emitLog('error', `Validation failed (score: ${result.score}/100)`);
        result.issues.forEach(i => {
          this.emitLog(i.severity === 'error' ? 'error' : 'warning', `  [${i.severity}] ${i.file}: ${i.message}`);
        });
      }

      this.emitStatus(result.passed ? 'done' : 'error');
      return result;
    });
  }
}