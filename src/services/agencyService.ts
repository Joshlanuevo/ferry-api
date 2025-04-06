import { AgencyModel } from "../models/AgencyModel";
import { FirebaseLib } from "../lib/FirebaseLib";

export class AgencyService {
    private firebase: FirebaseLib;

    constructor() {
        this.firebase = new FirebaseLib();
    }
    
      /**
   * Get agency by ID
   * @param agencyId The ID of the agency to retrieve
   * @returns AgencyModel object or null if not found
   */
    async getAgency(agencyId?: string): Promise<AgencyModel | null> {
        if (!agencyId) {
        return null;
        }
    
        try {
        const model = new AgencyModel();
        model.id = agencyId;
        
        const data = await model.get();
        
        if (this.isFullArray(data)) {
            return model;
        }
        
        return null;
        } catch (error) {
        console.error('Error getting agency:', error);
        return null;
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