import { AccessControl } from '../models/AccessControl';
import { FirebaseLib } from '../lib/FirebaseLib';
import { FirebaseCollections } from '../enums/FirebaseCollections';

export class AccessControlService {
    private firebase: FirebaseLib;
  
    constructor() {
      this.firebase = new FirebaseLib();
    }
  
    /**
     * Get access control by ID
     * @param id The ID of the access control to retrieve
     * @returns AccessControl object or null if not found
     */
    async getAccessControl(id?: string): Promise<AccessControl | null> {
      if (!id) {
        return null;
      }
      
      try {
        // Fetch the data directly from Firestore
        const accessData = await this.getAccessControlData(id);
        
        if (!this.isFullArray(accessData)) {
          return null;
        }
        
        return new AccessControl(accessData);
      } catch (error) {
        console.error('Error getting access control:', error);
        return null;
      }
    }
  
    /**
     * Get access control data from Firestore
     * @param docID The document ID to retrieve
     * @returns Access control data or empty object if not found
     */
    private async getAccessControlData(docID: string): Promise<Record<string, any>> {
      try {
        const data = await this.firebase.getData(
          FirebaseCollections.ACCESS_LEVELS, 
          docID
        );
        
        return data || {};
      } catch (error) {
        console.error('Error getting access control data:', error);
        return {};
      }
    }
  
    /**
     * Check if value is a non-empty array or object
     * @param value The value to check
     * @returns Boolean indicating if the value is a "full" array or object
     */
    private isFullArray(value: any): boolean {
      if (!value) return false;
      
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      
      if (typeof value === 'object') {
        return Object.keys(value).length > 0;
      }
      
      return false;
    }
}