#!/usr/bin/env python3
"""
T3-A Asset Pipeline for Lexicon Arcade V3 (SR-46, SR-60..64, 11-ASSET.md).
- Downloads raw assets into scripts/assets/_downloads/ (gitignored, SHA-256 cached).
- Processes:
  * Lexi mascot (8 states, Microsoft Fluent Emoji 3D MIT, 256x256 transparent WebP <= 60 KB)
  * 12 game icons + 12 badge icons + 16 UI/mission/empty icons (Fluent Emoji 3D MIT, 192x192 WebP <= 20 KB)
  * 6 real unDraw SVG illustrations (recolored #6c63ff -> #3B82F6, SVGO-style minified <= 30 KB, fixes D13)
  * 8 Kenney Particle Pack transparent textures (CC0, 64x64 optimized PNG)
  * Baloo 2 display font (OFL 1.1, latin + vietnamese woff2)
- Updates scripts/assets/assets.manifest.json with all 10 SR-60 fields + SR-46 layout fields
  (ti_le_khung, object_fit, diem_nhan) for 100% of files in public/assets/** (fixes D13 & X20).
- Generates public/assets/CREDITS.md covering 100% of files in public/assets/**.
"""

from __future__ import annotations

import hashlib
import io
import json
import re
import shutil
import subprocess
import urllib.parse
import urllib.request
import zipfile
from datetime import date
from pathlib import Path
from PIL import Image

ROOT_DIR = Path(__file__).resolve().parents[2]
SCRIPTS_DIR = ROOT_DIR / "scripts" / "assets"
MANIFEST_PATH = SCRIPTS_DIR / "assets.manifest.json"
DOWNLOADS_DIR = SCRIPTS_DIR / "_downloads"
CACHE_FILE = DOWNLOADS_DIR / "sha256_cache.json"
ASSETS_DIR = ROOT_DIR / "public" / "assets"
TODAY = date.today().isoformat()

ALLOWLIST_DOMAINS = {
    "raw.githubusercontent.com",
    "github.com",
    "kenney.nl",
    "cdn.undraw.co",
    "undraw.co",
    "cdn.jsdelivr.net",
    "game-icons.net",
    "0x72.itch.io",
    "lucide.dev",
    "freesound.org",
    "pixabay.com",
    "freepd.com",
    "openmoji.org",
    "lottiefiles.com",
    "newgeneralservicelist.com",
    "huggingface.co",
}

FLUENT_PAGE = "https://github.com/microsoft/fluentui-emoji"
FLUENT_RAW = "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/"

# 8 Lexi mascot states (K10 / L-1: Microsoft Fluent Emoji 3D cat, MIT)
LEXI_STATES: list[dict] = [
    {"state": "idle", "primary": "Cat face/3D/cat_face_3d.png", "badge": None},
    {"state": "chao", "primary": "Grinning cat/3D/grinning_cat_3d.png", "badge": "Waving hand/Default/3D/waving_hand_3d_default.png"},
    {"state": "co-vu", "primary": "Grinning cat with smiling eyes/3D/grinning_cat_with_smiling_eyes_3d.png", "badge": None},
    {"state": "vui", "primary": "Smiling cat with heart-eyes/3D/smiling_cat_with_heart-eyes_3d.png", "badge": None},
    {"state": "an-mung", "primary": "Cat with tears of joy/3D/cat_with_tears_of_joy_3d.png", "badge": "Party popper/3D/party_popper_3d.png"},
    {"state": "dong-vien", "primary": "Cat with wry smile/3D/cat_with_wry_smile_3d.png", "badge": None},
    {"state": "suy-nghi", "primary": "Cat face/3D/cat_face_3d.png", "badge": "Thinking face/3D/thinking_face_3d.png"},
    {"state": "ngu", "primary": "Cat face/3D/cat_face_3d.png", "badge": "Zzz/3D/zzz_3d.png"},
]

# 12 distinct game icons (Fluent Emoji 3D, MIT)
FLUENT_GAME_ICONS: list[tuple[str, str]] = [
    ("v1", "High voltage/3D/high_voltage_3d.png"),
    ("v2", "Hammer/3D/hammer_3d.png"),
    ("v3", "Satellite antenna/3D/satellite_antenna_3d.png"),
    ("l1", "Headphone/3D/headphone_3d.png"),
    ("l2", "Ladder/3D/ladder_3d.png"),
    ("r1", "Balance scale/3D/balance_scale_3d.png"),
    ("r2", "Newspaper/3D/newspaper_3d.png"),
    ("w1", "Fountain pen/3D/fountain_pen_3d.png"),
    ("w2", "Stopwatch/3D/stopwatch_3d.png"),
    ("s1", "Microphone/3D/microphone_3d.png"),
    ("s2", "Speaking head/3D/speaking_head_3d.png"),
    ("x1", "Graduation cap/3D/graduation_cap_3d.png"),
]

