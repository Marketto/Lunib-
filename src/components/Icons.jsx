import React from 'react';

const S = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props} />
);

export const IconSearch = () => <S><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></S>;
export const IconBack = () => <S><path d="M15 5l-7 7 7 7" /></S>;
export const IconClose = () => <S><path d="M6 6l12 12M18 6L6 18" /></S>;
export const IconMusic = () => <S><path d="M9 18V6l11-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></S>;
export const IconMusicOff = () => <S><path d="M9 18V6l11-2v12" /><circle cx="6.5" cy="18" r="2.5" /><path d="M3 3l18 18" /></S>;
export const IconAsk = () => <S><path d="M4 5h16v11H9l-5 4z" /><path d="M10 9.5a2 2 0 1 1 2.8 1.8c-.5.3-.8.7-.8 1.2" /><circle cx="12" cy="14.6" r=".4" fill="currentColor" /></S>;
export const IconSounds = () => <S><path d="M3 12h2M7 8v8M11 5v14M15 8v8M19 10v4M21 12h0" /></S>;
export const IconKids = () => <S><circle cx="9" cy="8" r="3" /><circle cx="17" cy="10" r="2.2" /><path d="M3.5 19c.8-3.3 3-5 5.5-5s4.7 1.7 5.5 5" /><path d="M14.5 15.2c.8-.8 1.6-1.2 2.5-1.2 2 0 3.4 1.6 4 5" /></S>;
export const IconDiary = () => <S><rect x="5" y="3.5" width="14" height="17" rx="2.5" /><path d="M9 3.5v17" /><path d="M12 9.5h4M12 13h4" /><path d="M14 17.5l1.2-1.2 1.3 1.2" /></S>;
export const IconMoon = () => <S><path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z" /></S>;
export const IconBall = () => <S><rect x="3.5" y="12" width="8" height="8" rx="1.5" /><rect x="12.5" y="12" width="8" height="8" rx="1.5" /><rect x="8" y="3.5" width="8" height="8" rx="1.5" transform="rotate(8 12 7.5)" /></S>;
export const IconStop = () => <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" /></svg>;
export const IconPlay = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>;
export const IconLock = () => <S><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></S>;
export const IconCare = () => <S><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /><path d="M12 9.5v5M9.5 12h5" /></S>;
export const IconAlert = () => <S><path d="M12 3l9.5 17h-19z" /><path d="M12 10v4.5" /><circle cx="12" cy="17.3" r=".5" fill="currentColor" /></S>;
export const IconShift = () => <S><path d="M7 8l-4 4 4 4M17 8l4 4-4 4M3 12h18" /></S>;
export const IconWave = () => <S><path d="M2 12c2.5-4 5-4 7.5 0s5 4 7.5 0 3.5-3 5-1" /></S>;
export const IconNote = () => <S><path d="M9 17V5l9-2v12" /><circle cx="6.5" cy="17" r="2.5" /><circle cx="15.5" cy="15" r="2.5" /></S>;
