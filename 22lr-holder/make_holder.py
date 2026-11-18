"""GUNWEISZ 100-round .22 LR box: tray + floating magnetic lid + optional slide locks.

Rounds go in bullet-down, rim-up.  All dimensions in mm.
Run:  pip install manifold3d trimesh numpy pillow opencv-python-headless
      python3 make_holder.py
Outputs STLs for every part plus a Bambu Studio plate (.3mf) with the gray
logo inlays already assigned to filament 2.

Coordinates: "use" orientation, tray bottom at z=0, centred on x/y.
x = long direction (short sides / ends at +-x), y = depth (long sides at +-y).
"""
import math, os, uuid, zipfile
import numpy as np
import manifold3d as m3d
import trimesh
import cv2
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
CS, M = m3d.CrossSection, m3d.Manifold

# ---- .22 LR (SAAMI max) -------------------------------------------------
RIM_D, CASE_D, OAL = 6.99, 5.74, 25.4

# ---- grid / tray -----------------------------------------------------------
ROWS, COLS   = 10, 10
PITCH        = 9.4
HOLE_D       = 6.15        # case 5.74 -> ~0.4 clearance (worked well in v1)
FUNNEL_D     = 7.6
FUNNEL_H     = 1.0
TRAY_H       = 16.0        # v1 was 21; 5 mm shorter as requested
FLOOR        = 2.0
HOLE_DEPTH   = TRAY_H - FLOOR          # 14 -> rounds stand ~11.4 proud
WALL         = 5.5         # long sides, outside the holes
END_WALL     = 6.2         # short ends, room for magnets + lock channel
CORNER_R     = 4.0
CHAMFER      = 1.0         # every external edge

# ---- lid -------------------------------------------------------------------
LID_CLEAR    = 0.4         # per side, skirt to tray
LID_WALL     = 2.0
LID_SKIRT    = 10.0        # how far the skirt hangs down over the tray
LID_TOP      = 2.4
HEADROOM     = 1.0         # ceiling above the tallest round, lid on standoffs
STANDOFF_D   = 4.5

# ---- magnets 6 x 2.5 -------------------------------------------------------
MAG_D, MAG_T = 6.0, 2.5
MAG_POCKET_D = 6.25        # press/glue fit
MAG_POCKET_H = 2.6
MAG_GAP      = 1.0         # face-to-face gap when lid sits on the standoffs
MAG_BOSS_D   = 8.4

# ---- finger scoops (long sides) ---------------------------------------------
SCOOP_W      = 26.0        # opening width at the tray face
SCOOP_DEPTH  = 3.0
SCOOP_H      = 4.0         # how far below the lid edge it reaches

# ---- slide lock (short ends, optional) ---------------------------------------
# A thumb slider rides in a recess on each short side of the lid skirt.  Its
# round stem passes through a slot in the skirt and carries a tongue that
# drops down an entry channel in the tray end and slides sideways into a
# roofed groove (bayonet) - the roof is what stops the lid lifting.
LOCK_Z       = 11.0        # tongue centre height (tray coords, lid seated)
LOCK_TRAVEL  = 5.0         # sideways slide, unlocked -> locked
LOCK_FLOAT   = 1.0         # lid can rise this much while locked
STEM_D       = 3.0
TONGUE_W     = 2.8         # along the slide
TONGUE_H     = 4.0
TONGUE_T     = 2.0         # into the tray
PLATE_W, PLATE_H, PLATE_T = 12.0, 6.4, 2.0
RECESS       = 0.8         # plate recess depth in skirt
LOCK_CLEAR   = 0.25
DETENT_PROUD = 0.5

# ---- logo inlay --------------------------------------------------------------
INLAY        = 0.8         # 4 layers @ 0.2
LOGO_IMG     = os.path.join(HERE, "gunweisz_logo.webp")
LID_LOGO_H   = 62.0
TRAY_LOGO_H  = 68.0
URL_TEXT     = "gunweisz.com"
URL_H        = 6.5         # cap height-ish of the url line
FONT         = "/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf"

