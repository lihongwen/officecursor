import * as React from "react";
import {
  Card,
  CardHeader,
  Text,
  Button,
  Textarea,
  Badge,
  Spinner,
  makeStyles,
  mergeClasses,
  tokens,
  Divider,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  MessageBar,
  MessageBarBody,
} from "@fluentui/react-components";
import {
  Send24Regular,
  Delete24Regular,
  Copy24Regular,
  ArrowClockwise24Regular,
  Bot24Regular,
  ChevronDown24Regular,
  Table24Regular,
  Document24Regular,
  Warning24Regular,
} from "@fluentui/react-icons";
import { useAppContext, Message } from "../contexts/AppContext";
import { useChat } from "../hooks/useChat";
import { useVirtualizedMessages, usePerformance } from "../hooks/usePerformance";
import { OfficeService, isExcelAvailable, isWordAvailable } from "../services/officeService";
import { SecurityService } from "../services/securityService";

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
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    maxWidth: "100%",
    marginBottom: tokens.spacingVerticalM,
  },
  userMessage: {
    alignItems: "flex-end",
  },
  assistantMessage: {
    alignItems: "flex-start",
  },
  messageCard: {
    maxWidth: "85%",
    wordBreak: "break-word",
    borderRadius: tokens.borderRadiusLarge,
    border: "none",
    boxShadow: "none",
    padding: tokens.spacingVerticalM,
  },
  userMessageCard: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorNeutralForegroundOnBrand,
  },
  assistantMessageCard: {
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  messageText: {
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
    lineHeight: 1.5,
  },
  messageActions: {
    display: "flex",
    gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalXS,
    justifyContent: "flex-start",
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
  virtualizationInfo: {
    padding: tokens.spacingVerticalS,
    textAlign: "center",
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  securityWarning: {
    margin: tokens.spacingVerticalS,
  },
  performanceMetrics: {
    fontSize: "10px",
    color: tokens.colorNeutralForeground3,
    padding: tokens.spacingVerticalXS,
  },
});

interface EnhancedMessageProps {
  message: Message;
  onCopy: (content: string) => void;
  onRegenerate?: () => void;
  onInsertToOffice: (content: string, format: 'text' | 'table') => void;
  isLastAssistantMessage?: boolean;
}

const EnhancedMessage: React.FC<EnhancedMessageProps> = ({ 
  message, 
  onCopy, 
  onRegenerate, 
  onInsertToOffice,
  isLastAssistantMessage 
}) => {
  const styles = useStyles();
  const isUser = message.role === "user";
  const [showSecurityWarning, setShowSecurityWarning] = React.useState(false);

  // 安全检查
  React.useEffect(() => {
    if (message.role === "assistant") {
      const filtered = SecurityService.filterOutput(message.content);
      if (filtered !== message.content) {
        setShowSecurityWarning(true);
      }
    }
  }, [message]);

  const handleCopy = () => {
    onCopy(message.content);
  };

  const handleInsertAsText = () => {
    onInsertToOffice(message.content, 'text');
  };

  const handleInsertAsTable = () => {
    onInsertToOffice(message.content, 'table');
  };

  // 检测内容是否像表格数据
  const isTableLike = React.useMemo(() => {
    const lines = message.content.split('\n').filter(line => line.trim());
    const hasTableMarkers = lines.some(line => line.includes('|') || line.includes('\t'));
    const hasStructuredData = lines.length > 2 && lines.some(line => 
      line.includes(':') || /^\d+\./.test(line.trim())
    );
    return hasTableMarkers || hasStructuredData;
  }, [message.content]);

  return (
    <div className={mergeClasses(
      styles.message, 
      isUser ? styles.userMessage : styles.assistantMessage
    )}>
      {showSecurityWarning && (
        <MessageBar intent="warning" className={styles.securityWarning}>
          <MessageBarBody>
            <Warning24Regular /> 此消息包含可能不安全的内容，已进行过滤处理
          </MessageBarBody>
        </MessageBar>
      )}
      
      <div 
        className={mergeClasses(
          styles.messageCard,
          isUser ? styles.userMessageCard : styles.assistantMessageCard
        )}
      >
        <Text className={styles.messageText} size={300}>
          {SecurityService.filterOutput(message.content)}
        </Text>
        {message.isLoading && (
          <div style={{ display: "flex", alignItems: "center", gap: tokens.spacingHorizontalS, marginTop: tokens.spacingVerticalS }}>
            <Spinner size="tiny" />
            <Text size={200}>正在输入...</Text>
          </div>
        )}
      </div>
      
      {!message.isLoading && (
        <div className={styles.messageActions}>
          <Button
            appearance="subtle"
            size="small"
            icon={<Copy24Regular />}
            onClick={handleCopy}
            title="复制"
          />
          
          {!isUser && isExcelAvailable() && (
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<Table24Regular />}
                  iconPosition="before"
                  title="插入到Excel"
                >
                  Excel
                  <ChevronDown24Regular />
                </Button>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem 
                    icon={<Document24Regular />} 
                    onClick={handleInsertAsText}
                  >
                    作为文本插入
                  </MenuItem>
                  {isTableLike && (
                    <MenuItem 
                      icon={<Table24Regular />} 
                      onClick={handleInsertAsTable}
                    >
                      作为表格插入
                    </MenuItem>
                  )}
                </MenuList>
              </MenuPopover>
            </Menu>
          )}

          {!isUser && isWordAvailable() && (
            <Button
              appearance="subtle"
              size="small"
              icon={<Document24Regular />}
              onClick={handleInsertAsText}
              title="插入到Word"
            >
              Word
            </Button>
          )}
          
          {isLastAssistantMessage && onRegenerate && (
            <Button
              appearance="subtle"
              size="small"
              icon={<ArrowClockwise24Regular />}
              onClick={onRegenerate}
              title="重新生成"
            />
          )}
        </div>
      )}
    </div>
  );
};

