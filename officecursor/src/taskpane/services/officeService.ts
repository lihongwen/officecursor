/* global Excel Word console */

export interface OfficeServiceError extends Error {
  name: "OfficeServiceError";
  code?: string;
}

export class OfficeService {
  // Excel相关功能
  static async insertTextToExcel(
    text: string,
    options?: {
      range?: string;
      worksheet?: string;
    }
  ): Promise<void> {
    try {
      await Excel.run(async (context) => {
        const worksheet = options?.worksheet
          ? context.workbook.worksheets.getItem(options.worksheet)
          : context.workbook.worksheets.getActiveWorksheet();

        const range = worksheet.getRange(options?.range || "A1");
        range.values = [[text]];
        range.format.autofitColumns();
        await context.sync();
      });
    } catch (error) {
      throw this.createOfficeError("Excel插入文本失败", error);
    }
  }

  static async insertTableToExcel(
    data: string[][],
    options?: {
      startCell?: string;
      hasHeaders?: boolean;
    }
  ): Promise<void> {
    try {
      await Excel.run(async (context) => {
        const worksheet = context.workbook.worksheets.getActiveWorksheet();
        const startCell = options?.startCell || "A1";

        // 计算范围
        const endColumn = String.fromCharCode(65 + data[0].length - 1);
        const endRow = data.length;
        const range = worksheet.getRange(`${startCell}:${endColumn}${endRow}`);

        range.values = data;

        // 如果有表头，格式化第一行
        if (options?.hasHeaders && data.length > 0) {
          const headerRange = worksheet.getRange(`${startCell}:${endColumn}1`);
          headerRange.format.font.bold = true;
          headerRange.format.fill.color = "#D9E2F3";
        }

        range.format.autofitColumns();
        await context.sync();
      });
    } catch (error) {
      throw this.createOfficeError("Excel插入表格失败", error);
    }
  }

  static async getSelectedRange(): Promise<{ values: any[][]; address: string } | null> {
    try {
      return await Excel.run(async (context) => {
        const range = context.workbook.getSelectedRange();
        range.load(["values", "address"]);
        await context.sync();

        return {
          values: range.values,
          address: range.address,
        };
      });
    } catch (error) {
      console.warn("获取选中范围失败:", error);
      return null;
    }
  }

  // Word相关功能（如果支持Word）
  static async insertTextToWord(text: string): Promise<void> {
    try {
      if (typeof Word !== "undefined") {
        await Word.run(async (context) => {
          const selection = context.document.getSelection();
          selection.insertText(text, Word.InsertLocation.replace);
          await context.sync();
        });
      } else {
        throw new Error("Word API不可用");
      }
    } catch (error) {
      throw this.createOfficeError("Word插入文本失败", error);
    }
  }

  // 通用功能
  static async getOfficeContext(): Promise<{
    application: string;
    platform: string;
    version: string;
  }> {
    if (typeof Office !== "undefined" && Office.context) {
      return {
        application: Office.context.host.toString(),
        platform: Office.context.platform.toString(),
        version: (Office.context.host as any).version || "unknown",
      };
    }
    throw this.createOfficeError("Office上下文不可用");
  }

  static isOfficeAvailable(): boolean {
    return typeof Office !== "undefined" && Office.context !== undefined;
  }

  static isExcelAvailable(): boolean {
    return this.isOfficeAvailable() && typeof Excel !== "undefined";
  }

  static isWordAvailable(): boolean {
    return this.isOfficeAvailable() && typeof Word !== "undefined";
  }

  // 错误处理
  private static createOfficeError(message: string, originalError?: any): OfficeServiceError {
    const error = new Error(message) as OfficeServiceError;
    error.name = "OfficeServiceError";

    if (originalError) {
      error.code = originalError.code || "UNKNOWN";
      error.message = `${message}: ${originalError.message || originalError}`;
    }

    return error;
  }
}

// 导出方便使用的函数
export const {
  insertTextToExcel,
  insertTableToExcel,
  getSelectedRange,
  insertTextToWord,
  getOfficeContext,
  isOfficeAvailable,
  isExcelAvailable,
  isWordAvailable,
} = OfficeService;
