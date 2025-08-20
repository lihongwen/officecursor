/* eslint-env browser */
import * as React from "react";
import { useAppContext } from "../contexts/AppContext";
import { getDeepSeekAPI, DeepSeekAPIError } from "../services/deepseekApi";

export const useChat = () => {
  const { state, actions } = useAppContext();
  const { messages, settings } = state;

  const sendMessage = React.useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim()) return;

      // Validate API configuration
      if (!settings.apiKey) {
        actions.setError("请先在设置中配置API Key");
        actions.setCurrentPage("settings");
        return;
      }

      // Clear previous errors
      actions.setError(null);
      actions.setLoading(true);

      // Add user message
      actions.addMessage({
        role: "user",
        content: userMessage.trim(),
      });

      // Add assistant message placeholder
      actions.addMessage({
        role: "assistant",
        content: "",
        isLoading: true,
      });

      try {
        // Initialize API client
        const api = getDeepSeekAPI({
          apiKey: settings.apiKey,
          baseUrl: settings.baseUrl,
          model: settings.selectedModel,
        });

        // Prepare messages for API (include conversation history)
        const apiMessages = [
          ...messages,
          {
            id: "temp",
            role: "user" as const,
            content: userMessage.trim(),
            timestamp: new Date(),
          },
        ];

        let assistantResponse = "";

        // Send request with streaming
        await api.sendMessage(apiMessages, {
          stream: true,
          temperature: 0.7,
          maxTokens: 4000,
          onProgress: (chunk: string) => {
            assistantResponse += chunk;
            console.log("Streaming chunk received, total length:", assistantResponse.length);
            
            // Update the last assistant message with streaming content
            actions.updateLastAssistantMessage({
              content: assistantResponse,
              isLoading: true,
            });
          },
        });

        // Finalize the message
        console.log("Finalizing assistant response, total length:", assistantResponse.length);
        actions.updateLastAssistantMessage({
          content: assistantResponse,
          isLoading: false,
        });
        
      } catch (error) {
        // eslint-disable-next-line no-undef
        console.error("Chat error:", error);

        let errorMessage = "发送消息时出现错误";

        if (error instanceof DeepSeekAPIError) {
          switch (error.status) {
            case 401:
              errorMessage = "API Key 无效，请检查设置";
              break;
            case 429:
              errorMessage = "请求过于频繁，请稍后再试";
              break;
            case 500:
              errorMessage = "服务器错误，请稍后再试";
              break;
            default:
              errorMessage = `API错误: ${error.message}`;
          }
        } else if (error instanceof Error) {
          if (error.message.includes("fetch")) {
            errorMessage = "网络连接错误，请检查网络连接";
          } else {
            errorMessage = error.message;
          }
        }

        // Update the last assistant message with error
        console.log("Setting error message for last assistant message:", errorMessage);
        actions.updateLastAssistantMessage({
          content: `❌ ${errorMessage}`,
          isLoading: false,
        });

        actions.setError(errorMessage);
      } finally {
        actions.setLoading(false);
      }
    },
    [messages, settings, actions]
  );

  const regenerateLastResponse = React.useCallback(async () => {
    if (messages.length < 2) return;

    const lastUserMessageIndex = messages.length - 2;
    const lastUserMessage = messages[lastUserMessageIndex];

    if (lastUserMessage.role !== "user") return;

    // Remove the last assistant message
    const messagesWithoutLastResponse = messages.slice(0, -1);

    // Clear messages and restore without last response
    actions.clearMessages();
    messagesWithoutLastResponse.forEach((msg) => {
      actions.addMessage({
        role: msg.role,
        content: msg.content,
      });
    });

    // Resend the last user message
    await sendMessage(lastUserMessage.content);
  }, [messages, sendMessage, actions]);

  return {
    sendMessage,
    regenerateLastResponse,
    isLoading: state.isLoading,
    error: state.error,
  };
};
