import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import serviceAccounts from '../config/db';

dotenv.config();

const env = process.env.NODE_ENV || "development";
const serviceAccount = serviceAccounts[env];

if (!serviceAccount || !serviceAccount.privateKey) {
    throw new Error(`Missing Firebase service account configuration for environment: ${env}`);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

export default admin;