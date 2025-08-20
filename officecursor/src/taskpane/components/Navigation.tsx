import * as React from "react";
import {
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
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    padding: tokens.spacingVerticalS,
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  navButton: {
    minWidth: "40px",
    height: "40px",
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
      <Button
        appearance={currentPage === "chat" ? "primary" : "subtle"}
        icon={currentPage === "chat" ? <Chat24Filled /> : <Chat24Regular />}
        onClick={() => handlePageChange("chat")}
        className={styles.navButton}
        title="对话"
      />
      <Button
        appearance={currentPage === "conversations" ? "primary" : "subtle"}
        icon={currentPage === "conversations" ? <History24Filled /> : <History24Regular />}
        onClick={() => handlePageChange("conversations")}
        className={styles.navButton}
        title="对话历史"
      />
      <Button
        appearance={currentPage === "settings" ? "primary" : "subtle"}
        icon={currentPage === "settings" ? <Settings24Filled /> : <Settings24Regular />}
        onClick={() => handlePageChange("settings")}
        className={styles.navButton}
        title="设置"
      />
    </div>
  );
};

export default Navigation;