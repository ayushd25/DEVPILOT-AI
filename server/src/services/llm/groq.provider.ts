import { LLMProvider, LLMMessage, LLMResponse, LLMOptions, EmbeddingResponse, EmbedOptions } from './provider.interface.js';

export class GroqProvider implements LLMProvider {
  name = 'groq';
  private apiKey: string;
  private baseUrl = 'https://api.groq.com/openai/v1';
  private defaultModel: string;

  constructor(apiKey: string, defaultModel = 'llama-3.1-8b-instant') {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
  }

  async chat(messages: LLMMessage[], options: LLMOptions = {}): Promise<LLMResponse> {
     const { model = this.defaultModel, temperature = 0.3, jsonMode = false } = options;
    const maxTokens = 1500; // Hard cap for Groq free tier limits
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
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Groq API error: ${await res.text()}`);
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
    // Groq doesn't have embeddings, return dummy arrays so retriever doesn't crash
    return {
      embeddings: texts.map(() => new Array(1536).fill(0)),
      usage: { promptTokens: 0, totalTokens: 0 },
      latency: 0,
    };
  }
}