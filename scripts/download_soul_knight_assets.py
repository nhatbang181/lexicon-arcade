import urllib.request
import os
import sys

BASE_URL = 'https://raw.githubusercontent.com/SARdude54/DungeonRPG/master/'

ASSETS_TO_DOWNLOAD = {
  # Knight (Player)
  'knight/idle_0.png': 'assets/Entities/knight/male/idle/knight_m_idle_anim_f0.png',
  'knight/idle_1.png': 'assets/Entities/knight/male/idle/knight_m_idle_anim_f1.png',
  'knight/idle_2.png': 'assets/Entities/knight/male/idle/knight_m_idle_anim_f2.png',
  'knight/idle_3.png': 'assets/Entities/knight/male/idle/knight_m_idle_anim_f3.png',
  'knight/run_0.png': 'assets/Entities/knight/male/run/knight_m_run_anim_f0.png',
  'knight/run_1.png': 'assets/Entities/knight/male/run/knight_m_run_anim_f1.png',
  'knight/run_2.png': 'assets/Entities/knight/male/run/knight_m_run_anim_f2.png',
  'knight/run_3.png': 'assets/Entities/knight/male/run/knight_m_run_anim_f3.png',

  # Wizard
  'wizard/idle_0.png': 'assets/Entities/wizard/idle/wizzard_m_idle_anim_f0.png',
  'wizard/idle_1.png': 'assets/Entities/wizard/idle/wizzard_m_idle_anim_f1.png',
  'wizard/run_0.png': 'assets/Entities/wizard/run/wizzard_m_run_anim_f0.png',
  'wizard/run_1.png': 'assets/Entities/wizard/run/wizzard_m_run_anim_f1.png',

  # Elf
  'elf/idle_0.png': 'assets/Entities/elf/female/idle/elf_f_idle_anim_f0.png',
  'elf/idle_1.png': 'assets/Entities/elf/female/idle/elf_f_idle_anim_f1.png',
  'elf/run_0.png': 'assets/Entities/elf/female/run/elf_f_run_anim_f0.png',
  'elf/run_1.png': 'assets/Entities/elf/female/run/elf_f_run_anim_f1.png',

  # Monsters - Skeleton
  'monsters/skeleton_idle_0.png': 'assets/Entities/skeleton/idle/skelet_idle_anim_f0.png',
  'monsters/skeleton_idle_1.png': 'assets/Entities/skeleton/idle/skelet_idle_anim_f1.png',
  'monsters/skeleton_run_0.png': 'assets/Entities/skeleton/run/skelet_run_anim_f0.png',
  'monsters/skeleton_run_1.png': 'assets/Entities/skeleton/run/skelet_run_anim_f1.png',

  # Monsters - Goblin
  'monsters/goblin_idle_0.png': 'assets/Entities/goblin/idle/goblin_idle_anim_f0.png',
  'monsters/goblin_idle_1.png': 'assets/Entities/goblin/idle/goblin_idle_anim_f1.png',
  'monsters/goblin_run_0.png': 'assets/Entities/goblin/run/goblin_run_anim_f0.png',
  'monsters/goblin_run_1.png': 'assets/Entities/goblin/run/goblin_run_anim_f1.png',

  # Monsters - Necromancer
  'monsters/necro_idle_0.png': 'assets/Entities/necromancer/idle/necromancer_anim_f0.png',
  'monsters/necro_idle_1.png': 'assets/Entities/necromancer/idle/necromancer_anim_f1.png',
  'monsters/necro_run_0.png': 'assets/Entities/necromancer/run/necromancer_run_anim_f0.png',
  'monsters/necro_run_1.png': 'assets/Entities/necromancer/run/necromancer_run_anim_f1.png',

  # Monsters - Ogre
  'monsters/ogre_idle_0.png': 'assets/Entities/ogre/idle/ogre_idle_anim_f0.png',
  'monsters/ogre_idle_1.png': 'assets/Entities/ogre/idle/ogre_idle_anim_f1.png',
  'monsters/ogre_run_0.png': 'assets/Entities/ogre/run/ogre_run_anim_f0.png',
  'monsters/ogre_run_1.png': 'assets/Entities/ogre/run/ogre_run_anim_f1.png',

  # Monsters - Big Demon (Boss)
  'monsters/boss_idle_0.png': 'assets/Entities/BigDemon/idle/big_demon_idle_anim_f0.png',
  'monsters/boss_idle_1.png': 'assets/Entities/BigDemon/idle/big_demon_idle_anim_f1.png',
  'monsters/boss_run_0.png': 'assets/Entities/BigDemon/run/big_demon_run_anim_f0.png',
  'monsters/boss_run_1.png': 'assets/Entities/BigDemon/run/big_demon_run_anim_f1.png',

  # Weapons
  'weapons/sword_knight.png': 'assets/items/weapon/weapon_knight_sword.png',
  'weapons/sword_anime.png': 'assets/items/weapon/weapon_anime_sword.png',
  'weapons/sword_katana.png': 'assets/items/weapon/weapon_katana.png',
  'weapons/staff_green.png': 'assets/items/weapon/weapon_green_magic_staff.png',
  'weapons/staff_red.png': 'assets/items/weapon/weapon_red_magic_staff.png',
  'weapons/bow.png': 'assets/items/weapon/weapon_bow.png',
  'weapons/arrow.png': 'assets/items/weapon/weapon_arrow.png',
  'weapons/hammer.png': 'assets/items/weapon/weapon_big_hammer.png',
  'weapons/axe.png': 'assets/items/weapon/weapon_axe.png',

  # Tiles - Floors
  'tiles/floor_1.png': 'assets/tiles/floors/floor_1.png',
  'tiles/floor_2.png': 'assets/tiles/floors/floor_2.png',
  'tiles/floor_3.png': 'assets/tiles/floors/floor_3.png',
  'tiles/floor_4.png': 'assets/tiles/floors/floor_4.png',

  # Tiles - Walls
  'tiles/wall_mid.png': 'assets/tiles/wall/wall_mid.png',
  'tiles/wall_top_mid.png': 'assets/tiles/wall/wall_top_mid.png',
  'tiles/wall_left.png': 'assets/tiles/wall/wall_left.png',
  'tiles/wall_right.png': 'assets/tiles/wall/wall_right.png',
  'tiles/wall_side_top_left.png': 'assets/tiles/wall/wall_side_top_left.png',
  'tiles/wall_side_top_right.png': 'assets/tiles/wall/wall_side_top_right.png',

  # Items & Chest
  'items/chest_closed.png': 'assets/items/chest/chest_empty_open_anim_f0.png',
  'items/chest_open.png': 'assets/items/chest/chest_empty_open_anim_f2.png',
  'items/coin_0.png': 'assets/items/coin/coin_anim_f0.png',
  'items/coin_1.png': 'assets/items/coin/coin_anim_f1.png',
  'items/potion_red.png': 'assets/items/potion/flask_red.png',
  'items/potion_blue.png': 'assets/items/potion/flask_blue.png'
}

def download_all():
    target_base = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'soul_knight')
    os.makedirs(target_base, exist_ok=True)
    
    total = len(ASSETS_TO_DOWNLOAD)
    success = 0

    for local_subpath, remote_path in ASSETS_TO_DOWNLOAD.items():
        full_dest = os.path.join(target_base, local_subpath)
        os.makedirs(os.path.dirname(full_dest), exist_ok=True)
        url = BASE_URL + remote_path
        try:
            urllib.request.urlretrieve(url, full_dest)
            success += 1
        except Exception as e:
            print(f"Failed {local_subpath}: {e}")

    print(f"Downloaded {success}/{total} Soul Knight 0x72 assets successfully into {target_base}!")

if __name__ == '__main__':
    download_all()
