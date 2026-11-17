import { SPRITES } from '../src/game/spriteAtlas.ts';

function testSprites() {
  const SHEET_W = 968;
  const SHEET_H = 526;
  
  let count = 0;
  for (const [key, def] of Object.entries(SPRITES)) {
    if (def.x < 0 || def.x + def.w > SHEET_W) {
      throw new Error(`Sprite ${key} X overflow: ${def.x} + ${def.w} > ${SHEET_W}`);
    }
    if (def.y < 0 || def.y + def.h > SHEET_H) {
      throw new Error(`Sprite ${key} Y overflow: ${def.y} + ${def.h} > ${SHEET_H}`);
    }
    count++;
  }
  
  console.log(`✓ All ${count} sprite coordinates verified cleanly within 968x526 spritesheet boundaries!`);
}

testSprites();
