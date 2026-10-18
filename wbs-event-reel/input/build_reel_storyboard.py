from pathlib import Path
import json, subprocess, shutil, zipfile
from common import txt, image, icon, svg, OUT, ASSETS, NAVY, SKY, PINK, GREEN
from PIL import Image

ROOT=Path(__file__).resolve().parent
INK='#FEFEFC'

def bg(dark=False,pink=False):
    if dark:
        return f'''<rect width="1080" height="1920" fill="{NAVY}"/>
        <path d="M-100 1620C210 1190 970 1650 1170 1050" fill="none" stroke="#1F467E" stroke-width="130"/>
        <path d="M-100 1620C210 1190 970 1650 1170 1050" fill="none" stroke="#3B68A0" stroke-width="3"/>
        <path d="M-100 1770C270 1340 950 1760 1180 1350" fill="none" stroke="#244E87" stroke-width="2"/>'''
    pale='#FFF1F7' if pink else '#EDF8FD'
    return f'''<rect width="1080" height="1920" fill="{INK}"/>
    <path d="M0 0H780C570 180 240 100 0 310Z" fill="{pale}"/>
    <path d="M0 0H510C370 123 170 90 0 211Z" fill="#DCF2FC" opacity=".55"/>
    <path d="M0 270C260 56 490 197 700 0" fill="none" stroke="#9ED6EB" stroke-width="2"/>
    <path d="M0 196C180 25 370 176 590 0" fill="none" stroke="{NAVY}" stroke-opacity=".4" stroke-width="1.5"/>
    <path d="M260 1920C560 1620 790 1805 1080 1530V1920Z" fill="{pale}"/>
    <path d="M460 1920C720 1690 890 1840 1080 1700V1920Z" fill="#DCF2FC" opacity=".65"/>
    <path d="M290 1920C590 1620 830 1840 1080 1610" fill="none" stroke="#9ED6EB" stroke-width="2"/>'''

def t(s,y,size=88,color=NAVY,weight=800,x=540,anchor='middle'):
    return txt(s,x,y,size,color,weight,anchor)

def hero_art(name,y=780,size=760,x=None):
    return image(name,((1080-size)/2 if x is None else x),y,size,size)

def stroke_path(d,color=SKY,width=5):
    return f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round"/>'

def route(y=1050):
    return stroke_path(f'M-80 {y+210}C270 {y+210} 150 {y-40} 430 {y-30}S820 {y+280} 1150 {y-80}', '#C1E9F7',85)+stroke_path(f'M-80 {y+210}C270 {y+210} 150 {y-40} 430 {y-30}S820 {y+280} 1150 {y-80}',SKY,5)

