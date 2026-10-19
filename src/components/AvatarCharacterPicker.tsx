import type { AvatarCharacterId } from '../types';
import { Check, LoaderCircle } from 'lucide-react';
import { AVATAR_CHARACTERS } from '../utils/avatarCharacters';
import { ProfileAvatar } from './ProfileAvatar';

export function AvatarCharacterPicker({ selected, pending = null, disabled = false, onSelect }: {
  selected: AvatarCharacterId | null; pending?: AvatarCharacterId | null; disabled?: boolean;
  onSelect: (id: AvatarCharacterId) => void;
}) {
  return <fieldset className="character-picker" disabled={disabled} aria-describedby="character-picker-note">
    <legend>Elige quién te acompaña</legend>
    <p id="character-picker-note">Un poco de personalidad para tu rincón. Puedes cambiarlo cuando quieras.</p>
    <div className="character-picker-options">
      {AVATAR_CHARACTERS.map(character => <label key={character.id} className={`character-option ${selected === character.id ? 'is-selected' : ''} ${pending === character.id ? 'is-pending' : ''}`}>
        <input type="radio" name="avatar-character" value={character.id} checked={selected === character.id} onChange={() => onSelect(character.id)} aria-label={character.name} />
        <span className="character-option-art"><ProfileAvatar characterId={character.id} />{pending === character.id ? <LoaderCircle className="character-choice-mark profile-spinner" size={16} aria-hidden /> : selected === character.id ? <Check className="character-choice-mark" size={16} aria-hidden /> : null}</span>
        <span className="character-option-name">{character.name}</span>
      </label>)}
    </div>
    {pending && <p className="character-saving" role="status">Guardando tu personaje…</p>}
  </fieldset>;
}
