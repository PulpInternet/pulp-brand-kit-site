#!/usr/bin/env python3
"""brand_lint.py: the lint checks of the Pulp Brand Kit 2026, v6a-LibreFranklin.

Usage:
  python3 brand_lint.py --property pulp page.html styles.css ...
  python3 brand_lint.py --self            # checks tokens.json and rules.json themselves

Properties: pulp, publishing, thinkwell, typodojo. Every rule marked "lint" in rules.json has a checker here.
Prints one line per failure: file:line  RULE-ID  what was found. Exits 1 on any failure.
"""
import json, os, re, sys, html as H

HERE = os.path.dirname(os.path.abspath(__file__))
TOKENS = json.load(open(os.path.join(HERE, 'tokens.json')))
RULES = {r['id']: r for r in json.load(open(os.path.join(HERE, 'rules.json')))['rules']}

def palette():
    hexes = set()
    for tier in ('neutral', 'tint', 'accent', 'context', 'thinkwell'):
        for c in TOKENS['color'][tier]:
            hexes.add(c['hex'].upper())
    for prop in TOKENS['modes'].values():
        for mode in prop.values():
            hexes.update(v.upper() for v in mode.values())
    hexes.update(v.upper() for v in TOKENS['data']['slots'].values())
    hexes.update(['#FFFFFF', '#000000'])
    return hexes
PALETTE = palette()
ACCENT_HEX = {c['hex'].upper() for c in TOKENS['color']['accent'] + TOKENS['color']['context']}
TW_PINKS = {c['hex'].upper() for c in TOKENS['color']['thinkwell'][:3]}
RETIRED = {c['hex'].upper() for c in TOKENS['color']['retired']}
FACES = TOKENS['type']['faces']
SPACE = set(TOKENS['space'])
RADII = TOKENS['radii']
DURS = set(TOKENS['motion']['durations'].values())
ZS = set(TOKENS['zIndex'].values()) | {0, 1, -1}
CTRL = set(TOKENS['controlHeights'])
BANNED = TOKENS['voice']['banned']
GENERIC = {'sans-serif', 'serif', 'system-ui', 'inherit', 'arial', 'helvetica', 'google sans'}
MONO = re.compile(r'monospace|courier|jetbrains|menlo|consolas|sf mono|roboto mono|ibm plex mono|fira code|source code', re.I)

fails = []
def fail(f, src, pos, rid, found):
    line = src.count('\n', 0, pos) + 1
    fails.append((f, line, rid, found.strip()[:90]))

def visible_text(src):
    """Text a reader sees: tags, styles, scripts and SVG removed. Returns (text, mapping to source offsets) roughly."""
    s = re.sub(r'<(script|style|svg)\b.*?</\1>', lambda m: ' ' * len(m.group(0)), src, flags=re.S | re.I)
    s = re.sub(r'<[^>]+>', lambda m: ' ' * len(m.group(0)), s)
    return s

