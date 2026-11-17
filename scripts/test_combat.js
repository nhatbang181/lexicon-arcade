import { EnemyManager } from '../src/game/enemyManager.ts';
import { WeaponManager } from '../src/game/weaponManager.ts';
import { generateDungeon } from '../src/game/dungeonGenerator.ts';

function testCombatAndWeapons() {
  const dungeon = generateDungeon(30, 30);
  const em = new EnemyManager();
  const wm = new WeaponManager();

  const mockVocab = [
    { id: '1', word: 'curriculum', meaning: 'chuong trinh', definition: 'courses', collocations: [], example: 'test', synonyms: [], pos: 'noun', ipa: '', realmId: 'education' }
  ];

  // Spawn initial enemies
  em.update(1.5, dungeon.spawnPoint.x, dungeon.spawnPoint.y, dungeon, mockVocab);
  if (em.enemies.length === 0) {
    throw new Error("EnemyManager failed to spawn enemies");
  }
  console.log(`✓ Enemies spawned: ${em.enemies.length} active foes`);

  // Test weapon damage
  let damaged = false;
  wm.update(0.8, dungeon.spawnPoint.x, dungeon.spawnPoint.y, em.enemies, (idx, dmg) => {
    damaged = true;
    em.enemies[idx].hp -= dmg;
  });

  // Test kill and gem drop
  const gem = em.killEnemy(0);
  if (!gem || em.gems.length === 0) {
    throw new Error("Failed to drop EXP gem upon enemy death");
  }
  console.log(`✓ Enemy killed and dropped ${gem.type} EXP gem at (${gem.x}, ${gem.y})`);

  console.log("All Task 3 enemy and weapon mechanics passed!");
}

testCombatAndWeapons();
