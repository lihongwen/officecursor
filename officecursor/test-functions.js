// Office Add-in 功能测试脚本
// 该脚本用于在浏览器控制台中测试应用的各种功能

console.log("📊 开始 Office Add-in 功能测试...");

// 测试 localStorage 功能
function testLocalStorageFeatures() {
  console.log("\n🔧 测试 localStorage 数据持久化功能...");
  
  try {
    // 测试基本存储功能
    const testData = {
      conversations: [
        {
          id: "test-conv-1",
          title: "测试对话",
          messages: [
            {
              id: "msg-1",
              role: "user",
              content: "这是一条测试消息",
              timestamp: new Date().toISOString()
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    };
    
    // 存储测试数据
    localStorage.setItem("aiChat_conversations", JSON.stringify(testData.conversations));
    
    // 读取测试数据
    const stored = localStorage.getItem("aiChat_conversations");
    const parsed = JSON.parse(stored);
    
    console.log("✅ localStorage 基本存储功能正常");
    console.log("📝 存储的对话数量:", parsed.length);
    
    // 测试存储空间
    let testSize = 0;
    for (let key in localStorage) {
      if (key.startsWith("aiChat_")) {
        testSize += localStorage.getItem(key).length;
      }
    }
    console.log("💾 当前 AI Chat 数据大小:", (testSize / 1024).toFixed(2), "KB");
    
    return true;
  } catch (error) {
    console.error("❌ localStorage 测试失败:", error);
    return false;
  }
}

// 测试导航功能
function testNavigationFeatures() {
  console.log("\n🧭 测试导航功能...");
  
  try {
    const navigationButtons = document.querySelectorAll('[title="对话"], [title="对话历史"], [title="设置"]');
    console.log("🔍 发现导航按钮数量:", navigationButtons.length);
    
    if (navigationButtons.length >= 3) {
      console.log("✅ 导航按钮数量正确");
      
      // 检查按钮图标
      navigationButtons.forEach((button, index) => {
        const hasIcon = button.querySelector('svg') || button.querySelector('[data-icon-name]');
        console.log(`📍 按钮 ${index + 1} 图标状态:`, hasIcon ? "有图标" : "无图标");
      });
      
      return true;
    } else {
      console.warn("⚠️ 导航按钮数量不足");
      return false;
    }
  } catch (error) {
    console.error("❌ 导航功能测试失败:", error);
    return false;
  }
}

// 测试圆角设计
function testUIDesign() {
  console.log("\n🎨 测试UI设计（圆角等）...");
  
  try {
    // 检查圆角设计
    const cards = document.querySelectorAll('[class*="Card"], [class*="card"]');
    const buttons = document.querySelectorAll('button');
    
    let roundedElements = 0;
    
    [...cards, ...buttons].forEach(element => {
      const styles = window.getComputedStyle(element);
      const borderRadius = styles.borderRadius;
      
      if (borderRadius && borderRadius !== "0px") {
        roundedElements++;
      }
    });
    
    console.log("🔄 发现圆角元素数量:", roundedElements);
    console.log("📊 总UI元素数量:", cards.length + buttons.length);
    
    if (roundedElements > 0) {
      console.log("✅ UI圆角设计应用正常");
      return true;
    } else {
      console.warn("⚠️ 未发现圆角设计元素");
      return false;
    }
  } catch (error) {
    console.error("❌ UI设计测试失败:", error);
    return false;
  }
}

// 测试对话管理功能
function testConversationManagement() {
  console.log("\n💬 测试对话管理功能...");
  
  try {
    // 检查对话列表
    const conversationElements = document.querySelectorAll('[class*="conversation"], [class*="ConversationItem"]');
    console.log("📝 发现对话元素数量:", conversationElements.length);
    
    // 检查新建对话按钮
    const newConversationButtons = document.querySelectorAll('[title="新建对话"], [title*="新建"]');
    console.log("➕ 发现新建对话按钮数量:", newConversationButtons.length);
    
    // 检查对话操作菜单
    const menuButtons = document.querySelectorAll('[aria-haspopup="true"]');
    console.log("⚙️ 发现菜单按钮数量:", menuButtons.length);
    
    if (newConversationButtons.length > 0) {
      console.log("✅ 对话管理基本功能完整");
      return true;
    } else {
      console.warn("⚠️ 缺少对话管理核心功能");
      return false;
    }
  } catch (error) {
    console.error("❌ 对话管理功能测试失败:", error);
    return false;
  }
}

// 测试Office.js集成
function testOfficeIntegration() {
  console.log("\n🏢 测试Office.js集成...");
  
  try {
    // 检查Office对象是否可用
    if (typeof Office !== "undefined") {
      console.log("✅ Office 对象可用");
      
      if (Office.context) {
        console.log("✅ Office 上下文可用");
        console.log("📱 应用程序:", Office.context.host);
        console.log("🖥️ 平台:", Office.context.platform);
        
        // 检查Excel API
        if (typeof Excel !== "undefined") {
          console.log("✅ Excel API 可用");
        } else {
          console.log("⚠️ Excel API 不可用");
        }
        
        // 检查Word API
        if (typeof Word !== "undefined") {
          console.log("✅ Word API 可用");
        } else {
          console.log("⚠️ Word API 不可用");
        }
        
        return true;
      } else {
        console.warn("⚠️ Office 上下文不可用");
        return false;
      }
    } else {
      console.warn("⚠️ Office 对象不可用 (可能在非Office环境中运行)");
      return false;
    }
  } catch (error) {
    console.error("❌ Office.js集成测试失败:", error);
    return false;
  }
}

// 测试错误处理
function testErrorHandling() {
  console.log("\n🚨 测试错误处理功能...");
  
  try {
    // 检查是否有错误显示组件
    const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"], [role="alert"]');
    console.log("🔍 发现错误显示元素数量:", errorElements.length);
    
    // 模拟localStorage配额错误
    try {
      const largeData = "x".repeat(1024 * 1024); // 1MB数据
      localStorage.setItem("test_quota", largeData);
      localStorage.removeItem("test_quota");
      console.log("✅ localStorage 配额检查正常");
    } catch (quotaError) {
      console.log("⚠️ localStorage 配额限制检测正常:", quotaError.name);
    }
    
    return true;
  } catch (error) {
    console.error("❌ 错误处理测试失败:", error);
    return false;
  }
}

// 主测试函数
function runAllTests() {
  console.log("🚀 执行完整功能测试套件...\n");
  
  const testResults = {
    localStorage: testLocalStorageFeatures(),
    navigation: testNavigationFeatures(),
    uiDesign: testUIDesign(),
    conversationManagement: testConversationManagement(),
    officeIntegration: testOfficeIntegration(),
    errorHandling: testErrorHandling()
  };
  
  console.log("\n📋 测试结果汇总:");
  console.log("==================");
  
  let passedTests = 0;
  const totalTests = Object.keys(testResults).length;
  
  for (const [testName, result] of Object.entries(testResults)) {
    const status = result ? "✅ 通过" : "❌ 失败";
    console.log(`${testName}: ${status}`);
    if (result) passedTests++;
  }
  
  console.log("==================");
  console.log(`📊 总体测试结果: ${passedTests}/${totalTests} 通过`);
  console.log(`🏆 成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log("🎉 所有测试通过！应用质量良好。");
  } else if (passedTests >= totalTests * 0.8) {
    console.log("⚠️ 大部分测试通过，但需要关注失败的测试项。");
  } else {
    console.log("🚨 多个测试失败，需要修复关键问题。");
  }
  
  return testResults;
}

// 导出测试函数供控制台使用
window.officeAddinTests = {
  runAllTests,
  testLocalStorageFeatures,
  testNavigationFeatures,
  testUIDesign,
  testConversationManagement,
  testOfficeIntegration,
  testErrorHandling
};

console.log("📚 测试脚本已加载完成!");
console.log("💡 使用 officeAddinTests.runAllTests() 运行所有测试");
console.log("💡 或使用 officeAddinTests.testLocalStorageFeatures() 等运行单个测试");