"""Fixed Site task: clone only the selected trial, package, verify, build and push.
The only stdin input is its short-lived Git credential. No arbitrary commands/code.
"""
import base64,json,os,pathlib,subprocess,sys,tempfile,termios
ROOT=pathlib.Path('/workspace/edumoney')
target=json.loads((ROOT/'docs/stages/evidence/transfer-only/source-target.json').read_text())
assert target['project_id']=='appgprj_6b070495eb5481918c579fa02cb7441a'
settings=termios.tcgetattr(0);settings[3]&=~(termios.ECHO|termios.ICANON);settings[6][termios.VMIN]=1;settings[6][termios.VTIME]=0;termios.tcsetattr(0,termios.TCSANOW,settings)
print('Ready for trial Git credential JSON on stdin (hidden).',flush=True)
credential=json.loads(sys.stdin.readline())
assert credential['remote_url']==target['remote_url'] and credential['branch']=='main'
assert target['remote_url'].startswith('https://') and '@' not in target['remote_url']
env=os.environ.copy()
if credential.get('token'):
 env.update(GIT_CONFIG_COUNT='1',GIT_CONFIG_KEY_0='http.extraHeader',GIT_CONFIG_VALUE_0='Authorization: Basic '+base64.b64encode(('x-access-token:'+credential['token']).encode()).decode())
checkout=pathlib.Path(tempfile.mkdtemp(prefix='transfer-only-trial-',dir='/dev/shm'))
def command(args,cwd,network=False):
 result=subprocess.run(args,cwd=cwd,env=env if network else os.environ.copy(),capture_output=True,text=True)
 if result.returncode:
  error=result.stderr.replace(credential.get('token','_no_token_'),'[HIDDEN]')
  print(result.stdout[-4000:]);print(error[-4000:]);raise SystemExit(result.returncode)
 return result.stdout
command(['git','clone','--depth','1','--branch','main',target['remote_url'],str(checkout)],ROOT,True)
base=command(['git','rev-parse','HEAD'],checkout).strip();assert base==target['expected_commit'],'Trial source advanced; reconcile before changing it'
manifest=json.loads((checkout/'.openai/hosting.json').read_text());assert manifest['project_id']==target['project_id']
package=command(['node',str(ROOT/'web-enhancements/funds-trial/package-transfer-only.cjs'),str(checkout)],ROOT);print(package,flush=True)
checks=command(['node',str(ROOT/'web-enhancements/funds-trial/check-trial.cjs'),str(checkout)],ROOT);print(checks,flush=True)
(ROOT/'docs/stages/evidence/transfer-only/artifact.log').write_text(checks)
assert json.loads((checkout/'.openai/hosting.json').read_text())==manifest
print(command(['npm','run','build'],checkout),flush=True)
command(['git','config','user.name','Codex'],checkout);command(['git','config','user.email','codex@openai.com'],checkout)
command(['git','add','worker','funds-review/transfer-only.json'],checkout)
command(['git','commit','-m','Simplify fund sections and edit histories; require transfers for allocations'],checkout)
sha=command(['git','rev-parse','HEAD'],checkout).strip()
command(['git','-c','pack.window=0','push','--no-thin','origin','main'],checkout,True)
result={'project_id':target['project_id'],'commit_sha':sha,'base_commit':base,'local_build':'passed','package_checks':1,'artifact_checks':8,'scope':'private trial only'}
(ROOT/'docs/stages/evidence/transfer-only/source-result.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result),flush=True)
