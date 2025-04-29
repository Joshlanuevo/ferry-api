import { v4 as uuidv4 } from 'uuid';
import { FirebaseCollections } from '../enums/FirebaseCollections';
import { TransactionTypes } from '../enums/TransactionTypes';
import admin from '../utils/firebase';

const db = admin.firestore();

interface RefundPayload {
  transactionId: string;
  userId: string;
  amount: number;
  currency: string;
  meta: Record<string, any>;
  agentId?: string;
  userName: string;
}

/**
 * Issues a refund for a transaction
 */
export async function issueRefund({
    transactionId,
    userId,
    amount,
    currency,
    meta,
    agentId,
    userName
  }: RefundPayload): Promise<boolean> {
    try {
      const now = new Date().toISOString();
      const refundTransactionId = `${transactionId}_refund`;
      
      // Create a positive amount for the refund (credited back to user)
      const refundAmount = Math.abs(amount);
      
      const refundTransaction = {
        userId,
        created_by: userId,
        user_name: userName,
        amount: refundAmount,
        base_amount: refundAmount,
        currency,
        type: TransactionTypes.refund,
        reference_no: uuidv4().slice(0, 8),
        transaction_id: refundTransactionId,
        timestamp: now,
        credit_type: 'wallet',
        meta,
        agent_id: agentId || null,
      };
      
      await db
        .collection(FirebaseCollections.user_balance_transactions)
        .doc(refundTransactionId)
        .set(refundTransaction);
        
      console.log('Info: Refund transaction created', {
        refundTransactionId,
        originalTransactionId: transactionId,
        refundAmount,
      });
        
      return true;
    } catch (error) {
      console.log('Error: Error issuing refund', {
        transactionId,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
}