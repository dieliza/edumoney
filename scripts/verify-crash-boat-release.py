"""Anonymous, read-only checks of the approved EduMoney photo-theme publication."""
import base64,gzip,hashlib,json,pathlib,re,urllib.request
root=pathlib.Path('/workspace/edumoney');origin='https://edumoney-web.diegoluissantospabon.chatgpt.site'
meta=json.loads((root/'docs/stages/evidence/crash-boat/package.json').read_text())
def read(path):
 assert path in ['/','/sw.js'] or path.startswith('/themes/crash-boat-') or path.startswith('/_expo/static/js/web/')
 with urllib.request.urlopen(urllib.request.Request(origin+path,headers={'User-Agent':'Mozilla/5.0','Cache-Control':'no-cache'}),timeout=30) as response:
  raw=response.read()
  if raw.startswith(bytes([31,139])):raw=gzip.decompress(raw)
  return raw
html=read('/').decode();assert meta['build'] in html
common=next(p for p in re.findall('src="([^"?]+[.]js)',html) if '/__common-' in p)
body=read(common).decode();assert 'Crash Boat · Aguadilla' in body and 'edumoney-crash-boat-style' in body and 'SceneThemeChoice' in body
for image in meta['images']:
 raw=read(image['path']);assert raw[:4]==b'RIFF';assert raw==(root/('public'+image['path'])).read_bytes()
sw=read('/sw.js').decode();assert "const CACHE='edumoney-shell-"+meta['build']+"'" in sw
for image in meta['images']:assert image['path'] in sw
result={'origin':origin,'build':meta['build'],'html_and_common':True,'three_webp_files_identical':True,'canonical_service_worker':True,'browser_tested':False,'passed':True}
(root/'docs/stages/evidence/crash-boat/live.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
