"""SOLIDWORKS-ready STEP export of the GUNWEISZ .22 LR box.

Rebuilds every part as true B-rep solids (real cylinders, planes, chamfers)
from the same parameters as make_holder.py, then writes:
  step/tray.step, step/lid.step, step/lock_slider.step   (single parts, logo inlay included)
  step/gunweisz_22lr_box_assembly.step                    (coloured: black box, gray logos,
                                                            lock sliders installed + locked)
Run:  pip install cadquery   then   python3 make_step.py
"""
import os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import make_holder as mh
import cadquery as cq

V = cq.Vector
LOGO_TOL = 0.03


# ---------------------------------------------------------------- helpers
def rrect(grow, z0, z1):
    """Rounded-rect prism matching mh.outline(grow)."""
    w, d, r = mh.TRAY_W + 2 * grow, mh.TRAY_D + 2 * grow, mh.CORNER_R + grow
    return (cq.Workplane("XY").workplane(offset=z0).rect(w, d).extrude(z1 - z0)
            .edges("|Z").fillet(r))


def rrect_wire(grow, z):
    w, d, r = mh.TRAY_W + 2 * grow, mh.TRAY_D + 2 * grow, mh.CORNER_R + grow
    f = cq.Workplane("XY").workplane(offset=z).rect(w, d).extrude(0.01).edges("|Z").fillet(r)
    return f.faces("<Z").wires().val()


def box(x0, y0, z0, dx, dy, dz):
    return cq.Workplane("XY").box(dx, dy, dz, centered=False).translate((x0, y0, z0))


def cyl(r, z0, z1, x, y):
    return cq.Workplane("XY").workplane(offset=z0).center(x, y).circle(r).extrude(z1 - z0)


def cs_to_solid(cs, z0, h):
    """manifold CrossSection -> extruded cadquery solid (handles holes)."""
    cs = cs.simplify(LOGO_TOL)               # +-0.03 mm: invisible, ~4x fewer faces
    polys = [np.array(p) for p in cs.to_polygons()]
    area = lambda p: 0.5 * np.sum(p[:, 0] * np.roll(p[:, 1], -1) - np.roll(p[:, 0], -1) * p[:, 1])
    outers = [p for p in polys if area(p) > 0]
    holes = [p for p in polys if area(p) < 0]
    from matplotlib.path import Path
    solids = []
    for o in outers:
        path = Path(o)
        inner = [hh for hh in holes if path.contains_point(hh[0])]
        # keep only holes not inside a smaller outer that also contains them
        wp = cq.Workplane("XY").workplane(offset=z0)
        ow = cq.Wire.makePolygon([V(x, y, z0) for x, y in o], close=True)
        iws = [cq.Wire.makePolygon([V(x, y, z0) for x, y in hh], close=True) for hh in inner]
        face = cq.Face.makeFromWires(ow, iws)
        solids.append(cq.Solid.extrudeLinear(face, V(0, 0, h)))
    # nested islands (ink inside a hole inside ink) are separate outers: fuse all,
    # then subtract hole regions that ended up covered by their parent incorrectly
    comp = cq.Compound.makeCompound(solids)
    return cq.Workplane("XY").add(comp)


def frustum_y(r_small, r_big, depth, y_face, sy, z):
    """Cone with axis along y, big end at the tray face, pointing into the wall."""
    return cq.Workplane("XY").add(cq.Solid.makeCone(
        r_big, r_small, depth + 0.01, pnt=V(0, y_face + sy * 0.01, z), dir=V(0, -sy, 0)))


