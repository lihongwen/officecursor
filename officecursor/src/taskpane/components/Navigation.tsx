import * as React from "react";
import {
  Tooltip,
  Button,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  Chat24Regular,
  Settings24Regular,
  Chat24Filled,
  Settings24Filled,
  History24Regular,
  History24Filled,
} from "@fluentui/react-icons";
import { useAppContext } from "../contexts/AppContext";

const useStyles = makeStyles({
  navigation: {
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    padding: `${tokens.spacingVerticalS} 0`,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  navButton: {
    width: "48px",
    height: "48px",
    borderRadius: tokens.borderRadiusMedium,
  },
  activeButton: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
    "&:hover": {
      backgroundColor: tokens.colorBrandBackground2Hover,
    },
  },
});

const Navigation: React.FC = () => {
  const styles = useStyles();
  const { state, actions } = useAppContext();
  const { currentPage } = state;

  const handlePageChange = (page: "chat" | "settings" | "conversations") => {
    actions.setCurrentPage(page);
  };

  return (
    <div className={styles.navigation}>
      <Tooltip content="对话" relationship="label">
        <Button
          appearance={currentPage === "chat" ? "primary" : "subtle"}
          icon={currentPage === "chat" ? <Chat24Filled /> : <Chat24Regular />}
          onClick={() => handlePageChange("chat")}
          className={styles.navButton}
        />
      </Tooltip>
      <Tooltip content="对话历史" relationship="label">
        <Button
          appearance={currentPage === "conversations" ? "primary" : "subtle"}
          icon={currentPage === "conversations" ? <History24Filled /> : <History24Regular />}
          onClick={() => handlePageChange("conversations")}
          className={styles.navButton}
        />
      </Tooltip>
      <Tooltip content="设置" relationship="label">
        <Button
          appearance={currentPage === "settings" ? "primary" : "subtle"}
          icon={currentPage === "settings" ? <Settings24Filled /> : <Settings24Regular />}
          onClick={() => handlePageChange("settings")}
          className={styles.navButton}
        />
      </Tooltip>
    </div>
  );
};

export default Navigation;