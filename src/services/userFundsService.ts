import { FundsOnHold } from "../models/FundsOnHold/FundsOnHold";
import { FirebaseCollections } from "../enums/FirebaseCollections";
import admin from "../utils/firebase";

const db = admin.firestore();

/**
 * Retrieves the total amount of funds on hold for a specific user and currency
 * @param userId - The user ID to check
 * @param currency - The currency to filter by
 * @param trackingId - Optional tracking ID for logging
 * @returns The total amount of funds on hold
 * @throws Error if userId is not provided or if there's a Firestore error
 */
export async function getUserFundsOnHold(
    userId: string, 
    currency: string,
): Promise<number> {
    if (!userId) {
      throw new Error("User ID is required to get funds on hold.");
    }
    
    try {
      const snapshot = await db
        .collection(FirebaseCollections.user_funds_on_hold)
        .where('userId', '==', userId)
        .get();
      
      if (snapshot.empty) {
        return 0;
      }
      
      // Aggregate all on-hold amounts
      let totalOnHold = 0;
      snapshot.forEach(doc => {
        const data = doc.data() as FundsOnHold;
        if (data.currency === currency) {
          totalOnHold += Number(data.amount);
        }
      });
      
      return totalOnHold;
    } catch (error) {
      console.log('Error retrieving user funds on hold', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
    
}
  
  /**
   * Checks if the user has sufficient balance considering both available funds and on-hold funds
   * @param userId - The user ID to check
   * @param currentBalance - The user's current available balance
   * @param pendingDebit - The amount that will be debited
   * @param currency - The currency to check
   * @param trackingId - Optional tracking ID for logging
   * @returns True if the user has sufficient balance, false otherwise
   * @throws Error if there's an error checking the balance
   */
export async function checkSufficientOnHoldBalance(
    userId: string,
    currentBalance: number,
    pendingDebit: number,
    currency: string,
): Promise<boolean> {
    try {
      // Get funds on hold
      const fundsOnHold = await getUserFundsOnHold(userId, currency);
      
      if (fundsOnHold > 0) {
        // Calculate next balance after pending transaction and on-hold funds
        const nextBalance = currentBalance - pendingDebit - fundsOnHold;
        
        if (nextBalance < 0) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.log('Error checking sufficient on-hold balance', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
};