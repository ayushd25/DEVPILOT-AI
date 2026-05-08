import { LLMProvider } from './provider.interface.js';
import { OpenRouterProvider } from './openrouter.provider.js';
import { GeminiProvider } from './gemini.provider.js';
import { GroqProvider } from './groq.provider.js';

export class LLMFactory {
  private providers: Map<string, LLMProvider> = new Map();
  private defaultProvider: string;
  private defaultModel: string;

  constructor(config: {
    openrouterKey?: string;
    geminiKey?: string;
    groqKey?: string;
    defaultProvider: string;
    defaultModel: string;
  }) {
    this.defaultProvider = config.defaultProvider;
    this.defaultModel = config.defaultModel;

    if (config.openrouterKey) {
      this.providers.set('openrouter', new OpenRouterProvider(config.openrouterKey, config.defaultModel));
    }
    if (config.geminiKey) {
      this.providers.set('gemini', new GeminiProvider(config.geminiKey, config.defaultModel));
    }
    if (config.groqKey) {
      this.providers.set('groq', new GroqProvider(config.groqKey, config.defaultModel));
    }
  }

  getProvider(name?: string): LLMProvider {
    const providerName = name || this.defaultProvider;
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`LLM provider '${providerName}' not configured. Available: ${[...this.providers.keys()].join(', ')}`);
    }
    return provider;
  }

  getDefaultProvider(): LLMProvider {
    return this.getProvider(this.defaultProvider);
  }

  getDefaultModel(): string {
    return this.defaultModel;
  }

  getAvailableProviders(): string[] {
    return [...this.providers.keys()];
  }

  async listModels(provider?: string): Promise<string[]> {
    const p = this.getProvider(provider);
    if (p.listModels) {
      return p.listModels();
    }
    return [];
  }
}