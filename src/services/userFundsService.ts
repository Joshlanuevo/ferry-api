import { FundsOnHold } from "../models/FundsOnHold/FundsOnHold";
import { FirebaseCollections } from "../enums/FirebaseCollections";
import admin from "../utils/firebase";

const db = admin.firestore();

/**
 * Gets the total amount of funds on hold for a user
 * Matches the PHP implementation logic
 * 
 * @param userId User ID
 * @param currency Currency
 * @param trackingId Tracking ID for logging
 * @returns Total amount on hold
 */
async function getUserFundsOnHold(
    userId: string,
    currency: string,
): Promise<number> {
    try {        
        // Query funds on hold from the database - match PHP implementation fields
        const fundsOnHoldSnapshot = await db
            .collection(FirebaseCollections.user_funds_on_hold)
            .where('userId', '==', userId)
            .where('currency', '==', currency)
            .where('status', '==', 'active')  // Only consider active holds
            .get();
        
        // Sum up all the on-hold amounts
        let totalOnHold = 0;
        fundsOnHoldSnapshot.forEach(doc => {
            const data = doc.data();
            // Make sure we're handling the amount field correctly
            if (data.amount) {
                if (typeof data.amount === 'number') {
                    totalOnHold += data.amount;
                } else if (typeof data.amount === 'object' && data.amount.amount) {
                    // Handle case where amount might be an object like { amount: number, currency: string }
                    totalOnHold += Number(data.amount.amount);
                }
            }
        });
        
        console.log(`[getUserFundsOnHold] Total on-hold for user ${userId}: ${totalOnHold} ${currency}`);
        
        return totalOnHold;
    } catch (error) {
        console.error(`[getUserFundsOnHold] Error fetching on-hold funds for user ${userId}:`, error);
        // In case of error, return 0 to allow transaction to proceed
        return 0;
    }
}

/**
 * Checks if the user has sufficient balance considering funds on hold
 * Closely matches PHP implementation
 * 
 * @param userId User ID
 * @param nextBalance Balance after the transaction
 * @param isExitOnError Whether to return an error response or false on failure
 * @returns true if sufficient balance, false/error response otherwise
 */
export async function checkSufficientOnHoldBalance(
    userId: string,
    nextBalance: { amount: number, currency: string },
    isExitOnError: boolean = true
): Promise<boolean | Record<string, any>> {
    console.log(`[checkSufficientOnHoldBalance] Next Balance: ${nextBalance.amount}, Currency: ${nextBalance.currency}`);
    
    try {
        // Get on-hold funds - exactly matching PHP implementation
        const fundsOnHold = await getUserFundsOnHold(userId, nextBalance.currency);
        
        // Check if there are funds on hold
        if (fundsOnHold > 0) {
            // Deduct funds on hold from next balance
            const balanceAfterHold = nextBalance.amount - fundsOnHold;
            
            console.log(`[checkSufficientOnHoldBalance] Funds on hold: ${fundsOnHold} ${nextBalance.currency}`);
            console.log(`[checkSufficientOnHoldBalance] Balance after hold: ${balanceAfterHold} ${nextBalance.currency}`);
            
            // Check if balance is sufficient after deducting funds on hold
            if (balanceAfterHold < 0) {
                console.log(`[checkSufficientOnHoldBalance] Insufficient balance for user ${userId} after deducting on-hold funds`);
                
                if (isExitOnError) {
                    // Match PHP API_RESPONSE format
                    return {
                        error: `Not enough credits for this transaction because ${fundsOnHold} ${nextBalance.currency} is still on hold.`,
                        status: false,
                        code: 402,
                    };
                }
                
                return false;
            }
        }
        
        console.log(`[checkSufficientOnHoldBalance] User ${userId} has sufficient balance`);
        return true;
    } catch (error) {
        console.error(`[checkSufficientOnHoldBalance] Error checking balance:`, error);
        
        if (isExitOnError) {
            // Match PHP API_RESPONSE format for errors
            return {
                error: "Error checking balance availability",
                status: false,
                code: 500,
            };
        }
        
        return false;
    }
}