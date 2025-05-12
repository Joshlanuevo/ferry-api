import { FirebaseCollections } from '../enums/FirebaseCollections';
import { UserTypes } from '../enums/UserTypes';
import { AccessControlService } from './accessControlService';
import { AgencyService } from './agencyService';
import { UserBalance } from '../models/UserBalance/UserBalance';
import { UserModel } from '../models/UserModel';
import admin from "../utils/firebase";

const accessControlService = new AccessControlService();
const agencyService = new AgencyService();

const db = admin.firestore();

export class UserBalanceService {

    private static async getUserInternal(userId: string): Promise<UserModel | null> {
        const userDoc = await db.collection(FirebaseCollections.users).doc(userId).get();
        if (!userDoc.exists) return null;

        const userData = userDoc.data() as UserModel;
        return {
            ...userData,
            userId: userDoc.id, // attach the document ID explicitly
            toJSON: () => ({
                ...userData,
                userId: userDoc.id,
            }),
        };
    }

    static async getUser(userId: string): Promise<UserModel | null> {
        try {
            return await this.getUserInternal(userId);
        } catch (error) {
            console.error('Error getting user data:', error);
            throw new Error('Failed to retrieve user data');
        }
    }
    
    static async getUserBalanceData(userId: string): Promise<UserBalance | null> {
        try {
            const user = await this.getUserInternal(userId);
            if (!user) return null;

            const walletId = await this.getEffectiveUserWalletId(user);
            const walletUser = await this.getUserInternal(walletId);
            if (!walletUser) return null;

            const balanceDoc = await db
                .collection(FirebaseCollections.user_balance)
                .doc(walletId)
                .get();

            const data = balanceDoc.data() as UserBalance | undefined;
            const currency = walletUser.currency ?? 'PHP';
            const totalAmount = typeof data?.total === 'object' ? data.total.amount : data?.total ?? 0;

            return {
                userId: walletId,
                total: { amount: totalAmount, currency },
                count: data?.count ?? 0,
                last5: data?.last5 ?? [],
                currency,
            };
        } catch (error) {
            throw new Error('Failed to retrieve user balance data');
        }
    }

    private static async getEffectiveUserWalletId(user: UserModel): Promise<string> {
        try {
            const accessLevel = await accessControlService.getAccessControl(user.access_level);
    
            if (
                user.type === UserTypes.SUBAGENT &&
                accessLevel?.isSharedWallet === true
            ) {
                const userIdLower = user.id.toLowerCase();
                const agencyIdLower = user.agency_id?.toLowerCase() || '';
    
                if (userIdLower.includes('admin') || agencyIdLower.includes('admin')) {
                    return user.id;
                }
    
                if (user.id === user.agency_id) {
                    const parentAgency = await agencyService.getAgency(user.agency_id);
                    if (!parentAgency || !parentAgency.masteragentId) {
                        throw new Error("Invalid parent partner");
                    }
    
                    const parentUser = await this.getUserInternal(parentAgency.masteragentId);
                    if (!parentUser) {
                        throw new Error("Invalid parent company");
                    }
    
                    return parentUser.id;
                } else {
                    const parentUser = await this.getUserInternal(user.userId);
                    if (!parentUser) {
                        throw new Error("Invalid parent company");
                    }
    
                    return parentUser.id;
                }
            }
    
            return user.id;
        } catch (error) {
            console.error('Error resolving wallet ID:', error);
            throw new Error('Failed to resolve wallet ID');
        }
    }
}