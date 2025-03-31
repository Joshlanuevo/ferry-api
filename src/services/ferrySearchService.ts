import axios from 'axios';
import { FerrySearchRequest } from '../models/FerrySearch/FerrySearchRequest';
import { FerrySearchResponse } from '../models/FerrySearch/FerrySearchResponse';
import logger from '../utils/logger';

const API_CONFIG = {
    development: {
      baseUri: 'https://barkota-reseller-php-staging-4kl27j34za-uc.a.run.app',
      endpoint: '/outlet/voyage-accommodations/bylocation'
    },
    production: {
      baseUri: 'https://barkota-reseller-php-staging-4kl27j34za-uc.a.run.app',
      endpoint: '/outlet/voyage-accommodations/bylocation'
    }
};

/**
 * Calls external Barkota API to fetch ferry search data
 */
export const fetchFerryData = async (
    request: FerrySearchRequest,
    token: string,
    trackingId: string,
): Promise<FerrySearchResponse> => {
    try {
        const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
        const { baseUri, endpoint } = API_CONFIG[env];
        const url = `${baseUri}${endpoint}`;
        const timeout = parseInt(process.env.API_TIMEOUT || '30000', 10);

        // Log external API request
        logger.info({
            message: `API Request: ${url}`,
            trackingId,
            method: 'POST',
            url
        });

        const startTime = Date.now();

        const response = await axios({
            method: 'POST',
            url,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'X-Request-ID': trackingId,
            },
            data: request,
            timeout,
        });

        const responseTime = Date.now() - startTime;
        
        // Log response
        logger.info({
            message: `API Response: ${url}`,
            trackingId,
            statusCode: response.status,
            responseTime: `${responseTime}ms`,
        });

        // Handle API error messages
        if (response.data && response.data.error_message) {
            throw new Error(response.data.error_message);
        }

        const responseData = response.data;

        // Validate response format
        if (!Array.isArray(responseData)) {
            throw new Error("Invalid response format from Barkota API. Expected an array.");
        }

        return {
            data: responseData,
            meta: {
                totalResults: responseData.length,
                requestTimestamp: new Date().toISOString(),
                trackingId,
            }
        };
    } catch (error) {
        logger.error({
            message: 'API request failed',
            trackingId,
            error: error instanceof Error ? error.message : String(error)
        });
        
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            
            if (status === 401) {
                throw new Error('Authentication failed: Invalid or expired token');
            } else if (status === 400) {
                throw new Error(`Bad request: ${JSON.stringify(error.response?.data)}`);
            }
        }
        throw error;
    }
};