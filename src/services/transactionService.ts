import { v4 as uuidv4 } from 'uuid';
import { FirebaseCollections } from '../enums/FirebaseCollections';
import { TransactionTypes } from '../enums/TransactionTypes';
import admin from '../utils/firebase';

const db = admin.firestore();

interface TransactionPayload {
    userId: string;
    amount: number;
    currency: string;
    type: TransactionTypes;
    createdBy: string;
    userName: string;
    meta?: Record<string, any>;
    agentId?: string;
}


export async function commitTransaction({
    userId,
    amount,
    currency,
    type,
    createdBy,
    userName,
    meta = {},
    agentId,
}: TransactionPayload): Promise<void> {
    const now = new Date().toISOString();
  
    const transactionDoc = {
      userId,
      created_by: createdBy,
      user_name: userName,
      amount: -Math.abs(amount), // ensuring it's negative
      base_amount: -Math.abs(amount),
      currency,
      type,
      reference_no: uuidv4().slice(0, 8),
      transaction_id: uuidv4(),
      timestamp: now,
      credit_type: 'wallet',
      meta,
      agent_id: agentId ?? null,
    };
  
    await db
      .collection(FirebaseCollections.user_balance_transactions)
      .doc(transactionDoc.transaction_id)
      .set(transactionDoc);
}

/**
 * Retrieves transaction data for a given transaction ID
 */
export async function getTransactionData(transactionId: string): Promise<any> {
  try {
    const transactionSnapshot = await db
      .collection(FirebaseCollections.user_balance_transactions)
      .doc(transactionId)
      .get();
    
    if (!transactionSnapshot.exists) {
      return null;
    }
    
    return transactionSnapshot.data();
  } catch (error) {
    console.error('Error getting transaction data', {
      transactionId,
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

/**
 * Removes a booking from the ferry_bookings collection
 */
export async function removeFromBookings(bookingId: string): Promise<boolean> {
  try {
    await db
      .collection(FirebaseCollections.ferry_bookings)
      .doc(bookingId)
      .delete();
    
    console.log('Booking removed from ferry_bookings', {
      bookingId
    });
    
    return true;
  } catch (error) {
    console.error('Error removing booking from ferry_bookings', {
      bookingId,
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}