#!/usr/bin/env node
/**
 * Horizon Asset Generation Pipeline
 * Generates Android mipmap launcher icons, adaptive foregrounds, round icons,
 * splash screens, and master brand assets using the Fire Goat vector.
 */

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

// Locate sharp from local node_modules, global nvm, or npm cache
function resolveSharp() {
  const candidates = [
    'sharp',
    process.env.SHARP_PATH,
    '/home/velez/.nvm/versions/node/v24.13.0/lib/node_modules/openclaw/node_modules/sharp',
    '/home/velez/.nvm/versions/node/v24.13.0/lib/node_modules/wrangler/node_modules/sharp',
    '/home/velez/.npm/_npx/4e5c24d7baa062b3/node_modules/sharp'
  ].filter(Boolean);

  for (const c of candidates) {
    try {
      const s = require(c);
      return s;
    } catch {
      // try next
    }
  }

  // Fallback scan in npm cache
  const npxCacheDir = '/home/velez/.npm/_npx';
  if (fs.existsSync(npxCacheDir)) {
    try {
      const entries = fs.readdirSync(npxCacheDir);
      for (const entry of entries) {
        const candidate = path.join(npxCacheDir, entry, 'node_modules', 'sharp');
        if (fs.existsSync(candidate)) {
          try {
            return require(candidate);
          } catch {}
        }
      }
    } catch {}
  }

  throw new Error('Could not resolve sharp library. Please ensure sharp is accessible.');
}

const sharp = resolveSharp();
console.log(`[Asset Gen] Using Sharp v${sharp.versions.sharp} (libvips ${sharp.versions.vips})`);

// Design tokens
const CANVAS_BG = '#fffaf0'; // Clay canvas token

// Authoritative Fire Goat SVG definitions and body
const MASCOT_DEFS = `
  <defs>
    <filter id="hornShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#0a1a1a" flood-opacity="0.18" />
    </filter>
    <filter id="headShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#0a1a1a" flood-opacity="0.22" />
    </filter>
    <filter id="beardShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#ff6b5a" flood-opacity="0.4" />
    </filter>

    <linearGradient id="fireFlameGrad" x1="50" y1="6" x2="50" y2="40" gradientUnits="userSpaceOnUse">
      <stop stop-color="#f6d888" />
      <stop offset="0.35" stop-color="#e8b94a" />
      <stop offset="0.7" stop-color="#ffb084" />
      <stop offset="1" stop-color="#ff6b5a" />
    </linearGradient>

    <radialGradient id="goatFaceGrad" cx="50" cy="52" r="28" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ff9688" />
      <stop offset="0.5" stop-color="#ff6b5a" />
      <stop offset="0.85" stop-color="#d94b38" />
      <stop offset="1" stop-color="#9e3223" />
    </radialGradient>

    <linearGradient id="hornLeftGrad" x1="16" y1="28" x2="42" y2="56" gradientUnits="userSpaceOnUse">
      <stop stop-color="#f6d888" />
      <stop offset="0.5" stop-color="#e8b94a" />
      <stop offset="0.85" stop-color="#c59124" />
      <stop offset="1" stop-color="#875e0c" />
    </linearGradient>

    <linearGradient id="hornRightGrad" x1="84" y1="28" x2="58" y2="56" gradientUnits="userSpaceOnUse">
      <stop stop-color="#f6d888" />
      <stop offset="0.5" stop-color="#e8b94a" />
      <stop offset="0.85" stop-color="#c59124" />
      <stop offset="1" stop-color="#875e0c" />
    </linearGradient>

    <linearGradient id="snoutGrad" x1="50" y1="60" x2="50" y2="76" gradientUnits="userSpaceOnUse">
      <stop stop-color="#fffaf0" />
      <stop offset="0.7" stop-color="#f5f0e0" />
      <stop offset="1" stop-color="#ebe6d6" />
    </linearGradient>

    <linearGradient id="beardFlameGrad" x1="50" y1="75" x2="50" y2="98" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ff6b5a" />
      <stop offset="0.6" stop-color="#ffb084" />
      <stop offset="1" stop-color="#e8b94a" />
    </linearGradient>
  </defs>
`;

