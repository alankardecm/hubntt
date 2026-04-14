import { ChatOpenAI } from '@langchain/openai';
import { OpenAIEmbeddings } from '@langchain/openai';
import OpenAI from 'openai';

export const model = new ChatOpenAI({
  modelName: 'gpt-4o',
  temperature: 0.1,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

export const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
});

const groqApiKey = process.env.GROQ_API_KEY;
const groqModel = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';
const openAiApiKey = process.env.OPENAI_API_KEY;
const openAiModel = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini';

const groqClient = groqApiKey
  ? new OpenAI({
      apiKey: groqApiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    })
  : null;

const openAiClient = openAiApiKey
  ? new OpenAI({
      apiKey: openAiApiKey,
    })
  : null;

export type GroqSentimentResult = {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  rationale?: string;
};

export type GroqDailySummaryResult = {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  summary: string;
  highlights?: string[];
  keywords?: string[];
  risks?: string[];
  recommended_action?: string;
  dominant_topic?: string;
};

export type GroupConversationBriefResult = {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  title: string;
  summary: string;
  highlights?: string[];
  risks?: string[];
  next_steps?: string[];
  keywords?: string[];
  dominant_topic?: string;
  audio_script: string;
};

type GroqChatOptions = {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
};

function extractJsonBlock(content: string) {
  const trimmed = content.trim();
  const direct = trimmed.match(/\{[\s\S]*\}/);
  return direct ? direct[0] : trimmed;
}