SEG = 64
ROW_DY = PITCH * math.sqrt(3) / 2
EPS = 0.01

# ============================================================================
def centers():
    pts = [((c + (0.5 if r % 2 else 0)) * PITCH, r * ROW_DY)
           for r in range(ROWS) for c in range(COLS)]
    pts = np.array(pts)
    return pts - (pts.min(0) + pts.max(0)) / 2

C = centers()
XMIN, XMAX = C[:, 0].min(), C[:, 0].max()
YMIN, YMAX = C[:, 1].min(), C[:, 1].max()
TRAY_W = XMAX - XMIN + HOLE_D + 2 * END_WALL
TRAY_D = YMAX - YMIN + HOLE_D + 2 * WALL
XO, YO = TRAY_W / 2, TRAY_D / 2          # tray outer half-extents


def poly(pts):
    """CrossSection from one polygon, whatever its winding."""
    p = np.array(pts, float)
    area = 0.5 * np.sum(p[:, 0] * np.roll(p[:, 1], -1) - np.roll(p[:, 0], -1) * p[:, 1])
    return CS([p[::-1] if area < 0 else p])


def outline(grow=0.0):
    r = CORNER_R + grow
    sq = CS.square([TRAY_W + 2 * grow - 2 * r, TRAY_D + 2 * grow - 2 * r], center=True)
    return sq.offset(r, m3d.JoinType.Round, circular_segments=SEG)


def chamfered_prism(grow, z0, z1, ch_bot=CHAMFER, ch_top=CHAMFER):
    """Convex rounded-rect prism with 45 deg chamfers (hull of slices)."""
    def slab(g, z):
        return M.extrude(outline(g), EPS).translate([0, 0, z])
    parts = [slab(grow - ch_bot, z0), slab(grow, z0 + ch_bot),
             slab(grow, z1 - ch_top - EPS), slab(grow - ch_top, z1 - EPS)]
    return M.batch_hull(parts)


