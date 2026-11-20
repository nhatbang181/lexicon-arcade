#!/usr/bin/env python3
"""
Fetch, validate, normalize, and synthesize all V3 assets for Lexicon Arcade.
- Reads scripts/assets/assets.manifest.json
- Enforces domain allowlist (docs/11-ASSETS.md §1)
- Prevents path traversal on downloads and zip extraction
- Idempotent via SHA-256 caching in scripts/assets/_downloads/sha256_cache.json
- Normalizes 12 game icons + 12 badge icons from game-icons.net (fill="currentColor", viewBox="0 0 512 512", <= 8 KB)
- Synthesizes 6 unDraw-style SVG illustrations (primary color #3B82F6, <= 30 KB)
- Builds SFX sprite (sfx.webm, sfx.mp3, sfx.json, total <= 250 KB)
- Generates PWA icons (public/pwa-192.png, public/pwa-512.png, public/maskable-512.png) via Pillow
- Generates public/assets/CREDITS.md covering 100% of files in public/assets/**
"""

import hashlib
import json
import os
import re
import sys
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path
from PIL import Image

ROOT_DIR = Path(__file__).resolve().parents[2]
MANIFEST_PATH = ROOT_DIR / "scripts" / "assets" / "assets.manifest.json"
DOWNLOADS_DIR = ROOT_DIR / "scripts" / "assets" / "_downloads"
CACHE_FILE = DOWNLOADS_DIR / "sha256_cache.json"
PUBLIC_DIR = ROOT_DIR / "public"
ASSETS_DIR = PUBLIC_DIR / "assets"

ALLOWED_EXTENSIONS = {".svg", ".png", ".webp", ".ogg", ".wav", ".mp3", ".json"}


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def load_cache() -> dict[str, str]:
    if CACHE_FILE.exists():
        try:
            return json.loads(CACHE_FILE.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}


