"""Read-only check of the published button asset and safe update delivery."""
import gzip,json,pathlib,re,urllib.request
root=pathlib.Path('/workspace/edumoney');evidence=root/'docs/stages/evidence/dictation-history-button';build=json.loads((evidence/'package.json').read_text())['buildName'];origin='https://edumoney-web.diegoluissantospabon.chatgpt.site'
def read(path):
 request=urllib.request.Request(origin+path,headers={'User-Agent':'Mozilla/5.0','Cache-Control':'no-cache','Accept-Encoding':'identity'})
 with urllib.request.urlopen(request,timeout=40) as response:
  assert response.status==200
  raw=response.read()
  if response.headers.get('Content-Encoding')=='gzip':raw=gzip.decompress(raw)
  return raw.decode()
html=read('/?delivery='+build);assert build in html
common=re.search(r'src="([^"?]*\/_expo/static/js/web/__common-[^"?]+)',html).group(1);code=read(common)
for marker in ['DictationHistoryButton','Mi historial','de dictados','M94 15 V25 L102 30','#075482','borderTopRightRadius: 10','home-my-dictations']:assert marker in code,marker
sw=read('/sw.js?delivery='+build);assert build in sw and 'skipWaiting' in sw and 'push' in sw
result={'cases':1,'passed':1,'build':build,'public_html':'passed','button_asset':'passed','service_worker':'passed','browser_verified':False}
(evidence/'public-delivery.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
