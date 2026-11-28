const assert=require('assert/strict'),crypto=require('crypto'),{pack,unpack85}=require('../ira/security-base91-codec.cjs');
for(const length of [0,1,2,3,255,256,1024,50000]){const value=crypto.randomBytes(length).toString('base64');assert.equal(unpack85(pack(value)),value);console.log('PASS lossless transport length '+length);}
