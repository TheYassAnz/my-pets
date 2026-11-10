// SheetPair — renders the SAME sheet body inside the iOS and the Android bezel,
// side by side. One markup, two platforms (React Native / Expo).
// Props: label, sheetTitle, step ("2 / 3"), progress (0-1), cta, secondary,
//        single ("ios" | "android"), scroll (bool), children = sheet body.

const { useState, useEffect } = React;

function useFrames() {
  const [, bump] = useState(0);
  useEffect(() => {
    if (window.IOSDevice && window.AndroidDevice) return;
    const t = setInterval(() => {
      if (window.IOSDevice && window.AndroidDevice) { bump(v => v + 1); clearInterval(t); }
    }, 80);
    return () => clearInterval(t);
  }, []);
  return [window.IOSDevice, window.AndroidDevice];
}

function Ghost({ top }) {
  const bar = (w, h, o) => (
    <div style={{ width: w, height: h, borderRadius: 6, background: 'var(--color-neutral-900)', opacity: o }} />
  );
  return (
    <div style={{ position: 'absolute', inset: 0, padding: `${top}px 20px`, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {bar('55%', 22, 1)}
      {bar('34%', 12, .7)}
      <div style={{ height: 8 }} />
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{ height: 54, borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', opacity: .85 }} />
      ))}
    </div>
  );
}

function Sheet({ title, step, progress, cta, secondary, children, bottom }) {
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom, height: '85%',
      background: 'var(--color-surface)', borderRadius: '20px 20px 0 0',
      boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{ display: 'grid', placeItems: 'center', paddingTop: 8, paddingBottom: 2 }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-neutral-700)' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 18px 12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-.01em' }}>{title}</div>
          {step ? <div style={{ fontSize: 11, color: 'var(--color-neutral-500)', marginTop: 2 }}>{step}</div> : null}
        </div>
        <div style={{
          width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center',
          background: 'var(--color-neutral-900)', color: 'var(--color-neutral-400)', flex: 'none',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 5l14 14M19 5 5 19" /></svg>
        </div>
      </div>
      {progress != null ? (
        <div style={{ margin: '0 18px 14px', height: 2, borderRadius: 2, background: 'var(--color-neutral-900)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress * 100}%`, background: 'var(--color-accent)' }} />
        </div>
      ) : null}
      <div style={{ flex: 1, overflow: 'hidden', padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {children}
      </div>
      <div style={{
        padding: '13px 18px 20px', display: 'flex', gap: 9,
        boxShadow: 'inset 0 1px 0 var(--color-divider)', background: 'var(--color-surface)',
      }}>
        {secondary ? <span className="btn btn-secondary" style={{ fontSize: 14 }}>{secondary}</span> : null}
        <span className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', textAlign: 'center', fontSize: 14 }}>{cta || 'Enregistrer'}</span>
      </div>
    </div>
  );
}

function SheetPair(props) {
  const { label, sheetTitle, step, progress, cta, secondary, single, children } = props;
  const [IOS, Android] = useFrames();
  if (!IOS || !Android) {
    return <div style={{ width: 402, height: 874, borderRadius: 44, background: 'var(--color-surface)' }} />;
  }
  const body = (top, bottom) => (
    <div style={{ position: 'relative', height: '100%', background: 'var(--color-bg)', color: 'var(--color-text)', overflow: 'hidden' }}>
      <Ghost top={top} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(9,10,18,.66)' }} />
      <Sheet title={sheetTitle} step={step} progress={progress} cta={cta} secondary={secondary} bottom={bottom}>{children}</Sheet>
    </div>
  );
  const cap = (t) => (
    <div className="dv-cap"><b>{t}</b>{label ? <span> — {label}</span> : null}</div>
  );
  const items = [];
  if (single !== 'android') items.push(<div className="dv-scr" key="i">{cap('iOS')}<IOS dark={true}>{body(58, 0)}</IOS></div>);
  if (single !== 'ios') items.push(<div className="dv-scr" key="a">{cap('Android')}<Android dark={true}>{body(22, 26)}</Android></div>);
  return <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap' }}>{items}</div>;
}

window.SheetPair = SheetPair;
if (typeof module !== 'undefined') module.exports = { SheetPair };
