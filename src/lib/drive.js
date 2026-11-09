// Trasporto Google Drive (REST v3) senza backend. Nessuna chiamata di rete finché l'utente non tocca
// "Collega Google Drive": gli script Google si caricano solo allora. Unico scope: drive.file.
// Il token resta solo in memoria. Nessun client secret.
const env = import.meta.env || {};
const CLIENT_ID = env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = env.VITE_GOOGLE_API_KEY;
const APP_ID = env.VITE_GOOGLE_APP_ID;
export const SCOPE = 'https://www.googleapis.com/auth/drive.file';
export const driveEnabled = Boolean(CLIENT_ID && API_KEY && APP_ID);
export const fileLink = (id) => `https://drive.google.com/file/d/${encodeURIComponent(id)}/view`;

const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';

let token = null; // { value, exp } solo in memoria
const scripts = {};
function loadScript(src) {
  return (scripts[src] ||= new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = res; s.onerror = () => { delete scripts[src]; rej(new Error('network')); };
    document.head.appendChild(s);
  }));
}

let pending = null;
/** Token valido; se scaduto/assente lo richiede. silent=true: mai finestre (prompt 'none'), errore 'auth' se serve l'utente. */
export async function getToken({ silent = false } = {}) {
  if (!driveEnabled) throw new Error('disabled');
  if (token && Date.now() < token.exp - 30000) return token.value;
  if (pending) return pending;
  pending = (async () => {
    await loadScript('https://accounts.google.com/gsi/client');
    return new Promise((resolve, reject) => {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        callback: (r) => {
          if (!r || r.error || !r.access_token) return reject(new Error('auth'));
          token = { value: r.access_token, exp: Date.now() + (Number(r.expires_in) || 3600) * 1000 };
          resolve(token.value);
        },
        error_callback: () => reject(new Error('auth'))
      });
      client.requestAccessToken({ prompt: silent ? 'none' : '' });
    });
  })().finally(() => { pending = null; });
  return pending;
}

async function call(url, init, opts) {
  const doFetch = async () => fetch(url, { ...init, headers: { ...(init.headers || {}), Authorization: `Bearer ${await getToken(opts)}` } });
  let r = await doFetch();
  if (r.status === 401) { token = null; r = await doFetch(); }
  if (r.status === 404) throw new Error('not-found');
  if (r.status === 401 || r.status === 403) throw new Error('auth');
  if (!r.ok) throw new Error('http-' + r.status);
  return r;
}

export async function createFile(name, blob, opts) {
  const b = 'lunibu' + Math.random().toString(36).slice(2);
  const body = new Blob([
    `--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
    JSON.stringify({ name, mimeType: 'application/octet-stream' }),
    `\r\n--${b}\r\nContent-Type: application/octet-stream\r\n\r\n`, blob, `\r\n--${b}--`
  ]);
  const r = await call(`${UPLOAD}/files?uploadType=multipart&fields=id,version`, { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${b}` }, body }, opts);
  const j = await r.json();
  return { id: j.id, version: j.version };
}

export async function getVersion(id, opts) {
  const r = await call(`${API}/files/${encodeURIComponent(id)}?fields=version`, { method: 'GET' }, opts);
  return (await r.json()).version;
}

/** Versione letta prima del contenuto: se qualcuno scrive in mezzo, l'upload successivo rileva il conflitto. */
export async function download(id, opts) {
  const version = await getVersion(id, opts);
  const r = await call(`${API}/files/${encodeURIComponent(id)}?alt=media`, { method: 'GET' }, opts);
  return { text: await r.text(), version };
}

export async function upload(id, blob, opts) {
  const r = await call(`${UPLOAD}/files/${encodeURIComponent(id)}?uploadType=media&fields=version`, { method: 'PATCH', headers: { 'Content-Type': 'application/octet-stream' }, body: blob }, opts);
  return { version: (await r.json()).version };
}

export async function share(id, email, opts) {
  await call(`${API}/files/${encodeURIComponent(id)}/permissions?sendNotificationEmail=true`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'user', role: 'writer', emailAddress: email })
  }, opts);
}

/** Selettore Google: scegliere il file condiviso dall'altro genitore concede l'accesso drive.file a quel solo file. null se annullato. */
export async function pickFile(opts) {
  const t = await getToken(opts);
  await loadScript('https://apis.google.com/js/api.js');
  await new Promise((res, rej) => window.gapi.load('picker', { callback: res, onerror: () => rej(new Error('network')) }));
  const g = window.google.picker;
  return new Promise((resolve) => {
    const view = new g.DocsView().setIncludeFolders(false).setSelectFolderEnabled(false);
    new g.PickerBuilder()
      .setAppId(APP_ID).setOAuthToken(t).setDeveloperKey(API_KEY)
      .addView(view)
      .setCallback((d) => {
        if (d.action === g.Action.PICKED) resolve(d.docs?.[0]?.id || null);
        else if (d.action === g.Action.CANCEL) resolve(null);
      })
      .build().setVisible(true);
  });
}

export async function revoke() {
  const t = token?.value;
  token = null;
  if (!t || !window.google?.accounts?.oauth2) return;
  await new Promise((res) => window.google.accounts.oauth2.revoke(t, res));
}

/** Trasporto per syncOnce. */
export const transport = (opts) => ({
  createFile: (n, b) => createFile(n, b, opts),
  download: (id) => download(id, opts),
  getVersion: (id) => getVersion(id, opts),
  upload: (id, b) => upload(id, b, opts)
});
