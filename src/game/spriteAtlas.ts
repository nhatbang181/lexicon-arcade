// Sprite Atlas for Kenney Roguelike Spritesheet
// Tiles are 16x16 pixels with 1px margin (17px step)

export interface SpriteDef {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const TILE_STEP = 17;
export const TILE_SIZE = 16;

function s(col: number, row: number): SpriteDef {
  return {
    x: col * TILE_STEP,
    y: row * TILE_STEP,
    w: TILE_SIZE,
    h: TILE_SIZE
  };
}

export const SPRITES = {
  // Terrain & Environment
  FLOOR: s(1, 1),
  FLOOR_ALT: s(2, 1),
  WALL_TOP: s(1, 0),
  WALL_FRONT: s(1, 2),
  WALL_CORNER_TL: s(0, 0),
  WALL_CORNER_TR: s(2, 0),
  WALL_CORNER_BL: s(0, 2),
  WALL_CORNER_BR: s(2, 2),
  COLUMN: s(4, 3),
  DOOR_CLOSED: s(4, 9),
  DOOR_OPEN: s(5, 9),
  STAIRS_DOWN: s(3, 6),
  CHEST_CLOSED: s(8, 8),
  CHEST_OPEN: s(9, 8),

  // Player Heroes
  HERO_KNIGHT: s(0, 4),
  HERO_MAGE: s(1, 4),
  HERO_ROGUE: s(2, 4),

  // Monsters
  SLIME: s(11, 8),
  BAT: s(12, 8),
  SKELETON: s(0, 6),
  ORC: s(2, 6),
  GHOST: s(3, 6),
  NECROMANCER: s(4, 6),
  BOSS_DEMON: s(5, 6),

  // Pickups & Items
  GEM_BLUE: s(18, 4),
  GEM_RED: s(19, 4),
  GEM_GOLD: s(20, 4),
  POTION_RED: s(33, 8),
  POTION_BLUE: s(34, 8),
  SWORD: s(32, 8),
  SHIELD: s(35, 8),
  ORB_MAGIC: s(21, 4),
  SCROLL: s(28, 8)
};

export type SpriteKey = keyof typeof SPRITES;