scenes=[
 dict(id='hook',start=0,end=2,copy=['وسط يوم','الشغل…'],motion='النص يدخل من اليمين، والخط يبدأ حركته من مشهد المكتب.',logos=[]),
 dict(id='health-time',start=2,end=4,copy=['وقت','لصحتك.'],motion='الخط يكمل مساره، ويتحول التركيز من الشغل لرمز الصحة.',logos=[]),
 dict(id='collaboration',start=4,end=7,copy=['يوم للتوعية بالصحة','في','Powered by'],motion='تقديم المبادرة ثم Breadfast؛ ظهور iVein مع عبارة الفويس «بدعم من آيفين». التوقيت التفصيلي يتحدد بعد توليد الصوت.',logos=['wbs','breadfast','ivein']),
 dict(id='event-date',start=7,end=9,copy=['الاثنين','19','أكتوبر'],motion='تثبيت التاريخ بحركة رقم واحدة، من غير عد تصاعدي.',logos=[]),
 dict(id='vascular',start=9,end=11.5,copy=['مع','صحة الأوعية','الدموية'],motion='تقديم iVein أولاً مع الفويس «مع آيفين»، ثم عنوان الأوعية ورسم مسار الوريد بنقاط صاعدة باتجاه القلب.',logos=['ivein']),
 dict(id='varicose',start=11.5,end=13.5,copy=['الدوالي','أعراضها والوقاية'],motion='تكملة نفس مشهد الأوعية مع تقريب على مسار الوريد، وتحويل الخلفية للكحلي.',logos=[]),
 dict(id='ergonomics',start=13.5,end=16,copy=['عادات صحية','أثناء الشغل'],motion='العنوان أولاً، ثم أثناء الشغل بعد 0.25 ثانية، ثم الرسم بعد 0.4 ثانية. يتناول المحور الوقفة والقعدة والحركة؛ الرسم يوضح وضعية العمل.',logos=[]),
 dict(id='nutrition',start=16,end=18.5,copy=['تغذية صحية','خلال يومك'],motion='العنوان أولاً، ثم خلال يومك بعد 0.25 ثانية، ثم تتجمع مكونات الطبق خلال 0.5 ثانية وتثبت.',logos=[]),
 dict(id='baheya-partner',start=18.5,end=21,copy=['وبالتعاون مع'],motion='انتقال وردي هادئ يقدّم بهية؛ الشعار الأصلي ثابت وواضح.',logos=['baheya']),
 dict(id='breast-awareness',start=21,end=24,copy=['التوعية','بسرطان الثدي','وأهمية الكشف المبكر'],motion='استمرار الشريط الوردي من المشهد السابق، مع ظهور الرسالة على مرحلتين.',logos=[]),
 dict(id='closing-setup',start=24,end=26,copy=['وسط كل اللي','مطلوب منك…'],motion='وقفة بصرية هادية، والنص يدخل في سطرين.',logos=[]),
 dict(id='closing',start=26,end=30,copy=['صحتك','ليها مكان.','مستنيينكم','الاثنين 19 أكتوبر','بالتعاون مع','Powered by'],motion='تكملة الجملة على ضربة موسيقية خفيفة؛ تجمّع الشركاء وثبات حتى النهاية.',logos=['wbs','breadfast','baheya','ivein']),
]

frames=[]
for i,s in enumerate(scenes,1):
    sid=s['id'];b=bg(sid in ['varicose','closing-setup'],sid in ['baheya-partner','breast-awareness'])
    if sid=='hook':
        b+=t('وسط يوم',570,110)+t('الشغل…',735,150,SKY)
        b+=hero_art('art-3.svg',900,680)
    elif sid=='health-time':
        b+=t('وقت',570,138)+t('لصحتك.',755,166,SKY)
        b+=route(1120)
        b+=f'<circle cx="530" cy="1240" r="191" fill="#E5F5FC"/>'
        b+=icon('heart-pulse',395,1105,270,SKY,1.35)
    elif sid=='collaboration':
        b+=t('يوم للتوعية بالصحة',480,55,weight=700)
        b+=image('wbs.png',350,590,380,330)
        b+=t('في',1050,60,weight=500)
        b+=image('breadfast.png',285,1160,510,160)
        b+=txt('Powered by',540,1405,29,NAVY,500,'middle',False,'DejaVu Sans')
        b+=image('ivein.png',430,1435,220,114)
        b+=stroke_path('M540 950V982',SKY,4)
        b+=stroke_path('M540 1090V1120',SKY,4)
    elif sid=='event-date':
        b+=t('الاثنين',570,115)
        b+=f'<circle cx="540" cy="1030" r="275" fill="#E6F5FC"/>'
        b+=txt('19',540,1140,330,SKY,800,'middle',False,'DejaVu Sans')
        b+=t('أكتوبر',1440,117)
    elif sid=='vascular':
        b+=t('مع',285,40,weight=500)
        b+=image('ivein.png',405,330,270,140)
        b+=t('صحة الأوعية',650,86)+t('الدموية',800,125,SKY)
        b+=hero_art('art-2.svg',880,650)
    elif sid=='varicose':
        b+=t('الدوالي',570,156,SKY)+t('أعراضها والوقاية',730,65,'#FFFFFF',700)
        b+=f'<circle cx="540" cy="1210" r="245" fill="#204982"/>'
        b+=stroke_path('M475 1480C520 1370 490 1275 544 1175S546 1050 586 940',SKY,16)
        b+=stroke_path('M513 1336L570 1280M544 1175L490 1110M570 1044L620 1008','#6FC9E8',8)
        for x,y in [(485,1440),(535,1210),(575,1000)]:b+=f'<circle cx="{x}" cy="{y}" r="15" fill="#FFFFFF"/>'
        b+=icon('heart-pulse',660,870,125,'#F18CBC',1.4)
    elif sid=='ergonomics':
        b+=t('عادات صحية',520,100)+t('أثناء الشغل',670,103,SKY)
        b+=hero_art('art-3.svg',800,740)
    elif sid=='nutrition':
        b+=t('تغذية صحية',520,100)+t('خلال يومك',670,102,SKY)
        b+=hero_art('art-4.svg',800,740)
    elif sid=='baheya-partner':
        b+=t('وبالتعاون مع',560,82)
        b+=f'<circle cx="540" cy="990" r="295" fill="#FFF2F8"/>'
        b+=image('baheya.png',220,820,640,330)
        b+=stroke_path('M300 1270C420 1370 660 1370 780 1270','#F3B4D2',5)
    elif sid=='breast-awareness':
        b+=t('التوعية',455,97)+t('بسرطان الثدي',605,96,PINK)
        b+=t('وأهمية الكشف المبكر',735,53,weight=500)
        b+=hero_art('art-5.svg',840,650)
    elif sid=='closing-setup':
        b+=t('وسط كل اللي',735,100,'#FFFFFF')+t('مطلوب منك…',900,114,'#FFFFFF')
        b+=stroke_path('M265 1010H790',SKY,8)
        b+=stroke_path('M-70 1480C180 1340 280 1550 500 1430S800 1290 1140 1450','#3D679E',3)
    elif sid=='closing':
        b+=t('صحتك',490,165)+t('ليها مكان.',665,137,SKY)
        b+=t('مستنيينكم',825,58,weight=700)
        b+=t('الاثنين 19 أكتوبر',920,43,weight=600)
        b+=image('wbs.png',215,1015,205,178)
        b+=image('breadfast.png',515,1060,320,101)
        b+=t('بالتعاون مع',1330,33,weight=500,x=330)
        b+=image('baheya.png',205,1365,250,129)
        b+=txt('Powered by',690,1330,30,NAVY,500,'middle',False,'DejaVu Sans')
        b+=image('ivein.png',565,1365,250,130)
    p=OUT/f'F{i:02d}_{s["start"]:g}-{s["end"]:g}s.svg'
    p.write_text(svg(b))
    png=p.with_suffix('.png')
    subprocess.run(['inkscape',str(p),f'--export-filename={png}'],capture_output=True,check=True)
    frames.append(png)

