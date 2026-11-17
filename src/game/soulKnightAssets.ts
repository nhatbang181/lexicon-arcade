// Asset loader for genuine Soul Knight (0x72) pixel art

export interface ImageCache {
  [path: string]: HTMLImageElement;
}

export class SoulKnightAssets {
  private cache: ImageCache = {};
  private loadedCount: number = 0;
  private totalCount: number = 0;
  private isAllLoaded: boolean = false;

  private paths: string[] = [
    // Knight
    '/assets/soul_knight/knight/idle_0.png',
    '/assets/soul_knight/knight/idle_1.png',
    '/assets/soul_knight/knight/idle_2.png',
    '/assets/soul_knight/knight/idle_3.png',
    '/assets/soul_knight/knight/run_0.png',
    '/assets/soul_knight/knight/run_1.png',
    '/assets/soul_knight/knight/run_2.png',
    '/assets/soul_knight/knight/run_3.png',

    // Monsters
    '/assets/soul_knight/monsters/skeleton_idle_0.png',
    '/assets/soul_knight/monsters/skeleton_idle_1.png',
    '/assets/soul_knight/monsters/skeleton_run_0.png',
    '/assets/soul_knight/monsters/skeleton_run_1.png',
    '/assets/soul_knight/monsters/goblin_idle_0.png',
    '/assets/soul_knight/monsters/goblin_idle_1.png',
    '/assets/soul_knight/monsters/goblin_run_0.png',
    '/assets/soul_knight/monsters/goblin_run_1.png',
    '/assets/soul_knight/monsters/ogre_idle_0.png',
    '/assets/soul_knight/monsters/ogre_idle_1.png',
    '/assets/soul_knight/monsters/ogre_run_0.png',
    '/assets/soul_knight/monsters/ogre_run_1.png',
    '/assets/soul_knight/monsters/boss_idle_0.png',
    '/assets/soul_knight/monsters/boss_idle_1.png',
    '/assets/soul_knight/monsters/boss_run_0.png',
    '/assets/soul_knight/monsters/boss_run_1.png',

    // Weapons
    '/assets/soul_knight/weapons/sword_knight.png',
    '/assets/soul_knight/weapons/sword_katana.png',
    '/assets/soul_knight/weapons/sword_anime.png',
    '/assets/soul_knight/weapons/staff_red.png',
    '/assets/soul_knight/weapons/staff_green.png',
    '/assets/soul_knight/weapons/bow.png',
    '/assets/soul_knight/weapons/arrow.png',
    '/assets/soul_knight/weapons/hammer.png',
    '/assets/soul_knight/weapons/axe.png',

    // Tiles
    '/assets/soul_knight/tiles/floor_1.png',
    '/assets/soul_knight/tiles/floor_2.png',
    '/assets/soul_knight/tiles/floor_3.png',
    '/assets/soul_knight/tiles/floor_4.png',
    '/assets/soul_knight/tiles/wall_mid.png',
    '/assets/soul_knight/tiles/wall_top_mid.png',
    '/assets/soul_knight/tiles/wall_left.png',
    '/assets/soul_knight/tiles/wall_right.png',
    '/assets/soul_knight/tiles/wall_side_top_left.png',
    '/assets/soul_knight/tiles/wall_side_top_right.png',

    // Items
    '/assets/soul_knight/items/chest_closed.png',
    '/assets/soul_knight/items/chest_open.png',
    '/assets/soul_knight/items/coin_0.png',
    '/assets/soul_knight/items/coin_1.png'
  ];

  constructor() {
    if (typeof window !== 'undefined') {
      this.totalCount = this.paths.length;
      for (const p of this.paths) {
        const img = new Image();
        img.src = p;
        img.onload = () => {
          this.loadedCount++;
          if (this.loadedCount >= this.totalCount) {
            this.isAllLoaded = true;
          }
        };
        this.cache[p] = img;
      }
    }
  }

  public get(path: string): HTMLImageElement | null {
    return this.cache[path] || null;
  }

  public isLoaded(): boolean {
    return this.isAllLoaded || this.loadedCount > 15;
  }
}

export const soulKnightAssets = new SoulKnightAssets();