const MASCOT_BODY = `
  <g>
    <path d="M 50 6 C 56 16, 62 22, 57 32 C 54 37, 46 37, 43 32 C 38 22, 44 16, 50 6 Z" fill="url(#fireFlameGrad)" />
    <path d="M 40 16 C 44 24, 46 28, 42 34 C 39 38, 33 36, 33 31 C 33 24, 37 21, 40 16 Z" fill="#e8b94a" fill-opacity="0.9" />
    <path d="M 60 16 C 56 24, 54 28, 58 34 C 61 38, 67 36, 67 31 C 67 24, 63 21, 60 16 Z" fill="#ffb084" fill-opacity="0.95" />
  </g>
  <path d="M 37 36 C 20 23, 8 36, 12 52 C 14 59, 22 61, 24 55 C 22 47, 26 39, 39 42 Z" fill="url(#hornLeftGrad)" filter="url(#hornShadow)" />
  <path d="M 21 34 C 23 38, 25 43, 27 48" stroke="#fffaf0" stroke-width="2" stroke-linecap="round" stroke-opacity="0.6" />
  <path d="M 14 44 C 17 48, 20 53, 22 56" stroke="#875e0c" stroke-width="1.6" stroke-linecap="round" stroke-opacity="0.4" />
  <path d="M 63 36 C 80 23, 92 36, 88 52 C 86 59, 78 61, 76 55 C 78 47, 74 39, 61 42 Z" fill="url(#hornRightGrad)" filter="url(#hornShadow)" />
  <path d="M 79 34 C 77 38, 75 43, 73 48" stroke="#fffaf0" stroke-width="2" stroke-linecap="round" stroke-opacity="0.6" />
  <path d="M 86 44 C 83 48, 80 53, 78 56" stroke="#875e0c" stroke-width="1.6" stroke-linecap="round" stroke-opacity="0.4" />
  <path d="M 32 45 C 19 46, 17 53, 24 56 C 29 57, 33 52, 33 47 Z" fill="#ff6b5a" />
  <ellipse cx="25" cy="51" rx="4" ry="2" fill="#ffb084" />
  <path d="M 68 45 C 81 46, 83 53, 76 56 C 71 57, 67 52, 67 47 Z" fill="#ff6b5a" />
  <ellipse cx="75" cy="51" rx="4" ry="2" fill="#ffb084" />
  <path d="M 33 39 C 32 32, 68 32, 67 39 C 68 50, 65 65, 59 73 C 55 77, 45 77, 41 73 C 35 65, 32 50, 33 39 Z" fill="url(#goatFaceGrad)" filter="url(#headShadow)" />
  <ellipse cx="45" cy="40" rx="7" ry="4" fill="#ffffff" fill-opacity="0.3" />
  <path d="M 50 34 C 53 40, 56 43, 53 47 C 51 50, 47 49, 47 45 C 47 41, 49 38, 50 34 Z" fill="#f6d888" />
  <circle cx="50.2" cy="45" r="1.5" fill="#ff6b5a" />
  <ellipse cx="40" cy="52" rx="4" ry="3.2" fill="#0a0a0a" />
  <ellipse cx="38.8" cy="50.8" rx="1.5" ry="1.2" fill="#ffffff" />
  <line x1="37.5" y1="52" x2="42.5" y2="52" stroke="#ffb084" stroke-width="1" stroke-linecap="round" />
  <ellipse cx="60" cy="52" rx="4" ry="3.2" fill="#0a0a0a" />
  <ellipse cx="58.8" cy="50.8" rx="1.5" ry="1.2" fill="#ffffff" />
  <line x1="57.5" y1="52" x2="62.5" y2="52" stroke="#ffb084" stroke-width="1" stroke-linecap="round" />
  <path d="M 40 62 C 40 59, 60 59, 60 62 C 62 70, 58 75, 50 75 C 42 75, 38 70, 40 62 Z" fill="url(#snoutGrad)" />
  <ellipse cx="50" cy="63" rx="6" ry="2" fill="#ffffff" fill-opacity="0.6" />
  <ellipse cx="47" cy="67.5" rx="1.2" ry="1.8" fill="#0a0a0a" transform="rotate(-15 47 67.5)" />
  <ellipse cx="53" cy="67.5" rx="1.2" ry="1.8" fill="#0a0a0a" transform="rotate(15 53 67.5)" />
  <path d="M 48 71 Q 50 72.5 52 71" stroke="#0a0a0a" stroke-width="1.4" stroke-linecap="round" />
  <path d="M 46 75 C 43 85, 49 93, 47 98 C 52 92, 57 88, 54 75 Z" fill="url(#beardFlameGrad)" filter="url(#beardShadow)" />
  <path d="M 49 76 C 48 83, 52 87, 51 91 C 53 87, 55 83, 53 76 Z" fill="#f6d888" fill-opacity="0.8" />
`;

