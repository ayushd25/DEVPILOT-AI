import { LLMProvider, LLMMessage, LLMResponse, LLMOptions, EmbeddingResponse, EmbedOptions } from './provider.interface.js';

export class GeminiProvider implements LLMProvider {
  name = 'gemini';
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  private defaultModel: string;

  constructor(apiKey: string, defaultModel = 'gemini-1.5-flash') {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
  }

  private convertMessages(messages: LLMMessage[]): { systemInstruction?: string; contents: any[] } {
    let systemInstruction: string | undefined;
    const contents: any[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction = msg.content;
      } else {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    return { systemInstruction, contents };
  }

  async chat(messages: LLMMessage[], options: LLMOptions = {}): Promise<LLMResponse> {
    const { model = this.defaultModel, temperature = 0.3, maxTokens = 4096, jsonMode = false } = options;
    const start = Date.now();

    const { systemInstruction, contents } = this.convertMessages(messages);

    const body: any = {
      contents,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
        responseMimeType: jsonMode ? 'application/json' : 'text/plain',
      },
    };

    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const res = await fetch(
      `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      throw new Error(`Gemini API error: ${await res.text()}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      content: text,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0,
      },
      model,
      latency: Date.now() - start,
    };
  }

  async embed(texts: string[], options: EmbedOptions = {}): Promise<EmbeddingResponse> {
    const { model = 'text-embedding-004', dimensions = 768 } = options;
    const start = Date.now();

    const res = await fetch(
      `${this.baseUrl}/models/${model}:batchEmbedContents?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: texts.map(text => ({
            model: `models/${model}`,
            content: { parts: [{ text }] },
          })),
        }),
      }
    );

    if (!res.ok) {
      throw new Error(`Gemini embedding error: ${await res.text()}`);
    }

    const data = await res.json();
    const embeddings = data.embeddings?.map((e: any) => e.values) || [];

    return {
      embeddings,
      usage: {
        promptTokens: texts.reduce((acc, t) => acc + Math.ceil(t.length / 4), 0),
        totalTokens: texts.reduce((acc, t) => acc + Math.ceil(t.length / 4), 0),
      },
      latency: Date.now() - start,
    };
  }

  async listModels(): Promise<string[]> {
    const res = await fetch(`${this.baseUrl}/models?key=${this.apiKey}`);
    const data = await res.json();
    return data.models
      ?.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m: any) => m.name.replace('models/', '')) || [];
  }
}