/* eslint-env browser */
/* global console, URL, location */

export interface SecurityConfig {
  enableInputSanitization: boolean;
  enableOutputFiltering: boolean;
  enableApiKeyValidation: boolean;
  maxMessageLength: number;
  maxConversationCount: number;
}

export class SecurityService {
  private static readonly DEFAULT_CONFIG: SecurityConfig = {
    enableInputSanitization: true,
    enableOutputFiltering: true,
    enableApiKeyValidation: true,
    maxMessageLength: 10000,
    maxConversationCount: 100,
  };

  private static config: SecurityConfig = { ...this.DEFAULT_CONFIG };

  static updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // API Key验证
  static validateApiKey(apiKey: string): { valid: boolean; error?: string } {
    if (!this.config.enableApiKeyValidation) {
      return { valid: true };
    }

    // 基本格式检查
    if (!apiKey || typeof apiKey !== "string") {
      return { valid: false, error: "API Key不能为空" };
    }

    // 长度检查
    if (apiKey.length < 10) {
      return { valid: false, error: "API Key长度太短" };
    }

    if (apiKey.length > 500) {
      return { valid: false, error: "API Key长度太长" };
    }

    // 字符检查 - 应该只包含字母、数字、破折号、下划线
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validPattern.test(apiKey)) {
      return { valid: false, error: "API Key包含无效字符" };
    }

    return { valid: true };
  }

  // 输入内容清理
  static sanitizeInput(input: string): string {
    if (!this.config.enableInputSanitization) {
      return input;
    }

    // 移除潜在的脚本标签和HTML
    let sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
      .replace(/<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi, "");

    // 移除事件处理器
    sanitized = sanitized.replace(/\bon\w+\s*=\s*['""][^'"]*['"']/gi, "");

    // 限制长度
    if (sanitized.length > this.config.maxMessageLength) {
      sanitized = sanitized.substring(0, this.config.maxMessageLength) + "...";
    }

    return sanitized.trim();
  }

  // 输出内容过滤
  static filterOutput(output: string): string {
    if (!this.config.enableOutputFiltering) {
      return output;
    }

    // 移除潜在的恶意链接
    let filtered = output.replace(/javascript:/gi, "blocked:");
    filtered = filtered.replace(/data:/gi, "blocked:");

    // 检查并标记可疑的URL
    const suspiciousPatterns = [/bit\.ly/gi, /tinyurl/gi, /shorturl/gi];

    suspiciousPatterns.forEach((pattern) => {
      if (pattern.test(filtered)) {
        console.warn("检测到可疑链接，请谨慎访问");
      }
    });

    return filtered;
  }

  // URL验证
  static validateUrl(url: string): { valid: boolean; error?: string } {
    try {
      const urlObj = new URL(url);

      // 检查协议
      if (!["http:", "https:"].includes(urlObj.protocol)) {
        return { valid: false, error: "只允许HTTP和HTTPS协议" };
      }

      // 检查是否为本地地址
      const hostname = urlObj.hostname.toLowerCase();
      const localPatterns = [
        /^localhost$/,
        /^127\./,
        /^192\.168\./,
        /^10\./,
        /^172\.(1[6-9]|2\d|3[01])\./,
        /^::1$/,
        /^fe80:/,
      ];

      const isLocal = localPatterns.some((pattern) => pattern.test(hostname));
      if (isLocal && !hostname.includes("localhost")) {
        console.warn("检测到内网地址，请谨慎访问");
      }

      return { valid: true };
    } catch {
      return { valid: false, error: "无效的URL格式" };
    }
  }

  // 检查对话数量限制
  static checkConversationLimit(currentCount: number): { allowed: boolean; error?: string } {
    if (currentCount >= this.config.maxConversationCount) {
      return {
        allowed: false,
        error: `对话数量已达到上限 (${this.config.maxConversationCount})，请删除一些旧对话`,
      };
    }
    return { allowed: true };
  }

  // 检测潜在的提示注入
  static detectPromptInjection(input: string): { detected: boolean; warning?: string } {
    const injectionPatterns = [
      /ignore\s+(previous|above|all)\s+instructions?/i,
      /forget\s+(everything|all)\s+(you\s+)?(know|learned)/i,
      /act\s+as\s+if\s+you\s+are\s+(not\s+)?an?\s+ai/i,
      /pretend\s+(you\s+are|to\s+be)\s+(not\s+)?an?\s+ai/i,
      /you\s+are\s+(now\s+)?(not\s+)?an?\s+ai/i,
      /system\s*:\s*/i,
      /assistant\s*:\s*/i,
      /human\s*:\s*/i,
      /\[\s*system\s*\]/i,
      /\[\s*assistant\s*\]/i,
    ];

    for (const pattern of injectionPatterns) {
      if (pattern.test(input)) {
        return {
          detected: true,
          warning: "检测到可能的提示注入尝试，内容可能被修改或忽略",
        };
      }
    }

    return { detected: false };
  }

  // 内容安全策略检查
  static checkContentSecurityPolicy(): boolean {
    // 检查是否在安全的环境中运行
    if (typeof window === "undefined") {
      return false;
    }

    // 检查是否启用了HTTPS
    if (location.protocol !== "https:" && location.hostname !== "localhost") {
      console.warn("建议使用HTTPS协议以确保安全性");
      return false;
    }

    return true;
  }

  // 清理敏感信息
  static cleanSensitiveData(text: string): string {
    // 移除可能的API密钥
    let cleaned = text.replace(/sk-[a-zA-Z0-9]{20,}/g, "***");

    // 移除可能的邮箱地址
    cleaned = cleaned.replace(
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      "***@***.***"
    );

    // 移除可能的电话号码
    cleaned = cleaned.replace(/\b\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{4,6}\b/g, "***-***-****");

    // 移除可能的身份证号
    cleaned = cleaned.replace(/\b\d{15}|\d{18}\b/g, "***************");

    return cleaned;
  }

  // 导出日志（用于调试，移除敏感信息）
  static exportSecureLogs(logs: any[]): string {
    const secureLogs = logs.map((log) => ({
      ...log,
      content: this.cleanSensitiveData(JSON.stringify(log.content)),
      timestamp: log.timestamp,
      level: log.level || "info",
    }));

    return JSON.stringify(secureLogs, null, 2);
  }
}
