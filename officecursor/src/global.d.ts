// 全局类型声明文件
// 声明Office API全局变量
declare var Office: typeof import("office-js").Office;
declare var Excel: typeof import("office-js").Excel;
declare var Word: typeof import("office-js").Word;

// 扩展Performance接口以支持内存信息
interface Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

// 扩展Window接口以支持垃圾回收
interface Window {
  gc?: () => void;
}

// 扩展NodeJS类型，用于定时器类型
declare namespace NodeJS {
  interface Timeout {}
}

// 声明Node.js环境变量
declare var module: {
  hot?: {
    accept(path?: string, callback?: () => void): void;
  };
};

declare var require: {
  (id: string): any;
};
