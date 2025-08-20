import * as React from "react";
import { makeStyles, MessageBar, MessageBarBody } from "@fluentui/react-components";
import { AppProvider, useAppContext } from "../contexts/AppContext";
import Navigation from "./Navigation";
import Chat from "./Chat";
import Settings from "./Settings";

interface AppProps {
  title: string;
}

const useStyles = makeStyles({
  root: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  content: {
    flex: 1,
    overflow: "hidden",
  },
  errorBar: {
    margin: 0,
  },
});

const AppContent: React.FC = () => {
  const styles = useStyles();
  const { state, actions } = useAppContext();
  const { currentPage, error } = state;

  const handleCloseError = () => {
    actions.setError(null);
  };

  return (
    <div className={styles.root}>
      {error && (
        <MessageBar
          intent="error"
          className={styles.errorBar}
        >
          <MessageBarBody>
            {error}
            <button onClick={handleCloseError} style={{ marginLeft: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
              ✕
            </button>
          </MessageBarBody>
        </MessageBar>
      )}
      
      <Navigation />
      
      <div className={styles.content}>
        {currentPage === "chat" ? <Chat /> : <Settings />}
      </div>
    </div>
  );
};

const App: React.FC<AppProps> = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