function parseGroqJson<T>(content: string, validator: (value: unknown) => value is T): T | null {
  try {
    const parsed = JSON.parse(extractJsonBlock(content)) as unknown;
    return validator(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isSentimentResult(value: unknown): value is GroqSentimentResult {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as GroqSentimentResult;
  return ['positive', 'neutral', 'negative'].includes(candidate.sentiment) && typeof candidate.score === 'number';
}

function isDailySummaryResult(value: unknown): value is GroqDailySummaryResult {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as GroqDailySummaryResult;
  return (
    ['positive', 'neutral', 'negative'].includes(candidate.sentiment) &&
    typeof candidate.score === 'number' &&
    typeof candidate.summary === 'string'
  );
}

function isGroupConversationBriefResult(value: unknown): value is GroupConversationBriefResult {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as GroupConversationBriefResult;
  return (
    ['positive', 'neutral', 'negative'].includes(candidate.sentiment) &&
    typeof candidate.score === 'number' &&
    typeof candidate.title === 'string' &&
    typeof candidate.summary === 'string' &&
    typeof candidate.audio_script === 'string'
  );
}

async function runGroqJsonPrompt<T>(options: GroqChatOptions, validator: (value: unknown) => value is T): Promise<T | null> {
  if (!groqClient || !groqApiKey) return null;

  try {
    const response = await groqClient.chat.completions.create({
      model: groqModel,
      temperature: options.temperature ?? 0,
      max_tokens: options.maxTokens ?? 220,
      messages: [
        {
          role: 'system',
          content: options.system,
        },
        {
          role: 'user',
          content: options.user,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;
    return parseGroqJson(content, validator);
  } catch {
    return null;
  }
}

async function runOpenAiJsonPrompt<T>(options: GroqChatOptions, validator: (value: unknown) => value is T): Promise<T | null> {
  if (!openAiClient || !openAiApiKey) return null;

  try {
    const response = await openAiClient.chat.completions.create({
      model: openAiModel,
      temperature: options.temperature ?? 0,
      max_tokens: options.maxTokens ?? 320,
      messages: [
        {
          role: 'system',
          content: options.system,
        },
        {
          role: 'user',
          content: options.user,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;
    return parseGroqJson(content, validator);
  } catch {
    return null;
  }
}

export function buildSentimentPrompt(text: string) {
  return {
    system:
      'Voce classifica sentimento de mensagens curtas de grupos internos de WhatsApp. Responda somente com JSON valido, sem markdown, sem comentario e sem texto extra. Os campos obrigatorios sao sentiment, score e rationale. sentiment deve ser positive, neutral ou negative. score deve variar de -1 a 1. Considere ofensas, pressao, incidentes e prazo como negativo. Considere resolucao, confirmacao e progresso como positivo.',
    user: JSON.stringify({
      task: 'classify_sentiment',
      text,
      output_format: {
        sentiment: 'positive | neutral | negative',
        score: 'number from -1 to 1',
        rationale: 'short explanation in Portuguese',
      },
    }),
  };
}

export function buildDailySummaryPrompt(input: {
  groupName: string;
  date: string;
  messageCount: number;
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  urgentCount: number;
  topKeywords: Array<{ term: string; count: number }>;
  sampleMessages: Array<{
    author?: string;
    text: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    keywords?: string[];
    created_at?: string;
  }>;
}) {
  return {
    system:
      'Voce gera resumo diario operacional de um grupo interno de WhatsApp. Responda somente com JSON valido, sem markdown, sem comentario e sem texto extra. Use somente as evidencias fornecidas. Seja objetivo, claro e voltado para operacao. Os campos obrigatorios sao sentiment, score e summary. Pode incluir highlights, keywords, risks, recommended_action e dominant_topic. Nao invente fatos. Nao cite nomes de pessoas se nao forem relevantes.',
    user: JSON.stringify({
      task: 'generate_daily_summary',
      group_name: input.groupName,
      date: input.date,
      metrics: {
        message_count: input.messageCount,
        sentiment_breakdown: input.sentimentBreakdown,
        urgent_count: input.urgentCount,
        top_keywords: input.topKeywords,
      },
      sample_messages: input.sampleMessages,
      output_format: {
        sentiment: 'positive | neutral | negative',
        score: 'number from -1 to 1',
        summary: 'short executive summary in Portuguese',
        highlights: ['array of short bullet-like phrases'],
        keywords: ['array of 3 to 8 keywords'],
        risks: ['array of operational risks if any'],
        recommended_action: 'one short recommended action',
        dominant_topic: 'one short topic label',
      },
    }),
  };
}

export function buildConversationBriefPrompt(input: {
  groupName: string;
  days: number;
  messageCount: number;
  participantCount: number;
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  urgentCount: number;
  topKeywords: Array<{ term: string; count: number }>;
  topParticipants: Array<{ name: string; count: number }>;
  sampleMessages: Array<{
    author?: string;
    text: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    keywords?: string[];
    created_at?: string;
  }>;
}) {
  return {
    system:
      'Voce gera um resumo consolidado das conversas de um grupo de WhatsApp para leitura rapida e narracao em audio. Responda somente com JSON valido, sem markdown, sem comentario e sem texto extra. Use apenas as evidencias fornecidas. Nao invente fatos. Seja claro, objetivo e operacional. O campo audio_script deve soar como um mini boletim falado em portugues do Brasil, com 45 a 90 segundos.',
    user: JSON.stringify({
      task: 'generate_group_conversation_brief',
      group_name: input.groupName,
      analysis_window_days: input.days,
      metrics: {
        message_count: input.messageCount,
        participant_count: input.participantCount,
        sentiment_breakdown: input.sentimentBreakdown,
        urgent_count: input.urgentCount,
        top_keywords: input.topKeywords,
        top_participants: input.topParticipants,
      },
      sample_messages: input.sampleMessages,
      output_format: {
        sentiment: 'positive | neutral | negative',
        score: 'number from -1 to 1',
        title: 'short title in Portuguese',
        summary: 'concise paragraph in Portuguese with the main storyline of the period',
        highlights: ['array of short bullet-like highlights'],
        risks: ['array of risks or tensions if any'],
        next_steps: ['array of recommended next steps if any'],
        keywords: ['array of 3 to 8 keywords'],
        dominant_topic: 'one short topic label',
        audio_script: 'podcast-like but concise spoken script in Portuguese for TTS',
      },
    }),
  };
}

export async function classifySentimentWithGroq(text: string): Promise<GroqSentimentResult | null> {
  const prompt = buildSentimentPrompt(text);
  return runGroqJsonPrompt(prompt, isSentimentResult);
}

export async function summarizeDailyGroupWithGroq(input: {
  groupName: string;
  date: string;
  messageCount: number;
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  urgentCount: number;
  topKeywords: Array<{ term: string; count: number }>;
  sampleMessages: Array<{
    author?: string;
    text: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    keywords?: string[];
    created_at?: string;
  }>;
}): Promise<GroqDailySummaryResult | null> {
  const prompt = buildDailySummaryPrompt(input);
  return runGroqJsonPrompt(prompt, isDailySummaryResult);
}

export async function summarizeConversationBrief(input: {
  groupName: string;
  days: number;
  messageCount: number;
  participantCount: number;
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  urgentCount: number;
  topKeywords: Array<{ term: string; count: number }>;
  topParticipants: Array<{ name: string; count: number }>;
  sampleMessages: Array<{
    author?: string;
    text: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    keywords?: string[];
    created_at?: string;
  }>;
}): Promise<GroupConversationBriefResult | null> {
  const prompt = buildConversationBriefPrompt(input);
  const groqResult = await runGroqJsonPrompt(prompt, isGroupConversationBriefResult);
  if (groqResult) return groqResult;
  return runOpenAiJsonPrompt(prompt, isGroupConversationBriefResult);
}