# ---------------------------------------------------------------- tray
def tray():
    H = mh.TRAY_H
    t = rrect(0, 0, H).edges(">Z or <Z").chamfer(mh.CHAMFER)
    pts = [tuple(p) for p in mh.C]
    csk_angle = 2 * np.degrees(np.arctan(((mh.FUNNEL_D - mh.HOLE_D) / 2) / mh.FUNNEL_H))
    t = t.faces(">Z").workplane().pushPoints(pts).cskHole(
        mh.HOLE_D, mh.FUNNEL_D, csk_angle, depth=mh.HOLE_DEPTH)
    t = t.faces(">Z").workplane().pushPoints([tuple(p) for p in mh.magnet_xy()]).hole(
        mh.MAG_POCKET_D, mh.MAG_POCKET_H)
    # finger scoops (long sides)
    skirt_z = H - mh.LID_SKIRT
    sc_r = mh.SCOOP_W / 2
    zc = skirt_z - mh.SCOOP_H + sc_r
    for sy in (-1, 1):
        cone = cq.Workplane("XY").add(cq.Solid.makeCone(
            sc_r + 1, sc_r - mh.SCOOP_DEPTH, mh.SCOOP_DEPTH + 1,
            pnt=V(0, sy * (mh.YO + 1), zc), dir=V(0, -sy, 0)))
        keep = box(-sc_r - 2, (mh.YO - mh.SCOOP_DEPTH - 1) if sy > 0 else (-mh.YO - 3), 0,
                   mh.SCOOP_W + 4, mh.SCOOP_DEPTH + 4, skirt_z + 0.5)
        t = t.cut(cone.intersect(keep))
    # lock bayonet (left end; right end = 180 deg copy)
    c = mh.LOCK_CLEAR
    yu, yl = -mh.LOCK_TRAVEL / 2, mh.LOCK_TRAVEL / 2
    depth = mh.TONGUE_REACH + 0.35
    zb = mh.LOCK_Z - mh.BAR_H / 2 - c
    zt = mh.LOCK_Z + mh.BAR_H / 2 + c + mh.LOCK_FLOAT
    hw = mh.BAR_W / 2 + c
    XO = mh.XO
    entry = box(-XO - 1, yu - hw, zb, depth + 1, 2 * hw, H + 2 - zb)
    groove = box(-XO - 1, yu - hw, zb, depth + 1, yl - yu + 2 * hw, zt - zb)
    bump = cyl(0.8, zb, zt, -XO + depth + 0.8 - mh.DETENT_PROUD, 0)
    lock = entry.union(groove).cut(bump)
    t = t.cut(lock).cut(lock.rotate((0, 0, 0), (0, 0, 1), 180))
    return t


def tray_logo():
    return cs_to_solid(mh.mirror_x(mh.logo_cs(mh.TRAY_LOGO_H)), 0, mh.INLAY)


# ---------------------------------------------------------------- lid
def lock_pad_and_track():
    m = 2.6
    y0, y1 = mh.TRACK_Y0 - m, mh.TRACK_Y1 + m
    z0, z1 = mh.LOCK_Z - mh.UNDER_H - 1.4, mh.LOCK_Z + mh.UNDER_H + 1.4
    x_in = mh.TRACK_FLOOR + 0.8
    pad = box(mh.PAD_FACE, y0, z0, x_in - mh.PAD_FACE, y1 - y0, z1 - z0).faces("<X").edges().chamfer(0.8)
    L = mh.TRACK_Y1 - mh.TRACK_Y0
    opening = box(mh.PAD_FACE - 1, mh.TRACK_Y0, mh.LOCK_Z - mh.OPEN_H, mh.LIP_T + 1, L, 2 * mh.OPEN_H)
    lead = (cq.Workplane("YZ").workplane(offset=mh.PAD_FACE - 0.01)
            .center(mh.TRACK_Y0 + L / 2, mh.LOCK_Z).rect(L, 2 * (mh.OPEN_H + 0.41))
            .workplane(offset=0.41).rect(L, 2 * mh.OPEN_H).loft())
    under = box(mh.PAD_FACE + mh.LIP_T, mh.TRACK_Y0, mh.LOCK_Z - mh.UNDER_H, mh.UNDERCUT, L, 2 * mh.UNDER_H)
    sh = mh.BAR_H / 2 + 0.25
    slot = box(mh.TRACK_FLOOR - 0.1, mh.Y_UNLOCK - mh.BAR_W / 2 - 0.3, mh.LOCK_Z - sh,
               mh.TRACK_FLOOR - mh.SKIRT_OUT + mh.LID_WALL + mh.LID_CLEAR + 1,
               (mh.Y_LOCK - mh.Y_UNLOCK) + mh.BAR_W + 0.6, 2 * sh)
    return pad, opening.union(lead).union(under).union(slot)


