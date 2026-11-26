import urllib.request,re,json,pathlib,gzip
base='https://edumoney-web.diegoluissantospabon.chatgpt.site'
def get(path):
 with urllib.request.urlopen(urllib.request.Request(base+path,headers={'User-Agent':'Mozilla/5.0','Cache-Control':'no-cache'}),timeout=30) as r:
  raw=r.read()
  return (gzip.decompress(raw) if raw[:2]==bytes([31,139]) else raw).decode()
html=get('/?verify=recovery-direct-e44b5966e331');assert 'recovery-direct-e44b5966e331' in html
common=re.search(r'src="([^"?]*__common-[^"?]+\.js)',html).group(1)
js=get(common);assert 'selectRecoveredWebWorkspace' in js and 'previousRecordsPreserved' in js and 'edu-account-link-v2' in js
print('PASS 1 active app includes direct reset and preserved separate workspace flow')
page=get('/account/recovery');assert 'src="/account/account-ui.mjs"' in page
bridge=get('/account/account-ui.mjs');expected=pathlib.Path('/workspace/edumoney/web-enhancements/recovery-direct/entry-bridge.mjs').read_text();assert bridge==expected
print('PASS 2 public recovery entry transports verification before app initialization')
sw=get('/sw.js');assert 'edumoney-shell-recovery-direct-e44b5966e331' in sw
print('PASS 3 new recovery build served by canonical service worker')
pathlib.Path('/workspace/edumoney/docs/stages/evidence/recovery-direct/live-checks.json').write_text(json.dumps({'cases':3,'passed':True,'build':'recovery-direct-e44b5966e331','browserVerified':False},indent=2))
