import urllib.request,re,json,pathlib,gzip
base='https://edumoney-web.diegoluissantospabon.chatgpt.site'
def get(path):
 with urllib.request.urlopen(urllib.request.Request(base+path,headers={'User-Agent':'Mozilla/5.0','Cache-Control':'no-cache'}),timeout=30) as r:
  raw=r.read()
  return (gzip.decompress(raw) if raw[:2]==bytes([31,139]) else raw).decode()
html=get('/?verify=accounts-required-d07dadc516c3');assert 'accounts-required-d07dadc516c3' in html
common=re.search(r'src="([^"?]*__common-[^"?]+\.js)',html).group(1)
js=get(common);assert 'RequiredAccountGate' in js and 'edumoney-admin-users' in js and 'Administrar usuarios' in js
print('PASS 1 live entry loads required account gate and admin section')
access=get('/account/access');assert 'name="email"' in access and 'name="password"' in access and ('name="confirm"' in access or 'name="repeat"' in access or 'name="confirmPassword"' in access);assert 'Acceso opcional en prueba' not in access
print('PASS 2 registration has email, password and confirmation')
sw=get('/sw.js');assert 'edumoney-shell-accounts-required-d07dadc516c3' in sw
print('PASS 3 service worker points to new account build')
recovery=get('/account/recovery');assert 'registros que ya vinculaste' in recovery
print('PASS 4 recovery explains linked record preservation')
pathlib.Path('/workspace/edumoney/docs/stages/evidence/account-required/live-checks.json').write_text(json.dumps({'cases':4,'passed':True,'build':'accounts-required-d07dadc516c3','browserVerified':False},indent=2))
