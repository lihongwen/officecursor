/* eslint-env browser */
import { Message } from "../contexts/AppContext";

export interface DeepSeekMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: "assistant";
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface DeepSeekStreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: "assistant";
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

export interface ApiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export class DeepSeekAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = "DeepSeekAPIError";
  }
}

export class DeepSeekAPI {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  updateConfig(config: Partial<ApiConfig>) {
    this.config = { ...this.config, ...config };
  }

  private validateConfig(): void {
    if (!this.config.apiKey) {
      throw new DeepSeekAPIError("API Key is required");
    }
    if (!this.config.baseUrl) {
      throw new DeepSeekAPIError("Base URL is required");
    }
    if (!this.config.model) {
      throw new DeepSeekAPIError("Model is required");
    }
  }

  private convertMessages(messages: Message[]): DeepSeekMessage[] {
    return messages
      .filter((msg) => msg.role !== "system" || msg.content.trim())
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
  }

  private async makeRequest(endpoint: string, options: any): Promise<any> {
    const url = `${this.config.baseUrl.replace(/\/$/, "")}${endpoint}`;

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.config.apiKey}`,
      ...options.headers,
    };

    // eslint-disable-next-line no-undef
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error && errorData.error.message) {
          errorMessage = errorData.error.message;
        }
      } catch {
        // If we can't parse the error response, use the default message
      }
      throw new DeepSeekAPIError(errorMessage, response.status);
    }

    return response;
  }

  async sendMessage(
    messages: Message[],
    options: {
      stream?: boolean;
      temperature?: number;
      maxTokens?: number;
      onProgress?: (content: string) => void;
    } = {}
  ): Promise<string> {
    this.validateConfig();

    const { stream = false, temperature = 0.7, maxTokens = 4000, onProgress } = options;

    const deepSeekMessages = this.convertMessages(messages);

    const requestBody = {
      model: this.config.model,
      messages: deepSeekMessages,
      temperature,
      max_tokens: maxTokens,
      stream,
    };

    try {
      const response = await this.makeRequest("/v1/chat/completions", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      if (stream) {
        return await this.handleStreamResponse(response, onProgress);
      } else {
        return await this.handleNormalResponse(response);
      }
    } catch (error) {
      if (error instanceof DeepSeekAPIError) {
        throw error;
      }
      throw new DeepSeekAPIError(`Network error: ${error.message}`);
    }
  }

  private async handleNormalResponse(response: any): Promise<string> {
    const data: DeepSeekResponse = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new DeepSeekAPIError("No response from API");
    }

    return data.choices[0].message.content;
  }

  private async handleStreamResponse(
    response: any,
    onProgress?: (content: string) => void
  ): Promise<string> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new DeepSeekAPIError("No response body");
    }

    let fullContent = "";
    // eslint-disable-next-line no-undef
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") {
              return fullContent;
            }

            try {
              const parsed: DeepSeekStreamResponse = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;

              if (content) {
                fullContent += content;
                onProgress?.(content);
              }
            } catch {
              // Skip invalid JSON lines
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullContent;
  }

  async testConnection(): Promise<boolean> {
    try {
      this.validateConfig();

      const testMessages: Message[] = [
        {
          id: "test",
          role: "user",
          content: "Hello",
          timestamp: new Date(),
        },
      ];

      await this.sendMessage(testMessages, { maxTokens: 10 });
      return true;
    } catch (error) {
      // eslint-disable-next-line no-undef
      console.error("Connection test failed:", error);
      return false;
    }
  }

  getAvailableModels(): string[] {
    return ["deepseek-chat", "deepseek-reasoner"];
  }
}

// Singleton instance
let apiInstance: DeepSeekAPI | null = null;

export const getDeepSeekAPI = (config?: ApiConfig): DeepSeekAPI => {
  if (!apiInstance && config) {
    apiInstance = new DeepSeekAPI(config);
  } else if (apiInstance && config) {
    apiInstance.updateConfig(config);
  }

  if (!apiInstance) {
    throw new Error("DeepSeek API not initialized. Please provide config.");
  }

  return apiInstance;
};
