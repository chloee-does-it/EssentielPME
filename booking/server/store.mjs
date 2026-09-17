import {Firestore} from '@google-cloud/firestore';
export class Store {
  constructor(credentials) {
    this.db=new Firestore({projectId:credentials.project_id,credentials:{client_email:credentials.client_email,private_key:credentials.private_key},preferRest:true});
    this.collection=this.db.collection('booking-staging');
  }
  async get(id) { return (await this.collection.doc(id).get()).data()||null; }
  async put(id,value) { await this.collection.doc(id).set(value); }
  async atomic(fn) {
    return this.db.runTransaction(tx=>fn({
      get:async id=>(await tx.get(this.collection.doc(id))).data()||null,
      put:(id,value)=>tx.set(this.collection.doc(id),value)
    }));
  }
}
