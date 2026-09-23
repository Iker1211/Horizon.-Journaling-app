/**
 * Chinese Zodiac Logos — Colección completa de los 12 signos del horóscopo chino
 * Diseñados con estética táctil Clay 3D y tokens oficiales (GEMINI.md).
 *
 * Ubicación: src/components/
 */

export { RatLogo } from './RatLogo';
export { OxLogo } from './OxLogo';
export { TigerLogo } from './TigerLogo';
export { RabbitLogo } from './RabbitLogo';
export { DragonLogo } from './DragonLogo';
export { SnakeLogo } from './SnakeLogo';
export { HorseLogo } from './HorseLogo';
export { FireGoatLogo, HorizonGoatLogo, Clay2027Logo, ClayLogo } from './FireGoatLogo';
export { MonkeyLogo } from './MonkeyLogo';
export { RoosterLogo } from './RoosterLogo';
export { DogLogo } from './DogLogo';
export { PigLogo } from './PigLogo';

export type ChineseZodiacSign =
  | 'rat'
  | 'ox'
  | 'tiger'
  | 'rabbit'
  | 'dragon'
  | 'snake'
  | 'horse'
  | 'goat'
  | 'monkey'
  | 'rooster'
  | 'dog'
  | 'pig';

export interface ZodiacAnimalMeta {
  key: ChineseZodiacSign;
  nameEs: string;
  nameEn: string;
  chineseChar: string;
  pinyin: string;
  elementDefault?: string;
}

export const CHINESE_ZODIAC_ANIMALS: ZodiacAnimalMeta[] = [
  { key: 'rat', nameEs: 'Rata', nameEn: 'Rat', chineseChar: '鼠', pinyin: 'Shǔ' },
  { key: 'ox', nameEs: 'Buey', nameEn: 'Ox', chineseChar: '牛', pinyin: 'Niú' },
  { key: 'tiger', nameEs: 'Tigre', nameEn: 'Tiger', chineseChar: '虎', pinyin: 'Hǔ' },
  { key: 'rabbit', nameEs: 'Conejo', nameEn: 'Rabbit', chineseChar: '兔', pinyin: 'Tù' },
  { key: 'dragon', nameEs: 'Dragón', nameEn: 'Dragon', chineseChar: '龙', pinyin: 'Lóng' },
  { key: 'snake', nameEs: 'Serpiente', nameEn: 'Snake', chineseChar: '蛇', pinyin: 'Shé' },
  { key: 'horse', nameEs: 'Caballo', nameEn: 'Horse', chineseChar: '马', pinyin: 'Mǎ' },
  { key: 'goat', nameEs: 'Cabra', nameEn: 'Goat / Sheep', chineseChar: '羊', pinyin: 'Yáng' },
  { key: 'monkey', nameEs: 'Mono', nameEn: 'Monkey', chineseChar: '猴', pinyin: 'Hóu' },
  { key: 'rooster', nameEs: 'Gallo', nameEn: 'Rooster', chineseChar: '鸡', pinyin: 'Jī' },
  { key: 'dog', nameEs: 'Perro', nameEn: 'Dog', chineseChar: '狗', pinyin: 'Gǒu' },
  { key: 'pig', nameEs: 'Cerdo', nameEn: 'Pig / Boar', chineseChar: '猪', pinyin: 'Zhū' },
];
