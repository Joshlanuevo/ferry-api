import axios from 'axios';
import bcryptUtil from "../utils/bcrypt";
import jwtUtil from "../utils/jwt";
import dotenv from "dotenv";
import { UserData } from "../models/UserData/userData";
import { UserModel } from "../models/UserModel";
import admin from "../utils/firebase";

dotenv.config();

const BASE_URI = process.env.NODE_ENV === 'production' 
    ? 'https://barkota-reseller-php-staging-4kl27j34za-uc.a.run.app' 
    : 'https://barkota-reseller-php-staging-4kl27j34za-uc.a.run.app';

const ENDPOINT = process.env.NODE_ENV === 'production' 
    ? process.env.FERRY_ENDPOINT_LIVE || '/oauth' 
    : process.env.FERRY_ENDPOINT_DEV || '/oauth';

const db = admin.firestore();
const FERRY_AUTH_COLLECTION = 'ferryAuthTokens';
const TOKEN_DOC_ID = 'currentToken';
const API_TIMEOUT = parseInt(process.env.API_TIMEOUT || '30000', 10);

class AuthService {
    /**
     * Request a new authentication token from the external API
     */
    async requestToken(): Promise<string> {
        try {
            console.log(`Requesting auth token from ${BASE_URI}${ENDPOINT}`);

            const requestBody = {
                grant_type: 'client_credentials',
                client_id: process.env.FERRY_CLIENT_ID,
                client_secret: process.env.FERRY_PW
            };

            console.log("FERRY_CLIENT_ID:", process.env.FERRY_CLIENT_ID);
            console.log("FERRY_PW:", process.env.FERRY_PW);

            console.log("Auth request payload:", JSON.stringify(requestBody, null, 2));
            console.log("Auth endpoint:", BASE_URI + ENDPOINT);
            
            const response = await axios.post(`${BASE_URI}${ENDPOINT}`, requestBody, {
                headers: { 'Content-Type': 'application/json' },
                timeout: API_TIMEOUT,
            });            

            console.log("Full auth response:", JSON.stringify(response.data));

            // Check if response.data has error_message
            if (response.data.error_message) {
                throw new Error(response.data.error_message);
            }
            // Direct access to the access_token in the response
            const accessToken = response.data.access_token;
            if (!accessToken) {
                throw new Error(`Error: No access token found in response: ${JSON.stringify(response.data)}`);
            }

            await this.storeToken(accessToken, response.data.expires_in || 3600);
            return accessToken;
        } catch (error) {
            // Improved error handling
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const errorData = error.response?.data;
                
                console.error('Ferry auth request failed:', {
                    status,
                    data: errorData,
                    message: error.message
                });
                
                // More specific error messages based on response
                if (status === 400 && errorData?.detail) {
                    throw new Error(`Authentication error: ${errorData.detail}`);
                } else if (status === 401) {
                    throw new Error('Invalid credentials provided for ferry API');
                }
            }
            
            console.error('Ferry auth request failed:', error);
            throw error;
        }
    }

    /**
     * Store token in Firestore with expiration
     */
    private async storeToken(token: string, expiresIn: number): Promise<void> {
        try {
            const expiresAt = new Date(Date.now() + (expiresIn - 300) * 1000); // 5-minute buffer
            await db.collection(FERRY_AUTH_COLLECTION).doc(TOKEN_DOC_ID).set({
                token,
                expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
                createdAt: admin.firestore.Timestamp.now()
            });
        } catch (error) {
            console.error('Error storing token:', error);
            throw error;
        }
    }

    /**
     * Get a valid token, either from cache or by requesting a new one
     */
    async getToken(): Promise<string> {
        try {
            const tokenDoc = await db.collection(FERRY_AUTH_COLLECTION).doc(TOKEN_DOC_ID).get();
            
            if (tokenDoc.exists) {
                const { token, expiresAt } = tokenDoc.data() || {};
                if (token && expiresAt?.toDate() > new Date()) {
                    console.log('Using cached ferry auth token');
                    return token;
                }
            }
            
            console.log('Requesting new ferry auth token');
            return await this.requestToken();
        } catch (error) {
            console.error('Error getting ferry auth token:', error);
            throw new Error('Failed to get authentication token for ferry API');
        }
    }

    async validateUser(email: string, password: string): Promise<UserModel | null> {
        const user = await this.getUserByEmail(email);
        if (!user || user.length === 0) return null;
        return (await bcryptUtil.compareData(password, user[0].bcryptPassword)) ? new UserModel(user[0]) : null;
    }

    async updateUserPassword(userId: string, password: string): Promise<boolean> {
        try {
            const hashedPassword = await bcryptUtil.hashData(password);
            await db.collection('users').doc(userId).update({ bcryptPassword: hashedPassword });
            return true;
        } catch (error) {
            console.error('Error updating user password:', error);
            return false;
        }
    }

    generateAuthToken(userData: UserData): string {
        if (!userData) throw new Error('User data is required to generate token.');
        return jwtUtil.generateToken({
            userId: userData.id || '',
            status: userData.status || '',
            role: userData.type || '',
            agency_id: userData.agency_id || '',
            country_name: userData.country_name || '',
            region_name: userData.region_name || '',
            currency: userData.currency || '',
        });
    }

    private async getUserByEmail(email: string) {
        try {
            const usersRef = db.collection('users');
            const querySnapshot = await usersRef.where('email', '==', email).get();
            return querySnapshot.empty ? null : querySnapshot.docs.map(doc => doc.data());
        } catch (error) {
            console.error('Error getting user by email:', error);
            return null;
        }
    }

    private formatErrorMessage(errorModel: any): string {
        let errorMsg = `Error: ${errorModel.title} - ${errorModel.detail}`;
        return errorMsg.includes('sensitive') || errorMsg.includes('internal')
            ? "Please contact support@pinoyonlinebiz.com for assistance."
            : errorMsg;
    }
}

export default new AuthService();