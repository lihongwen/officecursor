import * as React from "react";
import {
  Button,
  Text,
  List,
  ListItem,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  Add24Regular,
  Delete24Regular,
  Edit24Regular,
  MoreVertical24Regular,
  Chat24Regular,
} from "@fluentui/react-icons";
import { useAppContext, Conversation } from "../contexts/AppContext";

const useStyles = makeStyles({
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    backgroundColor: tokens.colorNeutralBackground1,
  },
  header: {
    padding: tokens.spacingVerticalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontWeight: tokens.fontWeightSemibold,
  },
  newButton: {
    minWidth: "auto",
  },
  conversationsList: {
    flex: 1,
    overflow: "auto",
    padding: tokens.spacingVerticalS,
  },
  conversationItem: {
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusMedium,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalS,
    "&:hover": {
      backgroundColor: tokens.colorNeutralBackground2,
    },
  },
  activeConversation: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorNeutralForegroundOnBrand,
    "&:hover": {
      backgroundColor: tokens.colorBrandBackground2Hover,
    },
  },
  conversationContent: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  conversationTitle: {
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  conversationMeta: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    marginTop: tokens.spacingVerticalXXS,
  },
  menuButton: {
    minWidth: "24px",
    height: "24px",
    padding: 0,
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
});

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (newTitle: string) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onSelect,
  onDelete,
  onRename,
}) => {
  const styles = useStyles();
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [titleInput, setTitleInput] = React.useState(conversation.title);

  const handleRename = () => {
    setIsRenaming(true);
  };

  const handleSaveRename = () => {
    if (titleInput.trim() && titleInput !== conversation.title) {
      onRename(titleInput.trim());
    }
    setIsRenaming(false);
  };

  const handleCancelRename = () => {
    setTitleInput(conversation.title);
    setIsRenaming(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSaveRename();
    } else if (event.key === "Escape") {
      handleCancelRename();
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return "昨天";
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <ListItem>
      <div
        className={`${styles.conversationItem} ${isActive ? styles.activeConversation : ""}`}
        onClick={onSelect}
      >
        <div className={styles.conversationContent}>
          <Chat24Regular />
          <div style={{ flex: 1, minWidth: 0 }}>
            {isRenaming ? (
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleSaveRename}
                onKeyDown={handleKeyDown}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "inherit",
                  font: "inherit",
                  width: "100%",
                  outline: "none",
                }}
                autoFocus
              />
            ) : (
              <>
                <Text className={styles.conversationTitle} size={300}>
                  {conversation.title}
                </Text>
                <div className={styles.conversationMeta}>
                  {formatDate(conversation.updatedAt)}
                </div>
              </>
            )}
          </div>
        </div>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Button
              appearance="subtle"
              icon={<MoreVertical24Regular />}
              className={styles.menuButton}
              onClick={(e) => e.stopPropagation()}
            />
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem icon={<Edit24Regular />} onClick={handleRename}>
                重命名
              </MenuItem>
              <MenuItem icon={<Delete24Regular />} onClick={onDelete}>
                删除
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      </div>
    </ListItem>
  );
};

const ConversationList: React.FC = () => {
  const styles = useStyles();
  const { state, actions } = useAppContext();
  const { conversations, currentConversationId } = state;

  const handleNewConversation = () => {
    actions.createNewConversation();
  };

  const handleSelectConversation = (conversationId: string) => {
    actions.loadConversation(conversationId);
  };

  const handleDeleteConversation = (conversationId: string) => {
    actions.deleteConversation(conversationId);
  };

  const handleRenameConversation = (conversationId: string, newTitle: string) => {
    actions.updateConversationTitle(conversationId, newTitle);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title} size={400}>
          对话历史
        </Text>
        <Button
          appearance="primary"
          icon={<Add24Regular />}
          className={styles.newButton}
          onClick={handleNewConversation}
          title="新建对话"
        />
      </div>
      
      <div className={styles.conversationsList}>
        {conversations.length === 0 ? (
          <div className={styles.emptyState}>
            <Chat24Regular style={{ fontSize: "48px", color: tokens.colorNeutralForeground3 }} />
            <Text size={400} weight="semibold">
              暂无对话记录
            </Text>
            <Text size={300} style={{ color: tokens.colorNeutralForeground2 }}>
              开始新对话来创建您的第一个对话记录
            </Text>
            <Button appearance="primary" onClick={handleNewConversation}>
              新建对话
            </Button>
          </div>
        ) : (
          <List>
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === currentConversationId}
                onSelect={() => handleSelectConversation(conversation.id)}
                onDelete={() => handleDeleteConversation(conversation.id)}
                onRename={(newTitle) => handleRenameConversation(conversation.id, newTitle)}
              />
            ))}
          </List>
        )}
      </div>
    </div>
  );
};

export default ConversationList;