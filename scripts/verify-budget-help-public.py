"""One read-only deployment-delivery scenario; never accesses user records."""
import gzip,json,pathlib,re,urllib.request
root=pathlib.Path('/workspace/edumoney');build=json.loads((root/'docs/stages/evidence/budget-help/package.json').read_text())['buildName'];origin='https://edumoney-web.diegoluissantospabon.chatgpt.site'
def read(path):
 request=urllib.request.Request(origin+path,headers={'User-Agent':'Mozilla/5.0','Cache-Control':'no-cache','Accept-Encoding':'identity'})
 with urllib.request.urlopen(request,timeout=40) as r:
  assert r.status==200
  raw=r.read()
  if r.headers.get('Content-Encoding')=='gzip':raw=gzip.decompress(raw)
  return raw.decode()
html=read('/?budget_delivery='+build);assert build in html,'Public HTML is not the validated budget version'
common=re.search(r'src="([^"?]*\/_expo/static/js/web/__common-[^"?]+)',html).group(1)
code=read(common);assert 'solo cambian al confirmar una transferencia' in code and 'no mueve dinero' in code,'Public bundle lacks budget explanation';assert 'Quincenal (15 y fin de mes)' in code or 'semimonthly' in code
sw=read('/sw.js?budget_delivery='+build);assert build in sw and 'skipWaiting' in sw and 'push' in sw
result={'cases':1,'passed':1,'build':build,'public_html':'passed','final_budget_bundle':'passed','service_worker':'passed','browser_verified':False}
(root/'docs/stages/evidence/budget-help/public-delivery.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
