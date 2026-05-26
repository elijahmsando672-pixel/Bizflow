import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "";

const genAI = new GoogleGenerativeAI(API_KEY);

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export async function sendToGemma4(
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<string> {
  if (!API_KEY) {
    throw new Error("Google API key not configured");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: systemPrompt,
  });

  const history = messages.map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({
    history,
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 2048,
    },
  });

  const result = await chat.sendMessage(messages[messages.length - 1].content);
  const response = result.response.text();

  return response;
}

export async function generateWithGemma4(
  prompt: string,
  options?: {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  if (!API_KEY) {
    throw new Error("Google API key not configured");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: options?.systemPrompt,
  });

  const generationConfig = {
    temperature: options?.temperature ?? 0.9,
    maxOutputTokens: options?.maxTokens ?? 2048,
  };

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig,
  });

  const response = result.response.text();
  return response;
}