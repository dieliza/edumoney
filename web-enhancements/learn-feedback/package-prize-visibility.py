"""Repair only the live prize presentation and its stylesheet on top of v103."""
import base64,gzip,hashlib,json,re,sys
from pathlib import Path
path=Path('worker/index.js');raw=path.read_text();root=Path(__file__).parent
ma,mb,mc='const ROUTES=',';const CONTENT=',';const v74Worker='
a=raw.index(ma);b=raw.index(mb,a);c=raw.index(mc,b)
routes=json.loads(raw[a+len(ma):b]);data=json.loads(raw[b+len(mb):c]);original=dict(routes)
def get(uri):return gzip.decompress(base64.b64decode(data[routes[uri][0]])).decode()
def put(uri,text,kind):
 blob=text.encode();key=hashlib.sha256(blob).hexdigest();data[key]=base64.b64encode(gzip.compress(blob,mtime=0)).decode();routes[uri]=[key,kind]
html=get('/index.html');old=re.search(r'src="(/_expo/static/js/web/__common-[^"]+)"',html)[1];bundle=get(old)
at=bundle.index('function w({award:');end=bundle.index('\n__d(',at)
assert 'eduFireworks' in bundle[at:end] and 'row:!0' in bundle[at:end]
newbundle=bundle[:at]+(root/'prize-visibility.txt').read_text().rstrip()+bundle[end:]
css=(root/'prize-fireworks.css').read_text();build='aprende-visible-'+hashlib.sha256((newbundle+css).encode()).hexdigest()[:12];new=old.rsplit('.js',1)[0]+'-'+build+'.js';cssurl='/'+build+'.css'
put(new,newbundle,routes[old][1]);put(cssurl,css,'text/css; charset=utf-8');assert html.count(old)==1;html=html.replace(old,new,1).replace('</head>',f'<link rel="stylesheet" href="{cssurl}"></head>',1);html=re.sub(r'/register-sw.js\?build=[^" ]+','/register-sw.js?build='+build,html);put('/index.html',html,routes['/index.html'][1])
# Refresh canonical and legacy CSS so an older prize stylesheet cannot hide fireworks.
for uri in list(routes):
 if uri.startswith('/aprende-premio-texto-') and uri.endswith('.css'):put(uri,css,routes[uri][1])
sw=get('/sw.js');sw=re.sub(r"const CACHE='[^']+'",f"const CACHE='edumoney-shell-{build}'",sw);assets,_=json.JSONDecoder().raw_decode(sw.split('const ASSETS=',1)[1]);assets=list(dict.fromkeys(assets+[new,cssurl]));assert set(assets)<=set(routes);sw=re.sub(r'const ASSETS=\[[^;]+\];','const ASSETS='+json.dumps(assets,separators=(',',':'))+';',sw)
for uri in list(routes):
 if re.match(r'^/sw(?:-.*)?\.js$',uri):put(uri,sw,routes[uri][1])
assert all(routes[k]==v for k,v in original.items() if k!='/index.html' and not re.match(r'^/sw(?:-.*)?\.js$',k) and not(k.startswith('/aprende-premio-texto-') and k.endswith('.css')))
path.write_text(raw[:a]+ma+json.dumps(routes,separators=(',',':'))+mb+json.dumps(data,separators=(',',':'))+raw[c:])
at=newbundle.index('_e.EducationPanel=function');start=newbundle.rfind('\n__d(',0,at);end=newbundle.index('\n__d(',at);Path(sys.argv[1]).write_text(newbundle[start:end]+'\n__d(function(){},99999,[]);');print(json.dumps({'build':build,'bundle':new,'preservedLogic':True}))