def lint(f, prop):
    src = open(f, encoding='utf-8').read()
    if f.endswith('.css'):
        lint_css(f, src, src, 0)
    for m in re.finditer(r'<style[^>]*>(.*?)</style>', src, re.S):
        if '@layer' in m.group(1):
            lint_css(f, src, m.group(1), m.start(1))
    is_markup = f.endswith(('.html', '.htm', '.tsx', '.jsx', '.md', '.mdx'))
    text = visible_text(src) if is_markup else ''
    css = src
    # ---------------- voice
    for m in re.finditer('[—–]', text):
        fail(f, src, m.start(), 'R-TXT-01', 'em or en dash: ' + text[max(0, m.start()-30):m.start()+10])
    for m in re.finditer('™', text):
        fail(f, src, m.start(), 'R-LOGO-07', 'trademark sign in running text')
    for w in BANNED:
        for m in re.finditer(re.escape(w), text, re.I):
            fail(f, src, m.start(), 'R-TXT-03', 'banned: ' + m.group(0))
    for m in re.finditer(r'\b[Tt]hinkW', text):
        fail(f, src, m.start(), 'R-TXT-04', 'Thinkwell with a capital w')
    for m in re.finditer(r'\b(he|she|his|her|him|hers)\b', text, re.I):
        ctx = text[max(0, m.start()-40):m.end()+20]
        if re.search(r'\bTypo\b', ctx):
            continue  # Typo is a character with a name and a pronoun
        fail(f, src, m.start(), 'R-TXT-08', 'gendered pronoun: ' + ctx)
    for m in re.finditer(r'(EST\.?|established|founded)\s*(in\s*)?(\d{4})', text, re.I):
        if m.group(3) != '2026':
            fail(f, src, m.start(), 'R-DATE-01', m.group(0))
    for m in re.finditer(r'(a pulp special project|a pulp product|published by pulp|part of the pulp platform)', text, re.I):
        if m.group(0) not in ('A Pulp special project', 'A Pulp product', 'Published by Pulp', 'A PULP SPECIAL PROJECT', 'PUBLISHED BY PULP', 'Part of the Pulp platform', 'PART OF THE PULP PLATFORM'):
            fail(f, src, m.start(), 'R-LOGO-04', 'endorsement must read exactly: ' + m.group(0))
    # R-LOGO-10: platform module names keep their exact spelling and case
    for name in ('Radiance', 'Windfall', 'TrueAura', 'Groundwater', 'websoil', 'domaincrust', 'codemantle', 'servercore',
                 'weftConversations', 'WarpDisplays', 'DyeMedia', 'BightInteractions', 'Loosethreads', 'typodojo.js'):
        for m in re.finditer(r'(?<![\w/.-])' + re.escape(name) + r'(?![\w-])', text, re.I):
            if m.group(0) != name and not (name == 'Loosethreads' and m.group(0) == 'LOOSETHREADS'):
                fail(f, src, m.start(), 'R-LOGO-10', f'{m.group(0)} should read {name}')
    # ---------------- color
    for m in re.finditer(r'#[0-9a-fA-F]{6}\b', css):
        hx = m.group(0).upper()
        if hx in RETIRED:
            fail(f, src, m.start(), 'R-COL-06', 'retired color ' + hx)
        elif hx not in PALETTE:
            fail(f, src, m.start(), 'R-COL-01', 'off-palette color ' + hx)
        if prop == 'typodojo':
            r, g, b = (int(hx[i:i+2], 16) for i in (1, 3, 5))
            if max(r, g, b) - min(r, g, b) > 12:
                fail(f, src, m.start(), 'R-COL-09', 'hue in typodojo: ' + hx)
    body = re.sub(r'<(svg|img)\b.*?(</svg>|>)', ' ', src, flags=re.S | re.I)
    if prop in ('pulp', 'publishing'):
        n = len(re.findall(r'background(?:-color)?:\s*#E6F21A', body, re.I)) + len(re.findall(r'class="[^"]*\bhl\b', body))
        if n > 1:
            fail(f, src, 0, 'R-COL-02', f'{n} resting yellow highlights on one page')
    elif prop == 'typodojo':
        pass  # R-COL-09 already rejects any hue
    else:
        used = {m.group(0).upper() for m in re.finditer(r'#[0-9a-fA-F]{6}\b', body)} & ACCENT_HEX
        if used:
            fail(f, src, 0, 'R-COL-02', 'Pulp accents inside Thinkwell: ' + ', '.join(sorted(used)))
    for m in re.finditer(r'(?<![-\w])color:\s*#E6F21A', css, re.I):
        fail(f, src, m.start(), 'R-COL-04', 'Highlighter used as a text color')
    # the glass tokens are the one place a fade or a halo may be written (R-GLS-03)
    css_ng = re.sub(r'--(?:glass|grad)-[\w-]+\s*:[^;]*;', lambda m: ' ' * len(m.group(0)), css)
    # R-GRD-01: the gradient strengths stay in range
    for k, lo, hi in (('glow-strength', 8, 28), ('scrim-strength', 60, 90), ('feature-solid', 30, 45)):
        m = re.search(r'--grad-' + k + r'\s*:\s*([\d.]+)%', css)
        if m and not (lo <= float(m.group(1)) <= hi):
            fail(f, src, m.start(), 'R-GRD-01', f'--grad-{k} {m.group(1)}% outside {lo} to {hi}')
    for m in re.finditer(r'background(?:-image)?\s*:[^;]*gradient', css_ng):
        fail(f, src, m.start(), 'R-GRD-01', 'a gradient outside the --grad tokens')
    # R-PHO-05: photos take their filter from the mode
    for m in re.finditer(r'\.p-photo__img\s*\{([^}]*)\}', css):
        if 'filter' in m.group(1) and 'var(--c-photo-filter)' not in m.group(1):
            fail(f, src, m.start(), 'R-PHO-05', 'photo filter is not var(--c-photo-filter)')
    for m in re.finditer(r'(linear|radial|conic)-gradient|text-shadow\s*:(?!\s*var\(--glass-halo\))|drop-shadow\(', css_ng, re.I):
        fail(f, src, m.start(), 'R-COL-08', m.group(0).strip())
    # R-GLS-02: glass values in range; R-GLS-03: blur and fade only through the tokens
    G = {k: v for k, v in re.findall(r'--glass-([\w-]+)\s*:\s*([^;]+);', css)}
    def num(k):
        m = re.match(r'\s*([\d.]+)', G.get(k, ''))
        return float(m.group(1)) if m else None
    for k, lo, hi in (('veil', 55, 85), ('blur', 12, 20), ('saturate', 1.0, 1.3), ('fade-start', 55, 70), ('fade-end', 90, 100)):
        v = num(k)
        if v is not None and not (lo <= v <= hi):
            fail(f, src, css.find('--glass-' + k), 'R-GLS-02', f'--glass-{k} {v} outside {lo} to {hi}')
    for m in re.finditer(r'(?<![\w-])(-webkit-)?backdrop-filter\s*:\s*([^;]+)', css_ng):
        if not m.group(2).strip().startswith(('var(--glass-', 'none')):
            fail(f, src, m.start(), 'R-GLS-03', 'backdrop-filter outside the glass tokens: ' + m.group(2).strip()[:30])
    for m in re.finditer(r'(?<![\w-])(-webkit-)?mask-image\s*:\s*([^;]+)', css_ng):
        if 'gradient' in m.group(2):
            fail(f, src, m.start(), 'R-GLS-03', 'a fade outside the glass tokens')
    # R-TEX-04 and R-PRT-02: plates and prints take their one ink from the mode
    for m in re.finditer(r'\.p-plate__dots\s*\{([^}]*)\}', css):
        if re.search(r'background\s*:', m.group(1)) and 'var(--c-plate)' not in m.group(1):
            fail(f, src, m.start(), 'R-TEX-04', 'plate ink is not var(--c-plate)')
    for m in re.finditer(r'\.p-print\s*\{([^}]*)\}', css):
        if re.search(r'background\s*:', m.group(1)) and 'var(--c-print)' not in m.group(1):
            fail(f, src, m.start(), 'R-PRT-02', 'print ink is not var(--c-print)')
    for m in re.finditer(r'border-(left|right|top|bottom):\s*([2-9]|\d{2})px\s+solid\s+(#[0-9a-fA-F]{6})', css, re.I):
        if m.group(3).upper() in ACCENT_HEX | TW_PINKS:
            fail(f, src, m.start(), 'R-COL-08', 'colored edge stripe: ' + m.group(0))
    # ---------------- marks
    for m in re.finditer(r'<svg[^>]*aria-label="Pulp"[^>]*>(.*?)</svg>', src, re.S):
        for c in re.findall(r'fill="(#[0-9A-Fa-f]{6})"', m.group(1)):
            if c.upper() not in {h.upper() for h in ('#191A19', '#F0F0EC', '#1D1D1F', '#ECECEE', '#0A0A0A', '#F3F2EE')}:
                fail(f, src, m.start(), 'R-LOGO-03', 'wordmark in ' + c)
    for m in re.finditer(r'<svg[^>]*aria-label="Thinkwell[^"]*"[^>]*>(.*?)</svg>', src, re.S):
        if '#C361BC' not in m.group(1).upper():
            fail(f, src, m.start(), 'R-LOGO-05', 'tw cloud not in Thinkwell pink')
    for m in re.finditer(r'<svg[^>]*aria-label="typodojo"[^>]*>(.*?)</svg>', src, re.S):
        for c in re.findall(r'stroke="(#[0-9A-Fa-f]{6})"', m.group(1)):
            r, g, b = (int(c[i:i+2], 16) for i in (1, 3, 5))
            if max(r, g, b) - min(r, g, b) > 12:
                fail(f, src, m.start(), 'R-LOGO-06', 'dojo T in a color: ' + c)
    for m in re.finditer(r'<svg[^>]*aria-label="The gum robot"[^>]*>(.*?)</svg>', src, re.S):
        for c in re.findall(r'fill="(#[0-9A-Fa-f]{6})"', m.group(1)):
            if c.upper() in ACCENT_HEX | TW_PINKS:
                fail(f, src, m.start(), 'R-BOT-05', 'gum robot in an accent: ' + c)
    # ---------------- type
    for m in re.finditer(r'font-style:\s*italic|<(em|i)>', css, re.I):
        fail(f, src, m.start(), 'R-TYPE-02', 'italic: ' + m.group(0))
    css = re.sub(r'<[^>]*data-mark="[^"]*"[^>]*>', lambda m: ' ' * len(m.group(0)), css)  # a property's mark keeps its own faces (R-LOGO-04)
    allowed = {x.lower() for x in (FACES[prop if prop != 'publishing' else 'pulp']['display'], FACES[prop if prop != 'publishing' else 'pulp']['reading'])}
    for m in re.finditer(r'font-family:\s*([^;"}]+)', css, re.I):
        fams = [x.strip().strip('\'"').replace('&#39;', '').strip().lower() for x in H.unescape(m.group(1)).split(',')]
        if fams and fams[0].startswith('var('):
            continue
        for fam in fams:
            if MONO.search(fam) and not (prop == 'typodojo' and 'recursive' in fam):
                fail(f, src, m.start(), 'R-TYPE-04', 'monospace: ' + fam)
            elif fam and fam not in allowed and fam not in GENERIC and not fam.startswith('var('):
                fail(f, src, m.start(), 'R-TYPE-01', f'{fam} is not a {prop} face')
    for m in re.finditer(r'style="([^"]*text-transform:\s*uppercase[^"]*)"', src, re.I):
        ls = re.search(r'letter-spacing:\s*([\d.]+)em', m.group(1))
        fs = re.search(r'font-size:\s*([\d.]+)px', m.group(1))
        if fs and float(fs.group(1)) >= 24:
            continue
        if not ls or not (0.1 <= float(ls.group(1)) <= 0.16):
            fail(f, src, m.start(), 'R-TYPE-06', 'uppercase without 0.1 to 0.16 em tracking')
    if prop == 'typodojo':
        pass
    elif prop in ('thinkwell',):
        for m in re.finditer(r'text-transform:\s*uppercase', css, re.I):
            fail(f, src, m.start(), 'R-TYPE-03', 'uppercase in Thinkwell')
    # ---------------- layout and components
    for m in re.finditer(r'\b(gap|row-gap|column-gap|margin(?:-top|-bottom|-left|-right)?|padding(?:-top|-bottom|-left|-right)?):\s*([^;"]+)', css, re.I):
        for v in re.findall(r'(-?\d+(?:\.\d+)?)px', m.group(2)):
            if abs(float(v)) not in SPACE:
                fail(f, src, m.start(), 'R-LAY-02', f'{m.group(1)} {v}px is off the scale')
    rset = set(RADII['pulp' if prop == 'publishing' else prop]) | {50}
    for m in re.finditer(r'border-radius:\s*([^;"]+)', css, re.I):
        for v in re.findall(r'(\d+(?:\.\d+)?)px', m.group(1)):
            if float(v) not in rset and float(v) < 999:
                fail(f, src, m.start(), 'R-LAY-03', f'radius {v}px is not a {prop} radius')
    for m in re.finditer(r'z-index:\s*(-?\d+)', css, re.I):
        if int(m.group(1)) not in ZS:
            fail(f, src, m.start(), 'R-LAY-09', 'z-index ' + m.group(1))
    for m in re.finditer(r'<(button|input|select)\b[^>]*style="([^"]*)"', src, re.I):
        h = re.search(r'(?<![-\w])height:\s*(\d+)px', m.group(2))
        if h and int(h.group(1)) not in CTRL and 'role="switch"' not in m.group(0):
            fail(f, src, m.start(), 'R-CMP-01', f'{m.group(1)} {h.group(1)} px tall')
        if m.group(1) == 'button' and 'role="switch"' not in m.group(0):
            r = re.search(r'border-radius:\s*(\d+)px', m.group(2))
            if r:
                want = {'thinkwell': {10, 16}, 'pulp': {999}, 'publishing': {999}, 'typodojo': {999}}[prop]
                if int(r.group(1)) not in want and int(r.group(1)) < 999:
                    fail(f, src, m.start(), 'R-CMP-03', f'button corner {r.group(1)} px')
    for m in re.finditer(r'<button[^>]*role="switch"[^>]*style="([^"]*)"', src, re.I):
        w = re.search(r'width:\s*(\d+)px', m.group(1)); h = re.search(r'height:\s*(\d+)px', m.group(1))
        if not (w and h and w.group(1) == '40' and h.group(1) == '24'):
            fail(f, src, m.start(), 'R-CMP-04', 'switch is not 40 by 24')
    # ---------------- imagery
    for m in re.finditer(r'<svg[^>]*viewBox="0 0 24 24"[^>]*>', src):
        tag = m.group(0)
        if 'stroke-width' in tag and 'stroke-width="1.6"' not in tag:
            fail(f, src, m.start(), 'R-IMG-06', 'icon stroke is not 1.6')
    for m in re.finditer(r'<figure\b(.*?)</figure>', src, re.S | re.I):
        if '<img' in m.group(1) and '<figcaption' not in m.group(1):
            fail(f, src, m.start(), 'R-IMG-12', 'photo without a caption')
    for m in re.finditer(r'(class|id|data-[\w-]+)="[^"]*\b(pie|donut|doughnut)\b', src, re.I):
        fail(f, src, m.start(), 'R-DATA-05', 'pie or donut chart')
    # ---------------- motion and interaction
    for m in re.finditer(r'(transition|animation)(-duration)?:\s*([^;"]+)', css, re.I):
        for v in re.findall(r'(\d+(?:\.\d+)?)(ms|s)\b', m.group(3)):
            ms = float(v[0]) * (1000 if v[1] == 's' else 1)
            if ms and ms not in DURS:
                fail(f, src, m.start(), 'R-MO-02', f'{int(ms)} ms is not a duration')
    for m in re.finditer(r'prefers-reduced-motion[^{]*\{(.*?)\}\s*\}', css, re.S | re.I):
        if re.search(r'transition:\s*none', m.group(1), re.I):
            fail(f, src, m.start(), 'R-MO-03', 'blanket transition: none under reduced motion')
    for m in re.finditer(r'cursor:\s*url\(', css, re.I):
        before = css[:m.start()]
        if not re.search(r'@media[^{]*hover:\s*hover[^{]*pointer:\s*fine[^{]*\{[^@]*$', before, re.S):
            fail(f, src, m.start(), 'R-INT-03', 'custom cursor outside (hover: hover) and (pointer: fine)')


