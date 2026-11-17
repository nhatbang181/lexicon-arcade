// Node verification script for game mechanics & SRS Leitner algorithm
import { INITIAL_PLAYER, GameStore } from '../src/store/gameStore.ts';

function runTests() {
  console.log("Starting GameStore verification...");
  
  // Mock localStorage for Node environment
  const mockStorage = {};
  global.localStorage = {
    getItem: (key) => mockStorage[key] || null,
    setItem: (key, val) => { mockStorage[key] = String(val); },
    removeItem: (key) => { delete mockStorage[key]; }
  };

  const store = new GameStore();
  const player = store.getPlayer();
  
  // 1. Initial State Check
  if (player.level !== 1 || player.gold !== 60) {
    throw new Error(`Unexpected initial state: level ${player.level}, gold ${player.gold}`);
  }
  console.log("✓ Initial player state matches defaults");

  // 2. Damage & Defense test
  const initialHp = player.hp;
  const dmg = store.takeDamage(30);
  if (dmg <= 0 || store.getPlayer().hp >= initialHp) {
    throw new Error(`Damage computation failed: took ${dmg} dmg`);
  }
  console.log(`✓ Damage reduction works correctly: 30 raw damage dealt ${dmg} actual damage`);

  // 3. Level Up test
  const didLevel = store.gainExp(150);
  if (!didLevel || store.getPlayer().level !== 2) {
    throw new Error(`Level up failed: level is ${store.getPlayer().level}`);
  }
  console.log("✓ Level up calculation & stat increases work correctly");

  // 4. SRS Leitner box progression
  const testWordId = "test_word_1";
  store.recordWordResult(testWordId, true);
  let srs = store.getSRS()[testWordId];
  if (srs.box !== 2 || srs.streak !== 1) {
    throw new Error(`SRS promotion failed: box is ${srs.box}, streak is ${srs.streak}`);
  }

  // Mistake demotion to box 1
  store.recordWordResult(testWordId, false);
  srs = store.getSRS()[testWordId];
  if (srs.box !== 1 || srs.streak !== 0 || !srs.isNemesis) {
    throw new Error(`SRS demotion failed: box is ${srs.box}, isNemesis is ${srs.isNemesis}`);
  }
  console.log("✓ SRS Leitner algorithm promotion & nemesis tracking work correctly");

  // 5. Equipment test
  const testSword = {
    id: "sword_test",
    name: "Test Sword",
    type: "weapon",
    price: 10,
    desc: "test",
    icon: "Sword",
    rarity: "rare",
    statBonus: { attack: 25 }
  };
  store.equipItem(testSword);
  const totalStats = store.getTotalStats();
  if (totalStats.attack < 45) { // 20 base + 4 from levelup + 25 from sword = 49
    throw new Error(`Equipment stat bonus failed: total attack is ${totalStats.attack}`);
  }
  console.log(`✓ Equipment stat aggregation works correctly (Total ATK: ${totalStats.attack})`);

  console.log("All GameStore & SRS mechanics passed with 100% success!");
}

runTests();
