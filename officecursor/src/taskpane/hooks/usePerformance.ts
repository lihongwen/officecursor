import * as React from "react";

export interface PerformanceMetrics {
  renderTime: number;
  messageProcessingTime: number;
  storageOperationTime: number;
  memoryUsage?: number;
}

export interface PerformanceConfig {
  enableVirtualization: boolean;
  maxVisibleMessages: number;
  enablePerformanceMonitoring: boolean;
  enableMemoryOptimization: boolean;
}

export const usePerformance = (config: PerformanceConfig) => {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics>({
    renderTime: 0,
    messageProcessingTime: 0,
    storageOperationTime: 0,
  });

  const performanceRef = React.useRef<{
    renderStart?: number;
    processingStart?: number;
    storageStart?: number;
  }>({});

  // 测量渲染性能
  const startRenderMeasure = React.useCallback(() => {
    if (config.enablePerformanceMonitoring) {
      performanceRef.current.renderStart = performance.now();
    }
  }, [config.enablePerformanceMonitoring]);

  const endRenderMeasure = React.useCallback(() => {
    if (config.enablePerformanceMonitoring && performanceRef.current.renderStart) {
      const renderTime = performance.now() - performanceRef.current.renderStart;
      setMetrics((prev) => ({ ...prev, renderTime }));
    }
  }, [config.enablePerformanceMonitoring]);

  // 测量消息处理性能
  const measureMessageProcessing = React.useCallback(
    async <T>(operation: () => Promise<T>): Promise<T> => {
      const start = performance.now();
      try {
        const result = await operation();
        if (config.enablePerformanceMonitoring) {
          const processingTime = performance.now() - start;
          setMetrics((prev) => ({ ...prev, messageProcessingTime: processingTime }));
        }
        return result;
      } catch (error) {
        if (config.enablePerformanceMonitoring) {
          const processingTime = performance.now() - start;
          setMetrics((prev) => ({ ...prev, messageProcessingTime: processingTime }));
        }
        throw error;
      }
    },
    [config.enablePerformanceMonitoring]
  );

  // 测量存储操作性能
  const measureStorageOperation = React.useCallback(
    async <T>(operation: () => Promise<T>): Promise<T> => {
      const start = performance.now();
      try {
        const result = await operation();
        if (config.enablePerformanceMonitoring) {
          const storageTime = performance.now() - start;
          setMetrics((prev) => ({ ...prev, storageOperationTime: storageTime }));
        }
        return result;
      } catch (error) {
        if (config.enablePerformanceMonitoring) {
          const storageTime = performance.now() - start;
          setMetrics((prev) => ({ ...prev, storageOperationTime: storageTime }));
        }
        throw error;
      }
    },
    [config.enablePerformanceMonitoring]
  );

  // 内存使用监控
  const monitorMemoryUsage = React.useCallback(() => {
    if (config.enablePerformanceMonitoring && "memory" in performance) {
      const memInfo = (performance as any).memory;
      if (memInfo) {
        const memoryUsage = memInfo.usedJSHeapSize / (1024 * 1024); // MB
        setMetrics((prev) => ({ ...prev, memoryUsage }));
      }
    }
  }, [config.enablePerformanceMonitoring]);

  // 定期监控内存使用
  React.useEffect(() => {
    if (config.enablePerformanceMonitoring) {
      const interval = setInterval(monitorMemoryUsage, 5000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [config.enablePerformanceMonitoring, monitorMemoryUsage]);

  // 内存优化：清理大对象
  const optimizeMemory = React.useCallback(() => {
    if (config.enableMemoryOptimization) {
      // 触发垃圾回收（如果支持）
      if ("gc" in window) {
        (window as any).gc();
      }

      // 清理可能的内存泄漏
      setTimeout(() => {
        monitorMemoryUsage();
      }, 1000);
    }
  }, [config.enableMemoryOptimization, monitorMemoryUsage]);

  return {
    metrics,
    startRenderMeasure,
    endRenderMeasure,
    measureMessageProcessing,
    measureStorageOperation,
    optimizeMemory,
    monitorMemoryUsage,
  };
};

// 虚拟化消息列表Hook
export const useVirtualizedMessages = <T>(
  messages: T[],
  config: { maxVisible: number; enabled: boolean }
) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [visibleRange, setVisibleRange] = React.useState({ start: 0, end: config.maxVisible });

  const visibleMessages = React.useMemo(() => {
    if (!config.enabled || messages.length <= config.maxVisible) {
      return messages;
    }

    // 总是显示最后的消息
    const start = Math.max(0, messages.length - config.maxVisible);
    return messages.slice(start);
  }, [messages, config.enabled, config.maxVisible]);

  const totalCount = messages.length;
  const isVirtualized = config.enabled && totalCount > config.maxVisible;
  const hiddenCount = Math.max(0, totalCount - config.maxVisible);

  return {
    visibleMessages,
    totalCount,
    isVirtualized,
    hiddenCount,
    visibleRange,
  };
};

// 防抖Hook优化
export const useOptimizedDebounce = <T>(value: T, delay: number, maxWait?: number) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);
  const timeoutRef = React.useRef<number>();
  const maxTimeoutRef = React.useRef<number>();
  const lastCallTimeRef = React.useRef<number>(Date.now());

  React.useEffect(() => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTimeRef.current;

    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 如果设置了最大等待时间，并且已经等待足够长的时间，立即更新
    if (maxWait && timeSinceLastCall >= maxWait) {
      setDebouncedValue(value);
      lastCallTimeRef.current = now;
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
      }
      return undefined;
    }

    // 设置防抖定时器
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
      lastCallTimeRef.current = Date.now();
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
      }
    }, delay);

    // 设置最大等待定时器
    if (maxWait && !maxTimeoutRef.current) {
      const remainingMaxWait = Math.max(0, maxWait - timeSinceLastCall);
      maxTimeoutRef.current = setTimeout(() => {
        setDebouncedValue(value);
        lastCallTimeRef.current = Date.now();
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        maxTimeoutRef.current = undefined;
      }, remainingMaxWait);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
        maxTimeoutRef.current = undefined;
      }
    };
  }, [value, delay, maxWait]);

  return debouncedValue;
};
