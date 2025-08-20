import * as React from "react";
import {
  Card,
  CardHeader,
  Text,
  Button,
  Textarea,
  Avatar,
  Badge,
  Spinner,
  makeStyles,
  mergeClasses,
  tokens,
  Divider,
} from "@fluentui/react-components";
import {
  Send24Regular,
  Person24Regular,
  Bot24Regular,
  Delete24Regular,
  Copy24Regular,
  ArrowClockwise24Regular,
} from "@fluentui/react-icons";
import { useAppContext, Message } from "../contexts/AppContext";
import { useChat } from "../hooks/useChat";

const useStyles = makeStyles({
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    padding: tokens.spacingVerticalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    flexShrink: 0,
  },
  messagesContainer: {
    flex: 1,
    overflow: "hidden",
    position: "relative",
    backgroundColor: tokens.colorNeutralBackground3,
  },
  messagesList: {
    padding: tokens.spacingVerticalS,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    height: "100%",
    overflow: "auto",
  },
  message: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    maxWidth: "100%",
  },
  userMessage: {
    flexDirection: "row-reverse",
  },
  messageContent: {
    flex: 1,
    minWidth: 0,
  },
  messageCard: {
    maxWidth: "85%",
    wordBreak: "break-word",
    boxShadow: tokens.shadow4,
  },
  userMessageCard: {
    backgroundColor: tokens.colorBrandBackground2,
  },
  assistantMessageCard: {
    backgroundColor: tokens.colorNeutralBackground2,
  },
  messageText: {
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
    lineHeight: 1.5,
  },
  messageActions: {
    marginTop: tokens.spacingVerticalXS,
    display: "flex",
    gap: tokens.spacingHorizontalS,
  },
  inputContainer: {
    padding: tokens.spacingVerticalM,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    flexShrink: 0,
  },
  inputArea: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    alignItems: "flex-end",
  },
  textInput: {
    flex: 1,
    minHeight: "40px",
    maxHeight: "120px",
    "@media (max-width: 480px)": {
      fontSize: "16px", // Prevent zoom on mobile
    },
  },
  sendButton: {
    flexShrink: 0,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalXXL,
    textAlign: "center",
  },
  modelBadge: {
    marginLeft: tokens.spacingHorizontalS,
  },
  typingIndicator: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalS,
    fontStyle: "italic",
    color: tokens.colorNeutralForeground3,
  },
});

const MessageComponent: React.FC<{
  message: Message;
  onCopy: (content: string) => void;
  onRegenerate?: () => void;
  isLastAssistantMessage?: boolean;
}> = ({ message, onCopy, onRegenerate, isLastAssistantMessage }) => {
  const styles = useStyles();
  const isUser = message.role === "user";

  const handleCopy = () => {
    onCopy(message.content);
  };

  return (
    <div className={mergeClasses(styles.message, isUser && styles.userMessage)}>
      <Avatar
        icon={isUser ? <Person24Regular /> : <Bot24Regular />}
        color={isUser ? "brand" : "colorful"}
        size={32}
      />
      <div className={styles.messageContent}>
        <Card 
          className={mergeClasses(
            styles.messageCard,
            isUser ? styles.userMessageCard : styles.assistantMessageCard
          )}
        >
          <div style={{ padding: tokens.spacingVerticalS }}>
            <Text className={styles.messageText} size={300}>
              {message.content}
            </Text>
            {message.isLoading && (
              <div className={styles.typingIndicator}>
                <Spinner size="tiny" />
                <Text size={200}>正在输入...</Text>
              </div>
            )}
            {!message.isLoading && (
              <div className={styles.messageActions}>
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<Copy24Regular />}
                  onClick={handleCopy}
                >
                  复制
                </Button>
                {isLastAssistantMessage && onRegenerate && (
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<ArrowClockwise24Regular />}
                    onClick={onRegenerate}
                  >
                    重新生成
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

const Chat: React.FC = () => {
  const styles = useStyles();
  const { state, actions } = useAppContext();
  const { messages, settings } = state;
  const { sendMessage, regenerateLastResponse, isLoading } = useChat();
  
  const [inputValue, setInputValue] = React.useState("");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus on textarea when component mounts
  React.useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    setInputValue("");
    await sendMessage(trimmedInput);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // Could add a toast notification here
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  const handleClearMessages = () => {
    actions.clearMessages();
  };

  const hasMessages = messages.length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <Text weight="semibold" size={400}>AI助手</Text>
            <Badge 
              appearance="tint" 
              className={styles.modelBadge}
              size="small"
            >
              {settings.selectedModel}
            </Badge>
          </div>
          {hasMessages && (
            <Button
              appearance="subtle"
              size="small"
              icon={<Delete24Regular />}
              onClick={handleClearMessages}
            >
              清空对话
            </Button>
          )}
        </div>
      </div>

      <div className={styles.messagesContainer}>
        {!hasMessages ? (
          <div className={styles.emptyState}>
            <Bot24Regular style={{ fontSize: "48px", color: tokens.colorNeutralForeground3 }} />
            <Text size={500} weight="semibold">
              开始与AI助手对话
            </Text>
            <Text size={300} style={{ color: tokens.colorNeutralForeground2 }}>
              输入你的问题或想法，我会尽力帮助你。
            </Text>
            {!settings.apiKey && (
              <Button 
                appearance="primary" 
                onClick={() => actions.setCurrentPage("settings")}
              >
                配置API设置
              </Button>
            )}
          </div>
        ) : (
          <div className={styles.messagesList}>
            {messages.map((message, index) => {
              const isLastAssistantMessage = 
                message.role === "assistant" && 
                index === messages.length - 1 && 
                !message.isLoading;
              
              return (
                <MessageComponent
                  key={message.id}
                  message={message}
                  onCopy={handleCopyMessage}
                  onRegenerate={regenerateLastResponse}
                  isLastAssistantMessage={isLastAssistantMessage}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className={styles.inputContainer}>
        <div className={styles.inputArea}>
          <Textarea
            ref={textareaRef}
            className={styles.textInput}
            placeholder="输入消息... (Shift+Enter 换行，Enter 发送)"
            value={inputValue}
            onChange={(_, data) => setInputValue(data.value)}
            onKeyDown={handleKeyPress}
            disabled={isLoading}
            resize="vertical"
          />
          <Button
            className={styles.sendButton}
            appearance="primary"
            icon={isLoading ? <Spinner size="small" /> : <Send24Regular />}
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
          >
            发送
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;