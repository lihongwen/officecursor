import * as React from "react";
import {
  TabList,
  Tab,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  Chat24Regular,
  Settings24Regular,
  Chat24Filled,
  Settings24Filled,
} from "@fluentui/react-icons";
import { useAppContext } from "../contexts/AppContext";

const useStyles = makeStyles({
  navigation: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    padding: `0 ${tokens.spacingHorizontalM}`,
  },
});

const Navigation: React.FC = () => {
  const styles = useStyles();
  const { state, actions } = useAppContext();
  const { currentPage } = state;

  const handleTabSelect = (value: string) => {
    actions.setCurrentPage(value as "chat" | "settings");
  };

  return (
    <div className={styles.navigation}>
      <TabList
        selectedValue={currentPage}
        onTabSelect={(_, data) => handleTabSelect(data.value as string)}
        size="medium"
      >
        <Tab 
          value="chat" 
          icon={currentPage === "chat" ? <Chat24Filled /> : <Chat24Regular />}
        >
          对话
        </Tab>
        <Tab 
          value="settings"
          icon={currentPage === "settings" ? <Settings24Filled /> : <Settings24Regular />}
        >
          设置
        </Tab>
      </TabList>
    </div>
  );
};

export default Navigation;