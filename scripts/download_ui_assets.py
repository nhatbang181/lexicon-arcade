import urllib.request
import os

BASE_URL = 'https://raw.githubusercontent.com/ETdoFresh/kenney.nl/master/'

UI_FILES = {
    'uipack_sheet.png': 'pixeluipack/Spritesheet/UIpackSheet_transparent.png',
    'frame_brown.png': 'pixeluipack/9-Slice/Ancient/brown.png',
    'frame_brown_inlay.png': 'pixeluipack/9-Slice/Ancient/brown_inlay.png',
    'frame_grey.png': 'pixeluipack/9-Slice/Ancient/grey.png',
    'frame_grey_inlay.png': 'pixeluipack/9-Slice/Ancient/grey_inlay.png',
    'frame_tan.png': 'pixeluipack/9-Slice/Ancient/tan.png',
    'frame_tan_inlay.png': 'pixeluipack/9-Slice/Ancient/tan_inlay.png',
    'btn_blue.png': 'pixeluipack/9-Slice/Colored/blue.png',
    'btn_blue_pressed.png': 'pixeluipack/9-Slice/Colored/blue_pressed.png',
    'btn_green.png': 'pixeluipack/9-Slice/Colored/green.png',
    'btn_green_pressed.png': 'pixeluipack/9-Slice/Colored/green_pressed.png',
    'btn_red.png': 'pixeluipack/9-Slice/Colored/red.png',
    'btn_yellow.png': 'pixeluipack/9-Slice/Colored/yellow.png',
    'btn_yellow_pressed.png': 'pixeluipack/9-Slice/Colored/yellow_pressed.png'
}

dest_dir = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'ui')
os.makedirs(dest_dir, exist_ok=True)

for local, remote in UI_FILES.items():
    url = BASE_URL + remote
    dest = os.path.join(dest_dir, local)
    try:
        urllib.request.urlretrieve(url, dest)
        print(f"Downloaded {local}")
    except Exception as e:
        print(f"Failed {local}: {e}")

print("All pixel UI assets downloaded!")
