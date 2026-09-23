import {createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual} from 'node:crypto';

export class PublicError extends Error {
  constructor(code, status=400) { super(code); this.code=code; this.status=status; }
}
export const hash = value => createHash('sha256').update(value).digest('hex');
export const random = () => randomBytes(32).toString('base64url');
export function equal(a,b) {
  return typeof a==='string' && typeof b==='string' && timingSafeEqual(Buffer.from(hash(a)),Buffer.from(hash(b)));
}
export function vault(secret) {
  const key=Buffer.from(secret||'', 'base64');
  if(key.length!==32) throw new Error('A 32-byte TOKEN_ENCRYPTION_KEY is required');
  return {
    seal(value) {
      const iv=randomBytes(12), cipher=createCipheriv('aes-256-gcm',key,iv);
      const data=Buffer.concat([cipher.update(JSON.stringify(value)),cipher.final()]);
      return Buffer.concat([iv,cipher.getAuthTag(),data]).toString('base64url');
    },
    open(value) {
      const data=Buffer.from(value,'base64url');
      const cipher=createDecipheriv('aes-256-gcm',key,data.subarray(0,12));
      cipher.setAuthTag(data.subarray(12,28));
      return JSON.parse(Buffer.concat([cipher.update(data.subarray(28)),cipher.final()]).toString());
    }
  };
}
export function config(env=process.env) {
  const required=['BOOKING_ORIGIN','STAGING_PASSWORD','TOKEN_ENCRYPTION_KEY','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','GOOGLE_SERVICE_ACCOUNT_JSON'];
  for(const name of required) if(!env[name]) throw new Error(`Missing ${name}`);
  const origin=new URL(env.BOOKING_ORIGIN);
  if(origin.origin!==env.BOOKING_ORIGIN || (origin.protocol!=='https:' && origin.hostname!=='127.0.0.1')) throw new Error('Invalid booking origin');
  if(env.STAGING_PASSWORD.length<24) throw new Error('Staging password must be at least 24 characters');
  const credentials=JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
  if(credentials.project_id!=='essentielpme-reservations') throw new Error('Wrong Google project');
  const host=env.GOOGLE_HOST_EMAIL||'info@superquanti.com';
  if(host!=='info@superquanti.com') throw new Error('Unexpected host');
  const environment=env.BOOKING_ENVIRONMENT==='production'?'production':'staging';
  const alertRecipients=(env.BOOKING_ALERT_RECIPIENTS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
  if(alertRecipients.length>5||new Set(alertRecipients).size!==alertRecipients.length||
    alertRecipients.some(email=>!/^[a-z0-9._%+-]+@superquanti\.com$/.test(email)))
    throw new Error('Invalid internal alert recipients');
  if(alertRecipients.length&&(environment!=='production'||!env.BREVO_API_KEY))
    throw new Error('Internal alerts require production and Brevo');
  const collection=env.BOOKING_COLLECTION||(environment==='production'?'booking-production':'booking-staging');
  const migrateCollection=env.BOOKING_MIGRATE_COLLECTION||null;
  if(!/^booking-[a-z0-9-]+$/.test(collection)||migrateCollection&&!/^booking-[a-z0-9-]+$/.test(migrateCollection))throw new Error('Invalid booking collection');
  return {origin:origin.origin, password:env.STAGING_PASSWORD, encryptionKey:env.TOKEN_ENCRYPTION_KEY,
    clientId:env.GOOGLE_CLIENT_ID, clientSecret:env.GOOGLE_CLIENT_SECRET, credentials, host,
    environment,production:environment==='production',collection,migrateCollection,
    brevoApiKey:env.BREVO_API_KEY||null,
    alertRecipients,
    allowedEmails:(env.BOOKING_TEST_EMAILS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean),
    port:Number(env.PORT||8080), secure:origin.protocol==='https:'};
}
