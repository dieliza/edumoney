"""Read public EduMoney bundles into bounded diagnostic artifacts, without user data."""
import gzip,json,pathlib,re,urllib.request,subprocess,base64,hashlib,tempfile
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
build=json.loads((root/'docs/stages/evidence/progress-blank/route-package.json').read_text())['build']
assert build in html and build in body and build in entryBody
progressBody=read(progress)
assert 'Mi plan de 90' not in progressBody
with tempfile.TemporaryDirectory(prefix='edumoney-live-progress-',dir='/tmp') as folder:
 site=pathlib.Path(folder);(site/'worker').mkdir()
 resources={'/index.html':html,common:body,entry:entryBody,progress:progressBody}
 routes={};content={}
 for url,text in resources.items():
  key=hashlib.sha256(text.encode()).hexdigest();routes[url]=[key,'text/javascript'];content[key]=base64.b64encode(gzip.compress(text.encode())).decode()
 (site/'worker/index.js').write_text('const ROUTES='+json.dumps(routes)+';')
 (site/'worker/content-0.js').write_text('export default '+json.dumps(content)+';')
 result=subprocess.run(['node',str(root/'web-enhancements/funds-trial/check-progress-subtree.cjs'),str(site)],cwd=root,capture_output=True,text=True)
 print(result.stdout)
 if result.returncode:print(result.stderr);raise SystemExit(result.returncode)
report={'build':build,'origin':origin,'public_html':200,'public_common':200,'public_progress':200,'subtree_checks':4,'browser_tested':False,'passed':True}
(root/'docs/stages/evidence/progress-blank/route-live-production.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
