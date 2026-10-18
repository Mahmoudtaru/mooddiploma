from pathlib import Path
import base64, gzip, json, re, subprocess
from xml.sax.saxutils import escape
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / 'assets'
OUT = Path('/workspace/scratch/91ef8237b3d5/output/wbs-event-reel-v2')
OUT.mkdir(parents=True, exist_ok=True)
ICONS = json.loads(gzip.decompress(Path('/root/.cache/mvs/skill-d1291aab9b/icons/lucide.json.gz').read_bytes()))
NAVY, SKY, PINK, GREEN = '#102F68', '#16AFE0', '#E84291', '#009688'

def txt(s, x, y, size=84, color=NAVY, weight=700, anchor='start', rtl=True, family='Alexandria Arabic WBS, DejaVu Sans'):
    direction = ' direction="rtl" unicode-bidi="embed"' if rtl else ''
    return f'<text x="{x}" y="{y}" text-anchor="{anchor}"{direction} font-family="{family}" font-size="{size}" font-weight="{weight}" fill="{color}">{escape(s)}</text>'

def image(name, x, y, w, h):
    p = ASSETS / name
    mime = 'image/svg+xml' if p.suffix == '.svg' else 'image/png'
    url = f'data:{mime};base64,' + base64.b64encode(p.read_bytes()).decode()
    return f'<image xlink:href="{url}" x="{x}" y="{y}" width="{w}" height="{h}" preserveAspectRatio="xMidYMid meet"/>'

def icon(name, x, y, size, color=NAVY, sw=1.5):
    s = ICONS[name]
    s = re.sub(r'<svg[^>]*>', '', s).replace('</svg>', '')
    return f'<g transform="translate({x},{y}) scale({size/24})" fill="none" stroke="{color}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{s}</g>'

def svg(body, w=1080, h=1920):
    return f'<?xml version="1.0" encoding="UTF-8"?><svg xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{body}</svg>'

def background(pink=False):
    pale = '#FFF2F8' if pink else '#ECF7FD'
    return f'''<rect width="1920" height="1080" fill="#FEFEFC"/>
    <path d="M0 0H730C570 113 243 12 0 218Z" fill="{pale}"/>
    <path d="M0 0H510C370 97 170 38 0 150Z" fill="#DDF2FC" opacity=".55"/>
    <path d="M1120 1080C1390 841 1625 1040 1920 823V1080Z" fill="{pale}"/>
    <path d="M1350 1080C1540 951 1730 1012 1920 905V1080Z" fill="#DDF2FC" opacity=".60"/>
    <path d="M0 130C220-18 407 141 606 0M1395 1080C1590 924 1720 1085 1920 901" fill="none" stroke="#8BCBE8" stroke-width="2"/>
    <path d="M0 188C200 40 398 192 678 0" fill="none" stroke="{NAVY}" stroke-opacity=".45" stroke-width="1.5"/>'''

def header():
    return image('wbs.png', 94, 72, 155, 134) + image('breadfast.png', 1507, 98, 305, 96)

def footer(baheya=False):
    b = txt('Powered by', 107, 976, 28, weight=500, rtl=False, family='DejaVu Sans')
    b += image('ivein.png', 270, 927, 175, 92)
    if baheya:
        b += txt('بالتعاون مع', 1460, 981, 28, weight=500)
        b += image('baheya.png', 1510, 910, 285, 146)
    return b

def badge(cx, cy, name, color, size=126):
    return f'<circle cx="{cx+8}" cy="{cy+14}" r="112" fill="{NAVY}" opacity=".035"/><circle cx="{cx}" cy="{cy}" r="112" fill="#EAF6FC"/>' + icon(name, cx-size/2, cy-size/2, size, color)

def art_open():
    p = f'<path d="M70 470C65 290 345 380 270 170S595 35 550 280S310 600 115 500" fill="none" stroke="#C7EBF7" stroke-width="45" stroke-linecap="round"/>'
    p += f'<path d="M70 470C65 290 345 380 270 170S595 35 550 280S310 600 115 500" fill="none" stroke="{SKY}" stroke-width="4" stroke-linecap="round"/>'
    for cx,cy,n,c in [(100,440,'heart-pulse',NAVY),(260,150,'armchair',NAVY),(520,190,'salad',GREEN),(470,475,'ribbon',PINK)]:
        p += badge(cx,cy,n,c,115)
    return p