# ------------------------------------------------------------------ code contracts: CSS, animation (R-CSS-*, R-ANIM-*)
MOTION_PATH = os.path.join(HERE, 'motion.json')
MOTION = json.load(open(MOTION_PATH)) if os.path.exists(MOTION_PATH) else {"motions": [], "parts": {}, "animatable": []}
MOTION_IDS = {m['id'] for m in MOTION['motions']} | set(MOTION.get('parts', {}))
ANIMATABLE = set(MOTION.get('animatable', [])) | {'all'} - {'all'}
LAYERS = TOKENS.get('css', {}).get('layers', ['reset', 'tokens', 'base', 'layout', 'components', 'utilities'])
PREFIXES = tuple(TOKENS.get('css', {}).get('prefixes', ['p-', 'tw2-', 'td-', 'u-']))
BREAKS = set(TOKENS.get('css', {}).get('breakpoints', [560, 768, 1024, 1280]))

def css_blocks(css, start=0, depth=0):
    """Yields (prelude, body, abs_start, parents) for every block, recursively."""
    out = []
    def walk(text, off, parents):
        i = 0
        while i < len(text):
            j = text.find('{', i)
            if j < 0: break
            semi = text.rfind(';', i, j)
            pre_start = semi + 1 if semi >= 0 else i
            prelude = text[pre_start:j].strip()
            d, k = 1, j + 1
            while k < len(text) and d:
                if text[k] == '{': d += 1
                elif text[k] == '}': d -= 1
                k += 1
            body = text[j + 1:k - 1]
            out.append((prelude, body, off + pre_start, parents))
            if prelude.startswith('@'):
                walk(body, off + j + 1, parents + [prelude])
            i = k
    walk(css, start, [])
    return out

