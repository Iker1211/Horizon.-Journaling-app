import { useCompanionPreference } from '../hooks/useCompanionPreference';

export function CompanionMotionPreference() {
  const { enabled, reducedMotion, changeEnabled } = useCompanionPreference();
  return <label className="companion-preference">
    <input type="checkbox" checked={enabled && !reducedMotion} disabled={reducedMotion} onChange={event => changeEnabled(event.target.checked)} />
    <span><strong>Movimiento del compañero</strong><small>{reducedMotion ? 'El movimiento está desactivado por la preferencia de tu dispositivo.' : 'Pequeños gestos mientras te acompaña. Puedes pausarlos aquí, en este dispositivo.'}</small></span>
  </label>;
}
