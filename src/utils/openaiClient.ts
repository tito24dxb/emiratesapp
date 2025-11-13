interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIStreamResponse {
  content?: string;
  done?: boolean;
  totalTokens?: number;
}

interface OpenAIClientOptions {
  workerUrl: string;
  onChunk?: (content: string) => void;
  onComplete?: (totalTokens?: number) => void;
  onError?: (error: Error) => void;
}

export class OpenAIClient {
  private workerUrl: string;

  constructor(workerUrl: string) {
    this.workerUrl = workerUrl;
  }

  async streamChat(
    messages: Message[],
    options: {
      onChunk?: (content: string) => void;
      onComplete?: (totalTokens?: number) => void;
      onError?: (error: Error) => void;
      context?: Record<string, any>;
    } = {}
  ): Promise<string> {
    const { onChunk, onComplete, onError, context } = options;
    let fullResponse = '';
    let totalTokens: number | undefined;

    try {
      const response = await fetch(`${this.workerUrl}/api/openai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          context,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          try {
            const jsonData: OpenAIStreamResponse = JSON.parse(trimmed.slice(6));

            if (jsonData.content) {
              fullResponse += jsonData.content;
              if (onChunk) {
                onChunk(jsonData.content);
              }
            }

            if (jsonData.done) {
              totalTokens = jsonData.totalTokens;
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', e);
          }
        }
      }

      if (onComplete) {
        onComplete(totalTokens);
      }

      return fullResponse;

    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      if (onError) {
        onError(err);
      }
      throw err;
    }
  }

  async sendMessage(
    messages: Message[],
    context?: Record<string, any>
  ): Promise<{ reply: string; tokensUsed?: number }> {
    let reply = '';
    let tokensUsed: number | undefined;

    await this.streamChat(messages, {
      onChunk: (content) => {
        reply += content;
      },
      onComplete: (tokens) => {
        tokensUsed = tokens;
      },
      context,
    });

    return { reply, tokensUsed };
  }
}

export const openaiClient = new OpenAIClient(
  import.meta.env.VITE_CLOUDFLARE_WORKER_URL || 'https://your-worker.workers.dev'
);
