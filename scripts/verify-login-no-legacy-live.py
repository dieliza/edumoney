import urllib.request,re,json,pathlib,gzip
base='https://edumoney-web.diegoluissantospabon.chatgpt.site'
def get(path):
 with urllib.request.urlopen(urllib.request.Request(base+path,headers={'User-Agent':'Mozilla/5.0','Cache-Control':'no-cache'}),timeout=30) as r:
  raw=r.read()
  return (gzip.decompress(raw) if raw[:2]==bytes([31,139]) else raw).decode()
html=get('/?version=130');assert 'login-no-legacy-b2043405259a' in html
common=re.search(r'src="([^"?]*__common-[^"?]+\.js)',html).group(1)
js=get(common);normalized=re.sub(r'\\u([0-9a-fA-F]{4})',lambda m:chr(int(m.group(1),16)),js)
assert 'Contraseña anterior de tus registros' not in normalized and 'needsLegacy' not in js
print('PASS 1 live ordinary entry has no historical-password prompt or transition')
assert 'ACCOUNT_WORKSPACE_MISMATCH' in js and 'selectRecoveredWebWorkspace' in js and 'previousRecordsPreserved' in js
print('PASS 2 verified login includes isolated preservation fallback')
sw=get('/sw.js');assert 'edumoney-shell-login-no-legacy-b2043405259a' in sw
print('PASS 3 canonical updater serves the new login build')
pathlib.Path('/workspace/edumoney/docs/stages/evidence/login-no-legacy/live-checks.json').write_text(json.dumps({'cases':3,'passed':True,'build':'login-no-legacy-b2043405259a','browserVerified':False},indent=2))
