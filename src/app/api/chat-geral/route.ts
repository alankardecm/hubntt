import { groqClient, openaiClient } from '@/infrastructure/ai/chat-clients';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `Você é um assistente interno da Netturbo, provedora de internet.
Ajude com qualquer tarefa: reescrever textos, responder dúvidas, explicar conceitos, sugerir melhorias, analisar situações, criar rascunhos de email, etc.
Seja direto, claro e útil. Responda sempre em português do Brasil.
Quando o usuário pedir para reescrever ou melhorar um texto, entregue o resultado pronto, sem rodeios.`;

type Message = { role: 'user' | 'assistant' | 'system'; content: string };

export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: Message[] };

  const normalized = (messages || []).slice(-20);

  const payload = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    ...normalized,
  ];

  try {
    const completion = await groqClient.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      messages: payload,
    });

    return Response.json({ answer: completion.choices[0]?.message?.content || '' });
  } catch {
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1024,
      messages: payload,
    });

    return Response.json({ answer: completion.choices[0]?.message?.content || '' });
  }
}
