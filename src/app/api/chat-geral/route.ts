import { groqClient, openaiClient } from '@/infrastructure/ai/chat-clients';
import { buildRagContext } from '@/lib/rag';

export const runtime = 'nodejs';

const SYSTEM_GERAL = `Você é um assistente interno da Netturbo, provedora de internet.
Ajude com qualquer tarefa: reescrever textos, responder dúvidas, explicar conceitos, sugerir melhorias, analisar situações, criar rascunhos de email, etc.
Seja direto, claro e útil. Responda sempre em português do Brasil.
Quando o usuário pedir para reescrever ou melhorar um texto, entregue o resultado pronto, sem rodeios.`;

const SYSTEM_INTERNO = (context: string) =>
  `Você é um assistente interno da Netturbo, provedora de internet.
Responda com base no contexto da base de conhecimento interna fornecido abaixo.
Se o contexto não contiver informação suficiente, diga claramente e ofereça o que sabe de forma geral.
Seja direto, técnico e objetivo. Responda sempre em português do Brasil.

--- BASE DE CONHECIMENTO INTERNA ---
${context}
--- FIM DA BASE ---`;

type Message = { role: 'user' | 'assistant' | 'system'; content: string };

type Source = {
  title: string;
  source: string;
  score?: number;
  imageUrl?: string;
};

async function callLLM(payload: Message[], maxTokens = 1024): Promise<string> {
  try {
    const completion = await groqClient.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      max_tokens: maxTokens,
      messages: payload,
    });
    return completion.choices[0]?.message?.content || '';
  } catch {
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: maxTokens,
      messages: payload,
    });
    return completion.choices[0]?.message?.content || '';
  }
}

export async function POST(req: Request) {
  const { messages, mode } = (await req.json()) as {
    messages: Message[];
    mode?: 'geral' | 'interno';
  };

  const normalized = (messages || []).slice(-20);
  const isInterno = mode === 'interno';

  if (!isInterno) {
    const answer = await callLLM([
      { role: 'system', content: SYSTEM_GERAL },
      ...normalized,
    ]);
    return Response.json({ answer, sources: [] });
  }

  // Modo interno — busca contexto na base de conhecimento
  const lastUserMsg = [...normalized].reverse().find((m) => m.role === 'user')?.content ?? '';
  const ragResult = await buildRagContext(lastUserMsg);

  const sources: Source[] = ragResult.sources ?? [];
  const systemPrompt = ragResult.context
    ? SYSTEM_INTERNO(ragResult.context)
    : SYSTEM_GERAL;

  const answer = await callLLM([
    { role: 'system', content: systemPrompt },
    ...normalized,
  ], 1024);

  return Response.json({ answer, sources });
}
