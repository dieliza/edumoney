"""Fixed task: clone only the production EduMoney repository, verify the requested history correction, build and push.
The only stdin input is its short-lived Git credential. No arbitrary commands/code.
"""
import base64,json,os,pathlib,subprocess,sys,tempfile,termios
ROOT=pathlib.Path('/workspace/edumoney')
target=json.loads((ROOT/'docs/stages/evidence/crash-boat/source-target.json').read_text());target['expected_commit']='fcb77449181c0f12483febbda3f01aa7e306d73d'
assert target['project_id']=='appgprj_6af65a2177c48191b95b917e1ca2a2f0'
settings=termios.tcgetattr(0);settings[3]&=~(termios.ECHO|termios.ICANON);settings[6][termios.VMIN]=1;settings[6][termios.VTIME]=0;termios.tcsetattr(0,termios.TCSANOW,settings)
print('Ready for the scoped EduMoney Git credential JSON on stdin (hidden).',flush=True)
credential=json.loads(sys.stdin.readline())
assert credential['remote_url']==target['remote_url'] and credential['branch']=='main'
assert target['remote_url'].startswith('https://') and '@' not in target['remote_url']
env=os.environ.copy()
if credential.get('token'):
 env.update(GIT_CONFIG_COUNT='1',GIT_CONFIG_KEY_0='http.extraHeader',GIT_CONFIG_VALUE_0='Authorization: Basic '+base64.b64encode(('x-access-token:'+credential['token']).encode()).decode())
checkout=pathlib.Path(tempfile.mkdtemp(prefix='verified-admin-',dir='/dev/shm'))
def command(args,cwd,network=False):
 result=subprocess.run(args,cwd=cwd,env=env if network else os.environ.copy(),capture_output=True,text=True)
 if result.returncode:
  error=result.stderr.replace(credential.get('token','_no_token_'),'[HIDDEN]')
  print(result.stdout[-4000:]);print(error[-4000:]);raise SystemExit(result.returncode)
 return result.stdout
command(['git','clone','--depth','1','--branch','main',target['remote_url'],str(checkout)],ROOT,True)
base=command(['git','rev-parse','HEAD'],checkout).strip();assert base==target['expected_commit'],'Trial source advanced; reconcile before changing it'
manifest=json.loads((checkout/'.openai/hosting.json').read_text());assert manifest['project_id']==target['project_id']
print(command(['node',str(ROOT/'web-enhancements/calendar-biometric/style-package.cjs'),str(checkout)],ROOT),flush=True)
print(command(['node',str(ROOT/'web-enhancements/calendar-biometric/check-month.cjs'),str(checkout)],ROOT),flush=True)
assert json.loads((checkout/'.openai/hosting.json').read_text())==manifest
print(command(['npm','run','build'],checkout),flush=True)
command(['git','config','user.name','Codex'],checkout);command(['git','config','user.email','codex@openai.com'],checkout)
command(['git','add','worker','account-review'],checkout)
command(['git','commit','-m','Preserve themed progress calendar card surface'],checkout)
sha=command(['git','rev-parse','HEAD'],checkout).strip()
command(['git','-c','pack.window=0','push','--no-thin','origin','main'],checkout,True)

result={'project_id':target['project_id'],'commit_sha':sha,'base_commit':base,'local_build':'passed','published':False,'pushed':True}
(ROOT/'docs/stages/evidence/calendar-biometric/source-result.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result),flush=True)
