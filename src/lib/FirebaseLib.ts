import { Firestore, FieldValue } from '@google-cloud/firestore';
import { FirebaseCollections } from '../enums/FirebaseCollections';

export class FirebaseLib {
    private firestore: Firestore;
  
    constructor(isLive: boolean = false) {
      const env = process.env.NODE_ENV || 'development';
      let credentialsPath: string;
      
      if (env === 'production' || isLive) {
        credentialsPath = `${__dirname}/Firebase/credentials-live.json`;
      } else {
        credentialsPath = `${__dirname}/Firebase/credentials.json`;
      }
      
      const credentials = require(credentialsPath);
      
      this.firestore = new Firestore({
        projectId: credentials.project_id,
        credentials: {
          client_email: credentials.client_email,
          private_key: credentials.private_key
        }
      });
    }
  
    /**
     * Retrieve data from a Firestore document by path and document ID
     * @param collection The collection or path in Firestore
     * @param docID The document ID within the collection
     * @returns The document data or empty object if not found
     */
    async getData(collection: FirebaseCollections | string, docID: string): Promise<Record<string, any>> {
      try {
        const collectionPath = typeof collection === 'string' ? collection : collection;
        const docRef = this.firestore.collection(collectionPath).doc(docID);
        const snapshot = await docRef.get();
        
        if (snapshot.exists) {
          return snapshot.data() as Record<string, any>;
        } else {
          return {};
        }
      } catch (error) {
        console.error('Error getting Firestore data:', error);
        return {};
      }
    }
}