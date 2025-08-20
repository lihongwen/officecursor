# AI聊天助手 - 使用说明

这是一个集成DeepSeek API的AI聊天助手，作为Office Add-in实现，提供类似Cursor的AI对话体验。

## 功能特性

- ✅ 现代化的聊天界面，支持流式响应
- ✅ 集成DeepSeek API (deepseek-chat 和 deepseek-reasoner 模型)
- ✅ 完整的设置管理（API Key配置、模型选择）
- ✅ 本地数据持久化（设置和聊天历史）
- ✅ 响应式设计，适配不同屏幕尺寸
- ✅ 错误处理和用户反馈
- ✅ 消息复制、重新生成等交互功能

## 如何使用

### 1. 获取API Key
1. 访问 [DeepSeek官网](https://platform.deepseek.com)
2. 注册账户并获取API Key
3. 在本应用的"设置"页面输入API Key

### 2. 配置设置
1. 打开应用，点击"设置"标签
2. 输入你的DeepSeek API Key
3. 选择AI模型：
   - **DeepSeek Chat (V3-0324)**: 通用对话模型，适合日常聊天、代码生成、文档编写
   - **DeepSeek Reasoner (R1-0528)**: 推理专用模型，适合复杂逻辑推理、数学问题、分析任务
4. 点击"测试连接"验证配置
5. 点击"保存设置"

### 3. 开始对话
1. 切换到"对话"标签
2. 在输入框中输入你的问题或请求
3. 按Enter发送（Shift+Enter换行）
4. AI会实时流式回复

### 4. 高级功能
- **复制消息**: 点击消息下方的"复制"按钮
- **重新生成**: 对最后一条AI回复点击"重新生成"
- **清空对话**: 点击右上角的"清空对话"按钮
- **消息历史**: 自动保存到本地，重新打开应用时会恢复

## 开发和部署

### 开发环境启动
```bash
cd officecursor
npm install
npm run dev-server
```

### 生产构建
```bash
npm run build
```

### 代码质量检查
```bash
npm run lint
npm run prettier
```

### Office Add-in调试
```bash
npm start  # 启动Excel并加载Add-in
npm stop   # 停止调试
```

## 技术架构

- **前端框架**: React 18 + TypeScript
- **UI组件库**: Fluent UI React Components
- **状态管理**: React Context + Hooks
- **API集成**: DeepSeek Chat Completions API
- **数据持久化**: localStorage
- **构建工具**: Webpack
- **开发工具**: Office Add-in CLI

## 项目结构

```
src/taskpane/
├── components/         # React组件
│   ├── App.tsx        # 主应用组件
│   ├── Chat.tsx       # 聊天界面
│   ├── Settings.tsx   # 设置页面
│   └── Navigation.tsx # 导航组件
├── contexts/          # React Context
│   └── AppContext.tsx # 应用状态管理
├── services/          # API服务
│   └── deepseekApi.ts # DeepSeek API集成
├── hooks/             # 自定义Hooks
│   └── useChat.ts     # 聊天逻辑Hook
└── index.tsx          # 入口文件
```

## API集成

该项目集成了DeepSeek API，支持：
- 完整的聊天对话
- 流式响应
- 多模型支持
- 错误处理和重试
- 连接测试

## 注意事项

1. **API Key安全**: API Key存储在本地localStorage中，请妥善保管
2. **网络要求**: 需要稳定的网络连接访问DeepSeek API
3. **使用限制**: 遵守DeepSeek API的使用条款和限制
4. **浏览器兼容**: 支持现代浏览器，需要fetch API和ES6+支持

## 故障排除

### 常见问题
1. **无法连接API**: 检查API Key是否正确，网络是否正常
2. **消息发送失败**: 查看错误提示，可能是API限制或网络问题
3. **界面显示异常**: 尝试清空浏览器缓存或重新加载

### 开发调试
- 使用浏览器开发者工具查看网络请求
- 检查控制台错误信息
- 验证构建输出是否正常

---

MVP版本开发完成！🎉 

这个AI聊天助手现在具备了完整的功能，可以与DeepSeek API进行对话，提供了现代化的用户界面和良好的用户体验。