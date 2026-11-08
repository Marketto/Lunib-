import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import qrcode from 'qrcode-generator';
import { tap } from './Common.jsx';
import { VERSION, BUILD, BUILD_DATE } from '../lib/update.js';

export const SHARE_TEXT = {
  it: {
    title: 'Condividi Lunibù', sub: 'Manda il link dell\'app (senza i tuoi dati: restano solo su questo telefono).',
    share: 'Condividi', copy: 'Copia link', copied: 'Link copiato', qr: 'Oppure fai inquadrare questo QR code',
    message: 'Lunibù: ricerca rapida di dati scientifici per genitori di bambini 0–6 anni. Funziona anche offline.',
    version: (v, b, d) => `Versione ${v} · build ${b} · ${d}`,
    updated: (v) => `Lunibù è stata aggiornata alla versione ${v}.`, ready: 'Nuova versione pronta: si aggiornerà alla prossima apertura.', now: 'Aggiorna ora', ok: 'Ok'
  },
  ru: {
    title: 'Поделиться Lunibù', sub: 'Отправьте ссылку на приложение (без ваших данных: они остаются только на этом телефоне).',
    share: 'Поделиться', copy: 'Копировать ссылку', copied: 'Ссылка скопирована', qr: 'Или дайте отсканировать этот QR-код',
    message: 'Lunibù: быстрый поиск научных данных для родителей детей 0–6 лет. Работает и офлайн.',
    version: (v, b, d) => `Версия ${v} · сборка ${b} · ${d}`,
    updated: (v) => `Lunibù обновлено до версии ${v}.`, ready: 'Новая версия готова: обновится при следующем открытии.', now: 'Обновить сейчас', ok: 'Ок'
  }
};

// Link pubblico dell'app: senza hash, query o dati
export const appUrl = () => `${location.origin}${location.pathname.replace(/index\.html$/, '')}`;

export function VersionLine({ lang }) {
  return <span className="version-line">{SHARE_TEXT[lang].version(VERSION, BUILD, BUILD_DATE)}</span>;
}

export function ShareCard({ lang }) {
  const s = SHARE_TEXT[lang];
  const [copied, setCopied] = useState(false);
  const url = appUrl();
  const svg = useMemo(() => {
    const q = qrcode(0, 'M'); q.addData(url); q.make();
    return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  }, [url]);
  const share = async () => {
    if (navigator.share) { try { await navigator.share({ title: 'Lunibù', text: s.message, url }); } catch {} }
    else copy();
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };
  return (
    <section className="share-card">
      <h2>{s.title}</h2>
      <p className="small muted">{s.sub}</p>
      <div className="row">
        <motion.button className="btn primary" onClick={share} {...tap}>{s.share}</motion.button>
        <motion.button className="btn ghost" onClick={copy} {...tap}>{copied ? `✓ ${s.copied}` : s.copy}</motion.button>
      </div>
      <p className="small muted">{s.qr}</p>
      <div className="qr" aria-label="QR" dangerouslySetInnerHTML={{ __html: svg }} />
      <p className="small muted url">{url}</p>
    </section>
  );
}
