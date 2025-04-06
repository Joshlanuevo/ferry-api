export interface UserBalanceTransaction {
    userId: string;
    amount: number;
    currency: string;
    type: string;
    transactionId: string;
    referenceNo: string;
    timestamp: string;
    createdBy: string;
    userName?: string;
    creditType?: 'wallet' | 'manual';
    meta?: Record<string, any>;
}