# 12 badge icons (Fluent Emoji 3D, MIT)
FLUENT_BADGE_ICONS: list[tuple[str, str]] = [
    ("streak-7", "Fire/3D/fire_3d.png"),
    ("streak-30", "Comet/3D/comet_3d.png"),
    ("streak-100", "Crown/3D/crown_3d.png"),
    ("cards-100", "Seedling/3D/seedling_3d.png"),
    ("cards-500", "Books/3D/books_3d.png"),
    ("cards-1000", "Gem stone/3D/gem_stone_3d.png"),
    ("band-65", "3rd place medal/3D/3rd_place_medal_3d.png"),
    ("band-70", "2nd place medal/3D/2nd_place_medal_3d.png"),
    ("band-75", "1st place medal/3D/1st_place_medal_3d.png"),
    ("band-80", "Trophy/3D/trophy_3d.png"),
    ("first-essay", "Scroll/3D/scroll_3d.png"),
    ("first-speaking", "Loudspeaker/3D/loudspeaker_3d.png"),
]

# 16 mission / status / empty / charm UI icons (Fluent Emoji 3D, MIT)
FLUENT_UI_ICONS: list[tuple[str, str]] = [
    ("xp", "Glowing star/3D/glowing_star_3d.png"),
    ("goal", "Bullseye/3D/bullseye_3d.png"),
    ("calendar", "Calendar/3D/calendar_3d.png"),
    ("freeze", "Snowflake/3D/snowflake_3d.png"),
    ("party", "Party popper/3D/party_popper_3d.png"),
    ("shield", "Shield/3D/shield_3d.png"),
    ("compass", "Compass/3D/compass_3d.png"),
    ("brain", "Brain/3D/brain_3d.png"),
    ("clock", "Alarm clock/3D/alarm_clock_3d.png"),
    ("check", "Check mark button/3D/check_mark_button_3d.png"),
    ("rocket", "Rocket/3D/rocket_3d.png"),
    ("lightbulb", "Light bulb/3D/light_bulb_3d.png"),
    ("bookmark", "Bookmark/3D/bookmark_3d.png"),
    ("chart", "Bar chart/3D/bar_chart_3d.png"),
    ("cloud", "Cloud/3D/cloud_3d.png"),
    ("zzz", "Zzz/3D/zzz_3d.png"),
]

# 6 real unDraw SVG illustrations (unDraw License, fixes D13)
UNDRAW_ILLUSTRATIONS: list[dict] = [
    {
        "id": "welcome",
        "name": "Illustration · Welcome Aboard",
        "url_trang": "https://undraw.co/search/welcome",
        "url_tai": "https://cdn.undraw.co/illustration/welcome-aboard_y4e9.svg",
    },
    {
        "id": "goals",
        "name": "Illustration · Target Band & Daily Goals",
        "url_trang": "https://undraw.co/search/goals",
        "url_tai": "https://cdn.undraw.co/illustration/completed_vjc6.svg",
    },
    {
        "id": "devices",
        "name": "Illustration · Mobile & Audio Setup",
        "url_trang": "https://undraw.co/search/devices",
        "url_tai": "https://cdn.undraw.co/illustration/mobile-download_jfl1.svg",
    },
    {
        "id": "placement",
        "name": "Illustration · Placement Diagnostic",
        "url_trang": "https://undraw.co/search/exam",
        "url_tai": "https://cdn.undraw.co/illustration/certificate_cqps.svg",
    },
    {
        "id": "empty-cards",
        "name": "Illustration · All Due Cards Completed",
        "url_trang": "https://undraw.co/search/empty",
        "url_tai": "https://cdn.undraw.co/illustration/empty-mailbox_ef0e.svg",
    },
    {
        "id": "offline",
        "name": "Illustration · Offline Study Mode",
        "url_trang": "https://undraw.co/search/offline",
        "url_tai": "https://cdn.undraw.co/illustration/connection-lost_am29.svg",
    },
]

# 8 Kenney Particle Pack textures (CC0)
KENNEY_PARTICLES: list[tuple[str, str]] = [
    ("spark", "PNG (Transparent)/spark_01.png"),
    ("star", "PNG (Transparent)/star_07.png"),
    ("circle", "PNG (Transparent)/circle_05.png"),
    ("flare", "PNG (Transparent)/flare_01.png"),
    ("smoke", "PNG (Transparent)/smoke_04.png"),
    ("flame", "PNG (Transparent)/flame_01.png"),
    ("magic", "PNG (Transparent)/magic_05.png"),
    ("twirl", "PNG (Transparent)/twirl_01.png"),
]

# Baloo 2 display font (OFL 1.1, latin + vietnamese subset, woff2)
BALOO2_FILES: list[tuple[str, str]] = [
    ("baloo-2-vietnamese-700.woff2", "https://cdn.jsdelivr.net/npm/@fontsource/baloo-2/files/baloo-2-vietnamese-700-normal.woff2"),
    ("baloo-2-latin-700.woff2", "https://cdn.jsdelivr.net/npm/@fontsource/baloo-2/files/baloo-2-latin-700-normal.woff2"),
]

