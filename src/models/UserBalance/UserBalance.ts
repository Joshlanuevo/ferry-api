export interface UserBalance {
    userId: string;
    total: CurrencyInstance;
    currency: string;
    count: number;
    last5: { amount: number; desc: string }[];
}

interface CurrencyInstance {
    amount: number;
    currency: string;
}