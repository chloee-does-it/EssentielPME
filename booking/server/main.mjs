import {config,vault} from './security.mjs';
import {Store} from './store.mjs';
import {GoogleCalendar} from './google.mjs';
import {BookingService} from './service.mjs';
import {makeServer} from './http.mjs';
import {BrevoClient,BrevoSync} from './brevo.mjs';
const settings=config(),store=new Store(settings.credentials,settings.collection);
if(settings.production&&settings.migrateCollection)await store.migrateHostFrom(settings.migrateCollection);
const calendar=new GoogleCalendar(settings,store,vault(settings.encryptionKey));
// Production Brevo sync stays opt-in because it transmits visitor contact data.
const brevo=settings.brevoApiKey&&!settings.production?new BrevoSync({store,client:new BrevoClient(settings.brevoApiKey),allowedEmails:settings.allowedEmails}):null;
const service=new BookingService({store,calendar,brevo,allowedEmails:settings.allowedEmails,allowAll:settings.production,environment:settings.environment});
const server=makeServer({config:settings,store,calendar,service});
server.listen(settings.port,'0.0.0.0',()=>console.log(`Booking server ready (${settings.environment})`));
const syncTimer=brevo?setInterval(()=>brevo.kick(),60000):null;
brevo?.kick();
process.on('SIGTERM',()=>{if(syncTimer)clearInterval(syncTimer);server.close(()=>process.exit(0));});
