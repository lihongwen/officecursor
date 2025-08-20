import * as React from "react";
import {
  Card,
  CardHeader,
  CardPreview,
  Text,
  Button,
  Input,
  Label,
  Dropdown,
  Option,
  Field,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Spinner,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  Settings24Regular,
  Key24Regular,
  CheckmarkCircle24Regular,
  ErrorCircle24Regular,
} from "@fluentui/react-icons";
import { useAppContext } from "../contexts/AppContext";
import { getDeepSeekAPI, DeepSeekAPIError } from "../services/deepseekApi";

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingVerticalM,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
    maxWidth: "600px",
    margin: "0 auto",
    height: "100%",
    overflow: "auto",
    "@media (max-width: 480px)": {
      padding: tokens.spacingVerticalS,
      gap: tokens.spacingVerticalM,
    },
  },
  card: {
    width: "100%",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  buttonGroup: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    alignItems: "center",
    "@media (max-width: 480px)": {
      flexDirection: "column",
      alignItems: "stretch",
      gap: tokens.spacingVerticalS,
    },
  },
  testResult: {
    marginTop: tokens.spacingVerticalS,
  },
});

const Settings: React.FC = () => {
  const styles = useStyles();
  const { state, actions } = useAppContext();
  const { settings } = state;
  
  const [localSettings, setLocalSettings] = React.useState(settings);
  const [isTestingConnection, setIsTestingConnection] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Available models from DeepSeek API
  const availableModels = [
    { key: "deepseek-chat", text: "DeepSeek Chat (V3-0324)" },
    { key: "deepseek-reasoner", text: "DeepSeek Reasoner (R1-0528)" },
  ];

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSettingChange = (field: keyof typeof localSettings, value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: value,
    }));
    setTestResult(null); // Clear test result when settings change
  };

  const handleSaveSettings = () => {
    actions.updateSettings(localSettings);
    setTestResult({
      success: true,
      message: "设置已保存",
    });
  };

  const handleTestConnection = async () => {
    if (!localSettings.apiKey.trim()) {
      setTestResult({
        success: false,
        message: "请先输入API Key",
      });
      return;
    }

    setIsTestingConnection(true);
    setTestResult(null);

    try {
      const api = getDeepSeekAPI({
        apiKey: localSettings.apiKey,
        baseUrl: localSettings.baseUrl,
        model: localSettings.selectedModel,
      });

      const isConnected = await api.testConnection();
      
      if (isConnected) {
        setTestResult({
          success: true,
          message: "连接测试成功！API配置正确。",
        });
        // Auto-save settings if test is successful
        actions.updateSettings(localSettings);
      } else {
        setTestResult({
          success: false,
          message: "连接测试失败，请检查API配置。",
        });
      }
    } catch (error) {
      let errorMessage = "连接测试失败";
      
      if (error instanceof DeepSeekAPIError) {
        errorMessage = `API错误: ${error.message}`;
      } else if (error instanceof Error) {
        errorMessage = `错误: ${error.message}`;
      }

      setTestResult({
        success: false,
        message: errorMessage,
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const isFormChanged = React.useMemo(() => {
    return (
      localSettings.apiKey !== settings.apiKey ||
      localSettings.selectedModel !== settings.selectedModel ||
      localSettings.baseUrl !== settings.baseUrl
    );
  }, [localSettings, settings]);

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <CardHeader
          image={<Settings24Regular />}
          header={<Text weight="semibold">AI助手设置</Text>}
          description="配置DeepSeek API连接和模型选择"
        />
        <CardPreview>
          <div style={{ padding: tokens.spacingVerticalM }}>
            <div className={styles.field}>
              <Field label="API Key" required>
                <Input
                  placeholder="输入你的DeepSeek API Key"
                  type="password"
                  value={localSettings.apiKey}
                  onChange={(_, data) => handleSettingChange("apiKey", data.value)}
                  contentBefore={<Key24Regular />}
                />
              </Field>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                在 <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer">
                  platform.deepseek.com
                </a> 获取你的API Key
              </Text>
            </div>

            <div className={styles.field}>
              <Field label="模型选择">
                <Dropdown
                  placeholder="选择AI模型"
                  value={localSettings.selectedModel}
                  selectedOptions={[localSettings.selectedModel]}
                  onOptionSelect={(_, data) => {
                    if (data.optionValue) {
                      handleSettingChange("selectedModel", data.optionValue);
                    }
                  }}
                >
                  {availableModels.map((model) => (
                    <Option key={model.key} value={model.key}>
                      {model.text}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
            </div>

            <div className={styles.field}>
              <Field label="API端点">
                <Input
                  placeholder="https://api.deepseek.com"
                  value={localSettings.baseUrl}
                  onChange={(_, data) => handleSettingChange("baseUrl", data.value)}
                />
              </Field>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                通常不需要修改，除非使用自定义端点
              </Text>
            </div>

            <div className={styles.buttonGroup}>
              <Button
                appearance="primary"
                disabled={!isFormChanged}
                onClick={handleSaveSettings}
              >
                保存设置
              </Button>
              
              <Button
                appearance="secondary"
                disabled={isTestingConnection || !localSettings.apiKey.trim()}
                onClick={handleTestConnection}
                icon={isTestingConnection ? <Spinner size="tiny" /> : undefined}
              >
                {isTestingConnection ? "测试中..." : "测试连接"}
              </Button>
            </div>

            {testResult && (
              <div className={styles.testResult}>
                <MessageBar intent={testResult.success ? "success" : "error"}>
                  <MessageBarBody>
                    <MessageBarTitle>
                      {testResult.success ? (
                        <CheckmarkCircle24Regular />
                      ) : (
                        <ErrorCircle24Regular />
                      )}
                      {testResult.message}
                    </MessageBarTitle>
                  </MessageBarBody>
                </MessageBar>
              </div>
            )}
          </div>
        </CardPreview>
      </Card>

      <Card className={styles.card}>
        <CardHeader
          header={<Text weight="semibold">关于DeepSeek模型</Text>}
        />
        <CardPreview>
          <div style={{ padding: tokens.spacingVerticalM }}>
            <div style={{ display: "flex", flexDirection: "column", gap: tokens.spacingVerticalS }}>
              <div>
                <Text weight="semibold">DeepSeek Chat (V3-0324)</Text>
                <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                  通用对话模型，适合日常聊天、代码生成、文档编写等任务
                </Text>
              </div>
              
              <div>
                <Text weight="semibold">DeepSeek Reasoner (R1-0528)</Text>
                <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                  推理专用模型，适合复杂逻辑推理、数学问题、分析任务
                </Text>
              </div>
            </div>
          </div>
        </CardPreview>
      </Card>
    </div>
  );
};

export default Settings;