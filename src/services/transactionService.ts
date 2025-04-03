import admin from "../utils/firebase";
import logger from "../utils/logger";

const db = admin.firestore();

/**
 * Get transaction data by ID
 */
export const getTransactionData = async (
    transactionId: string,
    trackingId: string,
  ): Promise<any> => {
    try {
      logger.info({
        message: 'Attempting to retrieve transaction',
        trackingId,
        transactionId,
        collection: 'user_balance_transactions'
      });
      
      // Make sure this is the correct collection path
      const transactionDoc = await db
        .collection('user_balance_transactions')
        .doc(transactionId)
        .get();
  
      logger.info({
        message: 'Transaction document exists?',
        trackingId,
        exists: transactionDoc.exists,
        transactionId
      });
  
      if (!transactionDoc.exists) {
        throw new Error('Transaction not found');
      }
  
      return transactionDoc.data();
    } catch (error) {
      logger.error({
        message: 'Get transaction failed',
        trackingId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
};

/**
 * Issue a refund for a transaction
 */
export const issueRefund = async (
    transactionId: string,
    userId: string | null,
    agentId: string | null,
    trackingId: string,
  ): Promise<boolean> => {
    try {
        if (userId === null) {
            throw new Error('User ID is required for refund');
        }
        // Check if admin (simplified version)
        const isAdmin = await checkIfUserIsAdmin(userId);
        if (isAdmin) {
            return true;
        }
  
        // Get transaction data
        const transactionData = await getTransactionData(transactionId, trackingId);
        if (!transactionData) {
            return false;
        }
  
        // Create refund transaction
        const refundData = {
            userId: transactionData.userId,
            created_by: userId,
            user_name: transactionData.user_name, // Assuming this exists in the original transaction
            base_amount: Math.abs(transactionData.amount), // Making sure it's positive
            amount: Math.abs(transactionData.amount),
            timestamp: new Date().toISOString(),
            transaction_id: `${transactionId}_refund`,
            type: 'refund',
            reference_no: generateReferenceNumber(),
            meta: transactionData.meta,
            agent_id: agentId,
            currency: transactionData.currency || 'PHP',
        };
  
        // Add refund transaction to database
        await db
            .collection('user_balance_transactions')
            .doc(refundData.transaction_id)
            .set(refundData);

        return true;
    } catch (error) {
        logger.error({
            message: 'Issue refund failed',
            trackingId,
            error: error instanceof Error ? error.message : String(error),
        });
        return false;
    }
};

export const saveTransaction = async (
    transactionData: any,
    trackingId: string
  ): Promise<boolean> => {
    try {
      await db
        .collection('user_balance_transactions')
        .doc(transactionData.transaction_id)
        .set(transactionData);
      
      logger.info({
        message: 'Transaction saved to Firestore',
        trackingId,
        transactionId: transactionData.transaction_id,
        collection: 'user_balance_transactions'
      });
      
      return true;
    } catch (error) {
      logger.error({
        message: 'Save transaction failed',
        trackingId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
};

/**
 * Check if user is admin
 */
const checkIfUserIsAdmin = async (userId: string): Promise<boolean> => {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
        return false;
        }
        
        const userData = userDoc.data();
        return userData?.type === 'ADMIN' || userData?.type === 'SUPERADMIN';
    } catch (error) {
        return false;
    }
};    

/**
 * Generate a random reference number
 */
const generateReferenceNumber = (): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

/**
 * Remove bookings from user's booking list
 */
export const removeFromBookings = async (
    bookingId: string,
  ): Promise<boolean> => {
    try {
        await db
            .collection('ferry_bookings')
            .doc(bookingId)
            .delete();
        return true;
    } catch (error) {
        logger.error({
          message: 'Failed to remove booking from ferry_bookings',
          error: error instanceof Error ? error.message : String(error),
          bookingId,
    });
        return false;
    }
};