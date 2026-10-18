import type { AvatarCharacterId } from '../types';

export const DEFAULT_AVATAR_CHARACTER: AvatarCharacterId = 'otter';
export const AVATAR_CHARACTERS = [
  { id: 'otter', name: 'Nutria', note: 'Curiosa, a tu ritmo.', src: '/images/characters/otter.svg' },
  { id: 'yak', name: 'Yak', note: 'Paso firme, corazón tranquilo.', src: '/images/characters/yak.svg' },
  { id: 'pterodactyl', name: 'Pterodáctilo', note: 'Siempre otro horizonte.', src: '/images/characters/pterodactyl.svg' },
  { id: 'bear', name: 'Oso', note: 'Una pausa también cuenta.', src: '/images/characters/bear.svg' },
  { id: 'penguin', name: 'Pingüino', note: 'Pequeños pasos, grandes ideas.', src: '/images/characters/penguin.svg' },
] as const;

export function isAvatarCharacterId(value: unknown): value is AvatarCharacterId {
  return AVATAR_CHARACTERS.some(character => character.id === value);
}

export function resolveAvatarCharacter(id?: AvatarCharacterId | null, photoUrl?: string | null) {
  return AVATAR_CHARACTERS.find(character => character.id === id) || (photoUrl ? null : AVATAR_CHARACTERS[0]);
}
