import { BasicUserModel } from './../models/BasicUserModel';
import admin from "../utils/firebase";
import { AccessControlService } from './accessControlService';
import { AgencyService } from './agencyService';
import { UserModel } from '../models/UserModel';

const accessControlService = new AccessControlService();
const agencyService = new AgencyService();

const db = admin.firestore();

export class UserBalanceService {

    private static async getUserInternal(userId: string): Promise<UserModel | null> {
        const userDoc = await db.collection('users').doc(userId).get();
        return userDoc.exists ? (userDoc.data() as UserModel) : null;
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
            if (!user || user.access_level === 'admin') {
                return null;
            }
    
            const walletId = await this.getEffectiveUserWalletId(user);
            const balanceDoc = await db.collection('user_balance').doc(walletId).get();
            
            if (!balanceDoc.exists) {
                return {
                    userId: walletId,
                    total: 0,
                    count: 0,
                    last5: [],
                    currency: 'PHP',
                } as UserBalance;
            }
    
            return balanceDoc.data() as UserBalance;    
        } catch (error) {
            console.error('Error getting user balance data:', error);
            throw new Error('Failed to retrieve user balance data');
        }
    };

    private static async getEffectiveUserWalletId(user: BasicUserModel): Promise<string> {
        try {
            const accessLevel = await accessControlService.getAccessControl(user.access_level);
    
            if (
                user.type === 'SUBAGENT' &&
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