def art_veins():
    return f'''<circle cx="310" cy="310" r="260" fill="#EAF6FC"/>
    <circle cx="310" cy="310" r="224" fill="none" stroke="#C6E8F7" stroke-width="2"/>
    <path d="M300 98C261 182 270 246 284 295C300 351 266 393 235 447L167 485C150 497 160 518 185 516L286 500C320 488 329 460 318 435C310 412 342 366 368 309C392 255 371 184 396 99" fill="#D9EFF9" stroke="{NAVY}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M345 126C320 206 340 261 320 315S296 421 274 472" fill="none" stroke="{SKY}" stroke-width="9" stroke-linecap="round"/>
    <path d="M320 315L286 289M325 248L350 223M305 377L330 353M291 435L264 413" fill="none" stroke="{SKY}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="345" cy="150" r="12" fill="{SKY}"/>
    <circle cx="308" cy="358" r="10" fill="{SKY}"/>
    <circle cx="273" cy="469" r="9" fill="{SKY}"/>
    <g transform="translate(395 55)">{icon('heart-pulse',0,0,142,PINK,1.3)}</g>
    <path d="M387 440C439 394 466 288 423 214" fill="none" stroke="#97D7EE" stroke-width="3" stroke-dasharray="7 12"/>
    <path d="M426 240L423 214L449 225" fill="none" stroke="#97D7EE" stroke-width="3"/>'''

def art_work():
    return f'''<circle cx="310" cy="310" r="260" fill="#EAF6FC"/>
    <path d="M105 508H550" stroke="#BDDFF1" stroke-width="5" stroke-linecap="round"/>
    <path d="M365 282H535M500 285V507" fill="none" stroke="{NAVY}" stroke-width="7" stroke-linecap="round"/>
    <path d="M377 278H458L480 220H398Z" fill="#D5ECF8" stroke="{NAVY}" stroke-width="5"/>
    <path d="M167 250V401H328M184 404V503M307 404V503" fill="none" stroke="{NAVY}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="277" cy="159" r="45" fill="#C0E6F5" stroke="{NAVY}" stroke-width="6"/>
    <path d="M272 213L258 333L352 343L377 494M260 332L211 376" fill="none" stroke="{NAVY}" stroke-width="23" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M273 226L319 278L393 278" fill="none" stroke="{SKY}" stroke-width="19" stroke-linecap="round"/>
    <path d="M146 171C105 231 105 281 131 320M117 305L134 325L145 300" fill="none" stroke="{SKY}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="488" cy="132" r="42" fill="#DDF4EC"/>
    {icon('move-up-right',464,108,48,GREEN,1.7)}'''

def art_food():
    return f'''<circle cx="310" cy="310" r="260" fill="#EEF8F3"/>
    <ellipse cx="311" cy="467" rx="210" ry="26" fill="{NAVY}" opacity=".045"/>
    <circle cx="310" cy="309" r="203" fill="white" stroke="#B7DDCE" stroke-width="4"/>
    <circle cx="310" cy="309" r="170" fill="#F6FAF7" stroke="#CDE4DA" stroke-width="3"/>
    <path d="M310 309L310 142A167 167 0 0 1 477 309Z" fill="#F7DFB6"/>
    <path d="M310 309L477 309A167 167 0 0 1 310 476Z" fill="#FFE8E0"/>
    <path d="M310 309L310 476A167 167 0 1 1 310 142Z" fill="#DAEDDA"/>
    <path d="M198 271C174 215 215 189 250 226C291 218 300 271 262 290C244 339 195 319 198 271Z" fill="#75B78B"/>
    <path d="M226 315L251 254M215 281L244 273" fill="none" stroke="#E2F3E3" stroke-width="6" stroke-linecap="round"/>
    <circle cx="241" cy="371" r="30" fill="#EC956C"/>
    <circle cx="270" cy="348" r="24" fill="#EBAF81"/>
    <path d="M350 225L405 250M362 209L417 234M350 253L405 279" stroke="#D7BB81" stroke-width="8" stroke-linecap="round"/>
    <path d="M350 365C369 330 412 328 425 369C424 411 381 429 350 401Z" fill="#DCA48D"/>
    <path d="M78 182V427M61 185V237Q78 257 95 237V185M539 181V424M539 181C577 230 577 270 539 283" fill="none" stroke="{NAVY}" stroke-width="6" stroke-linecap="round"/>'''

def art_ribbon():
    return f'''<circle cx="310" cy="310" r="260" fill="#FFF0F6"/>
    <circle cx="310" cy="310" r="222" fill="none" stroke="#F7CEE2" stroke-width="2"/>
    <path d="M217 196C207 119 245 82 307 82C377 82 412 130 397 199C377 279 267 383 197 514L117 459C211 321 291 259 336 184C353 155 329 134 307 134C281 134 264 153 273 182Z" fill="#EE78AC"/>
    <path d="M273 182C313 252 397 335 491 459L409 514C329 392 246 313 217 225C213 213 212 203 217 196Z" fill="{PINK}"/>
    <path d="M274 183C286 203 304 226 322 246L350 209C346 197 341 188 336 184C353 155 329 134 307 134C281 134 264 153 273 182Z" fill="#D42C7A" opacity=".55"/>
    <path d="M447 120L467 96M478 159L512 151" fill="none" stroke="#F4A6C9" stroke-width="6" stroke-linecap="round"/>'''