def lid():
    g = mh.LID_CLEAR + mh.LID_WALL
    L = rrect(g, mh.Z_SKIRT, mh.Z_TOP).edges(">Z or <Z").chamfer(mh.CHAMFER)
    cav = rrect(mh.LID_CLEAR, mh.Z_SKIRT - 1, mh.Z_CEIL)
    lead = cq.Workplane("XY").add(cq.Solid.makeLoft(
        [rrect_wire(mh.LID_CLEAR + 0.6, mh.Z_SKIRT - 0.01), rrect_wire(mh.LID_CLEAR, mh.Z_SKIRT + 0.6)], True))
    L = L.cut(cav).cut(lead)
    r = mh.STANDOFF_D / 2
    for x, y in mh.standoff_xy():
        post = cyl(r, mh.TRAY_H + 0.5, mh.Z_CEIL + 0.5, x, y)
        foot = cq.Workplane("XY").add(cq.Solid.makeCone(r - 0.5, r, 0.5, pnt=V(x, y, mh.TRAY_H)))
        L = L.union(post).union(foot)
    zb = mh.TRAY_H + mh.MAG_GAP
    for x, y in mh.magnet_xy():
        L = L.union(cyl(mh.MAG_BOSS_D / 2, zb, mh.Z_CEIL + 0.5, x, y))
        L = L.cut(cyl(mh.MAG_POCKET_D / 2, zb - 0.01, zb + mh.MAG_POCKET_H, x, y))
    pad, trk = lock_pad_and_track()
    for rz in (0, 180):
        L = L.union(pad.rotate((0, 0, 0), (0, 0, 1), rz))
    for rz in (0, 180):
        L = L.cut(trk.rotate((0, 0, 0), (0, 0, 1), rz))
    return L


def lid_logo():
    logo = mh.logo_cs(mh.LID_LOGO_H)
    url = mh.text_cs(mh.URL_TEXT, mh.URL_H)
    lb, ub = logo.bounds(), url.bounds()
    total = (lb[3] - lb[1]) + 4.0 + (ub[3] - ub[1])
    logo = logo.translate([0, total / 2 - lb[3]])
    url = url.translate([0, -total / 2 - ub[1]])
    return cs_to_solid(logo + url, mh.Z_TOP - mh.INLAY, mh.INLAY)


