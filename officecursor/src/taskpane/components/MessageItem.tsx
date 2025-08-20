import * as React from "react";
import {
  Card,
  Text,
  Button,
  Spinner,
  makeStyles,
  mergeClasses,
  tokens,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  MessageBar,
  MessageBarBody,
  Avatar,
  Tooltip,
} from "@fluentui/react-components";
import {
  Copy24Regular,
  ArrowClockwise24Regular,
  ChevronDown24Regular,
  Table24Regular,
  Document24Regular,
  Warning24Regular,
  Bot24Regular,
} from "@fluentui/react-icons";
import { Message } from "../contexts/AppContext";
import { OfficeService, isExcelAvailable, isWordAvailable } from "../services/officeService";
import { SecurityService } from "../services/securityService";
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';
import 'prismjs/themes/prism-okaidia.css';

// --- CodeBlock Component Definition ---
const useCodeBlockStyles = makeStyles({
  container: {
    position: 'relative',
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
    backgroundColor: '#2d2d2d',
    fontFamily: 'monospace',
  },
  copyButton: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    color: tokens.colorNeutralForegroundOnBrand,
  },
  editor: {
    fontFamily: '"Fira code", "Fira Mono", monospace',
    fontSize: '14px',
    '& textarea:focus': {
      outline: 'none',
    },
  },
});

interface CodeBlockProps {
  code: string;
  language: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const styles = useCodeBlockStyles();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
  };

  const getLanguage = (lang: string) => {
    switch (lang) {
      case 'js':
      case 'javascript':
        return languages.js;
      case 'ts':
      case 'typescript':
        return languages.ts;
      case 'py':
      case 'python':
        return languages.py;
      case 'css':
        return languages.css;
      case 'html':
      case 'xml':
        return languages.markup;
      default:
        return languages.clike;
    }
  };

  return (
    <div className={styles.container}>
      <Tooltip content="复制代码" relationship="label">
        <Button
          appearance="subtle"
          icon={<Copy24Regular />}
          onClick={handleCopy}
          className={styles.copyButton}
        />
      </Tooltip>
      <Editor
        value={code}
        onValueChange={() => {}}
        highlight={(code) => highlight(code, getLanguage(language), language)}
        padding={10}
        className={styles.editor}
        readOnly
      />
    </div>
  );
};
// --- End of CodeBlock Component Definition ---


const useStyles = makeStyles({
  messageContainer: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    maxWidth: '100%',
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
    maxWidth: "100%",
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
  securityWarning: {
    margin: tokens.spacingVerticalS,
  },
});

interface MessageItemProps {
  message: Message;
  onCopy: (content: string) => void;
  onRegenerate?: () => void;
  onInsertToOffice: (content: string, format: 'text' | 'table') => void;
  isLastAssistantMessage?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ 
  message, 
  onCopy, 
  onRegenerate, 
  onInsertToOffice,
  isLastAssistantMessage 
}) => {
  const styles = useStyles();
  const isUser = message.role === "user";
  const [showSecurityWarning, setShowSecurityWarning] = React.useState(false);

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

  const isTableLike = React.useMemo(() => {
    const lines = message.content.split('\n').filter(line => line.trim());
    const hasTableMarkers = lines.some(line => line.includes('|') || line.includes('\t'));
    const hasStructuredData = lines.length > 2 && lines.some(line => 
      line.includes(':') || /^\d+\./.test(line.trim())
    );
    return hasTableMarkers || hasStructuredData;
  }, [message.content]);

  const renderContent = () => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(message.content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <Text key={`text-${lastIndex}`} className={styles.messageText} size={300}>
            {SecurityService.filterOutput(message.content.slice(lastIndex, match.index))}
          </Text>
        );
      }
      parts.push(
        <CodeBlock
          key={`code-${match.index}`}
          language={match[1] || 'clike'}
          code={match[2]}
        />
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < message.content.length) {
      parts.push(
        <Text key={`text-${lastIndex}`} className={styles.messageText} size={300}>
          {SecurityService.filterOutput(message.content.slice(lastIndex))}
        </Text>
      );
    }

    return parts;
  };

  return (
    <div className={mergeClasses(styles.messageContainer, isUser ? styles.userMessage : styles.assistantMessage)}>
      {!isUser && <Avatar icon={<Bot24Regular />} />}
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
          {renderContent()}
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
    </div>
  );
};

export default React.memo(MessageItem); 