import * as React from "react";

// Types for the application state
export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AppSettings {
  apiKey: string;
  selectedModel: string;
  baseUrl: string;
}

export interface AppState {
  // Settings
  settings: AppSettings;
  
  // Chat state
  messages: Message[];
  conversations: Conversation[];
  currentConversationId: string | null;
  isLoading: boolean;
  currentPage: "chat" | "settings" | "conversations";
  
  // Error state
  error: string | null;
}

export interface AppContextType {
  state: AppState;
  actions: {
    // Settings actions
    updateSettings: (settings: Partial<AppSettings>) => void;
    
    // Navigation actions
    setCurrentPage: (page: "chat" | "settings" | "conversations") => void;
    
    // Chat actions
    addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
    updateMessage: (id: string, updates: Partial<Message>) => void;
    updateLastAssistantMessage: (updates: Partial<Message>) => void;
    clearMessages: () => void;
    
    // Conversation actions
    createNewConversation: () => void;
    loadConversation: (conversationId: string) => void;
    deleteConversation: (conversationId: string) => void;
    updateConversationTitle: (conversationId: string, title: string) => void;
    
    // Loading state
    setLoading: (loading: boolean) => void;
    
    // Error handling
    setError: (error: string | null) => void;
    
    // Local storage
    saveToStorage: () => void;
    loadFromStorage: () => void;
  };
}

const defaultSettings: AppSettings = {
  apiKey: "",
  selectedModel: "deepseek-chat",
  baseUrl: "https://api.deepseek.com",
};

const defaultState: AppState = {
  settings: defaultSettings,
  messages: [],
  conversations: [],
  currentConversationId: null,
  isLoading: false,
  currentPage: "chat",
  error: null,
};

const AppContext = React.createContext<AppContextType | undefined>(undefined);

