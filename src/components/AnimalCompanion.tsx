import { useEffect, useRef } from 'react';
import type { AvatarCharacterId } from '../types';
import { useCompanionPreference } from '../hooks/useCompanionPreference';
import { createCompanionPresenceMotion, createPenguinMotion, type PenguinMotionPose } from '../utils/penguinMotion';
import { createAnimalIllustrationRenderer, loadAnimalIllustration, getAnimalPoster } from '../lib/animalIllustration';
import type { CompanionPresence } from '../utils/companionPresence';

/** Articulate the selected profile illustration, inside a stable profile target. */
export function AnimalCompanion({ characterId, quiet = false, attention = 0, presence }: { characterId: AvatarCharacterId; quiet?: boolean; attention?: number; presence?: CompanionPresence }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<HTMLSpanElement>(null);
  const options = useCompanionPreference();
  const config = useRef({ enabled: options.enabled, reduced: options.reducedMotion, quiet, presence });
  const contextual = Boolean(presence);
  const presenceCue = presence?.cue, presenceConfirmation = presence?.confirmation;
  const controls = useRef<{ synchronize(): void; greet(): void } | null>(null);
  useEffect(() => {
    config.current = { enabled: options.enabled, reduced: options.reducedMotion, quiet, presence: presenceCue === undefined ? undefined : { cue: presenceCue, confirmation: presenceConfirmation ?? 0 } };
    controls.current?.synchronize();
  }, [options.enabled, options.reducedMotion, quiet, presenceCue, presenceConfirmation]);

  useEffect(() => {
    const canvas = canvasRef.current, scene = sceneRef.current;
    if (!canvas || !scene) return;
    let renderer: ReturnType<typeof createAnimalIllustrationRenderer> = null;
    let playback: ReturnType<typeof createPenguinMotion> | null = null;
    let presencePlayback: ReturnType<typeof createCompanionPresenceMotion> | null = null;
    const neutral: PenguinMotionPose = { x: 0, y: 0, lean: 0, headTurn: 0, headBob: 0, flipper: 0, step: 0, blink: 0, breath: 0 };
    let pose = neutral;
    let frame = 0, lastDraw = -Infinity, quietUntil = 0;
    let running = false, disposed = false, loading = false;
    let retryTimer = 0, attempts = 0;

    const blocked = () => document.visibilityState === 'hidden' || Boolean(scene.closest('[inert]'));
    const isQuiet = () => config.current.quiet || performance.now() < quietUntil || document.documentElement.classList.contains('keyboard-open') || (
      document.activeElement instanceof HTMLElement && document.activeElement.matches('textarea, input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]), [contenteditable=true], [role=textbox]')
    );
    const environment = () => ({
      presence: config.current.presence || { cue: 'available' as const, confirmation: 0 },
      quiet: isQuiet(),
      suppressed: !config.current.enabled || config.current.reduced || blocked(),
    });
    const draw = () => {
      if (!renderer || disposed) return;
      renderer.render(pose);
      if (import.meta.env.DEV) scene.dataset.drawCount = String(Number(scene.dataset.drawCount || 0) + 1);
    };
    const tick = (now: number) => {
      if (!running || disposed || !playback) return;
      if (now - lastDraw >= 1000 / 24) {
        const soft = isQuiet();
        pose = presencePlayback ? presencePlayback.sample(now, environment()) : playback.sample(now, soft);
        draw();
        scene.dataset.motion = soft || (contextual && ['focus', 'saving', 'error'].includes(config.current.presence?.cue || '')) ? 'quiet' : 'playing';
        if (contextual) scene.dataset.presence = config.current.presence?.cue || 'available';
        lastDraw = now;
      }
      frame = requestAnimationFrame(tick);
    };
    const synchronize = () => {
      if (disposed || !playback) return;
      const { enabled, reduced } = config.current;
      const shouldRun = enabled && !reduced && !blocked();
      const now = performance.now();
      // Unrelated dialog mutations or profile renders must not restart playback.
      if (shouldRun && running) { presencePlayback?.synchronize(now, environment()); return; }
      if (shouldRun) {
        running = true;
        playback.resume(now);
        presencePlayback?.synchronize(now, environment());
        lastDraw = -Infinity;
        frame = requestAnimationFrame(tick);
      } else {
        // Observe confirmations while hidden or paused so they cannot be replayed.
        presencePlayback?.synchronize(now, environment());
        if (!running) {
          if (reduced) { pose = neutral; draw(); }
          scene.dataset.motion = blocked() ? 'suspended' : reduced ? 'reduced' : 'paused';
          return;
        }
        running = false;
        cancelAnimationFrame(frame);
        playback.suspend(now);
        if (reduced) { pose = neutral; draw(); }
        scene.dataset.motion = blocked() ? 'suspended' : reduced ? 'reduced' : 'paused';
      }
    };
    const resize = () => {
      if (!renderer) return;
      const rect = scene.getBoundingClientRect();
      renderer.resize(rect.width, rect.height, window.devicePixelRatio || 1);
      draw();
    };
    const initialize = async () => {
      if (loading || renderer || disposed) return;
      clearTimeout(retryTimer);
      attempts += 1;
      loading = true;
      scene.dataset.motion = 'loading';
      try {
        const illustration = await loadAnimalIllustration(characterId);
        if (disposed) return;
        renderer = createAnimalIllustrationRenderer(canvas, illustration, characterId);
        if (!renderer) { scene.dataset.motion = 'unavailable'; return; }
        const seed = Math.floor(Math.random() * 0xffffffff);
        if (contextual && config.current.presence) {
          presencePlayback = createCompanionPresenceMotion(seed, characterId, config.current.presence);
          // Keep the established frame/suspension interface identical in both modes.
          playback = { ...presencePlayback, sample: now => presencePlayback!.sample(now, environment()) };
        } else playback = createPenguinMotion(seed);
        playback.suspend(performance.now());
        resize();
        scene.dataset.renderer = 'rig';
        scene.dataset.motion = config.current.reduced ? 'reduced' : 'paused';
        synchronize();
      } catch {
        if (!disposed) {
          scene.dataset.motion = 'unavailable';
          if (attempts < 3) retryTimer = window.setTimeout(() => void initialize(), attempts === 1 ? 800 : 2400);
        }
      } finally { loading = false; }
    };
    const onInput = (event: Event) => {
      if (event.target instanceof HTMLElement && event.target.matches('input, textarea, [contenteditable=true], [role=textbox]')) quietUntil = performance.now() + 1800;
    };
    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(scene);
    const inertObserver = new MutationObserver(synchronize);
    inertObserver.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['inert'] });
    const onOnline = () => { attempts = 0; void initialize(); };
    controls.current = { synchronize, greet: () => {
      if (!renderer) { attempts = 0; void initialize(); }
      else if (running) playback?.greet();
    } };
    document.addEventListener('visibilitychange', synchronize);
    document.addEventListener('input', onInput, true);
    document.addEventListener('compositionstart', onInput, true);
    window.addEventListener('online', onOnline);
    void initialize();
    return () => {
      disposed = true;
      running = false;
      cancelAnimationFrame(frame);
      clearTimeout(retryTimer);
      sizeObserver.disconnect(); inertObserver.disconnect();
      document.removeEventListener('visibilitychange', synchronize);
      document.removeEventListener('input', onInput, true);
      document.removeEventListener('compositionstart', onInput, true);
      window.removeEventListener('online', onOnline);
      renderer?.dispose();
      controls.current = null;
      scene.dataset.renderer = 'poster';
    };
  }, [characterId, contextual]);

  useEffect(() => { if (attention) controls.current?.greet(); }, [attention]);
  return <span ref={sceneRef} className="animal-companion" aria-hidden="true" data-character={characterId} data-renderer="poster" data-presence={presence?.cue}>
    <canvas ref={canvasRef} className="animal-companion-canvas" width={256} height={224} />
    <img className="animal-companion-poster" src={getAnimalPoster(characterId)} alt="" width={400} height={400} draggable={false} />
  </span>;
}
