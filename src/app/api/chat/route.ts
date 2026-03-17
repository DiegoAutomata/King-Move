import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, fen } = await req.json();
    
    // Safety check if no key provided
    if (!process.env.OPENROUTER_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing OPENROUTER_API_KEY" }), { status: 500 });
    }

    const systemPrompt = `You are an expert Chess Grandmaster Tutor. The current board FEN is: ${fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'}. 
You are speaking to an intermediate player (1200 ELO). 
Identify the best move, point out blunders, and explain your reasoning clearly.
Be encouraging, avoid overly complex variations unless specifically asked, and keep it formatting in markdown for readability.`;

    const result = streamText({
      model: openrouter('google/gemini-2.5-flash-preview'),
      system: systemPrompt,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
