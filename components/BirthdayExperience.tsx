'use client';

import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowDown, ArrowLeft, ArrowRight, Gift, Heart, Music2, Pause, Play, Shuffle, Volume2, VolumeX, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { site } from '@/content/site';
import generatedPhotos from '@/content/photos.generated.json';
import photoMetadata from '@/content/photo-metadata.json';

type Photo = { id: string; src: string; thumb: string; width: number; height: number; caption?: string; album?: string; focalPoint?: string };
const photos = generatedPhotos as Photo[];
const metadata = photoMetadata as { featured: string | null; slideshow: string[]; photos: Record<string, { caption?: string; album?: string; focalPoint?: string }> };
const enriched = photos.map(photo => ({ ...photo, ...(metadata.photos[photo.id] || {}) }));
const featured = enriched.find(photo => photo.id === metadata.featured) || enriched[0];
const selectedStory = metadata.slideshow.map(id => enriched.find(photo => photo.id === id)).filter((photo): photo is Photo => Boolean(photo));
const storyPhotos = selectedStory.length ? selectedStory : enriched.slice(0, 8);
const placeholderNotes = ['A moment of you', 'The little things', 'Your beautiful smile', 'For all the tomorrows'];

function scrollToId(id: string) { document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }
function Confetti({ active }: { active: boolean }) { return active ? <div className="confetti" aria-hidden="true">{Array.from({ length: 32 }, (_, i) => <i key={i} style={{ '--dx': `${(i - 16) * 22}px`, '--dy': `${180 + (i % 5) * 25}px`, '--h': `${(i * 47) % 360}deg`, '--rot': `${i * 23}deg` } as React.CSSProperties} />)}</div> : null; }
function PhotoArt({ photo, className = '', priority = false, sizes = '100vw', decorative = false }: { photo?: Photo; className?: string; priority?: boolean; sizes?: string; decorative?: boolean }) {
  return <div className={`photo-art ${className}`}>
    {photo ? <Image src={photo.src} alt={decorative ? '' : photo.caption || `A photograph of ${site.partner}`} width={photo.width} height={photo.height} priority={priority} sizes={sizes} style={{ objectPosition: photo.focalPoint || 'center' }} /> : <div className="photo-placeholder" aria-label={decorative ? undefined : 'A space for a favourite photo'}><span className="placeholder-sun" /><span className="placeholder-hill hill-one" /><span className="placeholder-hill hill-two" /><span className="placeholder-heart">♥</span></div>}
  </div>;
}
function SectionLabel({ children }: { children: React.ReactNode }) { return <p className="section-label"><span className="label-line" />{children}<span className="label-line" /></p>; }

