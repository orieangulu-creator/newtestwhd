#!/usr/bin/env python3
"""Generate simple solid-color PNG app icons (no external dependencies)."""
import os
import struct
import zlib

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICON_DIR = os.path.join(HERE, "icons")
COLOR = (10, 108, 255)  # brand blue


def png(size, rgb, path):
    w = h = size
    r, g, b = rgb
    row = bytes([0]) + bytes([r, g, b]) * w  # filter byte + RGB pixels
    raw = row * h
    comp = zlib.compress(raw, 9)

    def chunk(tag, data):
        c = tag + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)  # 8-bit RGB
    data = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", comp) + chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(data)
    print("wrote", path)


if __name__ == "__main__":
    os.makedirs(ICON_DIR, exist_ok=True)
    png(192, COLOR, os.path.join(ICON_DIR, "icon-192.png"))
    png(512, COLOR, os.path.join(ICON_DIR, "icon-512.png"))
