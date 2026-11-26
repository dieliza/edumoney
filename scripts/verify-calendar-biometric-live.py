import urllib.request,re,json,pathlib,gzip
base='https://edumoney-web.diegoluissantospabon.chatgpt.site'
def get(path):
 with urllib.request.urlopen(urllib.request.Request(base+path,headers={'User-Agent':'Mozilla/5.0','Cache-Control':'no-cache'}),timeout=30) as r:
  raw=r.read()
  return (gzip.decompress(raw) if raw[:2]==bytes([31,139]) else raw).decode()
html=get('/?verify=calendar-biometric-style-92fcba83d856');assert 'calendar-biometric-style-92fcba83d856' in html
common=re.search(r'src="([^"?]*__common-[^"?]+\.js)',html).group(1)
js=get(common);assert 'await _r(32010).confirmedWorkspaceKey(password)' in js;assert 'await r(32010).confirmedWorkspaceKey(password)' not in js
print('PASS 1 active biometric module uses the actual Metro loader')
assert 'Abrir calendario para elegir mes y año' in js and 'showPicker()' in js
print('PASS 2 themed native month/calendar control published')
sw=get('/sw.js');assert 'edumoney-shell-calendar-biometric-style-92fcba83d856' in sw
print('PASS 3 canonical service worker serves the new calendar/biometric build')
pathlib.Path('/workspace/edumoney/docs/stages/evidence/calendar-biometric/live-checks.json').write_text(json.dumps({'cases':3,'passed':True,'build':'calendar-biometric-style-92fcba83d856','realDeviceVerified':False},indent=2))