GUARD_PROPS = {'color-scheme', 'background', 'color', 'font-family', 'font-size', 'line-height'}

def lint_css(f, src, css, css_off):
    css_nc = re.sub(r'/\*.*?\*/', lambda m: ' ' * len(m.group(0)), css, flags=re.S)
    blocks = css_blocks(css_nc, css_off)
    guard_seen = False
    # R-CSS-02: every rule inside a layer; the layer order statement first
    order = re.search(r'@layer\s+([\w\s,]+);', css_nc)
    if not order or [x.strip() for x in order.group(1).split(',')] != LAYERS:
        fail(f, src, css_off, 'R-CSS-02', 'missing or wrong @layer order statement')
    for pre, body, pos, parents in blocks:
        if not parents and not pre.startswith('@layer'):
            if re.sub(r'\s+', ' ', pre.strip()) == 'html, html body' and not guard_seen:
                guard_seen = True   # R-CSS-13: the host guard, the one rule allowed outside a layer
                props = {d.split(':')[0].strip() for d in body.split(';') if ':' in d}
                vals = [d.split(':', 1)[1].strip() for d in body.split(';') if ':' in d]
                if not props <= GUARD_PROPS or any(not v.startswith('var(--') for v in vals):
                    fail(f, src, pos, 'R-CSS-13', 'host guard sets more than the ground, type, scheme and font, or a raw value')
                continue
            fail(f, src, pos, 'R-CSS-02', 'rule outside a layer: ' + pre[:40])
    for pre, body, pos, parents in blocks:
        in_tokens = any(p.startswith('@layer tokens') for p in parents) or pre.startswith('@layer tokens')
        if pre.startswith('@'):
            if pre.startswith('@media'):
                for w in re.findall(r'(min|max)-width:\s*(\d+)px', pre):
                    if w[0] == 'max' or int(w[1]) not in BREAKS:
                        fail(f, src, pos, 'R-CSS-10', 'breakpoint ' + '-'.join(w))
            if pre.startswith('@keyframes'):
                name = pre.split()[1]
                if name not in MOTION_IDS:
                    fail(f, src, pos, 'R-ANIM-01', f'@keyframes {name} is not in motion.json')
                for prop in re.findall(r'([\w-]+)\s*:', body):
                    if prop not in ANIMATABLE:
                        fail(f, src, pos, 'R-ANIM-03', f'{name} animates {prop}')
            continue
        decls = body
        if '!important' in decls:
            fail(f, src, pos, 'R-CSS-03', pre[:40])
        if not in_tokens:
            for m in re.finditer(r'#[0-9a-fA-F]{3,8}\b', decls):
                fail(f, src, pos, 'R-CSS-01', 'raw color ' + m.group(0) + ' in ' + pre[:30])
            for m in re.finditer(r'(?<![\w.-])(\d+(?:\.\d+)?)px\b', re.sub(r'url\([^)]*\)', '', decls)):
                if float(m.group(1)) != 0:
                    fail(f, src, pos, 'R-CSS-01', 'raw size ' + m.group(0) + ' in ' + pre[:30])
            for m in re.finditer(r'(?<![\w.-])\d+(?:\.\d+)?m?s\b', re.sub(r'url\([^)]*\)', '', decls)):
                fail(f, src, pos, 'R-ANIM-02', 'raw duration ' + m.group(0) + ' in ' + pre[:30])
            for m in re.finditer(r'(?<![\w-])(linear|ease-in-out|ease-in|ease-out|ease|cubic-bezier\([^)]*\))(?![\w-])', re.sub(r'url\([^)]*\)', '', decls)):
                fail(f, src, pos, 'R-ANIM-02', 'raw easing ' + m.group(0) + ' in ' + pre[:30])
            for m in re.finditer(r'z-index:\s*([^;]+)', decls):
                if not m.group(1).strip().startswith('var(--z-'):
                    fail(f, src, pos, 'R-CSS-11', 'z-index ' + m.group(1).strip())
            for m in re.finditer(r'font-family:\s*([^;]+)', decls):
                if not m.group(1).strip().startswith('var(--f-'):
                    fail(f, src, pos, 'R-CSS-11', 'font stack outside tokens: ' + m.group(1).strip()[:30])
        if 'data-mode' in pre:
            for prop in re.findall(r'([\w-]+)\s*:', decls):
                if not (prop.startswith('--c-') or prop == 'color-scheme'):
                    fail(f, src, pos, 'R-CSS-04', f'mode block sets {prop}')
        if ':hover' in pre and not any(('hover: hover' in p and 'pointer: fine' in p) for p in parents):
            fail(f, src, pos, 'R-CSS-05', ':hover outside (hover: hover) and (pointer: fine): ' + pre[:40])
        if re.search(r'outline:\s*(none|0)\b', decls):
            fail(f, src, pos, 'R-CSS-06', 'outline removed in ' + pre[:30])
        for c in re.findall(r'\.([a-zA-Z][\w-]*)', re.sub(r'url\([^)]*\)', '', pre)):
            if re.match(r'(is-|has-)|^(active|open|selected|hidden|show|visible|current|disabled)$', c):
                fail(f, src, pos, 'R-CSS-07', 'state class .' + c)
            elif not c.startswith(PREFIXES):
                fail(f, src, pos, 'R-CSS-08', 'unprefixed class .' + c)
        for m in re.finditer(r'transition-property:\s*([^;]+)', decls):
            for prop in [x.strip() for x in m.group(1).split(',')]:
                if prop not in ANIMATABLE:
                    fail(f, src, pos, 'R-ANIM-03', 'transition on ' + prop)
        for m in re.finditer(r'(?<![\w-])animation:\s*([^;]+)', decls):
            name = m.group(1).strip().split()[0]
            if name != 'none' and name not in MOTION_IDS:
                fail(f, src, pos, 'R-ANIM-01', f'animation {name} is not in motion.json')
        if any('prefers-reduced-motion' in p for p in parents) and re.search(r'transition:\s*none', decls):
            fail(f, src, pos, 'R-ANIM-04', 'transition: none under reduced motion')

