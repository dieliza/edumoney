import pathlib,urllib.request,gzip
root=pathlib.Path('/workspace/edumoney/docs/stages/evidence/account-required')
origin='https://edumoney-web.diegoluissantospabon.chatgpt.site'
for name in ['access','account.mjs','account-ui.mjs','recovery.mjs','recovery-ui.mjs','existing-vault-notice.mjs']:
 req=urllib.request.Request(origin+'/account/'+name,headers={'User-Agent':'Mozilla/5.0','Cache-Control':'no-cache'})
 with urllib.request.urlopen(req,timeout=30) as r:
  raw=r.read()
  if raw[:2]==bytes([31,139]):raw=gzip.decompress(raw)
  (root/name.replace('/','-')).write_bytes(raw)
print('Public account implementation inspected; no credentials or personal records read.')
