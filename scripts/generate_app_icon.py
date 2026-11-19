import os
from PIL import Image, ImageDraw, ImageFont

def create_icon():
    size = (256, 256)
    # Create base canvas with transparency
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Draw rounded shield / square with gradient-like background
    margin = 8
    radius = 48
    bg_color = (15, 23, 42, 255)       # Slate 900
    border_gold = (245, 158, 11, 255)   # Amber 500
    border_glow = (251, 191, 36, 160)   # Amber 400

    # Draw outer glow
    for offset in range(4, 0, -1):
        alpha = int(120 / offset)
        draw.rounded_rectangle(
            [margin - offset, margin - offset, size[0] - margin + offset, size[1] - margin + offset],
            radius=radius + offset,
            outline=(245, 158, 11, alpha),
            width=2
        )

    # Main body
    draw.rounded_rectangle(
        [margin, margin, size[0] - margin, size[1] - margin],
        radius=radius,
        fill=bg_color,
        outline=border_gold,
        width=8
    )

    # Inner decorative subtle frame
    inner_margin = margin + 12
    draw.rounded_rectangle(
        [inner_margin, inner_margin, size[0] - inner_margin, size[1] - inner_margin],
        radius=radius - 10,
        outline=(56, 189, 248, 180), # Neon cyan accent
        width=2
    )

    # 2. Add pixel knight in center scaled with Nearest Neighbor
    knight_path = "public/assets/soul_knight/knight/idle_0.png"
    if os.path.exists(knight_path):
        knight = Image.open(knight_path).convert("RGBA")
        # Scale up by 8x to 120x160
        scale = 7
        knight_scaled = knight.resize((knight.width * scale, knight.height * scale), resample=Image.Resampling.NEAREST)
        
        # Center the knight
        kx = (size[0] - knight_scaled.width) // 2
        ky = (size[1] - knight_scaled.height) // 2 - 10
        
        # Paste with alpha mask
        img.paste(knight_scaled, (kx, ky), knight_scaled)

    # 3. Draw a banner or small retro game controller / text at bottom
    # Small arcade gold jewel on top
    draw.ellipse([size[0]//2 - 10, margin + 4, size[0]//2 + 10, margin + 24], fill=(245, 158, 11, 255), outline=(254, 240, 138, 255), width=2)

    # Draw small bottom arcade badge
    badge_w, badge_h = 140, 32
    bx0 = (size[0] - badge_w) // 2
    by0 = size[1] - margin - 38
    draw.rounded_rectangle([bx0, by0, bx0 + badge_w, by0 + badge_h], radius=8, fill=(30, 41, 59, 240), outline=(245, 158, 11, 255), width=2)

    # Draw small pixel text or dots in badge
    # Draw "IOE" or "IELTS" or sword dots
    jewel_colors = [(239, 68, 68), (34, 197, 94), (59, 130, 246), (234, 179, 8)]
    for i, col in enumerate(jewel_colors):
        dot_x = bx0 + 26 + i * 28
        draw.ellipse([dot_x - 5, by0 + 11, dot_x + 5, by0 + 21], fill=col + (255,), outline=(255, 255, 255, 200), width=1)

    # Save PNG
    os.makedirs("public", exist_ok=True)
    png_path = "public/app_icon.png"
    img.save(png_path, format="PNG")
    print(f"Saved {png_path}")

    # Save multi-size ICO
    ico_path = "public/app_icon.ico"
    icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    img.save(ico_path, format="ICO", sizes=icon_sizes)
    print(f"Saved {ico_path} with sizes: {icon_sizes}")

    # Also save as public/favicon.ico
    favicon_path = "public/favicon.ico"
    img.save(favicon_path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    print(f"Saved {favicon_path}")

if __name__ == "__main__":
    create_icon()
