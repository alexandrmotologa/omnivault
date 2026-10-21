import { AISettings } from '../db/types';

export const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'offline',
  endpoint: 'http://localhost:11434',
  apiKey: '',
  model: 'llama3.2',
};

const AI_STORAGE_KEY = 'omnivault_ai_settings';

export function loadAISettings(): AISettings {
  try {
    const raw = localStorage.getItem(AI_STORAGE_KEY);
    if (raw) return { ...DEFAULT_AI_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.warn('Failed loading AI settings:', e);
  }
  return DEFAULT_AI_SETTINGS;
}

export function saveAISettings(settings: AISettings) {
  try {
    localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed saving AI settings:', e);
  }
}

export async function askArticleLLM(
  articleTitle: string,
  articleContent: string,
  prompt: string,
  settings: AISettings
): Promise<string> {
  if (settings.provider === 'offline') {
    throw new Error('Please configure a local Ollama or OpenAI/Groq API endpoint in AI Settings.');
  }

  // Ollama Native Endpoint
  if (settings.provider === 'ollama') {
    const url = `${settings.endpoint.replace(/\/$/, '')}/api/generate`;
    const fullPrompt = `You are Omnivault's research assistant. Answer the user's question grounded strictly on the article text below.

ARTICLE TITLE: ${articleTitle}

ARTICLE CONTENT:
${articleContent.slice(0, 12000)}

USER QUESTION:
${prompt}

Respond clearly in concise markdown without filler.`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: settings.model || 'llama3.2',
        prompt: fullPrompt,
        stream: false,
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama request failed with HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    return data.response || 'No response generated from Ollama.';
  }

  // OpenAI / Groq / Compatible endpoint
  const url = `${settings.endpoint.replace(/\/$/, '')}/v1/chat/completions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert research assistant in Omnivault. Provide concise, high-density analysis and answers based strictly on the article text.',
        },
        {
          role: 'user',
          content: `ARTICLE: ${articleTitle}\n\n${articleContent.slice(0, 14000)}\n\nQUESTION: ${prompt}`,
        },
      ],
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    throw new Error(`AI API request failed with HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'No response returned from AI provider.';
}
