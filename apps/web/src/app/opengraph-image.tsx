import { ImageResponse } from 'next/og';

/**
 * Branded social share card (Slack, X/Twitter, LinkedIn, iMessage, …).
 * Next.js wires this file into both `og:image` and `twitter:image`
 * automatically, and reuses it for every route that doesn't override it.
 */
export const alt = 'Namo — gentle, ASQ-based developmental check-ins for children aged 0–6';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const CHIPS = ['ASQ-based screening', 'Ages 0–6 years', 'Private & secure'];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
          padding: '70px 80px',
          backgroundColor: '#fbf6ec',
          backgroundImage:
            'radial-gradient(1100px 640px at 0% 0%, rgba(217,118,43,0.22), transparent 62%), radial-gradient(940px 620px at 100% 100%, rgba(47,116,104,0.20), transparent 60%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Soft decorative orbs (Satori has no blur — kept subtle and low-opacity). */}
        <div
          style={{
            position: 'absolute',
            top: -150,
            right: -130,
            width: 380,
            height: 380,
            borderRadius: 380,
            backgroundColor: 'rgba(232,159,99,0.30)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -160,
            left: -120,
            width: 340,
            height: 340,
            borderRadius: 340,
            backgroundColor: 'rgba(159,195,187,0.32)',
            display: 'flex',
          }}
        />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: 74,
              height: 74,
              borderRadius: 20,
              backgroundColor: '#d9762b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: 42,
              fontWeight: 700,
            }}
          >
            N
          </div>
          <div style={{ marginLeft: 22, fontSize: 42, fontWeight: 700, color: '#3a332b' }}>
            Namo
          </div>
        </div>

        {/* Eyebrow + headline + subline */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                border: '2px solid rgba(217,118,43,0.40)',
                backgroundColor: 'rgba(255,255,255,0.72)',
                color: '#bd5f1f',
                fontSize: 22,
                fontWeight: 600,
                borderRadius: 999,
                padding: '11px 24px',
                letterSpacing: 1.5,
              }}
            >
              EARLY CHILDHOOD DEVELOPMENT, MADE GENTLE
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 30 }}>
            <div
              style={{
                display: 'flex',
                fontSize: 66,
                fontWeight: 700,
                color: '#3a332b',
                letterSpacing: -1.5,
                lineHeight: 1.12,
              }}
            >
              <span style={{ display: 'flex' }}>{'Watch your child '}</span>
              <span style={{ display: 'flex', color: '#bd5f1f' }}>bloom,</span>
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 66,
                fontWeight: 700,
                color: '#3a332b',
                letterSpacing: -1.5,
                lineHeight: 1.18,
              }}
            >
              one milestone at a time.
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              marginTop: 26,
              fontSize: 29,
              color: '#837868',
              lineHeight: 1.4,
              maxWidth: 880,
            }}
          >
            Trusted developmental check-ins — warm, ten-minute, and clear — so no
            milestone goes unnoticed.
          </div>
        </div>

        {/* Trust chips */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {CHIPS.map((chip) => (
            <div
              key={chip}
              style={{
                display: 'flex',
                alignItems: 'center',
                marginRight: 16,
                padding: '12px 24px',
                borderRadius: 999,
                backgroundColor: '#ffffff',
                border: '1px solid #ecdfca',
                fontSize: 24,
                fontWeight: 500,
                color: '#5f574b',
              }}
            >
              {chip}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
