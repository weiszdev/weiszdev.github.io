"""Parametric 100-round .22 LR holder (tray + optional slip-on lid).

Rounds go in bullet-down, rim-up. Each hole has a funnel chamfer so rounds
drop in without fiddling, and the rim + ~6 mm of case stand proud of the top
so they're easy to pinch out. Run: python3 make_holder.py  -> STL files.
"""
import math
import numpy as np
import manifold3d as m3d
import trimesh

# ---- .22 LR (SAAMI nominal) -------------------------------------------
RIM_D, CASE_D, OAL = 6.99, 5.74, 25.4

# ---- tunables (mm) ------------------------------------------------------
ROWS, COLS   = 10, 10      # 10 x 10 = 100
PITCH        = 9.4         # center-to-center; leaves ~2.4 mm between rims
HOLE_D       = 6.15        # case is 5.74 -> ~0.4 mm clearance
FUNNEL_D     = 7.6         # top of chamfer (rim seats into it, self-centres)
FUNNEL_H     = 1.0
HOLE_DEPTH   = 19.0        # OAL 25.4 -> ~6.4 mm sticks up for grip
FLOOR        = 2.0
WALL         = 4.0         # material outside the outermost holes
CORNER_R     = 6.0
LID_CLEAR    = 0.4         # per side
LID_WALL     = 2.0
LID_SKIRT    = 8.0         # how far lid slides down over the tray
LID_HEADROOM = 2.0         # above the rims

SEG = 48
H = FLOOR + HOLE_DEPTH
row_dy = PITCH * math.sqrt(3) / 2

def centers():
    pts = []
    for r in range(ROWS):
        off = PITCH / 2 if r % 2 else 0
        for c in range(COLS):
            pts.append((c * PITCH + off, r * row_dy))
    pts = np.array(pts)
    return pts - pts.mean(axis=0)

def outline(grow=0.0):
    """Rounded rectangle that hugs the staggered grid."""
    p = centers()
    w = np.ptp(p[:, 0]) + HOLE_D + 2 * WALL + 2 * grow
    d = np.ptp(p[:, 1]) + HOLE_D + 2 * WALL + 2 * grow
    r = CORNER_R + grow
    sq = m3d.CrossSection.square([w - 2 * r, d - 2 * r], center=True)
    return sq.offset(r, m3d.JoinType.Round, circular_segments=SEG)

def tray():
    body = m3d.Manifold.extrude(outline(), H)
    hole = m3d.Manifold.cylinder(HOLE_DEPTH + 1, HOLE_D / 2, HOLE_D / 2, SEG)
    funnel = m3d.Manifold.cylinder(FUNNEL_H + 0.01, HOLE_D / 2, FUNNEL_D / 2, SEG)
    one = hole.translate([0, 0, FLOOR]) + funnel.translate([0, 0, H - FUNNEL_H])
    cutters = m3d.Manifold.batch_boolean(
        [one.translate([x, y, 0]) for x, y in centers()], m3d.OpType.Add)
    return body - cutters

def lid():
    proud = OAL - HOLE_DEPTH
    inner_h = LID_SKIRT + proud + LID_HEADROOM
    outer = m3d.Manifold.extrude(outline(LID_CLEAR + LID_WALL), inner_h + LID_WALL)
    inner = m3d.Manifold.extrude(outline(LID_CLEAR), inner_h + 0.01)
    # printed open-side-up: inner cavity starts at the lid top (z=LID_WALL)
    return outer - inner.translate([0, 0, LID_WALL])

def save(man, name):
    mesh = man.to_mesh()
    t = trimesh.Trimesh(mesh.vert_properties[:, :3], mesh.tri_verts)
    assert t.is_watertight, name
    t.export(name)
    b = t.bounds
    print(f"{name}: {b[1]-b[0]} mm, {len(t.faces)} tris, watertight={t.is_watertight}")
    return t

if __name__ == "__main__":
    save(tray(), "22lr_100_tray.stl")
    save(lid(), "22lr_100_lid.stl")
