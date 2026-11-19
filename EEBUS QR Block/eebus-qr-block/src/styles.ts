// Nutzt die Concorde-Tokens der Journey (CSS-Variablen erben in den Shadow DOM), mit Fallbacks.
export const css = `
:host { display: block; }
.eebus {
  --c-primary: var(--concorde-primary-color, #005eb4);
  --c-text: var(--concorde-text-color, #222);
  --c-muted: var(--concorde-text-secondary-color, #5d6b7a);
  --c-border: var(--concorde-border-color, #d5dce4);
  --c-surface: var(--concorde-surface-color, #fff);
  --c-error: var(--concorde-error-color, #d32f2f);
  --c-success: var(--concorde-success-color, #2e7d32);
  --radius: var(--concorde-border-radius, 8px);
  font-family: var(--concorde-font-family, inherit);
  color: var(--c-text);
  display: flex; flex-direction: column; gap: 12px;
}
.eebus-title { font-weight: 600; font-size: 1rem; }
.eebus-req { color: var(--c-error); }
.eebus-hint { margin: 4px 0 0; color: var(--c-muted); font-size: .875rem; line-height: 1.4; }
.eebus-actions, .eebus-camera, .eebus-manual, .eebus-result { display: flex; flex-direction: column; gap: 8px; }
.eebus-row { display: flex; gap: 8px; flex-wrap: wrap; }
.eebus-btn {
  font: inherit; padding: 10px 16px; border-radius: var(--radius); cursor: pointer;
  border: 1px solid var(--c-primary); background: var(--c-surface); color: var(--c-primary); font-weight: 600;
}
.eebus-btn.primary { background: var(--c-primary); color: #fff; }
.eebus-btn:disabled { opacity: .6; cursor: default; }
.eebus-link { font: inherit; background: none; border: 0; padding: 4px 0; color: var(--c-primary);
  text-decoration: underline; cursor: pointer; align-self: flex-start; font-size: .875rem; }
.eebus-video-wrap { position: relative; width: 100%; max-width: 480px; aspect-ratio: 4/3;
  background: #000; border-radius: var(--radius); overflow: hidden; }
.eebus-video-wrap video { width: 100%; height: 100%; object-fit: cover; }
.eebus-frame { position: absolute; inset: 15% 22%; border: 3px solid rgba(255,255,255,.9);
  border-radius: 12px; box-shadow: 0 0 0 2000px rgba(0,0,0,.35); }
.eebus-field { display: flex; flex-direction: column; gap: 4px; font-size: .8125rem; color: var(--c-muted); }
.eebus-field input, .eebus-field textarea {
  font: inherit; font-size: 1rem; color: var(--c-text); padding: 9px 12px;
  border: 1px solid var(--c-border); border-radius: var(--radius); background: var(--c-surface);
}
.eebus-field input:read-only { background: transparent; }
.eebus-success { color: var(--c-success); font-weight: 600; }
.eebus-card { border: 1px solid var(--c-border); border-radius: var(--radius); padding: 12px 16px; background: var(--c-surface); }
.eebus-card h4 { margin: 0 0 8px; font-size: .9375rem; }
.eebus-card dl { margin: 0; display: grid; grid-template-columns: max-content 1fr; gap: 6px 16px; font-size: .9375rem; }
.eebus-card dt { color: var(--c-muted); }
.eebus-card dd { margin: 0; overflow-wrap: anywhere; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.eebus-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; }
.eebus-error { color: var(--c-error); margin: 0; font-size: .875rem; }
`
