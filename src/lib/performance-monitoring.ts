// Performance monitoring utilities for React components

interface PerformanceEntry {
  name: string
  startTime: number
  duration?: number
  componentName?: string
  props?: Record<string, any>
}

class PerformanceMonitor {
  private entries: PerformanceEntry[] = []
  private isEnabled: boolean = process.env.NODE_ENV === 'development'

  startTiming(name: string, componentName?: string, props?: Record<string, any>): PerformanceEntry {
    if (!this.isEnabled) return { name, startTime: 0 }

    const entry: PerformanceEntry = {
      name,
      startTime: performance.now(),
      componentName,
      props
    }

    this.entries.push(entry)
    return entry
  }

  endTiming(entry: PerformanceEntry): void {
    if (!this.isEnabled) return

    const endTime = performance.now()
    entry.duration = endTime - entry.startTime

    // Log slow operations (>100ms)
    if (entry.duration > 100) {
      console.warn(`Slow operation detected: ${entry.name} took ${entry.duration.toFixed(2)}ms`, {
        componentName: entry.componentName,
        props: entry.props
      })
    }
  }

  measureComponent<T extends Record<string, any>>(
    componentName: string,
    Component: React.ComponentType<T>
  ): React.ComponentType<T> {
    if (!this.isEnabled) return Component

    return function MeasuredComponent(props: T) {
      const renderEntry = React.useMemo(() => 
        performanceMonitor.startTiming(`${componentName}_render`, componentName, props),
        [props]
      )

      React.useEffect(() => {
        performanceMonitor.endTiming(renderEntry)
      })

      return React.createElement(Component, props)
    }
  }

  logMemoryUsage(): void {
    if (!this.isEnabled || !(performance as any).memory) return

    const memory = (performance as any).memory
    console.log('Memory usage:', {
      usedJSHeapSize: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
      totalJSHeapSize: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
      jsHeapSizeLimit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`
    })
  }

  getEntries(): PerformanceEntry[] {
    return [...this.entries]
  }

  clearEntries(): void {
    this.entries = []
  }

  getSlowestOperations(limit: number = 10): PerformanceEntry[] {
    return this.entries
      .filter(entry => entry.duration !== undefined)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, limit)
  }
}

export const performanceMonitor = new PerformanceMonitor()

// React hooks for performance monitoring
export function usePerformanceTimer(name: string, dependencies: React.DependencyList = []) {
  const entryRef = React.useRef<PerformanceEntry | null>(null)

  React.useEffect(() => {
    entryRef.current = performanceMonitor.startTiming(name)
    
    return () => {
      if (entryRef.current) {
        performanceMonitor.endTiming(entryRef.current)
      }
    }
  }, dependencies)
}

export function useRenderTracking(componentName: string, props?: Record<string, any>) {
  const renderCount = React.useRef(0)
  const lastPropsRef = React.useRef(props)

  React.useEffect(() => {
    renderCount.current += 1
    
    if (process.env.NODE_ENV === 'development') {
      // Check if props changed
      const propsChanged = lastPropsRef.current !== props
      
      if (renderCount.current > 1 && !propsChanged) {
        console.warn(`Unnecessary re-render detected in ${componentName}`, {
          renderCount: renderCount.current,
          props,
          lastProps: lastPropsRef.current
        })
      }
      
      lastPropsRef.current = props
    }
  })

  return renderCount.current
}

// HOC for performance monitoring
export function withPerformanceMonitoring<T extends Record<string, any>>(
  componentName: string
) {
  return function (Component: React.ComponentType<T>): React.ComponentType<T> {
    const MonitoredComponent = React.memo((props: T) => {
      useRenderTracking(componentName, props)
      usePerformanceTimer(`${componentName}_lifecycle`)
      
      return React.createElement(Component, props)
    })

    MonitoredComponent.displayName = `WithPerformanceMonitoring(${componentName})`
    return MonitoredComponent
  }
}

// Bundle size utilities
export const bundleAnalyzer = {
  logChunkSizes(): void {
    if (typeof window === 'undefined') return

    // Get all script tags
    const scripts = Array.from(document.querySelectorAll('script[src]'))
    const chunks = scripts
      .map(script => ({
        src: script.getAttribute('src'),
        size: 'unknown' // Would need actual size data from build
      }))
      .filter(chunk => chunk.src?.includes('_next/static'))

    console.log('Loaded chunks:', chunks)
  },

  measureInitialLoad(): void {
    if (typeof window === 'undefined') return

    window.addEventListener('load', () => {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart
      const domContentLoadedTime = performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart

      console.log('Page load performance:', {
        totalLoadTime: `${loadTime}ms`,
        domContentLoadedTime: `${domContentLoadedTime}ms`,
        firstPaintTime: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime || 'unknown',
        firstContentfulPaintTime: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime || 'unknown'
      })
    })
  }
}

// Initialize performance monitoring
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  bundleAnalyzer.measureInitialLoad()
  
  // Log memory usage every 30 seconds
  setInterval(() => {
    performanceMonitor.logMemoryUsage()
  }, 30000)
}