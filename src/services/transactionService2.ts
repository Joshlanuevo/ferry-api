import admin from '../utils/firebase';
import { UserBalanceTransaction } from '../models/UserBalanceTransactions/UserBalanceTransactions';
import { v4 as uuidv4 } from 'uuid';
import { TransactionTypes } from '../enums/TransactionTypes';

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
      amount: -Math.abs(amount), // 💸 ensuring it's negative
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
      .collection('user_balance_transactions')
      .doc(transactionDoc.transaction_id)
      .set(transactionDoc);
}