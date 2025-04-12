import axios from 'axios';
import dotenv from 'dotenv';
import { FerrySearchRequest } from '../models/FerrySearch/FerrySearchRequest';
import { FerrySearchResponse } from '../models/FerrySearch/FerrySearchResponse';
import { getApiUrl } from '../config/ferryApiConfig';
import logger from '../utils/logger';

dotenv.config();

/**
 * Calls external Barkota API to fetch ferry search data
 */
export const fetchFerryData = async (
    request: FerrySearchRequest,
    token: string,
    trackingId: string,
): Promise<FerrySearchResponse> => {
    try {
        const url = getApiUrl('ferrySearch');
        const timeout = parseInt(process.env.API_TIMEOUT || '30000', 10);

        // Log external API request
        logger.info({
            message: 'API Request to Barkota',
            trackingId,
            method: 'POST',
            url,
        });

        const startTime = Date.now();

        const response = await axios({
            method: 'POST',
            url,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Request-ID': trackingId,
                'Authorization': `Bearer ${token}`,
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
          error: error instanceof Error ? error.message : String(error),
        });
    
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
    
          if (status === 401) {
            throw new Error('Authentication failed: Invalid or expired session.');
          } else if (status === 400) {
            throw new Error(`Bad request: ${JSON.stringify(error.response?.data)}`);
          }
        }
    
        throw error;
    }
};