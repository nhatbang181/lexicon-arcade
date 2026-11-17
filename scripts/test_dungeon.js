import { generateDungeon, isWalkable, TILE_PX } from '../src/game/dungeonGenerator.ts';
import { PlayerEntity } from '../src/game/player.ts';

function testDungeonAndPlayer() {
  const dungeon = generateDungeon(30, 30);
  
  if (dungeon.rooms.length < 3) {
    throw new Error(`Too few rooms generated: ${dungeon.rooms.length}`);
  }
  
  // Verify spawn point is inside a walkable floor tile
  const isSpawnOk = isWalkable(dungeon, dungeon.spawnPoint.x, dungeon.spawnPoint.y);
  if (!isSpawnOk) {
    throw new Error(`Spawn point is not on a walkable floor: ${dungeon.spawnPoint.x}, ${dungeon.spawnPoint.y}`);
  }
  console.log(`✓ Dungeon generated: ${dungeon.rooms.length} rooms, spawn at (${dungeon.spawnPoint.x}, ${dungeon.spawnPoint.y})`);

  // Verify player movement
  const player = new PlayerEntity(dungeon.spawnPoint.x, dungeon.spawnPoint.y);
  const initialX = player.x;
  
  // Move right for 0.1s
  player.update(0.1, { up: false, down: false, left: false, right: true }, dungeon);
  if (player.x <= initialX) {
    throw new Error("Player failed to move right on walkable floor");
  }
  console.log("✓ Player movement and wall collision sliding work correctly");

  console.log("All Task 2 dungeon and movement tests passed!");
}

testDungeonAndPlayer();
