export const TILE_PX = 32;

export const TileType = {
  VOID: 0,
  FLOOR: 1,
  WALL: 2,
  COLUMN: 3,
  CHEST: 4,
  DOOR: 5
} as const;

export type TileType = typeof TileType[keyof typeof TileType];

export interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DungeonData {
  width: number; // in tiles
  height: number;
  tiles: TileType[][];
  rooms: Room[];
  spawnPoint: { x: number; y: number }; // in pixels
  chests: { x: number; y: number; id: string; opened: boolean }[];
}

export function generateDungeon(width: number = 48, height: number = 48): DungeonData {
  // Initialize grid with WALL
  const tiles: TileType[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => TileType.WALL)
  );

  const rooms: Room[] = [];
  const roomCount = 8;
  const minSize = 6;
  const maxSize = 12;

  for (let i = 0; i < roomCount; i++) {
    const w = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
    const h = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
    const x = Math.floor(Math.random() * (width - w - 4)) + 2;
    const y = Math.floor(Math.random() * (height - h - 4)) + 2;

    const newRoom: Room = { x, y, w, h };

    // Check overlap with existing rooms (with padding)
    let overlap = false;
    for (const r of rooms) {
      if (
        x <= r.x + r.w + 1 &&
        x + w + 1 >= r.x &&
        y <= r.y + r.h + 1 &&
        y + h + 1 >= r.y
      ) {
        overlap = true;
        break;
      }
    }

    if (!overlap) {
      rooms.push(newRoom);
      // Carve floor
      for (let ry = y; ry < y + h; ry++) {
        for (let rx = x; rx < x + w; rx++) {
          tiles[ry][rx] = TileType.FLOOR;
        }
      }
    }
  }

  // Connect rooms with corridors
  for (let i = 0; i < rooms.length - 1; i++) {
    const r1 = rooms[i];
    const r2 = rooms[i + 1];

    let cx1 = Math.floor(r1.x + r1.w / 2);
    let cy1 = Math.floor(r1.y + r1.h / 2);
    const cx2 = Math.floor(r2.x + r2.w / 2);
    const cy2 = Math.floor(r2.y + r2.h / 2);

    // Horizontal then vertical
    while (cx1 !== cx2) {
      tiles[cy1][cx1] = TileType.FLOOR;
      tiles[cy1 + 1][cx1] = TileType.FLOOR; // 2-wide corridor
      cx1 += cx1 < cx2 ? 1 : -1;
    }
    while (cy1 !== cy2) {
      tiles[cy1][cx1] = TileType.FLOOR;
      tiles[cy1][cx1 + 1] = TileType.FLOOR;
      cy1 += cy1 < cy2 ? 1 : -1;
    }
  }

  // Spawn in first room center
  const firstRoom = rooms[0] || { x: 5, y: 5, w: 6, h: 6 };
  const spawnPoint = {
    x: (firstRoom.x + Math.floor(firstRoom.w / 2)) * TILE_PX,
    y: (firstRoom.y + Math.floor(firstRoom.h / 2)) * TILE_PX
  };

  // Place chests in rooms
  const chests: { x: number; y: number; id: string; opened: boolean }[] = [];
  for (let i = 1; i < rooms.length; i++) {
    const r = rooms[i];
    const chestX = (r.x + Math.floor(r.w / 2)) * TILE_PX;
    const chestY = (r.y + Math.floor(r.h / 2)) * TILE_PX;
    chests.push({
      x: chestX,
      y: chestY,
      id: `chest_${i}`,
      opened: false
    });
  }

  return {
    width,
    height,
    tiles,
    rooms,
    spawnPoint,
    chests
  };
}

export function isWalkable(dungeon: DungeonData, pixelX: number, pixelY: number): boolean {
  const tileX = Math.floor(pixelX / TILE_PX);
  const tileY = Math.floor(pixelY / TILE_PX);

  if (tileX < 0 || tileX >= dungeon.width || tileY < 0 || tileY >= dungeon.height) {
    return false;
  }

  return dungeon.tiles[tileY][tileX] === TileType.FLOOR;
}
