/** Records only the pixels of the live companion, never the surrounding page. */
export async function recordCompanionPreview(durationMs = 8_000): Promise<Blob> {
  if (!Number.isFinite(durationMs) || durationMs <= 0 || durationMs > 60_000) {
    throw new Error('La grabación debe durar entre un instante y 60 segundos.');
  }

  const source = document.querySelector<HTMLCanvasElement>(
    '.animal-companion[data-renderer="rig"] .animal-companion-canvas',
  ) ?? document.querySelector<HTMLCanvasElement>('.animal-companion-canvas');
  if (!source || !source.width || !source.height) {
    throw new Error('Todavía no hay un compañero listo para grabar.');
  }
  const renderer = source.closest<HTMLElement>('[data-renderer]')?.dataset.renderer;
  if (renderer && renderer !== 'rig') {
    throw new Error('El compañero todavía se está preparando. Inténtalo en unos segundos.');
  }

  const output = document.createElement('canvas');
  output.width = 480;
  output.height = 360;
  const context = output.getContext('2d', { alpha: false });
  if (!context || typeof output.captureStream !== 'function' || typeof MediaRecorder === 'undefined') {
    throw new Error('Este navegador no permite grabar el compañero. Prueba con Chrome o Edge.');
  }
  const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
    .find((candidate) => MediaRecorder.isTypeSupported(candidate));
  if (!mimeType) {
    throw new Error('Este navegador no admite el formato de grabación WebM.');
  }

  return new Promise<Blob>((resolve, reject) => {
    let animationFrame = 0;
    let stopTimer: ReturnType<typeof setTimeout> | undefined;
    let stream: MediaStream | undefined;
    let recorder: MediaRecorder | undefined;
    let settled = false;
    const chunks: Blob[] = [];

    const cleanup = () => {
      cancelAnimationFrame(animationFrame);
      clearTimeout(stopTimer);
      stream?.getTracks().forEach((track) => track.stop());
      if (recorder) {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        recorder.onerror = null;
      }
    };

    const fail = (message: string) => {
      if (settled) return;
      settled = true;
      if (recorder && recorder.state !== 'inactive') {
        // Do not allow a later stop event to resolve a failed recording.
        recorder.onstop = null;
        try { recorder.stop(); } catch { /* Already stopped by the browser. */ }
      }
      cleanup();
      reject(new Error(message));
    };

    const composite = () => {
      context.fillStyle = '#fffaf0';
      context.fillRect(0, 0, output.width, output.height);
      const scale = Math.min(256 / source.width, 224 / source.height);
      const width = source.width * scale;
      const height = source.height * scale;
      context.drawImage(source, (output.width - width) / 2, (output.height - height) / 2, width, height);
    };

    const frame = () => {
      if (settled) return;
      if (!source.isConnected) {
        fail('El compañero dejó de estar disponible durante la grabación.');
        return;
      }
      try {
        composite();
        animationFrame = requestAnimationFrame(frame);
      } catch {
        fail('No se pudo capturar la animación del compañero.');
      }
    };

    try {
      composite();
      stream = output.captureStream(24);
      recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 3_000_000 });
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onerror = () => fail('El navegador no pudo completar la grabación.');
      recorder.onstop = () => {
        if (settled) return;
        settled = true;
        cleanup();
        const video = new Blob(chunks, { type: mimeType });
        if (video.size) resolve(video);
        else reject(new Error('La grabación no produjo ningún fotograma. Inténtalo de nuevo.'));
      };
      recorder.start(250);
      animationFrame = requestAnimationFrame(frame);
      stopTimer = setTimeout(() => {
        try {
          if (recorder?.state !== 'inactive') recorder?.stop();
        } catch {
          fail('No se pudo finalizar la grabación del compañero.');
        }
      }, durationMs);
    } catch {
      fail('No se pudo iniciar la grabación del compañero en este navegador.');
    }
  });
}