/**
 * Creates full SVG markup for an adaptive foreground icon.
 * Sized strictly within the 66dp diameter safe circle on a 108dp canvas.
 * safeDiameter = (canvasSize * 66) / 108
 */
function createAdaptiveForegroundSvg(canvasSize) {
  const safeDiameter = (canvasSize * 66) / 108;
  const offset = (canvasSize - safeDiameter) / 2;
  const scale = safeDiameter / 100;
  return `<svg width="${canvasSize}" height="${canvasSize}" viewBox="0 0 ${canvasSize} ${canvasSize}" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${MASCOT_DEFS}
    <g transform="translate(${offset}, ${offset}) scale(${scale})">
      ${MASCOT_BODY}
    </g>
  </svg>`;
}

/**
 * Creates full SVG markup for legacy launcher icon (squircle with #fffaf0 background).
 */
function createLegacyLauncherSvg(size) {
  const cornerRadius = size * 0.2;
  const mascotSize = size * 0.70;
  const offset = (size - mascotSize) / 2;
  const scale = mascotSize / 100;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${MASCOT_DEFS}
    <rect width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}" fill="${CANVAS_BG}" />
    <g transform="translate(${offset}, ${offset}) scale(${scale})">
      ${MASCOT_BODY}
    </g>
  </svg>`;
}

/**
 * Creates full SVG markup for round launcher icon (circle mask with #fffaf0 background).
 */
function createRoundLauncherSvg(size) {
  const radius = size / 2;
  const mascotSize = size * 0.70;
  const offset = (size - mascotSize) / 2;
  const scale = mascotSize / 100;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${MASCOT_DEFS}
    <circle cx="${radius}" cy="${radius}" r="${radius}" fill="${CANVAS_BG}" />
    <g transform="translate(${offset}, ${offset}) scale(${scale})">
      ${MASCOT_BODY}
    </g>
  </svg>`;
}

/**
 * Creates full SVG markup for splash screens with #fffaf0 background.
 */
