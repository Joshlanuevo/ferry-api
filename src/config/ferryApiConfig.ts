import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URIS = {
    development: 'https://barkota-reseller-php-staging-4kl27j34za-uc.a.run.app',
    production: 'https://barkota-reseller-php-staging-4kl27j34za-uc.a.run.app', // Same siya sa development
};
  
const ENDPOINTS = {
    ferrySearch: '/outlet/voyage-accommodations/bylocation',
    computeCharges: '/outlet/compute-charges/passage',
    createFerryTicket: '/outlet/confirm-booking',
    searchTickets: '/outlet/search-ticket/searchbyreferenceanddate',
    voidTicket: '/outlet/ticket/void/ticket',
    getFerryPrintUrl: '/outlet/bt/search/transactionvoucherurl',
    ferryAuth: '/oauth',
};
  
export const getApiUrl = (key: keyof typeof ENDPOINTS): string => {
    const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
    const baseUri = API_BASE_URIS[env];
    const endpoint = ENDPOINTS[key];
    return `${baseUri}${endpoint}`;
};

export const getFerryCredentials = () => {
    const isProd = process.env.NODE_ENV === 'production';
    return {
        client_id: isProd ? process.env.FERRY_CLIENT_ID : process.env.FERRY_DEV_CLIENT_ID,
        client_secret: isProd ? process.env.FERRY_PW : process.env.FERRY_DEV_PW
    };
};