# ---- logo / text -> CrossSection ------------------------------------------
def trace(mask, px_mm):
    """Binary mask (True = ink) -> CrossSection in mm, centred, y up."""
    m = (mask.astype(np.uint8) * 255)
    cnts, _ = cv2.findContours(m, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
    polys = []
    h = mask.shape[0]
    for c in cnts:
        c = cv2.approxPolyDP(c, 0.7, True).reshape(-1, 2).astype(float)
        if len(c) < 3:
            continue
        c[:, 1] = h - c[:, 1]
        polys.append(c * px_mm)
    cs = CS(polys, m3d.FillRule.EvenOdd)
    b = cs.bounds()
    return cs.translate([-(b[0] + b[2]) / 2, -(b[1] + b[3]) / 2])


def clean(cs, min_feature=0.35):
    """Drop ink thinner than a nozzle line, close hairline gaps."""
    r = min_feature / 2
    cs = cs.offset(-r, m3d.JoinType.Round).offset(r, m3d.JoinType.Round)
    cs = cs.offset(0.12, m3d.JoinType.Round).offset(-0.12, m3d.JoinType.Round)
    return cs


def logo_cs(height):
    im = Image.open(LOGO_IMG).convert("RGBA")
    bg = Image.new("RGBA", im.size, (255, 255, 255, 255))
    bg.alpha_composite(im)
    ink = np.array(bg.convert("L")) < 128
    ys, xs = np.nonzero(ink)
    ink = ink[ys.min() - 2:ys.max() + 3, xs.min() - 2:xs.max() + 3]
    ink = np.pad(ink, 4)
    return clean(trace(ink, height / (ys.max() - ys.min())))


def text_cs(text, height):
    font = ImageFont.truetype(FONT, 400)
    l, t, r, b = font.getbbox(text)
    im = Image.new("L", (r - l + 40, b - t + 40), 0)
    ImageDraw.Draw(im).text((20 - l, 20 - t), text, font=font, fill=255)
    ink = np.array(im) > 127
    ys, _ = np.nonzero(ink)
    return clean(trace(ink, height / (ys.max() - ys.min())))


def mirror_x(cs):
    return cs.mirror([1, 0])


# ---- magnet / standoff placement ------------------------------------------
def magnet_xy():
    """Two per short end, in the gaps left by the staggered rows.
    Left end uses odd rows 1 & ROWS-1, right end even rows 0 & ROWS-2
    -> the pattern is symmetric under 180 deg, so the lid fits either way."""
    ys = [r * ROW_DY for r in range(ROWS)]
    y0 = (ys[0] + ys[-1]) / 2
    left = [(XMIN - 4.0, ys[r] - y0) for r in (1, ROWS - 1)]
    right = [(XMAX + 4.0, ys[r] - y0) for r in (0, ROWS - 2)]
    return left + right


def standoff_xy():
    """Pick, per corner, the free spot on the tray top nearest the corner."""
    r = STANDOFF_D / 2
    inner = outline(-(CHAMFER + 0.6 + r))
    rims = C
    mags = np.array(magnet_xy())
    out = []
    for sx in (-1, 1):
        for sy in (-1, 1):
            best = None
            for x in np.arange(0, XO, 0.25):
                for y in np.arange(0, YO, 0.25):
                    p = np.array([sx * x, sy * y])
                    if not _inside(inner, p):
                        continue
                    if np.min(np.hypot(*(rims - p).T)) < FUNNEL_D / 2 + r + 0.6:
                        continue
                    if np.min(np.hypot(*(mags - p).T)) < MAG_BOSS_D / 2 + r + 0.8:
                        continue
                    if abs(p[1]) < LOCK_TRAVEL / 2 + PLATE_W / 2 + 1:      # keep clear of lock channel
                        continue
                    d = math.hypot(XO - x, YO - y)
                    if best is None or d < best[0]:
                        best = (d, p)
            out.append(tuple(best[1]))
    return out


def _inside(cs, p):
    # manifold3d CrossSection has no point query; test via tiny square intersection
    sq = CS.square([0.02, 0.02], center=True).translate(list(p))
    return (cs ^ sq).area() > 0.0003


# ============================================================================
# TRAY
# ============================================================================
def tray():
    body = chamfered_prism(0, 0, TRAY_H)

    # cartridge holes with funnel
    hole = M.cylinder(HOLE_DEPTH + 1, HOLE_D / 2, HOLE_D / 2, SEG).translate([0, 0, FLOOR])
    fun = M.cylinder(FUNNEL_H + EPS, HOLE_D / 2, FUNNEL_D / 2, SEG).translate([0, 0, TRAY_H - FUNNEL_H])
    one = hole + fun
    cut = [one.translate([x, y, 0]) for x, y in C]

    # magnet pockets
    for x, y in magnet_xy():
        cut.append(M.cylinder(MAG_POCKET_H + 1, MAG_POCKET_D / 2, MAG_POCKET_D / 2, SEG)
                   .translate([x, y, TRAY_H - MAG_POCKET_H]))

    # finger scoops on the long sides, below the lid skirt line (45 deg walls)
    skirt_z = TRAY_H - LID_SKIRT
    sc_r = SCOOP_W / 2
    for sy in (-1, 1):
        cone = M.cylinder(SCOOP_DEPTH, sc_r - SCOOP_DEPTH, sc_r, SEG * 2) \
            + M.cylinder(1, sc_r, sc_r, SEG * 2).translate([0, 0, SCOOP_DEPTH - EPS])
        cone = cone.rotate([-90 * sy, 0, 0]).translate([0, sy * (YO - SCOOP_DEPTH), 0])
        cone = cone.translate([0, 0, skirt_z - SCOOP_H + sc_r])
        keep = M.cube([SCOOP_W + 4, SCOOP_DEPTH + 4, skirt_z + 0.5]).translate(
            [-SCOOP_W / 2 - 2, (YO - SCOOP_DEPTH - 1) if sy > 0 else (-YO - 3), 0])
        cut.append(cone ^ keep)

    # slide-lock bayonet: entry channel from the top + roofed groove (left end,
    # right end is the same rotated 180 deg so the lid fits either way round)
    c = LOCK_CLEAR
    yu, yl = -LOCK_TRAVEL / 2, LOCK_TRAVEL / 2
    depth = (RECESS + STEM_L - LID_CLEAR - LID_WALL) + TONGUE_T + 0.35  # past the face
    zb = LOCK_Z - TONGUE_H / 2 - c
    zt = LOCK_Z + TONGUE_H / 2 + c + LOCK_FLOAT
    hw = TONGUE_W / 2 + c
    entry = M.cube([depth + 1, 2 * hw, TRAY_H + 2 - zb]).translate([-XO - 1, yu - hw, zb])
    groove = M.cube([depth + 1, yl - yu + 2 * hw, zt - zb]).translate([-XO - 1, yu - hw, zb])
    bump = M.cylinder(zt - zb, 0.8, 0.8, 24).translate([-XO + depth + 0.8 - DETENT_PROUD, 0, zb])
    lock_l = (entry + groove) - bump
    for rz in (0, 180):
        cut.append(lock_l.rotate([0, 0, rz]))
    bumps = []

    t = body - M.batch_boolean(cut, m3d.OpType.Add)
    clip = chamfered_prism(0, 0, TRAY_H)
    for b in bumps:
        t = t + (b ^ clip)
    return t


def tray_logo():
    cs = mirror_x(logo_cs(TRAY_LOGO_H))       # reads correctly when flipped over
    return M.extrude(cs, INLAY)


# ============================================================================
# LID
# ============================================================================
Z_CEIL = FLOOR + OAL + HEADROOM          # inner ceiling, tray coords
Z_TOP = Z_CEIL + LID_TOP
Z_SKIRT = TRAY_H - LID_SKIRT


def lid():
    g_out = LID_CLEAR + LID_WALL
    shell = chamfered_prism(g_out, Z_SKIRT, Z_TOP)
    # cavity with a 0.6 mm lead-in at the skirt mouth
    cav = M.batch_hull([
        M.extrude(outline(LID_CLEAR + 0.6), EPS).translate([0, 0, Z_SKIRT - 1]),
        M.extrude(outline(LID_CLEAR + 0.6), EPS).translate([0, 0, Z_SKIRT]),
        M.extrude(outline(LID_CLEAR), EPS).translate([0, 0, Z_SKIRT + 0.6]),
        M.extrude(outline(LID_CLEAR), EPS).translate([0, 0, Z_CEIL - EPS]),
    ])
    lid = shell - cav

    adds = []
    # corner standoffs: land on the tray top
    for x, y in standoff_xy():
        post = M.cylinder(Z_CEIL - TRAY_H + 0.5, STANDOFF_D / 2, STANDOFF_D / 2, SEG)
        tip = M.cylinder(0.5, STANDOFF_D / 2 - 0.5, STANDOFF_D / 2, SEG)   # chamfered foot
        adds.append((post.translate([0, 0, 0.5]) + tip).translate([x, y, TRAY_H]))
    # magnet bosses
    pockets = []
    zb = TRAY_H + MAG_GAP
    for x, y in magnet_xy():
        adds.append(M.cylinder(Z_CEIL - zb + 0.5, MAG_BOSS_D / 2, MAG_BOSS_D / 2, SEG)
                    .translate([x, y, zb]))
        pockets.append(M.cylinder(MAG_POCKET_H, MAG_POCKET_D / 2, MAG_POCKET_D / 2, SEG)
                       .translate([x, y, zb - EPS]))
    lid = lid + M.batch_boolean(adds, m3d.OpType.Add)

    # slider recess + stem slot in each short side of the skirt
    yu, yl = -LOCK_TRAVEL / 2, LOCK_TRAVEL / 2
    sk_out = -XO - LID_CLEAR - LID_WALL
    rh = PLATE_H / 2 + 0.2
    recess = M.cube([RECESS + 1, (yl - yu) + PLATE_W + 0.4, 2 * rh]) \
        .translate([sk_out - 1, yu - PLATE_W / 2 - 0.2, LOCK_Z - rh])
    sh = STEM_D / 2 + 0.2
    slot = M.cube([LID_WALL + LID_CLEAR + 2, (yl - yu) + 2 * sh, 2 * sh]) \
        .translate([sk_out - 1, yu - sh, LOCK_Z - sh])
    for rz in (0, 180):
        pockets.append((recess + slot).rotate([0, 0, rz]))
    lid = lid - M.batch_boolean(pockets, m3d.OpType.Add)
    return lid


def lid_logo():
    logo = logo_cs(LID_LOGO_H)
    url = text_cs(URL_TEXT, URL_H)
    lb, ub = logo.bounds(), url.bounds()
    gap = 4.0
    total = (lb[3] - lb[1]) + gap + (ub[3] - ub[1])
    logo = logo.translate([0, total / 2 - lb[3]])
    url = url.translate([0, -total / 2 - ub[1]])
    return M.extrude(logo + url, INLAY).translate([0, 0, Z_TOP - INLAY])


# ============================================================================
# SLIDE-LOCK SLIDER (print 2)
# ============================================================================
STEM_L = LID_WALL + 0.2        # long enough for the twist-in install


def slider():
    """Local coords: x = inward, plate outer face at x=0, centred on y/z."""
    plate = M.batch_hull([
        M.cube([EPS, PLATE_W - 1.2, PLATE_H - 1.2], center=True).translate([EPS / 2, 0, 0]),
        M.cube([PLATE_T - 0.6, PLATE_W, PLATE_H], center=True).translate([0.6 + (PLATE_T - 0.6) / 2, 0, 0]),
    ])
    stem = M.cylinder(STEM_L + 0.5, STEM_D / 2, STEM_D / 2, 32).rotate([0, 90, 0]) \
        .translate([PLATE_T - 0.2, 0, 0])
    x0 = PLATE_T + STEM_L
    tongue = M.cube([TONGUE_T, TONGUE_W, TONGUE_H]).translate([x0, -TONGUE_W / 2, -TONGUE_H / 2])
    # 45 deg transition so the tongue prints without a flat overhang
    neck = M.batch_hull([M.cylinder(EPS, STEM_D / 2, STEM_D / 2, 32).rotate([0, 90, 0]).translate([x0 - 0.8, 0, 0]),
                         M.cube([EPS, TONGUE_W, TONGUE_H]).translate([x0, -TONGUE_W / 2, -TONGUE_H / 2])])
    neck = neck ^ M.cube([2, TONGUE_W, TONGUE_H]).translate([x0 - 1, -TONGUE_W / 2, -TONGUE_H / 2])
    return plate + stem + neck + tongue


def slider_assembled(locked, lid_dz=0.0):
    """Left-end slider in tray coordinates (lid seated + lid_dz)."""
    y = LOCK_TRAVEL / 2 if locked else -LOCK_TRAVEL / 2
    plate_in = -XO - LID_CLEAR - LID_WALL + RECESS
    return slider().translate([plate_in - PLATE_T, y, LOCK_Z + lid_dz])


# ============================================================================
def to_tm(man):
    mesh = man.to_mesh()
    t = trimesh.Trimesh(np.array(mesh.vert_properties)[:, :3], np.array(mesh.tri_verts), process=False)
    assert t.is_watertight, "not watertight"
    return t


def build():
    parts = {
        "tray_body": tray() - tray_logo(),
        "tray_logo": tray_logo(),
        "lid_body": None, "lid_logo": None,
        "lock_slider": slider(),
    }
    L, LL = lid(), lid_logo()
    parts["lid_body"] = L - LL
    parts["lid_logo"] = LL ^ L
    return parts


# ---- print orientation -------------------------------------------------------
def print_pose(name, t):
    t = t.copy()
    if name.startswith("lid"):
        # top on the bed: rotate 180 about x
        t.apply_transform(trimesh.transformations.rotation_matrix(math.pi, [1, 0, 0]))
        t.apply_translation([0, 0, Z_TOP])
    if name == "lock_slider":
        # thumb plate flat on the bed, tongue up
        t.apply_transform(trimesh.transformations.rotation_matrix(-math.pi / 2, [0, 1, 0]))
        t.apply_translation([0, 0, -t.bounds[0][2]])
    return t


# ---- Bambu Studio 3MF (multi-part objects, logo on filament 2) ----------------
def write_bambu_3mf(path, objects):
    """objects: list of (name, [(part_name, trimesh, extruder)], (x, y))"""
    ns = 'xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" ' \
         'xmlns:BambuStudio="http://schemas.bambulab.com/package/2021" ' \
         'xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/06"'
    files, rels, res, build, cfg = {}, [], [], [], []
    plate = []
    next_id = 1
    for oi, (oname, parts, (px, py)) in enumerate(objects):
        sub = f"3D/Objects/object_{oi + 1}.model"
        mesh_xml, comps, part_cfg = [], [], []
        for part_name, tm, ext in parts:
            pid = next_id; next_id += 1
            v = "".join(f'<vertex x="{a:.4f}" y="{b:.4f}" z="{c:.4f}"/>' for a, b, c in tm.vertices)
            f = "".join(f'<triangle v1="{a}" v2="{b}" v3="{c}"/>' for a, b, c in tm.faces)
            mesh_xml.append(f'<object id="{pid}" p:UUID="{uuid.uuid4()}" type="model">'
                            f'<mesh><vertices>{v}</vertices><triangles>{f}</triangles></mesh></object>')
            comps.append(f'<component p:path="/{sub}" objectid="{pid}" p:UUID="{uuid.uuid4()}" '
                         f'transform="1 0 0 0 1 0 0 0 1 0 0 0"/>')
            part_cfg.append(
                f'    <part id="{pid}" subtype="normal_part">\n'
                f'      <metadata key="name" value="{part_name}"/>\n'
                f'      <metadata key="matrix" value="1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1"/>\n'
                f'      <metadata key="extruder" value="{ext}"/>\n'
                f'      <mesh_stat edges_fixed="0" degenerate_facets="0" facets_removed="0" facets_reversed="0" backwards_edges="0"/>\n'
                f'    </part>\n')
        files[sub] = (f'<?xml version="1.0" encoding="UTF-8"?>\n<model unit="millimeter" xml:lang="en-US" {ns} '
                      f'requiredextensions="p"><metadata name="BambuStudio:3mfVersion">1</metadata>'
                      f'<resources>{"".join(mesh_xml)}</resources><build/></model>')
        rels.append(f'<Relationship Target="/{sub}" Id="rel-{oi + 1}" '
                    f'Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>')
        oid = next_id; next_id += 1
        res.append(f'<object id="{oid}" p:UUID="{uuid.uuid4()}" type="model"><components>{"".join(comps)}</components></object>')
        build.append(f'<item objectid="{oid}" p:UUID="{uuid.uuid4()}" '
                     f'transform="1 0 0 0 1 0 0 0 1 {px:.3f} {py:.3f} 0" printable="1"/>')
        cfg.append(f'  <object id="{oid}">\n    <metadata key="name" value="{oname}"/>\n'
                   f'    <metadata key="extruder" value="{parts[0][2]}"/>\n{"".join(part_cfg)}  </object>\n')
        plate.append(f'    <model_instance>\n      <metadata key="object_id" value="{oid}"/>\n'
                     f'      <metadata key="instance_id" value="0"/>\n'
                     f'      <metadata key="identify_id" value="{100 + oi}"/>\n    </model_instance>\n')
    files["3D/3dmodel.model"] = (
        f'<?xml version="1.0" encoding="UTF-8"?>\n<model unit="millimeter" xml:lang="en-US" {ns} requiredextensions="p">\n'
        f' <metadata name="Application">BambuStudio-02.00.00.00</metadata>\n'
        f' <metadata name="BambuStudio:3mfVersion">1</metadata>\n'
        f' <metadata name="Title">GUNWEISZ 100rd .22LR box</metadata>\n'
        f' <resources>{"".join(res)}</resources>\n <build p:UUID="{uuid.uuid4()}">{"".join(build)}</build>\n</model>')
    files["3D/_rels/3dmodel.model.rels"] = (
        '<?xml version="1.0" encoding="UTF-8"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + "".join(rels) + '</Relationships>')
    files["_rels/.rels"] = (
        '<?xml version="1.0" encoding="UTF-8"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Target="/3D/3dmodel.model" Id="rel-1" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>'
        '</Relationships>')
    files["[Content_Types].xml"] = (
        '<?xml version="1.0" encoding="UTF-8"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>'
        '<Default Extension="png" ContentType="image/png"/>'
        '<Default Extension="config" ContentType="text/xml"/></Types>')
    files["Metadata/model_settings.config"] = (
        '<?xml version="1.0" encoding="UTF-8"?>\n<config>\n' + "".join(cfg) +
        '  <plate>\n    <metadata key="plater_id" value="1"/>\n    <metadata key="plater_name" value="GUNWEISZ box"/>\n'
        '    <metadata key="locked" value="false"/>\n' + "".join(plate) + '  </plate>\n</config>\n')
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        for k in ["[Content_Types].xml", "_rels/.rels", "3D/3dmodel.model", "3D/_rels/3dmodel.model.rels"] + \
                 [k for k in files if k.startswith("3D/Objects")] + ["Metadata/model_settings.config"]:
            z.writestr(k, files[k])


if __name__ == "__main__":
    out = os.path.join(HERE, "stl")
    os.makedirs(out, exist_ok=True)
    parts = build()
    tms = {}
    for k, v in parts.items():
        t = to_tm(v)
        tms[k] = t
        p = print_pose(k, t)
        p.export(os.path.join(out, f"{k}.stl"))
        print(f"{k:10s} {np.round(p.extents, 2)}  vol {t.volume / 1000:.1f} cm3")
    print("standoffs", np.round(standoff_xy(), 2).tolist())
    print("magnets", np.round(magnet_xy(), 2).tolist())
    print("tray", round(TRAY_W, 2), round(TRAY_D, 2), "lid top z", Z_TOP, "ceiling", Z_CEIL)

    # X1C plate: 256 x 256
    P = {k: print_pose(k, t) for k, t in tms.items()}
    def recentre(ts):
        b = trimesh.util.concatenate(ts).bounds
        off = [-(b[0][0] + b[1][0]) / 2, -(b[0][1] + b[1][1]) / 2, -b[0][2]]
        return [t.copy().apply_translation(off) for t in ts], b[1] - b[0]
    (tb, tl), tsz = recentre([P["tray_body"], P["tray_logo"]])
    (lb, ll), lsz = recentre([P["lid_body"], P["lid_logo"]])
    (bo,), bsz = recentre([P["lock_slider"]])
    gap = 8
    x_tray = 128 - (tsz[0] + gap + lsz[0]) / 2 + tsz[0] / 2
    x_lid = x_tray + tsz[0] / 2 + gap + lsz[0] / 2
    y_main = 128 + 12
    y_bolt = y_main - max(tsz[1], lsz[1]) / 2 - gap - bsz[1] / 2
    objs = [
        ("tray", [("tray body", tb, 1), ("tray logo (gray)", tl, 2)], (x_tray, y_main)),
        ("lid", [("lid body", lb, 1), ("lid logo (gray)", ll, 2)], (x_lid, y_main)),
        ("lock slider 1", [("slider", bo, 1)], (128 - 12, y_bolt)),
        ("lock slider 2", [("slider", bo, 1)], (128 + 12, y_bolt)),
    ]
    write_bambu_3mf(os.path.join(HERE, "gunweisz_22lr_100_x1c.3mf"), objs)
    # plate footprint check
    print("plate x span", round(x_tray - tsz[0] / 2, 1), round(x_lid + lsz[0] / 2, 1),
          "y span", round(y_bolt - bsz[1] / 2, 1), round(y_main + max(tsz[1], lsz[1]) / 2, 1))