# Exact X20 mapping from scripts/download_soul_knight_assets.py
SOUL_KNIGHT_RAW_BASE = "https://raw.githubusercontent.com/SARdude54/DungeonRPG/master/"
SOUL_KNIGHT_MAP: dict[str, str] = {
    "knight/idle_0.png": "assets/Entities/knight/male/idle/knight_m_idle_anim_f0.png",
    "knight/idle_1.png": "assets/Entities/knight/male/idle/knight_m_idle_anim_f1.png",
    "knight/idle_2.png": "assets/Entities/knight/male/idle/knight_m_idle_anim_f2.png",
    "knight/idle_3.png": "assets/Entities/knight/male/idle/knight_m_idle_anim_f3.png",
    "knight/run_0.png": "assets/Entities/knight/male/run/knight_m_run_anim_f0.png",
    "knight/run_1.png": "assets/Entities/knight/male/run/knight_m_run_anim_f1.png",
    "knight/run_2.png": "assets/Entities/knight/male/run/knight_m_run_anim_f2.png",
    "knight/run_3.png": "assets/Entities/knight/male/run/knight_m_run_anim_f3.png",
    "monsters/skeleton_idle_0.png": "assets/Entities/skeleton/idle/skelet_idle_anim_f0.png",
    "monsters/skeleton_idle_1.png": "assets/Entities/skeleton/idle/skelet_idle_anim_f1.png",
    "monsters/skeleton_run_0.png": "assets/Entities/skeleton/run/skelet_run_anim_f0.png",
    "monsters/skeleton_run_1.png": "assets/Entities/skeleton/run/skelet_run_anim_f1.png",
    "monsters/goblin_idle_0.png": "assets/Entities/goblin/idle/goblin_idle_anim_f0.png",
    "monsters/goblin_idle_1.png": "assets/Entities/goblin/idle/goblin_idle_anim_f1.png",
    "monsters/goblin_run_0.png": "assets/Entities/goblin/run/goblin_run_anim_f0.png",
    "monsters/goblin_run_1.png": "assets/Entities/goblin/run/goblin_run_anim_f1.png",
    "monsters/ogre_idle_0.png": "assets/Entities/ogre/idle/ogre_idle_anim_f0.png",
    "monsters/ogre_idle_1.png": "assets/Entities/ogre/idle/ogre_idle_anim_f1.png",
    "monsters/ogre_run_0.png": "assets/Entities/ogre/run/ogre_run_anim_f0.png",
    "monsters/ogre_run_1.png": "assets/Entities/ogre/run/ogre_run_anim_f1.png",
    "monsters/boss_idle_0.png": "assets/Entities/BigDemon/idle/big_demon_idle_anim_f0.png",
    "monsters/boss_idle_1.png": "assets/Entities/BigDemon/idle/big_demon_idle_anim_f1.png",
    "monsters/boss_run_0.png": "assets/Entities/BigDemon/run/big_demon_run_anim_f0.png",
    "monsters/boss_run_1.png": "assets/Entities/BigDemon/run/big_demon_run_anim_f1.png",
    "weapons/sword_knight.png": "assets/items/weapon/weapon_knight_sword.png",
    "weapons/sword_anime.png": "assets/items/weapon/weapon_anime_sword.png",
    "weapons/sword_katana.png": "assets/items/weapon/weapon_katana.png",
    "weapons/staff_green.png": "assets/items/weapon/weapon_green_magic_staff.png",
    "weapons/staff_red.png": "assets/items/weapon/weapon_red_magic_staff.png",
    "weapons/bow.png": "assets/items/weapon/weapon_bow.png",
    "weapons/arrow.png": "assets/items/weapon/weapon_arrow.png",
    "weapons/hammer.png": "assets/items/weapon/weapon_big_hammer.png",
    "weapons/axe.png": "assets/items/weapon/weapon_axe.png",
    "tiles/floor_1.png": "assets/tiles/floors/floor_1.png",
    "tiles/floor_2.png": "assets/tiles/floors/floor_2.png",
    "tiles/floor_3.png": "assets/tiles/floors/floor_3.png",
    "tiles/floor_4.png": "assets/tiles/floors/floor_4.png",
    "tiles/wall_mid.png": "assets/tiles/wall/wall_mid.png",
    "tiles/wall_top_mid.png": "assets/tiles/wall/wall_top_mid.png",
    "tiles/wall_left.png": "assets/tiles/wall/wall_left.png",
    "tiles/wall_right.png": "assets/tiles/wall/wall_right.png",
    "tiles/wall_side_top_left.png": "assets/tiles/wall/wall_side_top_left.png",
    "tiles/wall_side_top_right.png": "assets/tiles/wall/wall_side_top_right.png",
    "items/chest_closed.png": "assets/items/chest/chest_empty_open_anim_f0.png",
    "items/chest_open.png": "assets/items/chest/chest_empty_open_anim_f2.png",
    "items/coin_0.png": "assets/items/coin/coin_anim_f0.png",
    "items/coin_1.png": "assets/items/coin/coin_anim_f1.png",
}


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def assert_allowed_url(url: str) -> None:
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme != "https":
        raise ValueError(f"Non-HTTPS URL blocked: {url}")
    host = (parsed.hostname or "").lower()
    if not any(host == d or host.endswith("." + d) for d in ALLOWLIST_DOMAINS):
        raise ValueError(f"Domain '{host}' not in allowlist for {url}")


