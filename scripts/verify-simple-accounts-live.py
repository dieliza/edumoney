import urllib.request,re,json,pathlib,gzip
base='https://edumoney-web.diegoluissantospabon.chatgpt.site'
def get(path):
 with urllib.request.urlopen(urllib.request.Request(base+path,headers={'User-Agent':'Mozilla/5.0','Cache-Control':'no-cache'}),timeout=30) as r:
  raw=r.read()
  return (gzip.decompress(raw) if raw[:2]==bytes([31,139]) else raw).decode()
html=get('/?verify=account-simple-dcb32d7a8a26');assert 'account-simple-dcb32d7a8a26' in html
common=re.search(r'src="([^"?]*__common-[^"?]+\.js)',html).group(1)
js=get(common);assert 'RequiredAccountGate' in js and 'AccountPassword' in js and 'finishAccountRecovery' in js and 'Administrar usuarios' in js
print('PASS 1 live entry loads required account gate and admin section')
access=get('/account/access');assert 'src="/account/account-ui.mjs"' in access and 'id="signin"' not in access
assert get('/account/account-ui.mjs')=="location.replace('/'+location.hash);"
print('PASS 2 old access link converges to the same app without a standalone dead end')
sw=get('/sw.js');assert 'edumoney-shell-account-simple-dcb32d7a8a26' in sw
print('PASS 3 service worker points to new account build')
recovery=get('/account/recovery');assert 'src="/account/account-ui.mjs"' in recovery
print('PASS 4 legacy recovery opens the same app with token bridge')
pathlib.Path('/workspace/edumoney/docs/stages/evidence/account-simple/live-checks.json').write_text(json.dumps({'cases':4,'passed':True,'build':'account-simple-dcb32d7a8a26','browserVerified':False},indent=2))
