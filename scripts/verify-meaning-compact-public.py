"""Read-only production asset checks; no financial records or sessions accessed."""
import gzip,json,pathlib,re,urllib.request
root=pathlib.Path('/workspace/edumoney');e=root/'docs/stages/evidence/meaning-compact';build=json.loads((e/'package.json').read_text())['buildName'];origin='https://edumoney-web.diegoluissantospabon.chatgpt.site'
def read(path):
 with urllib.request.urlopen(urllib.request.Request(origin+path,headers={'User-Agent':'Mozilla/5.0','Cache-Control':'no-cache','Accept-Encoding':'identity'}),timeout=40) as r:
  assert r.status==200
  raw=r.read()
  return (gzip.decompress(raw) if r.headers.get('Content-Encoding')=='gzip' else raw).decode()
html=read('/?delivery='+build);assert build in html
code=''.join(read(path) for path in json.loads((e/'public-assets.json').read_text()))
for marker in ["maxWidth:'100%'","paddingHorizontal:0","flexShrink:1","accessibilityLiveRegion","MeaningHelp"]:assert marker in code,marker
sw=read('/sw.js?delivery='+build);assert build in sw and 'skipWaiting' in sw and 'push' in sw
result={'cases':1,'passed':1,'build':build,'public_html':'passed','simulators_and_learning_assets':'passed','service_worker':'passed','browser_verified':False};(e/'public-delivery.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
