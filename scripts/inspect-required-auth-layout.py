"""Read-only scoped production-source inspection; credential only on hidden stdin."""
import os,json,pathlib,tempfile,subprocess,base64,sys,termios
root=pathlib.Path('/workspace/edumoney');target=json.loads((root/'docs/stages/evidence/crash-boat/source-target.json').read_text());target['expected_commit']='b3acfd1f1c5d839d2320474dc16885fd43f31291'
s=termios.tcgetattr(0);s[3]&=~(termios.ECHO|termios.ICANON);s[6][termios.VMIN]=1;s[6][termios.VTIME]=0;termios.tcsetattr(0,termios.TCSANOW,s);print('Ready for scoped source credential JSON (hidden).',flush=True)
c=json.loads(sys.stdin.readline());assert c['remote_url']==target['remote_url'] and c['branch']=='main'
env=os.environ.copy()
if c.get('token'):env.update(GIT_CONFIG_COUNT='1',GIT_CONFIG_KEY_0='http.extraHeader',GIT_CONFIG_VALUE_0='Authorization: Basic '+base64.b64encode(('x-access-token:'+c['token']).encode()).decode())
p=pathlib.Path(tempfile.mkdtemp(prefix='required-account-inspect-',dir='/dev/shm'))
r=subprocess.run(['git','clone','--depth','1',c['remote_url'],str(p)],env=env,capture_output=True,text=True);assert r.returncode==0,'Scoped source read failed'
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=p,text=True).strip()==target['expected_commit']
r=subprocess.run(['node',str(root/'web-enhancements/account-required/layout.cjs'),str(p)],cwd=root,capture_output=True,text=True);print(r.stdout);print(r.stderr if r.returncode else 'Read-only source inspection complete.');raise SystemExit(r.returncode)
