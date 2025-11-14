import { supabase } from '../lib/supabase';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  output_text: string;
  tokens_used?: number;
}

export class OpenAIClient {
  async sendMessage(
    prompt: string,
    userId: string,
    messages?: Message[]
  ): Promise<{ reply: string; tokensUsed?: number }> {
    try {
      if (!userId) {
        throw new Error('User ID is required. Please log in.');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration is missing. Please check your environment variables.');
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/ai`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
          },
          body: JSON.stringify({
            prompt,
            userId,
            messages,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;

        if (errorMessage.includes('OpenAI API key not configured')) {
          throw new Error('AI service is not configured. Please contact the administrator to set up the OpenAI API key.');
        }

        throw new Error(errorMessage);
      }

      const data: AIResponse = await response.json();

      return {
        reply: data.output_text,
        tokensUsed: data.tokens_used,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      console.error('AI Client Error:', err);
      throw err;
    }
  }

  async streamChat(
    messages: Message[],
    options: {
      userId: string;
      onChunk?: (content: string) => void;
      onComplete?: (totalTokens?: number) => void;
      onError?: (error: Error) => void;
    }
  ): Promise<string> {
    try {
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      const prompt = lastUserMessage?.content || '';

      const result = await this.sendMessage(prompt, options.userId, messages);

      if (options.onChunk) {
        options.onChunk(result.reply);
      }

      if (options.onComplete) {
        options.onComplete(result.tokensUsed);
      }

      return result.reply;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      if (options.onError) {
        options.onError(err);
      }
      throw err;
    }
  }
}

export const openaiClient = new OpenAIClient();
