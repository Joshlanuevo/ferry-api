import dotenv from 'dotenv';
import { Firestore, CollectionReference } from '@google-cloud/firestore';
import { FirebaseCollections } from '../enums/FirebaseCollections';

dotenv.config();

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

      /**
   * Get documents from a Firestore collection filtered by the provided criteria.
   * 
   * @param collection The collection to query
   * @param filters An array of filter conditions in the format [key, comparison, value]
   * @param order An optional array containing the ordering key and direction ['key', 'direction']
   * @param limit An optional limit on the number of documents to return
   * @param offset An optional starting point for pagination
   * @param includeId Whether to include document IDs in the result
   */
  async getDocumentsFiltered(
    collection: string,
    filters: [string, string, any][] = [],
    order: [string, string] = ['', ''],
    limit?: number,
    offset?: any,
    includeId = false
  ): Promise<any[]> {
    // Define the collection to query
    const collectionRef: CollectionReference = this.firestore.collection(collection);

    // Initialize the query
    let query: any = collectionRef;

    // Apply filters to the query
    for (const filter of filters) {
      const [key, comparison, value] = filter;
      query = query.where(key, comparison, value);
    }

    // Apply ordering to the query if provided
    if (order[0] && order[1]) {
      const [key, direction] = order;
      query = query.orderBy(key, direction);
      
      if (offset !== null && offset !== undefined) {
        query = query.startAfter(offset);
      }
    }

    // Apply limit to the query if provided
    if (limit !== null && limit !== undefined) {
      query = query.limit(limit);
    }

    // Execute the query and get the documents
    const snapshot = await query.get();

    // Extract the data from the documents into an array
    const output: any = {};
    snapshot.forEach((doc: any) => {
      if (doc.exists) {
        const docId = doc.id;
        output[docId] = doc.data();
      }
    });

    return includeId ? output : Object.values(output);
  }
}