def self_check():
    ok = True
    for p in ('pulp', 'thinkwell', 'typodojo'):
        for mode in ('light', 'dark', 'mono'):
            missing = set(TOKENS['modes']['pulp']['light']) - set(TOKENS['modes'][p][mode]) - ({'print', 'feature', 'featureType', 'featureMuted', 'featureInk', 'featurePrint', 'glow', 'photoFilter', 'photoGround', 'photoType', 'thread', 'dye', 'api', 'apiFar'} if p == 'thinkwell' else set())  # Thinkwell has no texture, feature block, glow or photo bands (R-IMG-07)
            if missing:
                fails.append(('tokens.json', 0, 'R-HOUSE-03', f'{p} {mode} does not resolve: {sorted(missing)}')); ok = False
    for p in ('pulp', 'typodojo'):
        if TOKENS['modes'][p]['mono']['ground'].upper() != '#2A2B2A':
            fails.append(('tokens.json', 0, 'R-MODE-04', f'{p} mono ground is not Carbon Copy'))
    ids = [r for r in RULES]
    if len(ids) != len(set(ids)):
        fails.append(('rules.json', 0, 'R-PACK-04', 'duplicate rule id'))
    for r in RULES.values():
        if r['check'] == 'lint' and r['id'] not in CHECKED:
            fails.append(('rules.json', 0, 'R-PACK-02', r['id'] + ' is marked lint but has no checker'))