// Local storage keys
const STORAGE_KEYS = {
  SETTINGS: "aiChat_settings",
  MESSAGES: "aiChat_messages",
  CONVERSATIONS: "aiChat_conversations",
  CURRENT_CONVERSATION: "aiChat_currentConversation",
  UI_STATE: "aiChat_uiState",
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = React.useState<AppState>(defaultState);

  // Load data from localStorage on mount
  React.useEffect(() => {
    loadFromStorage();
  }, []);

  // Actions
  const updateSettings = React.useCallback((newSettings: Partial<AppSettings>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
  }, []);

  const setCurrentPage = React.useCallback((page: "chat" | "settings" | "conversations") => {
    setState(prev => ({ ...prev, currentPage: page }));
  }, []);

  const addMessage = React.useCallback((message: Omit<Message, "id" | "timestamp">) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };
    
    setState(prev => {
      const updatedMessages = [...prev.messages, newMessage];
      
      // Update the current conversation if one exists
      let updatedConversations = prev.conversations;
      if (prev.currentConversationId) {
        updatedConversations = prev.conversations.map(c =>
          c.id === prev.currentConversationId
            ? { 
                ...c, 
                messages: updatedMessages,
                updatedAt: new Date(),
                // Auto-generate title from first user message
                title: c.title === "新对话" && message.role === "user" && updatedMessages.length === 1
                  ? message.content.slice(0, 30) + (message.content.length > 30 ? "..." : "")
                  : c.title
              }
            : c
        );
      }
      
      return {
        ...prev,
        messages: updatedMessages,
        conversations: updatedConversations,
      };
    });
  }, []);

  const updateMessage = React.useCallback((id: string, updates: Partial<Message>) => {
    setState(prev => {
      const updatedMessages = prev.messages.map(msg => 
        msg.id === id ? { ...msg, ...updates } : msg
      );
      
      // Update the current conversation
      let updatedConversations = prev.conversations;
      if (prev.currentConversationId) {
        updatedConversations = prev.conversations.map(c =>
          c.id === prev.currentConversationId
            ? { ...c, messages: updatedMessages, updatedAt: new Date() }
            : c
        );
      }
      
      return {
        ...prev,
        messages: updatedMessages,
        conversations: updatedConversations,
      };
    });
  }, []);

  const updateLastAssistantMessage = React.useCallback((updates: Partial<Message>) => {
    setState(prev => {
      const updatedMessages = [...prev.messages];
      
      // Find the last assistant message (most recent one)
      for (let i = updatedMessages.length - 1; i >= 0; i--) {
        if (updatedMessages[i].role === "assistant") {
          console.log(`Updating last assistant message at index ${i} with updates:`, updates);
          updatedMessages[i] = {
            ...updatedMessages[i],
            ...updates,
          };
          break;
        }
      }
      
      // Update the current conversation
      let updatedConversations = prev.conversations;
      if (prev.currentConversationId) {
        updatedConversations = prev.conversations.map(c =>
          c.id === prev.currentConversationId
            ? { ...c, messages: updatedMessages, updatedAt: new Date() }
            : c
        );
      }
      
      return {
        ...prev,
        messages: updatedMessages,
        conversations: updatedConversations,
      };
    });
  }, []);

  const clearMessages = React.useCallback(() => {
    setState(prev => ({ ...prev, messages: [] }));
  }, []);

  const setLoading = React.useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = React.useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  // Conversation management functions
  const createNewConversation = React.useCallback(() => {
    const newConversation: Conversation = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      title: "新对话",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setState(prev => ({
      ...prev,
      conversations: [newConversation, ...prev.conversations],
      currentConversationId: newConversation.id,
      messages: [],
    }));
  }, []);

  const loadConversation = React.useCallback((conversationId: string) => {
    setState(prev => {
      const conversation = prev.conversations.find(c => c.id === conversationId);
      if (!conversation) {
        return prev;
      }

      return {
        ...prev,
        currentConversationId: conversationId,
        messages: conversation.messages,
      };
    });
  }, []);

  const deleteConversation = React.useCallback((conversationId: string) => {
    setState(prev => {
      const updatedConversations = prev.conversations.filter(c => c.id !== conversationId);
      let newCurrentConversationId = prev.currentConversationId;
      let newMessages = prev.messages;

      // If we're deleting the current conversation
      if (prev.currentConversationId === conversationId) {
        // Switch to the first remaining conversation or create a new one
        if (updatedConversations.length > 0) {
          newCurrentConversationId = updatedConversations[0].id;
          newMessages = updatedConversations[0].messages;
        } else {
          newCurrentConversationId = null;
          newMessages = [];
        }
      }

      return {
        ...prev,
        conversations: updatedConversations,
        currentConversationId: newCurrentConversationId,
        messages: newMessages,
      };
    });
  }, []);

  const updateConversationTitle = React.useCallback((conversationId: string, title: string) => {
    setState(prev => ({
      ...prev,
      conversations: prev.conversations.map(c =>
        c.id === conversationId
          ? { ...c, title, updatedAt: new Date() }
          : c
      ),
    }));
  }, []);

  const saveToStorage = React.useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(state.messages));
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(state.conversations));
      localStorage.setItem(STORAGE_KEYS.CURRENT_CONVERSATION, JSON.stringify(state.currentConversationId));
      localStorage.setItem(STORAGE_KEYS.UI_STATE, JSON.stringify({
        currentPage: state.currentPage
      }));
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
  }, [state]);

  const loadFromStorage = React.useCallback(() => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const savedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      const savedConversations = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      const savedCurrentConversation = localStorage.getItem(STORAGE_KEYS.CURRENT_CONVERSATION);
      const savedUiState = localStorage.getItem(STORAGE_KEYS.UI_STATE);

      const settings = savedSettings ? JSON.parse(savedSettings) : defaultSettings;
      const messages = savedMessages ? JSON.parse(savedMessages).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })) : [];
      const conversations = savedConversations ? JSON.parse(savedConversations).map((conv: any) => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      })) : [];
      const currentConversationId = savedCurrentConversation ? JSON.parse(savedCurrentConversation) : null;
      const uiState = savedUiState ? JSON.parse(savedUiState) : { currentPage: "chat" };

      setState(prev => ({
        ...prev,
        settings: { ...defaultSettings, ...settings },
        messages,
        conversations,
        currentConversationId,
        currentPage: uiState.currentPage,
      }));
    } catch (error) {
      console.error("Failed to load from localStorage:", error);
    }
  }, []);

  // Auto-save when state changes
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveToStorage();
    }, 500); // Debounce saves

    return () => clearTimeout(timeoutId);
  }, [state, saveToStorage]);

  const contextValue: AppContextType = {
    state,
    actions: {
      updateSettings,
      setCurrentPage,
      addMessage,
      updateMessage,
      updateLastAssistantMessage,
      clearMessages,
      createNewConversation,
      loadConversation,
      deleteConversation,
      updateConversationTitle,
      setLoading,
      setError,
      saveToStorage,
      loadFromStorage,
    },
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useAppContext = (): AppContextType => {
  const context = React.useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

export default AppContext;