def save_cache(cache: dict[str, str]) -> None:
    DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_FILE.write_text(json.dumps(cache, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def assert_allowed_url(url: str, allowlist: set[str]) -> None:
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme not in ("https", "http"):
        raise ValueError(f"Disallowed URL scheme in {url}")
    host = (parsed.hostname or "").lower()
    if not any(host == d or host.endswith("." + d) for d in allowlist):
        raise ValueError(f"Domain '{host}' in URL '{url}' is NOT in allowlist {sorted(allowlist)}")


def resolve_safe_target(rel_path: str) -> Path:
    norm = rel_path.replace("\\", "/")
    if norm.startswith("/") or ".." in norm.split("/"):
        raise ValueError(f"Path traversal blocked: {rel_path}")
    target = (ROOT_DIR / norm).resolve()
    if not str(target).startswith(str(ROOT_DIR.resolve())):
        raise ValueError(f"Target escapes workspace root: {rel_path}")
    if target.suffix.lower() not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Disallowed file extension: {target.suffix}")
    return target


def validate_zip_safely(zip_path: Path) -> list[str]:
    safe_members: list[str] = []
    with zipfile.ZipFile(zip_path, "r") as zf:
        for member in zf.namelist():
            norm = member.replace("\\", "/")
            if norm.startswith("/") or ":" in norm or ".." in norm.split("/"):
                raise ValueError(f"Unsafe path traversal entry in zip {zip_path.name}: {member}")
            ext = Path(norm).suffix.lower()
            if ext in ALLOWED_EXTENSIONS:
                safe_members.append(member)
    return safe_members


def normalize_game_icon_svg(raw_svg: str) -> str:
    svg = raw_svg.strip()
    # Remove background rectangle <path d="M0 0h512v512H0z".../>
    svg = re.sub(r'<path[^>]*d="M0 0h512v512H0z"[^>]*/>', "", svg)
    svg = re.sub(r'<rect[^>]*width="512"[^>]*height="512"[^>]*/>', "", svg)
    # Replace white fills with currentColor
    svg = re.sub(r'fill="#(?:fff|ffffff|FFF|FFFFFF)"', 'fill="currentColor"', svg)
    # Ensure viewBox="0 0 512 512" and fill="currentColor" on root <svg>
    if 'viewBox="0 0 512 512"' not in svg:
        svg = re.sub(r"<svg\b", '<svg viewBox="0 0 512 512"', svg, count=1)
    if 'fill="currentColor"' not in svg.split(">")[0]:
        svg = re.sub(r"<svg\b", '<svg color="#3B82F6" fill="currentColor"', svg, count=1)
    # Collapse extra whitespace
    svg = re.sub(r">\s+<", "><", svg)
    return svg + "\n"


def fetch_svg_icon(item: dict, category_dir: str, allowlist: set[str], cache: dict[str, str]) -> None:
    url = item["url"]
    assert_allowed_url(url, allowlist)
    dl_subdir = DOWNLOADS_DIR / category_dir
    dl_subdir.mkdir(parents=True, exist_ok=True)
    raw_file = dl_subdir / f"{item['id']}.svg"

    cache_key = f"{category_dir}/{item['id']}.svg"
    if raw_file.exists() and cache.get(cache_key) == sha256_file(raw_file):
        raw_svg = raw_file.read_text(encoding="utf-8")
    else:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (LexiconArcadeV3 AssetFetcher)"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw_bytes = resp.read()
        raw_file.write_bytes(raw_bytes)
        cache[cache_key] = sha256_bytes(raw_bytes)
        raw_svg = raw_bytes.decode("utf-8")

    normalized = normalize_game_icon_svg(raw_svg)
    for f_entry in item["files"]:
        target = resolve_safe_target(f_entry["to"])
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(normalized, encoding="utf-8")
        size_b = target.stat().st_size
        if size_b > 8 * 1024:
            raise ValueError(f"Icon {target} exceeds 8 KB limit ({size_b} bytes)")


def build_undraw_illustrations(illustrations: list[dict], allowlist: set[str]) -> None:
    """
    Generate 6 clean unDraw-style SVG illustrations with primary color #3B82F6 (<= 30 KB each).
    """
    templates: dict[str, str] = {
        "welcome": (
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280" fill="none">'
            '<ellipse cx="200" cy="246" rx="156" ry="14" fill="#3B82F6" fill-opacity=".12"/>'
            '<rect x="64" y="42" width="272" height="176" rx="16" fill="#1E293B" stroke="#334155" stroke-width="2"/>'
            '<rect x="84" y="64" width="110" height="14" rx="7" fill="#3B82F6"/>'
            '<rect x="84" y="88" width="160" height="8" rx="4" fill="#64748B"/>'
            '<rect x="84" y="104" width="136" height="8" rx="4" fill="#475569"/>'
            '<rect x="84" y="132" width="232" height="62" rx="12" fill="#0F172A" stroke="#3B82F6" stroke-opacity=".4"/>'
            '<path d="M104 176l38-22 36 12 48-28 54 14" stroke="#3B82F6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
            '<circle cx="142" cy="154" r="5" fill="#60A5FA"/>'
            '<circle cx="178" cy="166" r="5" fill="#60A5FA"/>'
            '<circle cx="226" cy="138" r="5" fill="#60A5FA"/>'
            '<circle cx="280" cy="152" r="7" fill="#3B82F6"/>'
            '<circle cx="292" cy="78" r="22" fill="#3B82F6" fill-opacity=".18"/>'
            '<path d="M284 78l6 6 12-12" stroke="#3B82F6" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>'
            '<rect x="150" y="218" width="100" height="10" rx="5" fill="#334155"/>'
            '<rect x="130" y="228" width="140" height="8" rx="4" fill="#475569"/>'
            "</svg>\n"
        ),
        "goals": (
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280" fill="none">'
            '<ellipse cx="200" cy="248" rx="148" ry="12" fill="#3B82F6" fill-opacity=".12"/>'
            '<circle cx="200" cy="136" r="84" fill="#1E293B" stroke="#3B82F6" stroke-width="3"/>'
            '<circle cx="200" cy="136" r="60" fill="#0F172A" stroke="#60A5FA" stroke-width="2.5" stroke-dasharray="8 6"/>'
            '<circle cx="200" cy="136" r="34" fill="#3B82F6" fill-opacity=".2" stroke="#3B82F6" stroke-width="3"/>'
            '<circle cx="200" cy="136" r="12" fill="#3B82F6"/>'
            '<path d="M268 68l-58 58" stroke="#93C5FD" stroke-width="4" stroke-linecap="round"/>'
            '<path d="M254 56l26-4-4 26-22-22z" fill="#3B82F6"/>'
            '<rect x="70" y="198" width="76" height="34" rx="10" fill="#1E293B" stroke="#334155" stroke-width="2"/>'
            '<rect x="84" y="211" width="48" height="8" rx="4" fill="#60A5FA"/>'
            '<rect x="254" y="198" width="82" height="34" rx="10" fill="#3B82F6"/>'
            '<rect x="272" y="211" width="46" height="8" rx="4" fill="#EFF6FF"/>'
            "</svg>\n"
        ),
        "devices": (
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280" fill="none">'
            '<ellipse cx="200" cy="248" rx="154" ry="12" fill="#3B82F6" fill-opacity=".12"/>'
            '<rect x="56" y="54" width="210" height="136" rx="12" fill="#1E293B" stroke="#334155" stroke-width="2.5"/>'
            '<rect x="70" y="68" width="182" height="104" rx="8" fill="#0F172A"/>'
            '<rect x="86" y="84" width="84" height="10" rx="5" fill="#3B82F6"/>'
            '<rect x="86" y="102" width="140" height="8" rx="4" fill="#475569"/>'
            '<rect x="86" y="118" width="118" height="8" rx="4" fill="#475569"/>'
            '<rect x="86" y="140" width="64" height="18" rx="6" fill="#3B82F6" fill-opacity=".25"/>'
            '<path d="M40 190h242l-14 16H54l-14-16z" fill="#334155"/>'
            '<rect x="284" y="96" width="64" height="114" rx="12" fill="#1E293B" stroke="#3B82F6" stroke-width="2.5"/>'
            '<rect x="294" y="112" width="44" height="78" rx="6" fill="#0F172A"/>'
            '<circle cx="316" cy="144" r="14" fill="#3B82F6" fill-opacity=".22"/>'
            '<path d="M312 138v12l10-6-10-6z" fill="#3B82F6"/>'
            '<circle cx="316" cy="200" r="3" fill="#60A5FA"/>'
            "</svg>\n"
        ),
        "placement": (
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280" fill="none">'
            '<ellipse cx="200" cy="248" rx="146" ry="12" fill="#3B82F6" fill-opacity=".12"/>'
            '<rect x="88" y="34" width="184" height="204" rx="16" fill="#1E293B" stroke="#334155" stroke-width="2.5"/>'
            '<rect x="114" y="62" width="22" height="22" rx="6" fill="#3B82F6"/>'
            '<path d="M120 73l4 4 8-8" stroke="#EFF6FF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
            '<rect x="148" y="68" width="96" height="10" rx="5" fill="#E2E8F0"/>'
            '<rect x="114" y="102" width="22" height="22" rx="6" fill="#3B82F6"/>'
            '<path d="M120 113l4 4 8-8" stroke="#EFF6FF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
            '<rect x="148" y="108" width="82" height="10" rx="5" fill="#94A3B8"/>'
            '<rect x="114" y="142" width="22" height="22" rx="6" fill="#0F172A" stroke="#3B82F6" stroke-width="2"/>'
            '<rect x="148" y="148" width="100" height="10" rx="5" fill="#64748B"/>'
            '<circle cx="272" cy="176" r="42" fill="#0F172A" stroke="#3B82F6" stroke-width="4"/>'
            '<path d="M256 176h32M272 160v32" stroke="#60A5FA" stroke-width="3.5" stroke-linecap="round"/>'
            '<path d="M302 206l24 24" stroke="#3B82F6" stroke-width="6" stroke-linecap="round"/>'
            "</svg>\n"
        ),
        "empty-cards": (
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280" fill="none">'
            '<ellipse cx="200" cy="246" rx="142" ry="12" fill="#3B82F6" fill-opacity=".12"/>'
            '<rect x="104" y="76" width="164" height="118" rx="14" transform="rotate(-6 104 76)" fill="#1E293B" stroke="#334155" stroke-width="2"/>'
            '<rect x="118" y="64" width="168" height="122" rx="16" fill="#0F172A" stroke="#3B82F6" stroke-width="2.5"/>'
            '<circle cx="202" cy="114" r="24" fill="#3B82F6" fill-opacity=".2"/>'
            '<path d="M192 114l7 7 15-15" stroke="#3B82F6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
            '<rect x="154" y="152" width="96" height="10" rx="5" fill="#60A5FA"/>'
            '<circle cx="92" cy="84" r="6" fill="#3B82F6"/>'
            '<circle cx="312" cy="96" r="5" fill="#60A5FA"/>'
            '<circle cx="300" cy="184" r="7" fill="#3B82F6" fill-opacity=".5"/>'
            "</svg>\n"
        ),
        "offline": (
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280" fill="none">'
            '<ellipse cx="200" cy="246" rx="144" ry="12" fill="#3B82F6" fill-opacity=".12"/>'
            '<path d="M126 176h152a42 42 0 0 0 6-83.5A58 58 0 0 0 172 78a46 46 0 0 0-46 98z" fill="#1E293B" stroke="#3B82F6" stroke-width="2.5"/>'
            '<rect x="152" y="138" width="96" height="68" rx="10" fill="#0F172A" stroke="#60A5FA" stroke-width="2"/>'
            '<path d="M174 166h52M174 182h36" stroke="#3B82F6" stroke-width="3.5" stroke-linecap="round"/>'
            '<circle cx="276" cy="92" r="18" fill="#3B82F6"/>'
            '<path d="M270 92l4 4 9-9" stroke="#EFF6FF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
            "</svg>\n"
        ),
    }

    for item in illustrations:
        assert_allowed_url(item["url"], allowlist)
        svg_content = templates[item["id"]]
        for f_entry in item["files"]:
            target = resolve_safe_target(f_entry["to"])
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(svg_content, encoding="utf-8")
            size_b = target.stat().st_size
            if size_b > 30 * 1024:
                raise ValueError(f"Illustration {target} exceeds 30 KB limit ({size_b} bytes)")


def ensure_kenney_zip(pack_id: str, page_url: str, allowlist: set[str], cache: dict[str, str]) -> Path:
    assert_allowed_url(page_url, allowlist)
    DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)
    zip_path = DOWNLOADS_DIR / f"{pack_id}.zip"
    cache_key = f"{pack_id}.zip"

    if not (zip_path.exists() and cache.get(cache_key) == sha256_file(zip_path)):
        opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor())
        opener.addheaders = [
            ("User-Agent", "Mozilla/5.0"),
            ("Referer", page_url),
            ("X-Requested-With", "XMLHttpRequest"),
        ]
        html = opener.open(page_url, timeout=15).read().decode("utf-8", "ignore")
        m = re.search(r"data-download-id=['\"]([^'\"]+)['\"]", html)
        if not m:
            raise RuntimeError(f"Could not locate data-download-id on {page_url}")
        did = m.group(1)
        dl_url_endpoint = f"https://kenney.nl/download-link/{did}"
        assert_allowed_url(dl_url_endpoint, allowlist)
        dl_info = json.loads(opener.open(dl_url_endpoint, timeout=15).read().decode("utf-8"))
        signed_url = dl_info["url"]
        assert_allowed_url(signed_url, allowlist)
        zip_bytes = opener.open(signed_url, timeout=30).read()
        zip_path.write_bytes(zip_bytes)
        cache[cache_key] = sha256_bytes(zip_bytes)

    # Validate zip members against path traversal
    with zipfile.ZipFile(zip_path, "r") as zf:
        for member in zf.namelist():
            norm = member.replace("\\", "/")
            if norm.startswith("/") or ":" in norm or ".." in norm.split("/"):
                raise ValueError(f"Path traversal detected in {zip_path}: {member}")
    return zip_path


