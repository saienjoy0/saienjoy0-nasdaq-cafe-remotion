from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage


FOX_DIR = Path(__file__).resolve().parents[1] / "public" / "assets" / "characters" / "fox"
NAMES = ["通常", "分析", "ニヤリ", "軽い驚き", "困惑", "警戒", "眠そう"]


for name in NAMES:
    source = FOX_DIR / f"{name}.png"
    target = FOX_DIR / f"{name}-transparent.png"
    rgb = np.asarray(Image.open(source).convert("RGB"))

    channel_range = rgb.max(axis=2).astype(np.int16) - rgb.min(axis=2).astype(np.int16)
    brightness = rgb.mean(axis=2)
    strict_background = (channel_range <= 12) & (brightness >= 232)
    possible_background = (channel_range <= 28) & (brightness >= 178)

    border_seed = np.zeros(strict_background.shape, dtype=bool)
    border_seed[0, :] = strict_background[0, :]
    border_seed[-1, :] = strict_background[-1, :]
    border_seed[:, 0] = strict_background[:, 0]
    border_seed[:, -1] = strict_background[:, -1]
    background = ndimage.binary_propagation(border_seed, mask=possible_background)

    foreground_distance = ndimage.distance_transform_edt(~background)
    alpha = np.clip(foreground_distance / 1.5 * 255, 0, 255).astype(np.uint8)
    rgba = np.dstack((rgb, alpha))
    Image.fromarray(rgba, "RGBA").save(target, optimize=True)

    coverage = float(np.count_nonzero(alpha)) / alpha.size
    print(f"{target.name}: visible={coverage:.3f}, corner_alpha={int(alpha[0, 0])}")
