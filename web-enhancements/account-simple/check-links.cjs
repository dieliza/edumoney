const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
let src=fs.readFileSync('web-enhancements/account-required/check-service.cjs','utf8');src=src.slice(0,src.indexOf('async function main()'));
src=src.replace("uid:'owner-a'","uid:'owner-a',otp:[],cleared:false");src=src.replace("const auth={", "const auth={verifyOtp:async input=>{s.otp.push(input);assert(s.cleared);return{data:{user:user(),session:{access_token:'fixture-token'}},error:null};},");
src=src.replace('vm.createContext({Error,vault,','vm.createContext({URLSearchParams,location:{hash:hash??\'\',pathname:\'/\',search:\'\'},history:{replaceState(){s.cleared=true;}},Error,vault,').replace('function fixture(){','function fixture(hash){');
src += `
async function test(){
 let f=fixture();assert.equal(await f.api.beginAccountLink(),null);assert.equal(f.s.otp.length,0);console.log('PASS 1 normal login does not verify or allocate link');
 f=fixture('#type=recovery&token_hash='+'A'.repeat(32)+'&evil=1');await assert.rejects(f.api.beginAccountLink());assert(f.s.cleared);assert.equal(f.s.otp.length,0);console.log('PASS 2 invalid links cleared before Auth and denied');
 f=fixture('#type=email&token_hash='+'A'.repeat(32));let link=await f.api.beginAccountLink();assert.equal(link.recovery,false);await assert.rejects(f.api.finishAccountRecovery('Password-FICTITIOUS','Password-FICTITIOUS'));assert.equal(f.s.updates.length,0);console.log('PASS 3 email confirmation cannot authorize password change');
 f=fixture('#type=recovery&token_hash='+'B'.repeat(32));const [a,b]=await Promise.all([f.api.beginAccountLink(),f.api.beginAccountLink()]);assert.equal(a.recovery,true);assert.equal(b.recovery,true);assert.equal(f.s.otp.length,1);await assert.rejects(f.api.finishAccountRecovery('Password-FICTITIOUS','Mismatch-FICTITIOUS'));assert.equal(f.s.updates.length,0);console.log('PASS 4 recovery verified once and mismatches do not change password');
 await f.api.signinAccount('owner@example.test','Previous-FICTITIOUS-pass');const key=f.s.stored;const result=await f.api.finishAccountRecovery('New-FICTITIOUS-password','New-FICTITIOUS-password');assert.equal(result.ready,true);assert.equal(f.s.updates.length,1);assert.equal(f.s.stored,key);await assert.rejects(f.api.finishAccountRecovery('Next-FICTITIOUS-password','Next-FICTITIOUS-password'));console.log('PASS 5 recovery opens same linked vault and cannot reuse update authorization');
 fs.writeFileSync('docs/stages/evidence/account-simple/link-checks.json',JSON.stringify({cases:5,passed:true}));
}test().catch(e=>{console.error(e);process.exitCode=1;});`;
new Function('require',src)(require);
