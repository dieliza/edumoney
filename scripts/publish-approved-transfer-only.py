"""Promote only the approved trial Worker to the existing production Site.
Fixed Git destinations/commits; credential JSON only on hidden stdin; no eval.
"""
import base64,json,os,pathlib,shutil,subprocess,sys,tempfile,termios
ROOT=pathlib.Path('/workspace/edumoney')
targets=json.loads((ROOT/'docs/stages/evidence/transfer-only/promotion-target.json').read_text())
assert targets['production']['project_id']=='appgprj_6af65a2177c48191b95b917e1ca2a2f0'
assert targets['trial']['project_id']=='appgprj_6b070495eb5481918c579fa02cb7441a'
settings=termios.tcgetattr(0);settings[3]&=~(termios.ECHO|termios.ICANON);settings[6][termios.VMIN]=1;settings[6][termios.VTIME]=0;termios.tcsetattr(0,termios.TCSANOW,settings)
print('Ready for the two scoped Site credentials on hidden stdin.',flush=True)
credentials=json.loads(sys.stdin.readline())
folders={};envs={}
def command(args,cwd,network_env=None):
 result=subprocess.run(args,cwd=cwd,env=network_env or os.environ.copy(),capture_output=True,text=True)
 if result.returncode:
  error=result.stderr
  for credential in credentials.values():
   if credential.get('token'):error=error.replace(credential['token'],'[HIDDEN]')
  print(error[-2000:]);raise SystemExit(result.returncode)
 return result.stdout
for name in ['production','trial']:
 target=targets[name];credential=credentials[name]
 assert credential['remote_url']==target['remote_url'] and credential['branch']=='main'
 assert target['remote_url'].startswith('https://') and '@' not in target['remote_url']
 env=os.environ.copy()
 if credential.get('token'):env.update(GIT_CONFIG_COUNT='1',GIT_CONFIG_KEY_0='http.extraHeader',GIT_CONFIG_VALUE_0='Authorization: Basic '+base64.b64encode(('x-access-token:'+credential['token']).encode()).decode())
 envs[name]=env;folder=pathlib.Path(tempfile.mkdtemp(prefix='approved-'+name+'-',dir='/dev/shm'));folders[name]=folder
 command(['git','clone','--depth','1','--branch','main',target['remote_url'],str(folder)],ROOT,env)
 assert command(['git','rev-parse','HEAD'],folder).strip()==target['expected_commit'],name+' source advanced; reconcile without overwriting'
 assert json.loads((folder/'.openai/hosting.json').read_text())['project_id']==target['project_id']
 print(name+' source and identity verified',flush=True)
prod=folders['production'];trial=folders['trial'];manifest=(prod/'.openai/hosting.json').read_text()
old_worker=(prod/'worker/index.js').read_text();new_worker=(trial/'worker/index.js').read_text()
def routes(text):
 start=text.index('const ROUTES=')+len('const ROUTES=');value,count=json.JSONDecoder().raw_decode(text[start:]);return start,start+count,value
pa,pb,prior=routes(old_worker);ta,tb,approved=routes(new_worker)
assert old_worker[:pa]+old_worker[pb:]==new_worker[:ta]+new_worker[tb:],'Server handlers differ; do not overwrite them'
for url,value in prior.items():
 assert url in approved,'Production asset removed: '+url
 mutable=url=='/index.html' or ((url=='/sw.js' or url.startswith('/sw-')) and url.endswith('.js'))
 if not mutable:assert value==approved[url],'Existing asset changed: '+url
for asset in (trial/'worker').iterdir():shutil.copy(asset,prod/'worker'/asset.name)
assert (prod/'.openai/hosting.json').read_text()==manifest
assert (prod/'worker/index.js').read_text()==new_worker
print('PASS: exact approved Worker, unchanged server/bindings, all previous production assets retained',flush=True)
print(command(['npm','run','build'],prod),flush=True)
release={'production_project':targets['production']['project_id'],'production_base':targets['production']['expected_commit'],'approved_trial':targets['trial']['expected_commit'],'user_approval':'Aprobados.','server_and_manifest_unchanged':True,'previous_assets_retained':True,'local_build_passed':True}
(prod/'FUNDS-TRANSFER-ONLY-RELEASE.json').write_text(json.dumps(release,indent=2)+'\n')
command(['git','config','user.name','Codex'],prod);command(['git','config','user.email','codex@openai.com'],prod)
command(['git','add','worker','FUNDS-TRANSFER-ONLY-RELEASE.json'],prod)
command(['git','commit','-m','Publish approved transfer-only fund sections and editable histories'],prod)
sha=command(['git','rev-parse','HEAD'],prod).strip()
command(['git','-c','pack.window=0','push','--no-thin','origin','main'],prod,envs['production'])
release['commit_sha']=sha
(ROOT/'docs/stages/evidence/transfer-only/production-release.json').write_text(json.dumps(release,indent=2)+'\n')
print(json.dumps({'commit_sha':sha,'project_id':targets['production']['project_id']}),flush=True)
