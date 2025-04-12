import { AgencyModel } from "../models/AgencyModel";
import { FirebaseLib } from "../lib/FirebaseLib";
import { isFullArray } from '../utils/helpers';

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
        
        if (isFullArray(data)) {
            return model;
        }
        
        return null;
        } catch (error) {
        console.error('Error getting agency:', error);
        return null;
        }
    }
}