plan=dict(title='وقفتك بصحتك × Breadfast — إعلان التعاون',version=2,stage='Storyboard review',duration=30,aspect='9:16',width=1080,height=1920,publication_date='2026-10-18',event_date='2026-10-19',voice='Egyptian Arabic voice-over proposed; not generated. See voiceover.txt and voice-style.txt. Scene timing to conform to actual audio.',music='Warm contemporary instrumental, light pulse, approximately 100 BPM; track not selected or licensed yet.',safe_area=dict(essential_content=dict(left=100,right=170,top=260,bottom=390),note='Conservative working margins, not a platform guarantee; native posting preview to be checked at delivery.'),logo_policy='No persistent corner logos. WbS, Breadfast and Powered by iVein in frame 3; iVein when introducing vascular health in frame 5; Baheya in frame 9; all four with relationships in frame 12.',rhythm='Hook → collaboration reveal → date → four topics → quiet setup → closing hold',scenes=scenes)
(ROOT/'storyboard-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2))

# Assemble portrait frames in readable landscape pages using the studio helper.
subprocess.run(['python3','/root/.codex/skills/remote-skills/skill-6a9bc97190908191ba8f6401bcbf28a8/scripts/make_storyboard_board.py',*[str(f) for f in frames],'--output',str(OUT/'WbS-Reel-Storyboard-v2.png'),'--layout','portrait','--mode','fit','--title','WbS x Breadfast | COLLABORATION REEL | 30s'],check=True)

# A mobile-size contact sheet is only for internal typography inspection.
sheet=Image.new('RGB',(360*6,640*2),'#EBF1F5')
for i,f in enumerate(frames):
    im=Image.open(f).convert('RGB').resize((360,640),Image.Resampling.LANCZOS)
    sheet.paste(im,((i%6)*360,(i//6)*640))
sheet.save(ROOT/'phone-check.png')
print('Rendered 12 portrait frames at 1080x1920 and three landscape storyboard pages.')
