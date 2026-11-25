"""Read only the public EduMoney HTML, service worker and active bundle."""
import gzip,json,pathlib,re,urllib.request
ROOT=pathlib.Path('/workspace/edumoney')
ORIGIN='https://edumoney-web.diegoluissantospabon.chatgpt.site'
build=json.loads((ROOT/'docs/stages/evidence/transfer-only/package.json').read_text())['build']
def read(path):
 assert path=='/' or path=='/sw.js' or path.startswith('/_expo/static/js/web/')
 request=urllib.request.Request(ORIGIN+path,headers={'User-Agent':'Mozilla/5.0','Cache-Control':'no-cache','Accept-Encoding':'identity'})
 with urllib.request.urlopen(request,timeout=30) as response:
  data=response.read();status=response.status
  if data.startswith(bytes([31,139])):data=gzip.decompress(data)
  return data.decode('utf-8'),status
html,status=read('/');assert status==200 and build in html,'Approved HTML revision is not active'
sw,sw_status=read('/sw.js');assert sw_status==200 and "const CACHE='edumoney-shell-"+build+"'" in sw,'Canonical worker revision differs'
common=next(url for url in re.findall('src="([^"?]+[.]js)',html) if url.startswith('/_expo/static/js/web/') and '__common' in url)
bundle,bundle_status=read(common);assert bundle_status==200 and 'Editar historiales' in bundle and 'Presupuesto mensual' in bundle,'Approved UI labels missing'
result={'origin':ORIGIN,'build':build,'html_status':status,'service_worker_status':sw_status,'common_bundle_status':bundle_status,'scope':'Anonymous HTTP resources; no records or browser interaction','passed':True}
(ROOT/'docs/stages/evidence/transfer-only/live-production.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result))
