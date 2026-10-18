import { strToU8, zipSync } from 'fflate';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

type ExportFile = { path: string; bytes: Uint8Array };

function safeFileName(value: string, fallback: string) {
  const cleaned = value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  return cleaned.slice(0, 64) || fallback;
}

async function sha256(bytes: Uint8Array) {
  const hash = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function buildAccountExport(userId: string): Promise<Blob> {
  if (!isSupabaseConfigured || !supabase) throw new Error('No se pudo conectar con Horizon.');
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (sessionData.session?.user.id !== userId) throw new Error('Tu sesión ha cambiado. Vuelve a iniciar sesión.');

  const [profileResult, themesResult, entriesResult, milestonesResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('big_themes').select('*').eq('user_id', userId).order('created_at'),
    supabase.from('blog_entries').select('*').eq('user_id', userId).order('date'),
    supabase.from('milestones_2027').select('*').eq('user_id', userId).order('created_at'),
  ]);
  const firstError = [profileResult, themesResult, entriesResult, milestonesResult].find(result => result.error)?.error;
  if (firstError) throw firstError;

  const createdAt = new Date().toISOString();
  const files: ExportFile[] = [];
  const addJson = (path: string, data: unknown) => files.push({ path, bytes: strToU8(`${JSON.stringify(data, null, 2)}\n`) });
  addJson('datos/perfil.json', profileResult.data ?? null);
  addJson('datos/wrappers.json', themesResult.data ?? []);
  addJson('datos/entradas.json', entriesResult.data ?? []);
  addJson('datos/hitos.json', milestonesResult.data ?? []);

  for (const [index, entry] of (entriesResult.data ?? []).entries()) {
    const title = typeof entry.title === 'string' ? entry.title : `entrada-${index + 1}`;
    const markdown = `# ${title}\n\nFecha: ${entry.date ?? ''}\n\n${entry.summary ? `${entry.summary}\n\n` : ''}${entry.content ?? ''}\n`;
    files.push({ path: `entradas/${String(index + 1).padStart(3, '0')}-${safeFileName(title, 'entrada')}.md`, bytes: strToU8(markdown) });
  }

  const avatarPath = typeof profileResult.data?.avatar_path === 'string' ? profileResult.data.avatar_path : null;
  if (avatarPath) {
    const avatar = await supabase.storage.from('avatars').download(avatarPath);
    if (!avatar.error) files.push({ path: 'avatar/avatar.webp', bytes: new Uint8Array(await avatar.data.arrayBuffer()) });
  }

  const checksums = await Promise.all(files.map(async file => ({ path: file.path, sha256: await sha256(file.bytes), bytes: file.bytes.byteLength })));
  addJson('manifest.json', {
    format: 'horizon-account-export',
    version: 1,
    created_at: createdAt,
    account_id: userId,
    email: sessionData.session.user.email ?? null,
    files: checksums,
  });

  const archive = zipSync(Object.fromEntries(files.map(file => [file.path, file.bytes])), { level: 6 });
  return new Blob([archive as BlobPart], { type: 'application/zip' });
}

export async function deliverAccountExport(blob: Blob) {
  const date = new Date().toISOString().slice(0, 10);
  const file = new File([blob], `horizon-export-${date}.zip`, { type: blob.type });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Exportación de Horizon' });
    return;
  }
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