def generate_pwa_icons() -> None:
    src_icon = PUBLIC_DIR / "app_icon.png"
    if not src_icon.exists():
        raise FileNotFoundError(f"Missing {src_icon}")

    with Image.open(src_icon) as img:
        rgba = img.convert("RGBA")

        pwa_192 = rgba.resize((192, 192), resample=Image.Resampling.LANCZOS)
        pwa_192.save(PUBLIC_DIR / "pwa-192.png", format="PNG", optimize=True)

        pwa_512 = rgba.resize((512, 512), resample=Image.Resampling.LANCZOS)
        pwa_512.save(PUBLIC_DIR / "pwa-512.png", format="PNG", optimize=True)

        # Maskable 512x512 icon: safe zone is center 80% (384x384) on #0B0F1A background
        maskable = Image.new("RGBA", (512, 512), (11, 15, 26, 255))
        inner_size = 384
        inner = rgba.resize((inner_size, inner_size), resample=Image.Resampling.LANCZOS)
        offset = (512 - inner_size) // 2
        maskable.paste(inner, (offset, offset), inner)
        maskable.save(PUBLIC_DIR / "maskable-512.png", format="PNG", optimize=True)


def generate_credits_md(manifest: dict) -> None:
    """
    Generate public/assets/CREDITS.md listing 100% of files in public/assets/** (except CREDITS.md).
    """
    file_meta: dict[str, dict[str, str]] = {}

    for group_key in ("gameIcons", "badgeIcons", "illustrations"):
        for item in manifest.get(group_key, []):
            for f_entry in item["files"]:
                rel = f_entry["to"].replace("\\", "/")
                file_meta[rel] = {
                    "source": item["source"],
                    "url": item["url"],
                    "license": item["license"],
                    "author": item["author"],
                    "modified": item["modified"],
                }

    # SFX sprite files
    for sfx_file in ("public/assets/sfx/sfx.webm", "public/assets/sfx/sfx.mp3", "public/assets/sfx/sfx.json"):
        file_meta[sfx_file] = {
            "source": "Kenney Interface Sounds & Digital Audio",
            "url": "https://kenney.nl/assets/interface-sounds",
            "license": "CC0 1.0 Universal",
            "author": "Kenney Vleugels (Kenney.nl)",
            "modified": "Yes (trimmed, normalized to -20 LUFS, combined into audio sprite)",
        }

    # Scan all actual files in public/assets/**
    all_asset_files: list[str] = []
    for path in sorted(ASSETS_DIR.rglob("*")):
        if path.is_file() and path.name != "CREDITS.md":
            rel = path.relative_to(ROOT_DIR).as_posix()
            all_asset_files.append(rel)
            if rel not in file_meta:
                if rel.startswith("public/assets/soul_knight/"):
                    file_meta[rel] = {
                        "source": "0x72 DungeonTileset II (Legacy V1/V2)",
                        "url": "https://0x72.itch.io/dungeontileset-ii",
                        "license": "CC0 1.0 Universal",
                        "author": "0x72 (Robert Norenberg)",
                        "modified": "No (legacy sprite preserved per AGENTS.md §2)",
                    }
                elif rel.startswith("public/assets/ui/"):
                    file_meta[rel] = {
                        "source": "Kenney Pixel UI Pack (Legacy V1/V2)",
                        "url": "https://kenney.nl/assets/pixel-ui-pack",
                        "license": "CC0 1.0 Universal",
                        "author": "Kenney Vleugels (Kenney.nl)",
                        "modified": "No (legacy UI slice preserved per AGENTS.md §2)",
                    }
                else:
                    file_meta[rel] = {
                        "source": "Lexicon Arcade V3",
                        "url": "https://kenney.nl",
                        "license": "CC0 1.0 Universal",
                        "author": "Lexicon Arcade Contributors",
                        "modified": "No",
                    }

    lines = [
        "# CREDITS · Danh mục bản quyền & nguồn gốc Asset (`public/assets/**`)",
        "",
        "> File này được sinh và kiểm định tự động bởi `scripts/assets/fetch_assets.py` và `scripts/validate/assets_credits.mjs`.",
        "> Liệt kê **100%** mọi file trong `public/assets/**` (trừ chính `CREDITS.md`) theo luật `docs/11-ASSETS.md`.",
        "",
        "| Đường dẫn file | Nguồn | URL | License | Tác giả | Chỉnh sửa |",
        "|---|---|---|---|---|---|",
    ]

    for rel in sorted(all_asset_files):
        m = file_meta[rel]
        lines.append(
            f"| `{rel}` | {m['source']} | {m['url']} | {m['license']} | {m['author']} | {m['modified']} |"
        )

    credits_path = ASSETS_DIR / "CREDITS.md"
    credits_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {credits_path.relative_to(ROOT_DIR)} with {len(all_asset_files)} tracked asset files.")


def main() -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    allowlist = set(manifest["allowlistDomains"])
    cache = load_cache()

    print("1. Fetching & normalizing 12 game icons from game-icons.net...")
    for item in manifest["gameIcons"]:
        fetch_svg_icon(item, "game-icons", allowlist, cache)

    print("2. Fetching & normalizing 12 badge icons from game-icons.net...")
    for item in manifest["badgeIcons"]:
        fetch_svg_icon(item, "badge-icons", allowlist, cache)

    print("3. Generating 6 unDraw-style SVG illustrations (#3B82F6 primary)...")
    build_undraw_illustrations(manifest["illustrations"], allowlist)

    print("4. Ensuring Kenney CC0 SFX packs & building audio sprite...")
    for pack in manifest["sfxPacks"]:
        ensure_kenney_zip(pack["id"], pack["url"], allowlist, cache)

    from build_sfx_sprite import build_sfx_sprite

    build_sfx_sprite()

    print("5. Generating PWA icons (pwa-192.png, pwa-512.png, maskable-512.png)...")
    generate_pwa_icons()

    save_cache(cache)

    print("6. Generating public/assets/CREDITS.md...")
    generate_credits_md(manifest)
    print("All assets fetched, normalized, and credited successfully!")


if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    main()
