import { LLMProvider, LLMMessage, LLMResponse, LLMOptions, EmbeddingResponse, EmbedOptions } from './provider.interface.js';

export class OpenRouterProvider implements LLMProvider {
  name = 'openrouter';
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';
  private defaultModel: string;

  constructor(apiKey: string, defaultModel = 'anthropic/claude-3.5-haiku:free') {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
  }

  async chat(messages: LLMMessage[], options: LLMOptions = {}): Promise<LLMResponse> {
    const { model = this.defaultModel, temperature = 0.3, maxTokens = 4096, jsonMode = false } = options;
    const start = Date.now();

    const body: any = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    if (jsonMode) {
      body.response_format = { type: 'json_object' };
    }

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://devpilot.ai',
        'X-Title': 'DevPilot AI',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenRouter API error: ${err}`);
    }

    const data = await res.json();
    const choice = data.choices[0];

    return {
      content: choice.message.content,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
      model: data.model,
      latency: Date.now() - start,
    };
  }

  async embed(texts: string[], options: EmbedOptions = {}): Promise<EmbeddingResponse> {
    const { model = 'openai/text-embedding-3-small' } = options;
    const start = Date.now();

    const res = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, input: texts }),
    });

    if (!res.ok) {
      throw new Error(`OpenRouter embedding error: ${await res.text()}`);
    }

    const data = await res.json();

    return {
      embeddings: data.data.map((d: any) => d.embedding),
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
      latency: Date.now() - start,
    };
  }

  async listModels(): Promise<string[]> {
    const res = await fetch(`${this.baseUrl}/models`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });
    const data = await res.json();
    return data.data?.map((m: any) => m.id) || [];
  }
}