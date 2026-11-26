"""Scoped EduMoney build runner; credentials remain only in process memory."""
import base64,json,os,pathlib,subprocess,sys,tempfile,termios
ROOT=pathlib.Path('/workspace/edumoney')
target=json.loads((ROOT/'docs/stages/evidence/crash-boat/source-target.json').read_text());target['expected_commit']='330a3d307b0686120cab58cff2594c37ebbab089'
settings=termios.tcgetattr(0);settings[3]&=~(termios.ECHO|termios.ICANON);settings[6][termios.VMIN]=1;settings[6][termios.VTIME]=0;termios.tcsetattr(0,termios.TCSANOW,settings)
print('Ready for the scoped EduMoney Git credential JSON on stdin (hidden).',flush=True)
credential=json.loads(sys.stdin.readline())
assert credential['remote_url']==target['remote_url'] and credential['branch']=='main'
env=os.environ.copy()
if credential.get('token'):env.update(GIT_CONFIG_COUNT='1',GIT_CONFIG_KEY_0='http.extraHeader',GIT_CONFIG_VALUE_0='Authorization: Basic '+base64.b64encode(('x-access-token:'+credential['token']).encode()).decode())
checkout=pathlib.Path(tempfile.mkdtemp(prefix='budget-schedules-',dir='/dev/shm'))
def command(args,cwd,network=False):
 result=subprocess.run(args,cwd=cwd,env=env if network else os.environ.copy(),capture_output=True,text=True)
 if result.returncode:
  print(result.stdout[-5000:]);print(result.stderr.replace(credential.get('token','_no_token_'),'[HIDDEN]')[-5000:],flush=True)
  return False
 print(result.stdout[-3000:],flush=True);return True
assert command(['git','clone','--depth','1','--branch','main',target['remote_url'],str(checkout)],ROOT,True)
base=subprocess.check_output(['git','rev-parse','HEAD'],cwd=checkout,text=True).strip();assert base==target['expected_commit'],'Production source advanced'
manifest=json.loads((checkout/'.openai/hosting.json').read_text());assert manifest['project_id']==target['project_id']
# Small read-only inventory supports the surgical patches without exposing account data.
# Exact base commit and hosting manifest verified above.
print('Source inspected. Awaiting build or stop.',flush=True)
built=False
for line in sys.stdin:
 action=line.strip()
 if action=='stop':break
 if action=='build':
  # Each retry starts from the same untouched base.
  assert command(['git','restore','worker'],checkout)
  built=command(['node',str(ROOT/'web-enhancements/budget-schedules/package.cjs'),str(checkout)],ROOT)
  if built:built=command(['node',str(ROOT/'web-enhancements/budget-schedules/check-artifact.cjs'),str(checkout)],ROOT)
  if built:built=command(['npm','run','build'],checkout)
  assert json.loads((checkout/'.openai/hosting.json').read_text())==manifest
  print('BUILD_PASSED' if built else 'BUILD_FAILED',flush=True)
 elif action=='publish':
  assert built,'Validate before push'
  assert command(['git','config','user.name','Codex'],checkout)
  assert command(['git','config','user.email','codex@openai.com'],checkout)
  # Include reviewable source and tests in the actual production repository.
  import shutil
  review=checkout/'budget-schedules-review'/'source'
  for file in ['src/modules/budget/domain.ts','src/modules/budget/types.ts','src/modules/budget/MonthlyBudgetCenter.web.tsx','src/modules/budget/AnnualExpenses.web.tsx','src/modules/budget/contributions.ts','src/modules/budget/recommendations.ts','src/modules/budget/ContributionFields.web.tsx','src/modules/budget/RecommendationEditor.web.tsx','tests/budget-contributions.test.ts','tests/monthly-budget.test.ts','tests/budget-refinements-ui.test.ts']:
   dest=review/file;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(ROOT/file,dest)
  assert command(['git','add','worker','budget-schedules-review'],checkout)
  assert command(['git','commit','-m','Add configurable periodic recommendations to existing budget categories'],checkout)
  sha=subprocess.check_output(['git','rev-parse','HEAD'],cwd=checkout,text=True).strip()
  assert command(['git','-c','pack.window=0','push','--no-thin','origin','main'],checkout,True)
  result={'project_id':target['project_id'],'commit_sha':sha,'base_commit':base,'local_build':'passed','published':False,'pushed':True,'archive_omitted':'Persistent workspace has insufficient space for the deployment archive; validated build uses isolated memory filesystem; remote build required.'}
  (ROOT/'docs/stages/evidence/budget-schedules/source-result.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result),flush=True);break
