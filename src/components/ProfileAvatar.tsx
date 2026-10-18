import type { AvatarCharacterId } from '../types';
import { resolveAvatarCharacter } from '../utils/avatarCharacters';

export function ProfileAvatar({ characterId, photoUrl, className = '', alt = '' }: {
  characterId?: AvatarCharacterId | null; photoUrl?: string | null; className?: string; alt?: string;
}) {
  const character = resolveAvatarCharacter(characterId, photoUrl);
  return <img className={`${character ? 'avatar-figurine' : 'avatar-personal-photo'} ${className}`}
    src={character?.src || photoUrl!} data-character={character?.id} alt={alt} width={400} height={400} decoding="async" draggable={false} />;
}
