import { FirebaseLib } from "../lib/FirebaseLib";
import { FirebaseCollections } from "../enums/FirebaseCollections";
import { MeiliWrapper } from "../utils/meiliSearchWrapper";
import { isFullArray } from '../utils/helpers';

/**
 * Helper function to get a value from an object by key
 */
function getValue(obj: any, key: string): any {
    if (!obj) return null;
    return obj[key] || null;
}

/**
 * Write documents to Meilisearch
 */
async function writeToMeili(
    index: FirebaseCollections, 
    document: any[], 
    isMultiple = false, 
    key?: string
  ): Promise<any> {
    const client = new MeiliWrapper();
    client.setIndex(index);
    const documents = isMultiple ? document : [document];
    return await client.updateDocuments(documents, key);
  }
  
/**
 * Hydrate transactions from Firebase to Meilisearch
 */
export async function hydrateTransactions(
    collection: FirebaseCollections,
    key = "transaction_id",
    sortBy = "timestamp",
    limit = 250,
    transformer?: (item: any) => any
): Promise<any[]> {
    let offset: any = null;
    const firebase = new FirebaseLib();
    const output: any[] = [];
    
    try {
      do {
        // Log the current batch fetch
        console.log(`Fetching batch from ${collection} with offset ${offset}`, {
          collection,
          offset,
          limit
        });
  
        // Get documents from Firebase with pagination
        const result = await firebase.getDocumentsFiltered(
          collection,
          [], // No filters
          [sortBy, "desc"], // Order by sortBy desc
          limit,
          offset
        );
  
        // Break if no results
        if (!isFullArray(result)) {
          console.log('No more documents to process', {
            collection
          });
          break;
        }
  
        // Apply transformer if provided
        let processedResults = result;
        if (typeof transformer === 'function') {
          processedResults = result.map(transformer);
        }
  
        // Get the last item for pagination
        const lastItem = processedResults[processedResults.length - 1];
        const lastTimestamp = getValue(lastItem, sortBy);
  
        // Break if no timestamp or if we're at the same offset (no progress)
        if (!lastTimestamp || (offset !== null && lastTimestamp === offset)) {
          console.log('Reached end of pagination or duplicate timestamp', {
            collection,
            lastTimestamp
          });
          break;
        }
  
        // Update offset for next iteration
        offset = lastTimestamp;
  
        // Write to Meilisearch
        console.log(`Writing ${processedResults.length} documents to Meilisearch`, {
          collection,
          count: processedResults.length
        });
        
        const writeResult = await writeToMeili(collection, processedResults, true, key);
        output.push(writeResult);
  
        // Sleep for 1 second to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } while (true);
  
      console.log('Transaction hydration completed successfully', {
        collection,
        batches: output.length
      });
  
      return output;
    } catch (error) {
      console.error('Error during transaction hydration', {
        collection,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
}