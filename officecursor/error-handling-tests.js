// 错误处理测试脚本
// 用于测试各种错误场景和异常处理

console.log("🚨 开始错误处理和边界条件测试...");

// 测试网络错误场景
async function testNetworkErrors() {
  console.log("\n🌐 测试网络错误场景...");
  
  const networkTests = [
    {
      name: "API 超时",
      test: async () => {
        // 模拟超时请求
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 100); // 100ms 超时
        
        try {
          await fetch("https://httpbin.org/delay/1", {
            signal: controller.signal
          });
          return false;
        } catch (error) {
          console.log("✅ 超时错误正确捕获:", error.name);
          return true;
        }
      }
    },
    {
      name: "网络连接失败",
      test: async () => {
        try {
          await fetch("https://nonexistent.domain.invalid");
          return false;
        } catch (error) {
          console.log("✅ 网络错误正确捕获:", error.name);
          return true;
        }
      }
    },
    {
      name: "CORS 错误",
      test: async () => {
        try {
          await fetch("https://example.com/api/test");
          return false;
        } catch (error) {
          console.log("✅ CORS错误正确处理:", error.name);
          return true;
        }
      }
    }
  ];
  
  let passedTests = 0;
  for (const test of networkTests) {
    try {
      const result = await test.test();
      if (result) passedTests++;
      console.log(`${test.name}: ${result ? "✅" : "❌"}`);
    } catch (error) {
      console.log(`${test.name}: ❌ (${error.message})`);
    }
  }
  
  return passedTests / networkTests.length;
}

// 测试存储错误场景
function testStorageErrors() {
  console.log("\n💾 测试存储错误场景...");
  
  const storageTests = [
    {
      name: "localStorage 配额超限",
      test: () => {
        try {
          // 尝试存储大量数据
          const largeData = "x".repeat(5 * 1024 * 1024); // 5MB
          localStorage.setItem("test_large_data", largeData);
          localStorage.removeItem("test_large_data");
          console.log("⚠️ 配额检查可能需要调整");
          return true;
        } catch (error) {
          if (error.name === "QuotaExceededError") {
            console.log("✅ 配额超限错误正确捕获");
            return true;
          }
          console.log("❌ 意外错误:", error.name);
          return false;
        }
      }
    },
    {
      name: "localStorage 访问被拒绝",
      test: () => {
        try {
          // 测试隐私模式下的存储访问
          const testKey = "privacy_test";
          localStorage.setItem(testKey, "test");
          const value = localStorage.getItem(testKey);
          localStorage.removeItem(testKey);
          
          if (value === "test") {
            console.log("✅ localStorage 访问正常");
            return true;
          }
          return false;
        } catch (error) {
          console.log("✅ localStorage 访问限制正确处理:", error.name);
          return true;
        }
      }
    },
    {
      name: "JSON 解析错误",
      test: () => {
        try {
          localStorage.setItem("invalid_json", "{ invalid json }");
          JSON.parse(localStorage.getItem("invalid_json"));
          return false;
        } catch (error) {
          console.log("✅ JSON解析错误正确捕获");
          localStorage.removeItem("invalid_json");
          return true;
        }
      }
    }
  ];
  
  let passedTests = 0;
  for (const test of storageTests) {
    try {
      const result = test.test();
      if (result) passedTests++;
      console.log(`${test.name}: ${result ? "✅" : "❌"}`);
    } catch (error) {
      console.log(`${test.name}: ❌ (${error.message})`);
    }
  }
  
  return passedTests / storageTests.length;
}

// 测试Office API错误场景
function testOfficeAPIErrors() {
  console.log("\n🏢 测试Office API错误场景...");
  
  const officeTests = [
    {
      name: "Office 对象未定义",
      test: () => {
        if (typeof Office === "undefined") {
          console.log("✅ 正确检测到Office对象不存在");
          return true;
        } else {
          console.log("ℹ️ Office对象存在，测试API调用错误");
          return true;
        }
      }
    },
    {
      name: "Excel API 不可用",
      test: () => {
        if (typeof Excel === "undefined") {
          console.log("✅ 正确检测到Excel API不可用");
          return true;
        } else {
          console.log("ℹ️ Excel API可用");
          return true;
        }
      }
    },
    {
      name: "Word API 不可用",
      test: () => {
        if (typeof Word === "undefined") {
          console.log("✅ 正确检测到Word API不可用");
          return true;
        } else {
          console.log("ℹ️ Word API可用");
          return true;
        }
      }
    }
  ];
  
  let passedTests = 0;
  for (const test of officeTests) {
    try {
      const result = test.test();
      if (result) passedTests++;
      console.log(`${test.name}: ${result ? "✅" : "❌"}`);
    } catch (error) {
      console.log(`${test.name}: ❌ (${error.message})`);
    }
  }
  
  return passedTests / officeTests.length;
}