CHECKED = {'R-TXT-01', 'R-LOGO-07', 'R-TXT-03', 'R-TXT-04', 'R-TXT-08', 'R-DATE-01', 'R-LOGO-04', 'R-COL-06', 'R-COL-01', 'R-COL-09', 'R-COL-02',
           'R-COL-04', 'R-COL-08', 'R-LOGO-03', 'R-LOGO-05', 'R-LOGO-06', 'R-BOT-05', 'R-TYPE-02', 'R-TYPE-01', 'R-TYPE-04', 'R-TYPE-06', 'R-TYPE-03',
           'R-LAY-02', 'R-LAY-03', 'R-LAY-09', 'R-CMP-01', 'R-CMP-03', 'R-CMP-04', 'R-IMG-06', 'R-IMG-12', 'R-DATA-05', 'R-MO-02', 'R-MO-03', 'R-INT-03',
           'R-HOUSE-03', 'R-MODE-04', 'R-PACK-02', 'R-CSS-01', 'R-CSS-02', 'R-CSS-03', 'R-CSS-04', 'R-CSS-05', 'R-CSS-06', 'R-CSS-07', 'R-CSS-08',
           'R-CSS-10', 'R-CSS-11', 'R-ANIM-01', 'R-ANIM-02', 'R-ANIM-03', 'R-ANIM-04',
           'R-GLS-02', 'R-GLS-03', 'R-TEX-04', 'R-PRT-02', 'R-CSS-13', 'R-GRD-01', 'R-PHO-05', 'R-LOGO-10'}

if __name__ == '__main__':
    args = sys.argv[1:]
    if '--self' in args:
        self_check()
    else:
        prop = 'pulp'
        if '--property' in args:
            i = args.index('--property'); prop = args[i + 1]; del args[i:i + 2]
        for f in args:
            lint(f, prop)
    for f, line, rid, found in fails:
        print(f'{f}:{line}  {rid}  {found}')
    print(f'{len(fails)} failure{"s" if len(fails) != 1 else ""}')
    sys.exit(1 if fails else 0)
