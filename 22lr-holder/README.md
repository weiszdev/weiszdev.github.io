# GUNWEISZ 100-round .22 LR box (v2)

Tray 107.9 × 90.4 × 16 mm · lid 115.9 × 95.2 × 24.8 mm (incl. lock pads) · closed height 30.8 mm.

## Files
- `gunweisz_22lr_100_x1c.3mf` – Bambu Studio plate: tray, lid and 2 lock sliders, already oriented.
  Body parts use **filament 1**, logo inlays use **filament 2 (gray)**.
- `stl/` – the same parts as separate STLs, in print orientation. If the 3MF gives trouble,
  select `tray_body.stl` + `tray_logo.stl` together, drag them in, answer **Yes** to
  "load as a single object with multiple parts", and set the logo part to the gray filament.
  Do the same for `lid_body.stl` + `lid_logo.stl`.
- `make_holder.py` – parametric source (all dimensions at the top).
- `preview/` – renders.

## Print (X1C)
- 0.20 mm layers **and 0.20 mm first layer** (the logo inlay is 0.8 mm = 4 layers), 3 walls, 15% infill, no supports.
- Tray prints bottom-down, lid prints top-down, so both logos land on the smooth bed face.
- Print 2 sliders (only if you want the locks).

## Features
- 10 × 10 staggered holes, rounds bullet-down; ~11 mm of each round stands proud for easy pick-out.
- 1 mm chamfer on every outside edge; rounded corners.
- Finger scoops on both long sides, just below the lid edge.
- Lid sits on 4 standoffs with 1.0 mm clearance over the rims of 25.4 mm rounds.
- 4 magnet pockets in the tray and 4 in the lid for 6 × 2.5 mm magnets, 1.0 mm face-to-face when seated.
- Lid fits either way round (pattern is 180° symmetric).

## Magnets
- **Attracting** (opposite poles facing): lid snaps down onto the standoffs; magnets never touch.
- **Repelling** (same poles facing): lid floats. With the slide locks engaged it floats ≈1.25 mm and
  springs back when pressed. Without the locks, 6 × 2.5 mm N52s will lift the light lid well over 1 mm.
- Glue them in (CA) — the pockets are a slip fit. Mark polarity before gluing so all 4 pairs match.

## Slide locks (optional, both short ends)
- Each short side of the lid has a raised pad with an undercut track.
- The slider has two spring arms with ramped catches. **Push it straight into the track until it
  clicks**; the arms flex past the lips and snap out behind them, so it cannot pull back out.
  (To remove, press both catches in with a small screwdriver.)
- Its bar passes through the lid skirt. Lid on, facing either end: slide the grip **left to lock**,
  **right to unlock** (5 mm travel); a detent clicks at mid-travel. Locked, the lid can lift at most
  ~1.25 mm.
- Sliders print standing on end (already oriented in the 3MF) so the spring arms bend along the
  layers, not across them. PLA works; PETG is even more forgiving for snap parts.