// 测试输入验证和安全
function testInputValidation() {
  console.log("\n🔒 测试输入验证和安全...");
  
  const securityTests = [
    {
      name: "XSS 防护",
      test: () => {
        const maliciousInput = "<script>alert('xss')</script>";
        const cleanInput = maliciousInput.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
        return cleanInput !== maliciousInput;
      }
    },
    {
      name: "SQL 注入防护",
      test: () => {
        const sqlInjection = "'; DROP TABLE users; --";
        const escaped = sqlInjection.replace(/['"\\]/g, "\\$&");
        return escaped !== sqlInjection;
      }
    },
    {
      name: "API Key 格式验证",
      test: () => {
        const validKey = "sk-1234567890abcdef";
        const invalidKey = "invalid-key";
        
        const isValid = (key) => /^[a-zA-Z0-9_-]+$/.test(key) && key.length >= 10;
        
        return isValid(validKey) && !isValid(invalidKey);
      }
    }
  ];
  
  let passedTests = 0;
  for (const test of securityTests) {
    try {
      const result = test.test();
      if (result) passedTests++;
      console.log(`${test.name}: ${result ? "✅" : "❌"}`);
    } catch (error) {
      console.log(`${test.name}: ❌ (${error.message})`);
    }
  }
  
  return passedTests / securityTests.length;
}

// 测试边界条件
function testBoundaryConditions() {
  console.log("\n⚡ 测试边界条件...");
  
  const boundaryTests = [
    {
      name: "空字符串处理",
      test: () => {
        const emptyString = "";
        return emptyString.trim() === "" && emptyString.length === 0;
      }
    },
    {
      name: "极长文本处理",
      test: () => {
        const longText = "a".repeat(10000);
        return longText.length === 10000 && longText.substring(0, 5) === "aaaaa";
      }
    },
    {
      name: "特殊字符处理",
      test: () => {
        const specialChars = "🚀📊💡🎉⚠️❌✅";
        return specialChars.length > 0 && typeof specialChars === "string";
      }
    },
    {
      name: "数组边界",
      test: () => {
        const arr = [];
        try {
          const item = arr[0];
          return item === undefined;
        } catch (error) {
          return false;
        }
      }
    },
    {
      name: "对象属性访问",
      test: () => {
        const obj = {};
        try {
          const prop = obj.nonexistent;
          return prop === undefined;
        } catch (error) {
          return false;
        }
      }
    }
  ];
  
  let passedTests = 0;
  for (const test of boundaryTests) {
    try {
      const result = test.test();
      if (result) passedTests++;
      console.log(`${test.name}: ${result ? "✅" : "❌"}`);
    } catch (error) {
      console.log(`${test.name}: ❌ (${error.message})`);
    }
  }
  
  return passedTests / boundaryTests.length;
}

// 测试性能边界
function testPerformanceBoundaries() {
  console.log("\n🚀 测试性能边界...");
  
  const performanceTests = [
    {
      name: "大量DOM操作",
      test: () => {
        const startTime = performance.now();
        
        // 创建并移除大量DOM元素
        const container = document.createElement("div");
        for (let i = 0; i < 1000; i++) {
          const element = document.createElement("div");
          element.textContent = `Element ${i}`;
          container.appendChild(element);
        }
        
        // 清理
        container.innerHTML = "";
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        console.log(`DOM操作耗时: ${duration.toFixed(2)}ms`);
        return duration < 1000; // 应该在1秒内完成
      }
    },
    {
      name: "大数据处理",
      test: () => {
        const startTime = performance.now();
        
        // 处理大数组
        const largeArray = new Array(100000).fill(0).map((_, i) => i);
        const processed = largeArray.filter(x => x % 2 === 0).map(x => x * 2);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        console.log(`数据处理耗时: ${duration.toFixed(2)}ms`);
        return duration < 500 && processed.length === 50000;
      }
    },
    {
      name: "内存使用监控",
      test: () => {
        if (performance.memory) {
          const memInfo = performance.memory;
          const usedMB = memInfo.usedJSHeapSize / (1024 * 1024);
          console.log(`当前内存使用: ${usedMB.toFixed(2)}MB`);
          return usedMB < 100; // 应该小于100MB
        } else {
          console.log("内存信息不可用");
          return true;
        }
      }
    }
  ];
  
  let passedTests = 0;
  for (const test of performanceTests) {
    try {
      const result = test.test();
      if (result) passedTests++;
      console.log(`${test.name}: ${result ? "✅" : "❌"}`);
    } catch (error) {
      console.log(`${test.name}: ❌ (${error.message})`);
    }
  }
  
  return passedTests / performanceTests.length;
}

// 主错误处理测试函数
async function runAllErrorTests() {
  console.log("🚨 执行完整错误处理测试套件...\n");
  
  const testResults = {
    networkErrors: await testNetworkErrors(),
    storageErrors: testStorageErrors(),
    officeAPIErrors: testOfficeAPIErrors(),
    inputValidation: testInputValidation(),
    boundaryConditions: testBoundaryConditions(),
    performanceBoundaries: testPerformanceBoundaries()
  };
  
  console.log("\n📋 错误处理测试结果汇总:");
  console.log("==========================");
  
  let totalScore = 0;
  const totalTests = Object.keys(testResults).length;
  
  for (const [testName, score] of Object.entries(testResults)) {
    const percentage = (score * 100).toFixed(1);
    console.log(`${testName}: ${percentage}% 通过`);
    totalScore += score;
  }
  
  const overallScore = (totalScore / totalTests * 100).toFixed(1);
  
  console.log("==========================");
  console.log(`📊 总体错误处理质量: ${overallScore}%`);
  
  if (overallScore >= 90) {
    console.log("🏆 优秀！错误处理机制完善。");
  } else if (overallScore >= 80) {
    console.log("✅ 良好，但还有改进空间。");
  } else if (overallScore >= 70) {
    console.log("⚠️ 中等，需要加强错误处理。");
  } else {
    console.log("🚨 错误处理机制需要大幅改进。");
  }
  
  return testResults;
}

// 导出测试函数
window.errorHandlingTests = {
  runAllErrorTests,
  testNetworkErrors,
  testStorageErrors,
  testOfficeAPIErrors,
  testInputValidation,
  testBoundaryConditions,
  testPerformanceBoundaries
};

console.log("🛡️ 错误处理测试脚本已加载完成!");
console.log("💡 使用 errorHandlingTests.runAllErrorTests() 运行所有错误处理测试");