"""Read public EduMoney bundles into bounded diagnostic artifacts, without user data."""
import gzip,json,pathlib,re,urllib.request,subprocess
root=pathlib.Path('/workspace/edumoney')
out=root/'docs/stages/evidence/progress-blank/live'
out.mkdir(exist_ok=True)
origin='https://edumoney-web.diegoluissantospabon.chatgpt.site'
def read(path):
 assert path=='/' or path.startswith('/_expo/static/js/web/')
 with urllib.request.urlopen(urllib.request.Request(origin+path,headers={'User-Agent':'Mozilla/5.0','Cache-Control':'no-cache'}),timeout=30) as r:
  raw=r.read()
  if raw.startswith(bytes([31,139])):raw=gzip.decompress(raw)
  return raw.decode()
html=read('/')
(out/'index.html').write_text(html)
common=next(p for p in re.findall('src="([^"?]+[.]js)',html) if '__common' in p)
body=read(common)
entry=next(p for p in re.findall('src="([^"?]+[.]js)',html) if re.search(r'/index-',p))
entryBody=read(entry)
(out/'entry.js').write_text(entryBody)
progress=next(p for p in re.findall(r'[\w./-]*progress-[\w.-]+[.]js',entryBody) if re.search(r'(^|/)progress-',p))
if not progress.startswith('/'):progress=common.rsplit('/',1)[0]+'/'+progress.rsplit('/',1)[-1]
for name,text in [('common',body),('progress',read(progress))]:
 (out/(name+'.js')).write_text(text)
(out/'paths.json').write_text(json.dumps({'common':common,'progress':progress},indent=2))
print(json.dumps({'saved':str(out),'bytes':len(body)}))
