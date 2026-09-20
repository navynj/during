#!/usr/bin/env python3
"""
The app mark: white water on the live surface.

A placeholder, and deliberately the app's own grammar rather than a new
figure — solid #0507C9 with waves in white is what SPEC 7 law 5 and H15c
already mean by "a live session", so the home screen says During without
inventing a logo the product would then have to live up to.

Drawn rather than exported because the real mark is still a Figma job. Run it
again after that lands:  python3 scripts/make-icons.py
"""

import math
import struct
import zlib
from pathlib import Path

BLUE = (0x05, 0x07, 0xC9)
WHITE = (0xFF, 0xFF, 0xFF)
PUBLIC = Path(__file__).resolve().parent.parent / 'public'

# Maskable icons are cropped to a circle of radius 40% of the canvas, so the
# waves stay inside that and the blue takes whatever the platform trims.
SAFE = 0.36
SUPERSAMPLE = 3


def wave_coverage(x: float, y: float, size: int) -> float:
    """How much of this point the three wave lines cover, 0 to 1."""
    half = size / 2
    span = size * SAFE
    if abs(x - half) > span:
        return 0.0

    amplitude = size * 0.035
    wavelength = size * 0.30
    stroke = size * 0.030
    gap = size * 0.115

    covered = 0.0
    for line in (-1, 0, 1):
        mid = half + line * gap
        curve = mid + amplitude * math.sin((x - half) / wavelength * 2 * math.pi)
        # Vertical distance is a good enough stand-in for distance to the
        # curve at this amplitude, and it keeps the stroke weight even.
        if abs(y - curve) <= stroke / 2:
            covered = 1.0
    return covered


def render(size: int) -> bytes:
    rows = bytearray()
    step = 1.0 / SUPERSAMPLE

    for py in range(size):
        rows.append(0)  # PNG filter: none
        for px in range(size):
            hits = 0
            for sy in range(SUPERSAMPLE):
                for sx in range(SUPERSAMPLE):
                    hits += wave_coverage(px + (sx + 0.5) * step, py + (sy + 0.5) * step, size)
            alpha = hits / (SUPERSAMPLE * SUPERSAMPLE)
            for channel in range(3):
                rows.append(round(BLUE[channel] + (WHITE[channel] - BLUE[channel]) * alpha))

    def chunk(kind: bytes, payload: bytes) -> bytes:
        body = kind + payload
        return struct.pack('>I', len(payload)) + body + struct.pack('>I', zlib.crc32(body))

    header = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)
    return (
        b'\x89PNG\r\n\x1a\n'
        + chunk(b'IHDR', header)
        + chunk(b'IDAT', zlib.compress(bytes(rows), 9))
        + chunk(b'IEND', b'')
    )


for name, size in (('icon-192.png', 192), ('icon-512.png', 512), ('apple-touch-icon.png', 180)):
    (PUBLIC / name).write_bytes(render(size))
    print(f'  ✓ public/{name}')
