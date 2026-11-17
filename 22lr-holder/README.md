# 100-round .22 LR holder

- `22lr_100_tray.stl` — 103 × 87 × 21 mm tray, 10 × 10 staggered grid. Rounds go in bullet-down.
- `22lr_100_lid.stl` — optional slip-on lid (print open side up).
- `make_holder.py` — parametric source (`pip install manifold3d trimesh`, then `python3 make_holder.py`).

Print: PLA/PETG, 0.2 mm layers, 3 walls, 15% infill, no supports, flat side down.
If rounds are tight, raise `HOLE_D` (6.15 mm) by 0.1–0.2 mm; if loose, lower it.