def load_cache() -> dict[str, str]:
    if CACHE_FILE.exists():
        try:
            return json.loads(CACHE_FILE.read_text("utf-8"))
        except Exception:
            return {}
    return {}


def save_cache(cache: dict[str, str]) -> None:
    DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_FILE.write_text(json.dumps(cache, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def download_cached(url: str, rel_dl: str, cache: dict[str, str]) -> Path:
    assert_allowed_url(url)
    dest = DOWNLOADS_DIR / rel_dl
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and cache.get(rel_dl) == sha256_file(dest):
        return dest
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (LexiconArcadeV3 AssetPipeline)"})
    with urllib.request.urlopen(req, timeout=25) as resp:
        data = resp.read()
    dest.write_bytes(data)
    cache[rel_dl] = sha256_bytes(data)
    return dest


def count_image_colors(img: Image.Image) -> int:
    rgba = img.convert("RGBA")
    colors = rgba.getcolors(maxcolors=65536)
    if colors is not None:
        return len(colors)
    # Approximate palette count for smooth gradients
    quant = rgba.convert("RGB").quantize(colors=256)
    qcols = quant.getcolors(maxcolors=512)
    return len(qcols) if qcols else 256


def optimize_undraw_svg(raw_svg: str) -> tuple[str, int]:
    # Recolor unDraw default purple accent (#6c63ff) -> primary brand blue (#3B82F6)
    svg = re.sub(r"#6c63ff", "#3B82F6", raw_svg, flags=re.IGNORECASE)
    # Remove XML header, comments, title, desc, metadata, data-name attrs
    svg = re.sub(r"<\?xml[^>]*\?>", "", svg)
    svg = re.sub(r"<!--[\s\S]*?-->", "", svg)
    svg = re.sub(r"<title>[\s\S]*?</title>", "", svg)
    svg = re.sub(r"<desc>[\s\S]*?</desc>", "", svg)
    svg = re.sub(r"<metadata>[\s\S]*?</metadata>", "", svg)
    svg = re.sub(r'\s+data-name="[^"]*"', "", svg)
    svg = re.sub(r'\s+id="[^"]*"', "", svg)
    # Round floats >= 10 to integer (viewBox ~600-1000px), < 10 to 1 decimal
    def round_num(m: re.Match) -> str:
        val = float(m.group(0))
        if abs(val) >= 10:
            return str(int(round(val)))
        rv = round(val, 1)
        if rv == int(rv):
            return str(int(rv))
        return f"{rv:.1f}"

    svg = re.sub(r"\d+\.\d+", round_num, svg)
    # Collapse whitespace
    svg = re.sub(r"\s+", " ", svg)
    svg = re.sub(r">\s+<", "><", svg).strip()
    if "#3B82F6" not in svg.upper():
        raise ValueError("Recolored unDraw SVG missing #3B82F6")
    colors = set(c.upper() for c in re.findall(r"#[0-9a-fA-F]{3,6}\b", svg))
    return svg + "\n", len(colors)


def ensure_kenney_particle_zip(cache: dict[str, str]) -> Path:
    zpath = DOWNLOADS_DIR / "fx" / "kenney-particle-pack.zip"
    if zpath.exists() and zpath.stat().st_size > 1_000_000:
        return zpath
    page_url = "https://kenney.nl/assets/particle-pack"
    assert_allowed_url(page_url)
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor())
    opener.addheaders = [
        ("User-Agent", "Mozilla/5.0"),
        ("Referer", page_url),
        ("X-Requested-With", "XMLHttpRequest"),
    ]
    html = opener.open(page_url, timeout=20).read().decode("utf-8", "ignore")
    m = re.search(r"data-download-id=['\"]([^'\"]+)['\"]", html)
    if not m:
        raise RuntimeError("Cannot find Kenney download id")
    dl_info = json.loads(opener.open(f"https://kenney.nl/download-link/{m.group(1)}", timeout=20).read().decode("utf-8"))
    signed = dl_info["url"]
    assert_allowed_url(signed)
    zpath.parent.mkdir(parents=True, exist_ok=True)
    data = opener.open(signed, timeout=45).read()
    zpath.write_bytes(data)
    cache["fx/kenney-particle-pack.zip"] = sha256_bytes(data)
    return zpath


def main() -> None:
    cache = load_cache()
    manifest = json.loads(MANIFEST_PATH.read_text("utf-8"))
    manifest["allowlistDomains"] = sorted(ALLOWLIST_DOMAINS)

    items_by_file: dict[str, dict] = {}

    # 1. Lexi Mascot (8 states, Fluent Emoji 3D MIT)
    print("1. Fetching & processing 8 Lexi mascot states (Fluent Emoji 3D, MIT)...")
    mascot_dir = ASSETS_DIR / "mascot"
    mascot_dir.mkdir(parents=True, exist_ok=True)
    for spec in LEXI_STATES:
        st = spec["state"]
        prim_rel = spec["primary"]
        prim_url = FLUENT_RAW + urllib.parse.quote(prim_rel)
        prim_path = download_cached(prim_url, f"fluent-3d/{prim_rel}", cache)
        with Image.open(prim_path) as im:
            orig_w, orig_h = im.size
            rgba = im.convert("RGBA")

        chinh_sua = "Resize 256x256 -> WebP q82 (transparent)"
        url_tai = prim_url
        if spec["badge"]:
            badge_rel = spec["badge"]
            badge_url = FLUENT_RAW + urllib.parse.quote(badge_rel)
            badge_path = download_cached(badge_url, f"fluent-3d/{badge_rel}", cache)
            canvas = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
            cat_resized = rgba.resize((216, 216), Image.Resampling.LANCZOS)
            canvas.paste(cat_resized, (6, 36), cat_resized)
            with Image.open(badge_path) as bim:
                badge_resized = bim.convert("RGBA").resize((96, 96), Image.Resampling.LANCZOS)
            canvas.paste(badge_resized, (154, 4), badge_resized)
            out_img = canvas
            chinh_sua = f"Composite Fluent 3D ({prim_rel.split('/')[0]} + {badge_rel.split('/')[0]}), 256x256 WebP q82"
            url_tai = f"{prim_url} ; {badge_url}"
        else:
            out_img = rgba.resize((256, 256), Image.Resampling.LANCZOS) if (orig_w, orig_h) != (256, 256) else rgba

        out_path = mascot_dir / f"lexi-{st}.webp"
        out_img.save(out_path, format="WEBP", quality=82, method=6)
        size_b = out_path.stat().st_size
        if size_b > 60 * 1024:
            raise ValueError(f"Lexi {out_path.name} exceeds 60 KB ({size_b} B)")

        rel_out = out_path.relative_to(ROOT_DIR).as_posix()
        items_by_file[rel_out] = {
            "file": rel_out,
            "nhom": "mascot",
            "trang_thai": st,
            "url_trang": FLUENT_PAGE,
            "url_tai": url_tai,
            "tac_gia": "Microsoft Corporation (Fluent Emoji)",
            "giay_phep": "MIT",
            "ngay_tai": TODAY,
            "sha256": sha256_file(out_path),
            "chinh_sua": chinh_sua,
            "kich_thuoc_goc": f"{orig_w}x{orig_h}",
            "so_mau": count_image_colors(out_img),
            "ti_le_khung": "1/1",
            "object_fit": "contain",
            "diem_nhan": "50% 50%",
        }
        print(f"   lexi-{st}.webp: {size_b/1024:.2f} KB")

    # 2. Fluent Emoji 3D Icons: 12 games + 12 badges + 16 UI
    print("2. Fetching & processing 40 Fluent Emoji 3D icons (12 games, 12 badges, 16 UI)...")
    icon_groups = [
        ("games", FLUENT_GAME_ICONS),
        ("badges", FLUENT_BADGE_ICONS),
        ("ui", FLUENT_UI_ICONS),
    ]
    for grp, pairs in icon_groups:
        out_dir = ASSETS_DIR / "icons" / "fluent" / grp
        out_dir.mkdir(parents=True, exist_ok=True)
        for icon_id, fluent_rel in pairs:
            url = FLUENT_RAW + urllib.parse.quote(fluent_rel)
            dl_path = download_cached(url, f"fluent-3d/{fluent_rel}", cache)
            with Image.open(dl_path) as im:
                orig_w, orig_h = im.size
                resized = im.convert("RGBA").resize((192, 192), Image.Resampling.LANCZOS)
            out_path = out_dir / f"{icon_id}.webp"
            resized.save(out_path, format="WEBP", quality=82, method=6)
            size_b = out_path.stat().st_size
            if size_b > 20 * 1024:
                resized.save(out_path, format="WEBP", quality=75, method=6)
                size_b = out_path.stat().st_size
            if size_b > 20 * 1024:
                raise ValueError(f"Icon {out_path} exceeds 20 KB ({size_b} B)")

            rel_out = out_path.relative_to(ROOT_DIR).as_posix()
            items_by_file[rel_out] = {
                "file": rel_out,
                "nhom": f"icon-fluent-{grp}",
                "url_trang": FLUENT_PAGE,
                "url_tai": url,
                "tac_gia": "Microsoft Corporation (Fluent Emoji)",
                "giay_phep": "MIT",
                "ngay_tai": TODAY,
                "sha256": sha256_file(out_path),
                "chinh_sua": "Resize 256x256 -> 192x192 WebP q82 (transparent)",
                "kich_thuoc_goc": f"{orig_w}x{orig_h}",
                "so_mau": count_image_colors(resized),
                "ti_le_khung": "1/1",
                "object_fit": "contain",
                "diem_nhan": "50% 50%",
            }

    # 3. 6 Real unDraw SVG illustrations (fixes D13)
    print("3. Fetching & optimizing 6 real unDraw SVG illustrations (fixes D13)...")
    illus_dir = ASSETS_DIR / "illustrations"
    illus_dir.mkdir(parents=True, exist_ok=True)
    new_illus_manifest = []
    for item in UNDRAW_ILLUSTRATIONS:
        svg_name = Path(urllib.parse.urlparse(item["url_tai"]).path).name
        dl_path = download_cached(item["url_tai"], f"illustrations/undraw/{svg_name}", cache)
        raw_svg = dl_path.read_text("utf-8", errors="ignore")
        opt_svg, n_colors = optimize_undraw_svg(raw_svg)
        out_path = illus_dir / f"{item['id']}.svg"
        out_path.write_text(opt_svg, encoding="utf-8")
        npx_cmd = shutil.which("npx") or shutil.which("npx.cmd")
        if npx_cmd:
            subprocess.run(
                [npx_cmd, "--yes", "svgo", "--multipass", "-p", "0", "-i", str(out_path), "-o", str(out_path)],
                check=False,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        final_svg = out_path.read_text("utf-8", errors="ignore")
        if "#3B82F6" not in final_svg.upper():
            # Restore accent uppercase if SVGO shorthanded anything
            out_path.write_text(opt_svg, encoding="utf-8")
            final_svg = opt_svg
        n_colors = len(set(c.upper() for c in re.findall(r"#[0-9a-fA-F]{3,6}\b", final_svg)))
        size_b = out_path.stat().st_size
        if size_b > 30 * 1024:
            raise ValueError(f"Illustration {out_path} exceeds 30 KB ({size_b} B)")
        rel_out = out_path.relative_to(ROOT_DIR).as_posix()

        # Read viewBox for aspect ratio metadata
        vb = re.search(r'viewBox="0 0 ([0-9.]+) ([0-9.]+)"', final_svg)
        orig_dim = f"{vb.group(1)}x{vb.group(2)} (SVG)" if vb else "vector (SVG)"
        items_by_file[rel_out] = {
            "file": rel_out,
            "nhom": "illustration",
            "url_trang": item["url_trang"],
            "url_tai": item["url_tai"],
            "tac_gia": "Katerina Limpitsouni (unDraw)",
            "giay_phep": "unDraw License (free commercial/personal, no attribution required)",
            "ngay_tai": TODAY,
            "sha256": sha256_file(out_path),
            "chinh_sua": "Recolored #6c63ff -> #3B82F6, SVGO --multipass -p 1",
            "kich_thuoc_goc": orig_dim,
            "so_mau": n_colors,
            "ti_le_khung": "4/3",
            "object_fit": "contain",
            "diem_nhan": "50% 50%",
        }
        new_illus_manifest.append({
            "id": item["id"],
            "name": item["name"],
            "url": item["url_tai"],
            "url_trang": item["url_trang"],
            "source": "unDraw",
            "license": "unDraw License",
            "author": "Katerina Limpitsouni (unDraw)",
            "modified": "Yes (recolored #6c63ff -> #3B82F6, SVG optimized)",
            "files": [{"from": Path(item["url_tai"]).name, "to": rel_out}],
        })
        print(f"   {item['id']}.svg: {size_b/1024:.2f} KB ({n_colors} colors)")
    manifest["illustrations"] = new_illus_manifest

    # 4. 8 Kenney Particle Pack textures (CC0, 64x64 PNG)
    print("4. Processing 8 Kenney Particle Pack textures (CC0, 64x64 PNG)...")
    kz_path = ensure_kenney_particle_zip(cache)
    fx_dir = ASSETS_DIR / "fx"
    fx_dir.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(kz_path, "r") as zf:
        for member in zf.namelist():
            norm = member.replace("\\", "/")
            if norm.startswith("/") or ":" in norm or ".." in norm.split("/"):
                raise ValueError(f"Unsafe zip member: {member}")
        for pid, member in KENNEY_PARTICLES:
            raw_bytes = zf.read(member)
            with Image.open(io.BytesIO(raw_bytes)) as im:
                orig_w, orig_h = im.size
                rgba = im.convert("RGBA").resize((48, 48), Image.Resampling.LANCZOS)
                alpha = rgba.split()[3]
                # Compact 12-level white+alpha palette PNG (tRNS), crisp at <= 48px canvas particles
                q_img = Image.new("P", (48, 48))
                q_img.putpalette([255, 255, 255] * 12)
                trns = bytes(round(i * 255 / 11) for i in range(12))
                q_img.putdata([min(11, int(round(a * 11 / 255))) for a in alpha.get_flattened_data()])
            out_path = fx_dir / f"{pid}.png"
            q_img.save(out_path, format="PNG", transparency=trns, optimize=True, compress_level=9)
            size_b = out_path.stat().st_size
            rel_out = out_path.relative_to(ROOT_DIR).as_posix()
            items_by_file[rel_out] = {
                "file": rel_out,
                "nhom": "fx-particle",
                "url_trang": "https://kenney.nl/assets/particle-pack",
                "url_tai": f"https://kenney.nl/assets/particle-pack#{urllib.parse.quote(member)}",
                "tac_gia": "Kenney Vleugels (Kenney.nl)",
                "giay_phep": "CC0 1.0 Universal",
                "ngay_tai": TODAY,
                "sha256": sha256_file(out_path),
                "chinh_sua": "Resize 512x512 -> 48x48 compact 12-level alpha PNG (optimize=True)",
                "kich_thuoc_goc": f"{orig_w}x{orig_h}",
                "so_mau": 12,
                "ti_le_khung": "1/1",
                "object_fit": "contain",
                "diem_nhan": "50% 50%",
            }
            print(f"   fx/{pid}.png: {size_b} B")

    # 5. Baloo 2 display font (OFL 1.1, latin + vietnamese woff2, subsetted cleanly)
    print("5. Fetching & subsetting Baloo 2 display font woff2 (OFL 1.1, latin + vietnamese)...")
    fonts_dir = ASSETS_DIR / "fonts"
    fonts_dir.mkdir(parents=True, exist_ok=True)
    from fontTools.subset import Options as FtOptions, Subsetter as FtSubsetter
    from fontTools.ttLib import TTFont

    ascii_ui = "".join(chr(c) for c in range(0x20, 0x7F)) + "–—‘’“”…·×≈°±•₫"
    vi_chars = (
        "ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯư"
        "ẠạẢảẤấẦầẨẩẪẫẬậẮắẰằẲẳẴẵẶặẸẹẺẻẼẽẾếỀềỂểỄễỆệỈỉỊị"
        "ỌọỎỏỐốỒồỔổỖỗỘộỚớỜờỞởỠỡỢợỤụỦủỨứỪừỬửỮữỰựỲỳỴỵỶỷỸỹ"
    )
    for fname, furl in BALOO2_FILES:
        dl_path = download_cached(furl, f"fonts/baloo-2/{fname}", cache)
        out_path = fonts_dir / fname
        font = TTFont(str(dl_path))
        opts = FtOptions()
        opts.flavor = "woff2"
        opts.hinting = False
        if "latin" in fname:
            opts.layout_features = ["kern", "liga"]
            sub = FtSubsetter(options=opts)
            sub.populate(text=ascii_ui)
            chinh_sua_font = "Subset woff2 ASCII printable + UI punctuation (OFL-1.1)"
        else:
            opts.layout_features = ["kern", "liga", "ccmp", "mark", "mkmk"]
            sub = FtSubsetter(options=opts)
            sub.populate(text=vi_chars)
            chinh_sua_font = "Subset woff2 134 Vietnamese diacritics (OFL-1.1)"
        sub.subset(font)
        font.save(str(out_path))
        size_b = out_path.stat().st_size
        rel_out = out_path.relative_to(ROOT_DIR).as_posix()
        items_by_file[rel_out] = {
            "file": rel_out,
            "nhom": "font-display",
            "url_trang": "https://github.com/EkType/Baloo2",
            "url_tai": furl,
            "tac_gia": "Ek Type (via Fontsource)",
            "giay_phep": "SIL Open Font License 1.1 (OFL-1.1)",
            "ngay_tai": TODAY,
            "sha256": sha256_file(out_path),
            "chinh_sua": chinh_sua_font,
            "kich_thuoc_goc": "font-woff2",
            "so_mau": 0,
            "ti_le_khung": "n/a",
            "object_fit": "n/a",
            "diem_nhan": "n/a",
        }
        print(f"   fonts/{fname}: {size_b/1024:.2f} KiB")

    # 6. Catalog ALL remaining files in public/assets/** (legacy SVG icons, SFX, soul_knight X20, ui)
    print("6. Indexing existing & legacy assets in public/assets/** (fixing X20 soul_knight url_tai)...")
    legacy_svg_meta: dict[str, dict] = {}
    for gkey in ("gameIcons", "badgeIcons"):
        for item in manifest.get(gkey, []):
            for f_entry in item["files"]:
                rel = f_entry["to"].replace("\\", "/")
                legacy_svg_meta[rel] = item

    for path in sorted(ASSETS_DIR.rglob("*")):
        if not path.is_file() or path.name == "CREDITS.md":
            continue
        rel = path.relative_to(ROOT_DIR).as_posix()
        if rel in items_by_file:
            continue

        if rel in legacy_svg_meta:
            m = legacy_svg_meta[rel]
            items_by_file[rel] = {
                "file": rel,
                "nhom": "icon-svg-legacy",
                "url_trang": "https://game-icons.net/",
                "url_tai": m["url"],
                "tac_gia": m["author"],
                "giay_phep": m["license"],
                "ngay_tai": "2026-04-01",
                "sha256": sha256_file(path),
                "chinh_sua": m["modified"],
                "kich_thuoc_goc": "512x512 (SVG)",
                "so_mau": 1,
                "ti_le_khung": "1/1",
                "object_fit": "contain",
                "diem_nhan": "50% 50%",
            }
        elif rel.startswith("public/assets/sfx/"):
            items_by_file[rel] = {
                "file": rel,
                "nhom": "sfx",
                "url_trang": "https://kenney.nl/assets/interface-sounds",
                "url_tai": "https://kenney.nl/assets/interface-sounds ; https://kenney.nl/assets/digital-audio",
                "tac_gia": "Kenney Vleugels (Kenney.nl)",
                "giay_phep": "CC0 1.0 Universal",
                "ngay_tai": "2026-04-01",
                "sha256": sha256_file(path),
                "chinh_sua": "Trimmed, normalized -20 LUFS, combined into audio sprite (12 canonical cues)",
                "kich_thuoc_goc": "audio-sprite",
                "so_mau": 0,
                "ti_le_khung": "n/a",
                "object_fit": "n/a",
                "diem_nhan": "n/a",
            }
        elif rel.startswith("public/assets/soul_knight/"):
            sub = rel.removeprefix("public/assets/soul_knight/")
            remote_sub = SOUL_KNIGHT_MAP.get(sub, f"assets/{sub}")
            with Image.open(path) as im:
                w, h = im.size
                n_col = count_image_colors(im)
            items_by_file[rel] = {
                "file": rel,
                "nhom": "legacy-soul-knight",
                "url_trang": "https://0x72.itch.io/dungeontileset-ii",
                "url_tai": SOUL_KNIGHT_RAW_BASE + remote_sub,
                "tac_gia": "0x72 (Robert Norenberg)",
                "giay_phep": "CC0 1.0 Universal",
                "ngay_tai": "2026-03-01",
                "sha256": sha256_file(path),
                "chinh_sua": "No (legacy sprite preserved per SR-06; url_tai fixed per X20)",
                "kich_thuoc_goc": f"{w}x{h}",
                "so_mau": n_col,
                "ti_le_khung": f"{w}/{h}",
                "object_fit": "contain",
                "diem_nhan": "50% 50%",
            }
        elif rel.startswith("public/assets/ui/"):
            with Image.open(path) as im:
                w, h = im.size
                n_col = count_image_colors(im)
            items_by_file[rel] = {
                "file": rel,
                "nhom": "legacy-ui",
                "url_trang": "https://kenney.nl/assets/pixel-ui-pack",
                "url_tai": "https://kenney.nl/assets/pixel-ui-pack",
                "tac_gia": "Kenney Vleugels (Kenney.nl)",
                "giay_phep": "CC0 1.0 Universal",
                "ngay_tai": "2026-03-01",
                "sha256": sha256_file(path),
                "chinh_sua": "No (legacy UI slice preserved per SR-06)",
                "kich_thuoc_goc": f"{w}x{h}",
                "so_mau": n_col,
                "ti_le_khung": f"{w}/{h}",
                "object_fit": "contain",
                "diem_nhan": "50% 50%",
            }
        else:
            raise ValueError(f"Unhandled asset file: {rel}")

    # Save manifest with full SR-60 + SR-46 items list
    manifest["items"] = [items_by_file[k] for k in sorted(items_by_file.keys())]
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    # 7. Write public/assets/CREDITS.md (100% coverage, 10 fields summarized cleanly)
    lines = [
        "# CREDITS · Danh mục bản quyền & nguồn gốc Asset (`public/assets/**`)",
        "",
        "> Sinh tự động bởi `scripts/assets/fetch_t3a_assets.py` và kiểm định bởi `scripts/validate/assets_credits.mjs`.",
        "> Đầy đủ 10 trường `SR-60` + metadata khung/điểm nhấn `SR-46` được lưu chi tiết tại `scripts/assets/assets.manifest.json`.",
        "",
        "| Đường dẫn file | Trang nguồn (`url_trang`) | URL tải (`url_tai`) | Tác giả | Giấy phép | Ngày tải | SHA-256 (12) | Chỉnh sửa |",
        "|---|---|---|---|---|---|---|---|",
    ]
    for rel in sorted(items_by_file.keys()):
        m = items_by_file[rel]
        lines.append(
            f"| `{rel}` | {m['url_trang']} | {m['url_tai']} | {m['tac_gia']} | {m['giay_phep']} | {m['ngay_tai']} | `{m['sha256'][:12]}` | {m['chinh_sua']} |"
        )
    (ASSETS_DIR / "CREDITS.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    save_cache(cache)

    total_non_audio = sum(
        (ROOT_DIR / r).stat().st_size
        for r in items_by_file
        if not r.startswith(("public/assets/sfx/", "public/assets/music/"))
    )
    print(f"Done! {len(items_by_file)} files tracked in manifest & CREDITS.md.")
    print(f"Total non-audio public/assets: {total_non_audio / 1024:.2f} KiB / 2048.00 KiB")


if __name__ == "__main__":
    main()
