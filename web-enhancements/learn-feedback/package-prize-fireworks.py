"""Add prize text, finite fireworks and next-lesson action to the current hosted panel."""
import base64,gzip,hashlib,json,re,sys
from pathlib import Path
p=Path('worker/index.js');raw=p.read_text();root=Path(__file__).parent
ma,mb,mc='const ROUTES=',';const CONTENT=',';const v74Worker='
a=raw.index(ma);b=raw.index(mb,a);c=raw.index(mc,b)
routes=json.loads(raw[a+len(ma):b]);data=json.loads(raw[b+len(mb):c]);original=dict(routes)
def get(uri):return gzip.decompress(base64.b64decode(data[routes[uri][0]])).decode()
def put(uri,text,kind):
 blob=text.encode();key=hashlib.sha256(blob).hexdigest();data[key]=base64.b64encode(gzip.compress(blob,mtime=0)).decode();routes[uri]=[key,kind]
def once(text,old,new):
 assert text.count(old)==1,old[:90]
 return text.replace(old,new,1)
html=get('/index.html');old=re.search(r'src="(/_expo/static/js/web/__common-[^"]+)"',html)[1];bundle=get(old)
at=bundle.index('_e.EducationPanel=function');start=bundle.rfind('\n__d(',0,at);end=bundle.index('\n__d(',at);panel=bundle[start:end];baseline=panel
prizes=json.loads((root/'tip-prizes.json').read_text());assert len(prizes)==10 and all(len(r)==3 and r[2] for r in prizes)
panel=re.sub(r'const TIP_PRIZES=\[.*?\];function tipPrizes',lambda _: 'const TIP_PRIZES='+json.dumps(prizes,ensure_ascii=True,separators=(',',':'))+';function tipPrizes',panel,count=1)
panel=once(panel,'symbol:next[0],title:next[1]','symbol:next[0],title:next[1],message:next[2]')
panel=once(panel,'const earnedTipPrizes=tipPrizes(E.progress)',"const availableTips=(P?S.history:S.current).filter(entry=>i?(0,t.isDebtTip)(entry):!(0,t.isDebtTip)(entry)),nextTip=availableTips.find(entry=>entry.id!==D?.id&&!E.progress.some(row=>row.tipId===entry.id&&row.learnedAt));const earnedTipPrizes=tipPrizes(E.progress)")
panel=once(panel,'award:currentTipPrize,animate:E.animations&&!q,inline:!0','award:currentTipPrize,animate:E.animations&&!q,inline:!0,hasNext:!!nextTip,onContinue:()=>{L(nextTip??null);$(\'\');V(\'\');R(\'\');setLearnedNow(null)}')
w=panel.index('function w({award:');panel=panel[:w]+'''function w({award:e,animate:t,inline:inTip=!1,onContinue,hasNext=!1}){const notice=(0,a.useRef)(null);(0,a.useEffect)(()=>{if(inTip)notice.current?.scrollIntoView?.({block:"nearest"});},[inTip]);return(0,p.jsx)(l.default,{ref:notice,accessibilityRole:"status",accessibilityLiveRegion:"polite",children:(0,p.jsxs)(u.Card,{row:!0,style:{flexDirection:"column",alignItems:"stretch"},children:[
e?(0,p.jsx)(l.default,{dataSet:{eduPrizeImage:"true"},children:(0,p.jsx)(u.Body,{style:{fontSize:64,lineHeight:80,textAlign:"center"},children:e.symbol})}):null,
(0,p.jsx)(l.default,{dataSet:{eduPrizeTitle:"true"},children:(0,p.jsx)(u.Body,{style:{fontSize:24,lineHeight:32,fontWeight:"800",textAlign:"center"},children:e?.title??"¡Bien hecho!"})}),
(0,p.jsx)(u.Body,{children:e?.message??"¡Excelente avance! Tu progreso quedó guardado."}),
t?(0,p.jsx)(l.default,{dataSet:{eduFireworks:"true"},pointerEvents:"none",accessibilityElementsHidden:!0,importantForAccessibility:"no-hide-descendants",ariaHidden:!0,children:Array.from({length:3},(_,burst)=>(0,p.jsx)(l.default,{dataSet:{eduBurst:"true"},children:Array.from({length:12},(_,spark)=>(0,p.jsx)(l.default,{dataSet:{eduSpark:"true"}},spark))},burst))}):null,
e?.basis?(0,p.jsx)(u.Body,{muted:!0,children:e.basis}):null,
inTip?(0,p.jsxs)(l.default,{dataSet:{eduNextLesson:"true",...(t?{eduAfterFireworks:"true"}:{})},children:[(0,p.jsx)(u.Body,{children:hasNext?"Ya puedes continuar a la próxima lección.":"Completaste las lecciones disponibles en esta sección."}),(0,p.jsx)(u.ActionButton,{title:hasNext?"Continuar a la próxima lección":"Volver a Aprende",onPress:onContinue})]}):null]})})}},860,[1135,13,101,103,222,105,246,110,790,796,797,792,1136,1139,1138,7]);'''
assert panel!=baseline
newbundle=bundle[:start]+panel+bundle[end:];css=(root/'prize-fireworks.css').read_text();build='aprende-premio-texto-'+hashlib.sha256((newbundle+css).encode()).hexdigest()[:12];new=old.rsplit('.js',1)[0]+'-'+build+'.js';cssurl='/'+build+'.css'
put(new,newbundle,routes[old][1]);put(cssurl,css,'text/css; charset=utf-8');html=once(html,old,new);html=once(html,'</head>',f'<link rel="stylesheet" href="{cssurl}"></head>');html=re.sub(r'/register-sw.js\?build=[^" ]+','/register-sw.js?build='+build,html);put('/index.html',html,routes['/index.html'][1])
sw=get('/sw.js');sw=re.sub(r"const CACHE='[^']+'",f"const CACHE='edumoney-shell-{build}'",sw);assets,_=json.JSONDecoder().raw_decode(sw.split('const ASSETS=',1)[1]);assets=list(dict.fromkeys(assets+[new,cssurl]));assert set(assets)<=set(routes);sw=re.sub(r'const ASSETS=\[[^;]+\];','const ASSETS='+json.dumps(assets,separators=(',',':'))+';',sw)
for uri in list(routes):
 if re.match(r'^/sw(?:-.*)?\.js$',uri):put(uri,sw,routes[uri][1])
assert all(routes[k]==v for k,v in original.items() if k!='/index.html' and not re.match(r'^/sw(?:-.*)?\.js$',k))
p.write_text(raw[:a]+ma+json.dumps(routes,separators=(',',':'))+mb+json.dumps(data,separators=(',',':'))+raw[c:])
Path(sys.argv[1]).write_text(newbundle);Path(sys.argv[2]).write_text(panel+'\n__d(function(){},99999,[]);');print(json.dumps({'build':build,'new':new,'css':cssurl,'preservedOriginalModules':True}))
