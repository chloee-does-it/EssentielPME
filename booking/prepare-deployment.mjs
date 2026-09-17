// Creates private deployment artifacts only; never prints credentials.
import {readFileSync,writeFileSync,existsSync,chmodSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {parseEnv} from 'node:util';
import {fileURLToPath} from 'node:url';
const path=name=>fileURLToPath(new URL('../'+name,import.meta.url));
const oauth=parseEnv(readFileSync(path('.env.google-staging'),'utf8'));
const settingsPath=path('.secrets/staging-runtime.json');
let settings;
if(existsSync(settingsPath))settings=JSON.parse(readFileSync(settingsPath,'utf8'));
else {
  settings={
    BOOKING_ORIGIN:'https://essentielpme-staging-hk2il.ondigitalocean.app',
    STAGING_PASSWORD:randomBytes(24).toString('base64url'),
    TOKEN_ENCRYPTION_KEY:randomBytes(32).toString('base64'),
    GOOGLE_CLIENT_ID:oauth.GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET:oauth.GOOGLE_CLIENT_SECRET,
    GOOGLE_HOST_EMAIL:'info@superquanti.com',
    GOOGLE_SERVICE_ACCOUNT_JSON:JSON.stringify(JSON.parse(readFileSync(path('.secrets/google-service-account.json'),'utf8'))),
    BOOKING_TEST_EMAILS:''
  };
  writeFileSync(settingsPath,JSON.stringify(settings,null,2)+'\n',{mode:0o600,flag:'wx'});
}
chmodSync(settingsPath,0o600);
const spec=JSON.parse(readFileSync(path('.do/app-connected.json'),'utf8'));
spec.services[0].envs=Object.entries(settings).map(([key,value])=>({key,value,scope:'RUN_TIME',type:['STAGING_PASSWORD','TOKEN_ENCRYPTION_KEY','GOOGLE_CLIENT_SECRET','GOOGLE_SERVICE_ACCOUNT_JSON'].includes(key)?'SECRET':'GENERAL'}));
const specPath=path('.secrets/app-connected.yaml');
writeFileSync(specPath,JSON.stringify(spec,null,2)+'\n',{mode:0o600});chmodSync(specPath,0o600);
console.log('Private runtime configuration and deployment spec prepared; no secrets logged.');
