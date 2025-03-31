import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const serviceAccounts: Record<string, admin.ServiceAccount> = {
    development: {
        projectId: process.env.DEV_FIREBASE_PROJECT_ID,
        privateKey: process.env.DEV_FIREBASE_PRIVATE_KEY,
        clientEmail: process.env.DEV_FIREBASE_CLIENT_EMAIL
    },
    production: {
        projectId: process.env.PROD_FIREBASE_PROJECT_ID,
        privateKey: process.env.PROD_FIREBASE_PRIVATE_KEY,
        clientEmail: process.env.PROD_FIREBASE_CLIENT_EMAIL
    },
};

export default serviceAccounts;