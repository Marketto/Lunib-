// Importato dal service worker (workbox.importScripts): risponde alle richieste Range dell'elemento <audio>
// con 206 Partial Content dai file in cache. Senza, Safari (e il loop/seek di Chrome) non riproducono offline.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const range = req.headers.get('range');
  if (!range || !/\/audio\/[^/]+\.m4a$/.test(new URL(req.url).pathname)) return;
  event.respondWith((async () => {
    const hit = await caches.match(req.url, { ignoreSearch: true });
    if (!hit) return fetch(req);
    const buf = await hit.arrayBuffer();
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    let start = m && m[1] ? parseInt(m[1], 10) : 0;
    let end = m && m[2] ? parseInt(m[2], 10) : buf.byteLength - 1;
    if (m && !m[1] && m[2]) { start = Math.max(0, buf.byteLength - parseInt(m[2], 10)); end = buf.byteLength - 1; } // bytes=-N
    end = Math.min(end, buf.byteLength - 1);
    if (start > end) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${buf.byteLength}` } });
    return new Response(buf.slice(start, end + 1), {
      status: 206,
      statusText: 'Partial Content',
      headers: {
        'Content-Type': 'audio/mp4',
        'Content-Range': `bytes ${start}-${end}/${buf.byteLength}`,
        'Content-Length': String(end - start + 1),
        'Accept-Ranges': 'bytes'
      }
    });
  })());
});
