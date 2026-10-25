// Isolated review instrumentation: timings and counts only; never reads input values.
import { useCallback, useEffect, useRef, useState } from 'react';

export interface PresenceMetricResult {
  variant: string;
  requestedDurationMs: 20000;
  measuredDurationMs: number;
  frames: number;
  frameIntervalP95Ms: number | null;
  inputEvents: number;
  inputToNextFrameP95Ms: number | null;
  longTasksSupported: boolean;
  longTasks: number;
  longestTaskMs: number | null;
  tasksOver100Ms: number;
}

type Measurement =
  | { status: 'idle' }
  | { status: 'running' }
  | { status: 'cancelled'; reason: string }
  | { status: 'complete'; result: PresenceMetricResult };

function percentile95(samples: number[]): number | null {
  if (!samples.length) return null;
  const sorted = [...samples].sort((a, b) => a - b);
  return Math.round(sorted[Math.ceil(sorted.length * 0.95) - 1] * 100) / 100;
}

/** Same 20-second window for base/revision. Next RAF is a scheduling proxy, not presentation latency. */
export function usePresenceMetrics(variant: string) {
  const [measurement, setMeasurement] = useState<Measurement>({ status: 'idle' });
  const stopRef = useRef<((reason?: string) => void) | null>(null);

  const cancel = useCallback(() => stopRef.current?.('Medición cancelada.'), []);
  const start = useCallback(() => {
    stopRef.current?.('Se inició otra medición.');
    if (document.hidden) {
      setMeasurement({ status: 'cancelled', reason: 'La pestaña debe permanecer visible.' });
      return;
    }
    const startedAt = performance.now();
    const frameIntervals: number[] = [];
    const inputLatencies: number[] = [];
    const pendingInputs: number[] = [];
    const longTasks: number[] = [];
    let lastFrame: number | null = null;
    let frameCount = 0;
    let inputCount = 0;
    let frame = 0;
    let timeout = 0;
    let stopped = false;
    let observer: PerformanceObserver | null = null;
    let longTasksSupported = false;

    const collectTasks = (records: PerformanceEntry[]) => {
      for (const entry of records) {
        if (entry.startTime >= startedAt) longTasks.push(entry.duration);
      }
    };
    if (typeof PerformanceObserver !== 'undefined' && PerformanceObserver.supportedEntryTypes?.includes('longtask')) {
      try {
        observer = new PerformanceObserver(list => collectTasks(list.getEntries()));
        observer.observe({ type: 'longtask', buffered: false });
        longTasksSupported = true;
      } catch {
        observer?.disconnect();
        observer = null;
      }
    }

    const onInput = (event: Event) => {
      if (!(event.target instanceof Element) || event.target.closest('.ux-lab')) return;
      const now = performance.now();
      // Some engines use epoch timestamps. Fall back without inspecting the entered data.
      pendingInputs.push(event.timeStamp > 0 && event.timeStamp <= now ? event.timeStamp : now);
      inputCount += 1;
    };
    const tick = (now: number) => {
      if (stopped) return;
      frameCount += 1;
      if (lastFrame !== null) frameIntervals.push(now - lastFrame);
      lastFrame = now;
      for (const inputAt of pendingInputs.splice(0)) inputLatencies.push(Math.max(0, now - inputAt));
      frame = requestAnimationFrame(tick);
    };
    const onVisibility = () => {
      if (document.hidden) finish('La pestaña se ocultó; repite el tramo completo.');
    };
    const finish = (reason?: string) => {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      document.removeEventListener('input', onInput, true);
      document.removeEventListener('visibilitychange', onVisibility);
      if (observer) {
        collectTasks(observer.takeRecords());
        observer.disconnect();
      }
      stopRef.current = null;
      if (reason) {
        setMeasurement({ status: 'cancelled', reason });
        return;
      }
      setMeasurement({ status: 'complete', result: {
        variant,
        requestedDurationMs: 20000,
        measuredDurationMs: Math.round(performance.now() - startedAt),
        frames: frameCount,
        frameIntervalP95Ms: percentile95(frameIntervals),
        inputEvents: inputCount,
        inputToNextFrameP95Ms: percentile95(inputLatencies),
        longTasksSupported,
        longTasks: longTasks.length,
        longestTaskMs: longTasksSupported ? Math.round(Math.max(0, ...longTasks) * 100) / 100 : null,
        tasksOver100Ms: longTasks.filter(duration => duration >= 100).length,
      } });
    };
    stopRef.current = finish;
    document.addEventListener('input', onInput, true);
    document.addEventListener('visibilitychange', onVisibility);
    frame = requestAnimationFrame(tick);
    timeout = window.setTimeout(() => finish(), 20000);
    setMeasurement({ status: 'running' });
  }, [variant]);

  useEffect(() => () => { stopRef.current?.('Cambió la presentación o se cerró la revisión.'); }, [variant]);

  return { measurement, start, cancel };
}