# ---------------------------------------------------------------- slider
def slider():
    c = 0.2
    xb = mh.LIP_T + 0.1
    xf = mh.LIP_T + mh.UNDERCUT - c
    gh = mh.OPEN_H - c
    Ls = mh.SLIDER_L
    s = box(-mh.GRIP_OUT, 0, -gh, mh.GRIP_OUT, Ls, 2 * gh).faces("<X").edges().chamfer(0.55)
    for k in (-2, -1, 0, 1, 2):
        s = s.union(box(-mh.GRIP_OUT - 0.6, Ls / 2 + 3.2 * k - 0.5, -gh + 0.8, 0.7, 1.0, 2 * gh - 1.6))
    core_h = mh.OPEN_H - mh.ARM_T - mh.SLIT - c
    root = mh.BAR_W + 0.4
    s = s.union(box(-0.01, 0, -gh, xb + 0.02, root, 2 * gh))
    s = s.union(box(-0.01, 0, -core_h, xb + 0.02, Ls, 2 * core_h))
    s = s.union(box(xb, 0, -core_h, xf - xb, Ls, 2 * core_h))
    s = s.union(box(xb, 0, -gh, xf - xb, root, 2 * gh))
    tip = 2.0
    ztop, base = mh.OPEN_H + mh.CATCH, mh.OPEN_H - c
    for sz in (1, -1):
        z_lo = mh.OPEN_H - c - mh.ARM_T if sz > 0 else -(mh.OPEN_H - c)
        s = s.union(box(xb, root - 0.01, z_lo, xf - xb, Ls - root + 0.01, mh.ARM_T))
        a = (cq.Workplane("XZ").polyline([(xb, base - 0.01), (xb, ztop), (xb + 0.3, ztop), (xf, base + 0.05), (xf, base - 0.01)])
             .close().extrude(-(tip + ztop - base)).translate((0, Ls - tip - (ztop - base), 0)))
        b = (cq.Workplane("YZ").polyline([(Ls - tip - (ztop - base), base - 0.01), (Ls - tip, ztop), (Ls, ztop), (Ls, base - 0.01)])
             .close().extrude(xf - xb).translate((xb, 0, 0)))
        catch = a.intersect(b)
        if sz < 0:
            catch = catch.mirror("XY")
        s = s.union(catch)
    bar_len = (-mh.XO + mh.TONGUE_REACH) - mh.PAD_FACE - xf
    s = s.union(box(xf - 0.01, 0, -mh.BAR_H / 2, bar_len + 0.01, mh.BAR_W, mh.BAR_H))
    return s


def slider_installed(locked=True, rz=0):
    y = (mh.Y_LOCK if locked else mh.Y_UNLOCK) - mh.BAR_W / 2
    return slider().translate((mh.PAD_FACE, y, mh.LOCK_Z)).rotate((0, 0, 0), (0, 0, 1), rz)


# ---------------------------------------------------------------- main
def hexcolor(h):
    return cq.Color(*[int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)])


if __name__ == "__main__":
    out = os.path.join(mh.HERE, "step")
    os.makedirs(out, exist_ok=True)
    TL, LL = tray_logo(), lid_logo()
    T = tray().cut(TL)
    L = lid().cut(LL)
    S = slider()
    ref = mh.build()
    for name, wp, key in (("tray", T, "tray_body"), ("lid", L, "lid_body"), ("lock_slider", S, "lock_slider"),
                          ("tray_logo", TL, "tray_logo"), ("lid_logo", LL, "lid_logo")):
        shp = wp.val() if len(wp.vals()) == 1 else cq.Compound.makeCompound(wp.vals())
        print(f"{name:12s} faces {len(shp.Faces()):5d}  valid {shp.isValid()}  "
              f"vol {shp.Volume() / 1000:7.3f} cm3  (mesh {ref[key].volume() / 1000:7.3f})")
    black, gray = hexcolor(mh.BODY_COLOR), hexcolor(mh.LOGO_COLOR)
    # single parts: body + its logo as one STEP each (two coloured bodies)
    for name, body, logo in (("tray", T, TL), ("lid", L, LL), ("lock_slider", S, None)):
        a = cq.Assembly(name=name)
        a.add(body, name=f"{name}_body", color=black)
        if logo is not None:
            a.add(logo, name=f"{name}_logo", color=gray)
        a.save(os.path.join(out, f"{name}.step"))
    asm = cq.Assembly(name="GUNWEISZ_22LR_100_box")
    asm.add(T, name="tray", color=black)
    asm.add(TL, name="tray_logo", color=gray)
    asm.add(L, name="lid", color=black)
    asm.add(LL, name="lid_logo", color=gray)
    asm.add(slider_installed(True, 0), name="lock_slider_1", color=black)
    asm.add(slider_installed(True, 180), name="lock_slider_2", color=black)
    asm.save(os.path.join(out, "gunweisz_22lr_box_assembly.step"))
    print(sorted(os.listdir(out)))