function createSplashSvg(width, height) {
  const mascotSize = Math.round(Math.min(width, height) * 0.28);
  const offsetX = (width - mascotSize) / 2;
  const offsetY = (height - mascotSize) / 2;
  const scale = mascotSize / 100;
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${MASCOT_DEFS}
    <rect width="${width}" height="${height}" fill="${CANVAS_BG}" />
    <g transform="translate(${offsetX}, ${offsetY}) scale(${scale})">
      ${MASCOT_BODY}
    </g>
  </svg>`;
}

/**
 * Standalone Master SVG for assets/logo.svg
 */
function createMasterLogoSvg() {
  return `<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  ${MASCOT_DEFS}
  ${MASCOT_BODY}
</svg>`;
}

async function renderSvgToPng(svgString, outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await sharp(Buffer.from(svgString))
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
}

async function renderSolidBackground(width, height, color, outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const svg = `<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="${color}" /></svg>`;
  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
}

async function main() {
  console.log('[Asset Gen] Starting asset generation for Horizon release...');

  const resDir = path.join(rootDir, 'android/app/src/main/res');
  const assetsDir = path.join(rootDir, 'assets');

  // 1. High-Res Masters in assets/
  console.log('[Asset Gen] Generating High-Res Masters in assets/...');
  fs.mkdirSync(assetsDir, { recursive: true });

  // assets/logo.svg
  fs.writeFileSync(path.join(assetsDir, 'logo.svg'), createMasterLogoSvg().trim(), 'utf8');
  console.log('  ✓ assets/logo.svg');

  // assets/icon.png (1024x1024)
  const masterIconSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${MASCOT_DEFS}
    <rect width="1024" height="1024" fill="${CANVAS_BG}" />
    <g transform="translate(${(1024 - 1024 * 0.70) / 2}, ${(1024 - 1024 * 0.70) / 2}) scale(${(1024 * 0.70) / 100})">
      ${MASCOT_BODY}
    </g>
  </svg>`;
  await renderSvgToPng(masterIconSvg, path.join(assetsDir, 'icon.png'));
  console.log('  ✓ assets/icon.png (1024x1024)');

  // assets/icon-foreground.png (1024x1024, scaled to 66dp safe zone = 625.77px)
  await renderSvgToPng(createAdaptiveForegroundSvg(1024), path.join(assetsDir, 'icon-foreground.png'));
  console.log('  ✓ assets/icon-foreground.png (1024x1024)');

  // assets/icon-background.png (1024x1024, solid #fffaf0)
  await renderSolidBackground(1024, 1024, CANVAS_BG, path.join(assetsDir, 'icon-background.png'));
  console.log('  ✓ assets/icon-background.png (1024x1024)');

  // assets/splash.png (2732x2732)
  const masterSplashSvg = `<svg width="2732" height="2732" viewBox="0 0 2732 2732" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${MASCOT_DEFS}
    <rect width="2732" height="2732" fill="${CANVAS_BG}" />
    <g transform="translate(${(2732 - 600) / 2}, ${(2732 - 600) / 2}) scale(${600 / 100})">
      ${MASCOT_BODY}
    </g>
  </svg>`;
  await renderSvgToPng(masterSplashSvg, path.join(assetsDir, 'splash.png'));
  console.log('  ✓ assets/splash.png (2732x2732)');

  // 2. Android Mipmaps
  console.log('[Asset Gen] Generating Android Mipmaps...');
  const mipmapDensities = [
    { density: 'ldpi', adaptiveSize: 81, legacySize: 36 },
    { density: 'mdpi', adaptiveSize: 108, legacySize: 48 },
    { density: 'hdpi', adaptiveSize: 162, legacySize: 72 },
    { density: 'xhdpi', adaptiveSize: 216, legacySize: 96 },
    { density: 'xxhdpi', adaptiveSize: 324, legacySize: 144 },
    { density: 'xxxhdpi', adaptiveSize: 432, legacySize: 192 },
  ];

  for (const item of mipmapDensities) {
    const dir = path.join(resDir, `mipmap-${item.density}`);
    fs.mkdirSync(dir, { recursive: true });

    // Adaptive foreground (81x81, 108x108, 162x162, 216x216, 324x324, 432x432)
    const fgPath = path.join(dir, 'ic_launcher_foreground.png');
    await renderSvgToPng(createAdaptiveForegroundSvg(item.adaptiveSize), fgPath);

    // Adaptive background PNG (fallback / legacy tool compatibility)
    const bgPath = path.join(dir, 'ic_launcher_background.png');
    await renderSolidBackground(item.adaptiveSize, item.adaptiveSize, CANVAS_BG, bgPath);

    // Legacy squircle launcher icon (36x36, 48x48, 72x72, 96x96, 144x144, 192x192)
    const legacyPath = path.join(dir, 'ic_launcher.png');
    await renderSvgToPng(createLegacyLauncherSvg(item.legacySize), legacyPath);

    // Round circular launcher icon (36x36, 48x48, 72x72, 96x96, 144x144, 192x192)
    const roundPath = path.join(dir, 'ic_launcher_round.png');
    await renderSvgToPng(createRoundLauncherSvg(item.legacySize), roundPath);

    console.log(`  ✓ mipmap-${item.density} (fg: ${item.adaptiveSize}x${item.adaptiveSize}, legacy/round: ${item.legacySize}x${item.legacySize})`);
  }

  // 3. Play Store Web Icon in android/app/src/main/res/drawable/ic_launcher_web.png (512x512)
  console.log('[Asset Gen] Generating Google Play Store Web Icon...');
  const webIconSvg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${MASCOT_DEFS}
    <rect width="512" height="512" fill="${CANVAS_BG}" />
    <g transform="translate(${(512 - 512 * 0.70) / 2}, ${(512 - 512 * 0.70) / 2}) scale(${(512 * 0.70) / 100})">
      ${MASCOT_BODY}
    </g>
  </svg>`;
  await renderSvgToPng(webIconSvg, path.join(resDir, 'drawable', 'ic_launcher_web.png'));
  console.log('  ✓ drawable/ic_launcher_web.png (512x512)');

  // 4. Splash Screens in drawable/ and drawable-{port,land}-*/splash.png
  console.log('[Asset Gen] Generating Splash Screens...');
  const splashScreens = [
    { file: 'drawable/splash.png', width: 320, height: 480 },
    { file: 'drawable-night/splash.png', width: 320, height: 240 },
    { file: 'drawable-port-ldpi/splash.png', width: 240, height: 320 },
    { file: 'drawable-port-mdpi/splash.png', width: 320, height: 480 },
    { file: 'drawable-port-hdpi/splash.png', width: 480, height: 800 },
    { file: 'drawable-port-xhdpi/splash.png', width: 720, height: 1280 },
    { file: 'drawable-port-xxhdpi/splash.png', width: 960, height: 1600 },
    { file: 'drawable-port-xxxhdpi/splash.png', width: 1280, height: 1920 },
    { file: 'drawable-land-ldpi/splash.png', width: 320, height: 240 },
    { file: 'drawable-land-mdpi/splash.png', width: 480, height: 320 },
    { file: 'drawable-land-hdpi/splash.png', width: 800, height: 480 },
    { file: 'drawable-land-xhdpi/splash.png', width: 1280, height: 720 },
    { file: 'drawable-land-xxhdpi/splash.png', width: 1600, height: 960 },
    { file: 'drawable-land-xxxhdpi/splash.png', width: 1920, height: 1280 },
    // Night equivalents
    { file: 'drawable-port-night-ldpi/splash.png', width: 240, height: 320 },
    { file: 'drawable-port-night-mdpi/splash.png', width: 320, height: 480 },
    { file: 'drawable-port-night-hdpi/splash.png', width: 480, height: 800 },
    { file: 'drawable-port-night-xhdpi/splash.png', width: 720, height: 1280 },
    { file: 'drawable-port-night-xxhdpi/splash.png', width: 960, height: 1600 },
    { file: 'drawable-port-night-xxxhdpi/splash.png', width: 1280, height: 1920 },
    { file: 'drawable-land-night-ldpi/splash.png', width: 320, height: 240 },
    { file: 'drawable-land-night-mdpi/splash.png', width: 480, height: 320 },
    { file: 'drawable-land-night-hdpi/splash.png', width: 800, height: 480 },
    { file: 'drawable-land-night-xhdpi/splash.png', width: 1280, height: 720 },
    { file: 'drawable-land-night-xxhdpi/splash.png', width: 1600, height: 960 },
    { file: 'drawable-land-night-xxxhdpi/splash.png', width: 1920, height: 1280 },
  ];

  for (const s of splashScreens) {
    const splashPath = path.join(resDir, s.file);
    await renderSvgToPng(createSplashSvg(s.width, s.height), splashPath);
    console.log(`  ✓ ${s.file} (${s.width}x${s.height})`);
  }

  // 5. Enforce cleanup of obsolete scaffolding files
  const obsoleteFiles = [
    path.join(resDir, 'drawable-v24', 'ic_launcher_foreground.xml'),
    path.join(resDir, 'drawable', 'ic_launcher_background.xml'),
  ];
  for (const f of obsoleteFiles) {
    if (fs.existsSync(f)) {
      fs.unlinkSync(f);
      console.log(`  ✓ Removed obsolete scaffolding: ${path.relative(rootDir, f)}`);
    }
  }

  // 6. Ensure XML resources are up to date
  const bgXmlPath = path.join(resDir, 'values', 'ic_launcher_background.xml');
  const bgXmlContent = `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${CANVAS_BG}</color>\n</resources>\n`;
  fs.writeFileSync(bgXmlPath, bgXmlContent, 'utf8');

  const icLauncherXmlPath = path.join(resDir, 'mipmap-anydpi-v26', 'ic_launcher.xml');
  const icLauncherXmlContent = `<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@color/ic_launcher_background"/>\n    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n</adaptive-icon>\n`;
  fs.writeFileSync(icLauncherXmlPath, icLauncherXmlContent, 'utf8');

  const icLauncherRoundXmlPath = path.join(resDir, 'mipmap-anydpi-v26', 'ic_launcher_round.xml');
  fs.writeFileSync(icLauncherRoundXmlPath, icLauncherXmlContent, 'utf8');

  console.log('[Asset Gen] All Horizon Android & branding assets successfully generated!');
}

main().catch((err) => {
  console.error('[Asset Gen] Fatal error:', err);
  process.exit(1);
});
