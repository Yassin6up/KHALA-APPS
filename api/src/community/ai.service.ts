import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private config: ConfigService) {}

  /**
   * Generates a chat response using a cascading fallback strategy:
   * 1. Runpod Hosted API (Primary)
   * 2. Groq Llama-3-70B (Fallback 1)
   * 3. Groq Mixtral 8x7b (Fallback 2)
   * 4. Groq Gemma 7B (Fallback 3)
   */
  async generateResponse(systemPrompt: string, userMessage: string): Promise<string> {
    const runpodUrl = this.config.get<string>('RUNPOD_URL');
    const runpodKey = this.config.get<string>('RUNPOD_API_KEY');
    
    // Attempt 1: Runpod
    if (runpodUrl && runpodKey) {
      try {
        this.logger.log('Attempting AI generation via Runpod...');
        const response = await this.callOpenAiCompatibleApi(runpodUrl, runpodKey, 'default-model', systemPrompt, userMessage);
        return response;
      } catch (e) {
        this.logger.warn(`Runpod failed: ${(e as Error).message}. Falling back to Groq...`);
      }
    } else {
        this.logger.warn('Runpod credentials missing. Falling back to Groq directly...');
    }

    const groqKey = this.config.get<string>('GROQ_API_KEY');
    if (!groqKey) {
      throw new Error('No AI provider keys configured (Runpod or Groq).');
    }

    const groqModels = [
      'llama3-70b-8192',
      'mixtral-8x7b-32768',
      'gemma-7b-it',
    ];

    // Cascading Groq attempts
    for (const model of groqModels) {
      try {
        this.logger.log(`Attempting AI generation via Groq (${model})...`);
        const response = await this.callOpenAiCompatibleApi(
          'https://api.groq.com/openai/v1/chat/completions',
          groqKey,
          model,
          systemPrompt,
          userMessage,
        );
        return response;
      } catch (e) {
        this.logger.warn(`Groq (${model}) failed: ${(e as Error).message}.`);
      }
    }

    throw new Error('All AI models (Runpod and Groq fallbacks) failed to generate a response.');
  }

  private async callOpenAiCompatibleApi(url: string, apiKey: string, model: string, systemPrompt: string, userMessage: string): Promise<string> {
    const response = await fetch(url.endsWith('/chat/completions') ? url : `${url}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errTxt = await response.text();
      throw new Error(`API Error ${response.status}: ${errTxt}`);
    }

    const data = await response.json();
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content;
    }
    
    throw new Error('Unexpected response format from API.');
  }
}