export default function BirthdayExperience() {
  const reduced = useReducedMotion();
  const audio = useRef<HTMLAudioElement>(null);
  const openButton = useRef<HTMLButtonElement>(null);
  const lightboxClose = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const storyRef = useRef<HTMLElement>(null);
  const touchStart = useRef<number | null>(null);
  const [opened, setOpened] = useState(false);
  const [opening, setOpening] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.65);
  const [audioMessage, setAudioMessage] = useState('');
  const [burst, setBurst] = useState(false);
  const [storyIndex, setStoryIndex] = useState(0);
  const [storyPlaying, setStoryPlaying] = useState(true);
  const [storyVisible, setStoryVisible] = useState(false);
  const [shown, setShown] = useState(24);
  const [album, setAlbum] = useState('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [candlesOut, setCandlesOut] = useState(false);
  const [giftOpened, setGiftOpened] = useState(false);

  const albums = useMemo(() => ['All', ...Array.from(new Set(enriched.map(p => p.album).filter((x): x is string => Boolean(x))))], []);
  const filtered = useMemo(() => album === 'All' ? enriched : enriched.filter(p => p.album === album), [album]);
  const visiblePhotos = filtered.slice(0, shown);
  const triggerBurst = useCallback(() => { setBurst(false); requestAnimationFrame(() => { setBurst(true); window.setTimeout(() => setBurst(false), 1600); }); }, []);

  useEffect(() => {
    let alive = true;
    fetch(site.music.src, { method: 'HEAD' }).then(r => { if (alive) setAudioAvailable(r.ok && (r.headers.get('content-type') || '').startsWith('audio/')); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  useEffect(() => { if (audio.current) { audio.current.volume = volume; audio.current.muted = muted; } }, [volume, muted]);
  const playAudio = useCallback(async (restart = false) => {
    if (!audioAvailable || !audio.current) return;
    try { if (restart) audio.current.currentTime = 0; await audio.current.play(); setPlaying(true); setAudioMessage(''); }
    catch { setPlaying(false); setAudioMessage('Music could not start. Tap play to try again.'); }
  }, [audioAvailable]);
  const toggleAudio = () => { if (!audio.current || !audioAvailable) return; if (playing) { audio.current.pause(); setPlaying(false); } else void playAudio(); };
  const openSurprise = () => {
    setOpening(true); triggerBurst();
    if (musicEnabled) void playAudio();
    window.setTimeout(() => { setOpened(true); setOpening(false); }, reduced ? 100 : 700);
  };
  useEffect(() => { if (!opened) return; const t = window.setTimeout(() => document.getElementById('birthday')?.focus(), reduced ? 50 : 300); return () => clearTimeout(t); }, [opened, reduced]);

  useEffect(() => {
    const node = storyRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setStoryVisible(entry.isIntersecting), { threshold: 0.3 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [opened]);
  useEffect(() => {
    if (!storyPlaying || !storyVisible || !opened || storyPhotos.length < 2 || reduced) return;
    const timer = window.setInterval(() => { if (!document.hidden) setStoryIndex(i => (i + 1) % storyPhotos.length); }, 4500);
    return () => window.clearInterval(timer);
  }, [storyPlaying, storyVisible, opened, reduced]);
  const moveStory = (delta: number) => setStoryIndex(i => (i + delta + storyPhotos.length) % storyPhotos.length);

  const openLightbox = (index: number) => { previousFocus.current = document.activeElement as HTMLElement; setLightboxIndex(index); };
  const closeLightbox = useCallback(() => { setLightboxIndex(null); window.setTimeout(() => previousFocus.current?.focus(), 0); }, []);
  useEffect(() => {
    if (lightboxIndex === null) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    lightboxClose.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowRight') setLightboxIndex(i => i === null ? null : (i + 1) % enriched.length);
      if (event.key === 'ArrowLeft') setLightboxIndex(i => i === null ? null : (i - 1 + enriched.length) % enriched.length);
      if (event.key === 'Tab') {
        const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
        const controls = Array.from(dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])') || []);
        if (!controls.length) return;
        if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls[controls.length - 1].focus(); }
        if (!event.shiftKey && document.activeElement === controls[controls.length - 1]) { event.preventDefault(); controls[0].focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = oldOverflow; document.removeEventListener('keydown', onKey); };
  }, [lightboxIndex, closeLightbox]);
  useEffect(() => {
    if (lightboxIndex === null) return;
    for (const offset of [-1, 1]) { const p = enriched[(lightboxIndex + offset + enriched.length) % enriched.length]; if (p) { const img = new window.Image(); img.src = p.src; } }
  }, [lightboxIndex]);
  const randomPhoto = () => { if (!enriched.length) return; openLightbox(Math.floor(Math.random() * enriched.length)); };

  return <>
    <audio ref={audio} src={audioAvailable ? site.music.src : undefined} loop={site.music.loop} preload="none" onEnded={() => setPlaying(false)} onError={() => { setAudioAvailable(false); setPlaying(false); }} />
    <Confetti active={burst} />
    <AnimatePresence mode="wait">
      {!opened ? <motion.main key="invitation" className="invitation" exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.45 }}>
        <div className="invitation-glow" />
        <div className="invite-top"><span className="brand-mark">s <span>♡</span> s</span><span>18.09.2026</span></div>
        <div className="invitation-content">
          <SectionLabel>To my favourite person</SectionLabel>
          <div className={`envelope ${opening ? 'is-opening' : ''}`} aria-hidden="true"><div className="envelope-flap" /><div className="envelope-card"><span>for you, my love</span><Heart size={25} fill="currentColor" /></div><div className="envelope-front" /><span className="envelope-seal">♥</span></div>
          <p className="eyebrow">{site.invitation.eyebrow}</p>
          <h1>{site.invitation.title}</h1>
          <p className="invite-description">A little corner of the world, made just for you.</p>
          <button ref={openButton} className="primary-button" onClick={openSurprise} disabled={opening}>Open your birthday surprise <span aria-hidden="true">💌</span></button>
          {audioAvailable && <label className="music-switch"><input type="checkbox" checked={musicEnabled} onChange={e => setMusicEnabled(e.target.checked)} /><span className="switch-track" /><span>Music {musicEnabled ? 'on' : 'off'}</span></label>}
        </div>
        <div className="invite-bottom"><span>Made with love, for you</span><span>↓ a little magic awaits</span></div>
      </motion.main> : <motion.div key="experience" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : 0.5 }}>
        <header className="site-header"><button className="brand-mark" onClick={() => scrollToId('birthday')} aria-label="Go to top">s <span>♡</span> s</button><nav aria-label="Main navigation"><a href="#story">Our story</a><a href="#gallery">Memories</a><a href="#letter">A letter</a></nav><span className="header-date">18 September 2026</span></header>
        <main>
          <section id="birthday" className="hero" tabIndex={-1}>
            <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
            <div className="hero-inner"><div className="hero-copy"><SectionLabel>{site.hero.eyebrow}</SectionLabel><p className="hero-script">To my love,</p><h1>{site.hero.title}{' '}<br /><em>{site.partner}.</em></h1><p className="hero-subtitle">{site.hero.subtitle}</p><div className="hero-actions"><button className="primary-button" onClick={() => scrollToId('story')}>Explore your surprise <ArrowDown size={17} /></button><span>18 September 2026 <span className="tiny-heart">♥</span></span></div></div><div className="hero-visual"><div className="hero-photo-frame"><PhotoArt photo={featured} priority sizes="(max-width: 800px) 85vw, 38vw" /><span className="photo-tape" /></div><div className="hero-note"><span>twenty three</span><strong>looks lovely on you</strong><span className="note-heart">♡</span></div>{enriched.length > 1 && <div className="mini-photo mini-photo-left"><PhotoArt photo={enriched[1]} decorative /></div>}{enriched.length > 2 && <div className="mini-photo mini-photo-right"><PhotoArt photo={enriched[2]} decorative /></div>}</div></div><div className="hero-footer"><span>01 / a birthday wish</span><span>Scroll to explore ↓</span></div>
          </section>
          <section id="story" ref={storyRef} className="story-section section-wrap"><div className="section-heading"><SectionLabel>Chapter one · a little film of you</SectionLabel><h2>{site.story.title}</h2><p>{site.story.subtitle}</p></div><div className="story-stage" onTouchStart={e => touchStart.current = e.touches[0].clientX} onTouchEnd={e => { if (touchStart.current !== null && Math.abs(e.changedTouches[0].clientX - touchStart.current) > 45) moveStory(e.changedTouches[0].clientX < touchStart.current ? 1 : -1); touchStart.current = null; }}><div className="story-image"><AnimatePresence mode="wait"><motion.div key={storyIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.65 }} className="story-photo-shell"><PhotoArt photo={storyPhotos[storyIndex]} sizes="(max-width: 800px) 92vw, 70vw" /></motion.div></AnimatePresence></div><div className="story-overlay"><div><span className="story-kicker">A little moment to remember</span><p>{storyPhotos[storyIndex]?.caption || (storyPhotos.length ? 'A piece of you, kept close.' : 'Your favourite photographs will live here.')}</p></div><span className="story-counter">{String(storyIndex + 1).padStart(2, '0')} / {String(Math.max(storyPhotos.length, 1)).padStart(2, '0')}</span></div></div><div className="story-controls"><button aria-label="Previous photo" onClick={() => moveStory(-1)} disabled={storyPhotos.length < 2}><ArrowLeft size={20} /></button><button aria-label={storyPlaying ? 'Pause slideshow' : 'Play slideshow'} onClick={() => setStoryPlaying(!storyPlaying)} disabled={storyPhotos.length < 2}>{storyPlaying ? <Pause size={18} /> : <Play size={18} />}</button><button aria-label="Next photo" onClick={() => moveStory(1)} disabled={storyPhotos.length < 2}><ArrowRight size={20} /></button></div></section>
          <section id="gallery" className="gallery-section"><div className="section-wrap"><div className="gallery-top"><div className="section-heading align-left"><SectionLabel>Chapter two · every little moment</SectionLabel><h2>{site.gallery.title}</h2><p>{site.gallery.subtitle}</p></div><div className="gallery-count"><strong>{enriched.length || '∞'}</strong><span>memories<br />and counting</span></div></div>{albums.length > 1 && <div className="album-filters" aria-label="Filter photos by album">{albums.map(name => <button key={name} className={album === name ? 'active' : ''} onClick={() => { setAlbum(name); setShown(24); }}>{name}</button>)}</div>}{enriched.length ? <><div className="gallery-grid">{visiblePhotos.map((photo, i) => <button key={photo.id} className="gallery-item" onClick={() => openLightbox(enriched.findIndex(p => p.id === photo.id))} aria-label={`Open memory ${i + 1}${photo.caption ? `: ${photo.caption}` : ''}`}><div className="gallery-photo"><Image src={photo.thumb} alt="" width={photo.width} height={photo.height} sizes="(max-width: 600px) 46vw, (max-width: 1000px) 30vw, 22vw" loading="lazy" style={{ objectPosition: photo.focalPoint || 'center' }} /></div>{photo.caption && <span className="gallery-caption">{photo.caption}</span>}</button>)}</div><div className="gallery-actions">{shown < filtered.length && <button className="secondary-button" onClick={() => setShown(n => n + 24)}>Show more memories <ArrowDown size={17} /></button>}<button className="text-button" onClick={randomPhoto}><Shuffle size={17} /> Pick a random memory ✨</button></div></> : <div className="gallery-empty"><div className="empty-grid">{placeholderNotes.map((note, i) => <div className={`empty-card empty-card-${i + 1}`} key={note}><PhotoArt decorative /><span>{note}</span></div>)}</div><p>Our memory book is waiting for its first photographs.</p><span className="empty-small">The story is already beautiful because it is yours.</span></div>}</div></section>
          <section id="reasons" className="reasons-section section-wrap"><div className="section-heading"><SectionLabel>Chapter three · a few reasons why</SectionLabel><h2>23 things I love about you.</h2><p>There are so many more. Start with these, my love.</p></div><div className="reasons-actions"><span>Tap a card to turn it over</span><button className="text-button" onClick={() => setRevealed(site.loveNotes.map((_, i) => i))}>Reveal all <span aria-hidden="true">↗</span></button></div><div className="reasons-grid">{site.loveNotes.map((reason, i) => <button key={i} className={`reason-card ${revealed.includes(i) ? 'revealed' : ''}`} aria-pressed={revealed.includes(i)} aria-label={`Reason ${i + 1}: ${revealed.includes(i) ? reason : 'reveal'}`} onClick={() => setRevealed(current => current.includes(i) ? current.filter(x => x !== i) : [...current, i])}><span className="reason-number">{String(i + 1).padStart(2, '0')}</span><span className="reason-content">{revealed.includes(i) ? reason : 'A little thing I love about you'}</span><span className="reason-heart">{revealed.includes(i) ? '♥' : '♡'}</span></button>)}</div></section>
          <section id="letter" className="letter-section"><div className="section-wrap letter-layout"><div className="letter-intro"><SectionLabel>Chapter four · from my heart</SectionLabel><h2>Words I hope<br /><em>you keep.</em></h2><p>For the moments when you need a reminder of how loved you are.</p><span className="letter-flower">✿</span></div><article className="letter-paper"><span className="paper-stamp">S ♡ S</span>{site.letter.map((paragraph, i) => <p key={i}>{paragraph}</p>)}<p className="letter-signoff">With love,<br /><em>{site.from}</em></p></article></div></section>
          <section id="wish" className="wish-section section-wrap"><div className="section-heading"><SectionLabel>Chapter five · make a wish</SectionLabel><h2>Close your eyes.<br /><em>Make a wish.</em></h2><p>Twenty three candles for a beautiful new year.</p></div><div className={`cake-scene ${candlesOut ? 'candles-out' : ''}`} aria-label={candlesOut ? 'Birthday cake with candles blown out' : 'Birthday cake with lit candles'}><div className="cake-number">23</div><div className="cake-candles">{Array.from({ length: 5 }, (_, i) => <div className="candle" key={i}><span className="flame" /><span className="wick" /></div>)}</div><div className="cake-top" /><div className="cake-layer layer-one"><span className="cake-icing" /></div><div className="cake-layer layer-two"><span className="cake-icing" /></div><div className="cake-plate" /></div><div className="wish-buttons">{audioAvailable && <button className="secondary-button" onClick={() => void playAudio(true)}><Music2 size={18} /> Play birthday song 🎵</button>}<button className="primary-button" onClick={() => { setCandlesOut(true); triggerBurst(); }}>Blow out the candles 🎂</button></div>{candlesOut && <div className="wish-reveal" role="status"><p>{site.wish}</p><button className="text-button" onClick={() => setCandlesOut(false)}>Light the candles again ↗</button></div>}</section>
          <section id="final" className="final-section"><div className="final-stars" aria-hidden="true">✦ &nbsp; ✧ &nbsp; ✦</div><SectionLabel>One last thing…</SectionLabel><h2>{giftOpened ? 'Here is to everything ahead.' : 'There is still more to come.'}</h2><button className={`gift-box ${giftOpened ? 'gift-open' : ''}`} onClick={() => setGiftOpened(true)} aria-label="Open the final gift" disabled={giftOpened}><span className="gift-lid" /><span className="gift-body"><Gift size={64} strokeWidth={1} /></span></button>{giftOpened ? <motion.div className="final-reveal" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}><p className="final-message">{site.final}</p><div className="portfolio-surprise"><span>A surprise within the surprise</span><p>{site.portfolio.message}</p>{/^https?:\/\//.test(site.portfolio.url) && <a className="portfolio-link" href={site.portfolio.url} target="_blank" rel="noopener noreferrer">{site.portfolio.buttonLabel} <ArrowRight size={18} /></a>}</div></motion.div> : <p className="final-hint">Tap the gift, my love.</p>}<div className="final-line" /><p className="made-with-love">Made with love by <strong>{site.from}</strong>, just for you.</p><span className="final-date">18 SEPTEMBER 2026</span></section>
        </main>
        <footer className="site-footer"><span>For {site.partner}, always ♡</span><button onClick={() => scrollToId('birthday')}>Back to the beginning ↑</button></footer>
        {audioAvailable && <div className="floating-music" aria-label="Music controls"><button onClick={toggleAudio} aria-label={playing ? 'Pause music' : 'Play music'}>{playing ? <Pause size={17} /> : <Play size={17} />}</button><span className="music-equalizer" aria-hidden="true"><i /><i /><i /></span><span className="music-label">Birthday song</span><button onClick={() => setMuted(!muted)} aria-label={muted ? 'Unmute music' : 'Mute music'}>{muted ? <VolumeX size={17} /> : <Volume2 size={17} />}</button><input aria-label="Music volume" type="range" min="0" max="1" step="0.05" value={volume} onChange={e => setVolume(Number(e.target.value))} /></div>}
        {audioMessage && <p className="audio-message" role="status">{audioMessage}</p>}
      </motion.div>}
    </AnimatePresence>
    <AnimatePresence>{lightboxIndex !== null && enriched[lightboxIndex] && <motion.div className="lightbox" role="dialog" aria-modal="true" aria-label={`Photo ${lightboxIndex + 1} of ${enriched.length}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.2 }} onMouseDown={e => { if (e.target === e.currentTarget) closeLightbox(); }} onTouchStart={e => touchStart.current = e.touches[0].clientX} onTouchEnd={e => { if (touchStart.current !== null && Math.abs(e.changedTouches[0].clientX - touchStart.current) > 45) setLightboxIndex(i => i === null ? null : (i + (e.changedTouches[0].clientX < touchStart.current! ? 1 : -1) + enriched.length) % enriched.length); touchStart.current = null; }}><div className="lightbox-top"><span>{String(lightboxIndex + 1).padStart(2, '0')} / {String(enriched.length).padStart(2, '0')}</span><button ref={lightboxClose} onClick={closeLightbox} aria-label="Close photo"><X size={25} /></button></div><button className="lightbox-nav lightbox-prev" onClick={() => setLightboxIndex((lightboxIndex - 1 + enriched.length) % enriched.length)} aria-label="Previous photo"><ArrowLeft size={24} /></button><div className="lightbox-image"><Image src={enriched[lightboxIndex].src} alt={enriched[lightboxIndex].caption || `Photo of ${site.partner}`} width={enriched[lightboxIndex].width} height={enriched[lightboxIndex].height} sizes="100vw" priority /></div><button className="lightbox-nav lightbox-next" onClick={() => setLightboxIndex((lightboxIndex + 1) % enriched.length)} aria-label="Next photo"><ArrowRight size={24} /></button>{enriched[lightboxIndex].caption && <p className="lightbox-caption">{enriched[lightboxIndex].caption}</p>}</motion.div>}</AnimatePresence>
  </>;
}
