/** Retire le splash HTML (#splash, public/index.html) : fondu puis suppression du DOM. */
export function hideSplash(): void {
  if (typeof document === 'undefined') return;
  const el = document.getElementById('splash');
  if (!el) return;
  el.classList.add('splash-hide');
  setTimeout(() => el.remove(), 250);
}
