// Read-only Google smoke test. Never print private keys or OAuth access tokens.
import { readFileSync, writeFileSync, existsSync, chmodSync } from 'node:fs';
import { createPrivateKey, createPublicKey, X509Certificate, sign } from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const privatePath = fileURLToPath(new URL('../.secrets/server-private-20260916.pem', import.meta.url));
const publicPath = fileURLToPath(new URL('../.secrets/server-public-20260916.pem', import.meta.url));
const output = fileURLToPath(new URL('../.secrets/google-service-account.json', import.meta.url));
const keyId = '4c0663117504286963467934d920bff81cb92515';
const project = 'essentielpme-reservations';
const email = `booking-staging@${project}.iam.gserviceaccount.com`;
const privateKey = readFileSync(privatePath, 'utf8');
const cert = new X509Certificate(readFileSync(publicPath));
assert.equal(createPublicKey(createPrivateKey(privateKey)).export({type:'spki',format:'pem'}), cert.publicKey.export({type:'spki',format:'pem'}));
assert.ok(Date.parse(cert.validTo) > Date.now());
const credentials = {
  type: 'service_account', project_id: project, private_key_id: keyId,
  private_key: privateKey, client_email: email, client_id: '114209695091764272049',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(email)}`,
  universe_domain: 'googleapis.com'
};
if (!existsSync(output)) writeFileSync(output, JSON.stringify(credentials, null, 2)+'\n', {mode:0o600,flag:'wx'});
else assert.equal(JSON.parse(readFileSync(output,'utf8')).private_key_id,keyId,'Refusing to overwrite other credentials');
chmodSync(output,0o600);
console.log('Private credential file verified; public certificate matches. No secrets logged.');
if (process.argv.includes('--offline')) process.exit(0);
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const now = Math.floor(Date.now()/1000);
const unsigned = `${encode({alg:'RS256',typ:'JWT',kid:keyId})}.${encode({iss:email,scope:'https://www.googleapis.com/auth/datastore',aud:credentials.token_uri,iat:now,exp:now+600})}`;
const assertion = `${unsigned}.${sign('RSA-SHA256',Buffer.from(unsigned),privateKey).toString('base64url')}`;
const response = await fetch(credentials.token_uri, {method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion}),signal:AbortSignal.timeout(20000)});
if (!response.ok) throw new Error(`Google identity verification failed (HTTP ${response.status}); no token details logged.`);
const {access_token} = await response.json();
assert.ok(access_token);
const check = await fetch(`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/booking-config/host`, {headers:{Authorization:`Bearer ${access_token}`},signal:AbortSignal.timeout(20000)});
assert.ok([200,404].includes(check.status),`Firestore read check failed (HTTP ${check.status})`);
console.log(`Google authentication verified; Firestore read access verified (HTTP ${check.status}). No data modified.`);
