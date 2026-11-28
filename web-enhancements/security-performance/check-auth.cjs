const fs=require('fs');
const mode=process.argv[2],paths={login:['web-enhancements/login-no-legacy/check-service.cjs','docs/stages/evidence/login-no-legacy/service-checks.json'],recovery:['web-enhancements/recovery-direct/check-service.cjs','docs/stages/evidence/recovery-direct/service-checks.json'],admin:['web-enhancements/account-required/check-admin.cjs','docs/stages/evidence/account-required/admin-checks.json'],workspace:['web-enhancements/account-required/check-email-key.cjs','/workspace/edumoney/docs/stages/evidence/account-required/email-key-checks.json']};
if(!paths[mode])throw Error('Choose one targeted auth check');
let code=fs.readFileSync(paths[mode][0],'utf8').replace(paths[mode][1],'/workspace/edumoney/docs/stages/evidence/security-performance/'+mode+'.json');
if(mode==='workspace')code=code.replace('Response,URL,crypto:webcrypto','Response,URL,AbortSignal,crypto:webcrypto');
new Function('require','__dirname',code)(require,require('path').resolve(require('path').dirname(paths[mode][0])));
