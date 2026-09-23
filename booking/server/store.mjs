import {Firestore} from '@google-cloud/firestore';
export class Store {
  constructor(credentials,collection='booking-staging') {
    this.db=new Firestore({projectId:credentials.project_id,credentials:{client_email:credentials.client_email,private_key:credentials.private_key},preferRest:true});
    this.collection=this.db.collection(collection);
  }
  async get(id) { return (await this.collection.doc(id).get()).data()||null; }
  async put(id,value) { await this.collection.doc(id).set(value); }
  async brevoJobs() {
    const snapshot=await this.collection.where('kind','==','brevo').get();
    return snapshot.docs.map(doc=>({id:doc.id,...doc.data()}))
      .filter(job=>job.status!=='done').sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
  }
  async alertJobs() {
    const snapshot=await this.collection.where('kind','==','alert').get();
    return snapshot.docs.map(doc=>({id:doc.id,...doc.data()}))
      .filter(job=>job.status!=='done').sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
  }
  async atomic(fn) {
    return this.db.runTransaction(tx=>fn({
      get:async id=>(await tx.get(this.collection.doc(id))).data()||null,
      put:(id,value)=>tx.set(this.collection.doc(id),value)
    }));
  }
  async migrateHostFrom(collection) {
    if(!collection||await this.get('host'))return false;
    const source=(await this.db.collection(collection).doc('host').get()).data();
    if(!source?.refresh||!source?.email)return false;
    await this.collection.doc('host').create({...source,migratedAt:new Date().toISOString()});
    return true;
  }
}