const EnhancedChat: React.FC = () => {
  const styles = useStyles();
  const { state, actions } = useAppContext();
  const { messages, settings, currentConversationId } = state;
  const { sendMessage, regenerateLastResponse, isLoading } = useChat();
  
  const [inputValue, setInputValue] = React.useState("");
  const [securityWarning, setSecurityWarning] = React.useState<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // 性能监控
  const { metrics, startRenderMeasure, endRenderMeasure, measureMessageProcessing } = usePerformance({
    enablePerformanceMonitoring: true,
    enableVirtualization: true,
    maxVisibleMessages: 50,
    enableMemoryOptimization: true,
  });

  // 虚拟化消息
  const { visibleMessages, isVirtualized, hiddenCount } = useVirtualizedMessages(messages, {
    maxVisible: 50,
    enabled: messages.length > 50,
  });

  // 创建新对话（如果需要）
  React.useEffect(() => {
    if (!currentConversationId && messages.length === 0) {
      actions.createNewConversation();
    }
  }, [currentConversationId, messages.length, actions]);

  // 自动滚动到底部
  React.useEffect(() => {
    startRenderMeasure();
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    endRenderMeasure();
  }, [visibleMessages, startRenderMeasure, endRenderMeasure]);

  // 聚焦输入框
  React.useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    // 安全检查
    const sanitized = SecurityService.sanitizeInput(trimmedInput);
    const injectionCheck = SecurityService.detectPromptInjection(sanitized);
    
    if (injectionCheck.detected) {
      setSecurityWarning(injectionCheck.warning || "检测到安全问题");
      setTimeout(() => setSecurityWarning(null), 5000);
    }

    setInputValue("");
    
    await measureMessageProcessing(async () => {
      await sendMessage(sanitized);
    });
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
      // 可以添加成功提示
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  const handleInsertToOffice = async (content: string, format: 'text' | 'table') => {
    try {
      if (format === 'text') {
        if (isExcelAvailable()) {
          await OfficeService.insertTextToExcel(content);
        } else if (isWordAvailable()) {
          await OfficeService.insertTextToWord(content);
        }
      } else if (format === 'table' && isExcelAvailable()) {
        // 简单解析表格数据
        const lines = content.split('\n').filter(line => line.trim());
        const tableData = lines.map(line => {
          if (line.includes('|')) {
            return line.split('|').map(cell => cell.trim());
          } else if (line.includes('\t')) {
            return line.split('\t');
          } else {
            return [line];
          }
        }).filter(row => row.length > 1);

        if (tableData.length > 0) {
          await OfficeService.insertTableToExcel(tableData, { hasHeaders: true });
        } else {
          await OfficeService.insertTextToExcel(content);
        }
      }
      
      // 可以添加成功提示
    } catch (error) {
      console.error("Failed to insert to Office:", error);
      actions.setError(`插入到Office失败: ${error.message}`);
    }
  };

  const handleClearMessages = () => {
    actions.clearMessages();
  };

  const hasMessages = visibleMessages.length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <Text weight="semibold" size={400}>AI助手 (增强版)</Text>
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
        
        {/* 性能指标 */}
        <div className={styles.performanceMetrics}>
          渲染: {metrics.renderTime.toFixed(1)}ms | 
          处理: {metrics.messageProcessingTime.toFixed(1)}ms |
          {metrics.memoryUsage && ` 内存: ${metrics.memoryUsage.toFixed(1)}MB`}
        </div>
      </div>

      {/* 安全警告 */}
      {securityWarning && (
        <MessageBar intent="warning">
          <MessageBarBody>{securityWarning}</MessageBarBody>
        </MessageBar>
      )}

      {/* 虚拟化提示 */}
      {isVirtualized && (
        <div className={styles.virtualizationInfo}>
          <Text size={200}>
            显示最近 {visibleMessages.length} 条消息，已隐藏 {hiddenCount} 条历史消息
          </Text>
        </div>
      )}

      <div className={styles.messagesContainer}>
        {!hasMessages ? (
          <div className={styles.emptyState}>
            <Bot24Regular style={{ fontSize: "48px", color: tokens.colorNeutralForeground3 }} />
            <Text size={500} weight="semibold">
              开始与AI助手对话
            </Text>
            <Text size={300} style={{ color: tokens.colorNeutralForeground2 }}>
              支持直接插入到Excel和Word，智能安全过滤
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
            {visibleMessages.map((message, index) => {
              const isLastAssistantMessage = 
                message.role === "assistant" && 
                index === visibleMessages.length - 1 && 
                !message.isLoading;
              
              return (
                <EnhancedMessage
                  key={message.id}
                  message={message}
                  onCopy={handleCopyMessage}
                  onRegenerate={regenerateLastResponse}
                  onInsertToOffice={handleInsertToOffice}
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

export default EnhancedChat;