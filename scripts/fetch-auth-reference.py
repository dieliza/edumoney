import urllib.request,pathlib
p=pathlib.Path('docs/stages/evidence/account-required/supabase-changelog.md')
with urllib.request.urlopen(urllib.request.Request('https://supabase.com/changelog.md',headers={'User-Agent':'Mozilla/5.0'}),timeout=30) as r:p.write_bytes(r.read(180000))
print('Current Supabase changelog fetched for auth API review.')
