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

const KaraokeCaption: React.FC<{ text: string; accent: string; durationFrames: number }> = ({
  text,
  accent,
  durationFrames
}) => {
  const frame = useCurrentFrame();
  const words = (text || '').split(' ').filter(Boolean);
  const activeIndex = Math.min(
    words.length - 1,
    Math.floor(interpolate(frame, [0, Math.max(10, durationFrames - 8)], [0, words.length], { extrapolateRight: 'clamp' }))
  );

  return (
    <div
      style={{
        fontSize: 52,
        fontWeight: 800,
        textAlign: 'center',
        lineHeight: 1.28,
        padding: '0 68px',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
    >
      {words.map((w, i) => {
        const forcedHighlight = w.startsWith('*') && w.endsWith('*');
        const isCurrentSpoken = i === activeIndex;
        const cleanWord = w.split('*').join('');
        return (
          <span
            key={i}
            style={{
              color: forcedHighlight || isCurrentSpoken ? accent : '#ffffff',
              transform: isCurrentSpoken ? 'scale(1.08)' : 'scale(1)',
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

const SceneWidget: React.FC<{ scene: any; theme: any; brand: any }> = ({ scene, theme, brand }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 13, stiffness: 120 } });
  const data = scene.widget_data || {};
  const items: string[] = Array.isArray(data.items) ? data.items : [];

  const cardStyle: React.CSSProperties = {
    width: 880,
    backgroundColor: theme.card_bg,
    border: `3px solid ${theme.card_border}`,
    borderRadius: 30,
    padding: 46,
    boxShadow: '0 32px 74px rgba(0,0,0,0.58)',
    transform: `scale(${interpolate(pop, [0, 1], [0.86, 1])})`,
    position: 'relative',
    overflow: 'hidden'
  };

  if (scene.widget_type === 'JAIL_TRAP') {
    const barDrop = spring({ frame: frame - 6, fps, config: { damping: 12, stiffness: 110 } });
    return (
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#ef4444' }} />
          <div style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#f59e0b' }} />
          <div style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#10b981' }} />
          <span style={{ fontSize: 24, color: theme.text_muted, marginLeft: 12 }}>{brand.website_url}</span>
        </div>
        <div style={{ fontSize: 42, fontWeight: 900, color: theme.text_primary, marginBottom: 28 }}>
          {data.card_title || brand.company_name}
        </div>
        {items.map((it, idx) => (
          <div
            key={idx}
            style={{
              height: 68,
              backgroundColor: theme.bg,
              borderRadius: 14,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              padding: '0 26px',
              color: theme.text_muted,
              fontSize: 28,
              fontWeight: 600
            }}
          >
            {it}
          </div>
        ))}
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
            <div
              key={b}
              style={{
                width: 22,
                height: '100%',
                backgroundColor: '#d1d5db',
                boxShadow: '6px 0 16px rgba(0,0,0,0.65)'
              }}
            />
          ))}
        </div>
        {data.badge_text && (
          <div
            style={{
              position: 'absolute',
              bottom: 34,
              right: 34,
              backgroundColor: theme.accent,
              color: '#fff',
              padding: '14px 34px',
              borderRadius: 16,
              fontSize: 34,
              fontWeight: 900,
              boxShadow: '0 12px 30px rgba(0,0,0,0.5)'
            }}
          >
            ▲ {data.badge_text}
          </div>
        )}
      </div>
    );
  }

  if (scene.widget_type === 'BIG_STAT_COUNTER' || scene.widget_type === 'ALARM_SHOCK') {
    const shake = Math.sin(frame * 0.8) * (frame < 25 ? 8 : 0);
    return (
      <div style={{ ...cardStyle, textAlign: 'center', padding: '75px 44px', transform: `translateX(${shake}px) scale(${interpolate(pop, [0, 1], [0.85, 1])})` }}>
        <div style={{ fontSize: 30, letterSpacing: 4, color: theme.text_muted, textTransform: 'uppercase', marginBottom: 24, fontWeight: 700 }}>
          {data.card_title || 'MAXIMUM RISK IMPACT'}
        </div>
        <div style={{ fontSize: 124, fontWeight: 900, color: theme.accent, lineHeight: 1.05, marginBottom: 24 }}>
          {data.big_number || '₹250 Cr'}
        </div>
        <div style={{ fontSize: 40, fontWeight: 800, color: theme.text_primary }}>
          {data.badge_text || items[0] || ''}
        </div>
      </div>
    );
  }

  if (scene.widget_type === 'MULTI_SITE_WARNING') {
    return (
      <div style={{ width: 880, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {(items.length ? items : ['Store.in', 'Clinic.in', 'Agency.in', 'Startup.in', 'Coach.in', 'Brand.in']).slice(0, 6).map((site, i) => {
          const itemPop = spring({ frame: frame - i * 4, fps, config: { damping: 12 } });
          return (
            <div
              key={i}
              style={{
                backgroundColor: theme.card_bg,
                border: `3px solid ${theme.accent}`,
                borderRadius: 22,
                padding: '32px 26px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transform: `scale(${itemPop})`
              }}
            >
              <div>
                <div style={{ fontSize: 22, color: theme.text_muted }}>https://</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: theme.text_primary }}>{site}</div>
              </div>
              <div style={{ fontSize: 42, color: theme.accent, fontWeight: 900 }}>⚠️</div>
            </div>
          );
        })}
      </div>
    );
  }

  if (scene.widget_type === 'TIMELINE_DEADLINE') {
    const steps = items.length >= 3 ? items.slice(0, 3) : ['PAST', 'AAJ', 'DEADLINE'];
    return (
      <div style={cardStyle}>
        <div style={{ fontSize: 34, fontWeight: 800, color: theme.text_primary, textAlign: 'center', marginBottom: 40 }}>
          {data.card_title || 'Compliance Timeline'}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', marginBottom: 46 }}>
          <div style={{ position: 'absolute', top: '50%', left: 40, right: 40, height: 8, backgroundColor: theme.accent, zIndex: 0 }} />
          {steps.map((st, i) => (
            <div key={i} style={{ zIndex: 2, textAlign: 'center', backgroundColor: theme.card_bg, padding: '8px 16px', borderRadius: 16 }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: i === 2 ? theme.accent : theme.text_primary, marginBottom: 12 }}>{st}</div>
              <div style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: i === 2 ? theme.accent : theme.text_primary, margin: '0 auto' }} />
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center' }}>
          <span
            style={{
              border: `5px solid ${theme.accent}`,
              color: theme.accent,
              padding: '12px 42px',
              borderRadius: 16,
              fontSize: 38,
              fontWeight: 900,
              display: 'inline-block',
              transform: 'rotate(-5deg)'
            }}
          >
            {data.badge_text || 'ACTION REQUIRED'}
          </span>
        </div>
      </div>
    );
  }

  if (scene.widget_type === 'NUMBERED_GRID_INTRO') {
    const nums = [1, 2, 3, 4, 5, 6, 7, 8];
    return (
      <div style={{ width: 860, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
        {nums.map((n, idx) => {
          const boxPop = spring({ frame: frame - idx * 3, fps, config: { damping: 12 } });
          return (
            <div
              key={n}
              style={{
                height: 180,
                backgroundColor: idx === 0 ? theme.accent_soft : theme.card_bg,
                border: `3px solid ${idx === 0 ? theme.accent : theme.card_border}`,
                borderRadius: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 64,
                fontWeight: 900,
                color: idx === 0 ? theme.accent : theme.text_primary,
                transform: `scale(${boxPop})`
              }}
            >
              {n}
            </div>
          );
        })}
      </div>
    );
  }

  if (scene.widget_type === 'TOGGLE_COMPARISON') {
    return (
      <div style={cardStyle}>
        <div style={{ fontSize: 36, fontWeight: 800, color: theme.text_primary, marginBottom: 28, textAlign: 'center' }}>
          {data.card_title || 'Right vs Wrong Setup'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={{ backgroundColor: 'rgba(239,68,68,0.12)', border: '3px solid #ef4444', borderRadius: 22, padding: 28 }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: '#ef4444', marginBottom: 16 }}>✗ GALAT TARIKA</div>
            <div style={{ fontSize: 28, color: theme.text_primary, fontWeight: 700 }}>{items[0] || 'Outdated Setup'}</div>
          </div>
          <div style={{ backgroundColor: theme.accent_soft, border: `3px solid ${theme.accent}`, borderRadius: 22, padding: 28 }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: theme.accent, marginBottom: 16 }}>✓ SAHI SYSTEM</div>
            <div style={{ fontSize: 28, color: theme.text_primary, fontWeight: 700 }}>{items[1] || 'Compliant Setup'}</div>
          </div>
        </div>
      </div>
    );
  }

  if (scene.widget_type === 'BROWSER_SECURITY_LOCK') {
    const locked = frame > 25;
    return (
      <div style={cardStyle}>
        <div
          style={{
            backgroundColor: theme.bg,
            border: `3px solid ${locked ? '#10b981' : theme.accent}`,
            borderRadius: 50,
            padding: '24px 36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 32
          }}
        >
          <span style={{ fontSize: 36, fontWeight: 900, color: locked ? '#10b981' : theme.accent }}>
            {locked ? '🔒 https://' : '⚠️ http://'}
            <span style={{ color: theme.text_primary }}>{brand.website_url}</span>
          </span>
          <span style={{ backgroundColor: locked ? '#10b981' : theme.accent, color: '#fff', padding: '8px 22px', borderRadius: 30, fontSize: 24, fontWeight: 800 }}>
            {locked ? 'ENCRYPTED' : 'UNSAFE'}
          </span>
        </div>
        {items.map((it, i) => (
          <div key={i} style={{ fontSize: 30, fontWeight: 700, color: theme.text_primary, marginBottom: 14 }}>
            🛡️ {it}
          </div>
        ))}
      </div>
    );
  }

  if (scene.widget_type === 'FLOWCHART_ALERT') {
    return (
      <div style={cardStyle}>
        <div style={{ backgroundColor: theme.accent, color: '#fff', padding: '22px 36px', borderRadius: 20, fontSize: 38, fontWeight: 900, textAlign: 'center', marginBottom: 34 }}>
          🚨 {data.card_title || 'INCIDENT DETECTED'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 26 }}>
          {items.slice(0, 2).map((target, idx) => (
            <div key={idx} style={{ backgroundColor: theme.bg, border: `2px dashed ${theme.accent}`, borderRadius: 20, padding: 28, textAlign: 'center' }}>
              <div style={{ fontSize: 24, color: theme.text_muted, marginBottom: 10 }}>STEP 0{idx + 1}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: theme.text_primary }}>{target}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (scene.widget_type === 'CTA_SHARE_DM_BRAND') {
    return (
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: 28, color: theme.text_muted }}>🔒 https://{brand.website_url}</span>
          <span style={{ backgroundColor: theme.accent, color: '#fff', padding: '10px 24px', borderRadius: 12, fontSize: 26, fontWeight: 800 }}>
            🛡️ {data.badge_text || '100% READY'}
          </span>
        </div>
        <div style={{ fontSize: 48, fontWeight: 900, color: theme.text_primary, marginBottom: 22 }}>
          {brand.company_name}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 30 }}>
          {items.map((tag, i) => (
            <span
              key={i}
              style={{
                backgroundColor: theme.accent_soft,
                border: `2px solid ${theme.accent}`,
                color: theme.text_primary,
                padding: '12px 24px',
                borderRadius: 14,
                fontSize: 26,
                fontWeight: 700
              }}
            >
              ✓ {tag}
            </span>
          ))}
        </div>
        {videoData.enable_comment_cta ? (
          <div
            style={{
              backgroundColor: theme.bg,
              padding: '24px 32px',
              borderRadius: 50,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: `3px solid ${theme.accent}`
            }}
          >
            <span style={{ fontSize: 34, fontWeight: 900, color: theme.text_primary }}>
              Comment: &ldquo;{videoData.comment_keyword}&rdquo;
            </span>
            <span style={{ backgroundColor: theme.accent, padding: '14px 28px', borderRadius: 40, color: '#fff', fontWeight: 900, fontSize: 26 }}>
              SEEDHA DM MEIN ➤
            </span>
          </div>
        ) : (
          <div style={{ fontSize: 32, fontWeight: 800, color: theme.accent, textAlign: 'center', padding: '18px 0' }}>
            📞 {brand.contact_info} • {brand.website_url}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 40, fontWeight: 900, color: theme.text_primary }}>{data.card_title || brand.website_url}</div>
          <div style={{ fontSize: 24, color: theme.text_muted }}>{brand.website_url}</div>
        </div>
        {data.badge_text && (
          <span style={{ backgroundColor: theme.accent, color: '#fff', padding: '10px 26px', borderRadius: 14, fontSize: 26, fontWeight: 800 }}>
            {data.badge_text}
          </span>
        )}
      </div>
      {items.map((item, idx) => {
        const itemPop = spring({ frame: frame - idx * 8, fps, config: { damping: 14 } });
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
              opacity: itemPop,
              transform: `translateX(${interpolate(itemPop, [0, 1], [-45, 0])}px)`
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: theme.accent,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
                fontWeight: 900,
                marginRight: 22,
                flexShrink: 0
              }}
            >
              ✓
            </div>
            <span style={{ fontSize: 32, fontWeight: 700, color: theme.text_primary }}>{item}</span>
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

      <div style={{ position: 'absolute', top: 0, left: 0, height: 12, width: `${progressPercent}%`, backgroundColor: theme.accent, zIndex: 50 }} />

      <div style={{ position: 'absolute', top: 105, width: '100%', textAlign: 'center', zIndex: 20 }}>
        <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: 4, color: theme.text_primary }}>
          <span style={{ color: theme.accent }}>&gt; </span>
          {brand.company_name}
        </div>
      </div>

      {videoData.scenes.map((scene: any, idx: number) => {
        const sceneFrames = Math.max(45, Math.round((Number(scene.duration_sec) || 5) * fps));
        const fromFrame = currentStartFrame;
        currentStartFrame += sceneFrames;

        return (
          <Sequence key={idx} from={fromFrame} durationInFrames={sceneFrames}>
            <AbsoluteFill style={{ justifyContent: 'space-between', alignItems: 'center', paddingTop: 220, paddingBottom: 170 }}>
              <div style={{ textAlign: 'center', padding: '0 56px' }}>
                {scene.pill_badge && (
                  <div
                    style={{
                      display: 'inline-block',
                      backgroundColor: '#ffffff',
                      color: '#111111',
                      padding: '10px 30px',
                      borderRadius: 40,
                      fontSize: 26,
                      fontWeight: 900,
                      letterSpacing: 2,
                      marginBottom: 24
                    }}
                  >
                    <span style={{ backgroundColor: theme.accent, color: '#fff', padding: '4px 14px', borderRadius: 20, marginRight: 12 }}>
                      {scene.pill_badge.split(' ')[0]}
                    </span>
                    {scene.pill_badge.split(' ').slice(1).join(' ')}
                  </div>
                )}
                <div style={{ fontSize: 62, fontWeight: 900, color: theme.text_primary, lineHeight: 1.18 }}>
                  {scene.headline_white}
                  <br />
                  <span style={{ color: theme.accent }}>{scene.headline_accent}</span>
                </div>
              </div>

              <SceneWidget scene={scene} theme={theme} brand={brand} />

              <KaraokeCaption text={scene.caption_hinglish || ''} accent={theme.accent} durationFrames={sceneFrames} />
            </AbsoluteFill>
          </Sequence>
        );
      })}

      <Sequence from={currentStartFrame} durationInFrames={75}>
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg }}>
          <div style={{ fontSize: 96, fontWeight: 900, color: theme.accent, letterSpacing: 6 }}>
            &gt; {brand.company_name}
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: theme.text_primary, letterSpacing: 5, marginTop: 22 }}>
            {brand.slogan}
          </div>
          <div style={{ fontSize: 28, color: theme.text_muted, marginTop: 30 }}>
            {brand.website_url} • {brand.contact_info}
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
