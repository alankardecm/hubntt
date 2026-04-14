import OpenAI from 'openai';

const openAiApiKey = process.env.OPENAI_API_KEY;
const ttsModel = process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts';
const ttsVoice = process.env.OPENAI_TTS_VOICE || 'marin';
const ttsFormat = process.env.OPENAI_TTS_FORMAT || 'mp3';
const ttsSpeed = Number(process.env.OPENAI_TTS_SPEED || '1');

const openAiClient = openAiApiKey
  ? new OpenAI({
      apiKey: openAiApiKey,
    })
  : null;

export function isServerTtsConfigured() {
  return Boolean(openAiClient && openAiApiKey);
}

export async function synthesizeSpeech(input: string) {
  if (!openAiClient || !openAiApiKey) {
    throw new Error('server_tts_not_configured');
  }

  const text = String(input || '').trim();
  if (!text) {
    throw new Error('tts_input_required');
  }

  const response = await openAiClient.audio.speech.create({
    model: ttsModel,
    voice: ttsVoice,
    input: text,
    response_format: ttsFormat as 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm',
    speed: Number.isFinite(ttsSpeed) ? Math.min(Math.max(ttsSpeed, 0.25), 4) : 1,
    instructions:
      'Fale em portugues do Brasil com tom natural, executivo e calor humano. Soe confiante, claro e nada robotizado.',
  });

  const buffer = Buffer.from(await response.arrayBuffer());

  return {
    buffer,
    contentType: ttsFormat === 'wav' ? 'audio/wav' : ttsFormat === 'aac' ? 'audio/aac' : ttsFormat === 'opus' ? 'audio/ogg' : ttsFormat === 'flac' ? 'audio/flac' : 'audio/mpeg',
    fileExtension: ttsFormat,
    model: ttsModel,
    voice: ttsVoice,
  };
}
