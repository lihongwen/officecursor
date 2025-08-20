/* global navigator, localStorage, console, Blob */

export interface StorageQuota {
  used: number;
  available: number;
  percentage: number;
}

export interface StorageBackup {
  version: string;
  timestamp: number;
  data: Record<string, any>;
}

export class StorageService {
  private static readonly STORAGE_VERSION = "1.0.0";
  private static readonly MAX_BACKUP_COUNT = 5;
  private static readonly BACKUP_PREFIX = "aiChat_backup_";

  // 检查存储配额
  static async getStorageQuota(): Promise<StorageQuota | null> {
    try {
      if ("storage" in navigator && "estimate" in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const available = estimate.quota || 0;
        const percentage = available > 0 ? (used / available) * 100 : 0;

        return { used, available, percentage };
      }
    } catch (error) {
      console.warn("无法获取存储配额:", error);
    }
    return null;
  }

  // 检查localStorage可用空间
  static checkLocalStorageSpace(): { success: boolean; error?: string } {
    try {
      const testKey = "test_storage_space";
      const testValue = "x".repeat(1024); // 1KB测试数据

      localStorage.setItem(testKey, testValue);
      localStorage.removeItem(testKey);

      return { success: true };
    } catch (error) {
      if (error.name === "QuotaExceededError") {
        return {
          success: false,
          error: "localStorage空间不足，请清理浏览器数据或删除旧对话",
        };
      }
      return {
        success: false,
        error: `存储检查失败: ${error.message}`,
      };
    }
  }

  // 数据压缩（简单实现）
  static compressData(data: string): string {
    // 简单的重复字符串压缩
    return data.replace(/(.)\1{2,}/g, (match, char) => {
      return `${char}*${match.length}`;
    });
  }

  static decompressData(compressedData: string): string {
    // 解压缩
    return compressedData.replace(/(.)\*(\d+)/g, (_, char, count) => {
      return char.repeat(parseInt(count));
    });
  }

  // 创建数据备份
  static createBackup(keys: string[]): boolean {
    try {
      const backupData: Record<string, any> = {};

      keys.forEach((key) => {
        const value = localStorage.getItem(key);
        if (value) {
          backupData[key] = value;
        }
      });

      const backup: StorageBackup = {
        version: this.STORAGE_VERSION,
        timestamp: Date.now(),
        data: backupData,
      };

      const backupKey = `${this.BACKUP_PREFIX}${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(backup));

      // 清理旧备份
      this.cleanOldBackups();

      return true;
    } catch (error) {
      console.error("创建备份失败:", error);
      return false;
    }
  }

  // 恢复数据备份
  static restoreBackup(backupTimestamp: number): boolean {
    try {
      const backupKey = `${this.BACKUP_PREFIX}${backupTimestamp}`;
      const backupStr = localStorage.getItem(backupKey);

      if (!backupStr) {
        throw new Error("备份不存在");
      }

      const backup: StorageBackup = JSON.parse(backupStr);

      // 恢复数据
      Object.entries(backup.data).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });

      return true;
    } catch (error) {
      console.error("恢复备份失败:", error);
      return false;
    }
  }

  // 获取所有备份
  static getBackups(): StorageBackup[] {
    const backups: StorageBackup[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.BACKUP_PREFIX)) {
        try {
          const backupStr = localStorage.getItem(key);
          if (backupStr) {
            const backup = JSON.parse(backupStr);
            backups.push(backup);
          }
        } catch (error) {
          console.warn(`解析备份失败: ${key}`, error);
        }
      }
    }

    return backups.sort((a, b) => b.timestamp - a.timestamp);
  }

  // 清理旧备份
  static cleanOldBackups(): void {
    const backups = this.getBackups();

    if (backups.length > this.MAX_BACKUP_COUNT) {
      const toDelete = backups.slice(this.MAX_BACKUP_COUNT);

      toDelete.forEach((backup) => {
        const backupKey = `${this.BACKUP_PREFIX}${backup.timestamp}`;
        localStorage.removeItem(backupKey);
      });
    }
  }

  // 清理数据（保留设置）
  static clearChatData(keepSettings: boolean = true): void {
    const keysToRemove = [
      "aiChat_messages",
      "aiChat_conversations",
      "aiChat_currentConversation",
      "aiChat_uiState",
    ];

    if (!keepSettings) {
      keysToRemove.push("aiChat_settings");
    }

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });
  }

  // 导出数据
  static exportData(): string {
    const data: Record<string, any> = {};
    const chatKeys = [
      "aiChat_settings",
      "aiChat_messages",
      "aiChat_conversations",
      "aiChat_currentConversation",
      "aiChat_uiState",
    ];

    chatKeys.forEach((key) => {
      const value = localStorage.getItem(key);
      if (value) {
        data[key] = value;
      }
    });

    const exportData = {
      version: this.STORAGE_VERSION,
      exportTime: new Date().toISOString(),
      data,
    };

    return JSON.stringify(exportData, null, 2);
  }

  // 导入数据
  static importData(jsonData: string): { success: boolean; error?: string } {
    try {
      const importData = JSON.parse(jsonData);

      if (!importData.data) {
        return { success: false, error: "无效的数据格式" };
      }

      // 创建备份
      const chatKeys = Object.keys(importData.data);
      this.createBackup(chatKeys);

      // 导入数据
      Object.entries(importData.data).forEach(([key, value]) => {
        localStorage.setItem(key, value as string);
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `导入失败: ${error.message}`,
      };
    }
  }

  // 获取存储使用情况
  static getStorageUsage(): {
    totalSize: number;
    itemCount: number;
    details: Record<string, number>;
  } {
    let totalSize = 0;
    let itemCount = 0;
    const details: Record<string, number> = {};

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("aiChat_")) {
        const value = localStorage.getItem(key) || "";
        const size = new Blob([value]).size;

        details[key] = size;
        totalSize += size;
        itemCount++;
      }
    }

    return { totalSize, itemCount, details };
  }
}
