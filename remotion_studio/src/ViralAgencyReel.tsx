import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  spring,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  staticFile
} from 'remotion';
import videoData from './video_data.json';

// Renders 3-4 word phrase chunks where ONLY *starred* keyword is highlighted in Red/Accent (Exact Rinisha Style)
const PhraseCaption: React.FC<{ captions: string[]; accent: string; durationFrames: number }> = ({
  captions,
  accent,
  durationFrames
}) => {
  const frame = useCurrentFrame();
  const safeList = captions && captions.length > 0 ? captions : [''];
  const chunkDuration = Math.max(10, Math.floor(durationFrames / safeList.length));
  const activeIdx = Math.min(safeList.length - 1, Math.floor(frame / chunkDuration));
  const currentPhrase = safeList[activeIdx] || '';

  const localFrame = frame - activeIdx * chunkDuration;
  const opacity = interpolate(localFrame, [0, 5], [0.25, 1], { extrapolateRight: 'clamp' });
  const translateY = interpolate(localFrame, [0, 6], [10, 0], { extrapolateRight: 'clamp' });

  const words = currentPhrase.split(' ').filter(Boolean);

  return (
    <div
      style={{
        fontSize: 52,
        fontWeight: 900,
        textAlign: 'center',
        lineHeight: 1.25,
        padding: '0 64px',
        opacity,
        transform: `translateY(${translateY}px)`,
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
    >
      {words.map((w, i) => {
        const isAccent = w.includes('*');
        const cleanWord = w.split('*').join('');
        return (
          <span
            key={i}
            style={{
              color: isAccent ? accent : '#ffffff',
              marginRight: 14,
              display: 'inline-block'
            }}
          >
            {cleanWord}
          </span>
        );
      })}
    </div>
  );
};

// Frame-by-frame cloned UI widgets from ecolatur_20261113_1.mp4
const SceneWidget: React.FC<{ scene: any; theme: any; brand: any; durationFrames: number }> = ({
  scene,
  theme,
  brand,
  durationFrames
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 130 } });
  const data = scene.widget_data || {};
  const items: string[] = Array.isArray(data.items) ? data.items : [];

  const cardStyle: React.CSSProperties = {
    width: 880,
    backgroundColor: theme.card_bg,
    border: `3px solid ${theme.card_border}`,
    borderRadius: 28,
    padding: 46,
    boxShadow: '0 32px 74px rgba(0,0,0,0.6)',
    transform: `scale(${interpolate(pop, [0, 1], [0.9, 1])})`,
    position: 'relative',
    overflow: 'hidden'
  };

  // 1. JAIL_TRAP (00:00 - 00:05)
  if (scene.widget_type === 'JAIL_TRAP') {
    const barDrop = spring({ frame: frame - 12, fps, config: { damping: 13, stiffness: 120 } });
    const badgePop = spring({ frame: frame - 35, fps, config: { damping: 12 } });
    return (
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, backgroundColor: '#18181d', padding: '14px 22px', borderRadius: 14 }}>
          <div style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#ef4444' }} />
          <div style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#f59e0b' }} />
          <div style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#10b981' }} />
          <span style={{ fontSize: 22, color: theme.text_muted, marginLeft: 12, fontFamily: 'monospace' }}>{brand.website_url}</span>
        </div>
        <div style={{ fontSize: 40, fontWeight: 900, color: theme.text_primary, marginBottom: 22 }}>
          {data.card_title || 'Aapka Business'}
        </div>
        <div style={{ width: 220, height: 48, backgroundColor: theme.accent, borderRadius: 24, marginBottom: 32 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ height: 68, backgroundColor: theme.bg, borderRadius: 14, border: `2px solid ${theme.card_border}`, display: 'flex', alignItems: 'center', padding: '0 24px', color: theme.text_muted, fontSize: 24, fontFamily: 'monospace' }}>
            {items[0] || 'NAAM'}
          </div>
          <div style={{ height: 68, backgroundColor: theme.bg, borderRadius: 14, border: `2px solid ${theme.card_border}`, display: 'flex', alignItems: 'center', padding: '0 24px', color: theme.text_muted, fontSize: 24, fontFamily: 'monospace' }}>
            {items[1] || 'PHONE'}
          </div>
        </div>
        {/* Dropping Jail Bars */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            justifyContent: 'space-evenly',
            transform: `translateY(${interpolate(barDrop, [0, 1], [-700, 0])}px)`
          }}
        >
          {[0, 1, 2, 3, 4, 5].map((b) => (
            <div key={b} style={{ width: 20, height: '100%', backgroundColor: '#e5e7eb', boxShadow: '6px 0 18px rgba(0,0,0,0.75)' }} />
          ))}
        </div>
        {/* Red Warning Badge */}
        <div
          style={{
            position: 'absolute',
            bottom: 34,
            right: 34,
            backgroundColor: theme.accent,
            color: '#fff',
            padding: '14px 34px',
            borderRadius: 16,
            fontSize: 32,
            fontWeight: 900,
            transform: `scale(${badgePop})`,
            boxShadow: '0 14px 30px rgba(0,0,0,0.6)'
          }}
        >
          ▲ {data.badge_text || 'GALTI'}
        </div>
      </div>
    );
  }

  // 2. ALARM_SHOCK (00:06 - 00:09)
  if (scene.widget_type === 'ALARM_SHOCK') {
    const ringShake = Math.sin(frame * 1.3) * 10;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            width: 310,
            height: 310,
            borderRadius: 155,
            border: '16px solid #e5e7eb',
            backgroundColor: theme.card_bg,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `rotate(${ringShake}deg) scale(${pop})`,
            boxShadow: '0 30px 70px rgba(0,0,0,0.6)'
          }}
        >
          <div style={{ width: 12, height: 95, backgroundColor: '#ffffff', position: 'absolute', top: 55, borderRadius: 6 }} />
          <div
            style={{
              width: 12,
              height: 80,
              backgroundColor: theme.accent,
              position: 'absolute',
              top: 70,
              borderRadius: 6,
              transformOrigin: 'bottom center',
              transform: `rotate(${interpolate(frame, [0, durationFrames], [15, 135])}deg)`
            }}
          />
          <div style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: theme.accent, zIndex: 5 }} />
        </div>
      </div>
    );
  }

  // 3. BIG_STAT_COUNTER (00:10 - 00:11) -> Animated Counter + Slammed Stamp
  if (scene.widget_type === 'BIG_STAT_COUNTER') {
    const rawNumStr = String(data.big_number || '₹250');
    const numericMatch = rawNumStr.match(/\d+/);
    const targetVal = numericMatch ? parseInt(numericMatch[0], 10) : 250;
    const currentVal = Math.round(interpolate(frame, [0, Math.min(28, durationFrames - 10)], [0, targetVal], { extrapolateRight: 'clamp' }));
    const formattedMain = numericMatch ? rawNumStr.replace(/\d+/, String(currentVal)) : rawNumStr;
    const stampPop = spring({ frame: frame - 22, fps, config: { damping: 10, stiffness: 160 } });

    return (
      <div style={{ textAlign: 'center', width: 900 }}>
        <div style={{ fontSize: 28, letterSpacing: 4, color: theme.text_muted, textTransform: 'uppercase', marginBottom: 24, fontFamily: 'monospace' }}>
          {data.card_title || 'MAXIMUM IMPACT'}
        </div>
        <div style={{ fontSize: 168, fontWeight: 900, color: theme.accent, lineHeight: 1.0 }}>
          {formattedMain}
        </div>
        <div style={{ fontSize: 78, fontWeight: 900, color: '#ffffff', marginTop: 10, marginBottom: 38 }}>
          {items[0] || 'crore'}
        </div>
        <div
          style={{
            display: 'inline-block',
            border: `5px solid ${theme.accent}`,
            color: theme.accent,
            padding: '12px 48px',
            borderRadius: 16,
            fontSize: 44,
            fontWeight: 900,
            letterSpacing: 4,
            transform: `scale(${stampPop}) rotate(-5deg)`
          }}
        >
          {data.badge_text || 'PENALTY'}
        </div>
      </div>
    );
  }

  // 4. BROWSER_FORM_SCAN (00:12 - 00:17) -> Form + Pixel + Database Cylinder
  if (scene.widget_type === 'BROWSER_FORM_SCAN') {
    const showPixel = frame > Math.floor(durationFrames * 0.35);
    const showDb = frame > Math.floor(durationFrames * 0.55);
    return (
      <div style={{ width: 920, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        <div style={{ ...cardStyle, width: 610, padding: 36 }}>
          <div style={{ fontSize: 20, color: theme.text_muted, marginBottom: 18, fontFamily: 'monospace' }}>{brand.website_url}/contact</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', marginBottom: 22 }}>{data.card_title || 'Contact us'}</div>
          {(items.length ? items : ['NAAM', 'PHONE', 'EMAIL']).slice(0, 3).map((field, idx) => {
            const fPop = spring({ frame: frame - idx * 8, fps, config: { damping: 14 } });
            return (
              <div
                key={idx}
                style={{
                  height: 62,
                  backgroundColor: theme.bg,
                  border: `2px solid ${theme.card_border}`,
                  borderRadius: 12,
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 20px',
                  color: theme.text_muted,
                  fontSize: 22,
                  fontFamily: 'monospace',
                  opacity: fPop
                }}
              >
                {field}
              </div>
            );
          })}
          <div style={{ height: 64, backgroundColor: theme.accent, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 28, fontWeight: 800, marginTop: 18 }}>
            Submit
          </div>
        </div>

        <div style={{ width: 270, display: 'flex', flexDirection: 'column', gap: 28 }}>
          {showPixel && (
            <div style={{ backgroundColor: theme.card_bg, border: `2px solid ${theme.card_border}`, borderRadius: 18, padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', fontFamily: 'monospace' }}>&lt;/&gt; PIXEL</div>
              <div style={{ fontSize: 20, color: theme.text_muted, marginTop: 8 }}>HAR VISITOR TRACK</div>
            </div>
          )}
          {showDb && (
            <div style={{ backgroundColor: theme.card_bg, border: `3px solid ${theme.accent}`, borderRadius: 22, padding: 26, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🗄️</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', fontFamily: 'monospace' }}>PERSONAL DATA</div>
              <div style={{ fontSize: 18, color: theme.accent, fontWeight: 800, marginTop: 6 }}>{data.badge_text || 'TRACKED'}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 5. MULTI_SITE_WARNING (00:18 - 00:21) -> 6 Cards + MON-SUN Daily X Tracker
  if (scene.widget_type === 'MULTI_SITE_WARNING') {
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    return (
      <div style={{ width: 880 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 34 }}>
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const cPop = spring({ frame: frame - idx * 4, fps, config: { damping: 12 } });
            return (
              <div
                key={idx}
                style={{
                  height: 150,
                  backgroundColor: theme.card_bg,
                  border: `2px solid ${theme.card_border}`,
                  borderRadius: 18,
                  padding: 20,
                  position: 'relative',
                  transform: `scale(${cPop})`
                }}
              >
                <div style={{ width: '65%', height: 14, backgroundColor: '#52525b', borderRadius: 7, marginBottom: 14 }} />
                <div style={{ width: '40%', height: 10, backgroundColor: '#3f3f46', borderRadius: 5 }} />
                <div style={{ position: 'absolute', top: 14, right: 14, backgroundColor: theme.accent, color: '#fff', width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900 }}>
                  !
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          {days.map((d, i) => {
            const activeRed = frame > 15 + i * 6;
            return (
              <div
                key={d}
                style={{
                  flex: 1,
                  height: 105,
                  backgroundColor: theme.card_bg,
                  border: `3px solid ${activeRed ? theme.accent : theme.card_border}`,
                  borderRadius: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span style={{ fontSize: 20, color: theme.text_muted, fontFamily: 'monospace' }}>{d}</span>
                <span style={{ fontSize: 32, fontWeight: 900, color: theme.accent, marginTop: 4 }}>{activeRed ? '✕' : ''}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 6. TIMELINE_DEADLINE (00:26 - 00:30)
  if (scene.widget_type === 'TIMELINE_DEADLINE') {
    const lineFill = interpolate(frame, [5, durationFrames - 15], [0, 100], { extrapolateRight: 'clamp' });
    const stampPop = spring({ frame: frame - Math.floor(durationFrames * 0.55), fps, config: { damping: 11 } });
    const steps = items.length >= 3 ? items : ['NOV 2025', 'AAJ', 'MAY 2027'];
    return (
      <div style={{ width: 880, padding: '40px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 22, fontSize: 28, fontWeight: 900, fontFamily: 'monospace' }}>
          <span style={{ color: theme.text_muted }}>{steps[0]}</span>
          <span style={{ color: '#ffffff' }}>{steps[1]}</span>
          <span style={{ color: theme.accent }}>{steps[2]}</span>
        </div>
        <div style={{ height: 10, backgroundColor: theme.card_border, borderRadius: 5, position: 'relative', marginBottom: 38 }}>
          <div style={{ height: '100%', width: `${lineFill}%`, backgroundColor: theme.accent, borderRadius: 5 }} />
          <div style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.accent, position: 'absolute', right: 0, top: -11 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 30 }}>
          <div style={{ backgroundColor: '#ffffff', color: '#111111', padding: '14px 36px', borderRadius: 40, fontSize: 28, fontWeight: 900, fontFamily: 'monospace' }}>
            🕒 {data.card_title || 'URGENT DEADLINE'}
          </div>
          <div style={{ border: `4px solid ${theme.accent}`, color: theme.accent, padding: '10px 36px', borderRadius: 14, fontSize: 36, fontWeight: 900, transform: `scale(${stampPop}) rotate(-6deg)` }}>
            {data.badge_text || 'LAAGU'}
          </div>
        </div>
      </div>
    );
  }

  // 7. NUMBERED_GRID_INTRO (00:31 - 00:33)
  if (scene.widget_type === 'NUMBERED_GRID_INTRO') {
    const nums = [1, 2, 3, 4, 5, 6, 7, 8];
    return (
      <div style={{ width: 860, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 22 }}>
        {nums.map((n, idx) => {
          const boxPop = spring({ frame: frame - idx * 3, fps, config: { damping: 12 } });
          return (
            <div
              key={n}
              style={{
                height: 175,
                backgroundColor: theme.card_bg,
                border: `3px solid ${idx === 6 ? theme.accent : theme.card_border}`,
                borderRadius: 22,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${boxPop})`
              }}
            >
              <span style={{ fontSize: 56, fontWeight: 900, color: '#fff' }}>{n}</span>
              <div style={{ width: 28, height: 28, borderRadius: 6, border: '3px solid #71717a', marginTop: 12 }} />
            </div>
          );
        })}
      </div>
    );
  }

  // 8. TOGGLE_COMPARISON (00:43 - 00:50)
  if (scene.widget_type === 'TOGGLE_COMPARISON') {
    return (
      <div style={cardStyle}>
        <div style={{ fontSize: 34, fontWeight: 800, color: theme.text_muted, marginBottom: 28, textAlign: 'center', fontFamily: 'monospace' }}>
          {data.card_title || 'SYSTEM COMPARISON'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: 20, marginBottom: 30 }}>
          <div style={{ backgroundColor: theme.accent, color: '#fff', padding: '24px 42px', borderRadius: 50, fontSize: 34, fontWeight: 900 }}>
            ✓ {items[0] || 'Consent do'}
          </div>
          <div style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff', color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 900 }}>
            =
          </div>
          <div style={{ border: `4px solid ${theme.accent}`, color: '#fff', padding: '24px 42px', borderRadius: 50, fontSize: 34, fontWeight: 900 }}>
            ✕ {items[1] || 'Waapas lo'}
          </div>
        </div>
        <div style={{ textAlign: 'center', fontSize: 26, color: theme.text_muted, letterSpacing: 3, fontFamily: 'monospace' }}>
          {data.badge_text || '1 CLICK MEIN AASAN'}
        </div>
      </div>
    );
  }

  // 9. BROWSER_SECURITY_LOCK (01:29 - 01:32)
  if (scene.widget_type === 'BROWSER_SECURITY_LOCK') {
    const isSecure = frame > Math.floor(durationFrames * 0.3);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 44 }}>
        <div
          style={{
            width: 860,
            backgroundColor: theme.card_bg,
            border: `3px solid ${isSecure ? theme.accent : theme.card_border}`,
            borderRadius: 60,
            padding: '26px 44px',
            display: 'flex',
            alignItems: 'center',
            gap: 20
          }}
        >
          <span style={{ fontSize: 38 }}>{isSecure ? '🔒' : '🔓'}</span>
          <span style={{ fontSize: 40, fontWeight: 900, fontFamily: 'monospace', color: isSecure ? theme.accent : theme.text_muted }}>
            {isSecure ? 'https://' : 'http://'}
            <span style={{ color: '#ffffff' }}>{brand.website_url}</span>
          </span>
        </div>
        <div
          style={{
            width: 240,
            height: 270,
            backgroundColor: isSecure ? theme.accent : theme.card_bg,
            borderRadius: '30px 30px 120px 120px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 110,
            boxShadow: isSecure ? `0 25px 60px ${theme.accent_soft}` : 'none'
          }}
        >
          🔒
        </div>
      </div>
    );
  }

  // 10. FLOWCHART_ALERT (01:33 - 01:38)
  if (scene.widget_type === 'FLOWCHART_ALERT') {
    const showBranches = frame > 15;
    return (
      <div style={{ width: 880, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ backgroundColor: theme.accent, color: '#fff', padding: '18px 48px', borderRadius: 20, fontSize: 38, fontWeight: 900, marginBottom: 40 }}>
          ▲ {data.card_title || 'DATA LEAK'}
        </div>
        {showBranches && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36, width: '100%' }}>
            {(items.length >= 2 ? items.slice(0, 2) : ['Users', 'Regulatory Board']).map((target, idx) => (
              <div key={idx} style={{ backgroundColor: theme.card_bg, border: `3px solid ${theme.accent}`, borderRadius: 24, padding: '36px 28px', textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}>{idx === 0 ? '👥' : '🏛️'}</div>
                <div style={{ fontSize: 34, fontWeight: 900, color: '#fff', marginBottom: 12 }}>{target}</div>
                <div style={{ fontSize: 22, color: theme.accent, fontWeight: 800, fontFamily: 'monospace' }}>➤ NOTIFIED</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 11. CTA_SHARE_DM_BRAND (01:49 - 01:58) -> Typewriter Comment + Compliant Brand Card
  if (scene.widget_type === 'CTA_SHARE_DM_BRAND') {
    const kw = String(videoData.comment_keyword || 'RULES');
    const typedLen = Math.min(kw.length, Math.max(1, Math.floor(interpolate(frame, [8, Math.min(45, durationFrames - 15)], [0, kw.length + 1]))));
    const typedKw = kw.slice(0, typedLen);

    return (
      <div style={{ width: 880, display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
            <span style={{ fontSize: 26, color: theme.text_muted, fontFamily: 'monospace' }}>🔒 https://{brand.website_url}</span>
            <span style={{ backgroundColor: theme.accent, color: '#fff', padding: '10px 26px', borderRadius: 14, fontSize: 26, fontWeight: 900 }}>
              🛡️ {data.badge_text || 'COMPLIANT'}
            </span>
          </div>
          <div style={{ fontSize: 46, fontWeight: 900, color: '#fff', marginBottom: 22 }}>{brand.company_name}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {(items.length ? items : ['SPEED', 'SECURITY', 'SEO', 'CONVERSION']).map((tag, i) => (
              <span key={i} style={{ backgroundColor: theme.accent_soft, border: `2px solid ${theme.accent}`, color: '#fff', padding: '8px 20px', borderRadius: 12, fontSize: 22, fontWeight: 800, fontFamily: 'monospace' }}>
                ✓ {tag}
              </span>
            ))}
          </div>
        </div>

        {videoData.enable_comment_cta && (
          <div style={{ backgroundColor: theme.card_bg, border: `3px solid ${theme.card_border}`, borderRadius: 60, padding: '22px 34px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 40, fontWeight: 900, color: '#fff', fontFamily: 'monospace' }}>
              {typedKw}
              <span style={{ color: theme.accent }}>|</span>
            </span>
            <div style={{ backgroundColor: theme.accent, color: '#fff', padding: '14px 32px', borderRadius: 40, fontSize: 26, fontWeight: 900 }}>
              ➤ SEEDHA DM MEIN
            </div>
          </div>
        )}
      </div>
    );
  }

  // 12. DEFAULT: PROGRESSIVE CHECKLIST CARD (00:35 - 00:42 & others)
  // Items reveal one-by-one synced across the scene's durationFrames!
  const stepInterval = Math.max(12, Math.floor((durationFrames * 0.75) / Math.max(1, items.length)));
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <div>
          <div style={{ fontSize: 42, fontWeight: 900, color: theme.text_primary }}>{data.card_title || brand.company_name}</div>
          <div style={{ fontSize: 22, color: theme.text_muted, fontFamily: 'monospace', marginTop: 4 }}>{brand.website_url}</div>
        </div>
        {data.badge_text && (
          <span style={{ backgroundColor: theme.accent, color: '#fff', padding: '10px 24px', borderRadius: 14, fontSize: 24, fontWeight: 900 }}>
            {data.badge_text}
          </span>
        )}
      </div>
      {items.map((item, idx) => {
        const triggerFrame = 8 + idx * stepInterval;
        const isChecked = frame >= triggerFrame;
        const checkPop = spring({ frame: frame - triggerFrame, fps, config: { damping: 12 } });
        return (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: theme.bg,
              padding: '22px 28px',
              borderRadius: 18,
              marginBottom: 16,
              border: `2px solid ${isChecked ? theme.accent : theme.card_border}`
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: isChecked ? theme.accent : '#27272a',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
                fontWeight: 900,
                marginRight: 22,
                transform: `scale(${isChecked ? Math.max(0.8, checkPop) : 0.85})`
              }}
            >
              {isChecked ? '✓' : ''}
            </div>
            <span style={{ fontSize: 34, fontWeight: 800, color: isChecked ? '#ffffff' : theme.text_muted }}>{item}</span>
          </div>
        );
      })}
    </div>
  );
};

export const ViralAgencyReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const theme = videoData.theme;
  const brand = videoData.brand;

  let currentStartFrame = 0;
  const progressPercent = (frame / durationInFrames) * 100;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg, fontFamily: 'Inter, system-ui, sans-serif' }}>
      {videoData.has_audio && <Audio src={staticFile('voiceover.wav')} />}

      {/* Top Progress Bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, height: 10, width: `${progressPercent}%`, backgroundColor: theme.accent, zIndex: 50 }} />

      {/* Persistent Brand Header */}
      <div style={{ position: 'absolute', top: 105, width: '100%', textAlign: 'center', zIndex: 20 }}>
        <div style={{ fontSize: 46, fontWeight: 900, letterSpacing: 4, color: theme.text_primary }}>
          <span style={{ color: theme.accent }}>&gt; </span>
          {brand.company_name}
        </div>
      </div>

      {/* Beat-Locked Scenes */}
      {videoData.scenes.map((scene: any, idx: number) => {
        const sceneFrames = Math.max(45, Math.round((Number(scene.duration_sec) || 4) * fps));
        const fromFrame = currentStartFrame;
        currentStartFrame += sceneFrames;

        const captionsList: string[] = Array.isArray(scene.captions) && scene.captions.length > 0
          ? scene.captions
          : [scene.caption_hinglish || ''];

        return (
          <Sequence key={idx} from={fromFrame} durationInFrames={sceneFrames}>
            <AbsoluteFill style={{ justifyContent: 'space-between', alignItems: 'center', paddingTop: 215, paddingBottom: 165 }}>
              {/* Upper Context Pill + 2-Line Headline */}
              <div style={{ textAlign: 'center', padding: '0 54px' }}>
                {scene.pill_badge && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      backgroundColor: '#ffffff',
                      color: '#111111',
                      padding: '8px 26px 8px 10px',
                      borderRadius: 40,
                      fontSize: 24,
                      fontWeight: 900,
                      letterSpacing: 2,
                      marginBottom: 24,
                      fontFamily: 'monospace'
                    }}
                  >
                    <span style={{ backgroundColor: theme.accent, color: '#fff', padding: '4px 14px', borderRadius: 20, marginRight: 12 }}>
                      {scene.pill_badge.split(' ')[0]}
                    </span>
                    {scene.pill_badge.split(' ').slice(1).join(' ')}
                  </div>
                )}
                <div style={{ fontSize: 60, fontWeight: 900, color: theme.text_primary, lineHeight: 1.18 }}>
                  {scene.headline_white}
                  <br />
                  <span style={{ color: theme.accent }}>{scene.headline_accent}</span>
                </div>
              </div>

              {/* Center Interactive UI Stage */}
              <SceneWidget scene={scene} theme={theme} brand={brand} durationFrames={sceneFrames} />

              {/* Bottom 3-4 Word Sub-Caption Phrase (Synchronized to Beat) */}
              <PhraseCaption captions={captionsList} accent={theme.accent} durationFrames={sceneFrames} />
            </AbsoluteFill>
          </Sequence>
        );
      })}

      {/* 2.5-Second Brand Outro Card (Matches 01:59 of reference video) */}
      <Sequence from={currentStartFrame} durationInFrames={75}>
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg }}>
          <div style={{ fontSize: 92, fontWeight: 900, color: theme.accent, letterSpacing: 5 }}>
            <span style={{ color: '#ffffff' }}>&gt; </span>
            {brand.company_name}
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: theme.text_primary, letterSpacing: 6, marginTop: 18 }}>
            {brand.slogan}
          </div>
          <div style={{ fontSize: 32, color: '#ffffff', marginTop: 42, fontFamily: 'monospace' }}>
            {brand.website_url}
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
