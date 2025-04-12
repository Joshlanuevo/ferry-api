import axios from 'axios';
import bcryptUtil from "../utils/bcrypt";
import jwtUtil from "../utils/jwt";
import dotenv from "dotenv";
import { UserData } from "../models/UserData/userData";
import { UserModel } from "../models/UserModel";
import { FerryAuthRequest } from '../models/FerryAuth/FerryAuthRequest';
import { FerryAuthResponse } from '../models/FerryAuth/FerryAuthResponse';
import { getApiUrl } from "../config/ferryApiConfig";
import { getValue } from "../utils/helpers";
import admin from "../utils/firebase";

dotenv.config();

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
            const ferryAuthUrl = getApiUrl('ferryAuth');
            const requestModel = new FerryAuthRequest();

            console.log(`Requesting auth token from ${ferryAuthUrl}`);
            console.log("Using client_id:", requestModel.client_id);
            console.log("Using client_secret:", requestModel.client_secret ? '*****' : 'Not Set');
            console.log("Auth request payload:", JSON.stringify(requestModel.toJSON(), null, 2));
            console.log("Auth endpoint:", ferryAuthUrl);
            
            const result = await axios.post(ferryAuthUrl, requestModel.toJSON(), {
                headers: { 'Content-Type': 'application/json' },
                timeout: API_TIMEOUT,
            });       

            console.log("Full auth response:", JSON.stringify(result.data));

            // Check if result.data has error_message (similar to PHP implementation)
            if (getValue(result, "error_message")) {
                throw new Error(result.data.error_message);
            }

            // Check if response body is valid (similar to PHP implementation)
            if (!result.data) {
                throw new Error("Invalid response from Third Party API");
            }

            // Check for error status (similar to PHP implementation)
            if (getValue(result.data, "status")) {
                throw new Error(this.formatErrorMessage(result.data));
            }

            const response = new FerryAuthResponse(result.data);
            if (!response.access_token) {
                throw new Error(`Error: No access token found in response: ${JSON.stringify(result.data)}`);
            }

            await this.storeToken(response.access_token, response.expires_in || 3600);
            return response.access_token;
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
        console.log("Raw user data from Firestore:", user[0]);
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

    /**
     * Format error messages similar to the PHP implementation
     */
    private formatErrorMessage(errorModel: any): string {
        let errorMsg = `Error: ${errorModel.title} - ${errorModel.detail}`;
        return errorMsg.includes('sensitive') || errorMsg.includes('internal')
            ? "Please contact support@pinoyonlinebiz.com for assistance."
            : errorMsg;
    }
}

export default new AuthService();