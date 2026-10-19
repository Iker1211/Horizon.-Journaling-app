import type { AvatarCharacterId } from '../types';

export const DEFAULT_AVATAR_CHARACTER: AvatarCharacterId = 'otter';
export const AVATAR_CHARACTERS = [
  { id: 'otter', name: 'Nutria', src: '/images/characters/otter.svg' },
  { id: 'yak', name: 'Yak', src: '/images/characters/yak.svg' },
  { id: 'pterodactyl', name: 'Pterodáctilo', src: '/images/characters/pterodactyl.svg' },
  { id: 'bear', name: 'Oso', src: '/images/characters/bear.svg' },
  { id: 'penguin', name: 'Pingüino', src: '/images/characters/penguin.svg' },
] as const;

export function isAvatarCharacterId(value: unknown): value is AvatarCharacterId {
  return AVATAR_CHARACTERS.some(character => character.id === value);
}

export function resolveAvatarCharacter(id?: AvatarCharacterId | null, photoUrl?: string | null) {
  return AVATAR_CHARACTERS.find(character => character.id === id) || (photoUrl ? null : AVATAR_CHARACTERS[0]);
}
