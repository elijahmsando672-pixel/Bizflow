import { useState, useCallback } from "react";

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

interface UseGemma4Options {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export function useGemma4(options?: UseGemma4Options) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/gemma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          systemPrompt: options?.systemPrompt,
          temperature: options?.temperature,
          maxTokens: options?.maxTokens,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      const modelMessage: ChatMessage = { role: "model", content: data.response };
      setMessages((prev) => [...prev, modelMessage]);
      return modelMessage;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [messages, options]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}