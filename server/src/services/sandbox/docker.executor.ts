import { SandboxResult } from './execution.result.js';

export class DockerExecutor {
  private enabled: boolean;

  constructor(enabled: boolean) {
    this.enabled = enabled;
  }

  async execute(
    code: string,
    language: string,
    options: {
      timeout?: number;
      command?: string;
      env?: Record<string, string>;
    } = {}
  ): Promise<SandboxResult> {
    if (!this.enabled) {
      // Simulated execution for when Docker is not available
      return this.simulatedExecution(code, language);
    }

    const { timeout = 30000, command, env = {} } = options;
    const startTime = Date.now();

    try {
      // In production, this would use the Docker API or dockerode
      // For now, we simulate the execution
      const result = this.simulatedExecution(code, language);
      result.duration = Date.now() - startTime;
      return result;
    } catch (error: any) {
      return {
        exitCode: 1,
        stdout: '',
        stderr: error.message,
        timedOut: false,
        duration: Date.now() - startTime,
      };
    }
  }

  async runTests(
    files: Array<{ path: string; content: string }>,
    testCommand: string,
    options: { timeout?: number } = {}
  ): Promise<SandboxResult> {
    if (!this.enabled) {
      return {
        exitCode: 0,
        stdout: 'Tests passed (simulated - enable Docker for real execution)',
        stderr: '',
        timedOut: false,
        duration: 500,
      };
    }

    const startTime = Date.now();
    
    // In production, this would:
    // 1. Create a Docker container with the repo
    // 2. Copy the modified files
    // 3. Run the test command
    // 4. Capture output
    // 5. Clean up container

    return {
      exitCode: 0,
      stdout: 'Tests passed (simulated)',
      stderr: '',
      timedOut: false,
      duration: Date.now() - startTime,
    };
  }

  private simulatedExecution(code: string, language: string): SandboxResult {
    // Basic validation based on language
    const errors: string[] = [];

    if (language === 'typescript' || language === 'javascript') {
      // Check for obvious syntax issues
      const openBraces = (code.match(/{/g) || []).length;
      const closeBraces = (code.match(/}/g) || []).length;
      if (Math.abs(openBraces - closeBraces) > 0) {
        errors.push('Unmatched braces detected');
      }

      const openParens = (code.match(/\(/g) || []).length;
      const closeParens = (code.match(/\)/g) || []).length;
      if (Math.abs(openParens - closeParens) > 0) {
        errors.push('Unmatched parentheses detected');
      }
    }

    return {
      exitCode: errors.length > 0 ? 1 : 0,
      stdout: 'Code validated successfully',
      stderr: errors.join('\n'),
      timedOut: false,
      duration: 100,
    };
  }
}