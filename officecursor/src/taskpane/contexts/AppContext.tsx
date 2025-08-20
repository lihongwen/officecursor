import * as React from "react";

// Types for the application state
export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  isLoading?: boolean;
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
  isLoading: boolean;
  currentPage: "chat" | "settings";
  
  // Error state
  error: string | null;
}

export interface AppContextType {
  state: AppState;
  actions: {
    // Settings actions
    updateSettings: (settings: Partial<AppSettings>) => void;
    
    // Navigation actions
    setCurrentPage: (page: "chat" | "settings") => void;
    
    // Chat actions
    addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
    updateMessage: (id: string, updates: Partial<Message>) => void;
    updateLastAssistantMessage: (updates: Partial<Message>) => void;
    clearMessages: () => void;
    
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
  isLoading: false,
  currentPage: "chat",
  error: null,
};

const AppContext = React.createContext<AppContextType | undefined>(undefined);

// Local storage keys
const STORAGE_KEYS = {
  SETTINGS: "aiChat_settings",
  MESSAGES: "aiChat_messages",
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

  const setCurrentPage = React.useCallback((page: "chat" | "settings") => {
    setState(prev => ({ ...prev, currentPage: page }));
  }, []);

  const addMessage = React.useCallback((message: Omit<Message, "id" | "timestamp">) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };
    
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));
  }, []);

  const updateMessage = React.useCallback((id: string, updates: Partial<Message>) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(msg => 
        msg.id === id ? { ...msg, ...updates } : msg
      )
    }));
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
      
      return {
        ...prev,
        messages: updatedMessages,
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

  const saveToStorage = React.useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(state.messages));
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
      const savedUiState = localStorage.getItem(STORAGE_KEYS.UI_STATE);

      const settings = savedSettings ? JSON.parse(savedSettings) : defaultSettings;
      const messages = savedMessages ? JSON.parse(savedMessages).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })) : [];
      const uiState = savedUiState ? JSON.parse(savedUiState) : { currentPage: "chat" };

      setState(prev => ({
        ...prev,
        settings: { ...defaultSettings, ...settings },
        messages,
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